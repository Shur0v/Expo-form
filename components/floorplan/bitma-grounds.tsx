import type { FloorLayout } from '@/lib/floorplan/floorplan';
import { GardenArt } from './garden';
import { mapTheme } from '@/lib/floorplan/map-colors';
import { textWidth } from '@/lib/floorplan/map-text';
import type { SceneRect } from '@/lib/floorplan/map-experience';
import { gardenGateClip, gateApproach, wallSegments } from '@/lib/floorplan/map-gates';

function CargoEntrySign({symbol}:{symbol:NonNullable<FloorLayout['siteSymbols']>[number]}){
 const w=symbol.width,h=symbol.height;
 return <g data-cargo-symbol={symbol.hall} transform={`translate(${symbol.x} ${symbol.y}) rotate(${symbol.rotation})`} pointerEvents="none">
  <title>Cargo entry · Hall {symbol.hall}</title>
  <g transform={`translate(${-w/2} ${-h/2})`}>
   <path d="M2.75 .22 4.72 3.62H.78Z" fill="#facc36" stroke="#17212b" strokeWidth=".2" strokeLinejoin="round"/>
   <path d="M2.75 .57 4.4 3.42H1.1Z" fill="none" stroke="#fff6cb" strokeWidth=".07" opacity=".9"/>
   <text x="1.16" y="2.23" transform="rotate(-59 1.16 2.23)" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize=".49" fontWeight="800" letterSpacing=".025" fill="#101820">CARGO</text>
   <text x="4.34" y="2.23" transform="rotate(59 4.34 2.23)" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize=".49" fontWeight="800" letterSpacing=".025" fill="#101820">ENTRY</text>
   <g fill="none" stroke="#101820" strokeLinecap="round" strokeLinejoin="round" strokeWidth=".11">
    <path d="M2.03 2.8h1.72v-.2h-.23l-.32-.49a.22.22 0 0 0-.19-.1H2.7v-.44h-.5v1.23"/>
    <path d="M2.22 1.57V2M2.35 1.57h.42v.37h-.42zM3.17 1.98v.98M3.3 1.98v.98M3.43 1.98v.98"/>
    <circle cx="2.47" cy="2.82" r=".12" fill="#101820"/><circle cx="3.33" cy="2.82" r=".12" fill="#101820"/>
    <rect x="2.72" y="1.47" width=".32" height=".27" rx=".025" fill="#101820"/>
   </g>
  </g>
 </g>;
}

function AmenityButton({x,y,width,height,title,lines,id}:{x:number;y:number;width:number;height:number;title:string;lines:[string,string];id:string}){
 return <g key={id} data-amenity-button={id} pointerEvents="none">
  <rect x={x+.1} y={y+.13} width={width} height={height} rx=".16" fill="#243247" opacity=".22"/>
  <rect x={x} y={y} width={width} height={height} rx=".16" fill="#fff" stroke="#ef4444" strokeWidth=".11"/>
  <rect x={x+.09} y={y+.09} width={width-.18} height={height-.18} rx=".1" fill="none" stroke="#fecaca" strokeWidth=".045"/>
  <text x={x+width/2} y={y+height*.40} textAnchor="middle" dominantBaseline="middle" fontFamily="Arial,sans-serif" fontSize=".48" fontWeight="700" letterSpacing=".015" fill="#dc2626">{lines[0]}</text>
  <text x={x+width/2} y={y+height*.67} textAnchor="middle" dominantBaseline="middle" fontFamily="Arial,sans-serif" fontSize=".48" fontWeight="700" letterSpacing=".015" fill="#dc2626">{lines[1]}</text>
  <title>{title}</title>
 </g>;
}

