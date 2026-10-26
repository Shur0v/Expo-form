/** Conservative Arial bold advances, in ems; shared by SVG and export layout. */
export function textWidth(text: string, size = 1) {
  return Array.from(text).reduce((sum, c) => {
    const advance = /\s/.test(c)
      ? 0.34
      : /[ilI.,:;'!|]/.test(c)
        ? 0.36
        : /[MW@%]/.test(c)
          ? 1.02
          : /[mw]/.test(c)
            ? 0.94
            : /[A-Z0-9]/.test(c)
              ? 0.82
              : /[a-z]/.test(c)
                ? 0.7
                : c.codePointAt(0)! > 0xffff
                  ? 2.1
                  : 1.1;
    return sum + advance * size;
  }, 0);
}
export function fitText(
  lines: string[],
  width: number,
  height: number,
  maximum = 1.4,
) {
  return Math.max(
    0,
    Math.min(
      maximum,
      width / Math.max(1, ...lines.map((line) => textWidth(line))),
      height / Math.max(1, lines.length * 1.5),
    ),
  );
}
/** Full names wrap rather than truncating registration/company information. */
export function wrapName(name: string, count: number) {
  const words = name.trim().split(/\s+/),
    lines: string[] = [];
  let line = "",
    remaining = textWidth(words.join(" "));
  for (const word of words) {
    const target = remaining / Math.max(1, count - lines.length);
    if (
      line &&
      lines.length < count - 1 &&
      textWidth(line + " " + word) > target
    ) {
      lines.push(line);
      remaining -= textWidth(line + " ");
      line = word;
    } else line = line ? line + " " + word : word;
  }
  if (line) lines.push(line);
  return lines;
}
