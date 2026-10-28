import source from './bitma-layout.json';
import type { MapGeometry } from './floorplan';
import type { Hall, Stall } from './types';
import type { GateSide, MapGate } from './map-gates';

export const BITMA_EDITION = 'bitma-2027';
export const bitmaSource = source;

/** Campus placements are an illustrative site plan; booth geometry stays metric and unchanged. */
export const BITMA_CAMPUS = {
  width: 430,
  height: 220,
  boundary: [[-8,150],[196,150],[196,105],[219,105],[219,48],[165,48],[165,-8],[305,-8],[305,43],[375,43],[430,62],[430,82],[380,132],[430,132],[430,220],[-8,220]] as const,
  origins: {
    '1': { x: 350, y: 165 },
    '2': { x: 265, y: 128 },
    '3': { x: 315, y: 64 },
    '4': { x: 230, y: 0 },
    '1A': { x: 310, y: 112 },
    '6': { x: 205, y: 108 },
    '2A': { x: 290, y: 72 },
    '4A': { x: 270, y: 0 },
    EZ: { x: 0, y: 162 },
  } satisfies Record<string, { x: number; y: number }>,
  features: [
    { id: 'parking-north-west', kind: 'parking', x: 177, y: 14, width: 42, height: 28 },
    { id: 'north-east-service-area', kind: 'service', x: 289, y: 3, width: 13, height: 25 },
    { id: 'parking-hall-4a-east', kind: 'parking', x: 289, y: 31, width: 14, height: 18 },
    { id: 'parking-central-north', kind: 'parking', x: 262, y: 74, width: 15, height: 13 },
    { id: 'parking-hall-3-east', kind: 'parking', x: 382, y: 50, width: 12, height: 12 },
    { id: 'parking-hall-1a-east', kind: 'parking', x: 390, y: 137, width: 25, height: 17 },
    { id: 'parking-hall-1-south-west', kind: 'parking', x: 326, y: 161, width: 18, height: 8 },
    { id: 'prayer-room', kind: 'prayer', x: 255, y: 94, width: 11, height: 30 },
    { id: 'iccb-office', kind: 'office', x: 292, y: 130, width: 14, height: 19 },
    { id: 'inauguration-service-hall', kind: 'service', x: 254, y: 157, width: 7, height: 39 },
  ],
} as const;

