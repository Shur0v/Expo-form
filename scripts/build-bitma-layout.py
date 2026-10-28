"""Build metric geometry from reviewed PDF inventory, never resize rentable booths."""
import json
import sys
import pdfplumber
from pathlib import Path

root=Path(__file__).resolve().parents[1]
inventory=json.loads((root/'tmp/bitma-source/inventory.json').read_text())['latest']
# Internal metre dimensions. Hall 1A/6: confirmed by the user; others: printed PDF dimensions.
# EZ: repeated 3 m/6 m footprint grid calibrates the 250 × 50 m vector boundary.
# Campus origins are illustrative only; per-hall internal coordinates are independently calibrated.
specs={
 '1':dict(page=1,box=[761.514,309.6395,1149.719,449.749],w=62.48,h=22.55,x=280,y=195,rotate=False),
 '2':dict(page=1,box=[1221.371,313.7407,1587.325,445.819],w=62.48,h=22.55,x=165,y=165,rotate=True),
 '3':dict(page=2,box=[92.368,238.0384,457.925,369.8014],w=62.48,h=22.55,x=225,y=110,rotate=False),
 '4':dict(page=2,box=[546.0357,229.3996,917.7827,378.5536],w=69.7992,h=28.0416,x=155,y=0,rotate=True),
 '1A':dict(page=2,box=[111.144,628.778,435.225,1014.171],w=37,h=44,x=235,y=160,rotate=False),
 '6':dict(page=2,box=[559.784,636.38,864.972,998.833],w=37,h=44,x=100,y=160,rotate=True),
 '2A':dict(page=2,box=[1004.243,308.472,1182.848,952.011],w=15.24,h=53.6448,x=175,y=90,rotate=False),
 '4A':dict(page=2,box=[1383.872,243.657,1549.023,903.401],w=15,h=60,x=195,y=0,rotate=False),
 'EZ':dict(page=1,box=[76.289,640.906,1581.046,941.978],w=250,h=50,x=0,y=242,rotate=False),
}
colors={'1':'#fbc8d2','2':'#fbc8d2','3':'#d9f99d','4':'#fde68a','1A':'#bae6fd','6':'#d9f99d','2A':'#fed7aa','4A':'#c4b5fd','EZ':'#fbc8d2'}
booths=[]
for b in inventory['booths']:
 h=b['hall'];s=specs[h];x0,y0,x1,y1=s['box'];bx,by,ex,ey=b['pdfBox']
 x=(bx-x0)/(x1-x0)*s['w'];y=(by-y0)/(y1-y0)*s['h']
 points=None
 if len(b['dimensionPairsMetres'])>1:
  # 165 sqm main + 27 sqm annex. Preserve the L footprint, not its 198 sqm bounding box.
  w,hh=18,11;points=[[0,0],[15,0],[15,2],[18,2],[18,11],[0,11]]
 else:w,hh=b['width'],b['length']
 code=b['code']
 corner = code in ['EZ-R77-79','EZ-L78-80']
 if corner:
  w=hh=6
  points=([[0,0],[6,0],[6,3],[3,3],[3,6],[0,6]] if code=='EZ-R77-79' else [[0,0],[3,0],[3,3],[6,3],[6,6],[0,6]])
 # Remove sub-millimetre Illustrator edge noise; never round feet-derived sizes.
 x=round(x,3);y=round(y,3)
 if abs(x-round(x))<.006:x=float(round(x))
 if abs(y-round(y))<.006:y=float(round(y))
 x=max(0,min(x,s['w']-w));y=max(0,min(y,s['h']-hh))
 if h=='2A':
  # Exact 6 m columns, 2.5 m centre aisle, five 1.22 m cross-gaps per side.
  # 45 + 5×1.22 = 51.10 m; centre this inside the printed 176 ft / 53.6448 m hall.
  n=int(code.split('/')[-1].split('-')[0]);left=n<=30
  ordered=([25,21,17,13,9,5,1] if left else [31,35,39,43,47,51,55])
  gaps=([1.22,1.22,0,1.22,1.22,1.22] if left else [1.22,1.22,0,0,1.22,1.22])
  heights=([9,6,6,6,6,6,6] if left else [6,6,6,6,6,6,9])
  i=ordered.index(n);w,hh=6,heights[i];x=.37 if left else 8.87
  y=(s['h']-51.1)/2+sum(heights[:i])+sum(gaps[:i])
 if h=='4A':
  row=code.split('-')[1][0];n=int(code.split('-')[1][1:]);w=hh=2.5
  x={'L':.5,'A':5,'B':7.5,'R':12}[row]
  if row in ['A','B']:y=3.75+(20-n)*2.5+(2.5 if n<=11 else 0)
  else:
   gap_after=([19,17,14,12,9,7,4] if row=='L' else [18,15,13,10,8,5,3])
   y=.73+(20-n)*2.5+1.22*sum(1 for k in gap_after if k>n)
 if s['rotate']:
  x,y=y,s['w']-x-w
  if points:points=[[p[1],w-p[0]] for p in points]
  w,hh=hh,w
 entry=dict(hall=h,code=code,x=round(x+s['x'],6),y=round(y+s['y'],6),width=w,height=hh,
            dimensionLabel=('27 m² · L-shaped' if corner else '11 × 15 m + 9 × 3 m' if points else ('8 × 8 ft' if b.get('sourceUnit')=='FT' else f"{b['width']:g} × {b['length']:g} m")),
            color=colors[h],pdfPage=b['page'],pdfBox=b['pdfBox'],printedCode=b['printedCode'])
 if points:entry['points']=points
 if b.get('correction'):entry['correction']=b['correction']
 # Keep identifiable PDF annotations as source labels, not live confirmed bookings.
 for name in ['SAURER','CIXING','MIURA','TOYOTSU','MARUBENI','MURATA','TEXTILE ASSOCIATES (RIETER)']:
  if name in b['sourceText'].upper():entry['sourceLabel']=name
 booths.append(entry)


