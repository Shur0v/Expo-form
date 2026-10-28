import type { FloorLayout } from '@/lib/floorplan/floorplan';
import { GardenArt } from './garden';
import { mapTheme } from '@/lib/floorplan/map-colors';
import { textWidth } from '@/lib/floorplan/map-text';
import type { SceneRect } from '@/lib/floorplan/map-experience';
import { gardenGateClip, gateApproach, wallSegments } from '@/lib/floorplan/map-gates';

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
    {labelVisible(h.x+h.width/2,h.y-4.4,h.name+' · N →',2)&&<text x={h.width/2} y="-4.4" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="2" fontWeight="700" fill="#102a43">{h.name}{layout.siteHalls?.length===1?(h.northRotation?' · N →':' · N ↑'):''}</text>}
    {labelVisible(h.x+h.width/2,h.y+h.height+5,`${h.width.toFixed(2)} × ${h.height.toFixed(2)} m`,1.2)&&<text x={h.width/2} y={h.height+5} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="1.2" fill="#475569">{h.width.toFixed(2)} × {h.height.toFixed(2)} m</text>}
  </g>)}
  <g data-source-architecture transform={layout.siteArtTransform}>{layout.siteArt?.map((a,i)=><path key={i} d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth}/>)}</g>
  {layout.siteSigns?.filter(s=>!['ENTRY','EXIT'].includes(s.label)).map((s,i)=><g key={i} transform={`translate(${s.x} ${s.y})`}>
    <rect x="-.65" y="-.38" width="1.3" height=".76" rx=".08" fill={s.label==='AC'?'#e2e8f0':'#fff7ed'} stroke="#94a3b8" strokeWidth=".035"/>
    <text textAnchor="middle" dominantBaseline="middle" fontFamily="Arial,sans-serif" fontSize=".35" fontWeight="700" fill="#334155">{s.label}</text>
  </g>)}
  {layout.siteGates?.map(g=>{
    const color=g.kind==='fire-exit'?'#dc2626':g.kind==='cargo'?'#3155aa':['access','service'].includes(g.kind)?'#334155':'#f58220';
    const vertical=g.height>g.width;
    const span=Math.max(g.width,g.height),depth=Math.min(g.width,g.height);
    const size=Math.min(depth*.64,span/(g.label.length*.65));
    const serviceX=g.x+g.width/2+(vertical?1:0),serviceY=g.y+g.height/2+(vertical?0:1);
    return <g key={g.id} data-map-gate={g.id} data-gate-kind={g.kind} data-gate-side={g.side}>
      <title>{g.label} · {g.hall==='EZ'?'Expo Zone':`Hall ${g.hall}`} · {g.note||''}{g.clearance?` · ${g.clearance.source}`:''}</title>
      <rect x={g.x} y={g.y} width={g.width} height={g.height} fill={color}/>
      <text transform={`translate(${g.x+g.width/2} ${g.y+g.height/2}) rotate(${g.labelAngle})`} textAnchor="middle" dominantBaseline="central" fontFamily="Arial,sans-serif" fontWeight="700" fontSize={size} fill="white">{g.label}</text>
      {g.roles.includes('fire-exit')&&g.kind==='cargo'&&<text x={g.x-.8} y={g.y+g.height/2} transform={`rotate(-90 ${g.x-.8} ${g.y+g.height/2})`} textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize=".5" fill="#dc2626">FIRE EXIT</text>}
      {g.clearance&&<text transform={`translate(${serviceX} ${serviceY}) rotate(${g.labelAngle})`} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize=".4" fill="#334155"><tspan x="0">SERVICE DOOR</tspan><tspan x="0" dy=".5">H 9 ft / W 7 ft 6 in</tspan></text>}
    </g>;
  })}
 </g>;
}
