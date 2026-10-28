# BITMA 2027 interactive map

BITMA 2027 is a separate option in Floor Map, alongside the existing DTA/DTG preview choices. The viewer reuses the existing camera, zoom, pan, 2D/2.5D surfaces, Gaussian shadows, review dialog, simulated holds, fullscreen transitions and export pipeline. A campus overview and nine source-oriented hall views share stable physical allocation IDs.

## Sources and calibration

The primary source is `BITMA Floor Plan 26.10.26.pdf` (two vector PDF pages). `@BITMA Floor Plan 12.10.26.pdf` was compared to identify earlier divisions. The October 26 layout takes precedence. Original PDFs and the original ECO EXPO repository were not modified.

| Area | Internal width × length, metres | Basis |
| --- | --- | --- |
| Hall 1 | 62.48 × 22.55 | Printed metric dimensions |
| Hall 2 | 62.48 × 22.55 | Printed metric dimensions |
| Hall 3 | 62.48 × 22.55 | Printed metric dimensions |
| Hall 4 | 69.7992 × 28.0416 | Printed dimensions, 229 × 92 ft |
| Hall 1A | 37 × 44 | Confirmed by the user |
| Hall 6 | 37 × 44 | Confirmed by the user |
| Hall 2A | 15.24 × 53.6448 | Printed 50 × 176 ft, exact conversion |
| Hall 4A | 15 × 60 | Printed metric dimensions |
| Expo Zone | 250 × 50 | Derived from the repeated printed 3/6 m booth grid and vector boundary |

Every rentable width/height comes from printed booth dimensions, including 27 Hall 4 booths measuring 8 × 8 ft (2.4384 × 2.4384 m). Integer metre dimensions are not substituted for imperial booths. Unlabelled offsets are traced from calibrated vector positions; small Illustrator seam drift (at most 2 cm) is reconciled without resizing rentable footprints. These derived offsets are not surveyed engineering measurements.

Campus spacing is explicitly illustrative. Each hall is calibrated independently, and campus distances are excluded from aisle measurements. The campus view turns the Hall 2/4/6 diagrams north-up according to their source compasses; individual views retain the PDF orientation. The confirmed internal hall dimensions and all booth areas survive those transforms unchanged.

## Inventory and corrections

| Area | Selectable allocations |
| --- | ---: |
| Hall 1 | 9 |
| Hall 2 | 9 |
| Hall 3 | 9 |
| Hall 4 | 62 |
| Hall 1A | 27 |
| Hall 6 | 20 |
| Hall 2A | 14 |
| Hall 4A | 80 |
| Expo Zone | 170 |
| Total | 400 |

An allocation can contain a printed code range. Merged ranges stay as a single physical selectable footprint because the PDF does not supply internal boundaries for subdividing every range. Code counts are not multiplied by an assumed 9 sqm to calculate area.

- Hall 1/2 booth prefixes were corrected to their hall headings, following the user's instruction to fix known source mistakes. Printed codes remain in the JSON provenance.
- The 192 sqm allocations in Halls 1–3 retain the actual L-shaped polygon: 165 + 27 sqm. Their empty notches do not render or select as rentable space.
- The Expo Zone's two corner allocations are 27 sqm L shapes, not 3 × 9 m rectangles overlapping adjacent booths.
- Hall 4A has 80 booths of 2.5 × 2.5 m (500 sqm rentable area). Its two longitudinal aisles are 2 m; the centre cross-gap is 2.5 m. Perimeter cross-gaps remain 1.22 m.
- Hall 2A's source drawing proportions differ from its printed length. Its booth rows use 45 m of actual allocations plus five 1.22 m cross-gaps, giving 51.10 m per side. The remaining 2.5448 m is split into two 1.2724 m end offsets inside the printed 176 ft hall. Booth dimensions and the 2.5 m centre aisle are preserved.
- Source company annotations are retained as labels/hover details. They are not promoted to live confirmed bookings. No map prices were supplied; the UI says “Unpriced” / “Pricing not supplied”.

The map uses the existing pastel colour families, exposed-edge extrusion and soft shadows. Original marketing-page backgrounds and poster headings are replaced by the current map's viewer design, as requested. Native PDF AC/access/service annotations are carried over as source signs; no new physical dimensions are assigned to them.

Stair drawings and roof WC icons are extracted as original vector paths in their calibrated positions. Clipped source paths with detached off-region control points are excluded. Orange entry/exit gates are rendered from their audited opening geometry; gate labels and the cargo signs use clean vector artwork. This is architectural artwork, not new rentable allocations. The same artwork and source-oriented transforms are used in the screen, SVG and PDF exports.

