param(
  [string]$ProductionUrl = 'https://icharles.pages.dev/experience/',
  [string]$ProjectName = 'icharles',
  [string]$ExpectedV7Version = '7.4.0'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path
$tempRoot = Join-Path $env:TEMP ('icharles-v7-deploy-' + [guid]::NewGuid().ToString('N'))
$deployDir = Join-Path $tempRoot 'site'
$archive = Join-Path $tempRoot 'site.zip'
$preQa = Join-Path $tempRoot 'predeploy-runtime'
$prodQa = Join-Path $tempRoot 'production-runtime'

function Invoke-NativeChecked {
  param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
}

function Read-NativeText {
  param(
    [Parameter(Mandatory=$true)][string]$FilePath,
    [Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments
  )

  $output = & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath failed with exit code $LASTEXITCODE"
  }
  return (($output -join [Environment]::NewLine).Trim())
}

function Assert-FileContains {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Needle
  )

  if (!(Test-Path -LiteralPath $Path)) {
    throw "Required file missing: $Path"
  }

  $text = Get-Content -LiteralPath $Path -Raw
  if (!$text.Contains($Needle)) {
    throw "Required marker missing from $Path : $Needle"
  }
}

Write-Host ''
Write-Host '=== iCharles V7 hidden-route Cloudflare release ==='
Write-Host "Repository: $repoRoot"
Write-Host "Target:     $ProductionUrl"
Write-Host ''

