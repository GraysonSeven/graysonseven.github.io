$ErrorActionPreference = 'Stop'
$site = Split-Path -Parent $PSScriptRoot
Set-Location $site
& node (Join-Path $PSScriptRoot 'site-qa.mjs')
if ($LASTEXITCODE -ne 0) { throw "Site QA failed with exit code $LASTEXITCODE" }
