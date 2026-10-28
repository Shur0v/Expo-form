require('./floorplan-runtime.cjs');
const assert=require('node:assert/strict');
const clipping=require('polygon-clipping');
const {bitmaGeometry,bitmaSource}=require('../lib/floorplan/bitma-layout.ts');
const {corners,footprintArea,footprintPolygon,multiArea}=require('../lib/floorplan/map-geometry.ts');
const {allocationsInArea,pointInAllocation}=require('../lib/floorplan/map-selection.ts');
const {measuredGaps}=require('../lib/floorplan/map-dimensions.ts');
const {joinedEdges}=require('../lib/floorplan/map-structure.ts');
const {validPreviewHolds,previewHoldKey}=require('../lib/floorplan/map-experience.ts');
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name)};
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
const g=bitmaGeometry();
test('all nine halls and 400 reviewed allocations are present',()=>{
 assert.equal(g.stalls.length,400);assert.equal(g.layout.siteHalls.length,9);
 const counts=Object.fromEntries(bitmaSource.halls.map(h=>[h.id,bitmaSource.booths.filter(b=>b.hall===h.id).length]));
 assert.deepEqual(counts,{'1':9,'2':9,'3':9,'4':62,'6':20,'1A':27,'2A':14,'4A':80,'EZ':170});
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
