"""Extract auditable BITMA booth candidates from vector PDF geometry.

This is an inventory, not a calibrated site plan. PDF points are retained as
provenance; missing hall dimensions are never inferred as confirmed metres.
Run with the bundled Python (pdfplumber) and the two user-supplied PDFs.
"""
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

import pdfplumber

DIMENSION = re.compile(r"(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(M|FT)\b")
CODE = re.compile(r"(?:(?:EZ|[1-6]A?)\s*-\s*[A-Z]\s*-?\s*\d+(?:\s*-\s*\d+)?|[1-6]A?\s*/\s*\d+(?:\s*-\s*\d+)?)", re.I)


def hall_at(page, x, y):
    if page == 1:
        if 760 <= x <= 1155 and 305 <= y <= 455:
            return "1"
        if 1215 <= x <= 1592 and 308 <= y <= 450:
            return "2"
        if 75 <= x <= 1585 and 640 <= y <= 944:
            return "EZ"
    else:
        if 90 <= x <= 460 and 235 <= y <= 374:
            return "3"
        if 545 <= x <= 925 and 225 <= y <= 382:
            return "4"
        if 110 <= x <= 438 and 625 <= y <= 1018:
            return "1A"
        if 554 <= x <= 870 and 632 <= y <= 1005:
            return "6"
        if 998 <= x <= 1188 and 305 <= y <= 957:
            return "2A"
        if 1380 <= x <= 1554 and 240 <= y <= 908:
            return "4A"
    return None


