import type { FloorLayout } from '@/lib/floorplan/floorplan';
import { GardenArt } from './garden';
import { mapTheme } from '@/lib/floorplan/map-colors';
import { textWidth } from '@/lib/floorplan/map-text';
import type { SceneRect } from '@/lib/floorplan/map-experience';

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
    {GardenArt({layout:{...layout,width:h.width,height:h.height,objects:[]},id:`${id}-hall-${i}`})}
    <rect x=".35" y=".8" width={h.width} height={h.height} rx=".3" fill="#334155" opacity=".16"/>
    <rect width={h.width} height={h.height} fill={mapTheme.scene.floor} stroke="#64748b" strokeWidth=".24"/>
    <rect width={h.width} height={h.height} fill={h.color} fillOpacity=".12"/>
    <path d={`M0 0H${h.width}V${h.height}`} fill="none" stroke="#cbd5e1" strokeWidth=".12"/>
    {labelVisible(h.x+h.width/2,h.y-4.4,h.name+' · N →',2)&&<text x={h.width/2} y="-4.4" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="2" fontWeight="700" fill="#102a43">{h.name}{layout.siteHalls?.length===1?(h.northRotation?' · N →':' · N ↑'):''}</text>}
    {labelVisible(h.x+h.width/2,h.y+h.height+5,`${h.width.toFixed(2)} × ${h.height.toFixed(2)} m`,1.2)&&<text x={h.width/2} y={h.height+5} textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="1.2" fill="#475569">{h.width.toFixed(2)} × {h.height.toFixed(2)} m</text>}
  </g>)}
  <g data-source-architecture transform={layout.siteArtTransform}>{layout.siteArt?.map((a,i)=><path key={i} d={a.d} fill={a.fill} stroke={a.stroke} strokeWidth={a.strokeWidth}/>)}</g>
  {layout.siteSigns?.map((s,i)=><g key={i} transform={`translate(${s.x} ${s.y})`}>
    <rect x="-.65" y="-.38" width="1.3" height=".76" rx=".08" fill={s.label==='AC'?'#e2e8f0':'#fff7ed'} stroke="#94a3b8" strokeWidth=".035"/>
    <text textAnchor="middle" dominantBaseline="middle" fontFamily="Arial,sans-serif" fontSize=".35" fontWeight="700" fill="#334155">{s.label}</text>
  </g>)}
 </g>;
}