# Align tiny PDF seam errors without changing any width/height. Only shifts ≤2 cm are permitted.
for _ in range(8):
 changes=0
 for i,a in enumerate(booths):
  if a.get('points'):continue
  for b in booths[i+1:]:
   if b['hall']!=a['hall'] or b.get('points'):continue
   ox=min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x'])
   oy=min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y'])
   if ox>1e-7 and oy>1e-7:
    if ox<=.02 and a['x']!=b['x']:
     right,left=(b,a) if b['x']>a['x'] else (a,b);right['x']=round(left['x']+left['width'],6);changes+=1
    elif oy<=.02 and a['y']!=b['y']:
     bottom,top=(b,a) if b['y']>a['y'] else (a,b);bottom['y']=round(top['y']+top['height'],6);changes+=1
 if not changes:break
# The lower-left Illustrator corner and W1 share an edge (0.01 m rounding drift).
corner=next(b for b in booths if b['code']=='EZ-L78-80')
west=next(b for b in booths if b['code']=='EZ-W1')
if 0<west['y']+west['height']-corner['y']<=.02:
 corner['y']=round(west['y']+west['height'],6)
halls=[]
for h,s in specs.items():
 halls.append(dict(id=h,name='Expo Zone' if h=='EZ' else 'Hall '+h,x=s['x'],y=s['y'],
                   width=s['h'] if s['rotate'] else s['w'],height=s['w'] if s['rotate'] else s['h'],color=colors[h],
                   dimensionSource='User-confirmed 37 × 44 m' if h in ['1A','6'] else 'Derived from repeated printed booth grid' if h=='EZ' else 'Printed PDF dimensions',
                   sourceWidth=s['w'],sourceLength=s['h'],northRotation=-90 if s['rotate'] else 0))
signs=[]
pages={i:json.loads((root/f'tmp/bitma-source/latest-{i}.json').read_text()) for i in [1,2]}
for hid,s in specs.items():
 x0,y0,x1,y1=s['box'];seen=set()
 for word in pages[s['page']]['words']:
  label=word['text']
  if label not in ['AC','WC','ENTRY','EXIT','FOOD','COURT','SERVICE','BOOTH']:continue
  px=(word['x0']+word['x1'])/2;py=(word['top']+word['bottom'])/2
  if not(x0-24<px<x1+24 and y0-14<py<y1+14):continue
  x=(px-x0)/(x1-x0)*s['w'];y=(py-y0)/(y1-y0)*s['h']
  if s['rotate']:x,y=y,s['w']-x
  key=(label,round(x,2),round(y,2))
  if key in seen:continue
  seen.add(key);signs.append(dict(hall=hid,x=round(x+s['x'],4),y=round(y+s['y'],4),label=label))
art=[]
obstacles=[]
for hid,s in specs.items():
 if hid not in ['1','2','3','4']:continue
 x,y,w,h=(2,24.4,8.2,3.6416) if hid=='4' else (0,18,7,4.55)
 if s['rotate']:x,y,w,h=y,s['w']-x-w,h,w
 obstacles.append(dict(hall=hid,x=x+s['x'],y=y+s['y'],width=w,height=h))
