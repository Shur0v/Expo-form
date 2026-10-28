export type GateSide='north'|'south'|'east'|'west';
export interface MapGate {
 id:string;hall:string;kind:string;roles:string[];label:string;x:number;y:number;width:number;height:number;
 side:GateSide;labelAngle:number;sourceSide:string;sourceStart:number;sourceSpanM:number;sourcePage:number;sourceBox:number[];
 note?:string;clearance?:{widthM:number;heightM:number;source:string};
}
type HallRect={id:string;x:number;y:number;width:number;height:number};
export function gateSpan(h:HallRect,g:MapGate){
 const horizontal=g.side==='north'||g.side==='south';
 const start=horizontal?g.x-h.x:g.y-h.y;
 const end=start+(horizontal?g.width:g.height);
 const limit=horizontal?h.width:h.height;
 return {side:g.side,start:Math.max(0,start),end:Math.min(limit,end)};
}
export function wallSegments(h:HallRect,gates:MapGate[]){
 return (['north','east','south','west'] as const).flatMap(side=>{
  const limit=side==='north'||side==='south'?h.width:h.height;
  const openings=gates.filter(g=>g.hall===h.id&&g.side===side).map(g=>gateSpan(h,g)).sort((a,b)=>a.start-b.start);
  let at=0;const out:{side:GateSide;start:number;end:number}[]=[];
  for(const gap of openings){if(gap.start>at)out.push({side,start:at,end:gap.start});at=Math.max(at,gap.end);}
  if(at<limit)out.push({side,start:at,end:limit});return out;
 });
}
export function gateApproach(h:HallRect,g:MapGate){
 const s=gateSpan(h,g),span=s.end-s.start;
 if(s.side==='north')return{x:s.start,y:-4,width:span,height:5};
 if(s.side==='south')return{x:s.start,y:h.height-1,width:span,height:5};
 if(s.side==='west')return{x:-4,y:s.start,width:5,height:span};
 return{x:h.width-1,y:s.start,width:5,height:span};
}
/** Label plates sit just beyond the hall line, centred on the measured opening. */
export function gateBadge(h:HallRect,g:MapGate){
 const span=gateSpan(h,g),depth=Math.min(1,Math.max(.78,Math.min(g.width,g.height)));
 if(span.side==='north')return{x:h.x+span.start,y:h.y-depth-.06,width:span.end-span.start,height:depth};
 if(span.side==='south')return{x:h.x+span.start,y:h.y+h.height+.06,width:span.end-span.start,height:depth};
 if(span.side==='west')return{x:h.x-depth-.06,y:h.y+span.start,width:depth,height:span.end-span.start};
 return{x:h.x+h.width+.06,y:h.y+span.start,width:depth,height:span.end-span.start};
}
/** Keep text upright and consistently oriented on matching edges. */
export function gateBadgeAngle(side:GateSide){return side==='west'||side==='east'?-90:0;}
export function gateBadgeFontSize(g:MapGate){
 const span=Math.max(g.width,g.height),depth=Math.max(.78,Math.min(g.width,g.height));
 return Math.min(.62,depth*.68,span/(g.label.length*.56));
}
const rectPath=(x:number,y:number,w:number,h:number)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
export function gardenGateClip(h:HallRect,gates:MapGate[]){
 return rectPath(-5,-5,h.width+10,h.height+10)+gates.filter(g=>g.hall===h.id).map(g=>{
  const a=gateApproach(h,g);return rectPath(a.x,a.y,a.width,a.height);
 }).join('');
}
