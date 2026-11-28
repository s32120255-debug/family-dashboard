import re,json,sys,glob
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
        if w in book: t['ln']=[k for k in book[w][0] if k]
        else: errs.append(f'not in book: {w}')
        areas[-1]['br'][-1]['t'].append(t)
miss=[w for w in book if w not in seen]
names=set(seen)
for a in areas:
  for b in a['br']:
    for t in b['t']:
      t['ln']=[k for k in t.get('ln',[]) if k in names and k!=t['w']]
print('terms',len(seen),'branches',sum(len(a['br']) for a in areas))
print('missing from book:',miss)
print('\n'.join(errs))
open('data.js','w').write('/* 수학 개념 카드 데이터 (자동 생성: tools/build.py) */\nwindow.CARDS='+json.dumps(areas,ensure_ascii=False,separators=(',',':'))+';\n')
