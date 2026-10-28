import source from './bitma-layout.json';
import type { MapGeometry } from './floorplan';
import type { Hall, Stall } from './types';

export const BITMA_EDITION = 'bitma-2027';
export const bitmaSource = source;
export function bitmaGeometry(scope = ''): MapGeometry {
  const selectedHall=source.halls.find(h=>h.id===scope);
  const hall = {id:BITMA_EDITION+(selectedHall?'-'+scope:''),physicalHallId:BITMA_EDITION,editionId:BITMA_EDITION,name:'BITMA 2027 · '+(selectedHall?.name||'ICCB'),width:selectedHall?.sourceWidth||346,height:selectedHall?.sourceLength||296} as Hall;
  const stalls: Stall[] = source.booths.filter(b=>!selectedHall||b.hall===scope).map(b=>({
    id:`bitma-${b.code}`,editionId:BITMA_EDITION,hallId:hall.id,physicalSpaceId:`bitma-${b.code}`,
    groupId:`bitma-hall-${b.hall}`,zone:b.hall==='EZ'?'Expo Zone':`Hall ${b.hall}`,
    code:b.code,x:b.x,y:b.y,width:b.width,height:b.height,rotation:0,
    footprintPoints:('points' in b ? b.points : undefined)?.map(p=>({x:p[0],y:p[1]})),
    sourceLabel:'sourceLabel' in b ? b.sourceLabel : undefined,
    dimensionLabel:b.dimensionLabel,displayLabel:b.dimensionLabel,color:b.color,
    price:0,type:'stall',placed:true,power:0,air:false,water:false,loading:0,clearance:0,
  }));
  if(selectedHall)for(const st of stalls){
    const x=st.x-selectedHall.x,y=st.y-selectedHall.y;
    if(selectedHall.northRotation){
      st.x=selectedHall.sourceWidth-y-st.height;st.y=x;
      [st.width,st.height]=[st.height,st.width];
      st.footprintPoints=st.footprintPoints?.map(p=>({x:st.width-p.y,y:p.x}));
    }else{st.x=x;st.y=y;}
  }
  const siteSigns=source.signs.filter(s=>!selectedHall||s.hall===scope).map(s=>{
    if(!selectedHall)return s;
    const x=s.x-selectedHall.x,y=s.y-selectedHall.y;
    return {...s,x:selectedHall.northRotation?selectedHall.sourceWidth-y:x,y:selectedHall.northRotation?x:y};
  });
  const siteArt=source.art.filter(a=>!selectedHall||a.hall===scope);
  const siteObstacles=source.obstacles.filter(s=>!selectedHall||s.hall===scope).map(s=>{
    if(!selectedHall)return s;
    const x=s.x-selectedHall.x,y=s.y-selectedHall.y;
    return {...s,x:selectedHall.northRotation?selectedHall.sourceWidth-y-s.height:x,y:selectedHall.northRotation?x:y,width:selectedHall.northRotation?s.height:s.width,height:selectedHall.northRotation?s.width:s.height};
  });
  const siteArtTransform=selectedHall?(selectedHall.northRotation?`matrix(0 1 -1 0 ${selectedHall.sourceWidth+selectedHall.y} ${-selectedHall.x})`:`translate(${-selectedHall.x} ${-selectedHall.y})`):undefined;
  return {hall,layout:{version:1,name:hall.name,width:hall.width,height:hall.height,physicalHallId:hall.id,
    calibrated:true,objects:[],pavilionMode:'objects',siteObstacles,siteArt,siteArtTransform,siteSigns,siteHalls:selectedHall?[{...selectedHall,x:0,y:0,width:hall.width,height:hall.height}]:source.halls},stalls,revision:source.version};
}
