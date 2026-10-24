# Barter agreement implementation QA

final result: passed

## Reference and rendered evidence

- Source: user-supplied `Eco Expo Barter Agreement.pdf`, one A4 page.
- Source render: `C:/Users/Backtend/AppData/Local/Temp/eco-barter/source-1.png` (1132 × 1600).
- Browser-rendered document: `C:/Users/Backtend/AppData/Local/Temp/eco-barter/implementation-agreement.png` (794 × 1122 CSS pixels).
- Browser-rendered studio: `C:/Users/Backtend/AppData/Local/Temp/eco-barter/implementation-desktop.png`, desktop viewport 1440 × 1280, density 1.
- Full comparison: `C:/Users/Backtend/AppData/Local/Temp/eco-barter/design-comparison-final.png`; source normalized to 794 × 1122 beside the implementation at the same size.
- Focused header/company/signature comparison: `C:/Users/Backtend/AppData/Local/Temp/eco-barter/design-focused.png`, followed by the revised full comparison and rendered default PDF.
- State: default agreement content restored after editing tests; Company editor selected.

## Fidelity and comparison history

- Typography: initially the title was too wide. Replaced the broad fallback heading with Roboto Condensed and reduced its size. Revised comparison confirms the compact source hierarchy. Body text uses Arial; this is a close recreation, not a pixel-identical PDF overlay.
- Spacing: corrected page side margins. Removed unused ruled term lines as requested; terms now wrap and expand naturally. The signature/footer region remains at the bottom of a default A4 page.
- Colors: white page, near-black rules and text, original color branding.
- Assets: partner logo and supplied seal/signature extracted from a high-resolution source render, without redrawing. Both logo positions are preserved; signature visibility and replacement are configurable.
- Content: all 15 company fields, 3 offerer terms, 10 offeree terms, declaration, signatories, partner address, and footer note preserved. Source spelling retained. Empty term entries and redundant whitespace omitted from the document.
- Narrow layout: fourth navigation item is accessible through the wrapping menu; editor stacks below the fixed-width A4 preview. The document retains A4 dimensions with horizontal scrolling where needed.
- No outstanding actionable P0/P1/P2 issues in the tested states.

## Interaction and export checks

- Dedicated Company, Terms, Signing and Layout controls present; the existing Form Studio Customizer component is unchanged.
- Company edits synchronize between editor and preview, persist after reload, and the fourth page is restored through its URL hash.
- Term add/remove works; adding an empty item does not create a blank document line.
- Whitespace/newline normalization verified in rendered terms.
- Supplied signature visibility can be toggled off and on.
- Default agreement download: 1 A4 page, visually rendered and checked.
- Stress test with an extended term: 3 A4 pages, footer/signature content retained; original content restored afterward.
- Original DTA form download: 1 A4 page. All 3 Forms download: 3 A4 pages, excluding the independent barter agreement.
- Browser error logs: no errors in the tested interactions.
- Production build, TypeScript validation, scoped ESLint and whitespace checks passed.

## Limits

- Barter agreement export remains a high-resolution rendered PDF; it does not create interactive AcroForm fields. Exhibition forms use the editable export described below.
- Terms taller than an entire A4 page necessarily continue across pages; normal paragraphs and the signing block are kept together when they fit.
- Original Myriad typefaces are approximated with a bundled condensed web font. Intentional compact spacing differs from the original unused ruled lines.

## Implementation checklist

- [x] Fourth menu tab and independent saved agreement state.
- [x] Dedicated editor and source artwork.
- [x] Compact, wrapping document content.
- [x] PDF download and long-content pagination.
- [x] Existing three-form editor and export regression checks.
- [x] Revised browser/source comparison and PDF visual check.

## Editable exhibition PDF follow-up

- DTA and DIDMEE export 17 text fields and 10 independent checkboxes each; DCC exports 17 text fields and 6 checkboxes. Custom extra text fields and edited option lists are collected from the current rendered layout.
- The combined download contains 77 standard editable fields on three A4 pages. Form names are scoped by exhibition so editing one page does not change another page.
- Static design is captured with data values and ticks removed; live AcroForm widgets carry the values, preventing old content from remaining under cleared fields.
- Full licensed Noto Sans font is embedded in appearances and the form's default resources. The license is shipped beside the font.
- Downloaded blank and populated files were checked for canonical field-tree entries, writable flags, widget appearances, and checked/unchecked states. An independent save/reopen test changed text on all three pages and toggled both on/off checkbox states; all persisted.
- Final PDF was rendered with PDFium before and after the save/reopen test. Labels, artwork, entered text, and changed ticks remain visible. Poppler's rendering of these transparent widgets is less reliable, so PDFium was used for final visual verification.
- Recipients must use their PDF reader's Save, Save As, or Download with changes action before returning the file. Saving changes is controlled by the reader, not by the website once the file has been downloaded.
