const fs=require('node:fs');
const source=JSON.parse(fs.readFileSync('.tmp/sotetsu-source/master.json','utf8'));
const definitions=[['167','main',1,'相鉄本線'],['168','izumino',2,'いずみ野線'],['169','shinyokohama',3,'相鉄新横浜線']];
const routes=definitions.map(([rosen,key,lineId,name])=>{
  let ids=source.tabs.find(t=>t.lineId===lineId).stations.flat().map(s=>s.id).filter(id=>id<=29);
  if(lineId===2) ids.unshift(10);
  const stations=ids.map((id,i)=>({id,name:source.stations.find(s=>s.id===id).name_ja,index:i+1}));
  return {rosen,key,lineId,name,stations};
});
const data={routes,destinations:Object.fromEntries(source.stations.map(s=>[s.id,s.name_ja])),kinds:Object.fromEntries(source.kinds.filter(k=>k.id<1000).map(k=>[k.id,[k.name_ja,k.name_ja==='通勤特急'?'通特':k.name_ja==='通勤急行'?'通急':k.abbr_name_ja]]))};
fs.writeFileSync('js/sotetsu_routes.js','// Generated from official public WebView literal tables.\n(function(root){const data='+JSON.stringify(data)+';if(typeof module==="object"&&module.exports)module.exports=data;else root.SotetsuRoutes=data;})(typeof self!=="undefined"?self:this);\n');
for(const r of routes) {
  const p='SOTETSU'+r.rosen;
  const html=[`<div id="homenNameUpText" hidden>${r.stations[0].name}方面</div><div id="homenNameDownText" hidden>${r.stations.at(-1).name}方面</div>`];
  r.stations.forEach((s,i)=>{
    const n=i+1,last=n===r.stations.length;
    html.push(`<div class="eki-panel eki${last?' end':''}"><div class="eki-contents"><div class="stalist-eki-link" style="border-color:#0066a5"><div class="stalist-eki-contents non-icon"><div key="${p}S${n}">${s.name}</div></div></div><div class="ressha-contents"><div class="ressha-icon ${p}P${n}U"></div><div class="ressha-icon ${p}P${n}D"></div></div></div>${last?'':'<svg class="senro-img"><use xlink:href="#senro"></use></svg>'}</div>`);
    if(!last) html.push(`<div class="eki-panel"><div class="eki-contents"><div class="ressha-contents"><div class="ressha-icon ${p}P${n}_${n+1}U"></div><div class="ressha-icon ${p}P${n}_${n+1}D"></div></div></div><svg class="senro-img"><use xlink:href="#senro"></use></svg></div>`);
  });
  html.push('<svg style="display:none" xmlns="http://www.w3.org/2000/svg"><symbol id="senro" viewBox="0 0 8 300"><path d="M4 0V300" stroke="#000" stroke-width="6"/><path d="M4 0V300" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/></symbol></svg>');
  fs.writeFileSync(`rosen/rosen_${r.rosen}.html`,html.join('\n')+'\n');
}
const file='master/rosen_name_master.json',text=fs.readFileSync(file,'utf8'),existing=JSON.parse(text);
const lang=value=>Object.fromEntries(['ja','en','tc','sc','kr'].map(l=>[l,value]));
const additions=routes.filter(r=>!existing.some(e=>e.rosen===r.rosen)).map(r=>({rosen:r.rosen,rosenName:lang(r.name),kukanName:lang(`[${r.stations[0].name}～${r.stations.at(-1).name}間]`),area:'16'}));
if(additions.length)fs.writeFileSync(file,text.replace('[','[\n'+additions.map(r=>JSON.stringify(r)+',').join('\n')));
