import source from './bitma-layout.json';
import type { MapGeometry } from './floorplan';
import type { Hall, Stall } from './types';
import type { GateSide, MapGate } from './map-gates';

export const BITMA_EDITION = 'bitma-2027';
export const bitmaSource = source;

/** Campus placements are an illustrative site plan; booth geometry stays metric and unchanged. */
export const BITMA_CAMPUS = {
  // The overview is a campus plan, not a compact hall collage. Each hall keeps
  // its exact PDF footprint; these offsets give the buildings clear breathing room.
  width: 800,
  height: 570,
  boundary: [[0,390],[130,390],[130,260],[265,260],[265,105],[300,105],[300,0],[520,0],[520,70],[565,70],[565,120],[735,120],[790,170],[735,220],[735,300],[770,335],[770,500],[0,500]] as const,
  origins: {
    '1': { x: 625, y: 420 },
    '2': { x: 385, y: 320 },
    '3': { x: 610, y: 175 },
    '4': { x: 350, y: 20 },
    '1A': { x: 500, y: 320 },
    '6': { x: 150, y: 300 },
    '2A': { x: 405, y: 175 },
    '4A': { x: 450, y: 20 },
    EZ: { x: 20, y: 420 },
  } satisfies Record<string, { x: number; y: number }>,
  features: [
    { id: 'parking-north-west', kind: 'parking', x: 302, y: 30, width: 38, height: 26 },
    { id: 'north-east-service-area', kind: 'service', x: 490, y: 8, width: 15, height: 24 },
    { id: 'parking-hall-4a-east', kind: 'parking', x: 490, y: 48, width: 18, height: 17 },
    { id: 'parking-central-north', kind: 'parking', x: 410, y: 115, width: 22, height: 15 },
    { id: 'parking-hall-3-east', kind: 'parking', x: 696, y: 142, width: 20, height: 14 },
    { id: 'parking-hall-1a-east', kind: 'parking', x: 548, y: 282, width: 24, height: 18 },
    { id: 'parking-hall-1-south-west', kind: 'parking', x: 565, y: 390, width: 20, height: 15 },
    { id: 'prayer-room', kind: 'prayer', x: 310, y: 170, width: 15, height: 38 },
    { id: 'iccb-office', kind: 'office', x: 425, y: 332, width: 24, height: 25 },
    { id: 'inauguration-service-hall', kind: 'service', x: 300, y: 350, width: 18, height: 55 },
  ],
  amenities: {
    '2': { food: { x: 379, y: 340 }, service: { x: 379, y: 343 } },
    '3': { food: { x: 603.5, y: 180 }, service: { x: 603.5, y: 183 } },
    '4': { food: { x: 382, y: 38 }, service: { x: 382, y: 41 } },
  },
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
