require('./floorplan-runtime.cjs');
const assert=require('node:assert/strict');
const clipping=require('polygon-clipping');
const {bitmaGeometry,bitmaSource,BITMA_CAMPUS}=require('../lib/floorplan/bitma-layout.ts');
const {corners,footprintArea,footprintPolygon,multiArea}=require('../lib/floorplan/map-geometry.ts');
const {allocationsInArea,pointInAllocation}=require('../lib/floorplan/map-selection.ts');
const {measuredGaps}=require('../lib/floorplan/map-dimensions.ts');
const {joinedEdges}=require('../lib/floorplan/map-structure.ts');
const {validPreviewHolds,previewHoldKey}=require('../lib/floorplan/map-experience.ts');
const {gateSpan,wallSegments,gateApproach,gateBadge,gateBadgeAngle,gateBadgeFontSize}=require('../lib/floorplan/map-gates.ts');
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name)};
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
const g=bitmaGeometry();
test('site perimeter encloses every hall and facility without any area overlap',()=>{
 const polygon=BITMA_CAMPUS.boundary;
 const inside=(x,y)=>{let value=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)value=!value;
 }return value;};
 const intersects=(a,b)=>a.x<b.x+b.width-1e-7&&a.x+a.width>b.x+1e-7&&a.y<b.y+b.height-1e-7&&a.y+a.height>b.y+1e-7;
 const areas=[...g.layout.siteHalls.map(h=>({...h,id:`hall-${h.id}`})),...BITMA_CAMPUS.features];
 for(const area of areas){
  for(const [x,y] of [[area.x,area.y],[area.x+area.width,area.y],[area.x,area.y+area.height],[area.x+area.width,area.y+area.height]])assert(inside(x,y),`${area.id} lies outside the campus perimeter`);
 }
 for(let i=0;i<areas.length;i++)for(let j=i+1;j<areas.length;j++)assert(!intersects(areas[i],areas[j]),`${areas[i].id} overlaps ${areas[j].id}`);
 for(const hall of g.layout.siteHalls){const clear={...hall,x:hall.x-2,y:hall.y-2,width:hall.width+4,height:hall.height+4};for(const feature of BITMA_CAMPUS.features)assert(!intersects(clear,feature),`${feature.id} enters Hall ${hall.id}'s 2m clear zone`);}
});
test('campus locations follow the supplied site-plan order without altering source coordinates',()=>{
 assert.equal(g.layout.width,430);assert.equal(g.layout.height,220);
 for(const hall of bitmaSource.halls){
  const site=g.layout.siteHalls.find(item=>item.id===hall.id),target=BITMA_CAMPUS.origins[hall.id];
  assert.deepEqual({x:site.x,y:site.y},target);
  for(const booth of bitmaSource.booths.filter(item=>item.hall===hall.id)){
   const shown=g.stalls.find(item=>item.code===booth.code);
   near(shown.x,booth.x+target.x-hall.x);near(shown.y,booth.y+target.y-hall.y);
  }
 }
});
test('all nine halls and 400 reviewed allocations are present',()=>{
 assert.equal(g.stalls.length,400);assert.equal(g.layout.siteHalls.length,9);
 const counts=Object.fromEntries(bitmaSource.halls.map(h=>[h.id,bitmaSource.booths.filter(b=>b.hall===h.id).length]));
 assert.deepEqual(counts,{'1':9,'2':9,'3':9,'4':62,'6':20,'1A':27,'2A':14,'4A':80,'EZ':170});
});

test('all 41 PDF access openings retain their hall, side and measured source position',()=>{
 const expected={
  '1':{north:[9,31.812,51.576],south:[26.562],west:[3]},
  '2':{north:[9,31.812,51.576],south:[26.562],west:[3]},
  '3':{north:[9,31.812,51.576],south:[26.562],west:[3]},
  '4':{north:[9,18,35.168,57.98],south:[34.529],west:[3]},
  '1A':{north:[12.447,29.259],south:[6,30]},'6':{south:[6]},
  '2A':{north:[6.121],south:[6.121]},'4A':{south:[3,9]},
  EZ:{north:[51.01,101.007,161.004,201.002],south:[25.914,145.671,206],west:[20.037],east:[5.018,20.012,40.004]}
 };
 assert.equal(g.layout.siteGates.length,41);
 for(const [hall,sides] of Object.entries(expected)){
  const gates=bitmaGeometry(hall).layout.siteGates;
  assert.equal(gates.length,Object.values(sides).flat().length);
  for(const [side,starts] of Object.entries(sides)){
   const actual=gates.filter(g=>g.side===side).sort((a,b)=>a.sourceStart-b.sourceStart);
   assert.equal(actual.length,starts.length);
   actual.forEach((g,i)=>assert(Math.abs(g.sourceStart-starts[i])<.001,`${g.id} moved`));
  }
 }
});

