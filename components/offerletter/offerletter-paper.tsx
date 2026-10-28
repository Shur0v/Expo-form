"use client";
import {useEffect,useRef,useState} from 'react';
import QRCode from 'qrcode';
import {Printer} from 'lucide-react';
import type {ServiceRecord} from '@/lib/offerletter/types';
import {offerAddressee,offerAmounts} from '@/lib/offerletter/model';
import {useLocalImage} from './local-image';
import styles from './offerletter-paper.module.css';

export const offerDate=(value:string)=>value&&!Number.isNaN(Date.parse(value))?new Date(value+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):'—';
export function OfferletterPaper({record:r}:{record:ServiceRecord}){
 const f=r.fields,recipient=offerAddressee(f),a=offerAmounts(f),frame=useRef<HTMLDivElement>(null),[scale,setScale]=useState(1),[qrImage,setQr]=useState({key:'',value:''});
 const seal=useLocalImage(f.SealImageId);
 const showVerification=f.HideQR!=='true';
 const valid=r.status==='Issued'&&!!f.Token,verification=f.Token?`/verify/offers/${encodeURIComponent(f.Token)}`:'';
 useEffect(()=>{const el=frame.current;if(!el)return;const observer=new ResizeObserver(([e])=>setScale(Math.min(1,e.contentRect.width/794)));observer.observe(el);return()=>observer.disconnect();},[]);
 const qr=showVerification&&qrImage.key===verification?qrImage.value:'';
 useEffect(()=>{let active=true;if(showVerification&&verification)QRCode.toDataURL(location.origin+verification,{width:256,margin:2,errorCorrectionLevel:'M'}).then(value=>{if(active)setQr({key:verification,value});}).catch(()=>{});return()=>{active=false;};},[verification,showVerification]);
 const fmt=(n:number,digits=0)=>`${f.Currency} ${(n/100).toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:2})}`;
 const rows=[['Proposed Stall Position',f.Position],['Total Space',`${f.Area} sqm`],['Official Rack Rate',`${fmt(Number(f.Rate))}/sqm`],['Special Discount',`${Number(f.Discount)/100}%`],['Discounted Rate',`${fmt(a.rate)}/sqm`],['Total Rack Price',fmt(a.rack)],['Discount Amount',fmt(a.reduction)],['TOTAL OFFER PRICE',fmt(a.total)]];
 return <section className={styles.preview} aria-label="A4 offer letter">
  <div className={styles.toolbar}><span>A4 · 210 × 297 mm · {r.status}</span><button type="button" onClick={()=>window.print()}><Printer size={15}/>Print / save as PDF</button></div>
  <div ref={frame} className={styles.frame} style={{height:1123*scale}}>
   <article data-offerletter className={styles.paper} style={{transform:`scale(${scale})`}}>
    <header className={styles.header}><img src="/assets/offerletter/eco-expo-logo-offerletter.png" alt="Eco Expo — Together we win"/><div><h2>ECO EXPO</h2><p>EVENT CONFERENCE EXHIBITION ORGANIZER</p></div></header>
    <main className={styles.content}>
     <div className={styles.title}><h3>SPECIAL PARTICIPATION OFFER</h3><p>{f.Event} | {f.Subtitle}</p></div>
     <p>To: {recipient}{f.RecipientType!=='company'&&f.Company?` · ${f.Company}`:''}</p><p>Dear {recipient},</p>
     <p>Greetings from ECO Expo! Following our previous discussion, we are pleased to offer your company a special discounted rate for participating in <strong>{f.Event}</strong>, owned and organized by the {f.Organizer}.</p>
     <p><strong>Exhibition Dates:</strong> {f.Dates}<span className={styles.venue}><strong>Venue:</strong> {f.Venue}</span><br/><strong>Website:</strong> {f.Website}</p>
     <h4>PROPOSED STALL &amp; SPECIAL PRICING</h4>
     <table className={styles.pricing}><thead><tr><th>Description</th><th>Details</th></tr></thead><tbody>{rows.map(([label,value],i)=><tr key={label} className={i===7?styles.total:undefined}><td>{label}</td><td>{value}</td></tr>)}</tbody></table>
     <h4>PAYMENT SCHEDULE</h4>
     <table className={styles.schedule}><thead><tr><th>Installment</th><th>Payment Deadline</th><th>Amount</th></tr></thead><tbody>{[40,30,30].map((percent,i)=><tr key={i}><td>{['1st','2nd','3rd'][i]} Installment ({percent}%)</td><td>By {offerDate(f[`Deadline${i+1}`])}</td><td>{fmt(a.installments[i],2)}</td></tr>)}<tr className={styles.total}><td colSpan={2}>TOTAL</td><td>{fmt(a.total,2)}</td></tr></tbody></table>
     <div className={styles.confirmation}><h4>CONFIRMATION &amp; BOOKING</h4><p>We kindly request your <strong>written confirmation within {f.ConfirmationHours} hours</strong> of receiving this offer and payment of the first installment no later than <strong>{offerDate(f.Deadline1)}</strong> to proceed with the booking and secure the proposed stall space.</p></div>
     <p>We look forward to welcoming your company to {f.Event} and building a successful business relationship.</p>
     <div className={styles.signoff}><strong>{f.Signatory}</strong><span>{f.SignatoryTitle}</span><span>{f.SignatoryRole}</span></div>
     <img className={styles.sealImage} src={seal||'/assets/offerletter/eco-expo-seal.png'} alt="Eco Expo organizer seal"/>
    </main>
    {!valid&&<div className={styles.draftMark}>{r.status==='Revoked'?'REVOKED':'DRAFT'}</div>}
    {showVerification&&<div data-offer-verification className={styles.verification}>{verification?<a href={verification} aria-label="Check offer authenticity">{qr&&<img src={qr} alt="Scan to verify this offer letter"/>}</a>:<div style={{width:70,height:70,border:'1px dashed #aaa',display:'grid',placeItems:'center',textAlign:'center'}}>QR available<br/>after issue</div>}<div><strong>{valid?'VERIFY THIS OFFER ONLINE':r.status==='Revoked'?'THIS OFFER HAS BEEN REVOKED':'DRAFT · NOT AN ISSUED OFFER'}</strong><p>{r.title}</p>{f.IssuedAt&&<p>Issued: {new Date(f.IssuedAt).toLocaleDateString('en-GB',{timeZone:'Asia/Dhaka'})}</p>}{verification&&<a href={verification}>Scan to check authenticity ↗</a>}</div></div>}
    <div className={styles.electronicAuthorization}>Electronically issued and authorized by ECO Expo.<br/>Valid without a physical signature.</div>
    <footer className={styles.footer}><img src="/assets/offerletter/pad-colors.jpg" alt="ECO Expo · WeChat: +8801610161016 · WhatsApp: +8801715105189 · www.ecoexpo.events · ceo@ecoexpo.events · ecoexpo.events@gmail.com · 4th Floor, House 2/4 (Delwar Apartment), South Kollyanpur, Dhaka 1207, Bangladesh"/></footer>
   </article>
  </div>
 </section>;
}
