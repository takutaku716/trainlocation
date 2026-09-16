(function(root) {
  'use strict';
  let active = false, formationButton = null, previousTitle = '';
  const labels = {
    ja:{title:'車両情報',back:'列車詳細に戻る',outside:'外気温',car:'号車',crowd:'混雑度',inside:'車内温度',air:'空調モード',position:'現在地',time:'取得時刻',legend:'凡例',unknown:'不明'},
    en:{title:'Car Information',back:'Back to train details',outside:'Outside',car:'Car',crowd:'Crowding',inside:'Temperature',air:'Air mode',position:'Location',time:'Retrieved',legend:'Legend',unknown:'Unknown'}
  };
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function temperature(value) { return typeof value === 'number' && Number.isFinite(value) ? value + '℃' : '—'; }
  function crowd(level, text) {
    const box = element('span','tokyu-crowd');
    if (!Number.isInteger(level) || level < 1 || level > 6) {box.textContent='—';return box;}
    const img = element('img');
    img.src = './images/home/tokyu/crowd_' + level + '.svg';
    img.width = 30; img.height = 30; img.alt = text + ' ' + level;
    const number = element('span','tokyu-crowd-level',String(level));
    number.setAttribute('aria-hidden','true');
    box.append(img,number);
    return box;
  }
  function reset() {
    const panel = document.getElementById('tokyuCarDetailMain');
    if (!panel) return;
    panel.hidden = true;
    panel.replaceChildren();
    if (active) {
      document.getElementById('headerTitle').textContent = previousTitle;
      $('#resshaDetailMain').show();
    }
    active = false;
  }
  function show(detail, dataset) {
    const panel = document.getElementById('tokyuCarDetailMain');
    if (!panel || !detail.vehicle) return;
    const l = labels[document.documentElement.dataset.lang] || labels.ja;
    const v = detail.vehicle;
    const back = element('button','tokyu-car-back',l.back);
    back.type = 'button';
    back.addEventListener('click',()=>{reset();formationButton?.focus();});
    const heading = element('div','tokyu-car-heading');
    heading.append(element('h3','',dataset.ressha_type_name + '　' + document.getElementById('shuEki').textContent));
    heading.append(element('p','',detail.formation + (detail.cars ? ' / ' + detail.cars + (document.documentElement.dataset.lang === 'en' ? ' cars' : '両') : '')));
    const meta = element('div','tokyu-car-meta');
    meta.append(element('p','',l.position + '：' + document.getElementById('posDetailText').textContent));
    meta.append(element('p','tokyu-car-outside',l.outside + '：' + temperature(v.outsideTemperature)));
    if (Number.isFinite(v.fetchedAt)) meta.append(element('p','tokyu-car-time',l.time + '：' + new Date(v.fetchedAt).toLocaleTimeString('ja-JP',{timeZone:'Asia/Tokyo',hour12:false})));
    const table = element('table','tokyu-car-table');
    const caption = element('caption','tokyu-sr-only',l.title + ' ' + detail.formation);
    const thead = element('thead'), header = element('tr');
    for (const label of [l.car,l.crowd,l.inside,...(v.showAirMode?[l.air]:[])]) {
      const th = element('th','',label); th.scope='col'; header.append(th);
    }
    thead.append(header);
    const tbody = element('tbody');
    const cars = v.carDetails.length ? v.carDetails : Array.from({length:detail.cars},(_,i)=>({number:i+1}));
    for (const car of cars) {
      const row = element('tr');
      const number = element('th'); number.scope='row'; number.append(element('span','tokyu-car-number',String(car.number)));
      const congestion = element('td'); congestion.append(crowd(car.congestion,l.crowd));
      row.append(number,congestion,element('td','tokyu-car-temperature',temperature(car.temperature)));
      if (v.showAirMode) row.append(element('td','tokyu-car-air',car.airMode || '—'));
      tbody.append(row);
    }
    if (!cars.length) {
      const row = element('tr'), cell = element('td','',l.unknown);
      cell.colSpan = v.showAirMode ? 4 : 3; row.append(cell); tbody.append(row);
    }
    table.append(caption,thead,tbody);
    const legend = element('details','tokyu-car-legend');
    legend.append(element('summary','',l.legend));
    const levels = element('div');
    for (let level=1;level<=6;level++) levels.append(crowd(level,l.crowd));
    levels.append(element('span','',l.unknown + '：—')); legend.append(levels);
    panel.replaceChildren(back,heading,meta,table,legend);
    previousTitle = document.getElementById('headerTitle').textContent;
    document.getElementById('headerTitle').textContent = l.title;
    active = true;
    $('#resshaDetailMain').hide();
    panel.hidden = false;
    panel.closest('.dialog-body').scrollTop = 0;
    back.focus();
  }
  function bind(dataset) {
    formationButton = null;
    if (dataset.source !== 'tokyu' || !dataset.tokyu_formation_request || !dataset.tokyu_vehicle_detail) return;
    let detail;
    try {detail=JSON.parse(dataset.tokyu_vehicle_detail);} catch (_) {return;}
    if (!detail?.vehicle || !Array.isArray(detail.vehicle.carDetails) || !/^[A-Za-z0-9-]{1,21}$/.test(detail.formation)) return;
    const host = document.getElementById('ryosu');
    const suffix = '（' + detail.formation + '）';
    const cars = host.textContent.endsWith(suffix) ? host.textContent.slice(0,-suffix.length) : host.textContent;
    formationButton = element('button','tokyu-formation-link',suffix);
    formationButton.type = 'button';
    formationButton.setAttribute('aria-controls','tokyuCarDetailMain');
    formationButton.title = (labels[document.documentElement.dataset.lang] || labels.ja).title;
    formationButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();show(detail,dataset);});
    host.replaceChildren(document.createTextNode(cars),formationButton);
  }
  root.TokyuCarDetail = {bind,reset};
  $(function() {
    $(document).on('click','#resshaDetail, #resshaDetail .close, #unkouInfoBtn, #trackTrainBtn',reset);
    window.addEventListener('hashchange',reset);
    document.addEventListener('keydown',event=>{
      if (active && event.key === 'Escape') {event.preventDefault();reset();formationButton?.focus();}
    });
  });
}(window));
