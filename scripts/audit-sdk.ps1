param([string]$Studio = 'C:\Program Files\Huawei\DevEco Studio')
$ErrorActionPreference = 'Stop'
$apiRoot = Join-Path $Studio 'sdk\default\openharmony\ets\api'
$sdk = Get-Content (Join-Path $Studio 'sdk\default\sdk-pkg.json') -Raw | ConvertFrom-Json
$ide = Get-Content (Join-Path $Studio 'product-info.json') -Raw | ConvertFrom-Json
$files = @('@ohos.inputMethod.d.ts','@ohos.inputMethodEngine.d.ts','@ohos.InputMethodExtensionAbility.d.ts','@ohos.InputMethodSubtype.d.ts','@ohos.multimodalInput.keyEvent.d.ts','@ohos.settings.d.ts','@ohos.data.preferences.d.ts')
$pattern = '^\s*(export )?(interface (InputMethodEngine|InputMethodAbility|InputClient|TextInputClient|AttachOptions)|function (getKeyboardDelegate|getInputMethodAbility|setSimpleKeyboardEnabled|openInputMethodSettings)|on\(type: ''(keyEvent|inputStart|inputStop|selectionChange|editorAttributeChanged)''|[a-zA-Z]*(Preview|PreviewText|TextPreview|UiContent|Keyboard|KeyboardEnabled|TextInput|Cursor|EditorAttribute|KeyFunction)[a-zA-Z]*\(|isSimpleKeyboardEnabled\??:)'
$declarations = foreach ($name in $files) {
  $path = Join-Path $apiRoot $name
  $lines = Get-Content -LiteralPath $path
  $matches = for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match $pattern) { [ordered]@{ line = $i + 1; declaration = $lines[$i].Trim() } }
  }
  [ordered]@{ file=$name; sha256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash; matches=@($matches) }
}
$result = [ordered]@{ checked=(Get-Date -Format 'yyyy-MM-dd'); studio=$ide.version; sdk=$sdk.data; apiRoot=$apiRoot; files=@($declarations) }
$output = Join-Path $PSScriptRoot '..\docs\sdk-evidence.json'
$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $output -Encoding utf8
Write-Output "SDK API $($sdk.data.apiVersion), DevEco $($ide.version). Evidence: $output"
