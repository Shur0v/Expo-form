import type { Stall } from '@/lib/floorplan/types';
import { footprintArea } from '@/lib/floorplan/map-geometry';
import { fitText } from '@/lib/floorplan/map-text';

export function BitmaLabels({stalls}:{stalls:Stall[]}){
 return <g data-bitma-allocation-labels pointerEvents="none" fontFamily="Arial,sans-serif" textAnchor="middle" fill="#102a43">
  {stalls.map(st=><g key={st.id} transform={`translate(${st.x} ${st.y})`}>
    {st.sourceLabel&&<text data-pdf-company-label x={st.width/2} y={st.height*.17} fontWeight="700" fontSize={fitText([st.sourceLabel],st.width*.9,st.height*.15,.7)}>{st.sourceLabel}</text>}
    <text x={st.width/2} y={st.height*.88} fontSize={fitText(['0000 m²'],st.width*.8,st.height*.11,.5)}>{st.dimensionLabel==='8 × 8 ft'?'64 sq. ft.':`${Number(footprintArea(st).toFixed(2))} m²`}</text>
  </g>)}
 </g>;
}
