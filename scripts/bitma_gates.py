"""Reviewed access markers from the 26 October PDF, in calibrated hall coordinates."""
def extract_gates(pdf,specs):
    gates=[]
    for hall,s in specs.items():
        page=pdf.pages[s['page']-1];x0,y0,x1,y1=s['box']
        sx=s['w']/(x1-x0);sy=s['h']/(y1-y0);seen=set()
        for q in page.rects+page.curves:
            col=q.get('non_stroking_color')
            if not(q.get('fill') and col and len(col)==4):continue
            a,b,c,d=(q['x0']-x0)*sx,(q['top']-y0)*sy,(q['x1']-x0)*sx,(q['bottom']-y0)*sy
            w,h=c-a,d-b;cx,cy=(a+c)/2,(b+d)/2
            if not(-1<cx<s['w']+1 and -1<cy<s['h']+1):continue
            kind=None;roles=[];angle=0;note=None
            # Orange source plates. The four EZ corner squares are crossbar markers, not gates.
            if col[0]<.02 and .45<col[1]<.55 and col[2]>.85 and min(w,h)>.15 and max(w,h)>2.5 and max(w,h)<6 and min(abs(cx),abs(cx-s['w']),abs(cy),abs(cy-s['h']))<1:
                side=min([('west',abs(cx)),('east',abs(cx-s['w'])),('north',abs(cy)),('south',abs(cy-s['h']))],key=lambda p:p[1])[0]
                if hall in ['1','2','3','4']:kind='exit' if side=='west' else 'entry'
                elif hall=='1A':kind='entry' if cx<20 else 'exit'
                elif hall=='6':kind='entry'
                elif hall=='2A':kind='exit' if side=='north' else 'entry'
                elif hall=='4A':kind='exit' if cx<7 else 'entry'
                elif hall=='EZ':
                    kind=('exit' if cy<25 else 'entry') if side=='east' else 'fire-exit'
                if h>w:angle=-90 if kind=='entry' else 90
            # Black 3 m source access plates on the roof edge, including service doors.
            elif hall in ['1','2','3','4'] and col[3]>.6 and 2.95<w<3.05 and -.1<b<.1 and .4<h<1:
                side='north';kind='service' if abs(cx-(36.668 if hall=='4' else 33.312))<1 else 'access'
                if kind=='access':note='The PDF marks a 3 M opening without an entry/exit designation.'
            # Blue five-metre cargo gate bars, distinct from the orange public doors.
            elif hall=='EZ' and col[0]>.8 and col[1]>.7 and col[2]<.05 and 4.8<h<5.2 and .4<w<1 and (abs(cx)<1 or abs(cx-s['w'])<1):
                side='west' if cx<1 else 'east';kind='cargo';angle=90
                if side=='west':roles=['cargo','fire-exit'];note='One physical opening has both CARGO ENTRY and FIRE EXIT annotations in the PDF.'
            if not kind:continue
            key=(side,round(a,3),round(b,3),round(c,3),round(d,3))
            if key in seen:continue
            seen.add(key)
            label={'entry':'ENTRY','exit':'EXIT','fire-exit':'FIRE EXIT','cargo':'CARGO ENTRY','service':'3 M','access':'3 M'}[kind]
            item=dict(id=f'{hall}-{side}-{round((cx if side in ["north","south"] else cy)*1000)}',hall=hall,kind=kind,
                      roles=roles or [kind],label=label,x=a,y=b,width=w,height=h,side=side,labelAngle=angle,
                      sourceSide=side,sourceStart=a if side in ['north','south'] else b,
                      sourceSpanM=w if side in ['north','south'] else h,
                      sourcePage=s['page'],sourceBox=[q['x0'],q['top'],q['x1'],q['bottom']])
            if note:item['note']=note
            if kind=='service':item['clearance']=dict(widthM=2.286,heightM=2.7432,source='H-9 ft / W-7 ft 6 in, printed on the PDF')
            if s['rotate']:
                item.update(x=b,y=s['w']-a-w,width=h,height=w,side={'north':'west','east':'north','south':'east','west':'south'}[side],labelAngle=angle-90)
            item['x']+=s['x'];item['y']+=s['y']
            for k in ['x','y','width','height','sourceStart','sourceSpanM']:item[k]=round(item[k],6)
            gates.append(item)
    return sorted(gates,key=lambda g:(g['hall'],g['sourceSide'],g['sourceStart']))
