import type { FloorLayout } from '@/lib/floorplan/floorplan';
import { gateBadge, gateBadgeAngle, gateBadgeFontSize } from '@/lib/floorplan/map-gates';

/** Compact, readable edge labels rendered above the booth surfaces. */
export function BitmaGateMarkers({layout}:{layout:FloorLayout}){
 const halls=layout.siteHalls||[];
 return <g data-bitma-gate-markers pointerEvents="none" fontFamily="Arial,sans-serif">
  {layout.siteGates?.map(g=>{
   const h=halls.find(item=>item.id===g.hall);
   if(!h)return null;
   const styled=['entry','exit','fire-exit','cargo'].includes(g.kind);
   if(!styled)return <g key={g.id} data-map-gate={g.id} data-gate-kind={g.kind} data-gate-side={g.side}><title>{g.label} · {g.hall==='EZ'?'Expo Zone':`Hall ${g.hall}`} · {g.note||''}{g.clearance?` · ${g.clearance.source}`:''}</title></g>;
   const color=g.kind==='fire-exit'?'#c62828':g.kind==='cargo'?'#3155aa':['access','service'].includes(g.kind)?'#475569':'#f58220';
   const badge=gateBadge(h,g),angle=gateBadgeAngle(g.side),size=gateBadgeFontSize(g);
   const visibleLabel=g.label;
   return <g key={g.id} data-map-gate={g.id} data-gate-kind={g.kind} data-gate-side={g.side} data-gate-badge="true">
    <title>{g.label} · {g.hall==='EZ'?'Expo Zone':`Hall ${g.hall}`} · {g.note||''}{g.clearance?` · ${g.clearance.source}`:''}</title>
    <rect x={badge.x+.1} y={badge.y+.13} width={badge.width} height={badge.height} rx=".16" fill="#233243" opacity=".28"/>
    <rect x={badge.x} y={badge.y} width={badge.width} height={badge.height} rx=".16" fill={color} stroke="#fff" strokeWidth=".1"/>
    <rect x={badge.x+.09} y={badge.y+.09} width={Math.max(.1,badge.width-.18)} height={Math.max(.1,badge.height-.18)} rx=".1" fill="none" stroke="#ffffff" strokeOpacity=".34" strokeWidth=".035"/>
    <text transform={`translate(${badge.x+badge.width/2} ${badge.y+badge.height/2}) rotate(${angle})`} textAnchor="middle" dominantBaseline="central" fontWeight="700" fontSize={size} letterSpacing=".025" fill="white">{visibleLabel}</text>
   </g>;
  })}
 </g>;
}
