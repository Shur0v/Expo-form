require("./floorplan-runtime.cjs");
const assert = require("node:assert/strict");
const {
  previewGeometry,
  previewExamples,
  selectionContext,
  sceneBounds,
  fitScene,
  validPreviewHolds,
  canonicalHall,
} = require("../lib/floorplan/map-experience.ts");

const { tracedReference } = require("../lib/floorplan/reference-layout.ts");
const { joinedEdges } = require("../lib/floorplan/map-structure.ts");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
const g = previewGeometry("dta-2027"),
  source = tracedReference(g.hall),
  examples = previewExamples(g.stalls);
test("preview preserves every footprint and structural group", () => {
  assert.equal(g.stalls.length, 375);
  g.stalls.forEach((st, i) => {
    for (const key of [
      "x",
      "y",
      "width",
      "height",
      "rotation",
      "code",
      "color",
      "zone",
    ])
      assert.equal(st[key], source.stalls[i][key]);
  });
  assert.equal(
    joinedEdges(g.stalls, g.layout).length,
    joinedEdges(source.stalls, source.layout).length,
  );
});
test("preview IDs are stable across expo choices", () =>
  assert.deepEqual(
    g.stalls.map((s) => s.id),
    previewGeometry("dcc-2026").stalls.map((s) => s.id),
  ));

test("Brother uses four stalls and one joined company outline", () => {
  const b = examples[0];
  assert.equal(b.company, "Brother and Brother Corporation");
  assert.deepEqual(
    b.stallIds.map((id) => g.stalls.find((s) => s.id === id).code).sort(),
    ["A045", "A046", "A047", "A048"],
  );
  assert.equal(b.paths.length, 1);
});
test("pending examples match the approved fixed codes", () =>
  assert.deepEqual(
    examples
      .slice(1)
      .map((b) =>
        b.stallIds.map((id) => g.stalls.find((s) => s.id === id).code).sort(),
      ),
    [["A017", "A018"], ["B031", "B032"], ["C017", "C018"], ["D025"]],
  ));
const stall = (x, y, w = 3, h = 3) => ({
  ...g.stalls[0],
  x,
  y,
  width: w,
  height: h,
  rotation: 0,
});
const scene = { x: 0, y: 0, w: 100, h: 100 };
test("normal context is forty metres and centered", () =>
  assert.deepEqual(selectionContext([stall(48.5, 48.5)], scene), {
    x: 30,
    y: 30,
    w: 40,
    h: 40,
  }));
test("eight metres on right transfers twelve to left", () =>
  assert.deepEqual(selectionContext([stall(90.5, 48.5)], scene), {
    x: 60,
    y: 30,
    w: 40,
    h: 40,
  }));
test("corner clamping transfers horizontal and vertical space", () =>
  assert.deepEqual(selectionContext([stall(97, 0)], scene), {
    x: 60,
    y: 0,
    w: 40,
    h: 40,
  }));
for (const [axis, value, coordinate, expected] of [
  ["horizontal", "left", "x", 46.5],
  ["horizontal", "right", "x", 13.5],
  ["vertical", "top", "y", 46.5],
  ["vertical", "bottom", "y", 13.5],
])
  test(axis + " " + value + " uses two metre inset", () =>
    assert.equal(
      selectionContext([stall(48.5, 48.5)], scene, {
        horizontal: "center",
        vertical: "center",
        [axis]: value,
      })[coordinate],
      expected,
    ),
  );
test("multiple selections preserve their entire bounds", () =>
  assert.deepEqual(selectionContext([stall(20, 20), stall(70, 30)], scene), {
    x: 18,
    y: 6.5,
    w: 57,
    h: 40,
  }));
test("only oversized dimension grows", () => {
  const r = selectionContext([stall(20, 20, 50, 3)], scene);
  assert.equal(r.w, 54);
  assert.equal(r.h, 40);
});
test("scene includes garden without altering hall dimensions", () => {
  const r = sceneBounds(g.layout);
  assert(
    r.x <= -3 &&
      r.y <= -3 &&
      r.x + r.w >= g.layout.width + 3 &&
      r.y + r.h >= g.layout.height + 3,
  );
  assert.equal(g.layout.width, 154.6);
});
test("contain camera preserves complete focus on portrait and landscape", () => {
  for (const [w, h] of [
    [1600, 700],
    [390, 600],
  ]) {
    const r = fitScene({ x: 10, y: 20, w: 40, h: 40 }, w, h);
    assert(Math.abs(r.w / r.h - w / h) < 1e-9);
    assert(r.x <= 10 && r.y <= 20 && r.x + r.w >= 50 && r.y + r.h >= 60);
  }
});
test("cover camera fills viewport without stretching", () => {
  const r = fitScene(scene, 1600, 700, "cover");
  assert(Math.abs(r.w / r.h - 1600 / 700) < 1e-9);
  assert(r.w === 100 || r.h === 100);
});
test("hold sanitizer removes expired blocked unknown and duplicated IDs", () => {
  const blocked = new Set(examples.flatMap((b) => b.stallIds)),
    a = g.stalls.find((st) => !blocked.has(st.id)).id;
  const future = new Date(Date.now() + 3600000).toISOString();
  assert.deepEqual(
    validPreviewHolds(
      [
        { id: "a", expiresAt: future, stallIds: [a, a, "unknown", ...blocked] },
        { id: "expired", expiresAt: "2000-01-01", stallIds: [a] },
      ],
      g.stalls,
      blocked,
    ),
    [{ id: "a", expiresAt: future, stallIds: [a] }],
  );
});
console.log(`${count} map experience tests passed`);
