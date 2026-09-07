param(
  [string]$BaseUrl = 'https://icharles.pages.dev',
  [string]$Label = 'CURRENT',
  [switch]$Deep,
  [switch]$NoOpen
)

$ErrorActionPreference='Stop'

function Safe-Name([string]$Value){
  return (($Value -replace '^https?://','') -replace '[^A-Za-z0-9._-]+','_').Trim('_')
}

function Find-Edge {
  $candidates=@()
  $cmd=Get-Command 'msedge.exe' -ErrorAction SilentlyContinue
  if($cmd){$candidates += $cmd.Source}

  if($env:ProgramFiles){
    $candidates += (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe')
  }

  $pf86=${env:ProgramFiles(x86)}
  if($pf86){
    $candidates += (Join-Path $pf86 'Microsoft\Edge\Application\msedge.exe')
  }

  if($env:LOCALAPPDATA){
    $candidates += (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe')
  }

  foreach($candidate in ($candidates | Select-Object -Unique)){
    if($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)){
      return $candidate
    }
  }

  throw 'Microsoft Edge was not found. Install Edge or make msedge.exe available in PATH.'
}

function Invoke-EdgeCapture {
  param(
    [string]$Edge,
    [string]$Url,
    [int]$Width,
    [int]$Height,
    [string]$OutputFile,
    [string]$ProfileDir
  )

  $args=@(
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--force-prefers-reduced-motion',
    '--force-device-scale-factor=1',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=2600',
    "--window-size=$Width,$Height",
    "--screenshot=$OutputFile",
    "--user-data-dir=$ProfileDir",
    $Url
  )

  $proc=Start-Process -FilePath $Edge -ArgumentList $args -Wait -PassThru -WindowStyle Hidden
  if($proc.ExitCode -ne 0){
    throw "Edge screenshot failed with exit code $($proc.ExitCode): $Url"
  }
  if(!(Test-Path -LiteralPath $OutputFile -PathType Leaf)){
    throw "Edge did not create screenshot: $OutputFile"
  }
  $size=(Get-Item -LiteralPath $OutputFile).Length
  if($size -lt 5000){
    throw "Screenshot looks invalid/tiny ($size bytes): $OutputFile"
  }
}

$edge=Find-Edge
$BaseUrl=$BaseUrl.TrimEnd('/')
$downloads=Join-Path $env:USERPROFILE 'Downloads'
if(!(Test-Path -LiteralPath $downloads)){New-Item -ItemType Directory -Force -Path $downloads|Out-Null}

$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$labelSafe=Safe-Name $Label
$work=Join-Path $env:TEMP ("iCharlesVisualQA_"+[guid]::NewGuid().ToString('N'))
$shots=Join-Path $work 'screenshots'
$profiles=Join-Path $work 'edge-profiles'
New-Item -ItemType Directory -Force -Path $shots,$profiles|Out-Null

$mainRoutes=@(
  @{Name='home';Path='/'},
  @{Name='try-apps';Path='/try/'},
  @{Name='work';Path='/portfolio/'},
  @{Name='services';Path='/services/'},
  @{Name='website-studio';Path='/website-studio/'},
  @{Name='about';Path='/about/'},
  @{Name='contact';Path='/contact/'}
)

$supportRoutes=@(
  @{Name='privacy';Path='/privacy/'},
  @{Name='trade-core';Path='/portfolio/projects/trade-core.html'},
  @{Name='custom-business';Path='/portfolio/projects/trade-core-custom-business.html'},
  @{Name='morsebound';Path='/portfolio/projects/morsebound.html'},
  @{Name='ette-planner';Path='/portfolio/projects/ette-planner.html'},
  @{Name='website-request-sent';Path='/website-request-sent/'},
  @{Name='project-inquiry-sent';Path='/project-inquiry-sent/'}
)

$viewports=@(
  @{Name='desktop-1440';Width=1440;Height=1000},
  @{Name='split-1024';Width=1024;Height=900},
  @{Name='phone-390';Width=390;Height=844}
)
$desktopOnly=@(@{Name='desktop-1440';Width=1440;Height=1000})
$themes=@('dark','light')
$captures=New-Object System.Collections.Generic.List[object]
$failures=New-Object System.Collections.Generic.List[string]

function Capture-Set {
  param([array]$Routes,[array]$ViewportSet,[string]$Group)

  foreach($route in $Routes){
    foreach($theme in $themes){
      foreach($vp in $ViewportSet){
        $fileName="$($route.Name)__${theme}__$($vp.Name).png"
        $out=Join-Path $shots $fileName
        $cacheBust=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $joiner=if($route.Path.Contains('?')){'&'}else{'?'}
        $url="$BaseUrl$($route.Path)$joiner"+"vqa-theme=$theme&vqa-capture=1&vqa-build=$cacheBust"
        $profile=Join-Path $profiles ([guid]::NewGuid().ToString('N'))

        Write-Host ("CAPTURE {0,-20} {1,-5} {2,-13} -> {3}" -f $route.Name,$theme,$vp.Name,$fileName) -ForegroundColor DarkCyan

        $ok=$false
        $errorText=$null
        for($attempt=1;$attempt -le 2 -and !$ok;$attempt++){
          try{
            New-Item -ItemType Directory -Force -Path $profile|Out-Null
            Invoke-EdgeCapture -Edge $edge -Url $url -Width $vp.Width -Height $vp.Height -OutputFile $out -ProfileDir $profile
            $ok=$true
          }catch{
            $errorText=$_.Exception.Message
            if($attempt -lt 2){Start-Sleep -Milliseconds 650}
          }finally{
            Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue
          }
        }

        if($ok){
          $captures.Add([pscustomobject]@{
            group=$Group;route=$route.Name;path=$route.Path;theme=$theme;viewport=$vp.Name
            width=$vp.Width;height=$vp.Height;file=$fileName
            bytes=(Get-Item -LiteralPath $out).Length;url=$url
          })
        }else{
          $msg="$($route.Name) / $theme / $($vp.Name): $errorText"
          $failures.Add($msg)
          Write-Warning $msg
        }
      }
    }
  }
}

try{
  Write-Host "`n=== ICHARLES AUTOMATED VISUAL QA CAPTURE ===" -ForegroundColor Cyan
  Write-Host "Edge: $edge"
  Write-Host "Target: $BaseUrl"
  Write-Host "Mode: $(if($Deep){'DEEP'}else{'STANDARD'})"
  Write-Host ""

  Capture-Set -Routes $mainRoutes -ViewportSet $viewports -Group 'MAIN'
  Capture-Set -Routes $supportRoutes -ViewportSet $desktopOnly -Group 'SUPPORT'

  if($Deep){
    $supportExtra=@(
      @{Name='split-1024';Width=1024;Height=900},
      @{Name='phone-390';Width=390;Height=844}
    )
    Capture-Set -Routes $supportRoutes -ViewportSet $supportExtra -Group 'SUPPORT-DEEP'

    $homeSections=@(
      @{Name='home-what-i-do';Path='/#what-i-do'},
      @{Name='home-value';Path='/#v45-value'},
      @{Name='home-websites';Path='/#websites'},
      @{Name='home-proof';Path='/#proof'}
    )
    Capture-Set -Routes $homeSections -ViewportSet $viewports -Group 'HOME-SECTIONS'
  }

    $uniqueNames=@($captures | Select-Object -ExpandProperty file -Unique)
  if($uniqueNames.Count -ne $captures.Count){
    throw "Visual QA filename collision: $($captures.Count) captures mapped to only $($uniqueNames.Count) unique filenames."
  }

  $actualScreenshotCount=@(Get-ChildItem -LiteralPath $shots -File -Filter '*.png').Count
  if($actualScreenshotCount -ne $captures.Count){
    throw "Visual QA screenshot integrity failure: expected $($captures.Count) files but found $actualScreenshotCount."
  }
$manifest=[ordered]@{
    generated_at=(Get-Date).ToString('o')
    label=$Label;base_url=$BaseUrl;edge=$edge;deep=[bool]$Deep
    capture_count=$captures.Count;failure_count=$failures.Count
    captures=$captures;failures=$failures
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $work 'manifest.json') -Encoding UTF8

  $cards=foreach($c in $captures){
    @"
<article class="card">
<header><strong>$($c.route)</strong><span>$($c.theme) · $($c.viewport) · $($c.width)x$($c.height)</span></header>
<img src="screenshots/$($c.file)" alt="$($c.route) $($c.theme) $($c.viewport)">
<footer>$($c.path)</footer>
</article>
"@
  }

  $failureHtml=if($failures.Count){
    "<section class='fail'><h2>Capture failures</h2><pre>"+[System.Net.WebUtility]::HtmlEncode(($failures -join "`n"))+"</pre></section>"
  }else{
    "<section class='pass'><strong>All requested screenshots were captured.</strong></section>"
  }

  $gallery=@"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>iCharles Visual QA — $Label</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#05080d;color:#eef6ff;font:14px/1.5 system-ui,Segoe UI,sans-serif}
.top{position:sticky;top:0;z-index:3;padding:18px 22px;background:rgba(5,8,13,.94);border-bottom:1px solid #17405a;backdrop-filter:blur(12px)}
.top h1{margin:0 0 4px;font-size:18px}.top p{margin:0;color:#8da7bb}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:18px;padding:20px}
.card{margin:0;border:1px solid #173d55;background:#07111b;overflow:hidden}
.card header,.card footer{padding:10px 12px}.card header{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #173d55}
.card header span,.card footer{color:#88a0b5;font-size:12px}.card img{display:block;width:100%;height:auto;background:#020408}
.pass,.fail{margin:20px;padding:14px;border:1px solid #1c5747;background:#071912}.fail{border-color:#7b2930;background:#1b090b}
pre{white-space:pre-wrap}
</style>
</head><body>
<div class="top"><h1>iCharles Visual QA — $Label</h1><p>$BaseUrl · $($captures.Count) captures · $(if($Deep){'deep'}else{'standard'}) mode</p></div>
$failureHtml
<main class="grid">$($cards -join "`n")</main>
</body></html>
"@
  [System.IO.File]::WriteAllText((Join-Path $work 'VISUAL-QA-GALLERY.html'),$gallery,[System.Text.UTF8Encoding]::new($false))

  $readme=@"
ICHARLES AUTOMATED VISUAL QA
============================

Target: $BaseUrl
Label: $Label
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Captures: $($captures.Count)
Failures: $($failures.Count)

Open VISUAL-QA-GALLERY.html to browse the screenshots.
Upload this generated ZIP to ChatGPT for visual inspection.

STANDARD
- Home, Try Apps, Work, Services, Website Studio, About, Contact
- dark + light at 1440x1000, 1024x900 and 390x844
- supporting pages/case studies in dark + light desktop

DEEP
- adds split/mobile support-page captures
- adds key Home section anchors

Screenshots stay local. Nothing is uploaded automatically.
"@
  [System.IO.File]::WriteAllText((Join-Path $work 'README.txt'),$readme,[System.Text.UTF8Encoding]::new($false))

  $zipName="iCharles_Visual_QA_${labelSafe}_${stamp}.zip"
  $zipPath=Join-Path $downloads $zipName
  if(Test-Path -LiteralPath $zipPath){Remove-Item -LiteralPath $zipPath -Force}
  Compress-Archive -Path (Join-Path $work '*') -DestinationPath $zipPath -CompressionLevel Optimal

  if(!(Test-Path -LiteralPath $zipPath)){throw 'Visual QA ZIP was not created.'}
  $zipHash=(Get-FileHash $zipPath -Algorithm SHA256).Hash

  Write-Host "`nICHARLES AUTOMATED VISUAL QA COMPLETE" -ForegroundColor Green
  Write-Host "Captures: $($captures.Count)"
  Write-Host "Failures: $($failures.Count)"
  Write-Host "ZIP: $zipPath" -ForegroundColor Cyan
  Write-Host "SHA-256: $zipHash"

  if(!$NoOpen){
    try{Start-Process explorer.exe "/select,`"$zipPath`""}catch{}
  }

  if($failures.Count -gt 0){
    throw "Visual QA completed with $($failures.Count) failed capture(s). The ZIP still contains successful screenshots and the failure list."
  }

  Write-Output $zipPath
}
finally{
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