try {
  New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

  foreach ($command in @('git','node','npm','npx')) {
    if (!(Get-Command $command -ErrorAction SilentlyContinue)) {
      throw "Required command is not available: $command"
    }
  }

  $gitRoot = Read-NativeText git -C $repoRoot rev-parse --show-toplevel
  if ([IO.Path]::GetFullPath($gitRoot) -ne [IO.Path]::GetFullPath($repoRoot)) {
    throw "Script is not running from the expected Git repository root."
  }

  $dirty = Read-NativeText git -C $repoRoot status --porcelain
  if ($dirty) {
    throw ("Git worktree is not clean. Commit/stash changes before deployment." + [Environment]::NewLine + $dirty)
  }

  Invoke-NativeChecked git -C $repoRoot fetch origin main

  $branch = Read-NativeText git -C $repoRoot branch --show-current
  if ($branch -ne 'main') {
    throw "Deployment requires branch main. Current branch: $branch"
  }

  $head = Read-NativeText git -C $repoRoot rev-parse HEAD
  $originMain = Read-NativeText git -C $repoRoot rev-parse origin/main
  if ($head -ne $originMain) {
    throw "Local HEAD does not equal origin/main. HEAD=$head origin/main=$originMain"
  }

  Write-Host "Accepted HEAD: $head"

  $experienceHtml = Join-Path $repoRoot 'experience\index.html'
  Assert-FileContains -Path $experienceHtml -Needle ('data-v7-version="' + $ExpectedV7Version + '"')
  Assert-FileContains -Path $experienceHtml -Needle 'noindex,nofollow,noarchive'
  Assert-FileContains -Path $experienceHtml -Needle 'SYSTEM 06 // READY'

  $ikoPath = Join-Path $repoRoot 'assets\iko-prime\identity\iko-prime-logo-locked.png'
  if (!(Test-Path -LiteralPath $ikoPath)) {
    throw 'Locked Iko asset is missing.'
  }

  $expectedIko = 'DDA9E772F1267325918D3608273124BD21A507B57BB49A9E2148EBFF0CBBB5FD'
  $actualIko = (Get-FileHash -LiteralPath $ikoPath -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($actualIko -ne $expectedIko) {
    throw "Locked Iko SHA-256 mismatch: $actualIko"
  }

  Write-Host 'Locked Iko SHA-256: PASS'

  Push-Location $repoRoot
  try {
    Invoke-NativeChecked node --check '.\experience\experience.js'
    Invoke-NativeChecked node --check '.\tools\v7-runtime-qa.mjs'
    Invoke-NativeChecked node --check '.\tools\v7-resilience-qa.mjs'
    Invoke-NativeChecked node --check '.\tools\v7-theme-contract-qa.mjs'
    Invoke-NativeChecked node '.\tools\v7-foundation-qa.mjs'
    Invoke-NativeChecked node '.\tools\site-qa.mjs'

    if (!(Test-Path -LiteralPath (Join-Path $repoRoot 'node_modules\playwright-core'))) {
      Write-Host 'Installing temporary Playwright Core dependency...'
      Invoke-NativeChecked npm install --no-save --package-lock=false playwright-core@1.55.0
    }

    Write-Host 'Running local Microsoft Edge release-candidate QA...'
    Invoke-NativeChecked node '.\tools\v7-runtime-qa.mjs' '--channel=msedge' '--serve-root=.' ("--output=$preQa")
    Invoke-NativeChecked node '.\tools\v7-resilience-qa.mjs' '--channel=msedge' '--serve-root=.' ("--output=$(Join-Path $tempRoot 'predeploy-resilience')")
    Invoke-NativeChecked node '.\tools\v7-theme-contract-qa.mjs' '--channel=msedge' '--serve-root=.' ("--output=$(Join-Path $tempRoot 'predeploy-theme')")
  }
  finally {
    Pop-Location
  }

  Write-Host 'Building exact committed-tree deployment archive...'
  Invoke-NativeChecked -FilePath git -Arguments @('-C', $repoRoot, 'archive', '--format=zip', 'HEAD', '-o', $archive)
  Expand-Archive -LiteralPath $archive -DestinationPath $deployDir -Force

  $deployedExperience = Join-Path $deployDir 'experience\index.html'
  Assert-FileContains -Path $deployedExperience -Needle ('data-v7-version="' + $ExpectedV7Version + '"')
  Assert-FileContains -Path $deployedExperience -Needle 'noindex,nofollow,noarchive'

  $deployedIko = Join-Path $deployDir 'assets\iko-prime\identity\iko-prime-logo-locked.png'
  $archiveIko = (Get-FileHash -LiteralPath $deployedIko -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($archiveIko -ne $expectedIko) {
    throw "Committed-tree archive changed locked Iko: $archiveIko"
  }

  Write-Host ''
  Write-Host "Deploying exact commit $head to Cloudflare Pages project '$ProjectName'..."
  Push-Location $repoRoot
  try {
    Invoke-NativeChecked npx --yes wrangler@latest pages deploy $deployDir --project-name $ProjectName --branch main
  }
  finally {
    Pop-Location
  }

  Write-Host 'Waiting for Cloudflare production to expose the accepted V7 version...'
  $deadline = (Get-Date).AddMinutes(5)
  $ready = $false
  $lastVersion = $null

  do {
    try {
      $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
      $response = Invoke-WebRequest -UseBasicParsing -Uri "$($ProductionUrl)?qa=$stamp" -Headers @{ 'Cache-Control'='no-cache' }
      if ($response.Content -match 'data-v7-version="([^"]+)"') {
        $lastVersion = $Matches[1]
      }

      if ($response.StatusCode -eq 200 -and $lastVersion -eq $ExpectedV7Version) {
        $ready = $true
        break
      }

      Write-Host "Cloudflare reachable; current V7 version: $lastVersion"
    }
    catch {
      Write-Host "Cloudflare probe not ready: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds 10
  } while ((Get-Date) -lt $deadline)

  if (!$ready) {
    throw "Cloudflare did not expose V$ExpectedV7Version within five minutes. Last observed version: $lastVersion"
  }

  Push-Location $repoRoot
  try {
    Write-Host 'Running Microsoft Edge QA against Cloudflare production...'
    Invoke-NativeChecked node '.\tools\v7-runtime-qa.mjs' '--channel=msedge' ("--base=$ProductionUrl") ("--output=$prodQa")
  }
  finally {
    Pop-Location
  }

  Write-Host ''
  Write-Host 'ICHARLES V7 HIDDEN ROUTE PRODUCTION VERIFIED'
  Write-Host "Commit:   $head"
  Write-Host "Version:  $ExpectedV7Version"
  Write-Host "URL:      $ProductionUrl"
  Write-Host 'Public /: unchanged'
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
