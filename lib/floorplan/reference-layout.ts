import type { Hall, Stall } from "./types";
import type { FloorLayout, MapObject, MapObjectKind } from "./floorplan";
export const REFERENCE_VERSION = "dta-dcc-source-v1" as const;
export const REFERENCE_STALL_COUNT = 375;
export const referenceFrame = { x: -5.6, y: -8, w: 164.7, h: 67.7 };
/** Coordinates traced from the supplied 1647 × 677 reference, not a regular grid. */
export function tracedReference(h: Hall): {
  layout: FloorLayout;
  stalls: Stall[];
} {
  const objects: MapObject[] = [],
    stalls: Stall[] = [];
  const x = (v: number) => (v - 56) / 10,
    y = (v: number) => (v - 80) / 10;
  const feature = (
    kind: MapObjectKind,
    px: number,
    py: number,
    w: number,
    hh: number,
    label: string,
    color: string,
    appearance?: MapObject["appearance"],
    points?: string,
  ) =>
    objects.push({
      id: crypto.randomUUID(),
      kind,
      x: x(px),
      y: y(py),
      width: w / 10,
      height: hh / 10,
      rotation: 0,
      label,
      color,
      appearance,
      points,
      locked: false,
    });
  feature("pavilion", 102, 95, 1412, 268, "", "#e4b09e");
  feature("pavilion", 145, 365, 1369, 232, "", "#e8cc8b");
  feature("pavilion", 145, 365, 740, 94, "", "#bdc88e");
  feature("pavilion", 145, 460, 1009, 85, "", "#e6b579");
  feature("pavilion", 130, 545, 1049, 52, "", "#e6b579");
  feature(
    "pavilion",
    145,
    145,
    630,
    210,
    "",
    "#e5dad8",
    undefined,
    "0,0 43,0 43,9.5 63,9.5 63,21 0,21",
  );
  feature("pavilion", 1515, 94, 79, 504, "", "#cdcece");
  const booth = (
    prefix: string,
    code: number,
    px: number,
    py: number,
    w: number,
    hh: number,
    color: string,
    zone: string,
    group: string,
    displayLabel?: string,
    overrideCode?: string,
  ) =>
    stalls.push({
      id: `stall-${crypto.randomUUID()}`,
      editionId: h.editionId,
      hallId: h.id,
      physicalSpaceId: `${prefix}-${code}`,
      groupId: group,
      zone,
      code: overrideCode || `${prefix}${String(code).padStart(3, "0")}`,
      x: x(px),
      y: y(py),
      width: w / 10,
      height: hh / 10,
      rotation: 0,
      color,
      displayLabel,
      dimensionLabel: "3m X 3m",
      price: overrideCode ? 480000 : 240000,
      type: "stall",
      placed: true,
      power: 0,
      air: false,
      water: false,
      loading: 0,
      clearance: 0,
    });
  // L001–L012, doorway, L013–L026, doorway, L027–L045.
  let n = 1;
  for (const [start, end, count] of [
    [105, 465, 12],
    [495, 914, 14],
    [944, 1512, 19],
  ]) {
    const group = crypto.randomUUID(),
      w = (end - start) / count;
    for (let i = 0; i < count; i++)
      booth(
        "L",
        n++,
        start + i * w,
        104,
        w,
        30,
        "#efcec0",
        "DTA perimeter",
        group,
      );
  }
  const aStarts = [151, 300.5, 450, 599.5, 749, 898.5, 1048, 1197.5, 1347];
  for (let b = 0; b < aStarts.length; b++) {
    const group = crypto.randomUUID();
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++)
        booth(
          "A",
          b * 8 + (row ? 8 - col : col + 1),
          aStarts[b] + col * 29.9,
          165 + row * 30,
          29.9,
          30,
          "#efcec0",
          b < 3 ? "DTA Booked as China Pavilion" : "DTA 2027",
          group,
        );
  }
  const bStarts = [
    151, 240.8, 330.6, 420.4, 510.2, 600, 689.8, 779.6, 869.4, 959.2, 1049,
    1138.8, 1228.6, 1318.4, 1408.2,
  ];
  for (let b = 0; b < bStarts.length; b++) {
    const group = crypto.randomUUID(),
      order = [1, 2, 6, 3, 5, 4];
    for (let i = 0; i < 6; i++)
      booth(
        "B",
        b * 6 + order[i],
        bStarts[b] + (i % 2) * 29.9,
        255 + Math.floor(i / 2) * 30,
        29.9,
        30,
        "#efcec0",
        b < 7 ? "DTA Booked as China Pavilion" : "DTA 2027",
        group,
      );
  }
  for (let b = 0; b < 9; b++) {
    const group = crypto.randomUUID(),
      start = 156 + b * 149.5,
      color = b < 5 ? "#d4deb5" : "#f2d188",
      zone = b < 5 ? "DCC Booked as Pakistan Pavilion" : "DCC 2027";
    for (let row = 0; row < 2; row++)
      for (let col = 0; col < 4; col++) {
        if (b === 0 && row === 0 && col === 1) continue;
        const code = b * 8 + (row ? 8 - col : col + 1),
          merged = b === 0 && row === 0 && col === 0;
        booth(
          "C",
          code,
          start + col * 29.9,
          375 + row * 30,
          merged ? 59.8 : 29.9,
          30,
          color,
          zone,
          group,
          merged ? "Rainbow Inks" : undefined,
          merged ? "C001-C002" : undefined,
        );
      }
  }
  for (let b = 0; b < 16; b++) {
    const group = crypto.randomUUID(),
      order = [1, 2, 4, 3];
    for (let i = 0; i < 4; i++)
      booth(
        "D",
        b * 4 + order[i],
        156 + b * 84.1 + (i % 2) * 29.9,
        465 + Math.floor(i / 2) * 30,
        29.9,
        30,
        b < 12 ? "#f9a558" : "#eec77c",
        b < 12 ? "DCC Booked as China Pavilion" : "DCC 2027",
        group,
      );
  }
  n = 1;
  for (const [start, count, width] of [
    [141, 3, 90],
    [255, 2, 60],
    [339, 2, 60],
    [423, 3, 90],
    [543, 2, 60],
    [627, 2, 60],
    [711, 2, 60],
    [795, 3, 110],
    [943, 2, 60],
    [1027, 2, 60],
    [1111, 2, 60],
    [1195, 2, 60],
    [1279, 2, 60],
    [1363, 2, 60],
    [1447, 2, 60],
  ]) {
    const group = crypto.randomUUID();
    for (let i = 0; i < count; i++)
      booth(
        "R",
        n++,
        start + (i * width) / count,
        555,
        width / count,
        30,
        start < 1195 ? "#ed9f5d" : "#e9c77e",
        start < 1195 ? "DCC Booked as China Pavilion" : "DCC 2027",
        group,
      );
  }
  const text = (px: number, baseline: number, label: string, size = 14) => {
    const w = label.length * size * 0.56;
    feature("text", px, baseline - size, w, size * 1.15, label, "#242424");
  };
  for (const baseline of [157, 247]) {
    text(167, baseline, "DTA Booked as China Pavilion");
    for (const px of [740, 980, 1220]) text(px, baseline, "DTA 2027");
  }
  text(187, 457, "DCC Booked as Pakistan Pavilion");
  text(684, 457, "DCC Booked as Pakistan Pavilion");
  text(352, 550, "DCC Booked as China Pavilion");
  text(891, 550, "DCC Booked as China Pavilion");
  text(1190, 550, "DCC 2027");
  text(1420, 550, "DCC 2027");
  feature("facility", 74, 272, 21, 161, "REGISTRATION BOOTH", "#b12d26");
  feature("facility", 58, 143, 16, 57, "ENTRY", "#b12d26");
  feature("facility", 58, 505, 16, 45, "EXIT", "#b12d26");
  feature(
    "facility",
    1525,
    162,
    50,
    135,
    "REFRESHMENT ZONE",
    "#e8c9c1",
    "hatched",
  );
  feature("facility", 1525, 297, 50, 135, "FOOD ZONE", "#e8c9c1", "hatched");
  feature(
    "facility",
    1525,
    465,
    50,
    60,
    "ORGANIZER OFFICE",
    "#e8c9c1",
    "hatched",
  );
  feature("entrance", 468, 80, 25, 15, "", "#776d5b", "door-north");
  feature("entrance", 917, 80, 25, 15, "", "#776d5b", "door-north");
  feature("entrance", 520, 598, 25, 15, "", "#776d5b", "door-south");
  feature("entrance", 917, 598, 25, 15, "", "#776d5b", "door-south");
  return {
    layout: {
      version: 1,
      referenceVersion: REFERENCE_VERSION,
      name: "DTA / DCC · Original reference layout",
      width: 154.6,
      height: 53.6,
      calibrated: false,
      physicalHallId: h.physicalHallId || h.id,
      objects,
    },
    stalls,
  };
}