if len(sys.argv)<2:
 raise SystemExit('Provide the latest source PDF path to retain architectural artwork.')
def rgb(value):
 if value is None:return '#334155'
 if isinstance(value,(int,float)):values=[value]*3
 elif len(value)==4:values=[(1-value[i])*(1-value[3]) for i in range(3)]
 else:values=list(value)[:3]
 return '#'+''.join(f'{max(0,min(255,round(v*255))):02x}' for v in values)
with pdfplumber.open(sys.argv[1]) as pdf:
 for hid,s in specs.items():
  page=pdf.pages[s['page']-1];x0,y0,x1,y1=s['box'];sx=s['w']/(x1-x0);sy=s['h']/(y1-y0)
  def local(q):return ((q['x0']-x0)*sx,(q['top']-y0)*sy,(q['x1']-x0)*sx,(q['bottom']-y0)*sy)
  regions=[]
  if hid in ['1','2','3']:regions.append((0,18,7,22.55))
  if hid=='4':regions.append((2,24.4,10.2,28.0416))
  for q in page.rects+page.curves:
   a,b,c,d=local(q);col=q.get('non_stroking_color');w=c-a;h=d-b
   # Source WC icon circles above the wall, not inferred amenities.
   if hid in ['1','2','3','4'] and q.get('fill') and col and len(col)==4 and col[3]>.6 and -1<a<s['w'] and c<s['w']+1 and -4<b<0 and .5<w<3 and .5<h<3 and .5<w/h<2:
    regions.append((a-.04,b-.04,c+.04,d+.04))
   # Exact orange entry/exit plates; copy their white vector lettering too.
   if q.get('fill') and col and len(col)==4 and col[0]<.02 and .45<col[1]<.55 and col[2]>.85 and .2<w<5 and .2<h<5:
    cx=(a+c)/2;cy=(b+d)/2
    if -.8<cx<s['w']+.8 and -.8<cy<s['h']+.8 and min(abs(cx),abs(cx-s['w']),abs(cy),abs(cy-s['h']))<.8:regions.append((a-.04,b-.04,c+.04,d+.04))
  seen=set()
  for q in page.rects+page.curves+page.lines:
   a,b,c,d=local(q)
   matched=[r for r in regions if a>=r[0]-.01 and b>=r[1]-.01 and c<=r[2]+.01 and d<=r[3]+.01]
   if not matched:continue
   commands=q.get('path') or [('m',(q['x0'],q['top'])),('l',(q['x1'],q['bottom']))]
   # Some Illustrator clipped curves carry off-region control points in their
   # underlying path. Never export those detached glyph fragments as campus art.
   vertices=[((px-x0)*sx,(py-y0)*sy) for command in commands for px,py in command[1:]]
   if not any(all(rx-.5<=px<=rr+.5 and ry-.5<=py<=rb+.5 for px,py in vertices) for rx,ry,rr,rb in matched):continue
   parts=[]
   for command in commands:
    op=command[0];parts.append('Z' if op=='h' else op.upper())
    for px,py in command[1:]:
     xx=(px-x0)*sx;yy=(py-y0)*sy
     if s['rotate']:xx,yy=yy,s['w']-xx
     parts.append(f'{xx+s["x"]:.6f},{yy+s["y"]:.6f}')
   item=dict(hall=hid,d=' '.join(parts),fill=rgb(q.get('non_stroking_color')) if q.get('fill') else 'none',
             stroke=rgb(q.get('stroking_color')) if q.get('stroke') or q.get('object_type')=='line' else 'none',strokeWidth=round((q.get('linewidth') or .15)*(sx+sy)/2,5))
   key=(item['d'],item['fill'],item['stroke'])
   if key not in seen:seen.add(key);art.append(item)
out=dict(version='bitma-2027-pdf-2026-10-26-v1',sourceSha256=inventory['sha256'],halls=halls,booths=booths,signs=signs,art=art,obstacles=obstacles,
         notes=['Campus spacing is illustrative and estimated; hall dimensions and rentable footprints are independent.',
                'Hall 1/2 prefixes corrected to headings. Merged allocation ranges remain single selectable footprints.',
                'PDF colours and labels are a source snapshot, not live occupancy. No booth prices were supplied.'])
target=root/'lib/floorplan/bitma-layout.json'
target.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print(f"Wrote {len(booths)} footprints across {len(halls)} halls to {target}")
