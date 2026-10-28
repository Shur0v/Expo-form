import clipping from 'polygon-clipping';
import type { Stall } from './types';
import { footprintPolygon, multiArea, ring, corners } from './map-geometry';
import type { SceneRect } from './map-experience';

/** Actual polygon intersection: an L-shaped allocation's empty notch is never selectable. */
export function allocationsInArea(stalls:Stall[], box:SceneRect) {
 if(box.w<.1||box.h<.1)return [];
 const polygon=ring([{x:box.x,y:box.y},{x:box.x+box.w,y:box.y},{x:box.x+box.w,y:box.y+box.h},{x:box.x,y:box.y+box.h}]);
 return stalls.filter(st=>multiArea(clipping.intersection(footprintPolygon(st),polygon))>1e-7).map(st=>st.id);
}
export function pointInAllocation(st:Stall,point:{x:number;y:number}) {
 const p=corners(st);let inside=false;
 for(let i=0,j=p.length-1;i<p.length;j=i++){
  const [ax,ay]=p[i],[bx,by]=p[j];
  if((ay>point.y)!==(by>point.y)&&point.x<(bx-ax)*(point.y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
