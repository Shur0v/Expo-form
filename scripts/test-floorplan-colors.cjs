require("./floorplan-runtime.cjs");
const assert = require("node:assert/strict");
const C = require("../lib/floorplan/map-colors.ts");
const P = require("../components/floorplan/presentation.ts");
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("PASS " + name);
};
test("all family shades choose readable foreground with 4.5:1 contrast", () => {
  for (const shades of Object.values(C.mapPalette))
    for (const hex of Object.values(shades))
      assert(C.contrastRatio(hex, C.textColor(hex)) >= 4.5);
});
test("custom light and dark backgrounds choose dark and white text", () => {
  assert.equal(C.textColor("#000000"), "#ffffff");
  assert.equal(C.textColor("#172554"), "#ffffff");
  assert.equal(C.textColor("#ffffff"), C.mapTheme.scene.ink);
  for (const hex of ["#abc", "#777777", "#ff48ab", "#048ab3"])
    assert(C.contrastRatio(hex, C.textColor(hex)) >= 4.5);
});
test("selection and own holds share the blue family, pending amber, confirmed teal", () => {
  const st = { zone: "DTA", color: "#efcec0" };
  assert.equal(P.faceColor(st, "available", true), C.mapPalette.blue[300]);
  assert.equal(P.faceColor(st, "own-held"), C.mapPalette.blue[300]);
  assert.equal(P.faceColor(st, "held"), C.mapPalette.amber[200]);
  assert.equal(P.faceColor(st, "confirmed"), C.mapPalette.teal[700]);
  assert.equal(P.faceColor(st, "other-confirmed"), C.mapPalette.teal[700]);
  assert.equal(P.companyColor("any-company"), C.mapPalette.teal[700]);
});
test("known faces extrude into their own shade family", () => {
  for (const shades of Object.values(C.mapPalette)) {
    assert.equal(P.frontColor(shades[200], 0.7), shades[400]);
    assert.equal(P.frontColor(shades[200], 0.9), shades[300]);
    assert.equal(P.frontColor(shades[700], 0.7), shades[900]);
  }
});
test("shade controls retain their range and full contrast restores the face", () => {
  for (const shades of Object.values(C.mapPalette)) {
    assert.equal(P.frontColor(shades[200],1),shades[200]);
    assert.notEqual(P.frontColor(shades[200],.2),P.frontColor(shades[200],.7));
  }
});
test("default legacy colors refresh without modifying persisted custom colors", () => {
  const st = { zone: "DTA", color: "#efcec0" };
  const before = JSON.stringify(st);
  assert.equal(P.boothColor(st), C.mapPalette.rose[200]);
  assert.equal(JSON.stringify(st), before);
  assert.equal(P.boothColor({ ...st, color: "#112233" }), "#112233");
  assert.equal(P.boothColor({ ...st, color: "#000000" }), "#000000");
});
test("pavilion washes and pending/selection/confirmation strokes share semantic families", () => {
  assert.equal(C.pavilionColor("#efcec0"), C.mapPalette.rose[100]);
  assert.equal(P.boothStroke("held"), C.mapTheme.pending.border);
  assert.equal(P.boothStroke("own-held"), C.mapTheme.selection.border);
  assert.equal(P.boothStroke("confirmed"), C.mapTheme.confirmed.border);
});
console.log(`${count} palette checks passed`);
