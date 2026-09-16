const fs = require('node:fs');
const acorn = require('acorn');
const source = fs.readFileSync('.tmp/sotetsu-source/app.js','utf8');
const ast = acorn.parse(source,{ecmaVersion:'latest',sourceType:'module'});
const result = {stations:[],tabs:[],kinds:[]};
function literal(n) {
  if(n.type==='Literal') return n.value;
  if(n.type==='ArrayExpression') return n.elements.map(literal);
  if(n.type==='ObjectExpression') return Object.fromEntries(n.properties.map(p=>[p.key.name??p.key.value,literal(p.value)]));
  if(n.type==='UnaryExpression' && n.operator==='!') return !literal(n.argument);
  if(n.type==='UnaryExpression' && n.operator==='-') return -literal(n.argument);
  throw Error('Not literal');
}
function walk(n) {
  if(!n || typeof n!=='object') return;
  if(n.type==='Literal' && typeof n.value==='string' && n.value.startsWith('[') && n.value.includes('"eki_number"')) {
    const data=JSON.parse(n.value); if(data.some(s=>s.name_ja==='横浜')) result.stations=data;
  }
  if(n.type==='VariableDeclarator' && n.init?.type==='ArrayExpression') {
    try {
      const data=literal(n.init);
      if(data.some(s=>s?.lineId===1 && s.stations)) result.tabs=data;
      if(data.some(s=>s?.id===4 && s.abbr_name_ja==='各')) result.kinds=data;
    } catch (_) {}
  }
  for(const value of Object.values(n)) {
    if(Array.isArray(value)) value.forEach(walk);
    else if(value?.type) walk(value);
  }
}
walk(ast);
if(!result.stations.length||!result.tabs.length||!result.kinds.length) throw Error('Incomplete tables');
fs.writeFileSync('.tmp/sotetsu-source/master.json',JSON.stringify(result,null,2));
console.log('Extracted stations: '+result.stations.length+', tabs: '+result.tabs.length+', kinds: '+result.kinds.length);
