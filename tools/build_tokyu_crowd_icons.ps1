$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$android = 'http://schemas.android.com/apk/res/android'
foreach ($level in 1..6) {
    [xml]$vector = Get-Content -LiteralPath (Join-Path $root "apk解析/tokyu_4.24.0_jadx/resources/res/drawable/vector_crowd_lv$level.xml") -Raw
    [xml]$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"></svg>'
    foreach ($source in $vector.vector.path) {
        $path = $svg.CreateElement('path', 'http://www.w3.org/2000/svg')
        $path.SetAttribute('fill', $source.GetAttribute('fillColor', $android))
        $path.SetAttribute('d', $source.GetAttribute('pathData', $android))
        $path.SetAttribute('fill-rule', $(if ($source.GetAttribute('fillType', $android) -eq 'evenOdd') {'evenodd'} else {'nonzero'}))
        [void]$svg.DocumentElement.AppendChild($path)
    }
    $svg.Save((Join-Path $root "images/home/tokyu/crowd_$level.svg"))
}
