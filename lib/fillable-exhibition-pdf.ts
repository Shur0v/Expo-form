import { PDFDocument, PDFName, drawCheckMark, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

interface FieldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExhibitionPdfFields {
  pageIndex: number;
  prefix: string;
  texts: { name: string; value: string; fontSize: number; rect: FieldRect }[];
  checks: { name: string; checked: boolean; rect: FieldRect }[];
}

/** Read field geometry from the frozen preview before hiding its rendered values. */
export function collectExhibitionPdfFields(sheet: HTMLElement, pageIndex: number): ExhibitionPdfFields {
  const bounds = sheet.getBoundingClientRect();
  const rect = (element: Element, inset = 0): FieldRect => {
    const box = element.getBoundingClientRect();
    return {
      x: (box.left - bounds.left + inset) * 595.28 / bounds.width,
      y: (bounds.bottom - box.bottom + inset) * 841.89 / bounds.height,
      width: Math.max(1, box.width - inset * 2) * 595.28 / bounds.width,
      height: Math.max(1, box.height - inset * 2) * 841.89 / bounds.height,
    };
  };
  const texts = Array.from(sheet.querySelectorAll<HTMLInputElement>('input[type="text"][name]')).map((input) => {
    const style = getComputedStyle(input);
    const fieldRect = rect(input, 2);
    const padding = Math.max(0, parseFloat(style.paddingLeft) - 4) * 595.28 / bounds.width;
    fieldRect.x += padding;
    fieldRect.width -= padding;
    const field = {
      name: input.name,
      value: input.value,
      fontSize: parseFloat(style.fontSize) * 595.28 / bounds.width,
      rect: fieldRect,
    };
    // Keep the styled box in the background, but do not bake its old value into it.
    input.value = '';
    input.setAttribute('value', '');
    return field;
  });
  const checks = Array.from(sheet.querySelectorAll<HTMLElement>('[data-pdf-checkbox]')).map((button) => {
    const box = button.firstElementChild;
    if (!box) throw new Error('A form checkbox could not be exported.');
    const field = {
      name: button.dataset.pdfCheckbox!,
      checked: button.dataset.pdfChecked === 'true',
      rect: rect(box, 2),
    };
    box.replaceChildren();
    return field;
  });
  return { pageIndex, prefix: sheet.dataset.pdfFormId!, texts, checks };
}

/** Add standard, unflattened AcroForm fields that PDF readers can edit and save. */
export async function addEditableExhibitionFields(bytes: ArrayBuffer, pages: ExhibitionPdfFields[]): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  doc.registerFontkit(fontkit);
  const response = await fetch('/assets/fonts/NotoSans.ttf');
  if (!response.ok) throw new Error('The PDF form font could not be loaded.');
  // Embed the full font so recipients can enter characters beyond the initial values.
  const font = await doc.embedFont(await response.arrayBuffer());
  const form = doc.getForm();
  // Readers need the font in the form's default resources when regenerating
  // appearances after the recipient edits a value, not just in the initial AP.
  form.acroForm.dict.set(PDFName.of('DR'), doc.context.obj({ Font: { [font.name]: font.ref } }));
  const safeName = (value: string) => encodeURIComponent(value).replaceAll('.', '%2E');
  for (const fields of pages) {
    const page = doc.getPage(fields.pageIndex);
    page.node.set(PDFName.of('Tabs'), PDFName.of('A'));
    for (const item of fields.texts) {
      const field = form.createTextField(`${fields.prefix}.${safeName(item.name)}`);
      field.setText(item.value);
      field.addToPage(page, {
        ...item.rect, font, borderWidth: 0, backgroundColor: undefined,
        borderColor: undefined, textColor: rgb(0.06, 0.09, 0.16),
      });
      // Match the preview size, shrinking long prefilled values to fit the visible box.
      const textWidth = font.widthOfTextAtSize(item.value || ' ', item.fontSize);
      const size = Math.min(item.fontSize, item.fontSize * Math.max(1, item.rect.width - 4) / textWidth);
      field.setFontSize(Math.max(4, size));
      field.updateAppearances(font);
    }
    for (const item of fields.checks) {
      const field = form.createCheckBox(`${fields.prefix}.${safeName(item.name)}`);
      field.addToPage(page, { ...item.rect, borderWidth: 0, backgroundColor: undefined, borderColor: undefined, textColor: rgb(0.06, 0.09, 0.16) });
      if (item.checked) field.check();
      field.updateAppearances((_field, widget) => {
        const { width, height } = widget.getRectangle();
        return {
          normal: {
            on: drawCheckMark({ x: width / 2, y: height / 2, size: Math.min(width, height) * 0.75, thickness: 1.4, color: rgb(0.06, 0.09, 0.16) }),
            off: [],
          },
        };
      });
    }
  }
  form.updateFieldAppearances(font);
  return doc.save();
}
