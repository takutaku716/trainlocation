export const LOCAL_LINES = {
  ikegami:{line:26005,prefix:'ik',section:159,stations:[23,987,988,989,973,991,992,993,994,995,996,997,998,999,496],slugs:['gotanda','osakihirokoji','togoshiginza','ebaranakanobu','hatanodai','nagahara','senzokuike','ishikawadai','yukigayaotsuka','ontakesan','kugahara','chidoricho','ikegami','hasunuma','kamata']},
  tamagawa:{line:26006,prefix:'tm',section:187,stations:[915,1002,1003,1004,1005,1006,496],slugs:['tamagawa','numabe','unoki','shimomaruko','musashinitta','yaguchinowatashi','kamata']},
  setagaya:{line:26007,prefix:'sg',section:201,stations:[943,1009,1010,1011,1012,1013,1014,1015,1016,784],slugs:['sangenjaya','nishitaishido','wakabayashi','shoinjinjamae','setagaya','kamimachi','miyanosaka','yamashita','matsubara','shimotakaido']}
};
export function convertLocalLine(rows,key){
  const route=LOCAL_LINES[key];
  if(!route)throw Error('Unknown local line');
  const trains=[],positions=new Set(),seen=new Set();
  for(const row of rows){
    const index=row.index;
    if(!Number.isInteger(index)||index<0||index>2*(route.stations.length-1))throw Error('Invalid local position');
    const n=Math.floor(index/2),station=index%2===0;
    const id=i=>route.prefix+'-'+route.slugs[i];
    const expected=station?id(n):id(n)+'_'+id(n+1);
    if(row.position_id!==expected||row.type!==(station?'STATION':'SECTION'))throw Error('Local position mismatch');
    positions.add(index);
    for(const t of row.trains||[]){
      if(t.affiliated_line_id&&t.affiliated_line_id!==route.prefix)continue;
      if(!['UP','DOWN'].includes(t.direction)||!/^\d{1,3}$/.test(String(t.tid_operation_number??'')))continue;
      const operation=Number(t.tid_operation_number),up=t.direction==='UP';
      const identity=operation+':'+up+':'+index;
      if(seen.has(identity))continue;
      seen.add(identity);
      trains.push({operation_number:operation,line_id:route.line,train_line_id:route.line,up,track_number:-1,
        kind:t.kind==='LOCAL'?'普':t.kind==='OUT_OF_SERVICE'?'回':'',
        delay_time:Math.max(0,Number(t.delay_time)||0),destination:typeof t.destination==='string'?t.destination:'',
        num_of_cars:t.number_of_cars||'',affiliation:t.tid_affiliation||'',train_orchestration_number:t.tid_orchestration_number||'',
        ...(station?{station_id:route.stations[n]}:{section_id:route.section+n})});
    }
  }
  if(positions.size!==2*route.stations.length-1)throw Error('Incomplete local positions');
  return trains;
}
