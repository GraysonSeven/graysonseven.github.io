param(
  [switch]$SetupAuth,
  [switch]$Capture,
  [switch]$Bootstrap,
  [switch]$Publish,
  [string]$Label='CURRENT'
)

$ErrorActionPreference='Stop'

$siteRoot=Split-Path -Parent $PSScriptRoot
$engineRoot=Join-Path $env:LOCALAPPDATA 'iCharles\AppShowcaseCaptureEngine'
$profileRoot=Join-Path $env:LOCALAPPDATA 'iCharles\AppShowcaseEdgeProfile'
$downloads=Join-Path $env:USERPROFILE 'Downloads'
$candidateRoot=Join-Path $env:TEMP ('iCharlesShowcase_'+[guid]::NewGuid().ToString('N'))

function Ensure-Engine {
  New-Item -ItemType Directory -Force -Path $engineRoot|Out-Null
  $packagePath=Join-Path $engineRoot 'package.json'
  if(!(Test-Path -LiteralPath $packagePath)){
    '{"private":true,"type":"module"}' | Set-Content -LiteralPath $packagePath -Encoding UTF8
  }

  $modulePath=Join-Path $engineRoot 'node_modules\playwright-core\package.json'
  if(!(Test-Path -LiteralPath $modulePath)){
    Write-Host "Installing the small Playwright control library for Microsoft Edge..." -ForegroundColor Cyan
    Push-Location $engineRoot
    try{
      & npm install --silent --no-audit --no-fund playwright-core@latest
      if($LASTEXITCODE-ne0){throw 'Could not install playwright-core.'}
    }finally{Pop-Location}
  }

  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'Capture-App-Showcase.mjs') -Destination (Join-Path $engineRoot 'Capture-App-Showcase.mjs') -Force
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'app-showcase-config.json') -Destination (Join-Path $engineRoot 'app-showcase-config.json') -Force
}

