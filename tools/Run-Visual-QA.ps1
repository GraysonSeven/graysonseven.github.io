param(
  [string]$BaseUrl='https://icharles.pages.dev',
  [string]$Label='CURRENT',
  [switch]$Deep,
  [switch]$NoOpen
)

$ErrorActionPreference='Stop'

function Safe-Name([string]$Value){
  return (($Value -replace '^https?://','') -replace '[^A-Za-z0-9._-]+','_').Trim('_')
}

$siteRoot=Split-Path -Parent $PSScriptRoot
$engineRoot=Join-Path $env:LOCALAPPDATA 'iCharles\VisualQACaptureEngine'
$downloads=Join-Path $env:USERPROFILE 'Downloads'
$work=Join-Path $env:TEMP ('iCharlesVisualQA_'+[guid]::NewGuid().ToString('N'))
$configPath=Join-Path $work 'capture-config.json'

function Ensure-Engine {
  New-Item -ItemType Directory -Force -Path $engineRoot|Out-Null

  $packagePath=Join-Path $engineRoot 'package.json'
  if(!(Test-Path -LiteralPath $packagePath)){
    '{"private":true,"type":"module"}' | Set-Content -LiteralPath $packagePath -Encoding UTF8
  }

  $modulePath=Join-Path $engineRoot 'node_modules\playwright-core\package.json'
  if(!(Test-Path -LiteralPath $modulePath)){
    Write-Host 'Installing Playwright Core for accurate Microsoft Edge viewport capture...' -ForegroundColor Cyan
    Push-Location $engineRoot
    try{
      & npm install --silent --no-audit --no-fund playwright-core@latest
      if($LASTEXITCODE-ne0){throw 'Could not install playwright-core.'}
    }finally{Pop-Location}
  }

  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Capture-Visual-QA.mjs') `
    -Destination (Join-Path $engineRoot 'Capture-Visual-QA.mjs') -Force
}

$mainRoutes=@(
  @{name='home';path='/'},
  @{name='try-apps';path='/try/'},
  @{name='work';path='/portfolio/'},
  @{name='services';path='/services/'},
  @{name='website-studio';path='/website-studio/'},
  @{name='about';path='/about/'},
  @{name='contact';path='/contact/'}
)

$supportRoutes=@(
  @{name='privacy';path='/privacy/'},
  @{name='trade-core';path='/portfolio/projects/trade-core.html'},
  @{name='custom-business';path='/portfolio/projects/trade-core-custom-business.html'},
  @{name='morsebound';path='/portfolio/projects/morsebound.html'},
  @{name='ette-planner';path='/portfolio/projects/ette-planner.html'},
  @{name='website-request-sent';path='/website-request-sent/'},
  @{name='project-inquiry-sent';path='/project-inquiry-sent/'}
)

$viewports=@(
  @{name='desktop-1440';width=1440;height=1000},
  @{name='split-1024';width=1024;height=900},
  @{name='phone-390';width=390;height=844}
)
$desktopOnly=@(@{name='desktop-1440';width=1440;height=1000})

$groups=@(
  @{group='MAIN';routes=$mainRoutes;viewports=$viewports},
  @{group='SUPPORT';routes=$supportRoutes;viewports=$desktopOnly}
)

if($Deep){
  $groups += @{
    group='SUPPORT-DEEP'
    routes=$supportRoutes
    viewports=@(
      @{name='split-1024';width=1024;height=900},
      @{name='phone-390';width=390;height=844}
    )
  }

  $groups += @{
    group='HOME-SECTIONS'
    routes=@(
      @{name='home-what-i-do';path='/#what-i-do'},
      @{name='home-value';path='/#v45-value'},
      @{name='home-websites';path='/#websites'},
      @{name='home-proof';path='/#proof'}
    )
    viewports=$viewports
  }
}

try{
  New-Item -ItemType Directory -Force -Path $work|Out-Null
  if(!(Test-Path -LiteralPath $downloads)){New-Item -ItemType Directory -Force -Path $downloads|Out-Null}

  Ensure-Engine

  $BaseUrl=$BaseUrl.TrimEnd('/')
  $config=[ordered]@{
    version='6.3.2'
    baseUrl=$BaseUrl
    label=$Label
    deep=[bool]$Deep
    outputRoot=$work
    groups=$groups
  }

  $config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $configPath -Encoding UTF8

  Write-Host "`n=== ICHARLES ACCURATE VISUAL QA // PLAYWRIGHT + EDGE ===" -ForegroundColor Cyan
  Write-Host "Target: $BaseUrl"
  Write-Host "Mode: $(if($Deep){'DEEP'}else{'STANDARD'})"
  Write-Host 'Viewport verification: ENABLED'
  Write-Host 'Horizontal overflow detection: ENABLED'
  Write-Host ''

  Push-Location $engineRoot
  try{
    & node '.\Capture-Visual-QA.mjs' "--config=$configPath"
    $engineExit=$LASTEXITCODE
  }finally{Pop-Location}

  if(!(Test-Path -LiteralPath (Join-Path $work 'manifest.json'))){
    throw 'Accurate Visual QA engine did not create manifest.json.'
  }

  $manifest=Get-Content -LiteralPath (Join-Path $work 'manifest.json') -Raw | ConvertFrom-Json

  $badViewport=@(
    $manifest.captures | Where-Object {
      $_.actualViewport -ne "$($_.width)x$($_.height)"
    }
  )
  if($badViewport.Count){
    throw "Visual QA viewport integrity failed for $($badViewport.Count) capture(s)."
  }

  $actualPngCount=@(Get-ChildItem -LiteralPath (Join-Path $work 'screenshots') -File -Filter '*.png').Count
  if($actualPngCount -ne [int]$manifest.capture_count){
    throw "Visual QA PNG integrity failure: manifest=$($manifest.capture_count), files=$actualPngCount"
  }

  $stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
  $safeLabel=Safe-Name $Label
  $zipPath=Join-Path $downloads "iCharles_Visual_QA_${safeLabel}_${stamp}.zip"
  if(Test-Path -LiteralPath $zipPath){Remove-Item -LiteralPath $zipPath -Force}
  Compress-Archive -Path (Join-Path $work '*') -DestinationPath $zipPath -CompressionLevel Optimal

  if(!(Test-Path -LiteralPath $zipPath)){throw 'Visual QA ZIP was not created.'}
  $zipHash=(Get-FileHash $zipPath -Algorithm SHA256).Hash

  Write-Host "`nICHARLES ACCURATE VISUAL QA COMPLETE" -ForegroundColor Green
  Write-Host "Captures: $($manifest.capture_count)"
  Write-Host "Failures: $($manifest.failure_count)"
  Write-Host "Layout warnings: $($manifest.layout_warning_count)"
  Write-Host "Phone viewport is verified as exactly 390x844 CSS pixels."
  Write-Host "ZIP: $zipPath" -ForegroundColor Cyan
  Write-Host "SHA-256: $zipHash"

  if(!$NoOpen){
    try{Start-Process explorer.exe "/select,`"$zipPath`""}catch{}
  }

  if($engineExit-ne0 -or [int]$manifest.failure_count -gt 0){
    throw "Accurate Visual QA completed with $($manifest.failure_count) failed capture(s). The ZIP contains all successful screenshots and diagnostics."
  }

  Write-Output $zipPath
}
finally{
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
