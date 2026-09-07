param(
  [string]$BaseUrl='https://icharles.pages.dev',
  [string]$Label='V6.4.1-HOME'
)

$ErrorActionPreference='Stop'

function Write-Utf8NoBom([string]$Path,[string]$Text){
  [System.IO.File]::WriteAllText($Path,$Text,[System.Text.UTF8Encoding]::new($false))
}

$siteRoot=Split-Path -Parent $PSScriptRoot
$engineRoot=Join-Path $env:LOCALAPPDATA 'iCharles\VisualQACaptureEngine'
$downloads=Join-Path $env:USERPROFILE 'Downloads'
$work=Join-Path $env:TEMP ('iCharlesHomeVisualQA_'+[guid]::NewGuid().ToString('N'))
$configPath=Join-Path $work 'capture-config.json'

function Ensure-Engine {
  New-Item -ItemType Directory -Force -Path $engineRoot|Out-Null

  $packagePath=Join-Path $engineRoot 'package.json'
  if(!(Test-Path -LiteralPath $packagePath)){
    Write-Utf8NoBom $packagePath '{"private":true,"type":"module"}'
  }

  $modulePath=Join-Path $engineRoot 'node_modules\playwright-core\package.json'
  if(!(Test-Path -LiteralPath $modulePath)){
    Write-Host 'Installing Playwright Core for Home-only Visual QA...' -ForegroundColor Cyan
    Push-Location $engineRoot
    try{
      & npm install --silent --no-audit --no-fund playwright-core@latest
      if($LASTEXITCODE-ne0){throw 'Could not install playwright-core.'}
    }finally{Pop-Location}
  }

  Copy-Item -LiteralPath (Join-Path $siteRoot 'tools\Capture-Visual-QA.mjs') `
    -Destination (Join-Path $engineRoot 'Capture-Visual-QA.mjs') -Force
}

try{
  New-Item -ItemType Directory -Force -Path $work|Out-Null
  if(!(Test-Path -LiteralPath $downloads)){New-Item -ItemType Directory -Force -Path $downloads|Out-Null}
  Ensure-Engine

  $BaseUrl=$BaseUrl.TrimEnd('/')

  $config=[ordered]@{
    version='6.4.1'
    baseUrl=$BaseUrl
    label=$Label
    deep=$false
    outputRoot=$work
    groups=@(
      @{
        group='HOME-UPDATE'
        routes=@(@{name='home';path='/'})
        viewports=@(
          @{name='desktop-1440';width=1440;height=1000},
          @{name='split-1024';width=1024;height=900},
          @{name='phone-390';width=390;height=844}
        )
      }
    )
  }

  Write-Utf8NoBom $configPath ($config | ConvertTo-Json -Depth 10)

  Write-Host "`n=== ICHARLES HOME-ONLY VISUAL QA ===" -ForegroundColor Cyan
  Write-Host 'Scope: HOME ONLY'
  Write-Host 'Themes: DARK + LIGHT'
  Write-Host 'Viewports: 1440 / 1024 / 390'
  Write-Host ''

  Push-Location $engineRoot
  try{
    & node '.\Capture-Visual-QA.mjs' "--config=$configPath"
    $engineExit=$LASTEXITCODE
  }finally{Pop-Location}

  if(!(Test-Path -LiteralPath (Join-Path $work 'manifest.json'))){
    throw 'Home Visual QA did not create manifest.json.'
  }

  $manifest=Get-Content -LiteralPath (Join-Path $work 'manifest.json') -Raw | ConvertFrom-Json
  if([int]$manifest.capture_count -ne 6){
    throw "Expected 6 Home captures but got $($manifest.capture_count)."
  }

  $stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
  $zipPath=Join-Path $downloads "iCharles_Visual_QA_${Label}_${stamp}.zip"
  Compress-Archive -Path (Join-Path $work '*') -DestinationPath $zipPath -CompressionLevel Optimal

  Write-Host "`nHOME-ONLY VISUAL QA COMPLETE" -ForegroundColor Green
  Write-Host "Captures: $($manifest.capture_count)"
  Write-Host "Failures: $($manifest.failure_count)"
  Write-Host "Layout warnings: $($manifest.layout_warning_count)"
  Write-Host "ZIP: $zipPath" -ForegroundColor Cyan

  try{Start-Process explorer.exe "/select,`"$zipPath`""}catch{}

  if($engineExit-ne0 -or [int]$manifest.failure_count -gt 0){
    throw "Home Visual QA completed with $($manifest.failure_count) failure(s)."
  }
}
finally{
  Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