test('gate roles preserve source distinctions without inventing an extra Hall 6 exit',()=>{
 const gates=g.layout.siteGates;
 const counts=Object.fromEntries(['entry','exit','fire-exit','cargo','service','access'].map(k=>[k,gates.filter(g=>g.kind===k).length]));
 assert.deepEqual(counts,{entry:10,exit:9,'fire-exit':7,cargo:2,service:4,access:9});
 assert.equal(gates.filter(g=>g.roles.includes('fire-exit')).length,8);
 assert.deepEqual(gates.filter(g=>g.hall==='6').map(g=>g.kind),['entry']);
 for(const gate of gates.filter(g=>g.kind==='service')){near(gate.clearance.widthM,2.286);near(gate.clearance.heightM,2.7432);}
 assert.equal(gates.find(g=>g.hall==='EZ'&&g.sourceSide==='east'&&g.kind==='entry').sourceStart,40.003886);
});

test('campus and hall orientation keep every gate opening clear of walls and gardens',()=>{
 for(const scope of ['',...bitmaSource.halls.map(h=>h.id)]){
  const layout=bitmaGeometry(scope).layout;
  for(const h of layout.siteHalls){
   const walls=wallSegments(h,layout.siteGates);
   for(const gate of layout.siteGates.filter(g=>g.hall===h.id)){
    const span=gateSpan(h,gate),approach=gateApproach(h,gate);
    assert.equal(gate.sourceSide,scope?gate.side:gate.sourceSide);
    assert(span.end>span.start);near(span.end-span.start,gate.sourceSpanM);
    assert(approach.width>0&&approach.height>0);
    for(const wall of walls.filter(w=>w.side===span.side))assert(Math.min(wall.end,span.end)-Math.max(wall.start,span.start)<1e-6,gate.id+' blocked by wall');
   }
  }
 }
});
test('entry, exit and cargo badges are aligned, readable and fully outside rentable hall space',()=>{
 for(const scope of ['',...bitmaSource.halls.map(h=>h.id)]){
  const layout=bitmaGeometry(scope).layout;
  for(const g0 of layout.siteGates.filter(g=>['entry','exit','fire-exit','cargo'].includes(g.kind))){
   const h=layout.siteHalls.find(item=>item.id===g0.hall),g=g0,b=gateBadge(h,g),span=gateSpan(h,g);
   if(span.side==='north'){assert(b.y+b.height< h.y);near(b.x,h.x+span.start);near(b.width,span.end-span.start);}
   if(span.side==='south'){assert(b.y>h.y+h.height);near(b.x,h.x+span.start);near(b.width,span.end-span.start);}
   if(span.side==='west'){assert(b.x+b.width<h.x);near(b.y,h.y+span.start);near(b.height,span.end-span.start);}
   if(span.side==='east'){assert(b.x>h.x+h.width);near(b.y,h.y+span.start);near(b.height,span.end-span.start);}
   assert(gateBadgeFontSize(g)>0&&gateBadgeFontSize(g)<=.62);
   assert.equal(gateBadgeAngle(g.side),g.side==='north'||g.side==='south'?0:-90);
   for(const st of bitmaGeometry(scope).stalls.filter(item=>item.groupId===`bitma-hall-${g.hall}`))
    assert(b.x+b.width<=st.x+1e-6||b.x>=st.x+st.width-1e-6||b.y+b.height<=st.y+1e-6||b.y>=st.y+st.height-1e-6,`${g.id} badge overlaps ${st.code}`);
  }
 }
});
test('cargo signs reproduce the reference triangle at each source hall without touching the heading',()=>{
 assert.equal(bitmaSource.symbols.length,4);
 for(const symbol of bitmaSource.symbols){
  assert.equal(symbol.kind,'cargo-entry');
  const h=bitmaSource.halls.find(item=>item.id===symbol.hall);assert(h);
  const rotated=symbol.rotation!==0,halfH=(rotated?symbol.width:symbol.height)/2;
  assert(symbol.y-halfH>h.y-6,`${symbol.hall} cargo sign touches the hall heading`);
  assert(symbol.width>=5&&symbol.height>=3.5,'Cargo sign lost its label space');
 }
});
test('food court and service booth buttons stay on the landscaped edge and away from booths',()=>{
 for(const id of ['2','3','4']){
  const map=bitmaGeometry(id),h=map.layout.siteHalls[0],signs=map.layout.siteSigns;
  for(const labels of [['FOOD','COURT'],['SERVICE','BOOTH']]){
   const pair=signs.filter(s=>s.hall===id&&labels.includes(s.label));assert.equal(pair.length,2);
   const center=pair.reduce((sum,s)=>sum+s.y,0)/pair.length;
   const box={x:h.x-2.85,y:center-1.225,width:2.5,height:2.45};
   assert(box.x>=h.x-3&&box.x+box.width<h.x,'amenity button is outside or over the hall');
   for(const st of map.stalls)assert(box.x+box.width<=st.x+1e-6||box.x>=st.x+st.width-1e-6||box.y+box.height<=st.y+1e-6||box.y>=st.y+st.height-1e-6,`${id} amenity button overlaps ${st.code}`);
  }
 }
});
test('stair artwork is identified and offset down from its source position',()=>{
 assert(bitmaSource.art.some(a=>a.kind==='stairs'));
 for(const id of ['1','2','3','4']){
  const obstacle=bitmaGeometry(id).layout.siteObstacles[0];
  const original=bitmaSource.obstacles.find(o=>o.hall===id);
  const h=bitmaGeometry(id).layout.siteHalls[0];
  const campus=bitmaSource.halls.find(item=>item.id===id);
  const expected=h.northRotation?original.x-campus.x:original.y-campus.y;
  near(obstacle.y,expected+.65);
 }
});
test('every allocation has a unique stable physical identity',()=>{
 assert.equal(new Set(g.stalls.map(s=>s.id)).size,400);
 assert.deepEqual(g.stalls.map(s=>s.id),bitmaGeometry().stalls.map(s=>s.id));
});
test('source architectural paths stay attached to their own hall',()=>{
 for(const art of bitmaSource.art){const h=bitmaSource.halls.find(h=>h.id===art.hall);assert(h);
  const points=[...art.d.matchAll(/(-?\d+\.\d+),(-?\d+\.\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  assert(points.length);
  for(const [x,y] of points)assert(x>=h.x-5&&x<=h.x+h.width+5&&y>=h.y-8&&y<=h.y+h.height+5,`${art.hall} has detached architecture`);
 }
});
test('Hall 1A and Hall 6 retain the user-confirmed 37 by 44 metre internal size',()=>{
 for(const id of ['1A','6']){const h=bitmaGeometry(id).hall;near(h.width,37);near(h.height,44);}
});
test('every polygon stays inside its independently calibrated hall',()=>{
 for(const st of g.stalls){const h=g.layout.siteHalls.find(h=>h.name===st.zone);assert(h);
  for(const [x,y] of corners(st))assert(x>=h.x-1e-6&&y>=h.y-1e-6&&x<=h.x+h.width+1e-6&&y<=h.y+h.height+1e-6,st.code);}
});
test('no two rentable allocations overlap in any hall',()=>{
 for(let i=0;i<g.stalls.length;i++)for(const b of g.stalls.slice(i+1)){
  const a=g.stalls[i];if(a.zone!==b.zone)continue;
  assert(multiArea(clipping.intersection(footprintPolygon(a),footprintPolygon(b)))<1e-6,`${a.code} overlaps ${b.code}`);
 }
});
test('campus and source-oriented hall views preserve every footprint area and identity',()=>{
 for(const h of bitmaSource.halls)for(const st of bitmaGeometry(h.id).stalls){
  const campus=g.stalls.find(s=>s.id===st.id);assert(campus);near(footprintArea(st),footprintArea(campus));
  assert(st.x>=-1e-6&&st.y>=-1e-6);assert(st.x+st.width<=h.sourceWidth+1e-6);assert(st.y+st.height<=h.sourceLength+1e-6);
 }
});
test('8 by 8 foot Hall 4 booths retain exact imperial conversion',()=>{
 const small=g.stalls.filter(s=>s.dimensionLabel==='8 × 8 ft');assert.equal(small.length,27);
 for(const st of small){near(st.width,2.4384);near(st.height,2.4384);near(footprintArea(st),64*.09290304);}
});
test('192 sqm composite allocations preserve their notch and exposed edges',()=>{
 for(const h of ['1','2','3']){const local=bitmaGeometry(h),st=local.stalls.find(s=>s.code===h+'/36-57');
  near(footprintArea(st),192);assert.equal(st.footprintPoints.length,6);
  assert.deepEqual(allocationsInArea([st],{x:st.x+15.2,y:st.y+.2,w:2,h:1}),[]);
  assert.equal(pointInAllocation(st,{x:st.x+16,y:st.y+1}),false);
  assert.equal(pointInAllocation(st,{x:st.x+16,y:st.y+3}),true);
  assert.deepEqual(allocationsInArea([st],{x:st.x+.2,y:st.y+.2,w:1,h:1}),[st.id]);
  assert(joinedEdges([st],local.layout).length>=2);
 }
});
test('Expo Zone corner allocations remain 27 sqm L shapes',()=>{
 for(const code of ['EZ-R77-79','EZ-L78-80'])near(footprintArea(g.stalls.find(s=>s.code===code)),27);
});
test('Hall 4A has eighty 6.25 sqm booths with exact centre aisles',()=>{
 const h=bitmaGeometry('4A');for(const st of h.stalls)near(footprintArea(st),6.25);
 near(h.stalls.reduce((n,s)=>n+footprintArea(s),0),500);
 const get=code=>h.stalls.find(s=>s.code===code);
 near(get('4A-A20').x-(get('4A-L20').x+2.5),2);
 near(get('4A-R20').x-(get('4A-B20').x+2.5),2);
 near(get('4A-A11').y-get('4A-A12').y-2.5,2.5);
});
test('Hall 2A fits 176 feet while preserving every 6m/9m allocation and 1.22m aisle',()=>{
 const h=bitmaGeometry('2A');near(h.hall.height,176*.3048);
 near(h.stalls.find(s=>s.code==='2A/25-30').y,1.2724);
 near(h.stalls.find(s=>s.code==='2A/31-34').x-h.stalls.find(s=>s.code==='2A/25-30').x-6,2.5);
 near(h.stalls.find(s=>s.code==='2A/21-24').y-h.stalls.find(s=>s.code==='2A/25-30').y-9,1.22);
});
test('repeated aisle labels collapse to one line per shared corridor',()=>{
 const h=bitmaGeometry('4A'),gaps=measuredGaps(h.layout,h.stalls);
 const keys=gaps.map(d=>`${d.axis}|${d.a.toFixed(2)}|${d.b.toFixed(2)}`);
 assert.equal(new Set(keys).size,keys.length);
 assert.equal(gaps.filter(d=>d.axis==='x'&&Math.abs(d.b-d.a-2)<1e-6).length,2);
});
test('campus gap annotations never measure the illustrative distance between halls',()=>{
 for(const d of measuredGaps(g.layout,g.stalls))assert(g.layout.siteHalls.some(h=>d.box.x>=h.x-1e-6&&d.box.y>=h.y-1e-6&&d.box.x+d.box.width<=h.x+h.width+1e-6&&d.box.y+d.box.height<=h.y+h.height+1e-6));
});
test('stairs and non-rentable source structures are not labelled as clear aisles',()=>{
 for(const id of ['1','2','3','4']){const h=bitmaGeometry(id),gaps=measuredGaps(h.layout,h.stalls);
  for(const d of gaps)for(const o of h.layout.siteObstacles){const b=d.box;
   assert(!(b.x<o.x+o.width&&b.x+b.width>o.x&&b.y<o.y+o.height&&b.y+b.height>o.y));}
 }
});
test('area selection returns only actual intersecting footprints',()=>{
 const h=bitmaGeometry('4A');assert.equal(allocationsInArea(h.stalls,{x:.4,y:.6,w:2.7,h:5.2}).length,2);
 assert.deepEqual(allocationsInArea(h.stalls,{x:3.2,y:4,w:1.5,h:3}),[]);
});
test('BITMA simulated holds are isolated and survive switching hall views',()=>{
 assert.notEqual(previewHoldKey('formstudio-floorplan'),previewHoldKey('formstudio-floorplan-bitma-2027'));
 const ids=[g.stalls.find(s=>s.zone==='Hall 1').id,g.stalls.find(s=>s.zone==='Hall 4').id];
 const holds=[{id:'qa',stallIds:ids,expiresAt:new Date(Date.now()+86400000).toISOString()}];
 assert.deepEqual(validPreviewHolds(holds,g.stalls,new Set())[0].stallIds,ids);
 assert.deepEqual(validPreviewHolds([{...holds[0],expiresAt:'2000-01-01'}],g.stalls,new Set()),[]);
});
test('unprovided prices remain unset rather than fabricated',()=>assert(g.stalls.every(st=>st.price===0)));
console.log(`${count} BITMA checks passed`);
