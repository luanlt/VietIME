param(
  [string]$Studio = 'C:\Program Files\Huawei\DevEco Studio',
  [ValidateSet('debug', 'release')][string]$Mode = 'debug',
  # hap: installable module (hdc / DevEco Run). app: bundle for AppGallery Connect upload.
  [ValidateSet('hap', 'app')][string]$Target = 'hap'
)
$ErrorActionPreference = 'Stop'
$env:DEVECO_SDK_HOME = Join-Path $Studio 'sdk'
$env:JAVA_HOME = Join-Path $Studio 'jbr'
$env:PATH = (Join-Path $Studio 'jbr\bin') + ';' + (Join-Path $Studio 'tools\node') + ';' + (Join-Path $Studio 'tools\ohpm\bin') + ';' + $env:PATH
Push-Location (Join-Path $PSScriptRoot '..')
try {
  $hvigor = Join-Path $Studio 'tools\hvigor\bin\hvigorw.js'
  if ($Target -eq 'app') {
    & (Join-Path $Studio 'tools\node\node.exe') $hvigor --mode project -p product=default -p buildMode=$Mode assembleApp --no-daemon
  } else {
    & (Join-Path $Studio 'tools\node\node.exe') $hvigor --mode module -p product=default -p module=entry@default -p buildMode=$Mode assembleHap --no-daemon
  }
  if ($LASTEXITCODE -ne 0) { throw "Hvigor failed: $LASTEXITCODE" }
} finally { Pop-Location }
