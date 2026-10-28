# BITMA gate audit — 28 October 2026

Source: `BITMA Floor Plan 26.10.26.pdf`, pages 1–2. Gate source boxes are recorded in `lib/floorplan/bitma-layout.json`; `scripts/bitma_gates.py` reproduces the reviewed extraction. Positions below use each PDF hall's orientation, before the north-up campus rotation.

| Area | North | South | West | East | Openings |
| --- | --- | --- | --- | --- | --- |
| Hall 1 | Two 3 M access markers; one service door | Entry | Exit | — | 5 |
| Hall 2 | Two 3 M access markers; one service door | Entry | Exit | — | 5 |
| Hall 3 | Two 3 M access markers; one service door | Entry | Exit | — | 5 |
| Hall 4 | Three 3 M access markers; one service door | Entry | Exit | — | 6 |
| Hall 1A | Entry and exit | Entry and exit | — | — | 4 |
| Hall 6 | — | Entry | — | — | 1 |
| Hall 2A | Exit | Entry | — | — | 2 |
| Hall 4A | — | Exit on left; entry on right | — | — | 2 |
| Expo Zone | Four fire exits | Three fire exits | Cargo entry with fire-exit annotation | Exit above cargo entry; public entry below | 11 |

Total: **41 physical openings**. The west Expo Zone cargo opening has two source annotations, so it counts once. The four orange Expo Zone corner squares are crossbar markers, not doors. No separate exit is drawn for Hall 6. Unlabelled 3 M access markers retain that label without inventing an entry/exit direction.

Orange public doors, red fire exits, blue cargo gates and slate access/service markers use their calibrated source positions and marker spans. The four service doors retain the printed H 9 ft / W 7 ft 6 in clearance (2.7432 m high / 2.286 m clear width); their 3 M plan markers are distinct from that clear width. Other symbol spans are not represented as independently surveyed clear widths.

The hall walls and decorative garden bands have openings at all 41 markers in both campus and individual views. Source architecture, booth footprints and booking identities are unchanged. Screen, SVG and PDF use the same gate renderer. The Expo Zone north/south markers retain their source fire-exit role, including markers where the adjacent allocation abuts the boundary in the supplied drawing; booth geometry is not moved to invent additional clearance.

Verification covers per-hall counts, source edge and calibrated offsets, inverse campus rotation, wall interruptions, service clearances and shared cargo/fire-exit identity. The isolated production-browser check verifies every gate ID/type/edge in all nine hall views and all 41 gate markers/approaches in the downloaded SVG, alongside selection, simulated holds, fullscreen, mobile and PDF checks. Existing map and Offer Letter domain checks also pass. All 400 booth records are byte-for-byte equal to the previous committed data.
