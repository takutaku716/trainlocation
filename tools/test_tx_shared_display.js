const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const adapter = require('../js/tx_location_adapter.js');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const elements = new Map();
function $(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    value: '', visible: false,
    off() { return this; },
    on() { return this; },
    empty() { this.value = ''; return this; },
    html(value) { this.value = value; return this; },
    text(value) { this.value = value; return this; },
    toggle(value) { this.visible = value; return this; },
    show() { this.visible = true; return this; },
    hide() { this.visible = false; return this; }
  });
  return elements.get(selector);
}
const context = vm.createContext({ $, document: { documentElement: { dataset: { lang: 'ja' } } }, window: {} });
vm.runInContext(read('js/location_unkou_detail.js'), context);
const rows = adapter.normalizeDetail(JSON.parse(read('tools/fixtures/tx/stops.json')));
context.create_jreast_daiya({source:'tx',tx_timetable:JSON.stringify(rows),chien:'0'});
const html = $('#teisyaTableArea div').value;
assert.ok(html.includes('定刻'));
assert.ok(html.includes('23:36 発'));
assert.ok(html.includes('00:23 着'));
assert.ok(!html.includes('23:35'));
assert.ok(!html.includes('始発駅：'));
assert.ok(!html.includes('車両形式：'));
assert.ok(!html.includes('<th>到着</th>'));
context.create_jreast_daiya({source:'tx',tx_timetable:'[]',chien:'0'});
assert.equal($('#teisyaTableArea div').value,'');
vm.runInContext(read('js/unkou_info_display.js'), context);
let notice = null, overview;
context.window.TxLocationAdapter = {getOperationNotice:()=>notice};
context.create_gaikyo = rows => { overview = rows; };
assert.equal(context.set_tx_unko_info('146'),false);
assert.equal(context.set_tx_unko_info('151'),true);
assert.equal($('#unkouInfo').visible,false);
notice = {category:1,status:'遅延',message:'遅れが発生しています。',updated_at_label:'2026年09月09日'};
context.set_tx_unko_info('151');
assert.equal($('#unkouInfo').visible,true);
assert.equal(overview[0].honbun,notice.message);
notice = null;
context.set_tx_unko_info('151');
assert.equal($('#unkouInfo').visible,false);
assert.ok(!read('css/tx_location.css').includes('.icon-img'));
for (const id of [146,147,148,149,150,151]) assert.ok(!read(`rosen/rosen_${id}.html`).includes('-credit'));
console.log('TX shared UI tests passed: common timetable, departure/terminal arrival, silent missing data, disruption tab, no custom train icons or credits.');
