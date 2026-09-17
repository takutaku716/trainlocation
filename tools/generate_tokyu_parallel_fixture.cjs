const fs=require('node:fs');
const {routes}=require('../js/tokyu_routes');
const trains=[];
let serial=1;
for(const route of routes.filter(r=>['159','160','161','162'].includes(r.rosen))) {
  const [start,end]={159:[8,13],160:[8,13],161:[7,10],162:[15,18]}[route.rosen];
  const dtom=['161','162'].includes(route.rosen);
  const places=[];
  for(const station of route.stations) {
    places.push({index:station.index,station_id:station.id,shared:station.index>=start && station.index<=end});
    const section=Object.entries(route.sections).find(([,s])=>s.from===station.index && s.to===station.index+1);
    if(section) places.push({index:station.index,section_id:section[0],shared:station.index>=start && station.index<end});
  }
  for(const [n,place] of places.entries()) for(const up of [true,false]) {
    const counts=[[2,1],[1,2],[3,2]][n%3];
    const systems=place.shared?[[dtom?26004:26002,counts[0]],[dtom?26003:26001,counts[1]]]:[[Number(route.tidLineId),2]];
    for(const [system,count] of systems) for(let i=0;i<count;i++) {
      trains.push({line_id:Number(route.tidLineId),train_line_id:system,
        ...(place.station_id?{station_id:place.station_id}:{section_id:place.section_id}),up,
        train_number:'TEST'+String(serial++).padStart(5,'0'),operation_number:38+i,train_orchestration_number:String(38+i),
        affiliation:'急',num_of_cars:dtom?(system===26004?5:10):8,kind:i%2?'急':'普',delay_time:i===1?4:0,
        destination:up?(system===26004?'大井町':system===26002?'目黒':'渋谷'):(dtom?'溝の口':system===26002?'日吉':'元町・中華街')});
    }
  }
}
fs.mkdirSync('testdata',{recursive:true});
fs.writeFileSync('testdata/tokyu_parallel_trains.json','{\n  "testOnly": true,\n  "data": {"trains": [\n'+trains.map(t=>'    '+JSON.stringify(t)).join(',\n')+'\n  ]}\n}\n');
console.log('Generated',trains.length,'test trains.');
