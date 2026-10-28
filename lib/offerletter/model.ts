import type {ServiceRecord} from './types';

export const offerDefaults:Record<string,string>={
 Recipient:'Mr. Moshiur Rahman',Company:'',Event:'BITMA EXPO 2027',Subtitle:'Bangladesh International Textile & Apparel Machinery Exhibition',
 Organizer:'Bangladesh Textile Mills Association (BTMA) and the Bangladesh Garment Manufacturers and Exporters Association (BGMEA)',
 Dates:'15–18 April 2027',Venue:'International Convention City Bashundhara (ICCB), Dhaka, Bangladesh',Website:'www.bitmaexpo.com',
 Position:'EZ 149–160',Area:'108',Rate:'32000',Discount:'1500',Currency:'USD',
 Deadline1:'2026-10-25',Deadline2:'2026-12-31',Deadline3:'2027-02-15',
 Signatory:'MD. RAJWANUR RAHMAN',SignatoryTitle:'CEO, ECO Expo',SignatoryRole:'Co-organizer, BITMA Expo 2027',
 ConfirmationHours:'72',SignatureImageId:'',SealImageId:'',
};
export function offerAddressee(f:Record<string,string>){return f.RecipientType==='company'?f.Company:f.Recipient;}
// Area and dimensions stay in metres internally; changing display units never changes a price.
export const SQFT_IN_SQM = 0.09290304;
export function offerMeasurement(f:Record<string,string>) {
 const feet=f.Unit==='sqft',factor=feet?SQFT_IN_SQM:1;
 const number=(value:number)=>Number(value.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});
 return {feet,areaUnit:feet?'sq. ft.':'sqm',lengthUnit:feet?'ft':'m',factor,lengthFactor:feet?0.3048:1,
  area:number(Number(f.Area)/factor),width:number(Number(f.StallWidth||0)/(feet?0.3048:1)),length:number(Number(f.StallLength||0)/(feet?0.3048:1))};
}
export const borthersOfferFields:Record<string,string>={
 ...offerDefaults,RecipientType:'company',Company:'Borthers Machinery',ContactPerson:'Ohaidur Rahman',Designation:'Managing Partner',
 Unit:'sqft',PricingBasis:'stall',StallWidth:'2.4384',StallLength:'2.4384',StallCount:'2',Area:'11.89158912',
 Position:'Hall 4',Rate:'200000',Discount:'1000',Currency:'USD',
 AllocationNote:'These stalls are allocated in Hall 4. The allocation is not based on 3 × 3 sqm stalls.',
};
export function offerAmounts(f:Record<string,string>){
 const area=Number(f.Area),rate=Number(f.Rate),discount=Number(f.Discount);
 const rack=Math.round((f.PricingBasis==='stall'?Number(f.StallCount):area)*rate),reduction=Math.round(rack*discount/10000),total=rack-reduction;
 const installments=[Math.round(total*.4),Math.round(total*.3)];installments.push(total-installments[0]-installments[1]);
 return {rack,reduction,total,rate:Math.round(rate*(10000-discount)/10000),installments};
}
/** Integer minor-unit prices and basis-point discounts; issued text is an immutable snapshot. */
export function validateOffer(record:ServiceRecord,previous?:ServiceRecord){
 const f=record.fields;
 const recipientType=f.RecipientType??'default';
 if(!['default','individual','company'].includes(recipientType))throw Error('Choose Default, Individual or Company before saving the offer');
 if(recipientType==='company'&&!f.Company?.trim())throw Error('Enter a company name');
 if(!['Draft','Issued','Revoked'].includes(record.status))throw Error('Choose a valid offer status');
 for(const key of [...(recipientType==='company'?[]:['Recipient']),'Event','Subtitle','Organizer','Dates','Venue','Website','Position','Signatory','SignatoryTitle','SignatoryRole'])if(!f[key]?.trim()||f[key].length>({Organizer:350,Subtitle:120,Venue:180}[key]||100))throw Error(`Enter a valid ${key.toLowerCase()}`);
 if((f.Company||'').length>120)throw Error('Company name is too long');
 if(!['USD','BDT'].includes(f.Currency))throw Error('Choose USD or BDT');
 if(f.Unit&&!['sqm','sqft'].includes(f.Unit))throw Error('Choose metres or feet');
 if(f.PricingBasis&&!['area','stall'].includes(f.PricingBasis))throw Error('Choose area or per-stall pricing');
 if(!/^\d+(\.\d{1,10})?$/.test(f.Area)||Number(f.Area)<=0||Number(f.Area)>100000)throw Error('Enter a valid stall area');
 if(f.PricingBasis==='stall'){
  if(!/^\d+$/.test(f.StallCount||'')||Number(f.StallCount)<1||Number(f.StallCount)>10000)throw Error('Enter a valid number of stalls');
  for(const key of ['StallWidth','StallLength'])if(!Number.isFinite(Number(f[key]))||Number(f[key])<=0||Number(f[key])>1000)throw Error('Enter valid stall dimensions');
  if(Math.abs(Number(f.Area)-Number(f.StallWidth)*Number(f.StallLength)*Number(f.StallCount))>0.000001)throw Error('Allocated area must match the stall dimensions and count');
 }
 if((f.ContactPerson||'').length>100||(f.Designation||'').length>100||(f.AllocationNote||'').length>350)throw Error('Contact details or allocation note are too long');
 if(!/^\d+$/.test(f.Rate)||!Number.isSafeInteger(Number(f.Rate))||Number(f.Rate)<=0||Number(f.Rate)>100000000)throw Error('Enter a valid rack rate');
 if(!/^\d+$/.test(f.Discount)||Number(f.Discount)>10000)throw Error('Discount must be between 0 and 100%');
 if(!/^\d+$/.test(f.ConfirmationHours)||Number(f.ConfirmationHours)<1||Number(f.ConfirmationHours)>720)throw Error('Enter confirmation hours between 1 and 720');
 for(const key of ['Deadline1','Deadline2','Deadline3'])if(!/^\d{4}-\d{2}-\d{2}$/.test(f[key])||Number.isNaN(Date.parse(f[key]+'T00:00:00Z'))||new Date(f[key]+'T00:00:00Z').toISOString().slice(0,10)!==f[key])throw Error('Enter three valid installment deadlines');
 if(f.Deadline1>f.Deadline2||f.Deadline2>f.Deadline3)throw Error('Installment deadlines must be in order');
 if(!Number.isSafeInteger(offerAmounts(f).total))throw Error('Offer amount is too large');
 if(previous&&previous.status!=='Draft'){
  if(JSON.stringify(previous.fields)!==JSON.stringify(f)||record.title!==previous.title||record.at!==previous.at||!(record.status===previous.status||previous.status==='Issued'&&record.status==='Revoked'))throw Error('Issued offers cannot be edited. Create a new offer or revoke this one.');
 }else if(record.status==='Revoked')throw Error('Issue an offer before revoking it');
}
