import re,json,sys,glob
# 책의 ◎ 연결 낱말을 카드 이름으로 맞춤(책 표기와 카드 표기가 다른 것)
ALIAS={'수선의 이등분선':'수직이등분선','개':'개(단위)','덧셈의 결합법칙':'덧셈에 대한 결합법칙','곱셈의 결합법칙':'곱셈에 대한 결합법칙',
 '수판':'주판','나누기':'나누다','구':'구(공)','이등분':'이등분하다','좌표':'좌표평면','모눈':'모눈종이','0':'영','양의 정수':'자연수',
 '음의 정수':'음수','원통':'원기둥','회전축':'축'}
SOSU={'소수점':'소수(小數)','할푼리':'소수(小數)','소인수분해':'소수(素數)'}
book={}
for l in open(sys.argv[1]):
    if l.startswith('#') or not l.strip(): continue
    w,links,p=l.rstrip('\n').split('|');book[w]=(links.split(',') if links else [],p)
areas=[];seen={};errs=[]
for f in sorted(glob.glob('src/a*.txt')):
    for ln,l in enumerate(open(f),1):
        l=l.rstrip('\n')
        if not l.strip(): continue
        if l.startswith('@'):
            n,i=l[1:].split('|');areas.append({'n':n,'id':i,'br':[]});continue
        if l.startswith('#'):
            n,i=l[1:].split('|');areas[-1]['br'].append({'n':n,'id':areas[-1]['id']+'-'+i,'t':[]});continue
        p=l.split('|')
        if len(p)!=7: errs.append(f'{f}:{ln} fields {len(p)}');continue
        w,en,d,ex,x,why,fig=p
        if w in seen: errs.append(f'dup {w}')
        seen[w]=1
        bl=re.findall(r'\[([^\]]+)\]',d)
        if not bl: errs.append(f'no block {w}')
        for b in bl:
            o=b.split('~')
            if len(o)<3: errs.append(f'opts<3 {w}: {b}')
            if len(set(o))!=len(o): errs.append(f'dup opt {w}')
        t={'w':w,'en':en,'d':d,'ex':ex,'x':x,'why':why}
        if fig: t['fig']=fig
        if w in book: t['ln']=[ALIAS.get(k,k) for k in book[w][0] if k]
        else: errs.append(f'not in book: {w}')
        areas[-1]['br'][-1]['t'].append(t)
miss=[w for w in book if w not in seen]
names=set(seen)
for a in areas:
  for b in a['br']:
    for t in b['t']:
      t['ln']=[SOSU.get(t['w'],k) if k=='소수' else k for k in t.get('ln',[])]
      t['ln']=list(dict.fromkeys(k for k in t['ln'] if k in names and k!=t['w']))
      drop=[k for k in book.get(t['w'],([],''))[0] if k and ALIAS.get(k,k) not in names and not (k=='소수' and t['w'] in SOSU)]
      if drop: errs.append(f"link dropped {t['w']}: {drop}")
# O/X 문장 (src/ox-*.txt: 낱말|O 또는 X|문장|이유)
T={t['w']:t for a in areas for b in a['br'] for t in b['t']}
nox=0
for f in sorted(glob.glob('src/ox-*.txt')):
    for ln,l in enumerate(open(f),1):
        l=l.rstrip('\n')
        if not l.strip() or l.startswith('#'): continue
        p=l.split('|')
        if len(p)!=4 or p[1] not in ('O','X') or not p[2] or not p[3]: errs.append(f'{f}:{ln} ox'); continue
        if p[0] not in T: errs.append(f'{f}:{ln} ox 낱말 없음 {p[0]}'); continue
        T[p[0]].setdefault('ox',[]).append([1 if p[1]=='O' else 0,p[2],p[3]]); nox+=1
few=[w for w,t in T.items() if len(t.get('ox',[]))<3]
print('ox',nox,'(O',sum(o[0] for t in T.values() for o in t.get('ox',[])),') 3개 안 되는 낱말:',few)
print('terms',len(seen),'branches',sum(len(a['br']) for a in areas))
print('missing from book:',miss)
print('\n'.join(errs))
open('data.js','w').write('/* 수학 개념 카드 데이터 (자동 생성: tools/build.py) */\nwindow.CARDS='+json.dumps(areas,ensure_ascii=False,separators=(',',':'))+';\n')
