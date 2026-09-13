(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./toei_routes.js'));
  else root.ToeiTimetableAdapter = factory(root.ToeiRoutes);
}(typeof self !== 'undefined' ? self : this, function(catalog) {
  'use strict';
  // Cabinet Office holiday CSV, checked 2026-09-09. Unknown years fail closed.
  const holidays = new Set(('2026-01-01 2026-01-12 2026-02-11 2026-02-23 2026-03-20 2026-04-29 2026-05-03 2026-05-04 2026-05-05 2026-05-06 2026-07-20 2026-08-11 2026-09-21 2026-09-22 2026-09-23 2026-10-12 2026-11-03 2026-11-23 ' +
    '2027-01-01 2027-01-11 2027-02-11 2027-02-23 2027-03-21 2027-03-22 2027-04-29 2027-05-03 2027-05-04 2027-05-05 2027-07-19 2027-08-11 2027-09-20 2027-09-23 2027-10-11 2027-11-03 2027-11-23').split(' '));
  const cache = new Map();
  const unavailable = () => ({ rows: [], message: 'この列車に対応する都営線内の時刻表を特定できません。' });
  function serviceCalendar(date, route) {
    const stamp = Date.parse(date);
    if (!Number.isFinite(stamp)) return null;
    const jst = new Date(stamp + 9 * 3600000);
    // After midnight, late-night trains still belong to the preceding operating day.
    if (jst.getUTCHours() < 3) jst.setUTCDate(jst.getUTCDate() - 1);
    const day = jst.toISOString().slice(0, 10), year = jst.getUTCFullYear();
    if (year !== 2026 && year !== 2027) return null;
    const md = day.slice(5);
    // Do not extrapolate an unannounced New Year special timetable.
    if ((md >= '12-29' || md <= '01-03') && !(day >= '2026-01-01' && day <= '2026-01-03')) return null;
    const holiday = jst.getUTCDay() === 0 || holidays.has(day) || day <= '2026-01-04';
    const saturday = jst.getUTCDay() === 6;
    const kind = route.rosen === '144' ? (holiday ? 'Holiday' : saturday ? 'Saturday' : 'Weekday') : (holiday || saturday ? 'SaturdayHoliday' : 'Weekday');
    return { day, id: 'odpt.Calendar:' + kind };
  }
  function numberFor(number, route) {
    const value = String(number || '');
    return route.rosen === '143' ? value.replace(/^(\d+[AB])[12]$/, '$1') : value;
  }
  function normalize(data, request) {
    if (!Array.isArray(data)) throw new Error('Invalid ODPT timetable');
    const route = catalog.routes.find(r => r.rosen === String(request.rosen));
    if (!route) return unavailable();
    const calendar = serviceCalendar(request.date, route);
    if (!calendar) return unavailable();
    const number = numberFor(request.number, route);
    const matches = data.filter(r => r && r['odpt:operator'] === 'odpt.Operator:Toei' && r['odpt:railway'] === route.railway &&
      r['odpt:calendar'] === calendar.id && r['odpt:trainNumber'] === number && r['odpt:railDirection'] === request.direction &&
      (!r['dct:issued'] || String(r['dct:issued']).slice(0, 10) <= calendar.day));
    if (matches.length !== 1) return unavailable();
    const stations = new Map(route.stations.map(s => [s.id, s.name]));
    const objects = matches[0]['odpt:trainTimetableObject'];
    if (!Array.isArray(objects)) return unavailable();
    const validTime = value => /^(?:[01]\d|2[0-9]):[0-5]\d$/.test(value || '') ? value : '';
    const rows = objects.flatMap((s, index) => {
      const arrivalId = s['odpt:arrivalStation'], departureId = s['odpt:departureStation'];
      const id = departureId || arrivalId;
      if (!stations.has(id) || (arrivalId && departureId && arrivalId !== departureId)) return [];
      const arrival = validTime(s['odpt:arrivalTime']), departure = validTime(s['odpt:departureTime']);
      return arrival || departure ? [{ stationName: stations.get(id), stationKey: id + ':' + index, planArrival: arrival, planDeparture: departure }] : [];
    });
    return rows.length ? { rows, message: '', day: calendar.day } : unavailable();
  }
  async function load(request) {
    const route = catalog.routes.find(r => r.rosen === String(request.rosen));
    if (!route) return unavailable();
    const calendar = serviceCalendar(request.date, route), number = numberFor(request.number, route);
    if (!calendar || !/^[A-Za-z0-9-]{1,24}$/.test(number)) return unavailable();
    // Arakawa live vehicle numbers cannot be equated with timetable ODPTnnnn IDs.
    if (route.rosen === '144' && !/^ODPT\d+$/.test(number)) return unavailable();
    const key = [calendar.day, route.railway, number, request.direction].join('|');
    const hit = cache.get(key);
    if (hit && Date.now() - hit.time < 300000) return hit.promise;
    const promise = (async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
      try {
        const url = new URL('https://api-public.odpt.org/api/v4/odpt:TrainTimetable');
        url.searchParams.set('odpt:operator', 'odpt.Operator:Toei');
        url.searchParams.set('odpt:railway', route.railway);
        url.searchParams.set('odpt:trainNumber', number);
        url.searchParams.set('odpt:calendar', calendar.id);
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('ODPT timetable HTTP ' + response.status);
        return normalize(await response.json(), request);
      } finally { clearTimeout(timer); }
    })();
    if (cache.size > 100) cache.clear();
    cache.set(key, { time: Date.now(), promise });
    try { return await promise; } catch (error) { cache.delete(key); throw error; }
  }
  return { serviceCalendar, numberFor, normalize, load };
}));
