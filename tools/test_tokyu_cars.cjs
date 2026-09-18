const assert = require('node:assert/strict');
const adapter = require('../js/tokyu_location_adapter');
const formations = require('../original/tokyu_formation.json');
const master = require('../original/cars_master.json');
const body = {info:['4000',{train_cars:Array.from({length:13},(_,i)=>({name:String(i+1),congestion:String(i+1)}))}]};
function train(id,cars=10) {
  const route=adapter.routeFor(id);
  return {line_id:route.tidLineId,train_line_id:route.tidLineId,station_id:route.stations[0].id,up:false,
    num_of_cars:cars,train_orchestration_number:'01',affiliation:'急',operation_number:51,train_number:'00511230',kind:'急'};
}
function normalized(id,row) {return adapter.normalize({fetchedAt:Date.now(),data:{trains:[row]}},id,formations).trains[0];}
const request=normalized(159,train(159)).tokyu.dentoRequest;
assert.equal(request.formation,'4101F');
assert.equal(request.trainLineId,'26001');
assert.equal(request.currentStation,'渋谷');
const meguro=normalized(160,train(160,8)).tokyu.dentoRequest;
assert.equal(meguro.trainLineId,'26002');
assert.ok(meguro.formation);
for (const [line,cars,name] of [[26001,10,'4101F'],[26002,8,'3101F']]) {
  const request=normalized(163,{...train(163,cars),train_line_id:line}).tokyu.dentoRequest;
  assert.equal(request.trainLineId,String(line));
  assert.equal(request.formation,name);
  assert.equal(request.currentStation,'日吉');
}
assert.equal(normalized(163,train(163,8)).tokyu.dentoRequest,null);
const converted=adapter.carsVehicleFor(body,master,request,1);
assert.deepEqual(converted.vehicle.carDetails.map(c=>c.congestion),[1,1,2,3,3,3,3,4,4,4]);
assert.ok(converted.vehicle.carDetails.some(c=>c.weakCooling));
assert.ok(converted.vehicle.carDetails.some(c=>c.freeDoors.length));
for (const code of ['11','12','13','14','15']) {
  const result=adapter.carsVehicleFor(body,master,{...request,trainOrchestrationNumber:code,formation:'41'+code+'F'},1);
  const inserted=code==='11'?[6,7]:[4,5];
  for(const number of inserted) assert.deepEqual(result.vehicle.carDetails[number-1].equipmentSlots,[null,'free','priority','priority']);
  assert.equal(result.vehicle.carDetails[8].weakCooling,true);
  assert.equal(result.vehicle.carDetails.filter(c=>c.qSeat).length,code==='11'?0:2);
}
assert.deepEqual(master.toyoko.find(row=>row.carType==='4000' && row.trainCode.includes('13')).trainCode,['12','13','14','15']);
const asymmetric = {toyoko:[{carType:'4000',numOfCars:'10',trainCode:[],cars:[{carNumber:'1',seatPosition:['優','車','F','運']}]}]};
assert.deepEqual(adapter.carsVehicleFor(body,asymmetric,request,1).vehicle.carDetails[0].equipmentSlots,['free','priority',null,'free']);
for (const number of [4111,4112,4113,4114,4115,4116]) {
  const cars=adapter.carsVehicleFor(body,master,{...request,formation:number+'F'},1).vehicle.carDetails;
  assert.deepEqual(cars.filter(c=>c.qSeat).map(c=>c.number),number>=4112 && number<=4115?[4,5]:[]);
}
assert.equal(adapter.carsVehicleFor({},master,request,1),null);
assert.ok(adapter.carsVehicleFor({info:['4000',[]]},master,request,1).vehicle.carDetails.every(c=>c.congestion===null));
assert.ok(adapter.carsVehicleFor({info:['3020',body.info[1]]},master,meguro,1).vehicle.carDetails.every(c=>c.congestion===null));
(async()=>{
  let count=0,clock=1000;
  const client=adapter.createClient({now:()=>clock,fetchImpl:async(url,options)=>{
    if(url.includes('cars_master'))return Response.json(master);
    count++;assert.equal(url,'https://cars-info.tokyuapp.com/fetchInfo');assert.equal(options.method,'POST');
    assert.equal(JSON.parse(options.body).trainLineId,'26001');assert.equal(options.credentials,'omit');
    return Response.json(body);
  }});
  const results=await Promise.all([client.loadDentoFormation(request),client.loadDentoFormation(request)]);
  assert.equal(count,1);assert.equal(results[0].formation,'4101F');
  clock+=60001;await client.loadDentoFormation(request);assert.equal(count,2);
  for(const response of [()=>new Response('',{status:503}),()=>new Response('bad'),()=>Response.json({}),()=>{throw Error('network');}]) {
    const broken=adapter.createClient({fetchImpl:async url=>url.includes('cars_master')?Response.json(master):response()});
    assert.equal(await broken.loadDentoFormation(request),null);
  }
  console.log('Toyoko/Meguro car details: request, mapping, equipment, empty data, caching and failures passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