Stair regions are excluded from clear-aisle calculations, so dimension arrows do not describe a route through the source stair artwork. These non-rentable extents follow the drawing; no rentable booth is resized around them.

## Selection and simulation

“Area select” enables a soft translucent drag rectangle. Polygon intersection determines which allocations are selected, including concave outlines. Clicking, keyboard selection, review and clear are also available. Selected faces and held faces use the current map's blue palette. A drag through an empty notch or aisle selects no fictitious floor space.

Aisle dimensions are measured independently inside each hall. Repeated labels for the same continuous corridor are collapsed, so an aisle passing multiple rows is not labelled once per row. Campus gaps never appear as measured indoor aisles.

The user explicitly chose the existing simulated booking behaviour. Holds last 24 hours, persist in session storage and are isolated using the `formstudio-floorplan-bitma-2027` account suffix. Switching hall views validates against the complete BITMA inventory, preserving holds in other halls. Existing DTA/DCC hold storage is unchanged. No booking, payment or original-application API request is made.

## Reproduction and QA

`scripts/trace-bitma-source.py` extracts PDF rectangles/curves, rotated text, printed dimensions and code provenance, and compares versions. It explicitly recovers reviewed open dashed outlines that Illustrator stores as separate strokes. Use a Python environment with `pdfplumber`:

```powershell
python scripts/trace-bitma-source.py "path/to/BITMA Floor Plan 26.10.26.pdf" "path/to/@BITMA Floor Plan 12.10.26.pdf"
python scripts/build-bitma-layout.py "path/to/BITMA Floor Plan 26.10.26.pdf"
```

The build script reads the reviewed inventory plus the intermediate `latest-1.json` / `latest-2.json` word/rectangle dumps under `tmp/bitma-source/`. The committed `lib/floorplan/bitma-layout.json` is the independent runtime geometry and contains source bounding boxes, original codes, corrections and source hash.

`npm run test:bitma` verifies inventory counts, unique IDs, all hall boundaries, all pairwise overlaps, orientation round-trips, imperial conversions, true polygon areas/notches, aisle deduplication, area selection and hold isolation/expiry. `npm run test:bitma:browser` runs an isolated local Chromium profile; it accepts `BITMA_BROWSER_URL`, `BITMA_QA_DIR` and `CHROME_PATH`. It checks every hall, area selection, review, holds, notch hit testing, mobile/fullscreen, SVG contents and four PDF downloads. The existing floorplan and Offer Letter regression checks remain available.

PDF export reuses the current high-resolution pipeline that preserves the blurred shadow. SVG retains vector shapes and text. Campus and individual hall exports are supported; zooming/focusing does not alter the authoritative booth dimensions.

## Verification record (28 October 2026)

- Production build and TypeScript passed.
- 79 domain checks passed: 25 BITMA geometry/selection/hold checks, 24 existing map checks and 30 Offer Letter checks.
- The isolated production-browser run passed all nine hall views, 400 SVG allocation labels, keyboard selection, pan/zoom, soft area selection, review/clear, 24-hour holds, cross-hall/reload persistence, expiry, occupied-hold handling, concave-notch hit testing, shared corridor labels, 2D/2.5D, fullscreen/back and mobile layout.
- Four actual download controls produced one-page landscape A3 PDFs: campus, selected Hall 4 booths, selected Hall 1 composite and Hall 4A. Poppler renders were inspected for shadows, source artwork, garden bands, selection colours, labels and clipping. Export now serializes the garden component and suppresses partly clipped hall headings in selection crops.
- Existing registration/Offer Letter browser regression passed. Registration PDFs retain their 28/24/28 fillable fields. The existing DTA/DCC map and export controls passed too. No original-source API requests or browser runtime errors occurred.
- Changed-source lint has zero errors and seven existing imported-camera hook warnings. The remaining existing Offer Letter image warnings are unchanged.

Gate and amenity presentation was refined afterwards: the cargo-entry triangle has a clean vector forklift, all gates render above the booth faces, Food Court and Service Booth markers use matching outlined buttons, and the lower-left stair artwork is shifted down 0.65 m. Updated campus, Hall 3/4, selection, review and mobile evidence is saved in `docs/bitma-evidence/`.

Final screenshots and PDF-render evidence are saved in `docs/bitma-evidence/`. The machine-readable dimension/area/correction audit is `docs/bitma-geometry-audit.json`. Generated test PDFs remain under ignored `tmp/`.

The subsequent complete gate audit, including public doors, fire exits, cargo gates, service doors and unlabelled access openings, is recorded in [bitma-gates.md](bitma-gates.md). All 41 openings have shared screen/export geometry and wall/garden interruptions. BITMA now has 25 domain checks.
