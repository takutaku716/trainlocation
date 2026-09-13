param([switch]$RefreshFixtures)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot
$base = 'https://zaisen.tid-keisei.jp'
function Read-Text($p) {
 $cached = Join-Path $root ('.tmp/keisei-source/' + $p.TrimStart('/'))
 if (Test-Path -LiteralPath $cached) { return [IO.File]::ReadAllText($cached) }
 return (Invoke-WebRequest ($base + $p) -TimeoutSec 20).Content
}
function Read-Json($p) { Read-Text $p | ConvertFrom-Json }
$stations = (Read-Json '/config/station.json').station
$coords = (Read-Json '/config/coordinate.json').coordinate
$destinations = (Read-Json '/config/ikisaki.json').ikisaki
$stops = (Read-Json '/config/stop.json').stop
$types = (Read-Json '/config/syasyu.json').syasyu
$matsudo = (Read-Json '/config/matsudo_id.json').matsudo
$definitions = @(
 @('keisei','京成本線'), @('e_narita','東成田線・芝山鉄道線'),
 @('access','成田スカイアクセス線・北総線'), @('oshiage','押上線'),
 @('kanamati','金町線'), @('chiba','千葉線・千原線'), @('matsudo','松戸線')
)
$routes = @()
for ($r=0; $r -lt $definitions.Count; $r++) {
 $line = [string]($r+1); $id = [string](152+$r)
 $ss = @($coords | ForEach-Object {
   $c = $_; foreach ($z in $c.zh) { if ($z.rs -eq $line -and $c.ifname) {
     $station = $stations | Where-Object { $_.name.Normalize([Text.NormalizationForm]::FormKC) -eq $c.ifname.Normalize([Text.NormalizationForm]::FormKC) } | Select-Object -First 1
     if (!$station) { throw "Missing station: $($c.ifname)" }
     [ordered]@{name=$c.ifname;id=$station.id;y=[double]$z.y}
   }}
 } | Sort-Object { $_.y })
 [xml]$svg = Read-Text "/svg/$($definitions[$r][0]).svg"
 $positions = @{}
 foreach ($node in $svg.SelectNodes('//*[@id="ID_TRAIN"]/*')) {
   $anchor = $node.GetAttribute('id')
   if ($anchor -notmatch '^(E\d{3}_[UD]\d+_\d+|[A-Z]\d{3})$') { continue }
   $direction = if ($node.GetAttribute('href', 'http://www.w3.org/1999/xlink').EndsWith('_U')) { 'U' } else { 'D' }
   $y = [double]$node.GetAttribute('y') + 57
   $index = -1
   if ($anchor.StartsWith('E')) {
     $d = $stops | Where-Object { [int]$_.code -eq [int]$anchor.Substring(1,3) } | Select-Object -First 1
     for ($i=0;$i -lt $ss.Count;$i++) { if ($d.name -and $ss[$i].name.Normalize([Text.NormalizationForm]::FormKC) -eq $d.name.Normalize([Text.NormalizationForm]::FormKC)) { $index=$i;break } }
     if ($index -lt 0) { continue }
     $p = [string]($index+1); $name = $ss[$index].name
   } else {
     for ($i=0;$i -lt $ss.Count-1;$i++) { if ($y -gt $ss[$i].y -and $y -lt $ss[$i+1].y) { $index=$i;break } }
     if ($index -lt 0) { continue }
     $p = "$($index+1)_$($index+2)"
     $name = if ($direction -eq 'U') { "$($ss[$index+1].name)→$($ss[$index].name) 間" } else { "$($ss[$index].name)→$($ss[$index+1].name) 間" }
   }
   $positions[$anchor] = @{key="KEISEI${id}P${p}${direction}";name=$name}
 }
 $route = [ordered]@{rosen=$id;line=$line;name=$definitions[$r][1];stations=$ss;positions=$positions}
 $routes += $route
 $html = [System.Collections.Generic.List[string]]::new()
 $html.Add("<div id=`"homenNameUpText`" hidden>$($ss[0].name)方面</div><div id=`"homenNameDownText`" hidden>$($ss[-1].name)方面</div>")
 for ($i=0;$i -lt $ss.Count;$i++) {
   $n=$i+1; $end=if ($n -eq $ss.Count) {' end'} else {''}
   $html.Add("<div class=`"eki-panel eki$end`"><div class=`"eki-contents`"><div class=`"stalist-eki-link`" style=`"border-color:#005aaa`"><div class=`"stalist-eki-contents non-icon`"><div key=`"KEISEI${id}S$n`">$($ss[$i].name)</div></div></div><div class=`"ressha-contents`"><div class=`"ressha-icon KEISEI${id}P${n}U`"></div><div class=`"ressha-icon KEISEI${id}P${n}D`"></div></div></div>" + $(if (!$end) {'<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}) + '</div>')
   if (!$end) { $p="${n}_$($n+1)"; $html.Add("<div class=`"eki-panel`"><div class=`"eki-contents`"><div class=`"ressha-contents`"><div class=`"ressha-icon KEISEI${id}P${p}U`"></div><div class=`"ressha-icon KEISEI${id}P${p}D`"></div></div></div><svg class=`"senro-img`"><use xlink:href=`"#senro`"></use></svg></div>") }
 }
 $html.Add('<svg style="display:none" xmlns="http://www.w3.org/2000/svg"><symbol id="senro" viewBox="0 0 8 300"><path d="M4 0V300" stroke="#000" stroke-width="6"/><path d="M4 0V300" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/></symbol></svg>')
 [IO.File]::WriteAllText((Join-Path $root "rosen/rosen_$id.html"), ($html -join "`n"))
 Write-Output "$id $($route.name): $($ss.Count) stations, $($positions.Count) anchors"
}
$master = @{routes=$routes;destinations=$destinations;stops=$stops;types=$types;matsudo=$matsudo}
$json = $master | ConvertTo-Json -Depth 20 -Compress
[IO.File]::WriteAllText((Join-Path $root 'js/keisei_master.js'), "// Generated from the official public JSON and SVG placement tables.`n(function(root){const data=$json;if(typeof module==='object'&&module.exports)module.exports=data;else root.KeiseiMaster=data;})(typeof self!=='undefined'?self:this);`n")
$fixture = Join-Path $root 'testdata/keisei'
[IO.Directory]::CreateDirectory($fixture) | Out-Null
if ($RefreshFixtures) { foreach ($p in @('traffic_info','matsudo_date','matsudo_train_info','matsudo_status')) {
 $data=Read-Json "/data/$p.json"
 [IO.File]::WriteAllText((Join-Path $fixture "$p.json"), (ConvertTo-Json -InputObject $data -Depth 20))
} }
