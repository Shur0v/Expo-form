require('./floorplan-runtime.cjs');
const assert = require('node:assert/strict');
const { offerDefaults, offerAddressee, offerAmounts, validateOffer } = require('../lib/offerletter/model.ts');
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
const draft = (fields = {}) => ({ id: 'qa-offer', module: 'offerletter', title: 'ECO/OFFER/QA', status: 'Draft', at: '2026-10-28T00:00:00.000Z', fields: { ...offerDefaults, RecipientType: 'company', Company: 'Offer QA Company', ...fields } });

test('reference screenshot pricing: 36 sqm, USD 320 and 5% discount', () => {
  const amount = offerAmounts(draft({ Area: '36', Rate: '32000', Discount: '500' }).fields);
  assert.deepEqual(amount, { rack: 1152000, reduction: 57600, total: 1094400, rate: 30400, installments: [437760, 328320, 328320] });
});
test('source defaults retain USD 29,376 offer price', () => assert.equal(offerAmounts(offerDefaults).total, 2937600));
test('installment rounding preserves the last cent', () => assert.deepEqual(offerAmounts(draft({ Area: '1', Rate: '101', Discount: '0' }).fields).installments, [40, 30, 31]));
test('decimal areas and basis-point discounts use integer minor units', () => assert.deepEqual(offerAmounts(draft({ Area: '1.25', Rate: '3399', Discount: '1234' }).fields), { rack: 4249, reduction: 524, total: 3725, rate: 2980, installments: [1490, 1118, 1117] }));
test('company and individual addressees match the source', () => {
  assert.equal(offerAddressee(draft().fields), 'Offer QA Company');
  assert.equal(offerAddressee(draft({ RecipientType: 'individual', Recipient: 'QA Person' }).fields), 'QA Person');
});
test('valid draft and issue transition are accepted', () => {
  validateOffer(draft());
  validateOffer({ ...draft(), status: 'Issued' }, draft());
});
for (const [name, fields] of [
  ['recipient type required', { RecipientType: '' }],
  ['company name required', { Company: '' }],
  ['individual name required', { RecipientType: 'individual', Recipient: '' }],
  ['positive area required', { Area: '0' }],
  ['rack rate must be integer cents', { Rate: '32.5' }],
  ['discount cannot exceed 100%', { Discount: '10001' }],
  ['invalid calendar dates rejected', { Deadline1: '2026-11-31' }],
  ['deadline order enforced', { Deadline1: '2028-01-01' }],
  ['supported currencies enforced', { Currency: 'EUR' }],
  ['confirmation period bounded', { ConfirmationHours: '0' }],
]) test(name, () => assert.throws(() => validateOffer(draft(fields))));

const issued = { ...draft(), status: 'Issued', fields: { ...draft().fields, Token: 'qa-token', IssuedAt: '2026-10-28T00:00:00.000Z' } };
test('issued terms are immutable', () => assert.throws(() => validateOffer({ ...issued, fields: { ...issued.fields, Rate: '1' } }, issued)));
test('issued references and issue dates are immutable', () => {
  assert.throws(() => validateOffer({ ...issued, title: 'Changed' }, issued));
  assert.throws(() => validateOffer({ ...issued, at: '2026-11-01' }, issued));
});
test('issued offer can be revoked but not returned to draft', () => {
  validateOffer({ ...issued, status: 'Revoked' }, issued);
  assert.throws(() => validateOffer({ ...issued, status: 'Draft' }, issued));
});
test('a draft cannot be revoked', () => assert.throws(() => validateOffer({ ...draft(), status: 'Revoked' }, draft())));

const data = new Map([['ecoexpo_exhibitions_configs_v2', 'untouched forms'], ['ecoexpo-formstudio-map-preview-holds-v1', 'untouched map']]);
let quota = false, notifications = 0;
const windowMock = new EventTarget();
windowMock.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { if (quota) throw Error('Quota exceeded'); data.set(key, value); } };
global.window = windowMock;
const { saveOfferRecord, OFFER_STORAGE_KEY } = require('../lib/offerletter/store.ts');
windowMock.addEventListener('ecoexpo-formstudio-offers-change', () => notifications++);
test('offers persist independently and notify only after saving', () => {
  saveOfferRecord(draft());
  assert.equal(JSON.parse(data.get(OFFER_STORAGE_KEY))[0].fields.Company, 'Offer QA Company');
  assert.equal(data.get('ecoexpo_exhibitions_configs_v2'), 'untouched forms');
  assert.equal(data.get('ecoexpo-formstudio-map-preview-holds-v1'), 'untouched map');
  assert.equal(notifications, 1);
});
test('quota failure does not falsely report a saved offer', () => {
  const before = data.get(OFFER_STORAGE_KEY);
  quota = true;
  assert.throws(() => saveOfferRecord({ ...draft(), id: 'quota-test' }), /Quota/);
  quota = false;
  assert.equal(data.get(OFFER_STORAGE_KEY), before);
  assert.equal(notifications, 1);
});
test('issued offer cannot be overwritten through the storage adapter', () => {
  saveOfferRecord(issued);
  assert.throws(() => saveOfferRecord(draft()));
  assert.equal(JSON.parse(data.get(OFFER_STORAGE_KEY))[0].status, 'Issued');
});
test('damaged browser records are preserved and cannot be silently overwritten', () => {
  data.set(OFFER_STORAGE_KEY, '{invalid json');
  assert.throws(() => saveOfferRecord(draft()), /original data has been kept/);
  assert.equal(data.get(OFFER_STORAGE_KEY), '{invalid json');
});
console.log(`${count} offer letter checks passed`);