function Invoke-CaptureEngine([string]$Mode,[string]$OutputRoot){
  Push-Location $engineRoot
  try{
    & node '.\Capture-App-Showcase.mjs' `
      "--mode=$Mode" `
      "--site-root=$siteRoot" `
      "--profile-dir=$profileRoot" `
      "--output-root=$OutputRoot" `
      "--config=$(Join-Path $engineRoot 'app-showcase-config.json')"
    if($LASTEXITCODE-ne0){throw "App showcase capture engine failed in mode $Mode."}
  }finally{Pop-Location}
}

function New-ReviewZip([string]$CaptureRoot){
  $manifestPath=Join-Path $CaptureRoot 'manifest.json'
  if(!(Test-Path -LiteralPath $manifestPath)){throw 'Candidate manifest missing.'}
  $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  $screenCount=0
  foreach($app in @($manifest.apps)){$screenCount += @($app.screens).Count}

  $readme=@"
ICHARLES APP SHOWCASE CANDIDATES
================================

Label: $Label
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Captured screens: $screenCount

These are CANDIDATE software screenshots.
They are not published to the website automatically unless -Publish is used.

Before public use, review them for:
- private/personal information;
- customer or business records;
- emails, phone numbers, addresses or account information;
- accidental test/debug screens;
- login screens;
- screens that simply do not showcase the product well.

Upload this ZIP to ChatGPT and the best safe screens can be selected for the public portfolio.
"@
  [System.IO.File]::WriteAllText((Join-Path $CaptureRoot 'README-REVIEW-FIRST.txt'),$readme,[System.Text.UTF8Encoding]::new($false))

  $stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
  $safeLabel=($Label -replace '[^A-Za-z0-9._-]+','_')
  $zipPath=Join-Path $downloads "iCharles_App_Showcase_Candidates_${safeLabel}_${stamp}.zip"
  Compress-Archive -Path (Join-Path $CaptureRoot '*') -DestinationPath $zipPath -CompressionLevel Optimal
  Write-Host "`nAPP SHOWCASE CANDIDATES READY" -ForegroundColor Green
  Write-Host "ZIP: $zipPath" -ForegroundColor Cyan
  return $zipPath
}

function Publish-Captures([string]$CaptureRoot){
  $manifestPath=Join-Path $CaptureRoot 'manifest.json'
  $manifest=Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  $screenCount=0
  foreach($app in @($manifest.apps)){$screenCount += @($app.screens).Count}
  if($screenCount -lt 1){throw 'No showcase screens are available to publish.'}

  $dirtyBefore=@(& git -C $siteRoot status --porcelain)
  if($dirtyBefore){throw "Website working tree must be clean before publishing screenshots.`n$dirtyBefore"}

  $showcaseDst=Join-Path $siteRoot 'assets\showcase'
  if(Test-Path -LiteralPath $showcaseDst){
    Get-ChildItem -LiteralPath $showcaseDst -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
  }else{
    New-Item -ItemType Directory -Force -Path $showcaseDst|Out-Null
  }

  Get-ChildItem -LiteralPath $CaptureRoot -Directory | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $showcaseDst $_.Name) -Recurse -Force
  }
  Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $showcaseDst 'manifest.json') -Force

  & git -C $siteRoot add assets/showcase
  & git -C $siteRoot diff --cached --quiet
  if($LASTEXITCODE-eq0){
    Write-Host 'Showcase screenshots are already current; no snapshot commit needed.'
    return
  }

  & git -C $siteRoot commit -m 'content: refresh real software showcase snapshots'
  if($LASTEXITCODE-ne0){throw 'Snapshot commit failed.'}
  & git -C $siteRoot push
  if($LASTEXITCODE-ne0){throw 'Snapshot push failed.'}

  $deployDir=Join-Path $env:TEMP ('iCharlesShowcaseDeploy_'+[guid]::NewGuid().ToString('N'))
  $archive="$deployDir.zip"
  try{
    & git -C $siteRoot archive --format=zip HEAD -o $archive
    if($LASTEXITCODE-ne0){throw 'Snapshot git archive failed.'}
    New-Item -ItemType Directory -Force -Path $deployDir|Out-Null
    Expand-Archive -LiteralPath $archive -DestinationPath $deployDir -Force
    & npx --yes wrangler@latest pages deploy $deployDir --project-name icharles --branch main
    if($LASTEXITCODE-ne0){throw 'Snapshot Cloudflare deployment failed.'}
  }finally{
    Remove-Item -LiteralPath $deployDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
  }
}

try{
  Ensure-Engine

  if($SetupAuth -or $Bootstrap){
    if($Bootstrap -and (Test-Path -LiteralPath (Join-Path $profileRoot '.auth-session-initialized'))){
      Write-Host 'Dedicated showcase browser profile already initialized. Skipping auth setup.'
    }else{
      Write-Host "`nA dedicated Microsoft Edge window will open." -ForegroundColor Cyan
      Write-Host "Log in to Trade Core / ETTE only if they ask for it." -ForegroundColor Yellow
      Write-Host "Use a demo/safe account where possible. Close ALL showcase Edge windows when finished."
      Invoke-CaptureEngine 'setup-auth' $candidateRoot
    }
  }

  if($Capture -or $Bootstrap){
    New-Item -ItemType Directory -Force -Path $candidateRoot|Out-Null
    Invoke-CaptureEngine 'capture' $candidateRoot
    $candidateZip=New-ReviewZip $candidateRoot

    if($Publish){
      Write-Warning 'Publishing authenticated screenshots can expose private data. Review-first mode is recommended.'
      Publish-Captures $candidateRoot
    }else{
      try{Start-Process explorer.exe "/select,`"$candidateZip`""}catch{}
    }
  }
}
finally{
  Remove-Item -LiteralPath $candidateRoot -Recurse -Force -ErrorAction SilentlyContinue
}