def trace(path, dump_root=None, prefix='latest'):
    result = {"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "booths": [], "review": []}
    with pdfplumber.open(path) as pdf:
        for page_number, page in enumerate(pdf.pages, 1):
            if dump_root:
                dump_root.mkdir(parents=True,exist_ok=True)
                (dump_root/f'{prefix}-{page_number}.json').write_text(json.dumps({
                    'width':page.width,'height':page.height,'words':page.extract_words(),'rects':page.rects,'lines':page.lines
                },default=str),encoding='utf8')
            seen = set()
            # Illustrator's dashed open paths have separate corner strokes.
            # Recovered extrema, in PDF points, are reviewed against the rendered PDF.
            recovered = []
            if page_number == 2 and '26.10.26' in path.name:
                for x0,top,x1,bottom in [
                    (163.697,659.434,207.492,729.505),(163.697,729.505,207.492,817.095),
                    (233.769,659.434,277.564,729.505),(233.769,729.505,277.564,817.095),
                    (303.840,659.434,373.912,817.095),(163.697,852.131,242.528,983.515),
                    (268.805,878.408,373.912,983.515),(757.74,656.97,807.23,755.82),
                    (1008.591,330.597,1078.903,435.928),
                ]:
                    recovered.append(dict(x0=x0,top=top,x1=x1,bottom=bottom))
            for shape in page.rects + page.curves + recovered:
                box = tuple(round(shape[key], 4) for key in ("x0", "top", "x1", "bottom"))
                x0, top, x1, bottom = box
                if box in seen or x1 - x0 < 4 or bottom - top < 4 or x1-x0>500 or bottom-top>700:
                    continue
                seen.add(box)
                hall = hall_at(page_number, (x0+x1)/2, (top+bottom)/2)
                if not hall:
                    continue
                crop = page.crop((max(0,x0-.02), max(0,top-.02), min(page.width,x1+.02), min(page.height,bottom+.02)))
                text = " ".join((crop.extract_text(line_dir_rotated="ltr", char_dir_rotated="btt") or "").split())
                if page_number == 2 and abs(x0-882.0687)<.02 and abs(top-242.8076)<.02:
                    # Reviewed rotated label, whose interleaved area line confuses text extraction.
                    text = '6x23 M 138 SQM 4 - N 1-16'
                if not CODE.search(text) or not DIMENSION.search(text):
                    # Some halls' labels rotate clockwise, others counterclockwise.
                    other = " ".join((crop.extract_text() or "").split())
                    if CODE.search(other) and DIMENSION.search(other):
                        text = other
                    else:
                        for candidate in (text[::-1], other[::-1]):
                            if CODE.search(candidate) and DIMENSION.search(candidate):
                                text = candidate
                                break
                dimensions = list(DIMENSION.finditer(text))
                codes = list(CODE.finditer(text))
                if len(codes) != 1 or not dimensions:
                    continue
                printed_code = re.sub(r"\s+", "", codes[0].group()).upper()
                code = printed_code
                correction = None
                if hall in ("1", "2") and "/" in code:
                    code = hall + "/" + code.split("/", 1)[1]
                    if code != printed_code:
                        correction = "Prefix corrected to the hall heading, per user instruction."
                elif "-" in code and "/" not in code:
                    corrected = hall + "-" + code.split("-", 1)[1]
                    if corrected != code:
                        correction = "Prefix corrected to the physical hall heading; original retained for audit."
                        code = corrected
                dims = [(float(m[1])*(.3048 if m[3]=='FT' else 1), float(m[2])*(.3048 if m[3]=='FT' else 1)) for m in dimensions]
                entry = {"hall": hall, "code": code, "printedCode": printed_code,
                         "page": page_number, "pdfBox": box, "dimensionPairsMetres": dims, "sourceText": text}
                entry['sourceUnit'] = dimensions[0][3]
                if correction:
                    entry["correction"] = correction
                if len(dims) == 1:
                    a, b = dims[0]
                    # Orient only; do not scale the printed metric dimensions to fit artwork.
                    aspect = (x1-x0)/(bottom-top)
                    width, length = (a, b) if abs(a/b-aspect) <= abs(b/a-aspect) else (b, a)
                    entry.update(width=width, length=length, area=round(width*length, 8))
                    area = re.search(r"(?<![=\d])(\d+(?:\.\d+)?)\s*SQM", text, re.I)
                    if area and abs(float(area[1])-width*length) > .01:
                        entry["issue"] = "Printed area differs from dimension product."
                        entry["printedArea"] = float(area[1])
                else:
                    entry["issue"] = "Composite footprint: verify polygon; bounding box is not rentable area."
                if shape.get("pts"):
                    entry["pdfPathPoints"] = shape["pts"]
                result["booths"].append(entry)
    # Illustrator may represent the same footprint as both rect and curve.
    unique = {}
    for booth in result["booths"]:
        key = (booth["hall"], booth["code"])
        existing = unique.get(key)
        if existing is not None:
            if max(abs(a-b) for a,b in zip(existing["pdfBox"], booth["pdfBox"])) < .1:
                continue
            result["review"].append({"code": booth["code"], "issue": "Code occurs at different positions; human review required."})
        unique[key] = booth
    result["booths"] = sorted(unique.values(), key=lambda b: (b["hall"], b["pdfBox"][1], b["pdfBox"][0]))
    result["counts"] = dict(Counter(b["hall"] for b in result["booths"]))
    result["review"] += [{"hall": b["hall"], "code": b["code"], "issue": b["issue"]} for b in result["booths"] if b.get("issue")]
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("latest", type=Path)
    parser.add_argument("previous", type=Path)
    parser.add_argument("--output", type=Path, default=Path("tmp/bitma-source/inventory.json"))
    args = parser.parse_args()
    latest, previous = trace(args.latest,args.output.parent,'latest'), trace(args.previous,args.output.parent,'previous')
    older = {(b["hall"], b["code"]): b for b in previous["booths"]}
    newer = {(b["hall"], b["code"]): b for b in latest["booths"]}
    differences = []
    for key in sorted(older.keys() | newer.keys()):
        a, b = older.get(key), newer.get(key)
        if not a or not b or a["dimensionPairsMetres"] != b["dimensionPairsMetres"]:
            differences.append({"hall":key[0], "code":key[1], "previous": a and a["dimensionPairsMetres"], "latest": b and b["dimensionPairsMetres"]})
    report = {"status":"preliminary-vector-inventory-not-calibrated", "latest":latest, "previous":previous,
              "comparisonNote":"Candidate differences require visual review: the earlier PDF may contain unrecovered open outlines.",
              "dimensionOrDivisionChanges":differences,
              "pending":["Confirmed internal dimensions/boundary offsets for Halls 1A and 6, to be supplied by user.",
                         "Review non-rectangular composite footprints and any missing or duplicated codes.",
                         "Only gaps between hall/village groups may be approximated."]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"latestBoothCandidates":latest["counts"], "previousBoothCandidates":previous["counts"],
                      "divisionOrDimensionChanges":len(differences),"reviewItems":len(latest["review"]), "output":str(args.output)}))


if __name__ == "__main__":
    main()
