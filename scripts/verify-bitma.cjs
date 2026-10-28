const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
require('./floorplan-runtime.cjs');
const {bitmaGeometry}=require('../lib/floorplan/bitma-layout.ts');
const base=process.env.BITMA_BROWSER_URL||'http://127.0.0.1:3010';
const output=path.resolve(process.env.BITMA_QA_DIR||'tmp/bitma-qa');
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function world(page,x,y){return page.$eval('[data-live-map]',(svg,{x,y})=>{const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(svg.getScreenCTM());return{x:q.x,y:q.y};},{x,y});}
async function download(page,name,action){
 const before=new Map(fs.readdirSync(output).map(f=>[f,fs.statSync(path.join(output,f))]));await action();
 for(let i=0;i<600;i++){
  const file=fs.readdirSync(output).find(f=>{const st=fs.statSync(path.join(output,f)),old=before.get(f);return (!old||old.mtimeMs!==st.mtimeMs||old.size!==st.size)&&f.endsWith(path.extname(name))&&st.size>100&&!fs.existsSync(path.join(output,f+'.crdownload'));});
  if(file){const p=path.join(output,file),bytes=fs.readFileSync(p);if(name.endsWith('.pdf')&&!bytes.subarray(-1024).toString().includes('%%EOF')){await delay(100);continue;}
   fs.renameSync(p,path.join(output,name));await delay(200);return;}
  await delay(100);
 }throw Error('Download timed out: '+name);
}
async function clear(page){await page.click('[aria-label="Review selection"]');await page.waitForSelector('[aria-label="Review preview selection"]');await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Clear selection').click());}
async function main(){
 fs.mkdirSync(output,{recursive:true});
 const {default:puppeteer}=await import('puppeteer-core');
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome Beta/Application/chrome.exe',args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))requests.push(r.url());});
 page.on('console',m=>{if(m.type()==='error'&&/Received NaN|Error: <|Maximum update|Hydration/i.test(m.text()))errors.push(m.text());});
 try{
  await page.setViewport({width:1600,height:1100});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluateOnNewDocument(()=>localStorage.setItem('ecoexpo-formstudio-map-expand-v1-formstudio-floorplan','2'));
  const client=await page.createCDPSession();await client.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});
  await page.goto(base+'/#floorplan',{waitUntil:'networkidle2',timeout:120000});
  await page.waitForSelector('[data-live-map][data-stall-count="400"]',{timeout:60000});
  assert.equal(await page.$eval('[aria-label="Preview expo"]',e=>e.value),'bitma-2027','BITMA is not the default exhibition');
  assert.equal(await page.$('[aria-label="Preview expo"] option[value="dtg-2027"]'),null,'Removed DTG 2027 is still listed');
  await delay(900);
  assert(await page.$eval('[data-live-map]',s=>{const v=s.viewBox.baseVal;return v.x<=-16&&v.y<=-18&&v.x+v.width>=446&&v.y+v.height>=238;}),'Initial campus camera clipped the site plan');
  await page.screenshot({path:path.join(output,'campus.png'),fullPage:true});
  await page.click('[aria-label="Expand map"]');await page.waitForSelector('[data-map-workspace][data-stage="open"]');
  assert.equal(await page.$eval('[data-studio-navigation]',e=>getComputedStyle(e).visibility),'hidden');
  assert(await page.$eval('[data-live-map]',s=>{const v=s.viewBox.baseVal;return v.x<=-16&&v.y<=-18&&v.x+v.width>=446&&v.y+v.height>=238;}),'Fullscreen campus camera clipped a hall or the site boundary');
  await page.screenshot({path:path.join(output,'campus-expanded.png'),fullPage:true});
  await page.click('[data-map-back]');await page.waitForSelector('[data-map-workspace][data-expanded="false"]');
  await page.click('[data-bitma-hall-open="4"]');await page.waitForSelector('[data-live-map][data-stall-count="62"]');
  assert(await page.$eval('[data-live-map]',s=>{const v=s.viewBox.baseVal;return v.x<=-8&&v.y<=-10&&v.x+v.width>=77.8&&v.y+v.height>=38.04;}),'Direct hall click did not center and fit the complete hall');
  await page.select('[aria-label="BITMA hall"]','');await page.waitForSelector('[data-live-map][data-stall-count="400"]');
  const campusBooth=bitmaGeometry().stalls.find(st=>st.code==='4-A1'),campusPoint=await world(page,campusBooth.x+campusBooth.width/2,campusBooth.y+campusBooth.height/2);
  await page.mouse.click(campusPoint.x,campusPoint.y);await page.waitForSelector('[data-live-map][data-stall-count="62"]');
  assert.equal(await page.$eval('[aria-label="BITMA hall"]',e=>e.value),'4','Clicking a booth in the zoomed-out campus did not open its hall');
  await page.select('[aria-label="BITMA hall"]','');await page.waitForSelector('[data-live-map][data-stall-count="400"]');
  await page.$eval('[aria-label^="400 allocations."]',e=>e.focus());await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('[aria-label="Review selection"]').disabled);await clear(page);
  const initialView=await page.$eval('[data-live-map]',s=>s.getAttribute('viewBox'));
  const pan=await world(page,20,45);await page.mouse.move(pan.x,pan.y);await page.mouse.down();await page.mouse.move(pan.x+40,pan.y+20,{steps:8});await page.mouse.up();await delay(100);
  assert.notEqual(await page.$eval('[data-live-map]',s=>s.getAttribute('viewBox')),initialView,'Pan did not move camera');
  await page.click('[aria-label="Fit entire hall"]');await page.click('[aria-label="Zoom in"]');
  assert.notEqual(await page.$eval('[data-live-map]',s=>s.getAttribute('viewBox')),initialView,'Zoom did not move camera');
  await page.click('[aria-label="Fit entire hall"]');
  await download(page,'bitma-campus.svg',()=>page.click('[aria-label="Download SVG"]'));
  const svg=fs.readFileSync(path.join(output,'bitma-campus.svg'),'utf8');
  assert(svg.includes('data-bitma-campus'));assert(svg.includes('filter='));
  assert.equal((svg.match(/data-amenity-button=/g)||[]).length,6,'SVG omitted the food and service buttons');
  assert.equal((svg.match(/data-bitma-stair-art=/g)||[]).length,81,'SVG lost the lowered stair artwork');
  assert.equal((svg.match(/data-map-garden=/g)||[]).length,9,'Export lost a hall garden band');
  assert.equal((svg.match(/data-cargo-symbol=/g)||[]).length,4,'SVG omitted the calibrated cargo signs');
  assert(svg.includes('CARGO')&&svg.includes('ENTRY'),'SVG cargo sign text is incomplete');
  assert.equal((svg.match(/data-map-gate=/g)||[]).length,41,'SVG omitted a PDF gate');
  assert.equal((svg.match(/data-gate-badge="true"/g)||[]).length,28,'SVG omitted a public, cargo or fire-exit badge');
  assert.equal((svg.match(/data-gate-approach=/g)||[]).length,41,'SVG blocked a gate approach');
  assert(svg.includes('clip-rule="evenodd"'),'SVG lost garden gate openings');
  for(const st of bitmaGeometry().stalls)assert(svg.includes(st.code),'SVG omitted '+st.code);
  await download(page,'bitma-campus.pdf',()=>page.click('[aria-label="Print / PDF"]'));
  for(const [id,count] of [['1',9],['2',9],['3',9],['4',62],['1A',27],['6',20],['2A',14],['4A',80],['EZ',170]]){
   await page.select('[aria-label="BITMA hall"]',id);await page.waitForSelector(`[data-live-map][data-stall-count="${count}"]`);await delay(300);
   const expected=bitmaGeometry(id).layout.siteGates;
   const actual=await page.$$eval('[data-live-map] [data-map-gate]',nodes=>nodes.map(n=>({id:n.getAttribute('data-map-gate'),kind:n.getAttribute('data-gate-kind'),side:n.getAttribute('data-gate-side')})));
   assert.deepEqual(actual,expected.map(g=>({id:g.id,kind:g.kind,side:g.side})),`Hall ${id} gates differ from the PDF inventory`);
   assert.equal(await page.$$eval('[data-live-map] [data-gate-badge]',nodes=>nodes.length),expected.filter(g=>['entry','exit','fire-exit','cargo'].includes(g.kind)).length);
   assert.equal(await page.$$eval('[data-live-map] [data-amenity-button]',nodes=>nodes.length),['2','3','4'].includes(id)?2:0,`Hall ${id} amenity buttons are missing or misplaced`);
   assert.equal(await page.$$eval('[data-live-map] [data-bitma-stair-art]',nodes=>nodes.length),bitmaGeometry(id).layout.siteArt.filter(a=>a.kind==='stairs').length,`Hall ${id} stair shape was not kept visible`);
   assert(await page.$eval('[data-live-map]',svg=>{
    const badge=svg.querySelector('[data-gate-badge]'),booths=[...svg.querySelectorAll('[data-item]')];
    return !badge||!booths.length||!!(booths.at(-1).compareDocumentPosition(badge)&Node.DOCUMENT_POSITION_FOLLOWING);
   }),'Gate labels must be drawn above booth surfaces');
   await page.screenshot({path:path.join(output,`hall-${id}.png`),fullPage:true});
  }
  await page.select('[aria-label="BITMA hall"]','4');await page.waitForSelector('[data-live-map][data-stall-count="62"]');await delay(400);
  const hall=bitmaGeometry('4'),a=hall.stalls.find(s=>s.code==='4-A1'),b=hall.stalls.find(s=>s.code==='4-A2');
  await page.click('[aria-label="Select booth area"]');await page.keyboard.press('Escape');
  assert.equal(await page.$eval('[aria-label="Select booth area"]',b=>b.getAttribute('aria-pressed')),'false');
  await page.click('[aria-label="Select booth area"]');await delay(100);
  const start=await world(page,a.x+.05,a.y+.05),end=await world(page,b.x+b.width-.05,b.y+b.height-.05);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:12});
  await page.waitForSelector('[data-area-selection]');
  assert.equal(await page.$eval('[data-area-selection]',r=>Number(r.getAttribute('fill-opacity'))),.24);
  assert(await page.$eval('[data-area-selection]',r=>['x','y','width','height'].every(k=>Number.isFinite(Number(r.getAttribute(k))))),'Area selection has invalid coordinates');
  await page.screenshot({path:path.join(output,'soft-area-selection.png'),fullPage:true});await page.mouse.up();
  await page.waitForFunction(()=>document.querySelector('[data-map-footer]').innerText.includes('2 allocations · 11.89 m²'));
  await page.click('[aria-label="Review selection"]');await page.waitForSelector('[aria-label="Review preview selection"]');
  assert((await page.$eval('[aria-label="Review preview selection"]',e=>e.innerText)).includes('Pricing not supplied'));
  await page.screenshot({path:path.join(output,'review.png'),fullPage:true});
  await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"] button')].find(b=>b.textContent.trim()==='Close').click());
  await download(page,'bitma-hall4-selection.pdf',()=>page.click('[aria-label="Print / PDF"]'));
  await page.click('[aria-label="Hold stalls · preview"]');await page.waitForFunction(()=>document.querySelector('[data-map-footer]').innerText.includes('Preview hold saved'));
  const key=await page.evaluate(()=>Object.keys(sessionStorage).find(k=>k.includes('holds')&&k.includes('bitma-2027')));
  assert(key,'BITMA hold key not found');
  const holds=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key);
  assert.equal(holds[0].stallIds.length,2);assert(Math.abs(Date.parse(holds[0].expiresAt)-Date.now()-86400000)<10000);
  await page.select('[aria-label="BITMA hall"]','1');await page.waitForSelector('[data-live-map][data-stall-count="9"]');
  const st=bitmaGeometry('1').stalls.find(s=>s.code==='1/36-57');
  let p=await world(page,st.x+16,st.y+1);await page.mouse.click(p.x,p.y);
  assert.equal(await page.$eval('[aria-label="Review selection"]',b=>b.disabled),true,'Empty notch became selected');
  p=await world(page,st.x+5,st.y+5);await page.mouse.click(p.x,p.y);
  await page.waitForFunction(()=>document.querySelector('[data-map-footer]').innerText.includes('192.00 m²'));
  await page.screenshot({path:path.join(output,'composite-selected.png'),fullPage:true});
  await download(page,'bitma-composite.pdf',()=>page.click('[aria-label="Print / PDF"]'));await clear(page);
  await page.select('[aria-label="BITMA hall"]','4');await page.waitForSelector('[data-live-map][data-stall-count="62"]');await delay(200);
  p=await world(page,a.x+1,a.y+1);await page.mouse.click(p.x,p.y);
  await page.waitForFunction(()=>document.querySelector('[data-map-footer]').innerText.includes('Your preview hold'));
  assert.equal(await page.$eval('[aria-label="Review selection"]',b=>b.disabled),true);
  await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('[aria-label="Preview expo"]');await page.select('[aria-label="Preview expo"]','bitma-2027');
  await page.waitForSelector('[data-live-map][data-stall-count="400"]');
  assert.deepEqual(await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),key),holds);
  await page.evaluate(key=>{const h=JSON.parse(sessionStorage.getItem(key));h[0].expiresAt='2000-01-01T00:00:00Z';sessionStorage.setItem(key,JSON.stringify(h));},key);
  await page.select('[aria-label="BITMA hall"]','4A');await page.waitForSelector('[data-live-map][data-stall-count="80"]');
  await page.waitForFunction(key=>JSON.parse(sessionStorage.getItem(key)).length===0,{},key);
  const gaps=await page.$$eval('[data-live-map] [data-gap-metres]',nodes=>nodes.map(n=>[n.dataset.gapAxis,Number(n.dataset.gapStart).toFixed(2),Number(n.dataset.gapEnd).toFixed(2)].join('|')));
  assert.equal(gaps.length,new Set(gaps).size);
  await page.click('[aria-label="Show 2D"]');assert(await page.$('[aria-label="Show 2.5D"]'));
  await page.click('[aria-label="Show 2.5D"]');
  await page.click('[aria-label="Expand map"]');await page.waitForSelector('[data-map-workspace][data-stage="open"]');
  assert.equal(await page.$eval('[data-studio-navigation]',e=>getComputedStyle(e).visibility),'hidden');
  await page.screenshot({path:path.join(output,'expanded.png'),fullPage:true});
  await download(page,'bitma-hall4a.pdf',()=>page.click('[aria-label="Print / PDF"]'));
  await page.click('[data-map-back]');await page.waitForSelector('[data-map-workspace][data-expanded="false"]');
  await page.setViewport({width:390,height:844});await delay(500);
  await page.click('[aria-label="Fit entire hall"]');await delay(100);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await page.screenshot({path:path.join(output,'mobile.png'),fullPage:true});
  await page.select('[aria-label="Preview expo"]','dta-2026');await page.waitForSelector('[data-live-map][data-stall-count="375"]');
  assert(await page.$('[aria-label="Exhibition and pavilion navigation"]'));
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('PASS 9 hall views, 400 SVG allocations, soft area selection, exact area totals, review, 24h holds/persistence/expiry/isolation, notch hit testing, gap deduplication, 2D/2.5D, fullscreen, mobile, SVG and 4 PDF downloads.');
  console.log('Evidence: '+output);
 }catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});console.error((await page.$eval('body',e=>e.innerText)).slice(-2500));throw e;}
 finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
