const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the real click handler through its asynchronous loaders and observe
// whether it reaches the shared detail-rendering path.
const source = fs.readFileSync('js/location_unkou_detail.js', 'utf8');
const prefix = source.slice(0, source.indexOf('\t\t// ローディングアニメーションを表示'));
async function check(detail, cars, expected, lang = 'ja') {
  let click, pending;
  const item = {isConnected:true,dataset:{source:'tokyu',source_rosen:'161',cbango:'00300100',
    ryosu:cars,tokyu_formation_request:JSON.stringify({operation:3,direction:'up'})}};
  const document = {documentElement:{dataset:{lang}}};
  const window = {opened:0,TokyuLocationAdapter:{loadDentoFormation:()=>({then(callback) {
    pending = Promise.resolve(detail).then(callback);
  }})}};
  function $(target) {
    if (typeof target === 'function') return target($);
    return {on(event,selector,handler) {click=handler;},
      trigger() {click.call(target);},toggleClass() {return this;},prop() {return this;}};
  }
  vm.runInNewContext(prefix + '\n window.opened++;\n });\n });', {
    $,document,window,get_param_rosen:()=> '161',loading_animation_display(){},loading_animation_hidden(){},
    escape_detail_html:value=>String(value)
  });
  click.call(item);
  await pending;
  assert.equal(window.opened,1);
  assert.equal(item.dataset.ryosu,expected);
}
(async()=>{
  await check({formation:'2134F',cars:10},'', '10両（2134F）');
  await check({formation:'2134F',cars:10},'8両', '8両（2134F）');
  await check({formation:'2134F',cars:10},'', '10 car(s)（2134F）','en');
  await check(null,'','');
  console.log('Tokyu detail: successful/missing formation reaches shared dialog; existing cars and language preserved.');
})().catch(error=>{console.error(error);process.exitCode=1;});
