"use client";
import {useId,useState} from 'react';
import {Plus,Save,ShieldCheck} from 'lucide-react';
import type {ServiceRecord} from '@/lib/offerletter/types';
import {offerAddressee,offerDefaults,validateOffer} from '@/lib/offerletter/model';
import {API_MODE} from '@/lib/offerletter/mode';
import {saveLocalImage} from '@/lib/offerletter/media';
import type {ViewProps} from './context';
import {Button,Card,Field,Badge,inputClass} from './ui';
import {FileUpload} from './file-upload';
import {OfferletterPaper} from './offerletter-paper';

function newOffer(ownerId:string):ServiceRecord{
 const id=crypto.randomUUID();return {id:'offer-'+id,module:'offerletter',ownerId,title:`ECO/OFFER/${new Date().getFullYear()}/${id.slice(0,8).toUpperCase()}`,status:'Draft',at:new Date().toISOString(),fields:{...offerDefaults,RecipientType:''}};
}
export default function Offerletters({state,context,run,readOnly}:ViewProps){
 const records=state.records.filter(r=>r.module==='offerletter').sort((a,b)=>b.at.localeCompare(a.at));
 const [draft,setDraft]=useState<ServiceRecord>(()=>records[0]?structuredClone(records[0]):newOffer(context.accountId)),[error,setError]=useState(''),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[confirm,setConfirm]=useState<'issue'|'revoke'>();
 const f=draft.fields,locked=draft.status!=='Draft'||readOnly,recipientType=f.RecipientType??'default',suggestionsId=useId();
 const people=[...new Map([
  ...state.companies.filter(c=>c.contactName).map(c=>({name:c.contactName!,companyId:c.id,label:c.name})),
  ...state.accounts.filter(a=>a.role==='exhibitor'&&a.companyId).map(a=>({name:a.name,companyId:a.companyId!,label:state.companies.find(c=>c.id===a.companyId)?.name||a.email||''})),
  ...state.records.filter(r=>r.module==='contacts'&&r.companyId&&r.fields.Name?.trim()).map(r=>({name:r.fields.Name,companyId:r.companyId!,label:state.companies.find(c=>c.id===r.companyId)?.name||''})),
 ].map(person=>[person.name.trim().toLowerCase()+'|'+person.companyId,person])).values()];
 const personNames=[...new Set(people.map(p=>p.name))];
 const chooseType=(type:string)=>{setDraft(d=>({...d,companyId:undefined,fields:{...d.fields,RecipientType:type,Recipient:type==='default'?offerDefaults.Recipient:'',Company:''}}));setError('');setConfirm(undefined);};
 const updatePerson=(value:string)=>{const matches=people.filter(p=>p.name.trim().toLowerCase()===value.trim().toLowerCase()),ids=[...new Set(matches.map(p=>p.companyId))];setDraft(d=>({...d,companyId:ids.length===1?ids[0]:undefined,fields:{...d.fields,Recipient:value,Company:''}}));};
 const updateCompany=(value:string)=>{const matches=state.companies.filter(c=>c.name.trim().toLowerCase()===value.trim().toLowerCase());setDraft(d=>({...d,companyId:matches.length===1?matches[0].id:undefined,fields:{...d.fields,Company:value,Recipient:''}}));};
 const field=(key:string,value:string)=>setDraft(d=>({...d,fields:{...d.fields,[key]:value}}));
 async function save(status:string){
  if(busy||uploading||readOnly)return;setBusy(true);setError('');
  try{const original=state.records.find(r=>r.id===draft.id);const record=structuredClone({...((draft.status!=='Draft'&&original)?original:draft),status});validateOffer(record,state.records.find(r=>r.id===record.id));
   if(!API_MODE&&status==='Issued'&&draft.status==='Draft'){record.fields.Token=crypto.randomUUID()+crypto.randomUUID();record.fields.IssuedAt=new Date().toISOString();}
   if(await run({type:'record',record})){setDraft(record);setConfirm(undefined);}
  }catch(e){setError(e instanceof Error?e.message:'Unable to save offer');}finally{setBusy(false);}
 }
 // Use the server-issued token as soon as the successful write refreshes the workspace.
 const persisted=state.records.find(r=>r.id===draft.id),paper=persisted&&persisted.status===draft.status&&draft.status!=='Draft'?persisted:draft;
 const textField=(key:string,label:string,type='text',maxLength=100)=><Field key={key} label={label}><input className={inputClass} aria-label={label} type={type} maxLength={maxLength} disabled={locked} value={f[key]||''} onChange={e=>field(key,e.target.value)}/></Field>;
 return <div className="space-y-5">
  <Card title="Offerletter" action={<Button disabled={readOnly||busy} onClick={()=>{setDraft(newOffer(context.accountId));setConfirm(undefined);setError('');}}><Plus size={16}/>New offerletter</Button>}>
   <div className="flex flex-wrap items-center gap-3"><select aria-label="Saved offerletters" className={inputClass+' max-w-md'} value={records.some(r=>r.id===draft.id)?draft.id:''} onChange={e=>{const r=records.find(r=>r.id===e.target.value);if(r){setDraft(structuredClone(r));setError('');setConfirm(undefined);}}}><option value="">New unsaved offer</option>{records.map(r=><option key={r.id} value={r.id}>{r.title} · {offerAddressee(r.fields)} · {r.status}</option>)}</select><Badge>{draft.status}</Badge><span className="ml-auto text-xs text-[#4b5d73]" title="Letters and QR checks use this browser’s saved records, independently of the original application.">Saved in this browser</span></div>
  </Card>
  <div className="grid items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
   <Card title="Offer details">
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();void save('Draft');}}>
     <Field label="Send to"><select aria-label="Send to" className={inputClass} disabled={locked} value={recipientType} onChange={e=>chooseType(e.target.value)}><option value="" disabled>Choose recipient type</option><option value="default">Default</option><option value="individual">Individual</option><option value="company">Company</option></select></Field>
     {recipientType==='default'&&<>
     <Field label="Company"><select aria-label="Offer recipient company" className={inputClass} disabled={locked} value={draft.companyId||''} onChange={e=>{const company=state.companies.find(c=>c.id===e.target.value);setDraft(d=>({...d,companyId:company?.id,fields:{...d.fields,Company:company?.name||'',Recipient:company?.contactName||d.fields.Recipient}}));}}><option value="">Custom recipient</option>{state.companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
     {textField('Recipient','Recipient')}{textField('Company','Company name','text',120)}
     </>}
     {recipientType==='individual'&&<Field label="Recipient"><input aria-label="Recipient" className={inputClass} disabled={locked} maxLength={100} autoComplete="off" placeholder="Choose a client or enter a name" list={suggestionsId+'-people'} value={f.Recipient||''} onChange={e=>updatePerson(e.target.value)}/><datalist id={suggestionsId+'-people'}>{personNames.map(name=><option key={name} value={name}>{[...new Set(people.filter(p=>p.name===name).map(p=>p.label))].join(' · ')}</option>)}</datalist></Field>}
     {recipientType==='company'&&<Field label="Company name"><input aria-label="Company name" className={inputClass} disabled={locked} maxLength={120} autoComplete="off" placeholder="Choose a company or enter a name" list={suggestionsId+'-companies'} value={f.Company||''} onChange={e=>updateCompany(e.target.value)}/><datalist id={suggestionsId+'-companies'}>{state.companies.map(c=><option key={c.id} value={c.name}>{c.contactName||c.email}</option>)}</datalist></Field>}
     <details><summary className="cursor-pointer font-semibold">Exhibition &amp; letterhead</summary><div className="mt-4 space-y-4"><Field label="Use exhibition data"><select className={inputClass} aria-label="Offer exhibition" disabled={locked} value={draft.editionId||''} onChange={e=>{const ed=state.editions.find(x=>x.id===e.target.value);setDraft(d=>({...d,editionId:ed?.id,fields:{...d.fields,...(ed?{Event:`${ed.series} ${ed.year}`,Subtitle:ed.name,Currency:ed.currency}: {})}}));}}><option value="">Custom exhibition</option>{state.editions.map(e=><option key={e.id} value={e.id}>{e.series} {e.year}</option>)}</select></Field>{textField('Event','Exhibition name')}{textField('Subtitle','Exhibition subtitle','text',120)}{textField('Organizer','Organizers','text',350)}{textField('Dates','Exhibition dates')}{textField('Venue','Venue','text',180)}{textField('Website','Exhibition website')}</div></details>
     {textField('Position','Proposed stall position')}{textField('Area','Total space (sqm)','number')}
     <Field label="Currency"><select aria-label="Offer currency" disabled={locked} className={inputClass} value={f.Currency} onChange={e=>field('Currency',e.target.value)}><option>USD</option><option>BDT</option></select></Field>
     <Field label="Official rack rate per sqm"><input aria-label="Official rack rate per sqm" type="number" min="0.01" step="0.01" className={inputClass} disabled={locked} value={Number(f.Rate)/100} onChange={e=>field('Rate',String(Math.round(Number(e.target.value)*100)))}/></Field>
     <Field label="Special discount (%)"><input aria-label="Special discount (%)" type="number" min="0" max="100" step="0.01" className={inputClass} disabled={locked} value={Number(f.Discount)/100} onChange={e=>field('Discount',String(Math.round(Number(e.target.value)*100)))}/></Field>
     <details open><summary className="cursor-pointer font-semibold">Payment schedule · 40% / 30% / 30%</summary><div className="mt-4 space-y-4">{[1,2,3].map(i=>textField(`Deadline${i}`,`Installment ${i} deadline`,'date'))}{textField('ConfirmationHours','Written confirmation within (hours)','number')}</div></details>
     <details><summary className="cursor-pointer font-semibold">Signatory &amp; stamp</summary><div className="mt-4 space-y-4">{textField('Signatory','Signatory name')}{textField('SignatoryTitle','Signatory title')}{textField('SignatoryRole','Organizer role')}{['Seal'].map(label=><Field key={label} label={`${label} image (optional)`}><FileUpload accept="image/png,image/jpeg,image/webp" disabled={locked||uploading} onChange={async e=>{const file=e.target.files?.[0];if(!file){field(label+'ImageId','');return;}setUploading(true);try{field(label+'ImageId',await saveLocalImage(file));}catch(e){setError(e instanceof Error?e.message:'Upload failed');}finally{setUploading(false);}}}/>{f[label+'ImageId']&&<button className="text-sm text-[#6054dc]" type="button" disabled={locked} onClick={()=>field(label+'ImageId','')}>Remove {label.toLowerCase()}</button>}</Field>)}</div></details>
     <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" aria-label="Hide QR verification" disabled={locked} checked={f.HideQR==='true'} onChange={e=>field('HideQR',String(e.target.checked))}/>Hide QR verification</label>
     {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
     {!locked&&<div className="flex flex-wrap gap-2"><Button type="submit" secondary disabled={busy||uploading||!recipientType}><Save size={15}/>Save draft</Button><Button disabled={busy||uploading||!recipientType} onClick={()=>setConfirm('issue')}><ShieldCheck size={15}/>Issue offer</Button></div>}
     {draft.status==='Issued'&&!readOnly&&<Button secondary disabled={busy} onClick={()=>setConfirm('revoke')}>Revoke offer</Button>}
     {confirm&&<div role="alertdialog" aria-label={confirm==='issue'?'Issue offer confirmation':'Revoke offer confirmation'} className="space-y-3 rounded-xl border border-[#ebedf5] p-3"><p className="text-sm">{confirm==='issue'?(f.HideQR==='true'?'Issue this offer without displaying QR verification? Issued terms cannot be edited.':'Issue this offer and activate its verification QR? Issued terms cannot be edited.'):'Revoke this offer? The QR verification page will show it as revoked.'}</p><div className="flex gap-2"><Button disabled={busy||uploading||!recipientType} onClick={()=>void save(confirm==='issue'?'Issued':'Revoked')}>Confirm {confirm}</Button><Button secondary onClick={()=>setConfirm(undefined)}>Cancel</Button></div></div>}
    </form>
   </Card>
   <OfferletterPaper record={paper}/>
  </div>
 </div>;
}
