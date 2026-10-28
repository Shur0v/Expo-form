const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.OFFER_BROWSER_URL || 'http://127.0.0.1:3010';
const reference = process.env.OFFER_REFERENCE_URL;
const output = path.resolve(process.env.OFFER_QA_DIR || 'tmp/offerletter-qa');
const recordKey = 'ecoexpo-formstudio-offers-v1';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw Error('Offer browser QA must use an isolated localhost app.');

async function clickText(page, text, selector = 'button') {
  await page.evaluate(({ text, selector }) => {
    const element = [...document.querySelectorAll(selector)].find(e => e.textContent.trim() === text);
    if (!element) throw Error('Missing control: ' + text);
    element.click();
  }, { text, selector });
}
async function fill(page, label, value, paste = false) {
  await page.bringToFront();
  const input = await page.waitForSelector(`[aria-label="${label}"]`);
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control');
  if (paste) await page.keyboard.sendCharacter(value); else await input.type(value);
  assert.equal(await page.$eval(`[aria-label="${label}"]`, input => input.value), value, 'Field entry: ' + label);
}
async function artworkReady(page) {
  await page.waitForSelector('[data-offerletter]');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('[data-offerletter] img')].map(image => image.decode()));
  });
}
async function savePaper(page, name) {
  await artworkReady(page);
  await (await page.$('[data-offerletter]')).screenshot({ path: path.join(output, name + '.png') });
  await page.pdf({ path: path.join(output, name + '.pdf'), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
}
async function download(page, filename, action) {
  const before = new Set(fs.readdirSync(output));
  await action();
  for (let attempt = 0; attempt < 600; attempt++) {
    const file = fs.readdirSync(output).find(file => !before.has(file) && file.endsWith('.pdf') && fs.statSync(path.join(output, file)).size > 0 && !fs.existsSync(path.join(output, file + '.crdownload')));
    if (file) {
      const bytes = fs.readFileSync(path.join(output, file));
      if (bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(Math.max(0, bytes.length - 1024)).toString().includes('%%EOF')) {
        fs.renameSync(path.join(output, file), path.join(output, filename));
        await page.waitForFunction(() => !document.querySelector('button[aria-busy="true"]') && !document.querySelector('[data-pdf-form-id]'));
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('PDF download did not complete: ' + filename);
}
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const { default: puppeteer } = await import('puppeteer-core');
  const executablePath = process.env.CHROME_PATH || [
    'C:/Program Files/Google/Chrome Beta/Application/chrome.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
  ].find(file => fs.existsSync(file));
  if (!executablePath) throw Error('Set CHROME_PATH to an installed Chrome/Chromium executable.');
  const browser = await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-background-timer-throttling'] });
  let page;
  try {
    if (reference) {
      assert(['127.0.0.1', 'localhost'].includes(new URL(reference).hostname));
      const source = await browser.newPage();
      await source.setViewport({ width: 1800, height: 1500 });
      await source.goto(reference, { waitUntil: 'networkidle2', timeout: 120000 });
      await source.waitForSelector('[data-offerletter]', { timeout: 60000 });
      await source.click('[aria-label="Hide QR verification"]');
      await savePaper(source, 'reference-default');
      await source.screenshot({ path: path.join(output, 'reference-workspace.png'), fullPage: true });
      await source.close();
    }
    page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1500 });
    const errors = [], apiRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
    const client = await page.createCDPSession();
    await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: output });
    await page.goto(base + '/#offer-letter', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('[data-offerletter]', { timeout: 60000 });
    assert(await page.evaluate(() => {
      const original = window.print;
      let called = false;
      window.print = () => { called = true; };
      try { document.querySelector('[aria-label="A4 offer letter"] button').click(); return called; }
      finally { window.print = original; }
    }), 'The source print control is not connected');
    assert.equal(await page.$eval('[aria-label="Studio pages"] [aria-current="page"]', element => element.textContent.trim()), 'Offer letter');
    await page.click('[aria-label="Hide QR verification"]');
    await savePaper(page, 'studio-default');
    await page.screenshot({ path: path.join(output, 'studio-workspace.png'), fullPage: true });

    await page.select('[aria-label="Send to"]', 'company');
    await clickText(page, 'Save draft');
    await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('company name'));
    await fill(page, 'Company name', 'Offer QA Company');
    await fill(page, 'Total space (sqm)', '36');
    await fill(page, 'Special discount (%)', '5');
    await fill(page, 'Proposed stall position', 'EZ-B 221–224');
    await page.waitForFunction(() => document.querySelector('[data-offerletter]').innerText.includes('USD 10,944'));
    assert((await page.$eval('[data-offerletter]', element => element.innerText)).includes('USD 4,377.60'));
    await clickText(page, 'Signatory & stamp', 'summary');
    await (await page.$('input[type="file"]')).uploadFile(path.resolve('public/assets/offerletter/eco-expo-seal.png'));
    await page.waitForSelector('[data-offerletter] img[alt="Eco Expo organizer seal"][src^="blob:"]');
    await clickText(page, 'Save draft');
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key) || '[]').some(record => record.fields.Company === 'Offer QA Company'), {}, recordKey);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[aria-label="Company name"]');
    assert.equal(await page.$eval('[aria-label="Company name"]', input => input.value), 'Offer QA Company');
    await page.waitForSelector('[data-offerletter] img[alt="Eco Expo organizer seal"][src^="blob:"]');
    if (await page.$eval('[aria-label="Hide QR verification"]', input => input.checked)) await page.click('[aria-label="Hide QR verification"]');
    await clickText(page, 'Issue offer');
    await page.waitForSelector('[aria-label="Issue offer confirmation"]');
    await clickText(page, 'Confirm issue');
    await page.waitForSelector('[data-offerletter] [aria-label="Check offer authenticity"] img', { timeout: 30000 });
    assert.equal(await page.$eval('[aria-label="Company name"]', input => input.disabled), true);
    const issued = await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0], recordKey);
    assert.equal(issued.status, 'Issued');
    await savePaper(page, 'studio-issued');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'studio-issued-workspace.png'), fullPage: true });
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.evaluate(() => innerWidth), 390, 'The mobile layout viewport changed');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile offer page overflowed before capture');
    await page.screenshot({ path: path.join(output, 'studio-mobile.png'), fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile offer page overflowed');
    assert.equal(await page.evaluate(() => innerWidth), 390, 'The mobile capture changed the viewport');
    assert(await page.$eval('[aria-label="Studio pages"] [aria-current="page"]', element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), 'Active mobile tab is offscreen');

    const href = await page.$eval('[data-offerletter] [aria-label="Check offer authenticity"]', link => link.getAttribute('href'));
    const verification = await browser.newPage();
    await verification.goto(base + href, { waitUntil: 'networkidle2', timeout: 120000 });
    await verification.waitForFunction(() => document.body.innerText.includes('Verified · Issued by ECO Expo'));
    assert((await verification.$eval('body', body => body.innerText)).includes('Local records cannot authenticate a production offer'));
    await page.setViewport({ width: 1440, height: 1500 });
    await clickText(page, 'Revoke offer');
    await page.waitForSelector('[aria-label="Revoke offer confirmation"]');
    await clickText(page, 'Confirm revoke');
    await verification.waitForFunction(() => document.body.innerText.includes('Revoked · This offer is no longer valid'));
    const revoked = await page.evaluate(key => JSON.parse(localStorage.getItem(key))[0], recordKey);
    assert.deepEqual(revoked.fields, issued.fields);
    await verification.close();

    await clickText(page, 'New Borthers Machinery · Hall 4 offer');
    assert.equal(await page.$eval('[aria-label="Company name"]',input=>input.value),'Borthers Machinery');
    assert.equal(await page.$eval('[aria-label="Contact person"]',input=>input.value),'Ohaidur Rahman');
    assert.equal(await page.$eval('[aria-label="Designation"]',input=>input.value),'Managing Partner');
    assert.equal(await page.$eval('[aria-label="Total space (sq. ft.)"]',input=>input.value),'128');
    assert.equal(await page.$eval('[aria-label="Price per stall"]',input=>input.value),'2000');
    await page.select('[aria-label="Measurement unit"]','sqm');
    assert.equal(await page.$eval('[aria-label="Stall width (m)"]',input=>input.value),'2.4384');
    assert((await page.$eval('[data-offerletter]',e=>e.innerText)).includes('USD 3,600'));
    await page.select('[aria-label="Measurement unit"]','sqft');
    await fill(page,'Number of stalls','3');
    assert.equal(await page.$eval('[aria-label="Total space (sq. ft.)"]',input=>input.value),'192');
    assert((await page.$eval('[data-offerletter]',e=>e.innerText)).includes('USD 5,400'));
    await fill(page,'Number of stalls','2');
    await clickText(page,'Save draft');
    await page.reload({waitUntil:'networkidle2'});
    await page.waitForSelector('[aria-label="Total space (sq. ft.)"]');
    assert.equal(await page.$eval('[aria-label="Total space (sq. ft.)"]',input=>input.value),'128');
    await clickText(page,'Issue offer'); await clickText(page,'Confirm issue');
    await page.waitForSelector('[data-offerletter] [aria-label="Check offer authenticity"] img');
    await savePaper(page,'borthers-hall4');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(output,'borthers-workspace.png'),fullPage:true});

    await page.click('[aria-label="Studio pages"] a[href="#top"]');
    await page.waitForSelector('[data-exhibition-sheet]');
    for (const [index, code] of ['DTA 2027', 'DCC 2027', 'DME 2027'].entries()) {
      await page.evaluate(code => [...document.querySelectorAll('[aria-label="Registration form templates"] button')].find(button => button.textContent.trim() === code).click(), code);
      await download(page, `registration-${index + 1}.pdf`, () => clickText(page, 'Print / Export PDF'));
    }
    await fill(page, 'companyName', 'Registration QA Company', true);
    // Retired bookmarks fall back to registration; neither navigation exposes the removed page.
    await page.evaluate(()=>{location.hash='#barter-agreement';});
    await page.waitForSelector('[data-exhibition-sheet]');
    assert.equal(await page.$$eval('a[href="#barter-agreement"]',links=>links.length),0);
    assert.equal(await page.$('[aria-label="Barter agreement preview"]'),null);
    assert.equal(await page.$('[aria-label="Barter agreement editor"]'),null);
    await page.click('[aria-label="Studio pages"] a[href="#offer-letter"]');
    await page.waitForSelector('[data-offerletter]');
    await clickText(page, 'New offerletter');
    await page.select('[aria-label="Send to"]', 'default');
    assert((await page.$$eval('[aria-label="Offer recipient company"] option', options => options.map(option => option.textContent))).includes('Registration QA Company'));
    await page.click('[aria-label="Studio pages"] a[href="#floorplan"]');
    await page.waitForSelector('[data-live-map][data-stall-count="375"]');
    await page.click('[aria-label="Expand map"]');
    await page.waitForSelector('[data-map-workspace][data-stage="open"]');
    assert.equal(await page.$eval('[data-studio-navigation]', element => getComputedStyle(element).visibility), 'hidden');
    await download(page, 'floorplan-regression.pdf', () => page.click('[aria-label="Print / PDF"]'));
    await page.click('[data-map-back]');
    await page.waitForSelector('[data-map-workspace][data-expanded="false"]');
    assert.equal(await page.$eval('[data-studio-navigation]', element => getComputedStyle(element).visibility), 'visible');
    assert.deepEqual(apiRequests, [], 'The independent studio made backend requests');
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('PASS offer editor, pricing, validation, save/reload, IndexedDB stamp, issue lock, QR, revoke, mobile navigation, retired page fallback, registration/floorplan exports and fullscreen navigation.');
    console.log('Evidence: ' + output);
  } catch (error) {
    if (page && !page.isClosed()) {
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
      console.error((await page.$eval('body', body => body.innerText).catch(() => '')).slice(-5000));
    }
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
