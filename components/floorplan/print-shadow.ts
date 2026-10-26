/** Bake only the Gaussian shadow into a transparent image. Chromium's PDF
 * compositor can otherwise turn a filtered SVG path into a hard-edged strip.
 * All artwork and lettering above this layer remain vectors. */
export async function preservePrintShadow(svg: SVGSVGElement) {
  const shadow = svg.querySelector('[data-map-shadow]');
  if (!shadow) return;
  const layer = svg.cloneNode(false) as SVGSVGElement;
  layer.append(svg.querySelector('defs')!.cloneNode(true), shadow.cloneNode(true));
  const { x, y, width, height } = svg.viewBox.baseVal;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(6600 * Math.min(1, width / height));
  canvas.height = Math.round(6600 * Math.min(1, height / width));
  layer.setAttribute('width', String(canvas.width));
  layer.setAttribute('height', String(canvas.height));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(layer)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    const baked = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    for (const [key, value] of Object.entries({ x, y, width, height })) baked.setAttribute(key, String(value));
    baked.setAttribute('href', canvas.toDataURL('image/png'));
    baked.setAttribute('data-print-shadow', 'true');
    shadow.replaceWith(baked);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** A high-resolution browser render preserves SVG filters in every PDF reader. */
export async function downloadMapPdf(svg: SVGSVGElement, heading: string, summary: string, legend: string) {
  const { jsPDF } = await import('jspdf');
  const { width, height } = svg.viewBox.baseVal;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(6600 * Math.min(1, width / height));
  canvas.height = Math.round(6600 * Math.min(1, height / width));
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('width', String(canvas.width));
  copy.setAttribute('height', String(canvas.height));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3', compress: true });
    const availableWidth = 404;
    pdf.setFontSize(8);
    const summaryLines = pdf.splitTextToSize(summary.replaceAll('·', '|'), availableWidth);
    const imageTop = 23 + summaryLines.length * 3.25;
    const availableHeight = 297 - imageTop - 16;
    const scale = Math.min(availableWidth / canvas.width, availableHeight / canvas.height);
    const w = canvas.width * scale, h = canvas.height * scale;
    pdf.setFontSize(10);
    pdf.text(heading.replaceAll('·', '|'), 8, 12);
    pdf.setFontSize(8);
    pdf.text(summaryLines, 8, 18);
    pdf.addImage(canvas, 'PNG', (420 - w) / 2, imageTop, w, h, undefined, 'FAST');
    pdf.setFontSize(7);
    pdf.text(legend.replaceAll('·', '|'), 8, imageTop + h + 4);
    pdf.save('EcoExpo-Floorplan.pdf');
  } finally {
    URL.revokeObjectURL(url);
  }
}