export function bitmaGeometry(scope = ''): MapGeometry {
  const selectedHall = source.halls.find((h) => h.id === scope);
  const campus = !selectedHall;
  const origins = BITMA_CAMPUS.origins as Record<string, { x: number; y: number }>;
  const hall = {
    id: BITMA_EDITION + (selectedHall ? '-' + scope : ''),
    physicalHallId: BITMA_EDITION,
    editionId: BITMA_EDITION,
    name: 'BITMA 2027 · ' + (selectedHall?.name || 'ICCB'),
    width: selectedHall?.sourceWidth || BITMA_CAMPUS.width,
    height: selectedHall?.sourceLength || BITMA_CAMPUS.height,
  } as Hall;
  const offset = (id: string) => {
    const original = source.halls.find((item) => item.id === id)!;
    const target = origins[id];
    return { x: target.x - original.x, y: target.y - original.y };
  };
  const stalls: Stall[] = source.booths
    .filter((booth) => !selectedHall || booth.hall === scope)
    .map((booth) => {
      const delta = campus ? offset(booth.hall) : { x: 0, y: 0 };
      return {
        id: `bitma-${booth.code}`,
        editionId: BITMA_EDITION,
        hallId: hall.id,
        physicalSpaceId: `bitma-${booth.code}`,
        groupId: `bitma-hall-${booth.hall}`,
        zone: booth.hall === 'EZ' ? 'Expo Zone' : `Hall ${booth.hall}`,
        code: booth.code,
        x: booth.x + delta.x,
        y: booth.y + delta.y,
        width: booth.width,
        height: booth.height,
        rotation: 0,
        footprintPoints: ('points' in booth ? booth.points : undefined)?.map((p) => ({ x: p[0], y: p[1] })),
        sourceLabel: 'sourceLabel' in booth ? booth.sourceLabel : undefined,
        dimensionLabel: booth.dimensionLabel,
        displayLabel: booth.dimensionLabel,
        color: booth.color,
        price: 0,
        type: 'stall',
        placed: true,
        power: 0,
        air: false,
        water: false,
        loading: 0,
        clearance: 0,
      };
    });
  if (selectedHall) for (const stall of stalls) {
    const x = stall.x - selectedHall.x;
    const y = stall.y - selectedHall.y;
    if (selectedHall.northRotation) {
      stall.x = selectedHall.sourceWidth - y - stall.height;
      stall.y = x;
      [stall.width, stall.height] = [stall.height, stall.width];
      stall.footprintPoints = stall.footprintPoints?.map((p) => ({ x: stall.width - p.y, y: p.x }));
    } else {
      stall.x = x;
      stall.y = y;
    }
  }
  const siteHalls = source.halls
    .filter((item) => !selectedHall || item.id === scope)
    .map((item) => selectedHall ? { ...item, x: 0, y: 0, width: hall.width, height: hall.height } : { ...item, ...origins[item.id] });
  const siteSigns = source.signs
    .filter((sign) => !selectedHall || sign.hall === scope)
    .map((sign) => {
      if (selectedHall) {
        const x = sign.x - selectedHall.x;
        const y = sign.y - selectedHall.y;
        return { ...sign, x: selectedHall.northRotation ? selectedHall.sourceWidth - y : x, y: selectedHall.northRotation ? x : y };
      }
      const delta = offset(sign.hall);
      return { ...sign, x: sign.x + delta.x, y: sign.y + delta.y };
    });
  const siteArt = source.art
    .filter((art) => !selectedHall || art.hall === scope)
    .map((art) => campus ? { ...art, transform: `translate(${offset(art.hall).x} ${offset(art.hall).y})` } : art);
  const siteSymbols = source.symbols
    .filter((symbol) => !selectedHall || symbol.hall === scope)
    .map((symbol) => {
      if (selectedHall) return symbol;
      const delta = offset(symbol.hall);
      return { ...symbol, x: symbol.x + delta.x, y: symbol.y + delta.y };
    });
  const siteGates: MapGate[] = source.gates
    .filter((gate) => !selectedHall || gate.hall === scope)
    .map((gate) => {
      if (!selectedHall) {
        const delta = offset(gate.hall);
        return { ...gate, x: gate.x + delta.x, y: gate.y + delta.y, side: gate.side as GateSide };
      }
      const x = gate.x - selectedHall.x;
      const y = gate.y - selectedHall.y;
      return {
        ...gate,
        x: selectedHall.northRotation ? selectedHall.sourceWidth - y - gate.height : x,
        y: selectedHall.northRotation ? x : y,
        width: selectedHall.northRotation ? gate.height : gate.width,
        height: selectedHall.northRotation ? gate.width : gate.height,
        side: (selectedHall.northRotation ? ({ west: 'north', north: 'east', east: 'south', south: 'west' }[gate.side as GateSide]) : gate.side) as GateSide,
        labelAngle: gate.labelAngle + (selectedHall.northRotation ? 90 : 0),
      };
    });
  const siteObstacles = source.obstacles
    .filter((item) => !selectedHall || item.hall === scope)
    .map((item) => {
      if (!selectedHall) {
        const delta = offset(item.hall);
        return { ...item, x: item.x + delta.x, y: item.y + delta.y + 0.65 };
      }
      const x = item.x - selectedHall.x;
      const y = item.y - selectedHall.y;
      return {
        ...item,
        x: selectedHall.northRotation ? selectedHall.sourceWidth - y - item.height : x,
        y: (selectedHall.northRotation ? x : y) + 0.65,
        width: selectedHall.northRotation ? item.height : item.width,
        height: selectedHall.northRotation ? item.width : item.height,
      };
    });
  const siteArtTransform = selectedHall
    ? selectedHall.northRotation
      ? `matrix(0 1 -1 0 ${selectedHall.sourceWidth + selectedHall.y} ${-selectedHall.x})`
      : `translate(${-selectedHall.x} ${-selectedHall.y})`
    : undefined;
  return {
    hall,
    layout: {
      version: 1,
      name: hall.name,
      width: hall.width,
      height: hall.height,
      physicalHallId: hall.id,
      calibrated: true,
      objects: [],
      pavilionMode: 'objects',
      siteGates,
      siteObstacles,
      siteArt,
      siteSymbols,
      siteArtTransform,
      siteSigns,
      siteHalls,
    },
    stalls,
    revision: source.version,
  };
}
