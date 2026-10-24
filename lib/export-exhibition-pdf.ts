/** Capture the rendered sheets so custom artwork, fields and theme match the preview. */
export async function exportExhibitionPdf(sheets: HTMLElement[], filename: string) {
  if (!sheets.length) throw new Error('No forms are available to export.');

  // Freeze the clicked version, even if the user switches forms during export.
  const snapshot = document.createElement('div');
  snapshot.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;';
  snapshot.setAttribute('aria-hidden', 'true');
  const copies = sheets.map((sheet) => {
    const copy = sheet.cloneNode(true) as HTMLElement;
    copy.removeAttribute('data-exhibition-sheet');
    const fields = sheet.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    copy.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field, i) => {
      if (field.type !== 'file') field.value = fields[i].value;
    });
    snapshot.appendChild(copy);
    return copy;
  });
  document.body.appendChild(snapshot);

  try {
    const [{ toCanvas }, { jsPDF }] = await Promise.all([
      import('html-to-image'),
      import('jspdf'),
    ]);
    await document.fonts.ready;
    await Promise.all(copies.flatMap((sheet) =>
      Array.from(sheet.querySelectorAll('img')).map((img) => img.decode())
    ));

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    let pageCount = 0;
    for (const sheet of copies) {
      const canvas = await toCanvas(sheet, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        // Exclude upload controls, hover overlays and edit-only buttons.
        filter: (node) => !(node instanceof Element && node.classList.contains('print:hidden')),
        style: { boxShadow: 'none', outline: 'none' },
      });
      if (sheet.dataset.pdfFlow === 'true') {
        // Longer agreements continue onto A4 pages at paragraph/section boundaries.
        const sheetBox = sheet.getBoundingClientRect();
        const scale = canvas.width / sheetBox.width;
        const pageHeight = Math.floor(canvas.width * 297 / 210);
        const blocks = Array.from(sheet.querySelectorAll<HTMLElement>('[data-pdf-block]')).map((block) => {
          const box = block.getBoundingClientRect();
          return { top: Math.floor((box.top - sheetBox.top) * scale), bottom: Math.ceil((box.bottom - sheetBox.top) * scale) };
        });
        for (let start = 0; start < canvas.height;) {
          let end = Math.min(start + pageHeight, canvas.height);
          const crossing = blocks.find((block) => block.top < end && block.bottom > end && block.top > start);
          if (crossing) end = crossing.top;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeight;
          const context = pageCanvas.getContext('2d');
          if (!context) throw new Error('Unable to render the agreement PDF.');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          context.drawImage(canvas, 0, start, canvas.width, end - start, 0, 0, canvas.width, end - start);
          if (pageCount++ > 0) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
          start = end;
        }
      } else {
        if (pageCount++ > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
    }
    pdf.save(filename);
  } finally {
    snapshot.remove();
  }
}
