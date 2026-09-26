param([string]$Path = (Join-Path $PSScriptRoot '..\entry\build\default\outputs\default\entry-default-unsigned.hap'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$resolved = (Resolve-Path -LiteralPath $Path).Path
$zip = [System.IO.Compression.ZipFile]::OpenRead($resolved)
function Read-ZipText([string]$Name) {
  $entry = $zip.GetEntry($Name)
  if (!$entry) { throw "Missing $Name" }
  $reader = [System.IO.StreamReader]::new($entry.Open())
  try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
}
try {
  $manifest = Read-ZipText 'module.json' | ConvertFrom-Json
  $subtype = Read-ZipText 'resources/base/profile/input_method_config.json' | ConvertFrom-Json
  if (!$zip.GetEntry('ets/modules.abc')) { throw 'Ark bytecode missing' }
  if ($manifest.module.extensionAbilities[0].type -ne 'inputMethod') { throw 'IME declaration missing' }
  if ($manifest.module.deviceTypes -notcontains '2in1') { throw 'PC/2in1 target missing' }
  if ($manifest.module.requestPermissions.Count -gt 0) { throw 'Review unexpected permissions' }
  if ($subtype.subtypes[0].locale -ne 'vi-VN' -or $subtype.subtypes[0].mode -ne 'lower') { throw 'Unexpected subtype' }
  $result = [ordered]@{ artifact=$resolved; sha256=(Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash;
    bytes=(Get-Item -LiteralPath $resolved).Length; bundle=$manifest.app.bundleName;
    targetAPI=$manifest.app.targetAPIVersion; compileSdk=$manifest.app.compileSdkVersion;
    signing=$(if ($resolved -match '-unsigned') { 'UNSIGNED' } else { 'signed (debug profile: registered devices only)' }); bytecode=$true; systemImeManifest=$true; permissions=@() }
  $result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot '..\docs\hap-verification.json') -Encoding utf8
  $result | ConvertTo-Json -Depth 5
} finally { $zip.Dispose() }