/** Landscaping and wall elevations are visual; the floor rectangle is the metric boundary. */
export function BitmaGrounds({layout,id,crop}:{layout:FloorLayout;id:string;crop?:SceneRect}) {
 const labelVisible=(x:number,y:number,text:string,size:number)=>!crop||
  (x-textWidth(text,size)/2>=crop.x&&x+textWidth(text,size)/2<=crop.x+crop.w&&y-size>=crop.y&&y+size<=crop.y+crop.h);
 return <g data-bitma-campus pointerEvents="none">
  <rect x="-5" y="-5" width={layout.width+10} height={layout.height+10} fill="#edf2f7"/>
  {(layout.siteHalls?.length||0)>1&&<>
    <text x="8" y="12" fontFamily="Arial,sans-serif" fontSize="6" fontWeight="700" fill="#102a43">BITMA 2027</text>
    <text x="8" y="18" fontFamily="Arial,sans-serif" fontSize="2.1" fill="#475569">ICCB · Bangladesh International Textile &amp; Apparel Machinery Exhibition</text>
    <text x="8" y="23" fontFamily="Arial,sans-serif" fontSize="1.6" fill="#64748b">Hall footprints to scale · campus gaps illustrative · north ↑</text>
  </>}
  {(layout.siteHalls||[]).map((h,i)=><g key={h.id} transform={`translate(${h.x} ${h.y})`} data-bitma-hall={h.id}>
    <title>{h.name} · {h.dimensionSource}</title>
    <defs><clipPath id={`${id}-gate-garden-${i}`}><path d={gardenGateClip(h,layout.siteGates||[])} clipRule="evenodd"/></clipPath></defs>
    <g clipPath={`url(#${id}-gate-garden-${i})`}>{GardenArt({layout:{...layout,width:h.width,height:h.height,objects:[]},id:`${id}-hall-${i}`})}</g>
    <rect x=".35" y=".8" width={h.width} height={h.height} rx=".3" fill="#334155" opacity=".16"/>
    <rect width={h.width} height={h.height} fill={mapTheme.scene.floor}/>
    <rect width={h.width} height={h.height} fill={h.color} fillOpacity=".12"/>
    {(layout.siteGates||[]).filter(g=>g.hall===h.id).map(g=>{
      const a=gateApproach(h,g);
      return <rect key={g.id} data-gate-approach={g.id} {...a} fill={mapTheme.scene.floor}/>;
    })}
    {wallSegments(h,layout.siteGates||[]).map((s,j)=><path key={j} data-hall-wall={h.id} d={s.side==='north'?`M${s.start} 0H${s.end}`:s.side==='south'?`M${s.start} ${h.height}H${s.end}`:s.side==='west'?`M0 ${s.start}V${s.end}`:`M${h.width} ${s.start}V${s.end}`} fill="none" stroke="#64748b" strokeWidth=".24"/>)}
    {labelVisible(h.x+h.width/2,h.y-7,h.name+' · N →',2)&&<text x={h.width/2} y="-7" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="2" fontWeight="700" fill="#102a43">{h.name}{layout.siteHalls?.length===1?(h.northRotation?' · N →':' · N ↑'):''}</text>}
    {labelVisible(h.x+h.width/2,h.y+h.height+5,`${h.width.toFixed(2)} × ${h.height.toFixed(2)} m`,1.2)&&<text x={h.width/2} y={h.height+5} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="1.2" fill="#475569">{h.width.toFixed(2)} × {h.height.toFixed(2)} m</text>}
  </g>)}
  <g data-source-architecture transform={layout.siteArtTransform}>
   {layout.siteArt?.map((a,i)=><path key={i} data-bitma-stair-art={a.kind==='stairs'||undefined} transform={a.kind==='stairs'?'translate(0 .65)':undefined} d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth}/>)}
   {layout.siteSymbols?.filter(s=>s.kind==='cargo-entry').map(s=>CargoEntrySign({symbol:s}))}
  </g>
  {layout.siteSigns?.filter(s=>!['ENTRY','EXIT','FOOD','COURT','SERVICE','BOOTH'].includes(s.label)).map((s,i)=><g key={i} transform={`translate(${s.x} ${s.y})`}>
    <rect x="-.65" y="-.38" width="1.3" height=".76" rx=".08" fill={s.label==='AC'?'#e2e8f0':'#fff7ed'} stroke="#94a3b8" strokeWidth=".035"/>
    <text textAnchor="middle" dominantBaseline="middle" fontFamily="Arial,sans-serif" fontSize=".35" fontWeight="700" fill="#334155">{s.label}</text>
  </g>)}
  {(layout.siteHalls||[]).flatMap(h=>{
   const signs=layout.siteSigns?.filter(s=>s.hall===h.id)||[];
   const food=signs.filter(s=>s.label==='FOOD'||s.label==='COURT');
   const service=signs.filter(s=>s.label==='SERVICE'||s.label==='BOOTH');
   if(food.length<2||service.length<2)return [];
   const w=2.5,hh=2.45,campusSide=!!h.northRotation&&(layout.siteHalls?.length||0)>1;
   const position=(items:{x:number;y:number}[])=>campusSide
    ?{x:items.reduce((a,b)=>a+b.x,0)/items.length-w/2,y:items.reduce((a,b)=>a+b.y,0)/items.length-hh/2}
    :{x:h.x-2.85,y:items.reduce((a,b)=>a+b.y,0)/items.length-hh/2};
   const f=position(food),s=position(service);
   const visible=(p:{x:number;y:number})=>!crop||(p.x>=crop.x&&p.x+w<=crop.x+crop.w&&p.y>=crop.y&&p.y+hh<=crop.y+crop.h);
   return [visible(f)&&AmenityButton({id:`${h.id}-food`,x:f.x,y:f.y,width:w,height:hh,title:`Food Court · ${h.name}`,lines:['FOOD','COURT']}),visible(s)&&AmenityButton({id:`${h.id}-service`,x:s.x,y:s.y,width:w,height:hh,title:`Service Booth · ${h.name}`,lines:['SERVICE','BOOTH']})];
  })}
 </g>;
}
