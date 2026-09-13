const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const elements = new Map();
function $(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    value: '', visible: false,
    empty() { this.value = ''; return this; },
    html(value) { this.value = value; return this; },
    toggle(value) { this.visible = value; return this; }
  });
  return elements.get(selector);
}
const context = vm.createContext({ $, document: { documentElement: { dataset: { lang: 'ja' } } }, window: {} });
const source = read('js/location_unkou_detail.js');
vm.runInContext(source, context);
const rows = [
  { stationName: '都庁前', stationKey: 'Tochomae:0', planDeparture: '23:58' },
  { stationName: '新宿西口', stationKey: 'Shinjuku:1', planArrival: '00:00', planDeparture: '00:01' },
  { stationName: '都庁前', stationKey: 'Tochomae:2', planArrival: '00:50' }
];
for (const delay of ['0', '3']) {
  context.create_jreast_daiya({ source: 'tx', tx_timetable: JSON.stringify(rows), chien: delay });
  const expected = $('#teisyaTableArea div').value;
  context.create_jreast_daiya({ source: 'toei', toei_timetable: JSON.stringify(rows), chien: delay });
  const actual = $('#teisyaTableArea div').value;
  assert.equal(actual, expected, 'Toei must use exactly the shared renderer');
  assert.ok(actual.includes("width='80%'"));
  assert.ok(actual.includes('23:58 発') && actual.includes('00:01 発') && actual.includes('00:50 着'));
  assert.equal((actual.match(/<td>都庁前<\/td>/g) || []).length, 2, 'keep distinct loop visits');
  if (delay === '3') assert.ok(actual.includes('遅延考慮') && actual.includes('00:01 発') && actual.includes('00:53 着'));
}
context.create_jreast_daiya({ source: 'toei', toei_timetable: '[]', chien: '0' });
assert.equal($('#teisyaTableArea div').value, '');
context.create_jreast_daiya({ source: 'toei', toei_timetable: 'invalid', chien: '0' });
assert.equal($('#teisyaTableArea div').value, '');
assert.ok(!source.includes('create_toei_daiya'));
assert.ok(!read('css/toei_location.css').includes('toei-timetable-note'));
assert.ok(!read('css/toei_location.css').includes('#teisyaTableArea'));
console.log('Toei shared display: identical renderer, departure/arrival, delay, missing data, repeated loop stations passed.');
