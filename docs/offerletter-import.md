# Offer Letter import

Imported from `C:\Users\Backtend\Music\ECO EXPO` (`/admin/offerletter`). The original repository was left unchanged. The reference was run from a temporary copy with its demo data mode, using the source's dependencies.

The surrounding navigation follows the supplied black bar, rounded tabs, active curved tab and hamburger menu. It contains Registration Form, Offer Letter and Floor Map. Client List and Exhibitor were excluded as requested. Registration template shortcuts remain available below the navigation and in its menu. Barter Agreement was subsequently removed at the user's request, including its editor, styling, model, storage hook and dedicated assets. Old `#barter-agreement` bookmarks fall back to registration forms; the application no longer reads its old saved browser data.

## Source fidelity

The editor, A4 paper, pricing model, letterhead assets, seal, recipient controls, exhibition details, payment schedule, confirmation dialogs, draft/issue/revoke transitions and print control came from the source implementation. At initial import the paper CSS was byte-for-byte identical (SHA-256 `690D0C5F9868DC87C1878155E1C49F8C6D1C494001A4CC3BD9DEB9FB8DC55680`). The subsequent requested feet/per-stall layout adds a scoped compact variant; area-based offers retain the original layout. The editor uses the source Instrument Sans font and source light palette. Import paths, context and persistence were adapted for Form Studio.

The default A4 screenshots were compared at the same 794 × 1123 paper size. Differences were limited to one antialiasing row at the footer. Default PDFs were rendered using Poppler at 120 dpi: the interiors matched, with differences only in the outermost right pixel column. These checks cover the tested Chromium render and default state, not every browser or every possible content length.

Desktop and 390-pixel mobile screenshots were visually inspected. The mobile paper scales to fit, the active tab stays visible, and page width remains within the viewport. The source's A4 print isolation is scoped to the Offer Letter page so other downloads retain their existing behavior.

## Independent storage

- Offers: `localStorage[ecoexpo-formstudio-offers-v1]`.
- Uploaded seals: IndexedDB `ecoexpo-formstudio-offer-media-v1`.
- Company/contact suggestions read existing registration values and saved offers. They do not modify registration data.
- No original application API or booking requests are made.
- Save failures are reported. Unreadable stored records are preserved and saving is disabled rather than overwriting them.
- Issued terms are locked; revocation retains the original terms. Cross-tab storage events update verification status.

QR verification is a local demonstration, as in the source's demo mode. `/verify/offers/[token]` can verify only records saved on the same origin and browser profile. It explicitly states that local records cannot authenticate a production offer. A shared backend would be needed for recipients on other devices to verify an issued offer. The QR can be hidden before issuing.

## Validation

- Production build and TypeScript check passed.
- ESLint: zero errors, 15 warnings (existing floorplan dependencies and source image elements).
- 24 offer model/storage tests and 24 floorplan geometry/palette tests passed.
- Production-browser checks passed: recipient validation, live pricing, save/reload, IndexedDB seal upload, issue confirmation and field locking, QR visibility and verification, revoke confirmation and cross-tab status, mobile navigation, and registration company suggestions.
- The print control was verified to call `window.print()`. Chromium's print pipeline produced one-page A4 draft and issued offers. The rendered issued PDF was visually inspected for logos, seal, QR, tables, footer, clipping and overlap.
- Existing PDF download controls produced all three registration PDFs (28/24/28 fillable fields), the one-page Barter Agreement and the one-page landscape A3 floorplan. Floorplan expansion hides the studio navigation; Back restores it.
- Browser checks reported no page errors or `/api/` requests. Existing form sheets, editors, PDF implementation and floorplan code were unchanged.

Run `npm run test:offerletter`, `npm run test:floorplan`, and `npm run test:offerletter:browser` with a local production server on port 3010. `CHROME_PATH`, `OFFER_BROWSER_URL`, `OFFER_QA_DIR` and optional `OFFER_REFERENCE_URL` configure the browser check. It uses an isolated headless browser profile and does not alter the user's saved records.

Screenshots are in `docs/offerletter-evidence/`. Full test PDFs are generated under ignored `tmp/`.

## Feet and Hall 4 update

The Measurement unit selector offers metres and feet. Areas and dimensions are stored in metres internally, with `0.3048 m = 1 ft` and `0.09290304 sqm = 1 sq. ft.`. Switching the display unit does not mutate prices or physical allocations. Existing saved offers without unit/pricing fields remain area-based metric offers.

Per-stall pricing derives the total allocation from stall width × length × count, and the rack price from count × price per stall. The allocation field is read-only in this mode. Validation rejects fractional counts and inconsistent allocations. Contact person, designation and allocation note appear in the preview and PDF.

“New Borthers Machinery · Hall 4 offer” creates a fresh draft, preserving saved offers. It supplies Ohaidur Rahman, Managing Partner; two 8 × 8 ft stalls; 128 sq. ft.; USD 2,000 per stall; USD 4,000 total; 10% / USD 400 discount; USD 3,600 final price. The allocation note distinguishes these Hall 4 stalls from 3 × 3 sqm stalls. Its allocation summary follows dimension/count/unit edits.

Six additional model tests cover the allocation, pricing, unit switching, legacy records, counts and input validation (30 offer tests total). Browser regression also exercises the preset, unit switching, count changes, save/reload, issue lock and its A4 PDF.
