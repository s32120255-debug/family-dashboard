/* ⚡ 스피드 영어 · 문장 만들기 ② 단계별 문장 틀 (엄마 11/27 「문법 단계에 따라 고급 말하기까지」)
   문장 번호 = 바퀴.꼴.씨앗.묶음꼴  예) 1.v_neg.123456.v_q
   같은 씨앗이면 같은 뼈대(주어·동사·목적어)라서, 한 묶음 안에서 「He plays → He doesn't play → Does he play?」처럼 꼴만 바뀌어요.
   바퀴(lap) 1 = 초등 낱말, 2 = 중등까지, 3 = 수능까지. */
(function(){
'use strict';
const C=window.TALKCORE,{josa,KO,COP,EN,AN,SUBJ,PEOPLE,VP,ADJ,PLACE,JOB,TIME}=C;
// ───────── 바탕 ─────────
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
// 바퀴에 맞는 낱말: 이번 바퀴 낱말을 60% 먼저
function lvPick(r,a,lap,bias){const ok=a.filter(x=>(x.lv||1)<=lap);if(!ok.length)return null;const top=ok.filter(x=>(x.lv||1)===lap);const u=r();return lap>1&&top.length&&u<(bias||.6)?pick(r,top):pick(r,ok)}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const sp=a=>a.filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
const SEN=(a,q)=>cap(sp(a))+(q?'?':'.');
const KSEN=(a,q)=>sp(a)+(q?'?':'.');
const bare=en=>en.replace(/\{po\} /,'').replace(/^to /,'').replace(/^(the|a|an) /,'');
const kd=w=>w; // 한국어 기본형 그대로 낱말 칸에
const chip=(ko,en)=>[ko,en];
const subjChip=s=>/^(나|너|그|그녀|우리|그들)$/.test(s.ko)?null:chip(s.ko.replace(/^(우리|내|그|너희|네) /,''),s.en.replace(/^(my|the|your) /,''));
// 물을 때: 나·우리 → 너, 「우리 엄마」 → 「너희 엄마」
function qS(s,keepI){if(!keepI&&(s.t==='me'||s.en==='we'))s=SUBJ[1];return Object.assign({},s,{en:s.qen||s.en,ko:s.qko||s.ko,top:josa(s.qko||s.ko,'은/는'),nom:s.qko?josa(s.qko,'이/가'):s.nom})}
const notI=s=>s.t==='me'?"I'm not":s.en+' '+(s.be==='is'?"isn't":"aren't");
const beNeg=s=>s.t==='me'?["I'm not"]:[s.en,s.be==='is'?"isn't":"aren't"];
const wasNeg=s=>[s.en,s.was==='was'?"wasn't":"weren't"];
const subjsFor=(lap,types,f)=>SUBJ.filter(s=>s.lv<=lap&&types.includes(s.t)&&(!f||f(s)));

// ───────── 동사 묶음 ─────────
const LIKEV=new Set(['play','eat','drink','watch','read','study','swim','run','sing','dance','cook','draw','make','ride','learn','listen to','write','travel','exercise','visit','practice','solve','speak','go','walk']);
const FINV=new Set(['do','clean','eat','read','write','draw','make','solve']);
const OBV=new Set(['do','brush','clean','go to bed','get up','practice','study','recycle','save','take','help','feed','wear','wash','tidy up']);
function objOk(s,v,o){if(!o)return true;const f=o.f;
  if(/xA/.test(f)&&(s.t==='adult'||s.t==='old'))return false;if(/xO/.test(f)&&s.t==='old')return false;if(/xK/.test(f)&&(s.t==='kid'||s.t==='me'))return false;
  if(/nm/.test(f)&&s.en==='my mom')return false;if(/nf/.test(f)&&s.en==='my friend')return false;
  if(s.t==='ani')return s.an==='dog'&&/\ba\b/.test(f);return true}
function vpOk(s,v){if(v.x&&v.x.includes(s.t))return false;if(v.po&&!s.po)return false;
  if(s.t==='ani'){if(v.o)return s.an==='dog'&&v.o.some(o=>/\ba\b/.test(o.f));return !!(v.a&&v.a.includes(s.an))}return true}
// 꼴마다 필요한 동사 성질
const NEED={
  prog:v=>!v.st&&!v.ab,pprog:v=>!v.st&&!v.ab,fut:v=>!v.st,gon:v=>!v.st,whatdoing:v=>!v.st&&!v.ab,can:v=>!!v.sk,ob:v=>OBV.has(v.e)||v.e==='eat',
  what:v=>!v.ab&&!!v.o&&(v.p==='을'||v.p==='이')&&!v.po&&!['take','do','open','close','help','meet','wait for','persuade','wear'].includes(v.e),
  where:v=>v.e==='go'||(!v.st&&!v.go&&!v.rt&&!v.po&&!['open','close','help','take','meet','wait for','concentrate','explain','prepare','wear','whistle'].includes(v.e)&&!v.ab),
  when:v=>!v.st&&!v.rt&&!v.ab,who:v=>!v.po&&!v.rt};
const NEEDOF=f=>({v_prog:'prog',v_progneg:'prog',v_progq:'prog',v_whatdoing:'whatdoing',v_pprog:'pprog',v_pprogneg:'pprog',v_pprogq:'pprog',v_fut:'fut',v_futneg:'fut',v_futq:'fut',
  v_gon:'gon',v_gonneg:'gon',v_gonq:'gon',v_can:'can',v_cant:'can',v_canq:'can',v_hto:'ob',v_dhto:'ob',v_htoq:'ob',v_sh:'ob',v_what:'what',v_where:'where',v_when:'when',v_who:'who'}[f]);
const PRESCTX=new Set(['v_pos','v_neg','v_q','v_pneg','v_what','v_when','v_who','v_where','v_progneg','v_futneg']);
function objFor(r,lap,s,v,need,ctx){if(!v.o)return null;let os=v.o.filter(o=>o.lv<=lap&&objOk(s,v,o)&&!(PRESCTX.has(ctx)&&/h0/.test(o.f))&&!(/friends/.test(o.en)&&/friend/.test(s.en)));
  if(need==='ob'&&v.e==='eat')os=os.filter(o=>o.en==='vegetables');if(need==='ob'&&v.e==='take')os=os.filter(o=>o.en==='a shower');
  if(need==='ob'&&v.e==='help')os=os.filter(o=>o.en==='the teacher');if(need==='ob'&&v.e==='go'){os=[]}
  if(!os.length)return undefined;return lvPick(r,os,lap)}
// 동사 뼈대: 주어 · 동사 · 목적어 · 때(3가지 다 미리 뽑아 둠 → 꼴이 달라도 같은 뼈대)
function vSkel(r,lap,ctx,types,vf){const need=NEEDOF(ctx);
  for(let g=0;g<200;g++){const s=pick(r,subjsFor(lap,types||PEOPLE.concat(['ani'])));const vs=VP.filter(v=>v.lv<=lap&&vpOk(s,v)&&!(v.nt&&PRESCTX.has(ctx))&&(!need||!NEED[need]||NEED[need](v))&&(!vf||vf.has(v.e)));if(!vs.length)continue;
    const v=lvPick(r,vs,lap,.35);const o=objFor(r,lap,s,v,need,ctx);if(o===undefined)continue;if(s.t==='ani'&&o&&!/\ba\b/.test(o.f))continue;
    const th=r(),tp=r(),tf=r(),tw=r();return {s,v,o,th,tp,tf,tw}}
  throw new Error('no skel '+ctx)}
function oEn(k,s){return k.o?k.o.en.replace('{po}',s.po||'their'):''}
function oKo(k){if(!k.o)return '';const w=k.o.ko,p=k.v.p;return p==='을'?josa(w,'을/를'):p==='이'?josa(w,'이/가'):w+p}
function vChips(k){const a=[];const sc=subjChip(k.s);if(sc)a.push(sc);if(k.o)a.push(chip(k.o.ko,bare(k.o.en)));a.push(chip(k.v.k,k.v.e));return a}
function tPick(k,kind){if(k.v.nt||k.v.ab)return null;const habOk=k.v.h&&!(k.o&&/h0/.test(k.o.f));
  if(kind==='hab'){if(!habOk||k.th<.55)return null;const L=TIME.hab.filter(t=>!t[2]||k.s.t==='kid'||k.s.t==='me'||k.s.t==='you');return L[Math.floor(k.tw*L.length)]}
  if(kind==='past'){if(k.v.st||k.tp<.4)return null;return TIME.past[Math.floor(k.tw*TIME.past.length)]}
  if(kind==='fut'){if(k.tf<.35)return null;if(k.v.rt||k.v.e==='concentrate')return ['tomorrow','내일'];return TIME.fut[Math.floor(k.tw*TIME.fut.length)]}
  if(kind==='now'){return k.th<.5?['now','지금']:null}return null}
const kv=k=>(k.v.k);           // 한국어 동사 기본형
const kn=k=>k.v.n||null;        // 부정일 때 바뀌는 말(있다→없다)
function vForm(k,f){let s=k.s;const Q=/q$|^v_(what|where|when|who|whatdoing)$/.test(f);if(Q&&f!=='v_who')s=qS(s,f==='v_htoq');
  const e=k.v.e,o=oEn(k,s),ok=oKo(k),w=kv(k),n=kn(k);let t=null,en,ko,KK=(...a)=>[s.top,t&&t[1],ok,...a];
  const third=s.s;
  switch(f){
  case 'v_pos':t=tPick(k,'hab');en=SEN([s.en,third?EN.s3(e):e,o,t&&t[0]]);ko=KSEN(KK(KO.A(w)));break;
  case 'v_neg':t=tPick(k,'hab');en=SEN([s.en,third?"doesn't":"don't",e,o,t&&t[0]]);ko=KSEN(KK(n?KO.A(n):KO.S(w)+'지 않아'));break;
  case 'v_q':t=tPick(k,'hab');en=SEN([third?'does':'do',s.en,e,o,t&&t[0]],1);ko=KSEN(KK(KO.A(w)),1);break;
  case 'v_ppos':t=tPick(k,'past');en=SEN([s.en,EN.past(e),o,t&&t[0]]);ko=KSEN(KK(KO.P(w)));break;
  case 'v_pneg':t=tPick(k,'past');en=SEN([s.en,"didn't",e,o,t&&t[0]]);ko=KSEN(KK(n?KO.P(n):KO.S(w)+'지 않았어'));break;
  case 'v_pq':t=tPick(k,'past');en=SEN(['did',s.en,e,o,t&&t[0]],1);ko=KSEN(KK(KO.P(w)),1);break;
  case 'v_prog':t=tPick(k,'now');en=SEN([s.en,s.be,EN.ing(e),o,t&&t[0]]);ko=KSEN(KK(KO.S(w)+'고 있어'));break;
  case 'v_progneg':t=tPick(k,'now');en=SEN([...beNeg(s),EN.ing(e),o,t&&t[0]]);ko=KSEN(KK(KO.S(w)+'고 있지 않아'));break;
  case 'v_progq':t=tPick(k,'now');en=SEN([s.be,s.en,EN.ing(e),o,t&&t[0]],1);ko=KSEN(KK(KO.S(w)+'고 있어'),1);break;
  case 'v_whatdoing':en=SEN(['what',s.be,s.en,'doing'],1);ko=KSEN([s.top,'지금 뭐 하고 있어'],1);t=null;break;
  case 'v_pprog':{const T=PPT[Math.floor(k.tw*PPT.length)];t=[T[0],T[1]];en=SEN([s.en,s.was,EN.ing(e),o,T[0]]);ko=KSEN(T[2]?[T[1],s.top,ok,KO.S(w)+'고 있었어']:KK(KO.S(w)+'고 있었어'));break}
  case 'v_pprogneg':{const T=PPT[Math.floor(k.tw*PPT.length)];t=[T[0],T[1]];en=SEN([...wasNeg(s),EN.ing(e),o,T[0]]);ko=KSEN(T[2]?[T[1],s.top,ok,KO.S(w)+'고 있지 않았어']:KK(KO.S(w)+'고 있지 않았어'));break}
  case 'v_pprogq':{const T=PPT[Math.floor(k.tw*PPT.length)];t=[T[0],T[1]];en=SEN([s.was,s.en,EN.ing(e),o,T[0]],1);ko=KSEN(T[2]?[T[1],s.top,ok,KO.S(w)+'고 있었어']:KK(KO.S(w)+'고 있었어'),1);break}
  case 'v_fut':t=tPick(k,'fut');en=SEN([s.en,'will',e,o,t&&t[0]]);ko=KSEN(KK(KO.L(w)+' 거야'));break;
  case 'v_futneg':t=tPick(k,'fut');en=SEN([s.en,"won't",e,o,t&&t[0]]);ko=KSEN(KK(n?KO.L(n)+' 거야':KO.S(w)+'지 않을 거야'));break;
  case 'v_futq':t=tPick(k,'fut');en=SEN(['will',s.en,e,o,t&&t[0]],1);ko=KSEN(KK(KO.L(w)+' 거야'),1);break;
  case 'v_gon':t=tPick(k,'fut');en=SEN([s.en,s.be,'going to',e,o,t&&t[0]]);ko=KSEN(KK(KO.R(w)+' 해'));break;
  case 'v_gonneg':t=tPick(k,'fut');en=SEN([...beNeg(s),'going to',e,o,t&&t[0]]);ko=KSEN(KK(KO.S(w)+'지 않으려고 해'));break;
  case 'v_gonq':t=tPick(k,'fut');en=SEN([s.be,s.en,'going to',e,o,t&&t[0]],1);ko=KSEN(KK(KO.R(w)+' 해'),1);break;
  case 'v_can':en=SEN([s.en,'can',e,o]);ko=KSEN(KK(KO.L(w)+' 수 있어'));break;
  case 'v_cant':en=SEN([s.en,"can't",e,o]);ko=KSEN(KK(KO.L(w)+' 수 없어'));break;
  case 'v_canq':en=SEN(['can',s.en,e,o],1);ko=KSEN(KK(KO.L(w)+' 수 있어'),1);break;
  case 'v_hto':en=SEN([s.en,third?'has to':'have to',e,o]);ko=KSEN(KK(KO.A(w)+'야 해'));break;
  case 'v_dhto':en=SEN([s.en,third?"doesn't have to":"don't have to",e,o]);ko=KSEN(KK(KO.S(w)+'지 않아도 돼'));break;
  case 'v_htoq':en=SEN([third?'does':'do',s.en,'have to',e,o],1);ko=KSEN(KK(KO.A(w)+'야 해'),1);break;
  case 'v_sh':en=SEN([s.en,'should',e,o]);ko=KSEN(KK(KO.NE(w)+' 게 좋아'));break;
  // 의문사
  case 'v_what':{const past=k.tp<.5;t=past?tPick(k,'past'):null;const wh=k.v.p==='이'?'뭐가':'뭘';
    en=SEN(['what',past?'did':third?'does':'do',s.en,e,t&&t[0]],1);ko=KSEN([s.top,t&&t[1],wh,past?KO.P(w):KO.A(w)],1);break}
  case 'v_where':{const past=k.tp<.6;t=past?tPick(k,'past'):null;
    if(k.v.e==='go'){en=SEN(['where',past?'did':third?'does':'do',s.en,'go',t&&t[0]],1);ko=KSEN([s.top,t&&t[1],'어디에',past?KO.P(w):KO.A(w)],1)}
    else{en=SEN(['where',past?'did':third?'does':'do',s.en,e,o,t&&t[0]],1);ko=KSEN([s.top,t&&t[1],'어디에서',ok,past?KO.P(w):KO.A(w)],1)}break}
  case 'v_when':{const past=k.tp<.4;en=SEN(['when',past?'did':third?'does':'do',s.en,e,o],1);ko=KSEN([s.top,'언제',ok,past?KO.P(w):KO.A(w)],1);break}
  case 'v_who':{const past=k.tp<.5;t=past?tPick(k,'past'):null;const ow=k.o&&/\{po\}/.test(k.o.en)?'':o;
    en=SEN(['who',past?EN.past(e):EN.s3(e),ow,t&&t[0]],1);ko=KSEN([t&&t[1],'누가',ok,past?KO.P(w):KO.A(w)],1);break}
  default:throw new Error('form '+f)}
  return {en,ko,w:vChips(k)}}
// 과거진행에 붙는 때: [영어, 한국어, 한국어를 맨 앞에]
const PPT=[['at seven','7시에'],['at eight','8시에'],['at nine','9시에'],['when you called','네가 전화했을 때',1],['when I came home','내가 집에 왔을 때',1],['then','그때']];

// ───────── be 묶음 ─────────
function bSkel(r,lap){for(let g=0;g<200;g++){const s=pick(r,subjsFor(lap,PEOPLE.concat(['ani'])));const u=r(),ty=s.t==='ani'?(u<.7?'adj':'place'):u<.6?'adj':u<.82?'place':'job';
    let c;if(ty==='adj')c=lvPick(r,ADJ.filter(a=>s.t!=='ani'||/\ba\b/.test(a.f)),lap);
    else if(ty==='place')c=lvPick(r,PLACE.filter(a=>(s.t!=='ani'||/\ba\b/.test(a.f))&&!(/xK/.test(a.f)&&(s.t==='kid'||s.t==='me'))&&!(s.en==='the teacher'&&/school/.test(a.en))),lap);
    else{if(/^the /.test(s.en)||s.nj)continue;const kidish=s.t==='kid'||s.t==='me';c=lvPick(r,JOB.filter(j=>kidish?j.en==='student':s.t==='you'||s.t==='pron'?true:j.en!=='student'),lap)}
    if(!c)continue;const fe=lvPick(r,ADJ.filter(a=>/fe/.test(a.f)&&(s.t!=='ani'||/\ba\b/.test(a.f))),lap);return {s,ty,c,fe,tp:r(),tw:r()}}throw new Error('no be')}
function bForm(k,f){let s=k.s;const Q=/q$|why$/.test(f);if(Q)s=qS(s);let {ty,c}=k;if(f==='b_why'){if(!(ty==='adj'&&/fe/.test(c.f)))c=k.fe;ty='adj'}
  const isC=ty==='job'||/\bc\b/.test(c.f);const nk=isC?null:(c.n||null);
  // 엄마 11/27 「한국어 복수 표시 넣어(선생님들)」: 여럿이면 한국어에도 -들
  const cE=ty==='job'?(s.pl?c.pl:AN(c.en)+' '+c.en):c.en;const cK=ty==='job'&&s.pl?c.ko+'들':c.ko;
  const past=/^b_p/.test(f),tOk=past&&(ty==='place'||/fe/.test(c.f))&&k.tp<.4,t=tOk?TIME.past[Math.floor(k.tw*TIME.past.length)]:null;
  const pres=/^b_(pos|neg|q)$/.test(f),nt=pres&&(ty==='place'||/fe/.test(c.f))&&k.tp<.35?(ty==='place'?(k.tw<.5?['now','지금']:['today','오늘']):['today','오늘']):null;
  const kpos=()=>isC?COP.pos(cK):KO.A(cK),kneg=()=>isC?COP.neg(cK):nk?KO.A(nk):KO.S(cK)+'지 않아',kpast=()=>isC?COP.past(cK):KO.P(cK),kpneg=()=>isC?COP.pneg(cK):nk?KO.P(nk):KO.S(cK)+'지 않았어';
  let en,ko;
  switch(f){
  case 'b_pos':en=SEN([s.en,s.be,cE,nt&&nt[0]]);ko=KSEN([s.top,nt&&nt[1],kpos()]);break;
  case 'b_neg':en=SEN([...beNeg(s),cE,nt&&nt[0]]);ko=KSEN([s.top,nt&&nt[1],kneg()]);break;
  case 'b_q':en=SEN([s.be,s.en,cE,nt&&nt[0]],1);ko=KSEN([s.top,nt&&nt[1],kpos()],1);break;
  case 'b_ppos':en=SEN([s.en,s.was,cE,t&&t[0]]);ko=KSEN([s.top,t&&t[1],kpast()]);break;
  case 'b_pneg':en=SEN([...wasNeg(s),cE,t&&t[0]]);ko=KSEN([s.top,t&&t[1],kpneg()]);break;
  case 'b_pq':en=SEN([s.was,s.en,cE,t&&t[0]],1);ko=KSEN([s.top,t&&t[1],kpast()],1);break;
  case 'b_why':en=SEN(['why',s.be,s.en,cE],1);ko=KSEN([s.top,'왜',kpos()],1);break}
  const w=[];const sc=subjChip(k.s);if(sc)w.push(sc);w.push(chip(ty==='job'?c.ko:c.ko,ty==='job'?c.en:c.en));return {en,ko,w}}

// ───────── 전치사 · 곳 (8단계) ─────────
const THG=[['the cat','고양이',1,0,'ani'],['the dog','개',1,0,'ani'],['the ball','공'],['my bag','내 가방',1,0,'',['your bag','네 가방']],['the book','책'],['the phone','휴대폰'],
  ['the keys','열쇠',1,1],['the shoes','신발',1,1],['the umbrella','우산',2],['the glasses','안경',2,1],['the remote control','리모컨',2],['the wallet','지갑',2],['the scissors','가위',2,1],
  ['the charger','충전기',3],['the documents','서류',3,1],['the passport','여권',3],
  ['the pencil','연필'],['the cup','컵'],['the hat','모자'],['the doll','인형'],['the notebook','공책'],['the eraser','지우개'],['the socks','양말',1,1],['the cookies','쿠키',1,1],['the puppy','강아지',1,0,'ani'],['the rabbit','토끼',1,0,'ani'],
  ['the tablet','태블릿',2],['the watch','손목시계',2],['the camera','카메라',2],['the jacket','재킷',2],['the gloves','장갑',2,1],['the map','지도',2],['the ticket','표',2],
  ['the laptop','노트북',3],['the headphones','헤드폰',3,1],['the receipt','영수증',3],['the medicine','약',3]].map(([en,ko,lv,pl,ani,q])=>({en,ko,lv:lv||1,pl:!!pl,ani:!!ani,q}));
const LOC=[['the table','탁자','on under next'],['the bed','침대','on under next'],['the box','상자','in on next behind',1,1],['the chair','의자','on under next behind',1,1],
  ['the sofa','소파','on under behind next',1,1],['the door','문','next behind front',1,1],['the tree','나무','under behind front next',1,1],['the desk','책상','on under next'],['the bag','가방','in',1,0,1],
  ['the car','차','in under behind front',1,1],['the shelf','선반','on next',2],['the drawer','서랍','in',2],['the closet','옷장','in next behind',2],['the fridge','냉장고','on next',2],
  ['the cabinet','수납장','in on next',3],['the counter','조리대','on',3],
  ['the bench','벤치','on under next',1,1],['the pillow','베개','on under next'],['the basket','바구니','in next',1,1],['the piano','피아노','on under next behind'],['the window','창문','next front',1,1],
  ['the bookshelf','책장','on next behind',2],['the sink','싱크대','in under next',2],['the rug','러그','on under',2,1],['the stairs','계단','under next',2,1],['the mailbox','우편함','in next',3]].map(([en,ko,ps,lv,ani,bag])=>({en,ko,ps:ps.split(' '),lv:lv||1,ani:!!ani,bag:!!bag}));
const PREP={in:['in','안에'],on:['on','위에'],under:['under','밑에'],next:['next to','옆에'],behind:['behind','뒤에'],front:['in front of','앞에']};
function pSkel(r,lap){for(let g=0;g<200;g++){const a=lvPick(r,THG,lap),l=lvPick(r,LOC.filter(x=>(!a.ani||x.ani)&&!(x.bag&&/bag/.test(a.en))),lap);if(!l)continue;const p=PREP[pick(r,l.ps)];return {a,l,p}}throw new Error('no p')}
function pForm(k,f){let a=k.a;const Q=/q$|where$/.test(f);const aen=Q&&a.q?a.q[0]:a.en,ako=Q&&a.q?a.q[1]:a.ko;const be=a.pl?'are':'is',was=a.pl?'were':'was',top=josa(ako,'은/는');
  const where=[k.p[0],k.l.en],kw=k.l.ko+' '+k.p[1];let en,ko;
  switch(f){case 'p_pos':en=SEN([aen,be,...where]);ko=KSEN([top,kw,'있어']);break;
  case 'p_neg':en=SEN([aen,a.pl?"aren't":"isn't",...where]);ko=KSEN([top,kw,'없어']);break;
  case 'p_q':en=SEN([be,aen,...where],1);ko=KSEN([top,kw,'있어'],1);break;
  case 'p_ppos':en=SEN([aen,was,...where]);ko=KSEN([top,kw,'있었어']);break;
  case 'p_where':en=SEN(['where',be,aen],1);ko=KSEN([top,'어디에 있어'],1);break}
  return {en,ko,w:[chip(a.ko.replace(/^내 /,''),bare(a.en.replace(/^my /,''))),chip(k.l.ko,bare(k.l.en)),chip(k.p[1],k.p[0])]}}

// ───────── 전치사 · 때와 방향 (9단계) ─────────
const RT=[['get up','일어나다',[6,7,8]],['eat breakfast','아침을 먹다',[7,8]],['go to school','학교에 가다',[8,9],'kid'],['come home','집에 오다',[2,3,4,5]],['do {po} homework','숙제를 하다',[4,5,6,7],'kid'],
  ['eat dinner','저녁을 먹다',[6,7]],['take a shower','샤워를 하다',[7,8,9]],['go to bed','자러 가다',[9,10]]];
const NUMW=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const DAYS=[['Monday','월요일'],['Tuesday','화요일'],['Wednesday','수요일'],['Thursday','목요일'],['Friday','금요일'],['Saturday','토요일'],['Sunday','일요일']];
const MONTH=['January','February','March','April','May','June','July','August','September','October','November','December'];
const SEASON=[['summer','여름',[['go to the beach','해변에 가다'],['swim in the sea','바다에서 수영하다'],['eat watermelon','수박을 먹다']]],
  ['winter','겨울',[['make snowmen','눈사람을 만들다'],['go skiing','스키를 타러 가다'],['wear warm coats','따뜻한 코트를 입다']]],
  ['spring','봄',[['plant flowers','꽃을 심다'],['go on picnics','소풍을 가다']]],['fall','가을',[['go hiking','등산을 가다'],['pick apples','사과를 따다']]]];
const POSS=[['my','내'],['your','네'],['his','그의'],['her','그녀의'],["my mom's",'우리 엄마'],["my dad's",'우리 아빠'],["my friend's",'내 친구']];
const FROM=[['school','학교'],['the library','도서관'],['the park','공원'],['soccer practice','축구 연습',2],['the hospital','병원',2],['the airport','공항',3]];
function tSkel(r,lap){const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron'],x=>!!x.po));return {s,rt:pick(r,RT),h:r(),d:pick(r,DAYS),se:pick(r,SEASON),a:r(),po:pick(r,POSS),m:Math.floor(r()*12),fr:lvPick(r,FROM.map(x=>({en:x[0],ko:x[1],lv:x[2]||1})),lap),past:r(),v:vSkel(r,lap,'v_pos',['me','you','kid','adult','old','pron'])}}
function tForm(k,f){let s=k.s,en,ko,w=[];const third=s.s;
  switch(f){
  case 't_at':{let rt=k.rt;if(rt[3]&&!(s.t==='kid'||s.t==='me'||s.t==='you'||s.t==='pron'))rt=RT[0];const hr=rt[2][Math.floor(k.h*rt[2].length)],past=k.past<.4;const ve=rt[0].replace('{po}',s.po);
    const v=past?EN.past(ve):third?EN.s3(ve):ve;en=SEN([s.en,v,'at',NUMW[hr],past&&'yesterday']);ko=KSEN([s.top,past&&'어제',hr+'시에',past?KO.P(rt[1]):KO.A(rt[1])]);w=[chip(rt[1].split(' ').pop(),rt[0].split(' ')[0])];break}
  case 't_on':{const k2=k.v,pa=k.past<.4,v=k2.v.e,o=oEn(k2,s);if(!k2.v.h||(k2.o&&/h0/.test(k2.o.f))){return tForm(k,'t_at')}
    en=SEN([s.en,pa?EN.past(v):third?EN.s3(v):v,o,'on',pa?k.d[0]:k.d[0]+'s']);ko=KSEN([s.top,k.d[1]+(pa?'에':'마다'),oKo(k2),pa?KO.P(k2.v.k):KO.A(k2.v.k)]);w=vChips(Object.assign({},k2,{s}));w.push(chip(k.d[1],k.d[0]));break}
  case 't_in':{const a=k.se[2][Math.floor(k.a*k.se[2].length)];en=SEN([s.en,third?EN.s3(a[0]):a[0],'in',k.se[0]]);ko=KSEN([s.top,k.se[1]+'에',KO.A(a[1])]);w=[chip(k.se[1],k.se[0])];break}
  case 't_bday':{const p=k.po;en=SEN([p[0],'birthday is in',MONTH[k.m]]);ko=KSEN([p[1]+' 생일은',(k.m+1)+'월이야']);w=[chip('생일','birthday'),chip((k.m+1)+'월',MONTH[k.m])];break}
  case 't_bdayq':{const p=k.po[0]==='my'?['your','네']:k.po[0]==="my mom's"?["your mom's",'너희 엄마']:k.po[0]==="my dad's"?["your dad's",'너희 아빠']:k.po[0]==="my friend's"?["your friend's",'네 친구']:k.po;
    if(k.a<.5){en=SEN(['is',p[0],'birthday in',MONTH[k.m]],1);ko=KSEN([p[1]+' 생일은',(k.m+1)+'월이야'],1)}else{en=SEN(['when is',p[0],'birthday'],1);ko=KSEN([p[1]+' 생일은','언제야'],1)}w=[chip('생일','birthday')];break}
  case 't_from':{const fr=k.fr,pa=k.past<.7,hr=[2,3,4,5][Math.floor(k.h*4)];const tm=k.a<.5;
    en=SEN([s.en,pa?'came':third?'comes':'come','home from',fr.en,tm&&'at '+NUMW[hr]]);ko=KSEN([s.top,tm&&hr+'시에',fr.ko+'에서','집에',pa?'왔어':'와']);w=[chip(fr.ko,bare(fr.en)),chip('오다','come')];break}}
  return {en,ko,w}}

// ───────── 수량 (16단계) ─────────
const QN=[['eggs','달걀',1,'개'],['apples','사과',1,'개'],['milk','우유',0],['juice','주스',0],['water','물',0],['cheese','치즈',0,'',2],['tomatoes','토마토',1,'개',2],['butter','버터',0,'',2],
  ['books','책',1,'권'],['students','학생',1,'명'],['people','사람',1,'명'],['trees','나무',1,'그루'],['birds','새',1,'마리'],['toys','장난감',1,'개'],['cookies','쿠키',1,'개'],['sugar','설탕',0,'',2],['money','돈',0],
  ['desks','책상',1,'개'],['chairs','의자',1,'개'],['flour','밀가루',0,'',3],['ingredients','재료',1,'가지',3],
  ['animals','동물',1,'마리'],['cows','소',1,'마리',2],['chickens','닭',1,'마리'],['pencils','연필',1,'자루'],['candies','사탕',1,'개'],['flowers','꽃',1,'송이'],['cars','차',1,'대'],['children','아이',1,'명'],
  ['fish','물고기',1,'마리'],['coins','동전',1,'개',2],['snacks','과자',1,'개'],['bread','빵',0],['rice','쌀',0,'',2],['salt','소금',0,'',2],['paper','종이',0]].map(([en,ko,c,cn,lv])=>({en,ko,c:!!c,cn,lv:lv||1}));
const QP=[['in the fridge','냉장고에',['eggs','apples','milk','juice','water','cheese','tomatoes','butter']],['in the library','도서관에',['books','students','people']],
  ['in the park','공원에',['people','trees','birds']],['in the box','상자 안에',['toys','books','cookies']],['in the classroom','교실에',['students','desks','chairs']],
  ['in the jar','통에',['cookies','sugar','flour']],['in my wallet','내 지갑에',['money']],['in the kitchen','부엌에',['ingredients','flour','sugar','eggs']],
  ['at the zoo','동물원에',['animals','people','children']],['on the farm','농장에',['cows','chickens','animals']],['in my bag','내 가방 안에',['pencils','books','candies','snacks']],
  ['in the garden','정원에',['flowers','trees','birds']],['on the street','길에',['cars','people']],['in the pond','연못에',['fish']],['in the bakery','빵집에',['bread','cookies','people']],
  ['in the drawer','서랍 안에',['pencils','coins','paper']],['in the cupboard','찬장에',['salt','sugar','rice','flour']]];
function qSkel(r,lap){for(let g=0;g<200;g++){const P=pick(r,QP);const n=lvPick(r,QN.filter(x=>P[2].includes(x.en)),lap);if(!n)continue;
    const OWN=['eggs','apples','milk','juice','cheese','books','toys','cookies','money','tomatoes','pencils','candies','coins','snacks','bread','paper','flowers'];
    const nh=lvPick(r,QN.filter(x=>OWN.includes(x.en)),lap),nc=lvPick(r,QN.filter(x=>OWN.includes(x.en)&&x.c),lap),nu=lvPick(r,QN.filter(x=>OWN.includes(x.en)&&!x.c),lap);
    const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron']));return {P,n,nh,nc,nu,s,own:r()<.45,u2:r()<.5}}throw new Error('no q')}
function qForm(k,f){const {P,n}=k;let s=k.s,en,ko;const third=s.s;const nh=k.nh;
  switch(f){
  case 'q_some':en=SEN([s.en,third?'has':'have','some',nh.en]);ko=KSEN([s.top,josa(nh.ko,'이/가'),'좀 있어']);break;
  case 'q_any':en=SEN([s.en,third?"doesn't have":"don't have",'any',nh.en]);ko=KSEN([s.top,josa(nh.ko,'이/가'),nh.c?'하나도 없어':'전혀 없어']);break;
  case 'q_anyq':s=qS(s);en=SEN([s.s?'does':'do',s.en,'have any',nh.en],1);ko=KSEN([s.top,nh.ko,'좀 있어'],1);break;
  // 「가진 것」으로도(엄마 11/27 문장 더 많이): I have many books. / She doesn't have much money.
  case 'q_many':if(k.own){en=SEN([s.en,third?'has':'have','many',k.nc.en]);ko=KSEN([s.top,josa(k.nc.ko,'이/가'),'많아']);return {en,ko,w:[chip(k.nc.ko,k.nc.en)]}}if(!n.c)return qForm(k,'q_much');en=SEN(['there are many',n.en,P[0]]);ko=KSEN([P[1],josa(n.ko,'이/가'),'많이 있어']);break;
  case 'q_much':if(k.own){en=SEN([s.en,third?"doesn't have":"don't have",'much',k.nu.en]);ko=KSEN([s.top,josa(k.nu.ko,'이/가'),'많이 없어']);return {en,ko,w:[chip(k.nu.ko,k.nu.en)]}}if(n.c){en=SEN(["there aren't many",n.en,P[0]]);ko=KSEN([P[1],josa(n.ko,'이/가'),'많이 없어'])}else{en=SEN(["there isn't much",n.en,P[0]]);ko=KSEN([P[1],josa(n.ko,'이/가'),'많이 없어'])}break;
  case 'q_manyq':if(k.own){s=qS(s);en=SEN([s.s?'does':'do',s.en,'have many',k.nc.en],1);ko=KSEN([s.top,josa(k.nc.ko,'이/가'),'많아'],1);return {en,ko,w:[chip(k.nc.ko,k.nc.en)]}}en=n.c?SEN(['are there many',n.en,P[0]],1):SEN(['is there much',n.en,P[0]],1);ko=KSEN([P[1],josa(n.ko,'이/가'),'많이 있어'],1);break;
  case 'q_few':if(k.own){const x=k.u2?k.nc:k.nu;if(x.c){en=SEN([s.en,third?'has':'have','a few',x.en]);ko=KSEN([s.top,josa(x.ko,'이/가'),'몇 '+x.cn,'있어'])}else{en=SEN([s.en,third?'has':'have','a little',x.en]);ko=KSEN([s.top,josa(x.ko,'이/가'),'조금 있어'])}return {en,ko,w:[chip(x.ko,x.en)]}}if(!n.c){en=SEN(['there is a little',n.en,P[0]]);ko=KSEN([P[1],josa(n.ko,'이/가'),'조금 있어'])}else{en=SEN(['there are a few',n.en,P[0]]);ko=KSEN([P[1],josa(n.ko,'이/가'),'몇 '+n.cn,'있어'])}break;
  }
  const nn=f.startsWith('q_some')||f.startsWith('q_any')?nh:n;return {en,ko,w:[chip(nn.ko,nn.en)]}}

// ───────── 재귀대명사 (17단계) ─────────
const BYV=new Set(['make','cook','clean','draw','do','solve','write','prepare','read','brush']);
const ENJ=[['at the party','파티에서'],['at the beach','해변에서'],['at the zoo','동물원에서'],['at the festival','축제에서',2],['at the concert','콘서트에서',2],['at the amusement park','놀이공원에서',2],['at the camp','캠프에서'],['at the pool','수영장에서'],['at the playground','놀이터에서'],['at the picnic','소풍에서'],['at the museum','박물관에서',2]];
function rSkel(r,lap){const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron'],x=>!!x.r));let v;
  for(let g=0;g<200;g++){const vs=VP.filter(x=>x.lv<=lap&&BYV.has(x.e)&&vpOk(s,x));const x=lvPick(r,vs,lap);const o=objFor(r,lap,s,x,null);if(o===undefined)continue;v={s,v:x,o,th:1,tp:1,tf:1,tw:0};break}
  return {s,v,e:lvPick(r,ENJ.map(x=>({en:x[0],ko:x[1],lv:x[2]||1})),lap),m:r()}}
function rForm(k,f){let s=k.s,en,ko,w=[];const kk=Object.assign({},k.v);
  switch(f){
  case 'r_by':kk.s=s;en=SEN([s.en,EN.past(kk.v.e),oEn(kk,s),'by',s.r]);ko=KSEN([s.top,'혼자서',oKo(kk),KO.P(kk.v.k)]);w=vChips(kk);break;
  case 'r_byq':s=qS(s);kk.s=s;en=SEN(['did',s.en,kk.v.e,oEn(kk,s),'by',s.r],1);ko=KSEN([s.top,'혼자서',oKo(kk),KO.P(kk.v.k)],1);w=vChips(kk);break;
  case 'r_can':kk.s=s;en=SEN([s.en,'can',kk.v.e,oEn(kk,s),'by',s.r]);ko=KSEN([s.top,'혼자서',oKo(kk),KO.L(kk.v.k)+' 수 있어']);w=vChips(kk);break;
  case 'r_enjoy':en=SEN([s.en,'enjoyed',s.r,k.e.en]);ko=KSEN([s.top,k.e.ko,'즐거운 시간을 보냈어']);w=[chip('즐기다','enjoy'),chip(k.e.ko.replace(/에서$/,''),bare(k.e.en.replace(/^at /,'')))];break;
  case 'r_self':if(k.m<.5){en=SEN([s.en,'looked at',s.r,'in the mirror']);ko=KSEN([s.top,'거울 속 자기 자신을 봤어']);w=[chip('거울','mirror')]}
    else{en=SEN([s.en,'introduced',s.r]);ko=KSEN([s.top,'자기소개를 했어']);w=[chip('소개하다','introduce')]}break}
  return {en,ko,w}}

// ───────── 비교급 (18단계) ─────────
const CADJ={big:['bigger','크다','size'],small:['smaller','작다','-size'],fast:['faster','빠르다','speed'],slow:['slower','느리다','-speed'],heavy:['heavier','무겁다','size'],light:['lighter','가볍다','-size']};
const CANI=[['elephants','코끼리',5000,40],['horses','말',500,70],['dogs','개',20,45],['cats','고양이',4,45],['rabbits','토끼',2,55],['mice','쥐',.02,13],['turtles','거북이',null,.3],
  ['lions','사자',190,80],['cheetahs','치타',50,110,2],['whales','고래',50000,null,2],['snails','달팽이',.01,.05,2],['giraffes','기린',1000,55,2]].map(([en,ko,size,speed,lv])=>({en,ko,size,speed,lv:lv||1,pl:1}));
const CVEH=[['planes','비행기',null,900],['trains','기차',null,300],['cars','자동차',null,100],['bikes','자전거',null,20],['ships','배',null,40,2],['rockets','로켓',null,28000,2]].map(([en,ko,size,speed,lv])=>({en,ko,size,speed,lv:lv||1,pl:1}));
const CCTY=[['Russia','러시아',17.1],['China','중국',9.6],['Japan','일본',.378],['Korea','한국',.1],['Canada','캐나다',10,2],['Brazil','브라질',8.5,2],['Australia','호주',7.7,2],['India','인도',3.3,2],
  ['Singapore','싱가포르',.0007,2],['Italy','이탈리아',.3,3],['Vietnam','베트남',.33,3]].map(([en,ko,size,lv])=>({en,ko,size,lv:lv||1,pl:0}));
// 사람: 나이 순(아이 1 · 어른 2 · 할머니·할아버지 3) / 의견 형용사는 아무나
const PADJ={tall:['taller','키가 크다','rank2'],old:['older','나이가 많다','rank'],young:['younger','어리다','-rank'],strong:['stronger','힘이 세다','rank2'],
  funny:['funnier','웃기다','op'],kind:['kinder','친절하다','op'],popular:['more popular','인기가 많다','op',2],honest:['more honest','정직하다','op',2],careful:['more careful','조심스럽다','op',2],
  diligent:['more diligent','성실하다','op',3],generous:['more generous','너그럽다','op',3]};
const RANK=s=>s.t==='kid'||s.t==='me'?1:s.t==='adult'?2:s.t==='old'?3:0;const RANK2=s=>s.t==='kid'||s.t==='me'?1:s.t==='adult'||s.t==='old'?2:0;
const PB=SUBJ.filter(s=>['my mom','my dad','my grandma','my grandpa','my friend','the teacher'].includes(s.en));
const more=w=>{const [p,x]=w.includes(' ')?[w.slice(0,w.lastIndexOf(' ')+1),w.slice(w.lastIndexOf(' ')+1)]:['',w];return p+'더 '+x};
const most=w=>{const [p,x]=w.includes(' ')?[w.slice(0,w.lastIndexOf(' ')+1),w.slice(w.lastIndexOf(' ')+1)]:['',w];return p+'가장 '+x};
const ranked=(a,b,adj,dir)=>{const key=adj[2].replace('-','');const v=x=>key==='rank'?RANK(x):key==='rank2'?RANK2(x):x[key];const va=v(a),vb=v(b);if(!va||!vb)return false;const inv=adj[2][0]==='-';const big=Math.max(va,vb)/Math.min(va,vb);
  if(adj[2].includes('rank')){if(va===vb)return false}else if(big<3)return false;return dir?((va>vb)!==inv):((va<vb)!==inv)};
function cSkel(r,lap){return {u:r(),a:r(),b:r(),j:r(),x:r(),lap}}
function cPair(k,truth){// truth: 1 = 맞는 말, 0 = 틀린 말(아니야), null = 질문(아무거나)
  const lap=k.lap,R=rng(Math.floor(k.u*1e9));
  for(let g=0;g<400;g++){const kind=R()<.45?'ani':R()<.3?'veh':R()<.5?'cty':'ppl';
    if(kind==='ppl'){const jl=Object.keys(PADJ).filter(j=>(PADJ[j][3]||1)<=lap);const j=pick(R,jl),adj=PADJ[j];const A=pick(R,subjsFor(lap,['me','you','pron','adult','old','kid'],s=>s.en!=='the students'&&s.en!=='my friends')),B=pick(R,PB.filter(b=>b.en!==A.en));
      if(adj[2]!=='op'){if(truth===null){if(!ranked(A,B,adj,1)&&!ranked(A,B,adj,0))continue}else if(!ranked(A,B,adj,truth))continue}
      return {A:{en:A.en,ko:A.ko,top:A.top,s:A.s||A.t==='me'?1:0,be:A.be,q:A},B:{en:B.en,ko:B.ko},j,adj,ppl:1}}
    const L=(kind==='ani'?CANI:kind==='veh'?CVEH:CCTY).filter(x=>x.lv<=lap);const js=Object.keys(CADJ).filter(j=>kind==='cty'?['big','small'].includes(j):kind==='veh'?['fast','slow'].includes(j):true);
    const j=pick(R,js),adj=CADJ[j],A=pick(R,L),B=pick(R,L);if(A===B)continue;
    if(truth===null){if(!ranked(A,B,adj,1)&&!ranked(A,B,adj,0))continue}else if(!ranked(A,B,adj,truth))continue;
    return {A:{en:A.en,ko:A.ko,top:josa(A.ko,'은/는'),be:A.pl?'are':'is'},B:{en:B.en,ko:B.ko},j,adj}}throw new Error('no cmp')}
function cForm(k,f){const truth=f==='c_pos'?1:f==='c_neg'?0:null;const P=cPair(k,truth);let A=P.A;if(f==='c_q'&&P.ppl){const q=qS(A.q);A={en:q.en,ko:q.ko,top:q.top,be:q.be}}
  const cmp=P.adj[0],ko=more(P.adj[1]);let en,kk;
  switch(f){case 'c_pos':en=SEN([A.en,A.be,cmp,'than',P.B.en]);kk=KSEN([A.top,P.B.ko+'보다',KO.A(ko)]);break;
  case 'c_neg':en=SEN([A.en==='I'?"I'm not":A.en+' '+(A.be==='is'?"isn't":A.be==='am'?'am not':"aren't"),cmp,'than',P.B.en]);kk=KSEN([A.top,P.B.ko+'보다',KO.S(ko)+'지 않아']);break;
  case 'c_q':en=SEN([A.be,A.en,cmp,'than',P.B.en],1);kk=KSEN([A.top,P.B.ko+'보다',KO.A(ko)],1);break}
  if(/^I am not/.test(en))en=en.replace('I am not',"I'm not");
  return {en,ko:kk,w:[chip(P.adj[1],P.j)]}}

// ───────── 최상급 (19단계) ─────────
const SUPA={tall:['the tallest','키가 크다'],strong:['the strongest','힘이 세다'],funny:['the funniest','웃기다'],kind:['the kindest','친절하다'],smart:['the smartest','똑똑하다'],busy:['the busiest','바쁘다'],
  fast:['the fastest','빠르다'],old:['the oldest','나이가 많다'],young:['the youngest','어리다'],popular:['the most popular','인기가 많다',2],honest:['the most honest','정직하다',2],
  careful:['the most careful','조심스럽다',2],diligent:['the most diligent','성실하다',3],generous:['the most generous','너그럽다',3],creative:['the most creative','창의적',3],
  cute:['the cutest','귀엽다'],quiet:['the quietest','조용하다'],friendly:['the friendliest','다정하다'],shy:['the shyest','수줍음이 많다'],slow:['the slowest','느리다'],short:['the shortest','키가 작다'],
  brave:['the bravest','용감하다',2],calm:['the calmest','침착하다',2],lazy:['the laziest','게으르다',2],healthy:['the healthiest','건강하다',2],polite:['the most polite','예의가 바르다',2],
  curious:['the most curious','호기심이 많다',2],cheerful:['the most cheerful','쾌활하다',2],active:['the most active','활발하다',2],
  patient:['the most patient','참을성이 많다',3],responsible:['the most responsible','책임감이 강하다',3],talented:['the most talented','재능이 많다',3]};
const SGRP=[['in my family','우리 가족 중에서',['me','adult','old'],['in your family','너희 가족 중에서']],['in our class','우리 반에서',['me','kid','pron'],['in your class','너희 반에서']],['on the team','그 팀에서',['pron','kid'],['on the team','그 팀에서']],['in our school','우리 학교에서',['me','kid','pron'],['in your school','너희 학교에서']],['in the club','그 동아리에서',['pron','kid'],['in the club','그 동아리에서']]];
const SFACT=[['The cheetah is the fastest land animal.','치타는 땅에서 가장 빠른 동물이야.',1],['The giraffe is the tallest animal in the world.','기린은 세계에서 가장 키가 큰 동물이야.',1],
  ['The elephant is the biggest land animal.','코끼리는 땅에서 가장 큰 동물이야.',1],['Russia is the biggest country in the world.','러시아는 세계에서 가장 큰 나라야.',1],
  ['Mount Everest is the highest mountain in the world.','에베레스트산은 세계에서 가장 높은 산이야.',1],['Hallasan is the highest mountain in South Korea.','한라산은 남한에서 가장 높은 산이야.',2],
  ['The blue whale is the biggest animal in the world.','흰긴수염고래는 세계에서 가장 큰 동물이야.',2],['Jupiter is the biggest planet in the solar system.','목성은 태양계에서 가장 큰 행성이야.',2],
  ['The Pacific Ocean is the biggest ocean in the world.','태평양은 세계에서 가장 큰 바다야.',2,['The Pacific Ocean is the largest ocean in the world.']],['Antarctica is the coldest place on Earth.','남극은 지구에서 가장 추운 곳이야.',2],
  ['Mercury is the closest planet to the sun.','수성은 태양에서 가장 가까운 행성이야.',3],['Vatican City is the smallest country in the world.','바티칸 시국은 세계에서 가장 작은 나라야.',3],
  ['Sirius is the brightest star in the night sky.','시리우스는 밤하늘에서 가장 밝은 별이야.',3],
  ['Seoul is the biggest city in South Korea.','서울은 남한에서 가장 큰 도시야.',1],['The ostrich is the biggest bird in the world.','타조는 세계에서 가장 큰 새야.',2],
  ['Venus is the hottest planet in the solar system.','금성은 태양계에서 가장 뜨거운 행성이야.',3],['Lake Baikal is the deepest lake in the world.','바이칼호는 세계에서 가장 깊은 호수야.',3]];
function sSkel(r,lap){for(let g=0;g<300;g++){const G=pick(r,SGRP);const js=Object.keys(SUPA).filter(j=>(SUPA[j][2]||1)<=lap);const j=pick(r,js);
    const FAMI=['I','my mom','my dad','my grandma','my grandpa'];const S=pick(r,subjsFor(lap,G[2],s=>!/^the /.test(s.en)&&(G[0]!=='in my family'||FAMI.includes(s.en))&&!(G[0]==='in our class'&&(s.t==='adult'||s.t==='old'))&&!s.pl));if(!S)continue;
    if(G[0]==='in my family'){if(['tall','strong','old'].includes(j)&&S.t==='me')continue;if(j==='old'&&S.t!=='old')continue;if(j==='young'&&S.t!=='me')continue}
    if(G[0]!=='in my family'&&(j==='old'||j==='young'))continue;
    return {G,j,S,nn:r()<.5,fa:lvPick(r,SFACT.map(x=>({en:x[0],ko:x[1],lv:x[2],alt:x[3]})),lap)}}throw new Error('no sup')}
function sForm(k,f){const a=SUPA[k.j];let en,ko,alt;const w=[chip(a[1].split(' ').pop(),k.j)];
  const sk=w=>/적$/.test(w)?COP.pos(most(w)):KO.A(most(w));
  // 「가장 ~한 학생/선수/사람」(같은 무리 이름)도 섞기
  const NN={'in my family':['person','사람'],'in our class':['student','학생'],'in our school':['student','학생'],'on the team':['player','선수']}[k.G[0]];
  const mk=w=>/적$/.test(w)?most(w)+'인':KO.N(most(w));
  if(f==='s_pos'){const S=k.S;if(k.nn&&NN){en=SEN([S.en,S.be,a[0],NN[0],k.G[0]]);ko=KSEN([S.top,k.G[1],mk(a[1]),COP.pos(NN[1])])}else{en=SEN([S.en,S.be,a[0],k.G[0]]);ko=KSEN([S.top,k.G[1],sk(a[1])])}}
  else if(f==='s_who'){if(k.nn&&NN){en=SEN(['who is',a[0],NN[0],k.G[3][0]],1);ko=KSEN([k.G[3][1],'누가',mk(a[1]),COP.pos(NN[1])],1)}else{en=SEN(['who is',a[0],k.G[3][0]],1);ko=KSEN([k.G[3][1],'누가',sk(a[1])],1)}}
  else{en=k.fa.en;ko=k.fa.ko;alt=k.fa.alt;return {en,ko,alt,w:[]}}
  return {en,ko,w}}

// ───────── to부정사 (20단계) ─────────
const PURP=[['the store','가게',[['buy milk','우유를 사다'],['buy bread','빵을 사다'],['buy a present','선물을 사다']]],['the library','도서관',[['borrow books','책을 빌리다',2],['read books','책을 읽다'],['study','공부하다']]],
  ['the park','공원',[['play soccer','축구를 하다'],['ride {po} bike','자전거를 타다'],['take a walk','산책을 하다',2]]],['the pool','수영장',[['swim','수영하다']]],['the zoo','동물원',[['see animals','동물을 보다']]],
  ['the market','시장',[['buy vegetables','채소를 사다',2],['buy fruit','과일을 사다',2]],2],['the museum','박물관',[['see old paintings','옛날 그림을 보다',2]],2],
  ['the hospital','병원',[['see a doctor','진료를 받다',3]],3],['the bank','은행',[['save money','저축하다',3]],3]];
function iSkel(r,lap){const k=vSkel(r,lap,'v_fut',['me','you','kid','adult','old','pron'],LIKEV);const kob=vSkel(r,lap,'v_hto',['me','you','kid','adult','old','pron'],LIKEV);
  const P=lvPick(r,PURP.filter(p=>(p[3]||1)<=lap).map(p=>({p,lv:p[3]||1})),lap).p;const act=lvPick(r,P[2].filter(a=>a[1]).map(a=>({a,lv:a[2]||1})),lap).a;return {k,kob,P,act,u:r()}}
function iForm(k,f){const K=/^i_(promise|need)$/.test(f)&&k.kob?k.kob:k.k;let s=K.s;if(s.t==='you'&&/^i_(want|wantneg|hope|plan|need)$/.test(f))s=SUBJ[0];const third=s.s;const e=K.v.e,o=oEn(K,s),ok=oKo(K),w=K.v.k;let en,ko,alt;const ch=vChips(K);
  switch(f){
  case 'i_want':en=SEN([s.en,third?'wants':'want','to',e,o]);ko=KSEN([s.top,ok,KO.S(w)+'고 싶어']);break;
  case 'i_wantneg':en=SEN([s.en,third?"doesn't want":"don't want",'to',e,o]);ko=KSEN([s.top,ok,KO.S(w)+'고 싶지 않아']);break;
  case 'i_wantq':s=qS(s);en=SEN([s.s?'does':'do',s.en,'want to',e,oEn(K,s)],1);ko=KSEN([s.top,ok,KO.S(w)+'고 싶어'],1);break;
  case 'i_decide':en=SEN([s.en,'decided to',e,o]);ko=KSEN([s.top,ok,KO.S(w)+'기로 했어']);break;
  case 'i_plan':en=SEN([s.en,third?'plans':'plan','to',e,o]);ko=KSEN([s.top,ok,KO.L(w)+' 계획이야']);break;
  case 'i_hope':en=SEN([s.en,third?'hopes':'hope','to',e,o]);ko=KSEN([s.top,ok,KO.S(w)+'기를 바라']);break;
  case 'i_try':en=SEN([s.en,third?'tries':'try','to',e,o]);ko=KSEN([s.top,ok,KO.R(w)+' 노력해']);break;
  case 'i_need':en=SEN([s.en,third?'needs':'need','to',e,o]);ko=KSEN([s.top,ok,KO.L(w)+' 필요가 있어']);break;
  case 'i_promise':en=SEN([s.en,'promised to',e,o]);ko=KSEN([s.top,ok,KO.S(w)+'기로 약속했어']);break;
  case 'i_purpose':{const a=k.act,ae=a[0].replace('{po}',s.po||'their');const past=k.u<.7;
    en=SEN([s.en,past?'went':third?'goes':'go','to',k.P[0],'to',ae]);ko=KSEN([s.top,KO.RU(a[1]),k.P[1]+'에',past?'갔어':'가']);
    return {en,ko,w:[chip(k.P[1],bare(k.P[0])),chip(a[1].split(' ').pop(),a[0].split(' ')[0])]}}}
  return {en,ko,alt,w:ch}}

// ───────── 동명사 (21단계) ─────────
const GADJ=[['fun','재미있다'],['boring','지루하다'],['hard','어렵다'],['easy','쉽다'],['important','중요하다',2],['good for your health','건강에 좋다',2,'health']];
const HEALTH=new Set(['exercise','swim','run','eat','walk','sleep']);
const THANK=[['helping me','도와줘서'],['coming','와 줘서'],['waiting for me','기다려 줘서'],['calling me','전화해 줘서'],['inviting me','초대해 줘서',2],['listening to me','내 말을 들어 줘서',2],['understanding me','나를 이해해 줘서',3]];
const STOPV=[['playing computer games','컴퓨터 게임을 하는 것'],['watching TV','TV를 보는 것'],['eating cookies','쿠키를 먹는 것'],['drinking soda','탄산음료를 마시는 것',2],['eating fast food','패스트푸드를 먹는 것',2],['biting {po} nails','손톱을 물어뜯는 것',3]];
function gSkel(r,lap){return {k:vSkel(r,lap,'v_prog',['me','you','kid','adult','old','pron'],LIKEV),kf:vSkel(r,lap,'v_prog',['me','you','kid','adult','old','pron'],FINV),ks:vSkel(r,lap,'v_can',['me','you','kid','adult','old','pron']),a:lvPick(r,GADJ.map(x=>({x,lv:x[2]||1})),lap).x,
  t:lvPick(r,THANK.map(x=>({x,lv:x[2]||1})),lap).x,st:lvPick(r,STOPV.map(x=>({x,lv:x[2]||1})),lap).x,u:r()}}
const defO=en=>!en?'':/^(the|a |an |\{po\}|to )/.test(en)?en:en==='TV'?'TV':'the '+en;
function gForm(k,f){const K=f==='g_goodat'||f==='g_notgood'?k.ks:f==='g_finish'?k.kf:k.k;let s=K.s;const third=s.s,e=K.v.e,o=oEn(K,s),ok=oKo(K),w=K.v.k;let en,ko,alt,ch=vChips(K);
  switch(f){
  case 'g_like':en=SEN([s.en,third?'likes':'like',EN.ing(e),o]);ko=KSEN([s.top,ok,KO.NE(w)+' 것을 좋아해']);alt=[SEN([s.en,third?'likes':'like','to',e,o])];break;
  case 'g_enjoy':en=SEN([s.en,third?'enjoys':'enjoy',EN.ing(e),o]);ko=KSEN([s.top,ok,KO.NE(w)+' 것을 즐겨']);break;
  case 'g_goodat':en=SEN([s.en,s.be,'good at',EN.ing(e),o]);ko=KSEN([s.top,ok,KO.NE(w)+' 것을 잘해']);break;
  case 'g_notgood':en=SEN([...beNeg(s),'good at',EN.ing(e),o]);ko=KSEN([s.top,ok,KO.NE(w)+' 것을 잘 못해']);break;
  case 'g_subj':{let a=k.a;if(a[3]==='health'&&!HEALTH.has(e))a=GADJ[0];const oo=o.replace(/^(his|her|my|your|our|their) /,'');
    en=SEN([EN.ing(e),oo,'is',a[0]]);ko=KSEN([(ok?ok+' ':'')+KO.NE(w)+' 것은',KO.A(a[1])]);alt=[SEN(['it is',a[0],'to',e,oo])];ch=ch.filter((c,i)=>i>0||!subjChip(K.s));ch.push(chip(a[1],a[0]));break}
  case 'g_howabout':{const oo=o.replace(/^(his|her|my|your|our|their) /,'');en=SEN(['how about',EN.ing(e),oo],1);ko=KSEN([ok,KO.NE(w)+' 게 어때'],1);alt=[SEN(['what about',EN.ing(e),oo],1)];ch=ch.filter((c,i)=>i>0||!subjChip(K.s));break}
  case 'g_thanks':en=SEN(['thank you for',k.t[0]]);ko=KSEN([k.t[1],'고마워']);ch=[chip('고맙다','thank')];break;
  case 'g_finish':en=SEN([s.en,'finished',EN.ing(e),defO(o)]);ko=KSEN([s.top,ok,'다',KO.P(w)]);break;
  case 'g_stop':{const st=(!s.po&&/\{po\}/.test(k.st[0]))?STOPV[0]:k.st;const x=st[0].replace('{po}',s.po||'their');en=SEN([s.en,'stopped',x]);ko=KSEN([s.top,josa(st[1],'을/를'),'그만뒀어']);ch=[chip('그만두다','stop')];break}}
  return {en,ko,alt,w:ch}}

// ───────── 감정 분사 (22단계) ─────────
const EMO={exciting:['excited','흥미진진하다','신나다'],boring:['bored','지루하다','지루하다'],interesting:['interested','재미있다',null],surprising:['surprised','놀랍다','놀라다'],
  tiring:['tired','힘들다','피곤하다'],confusing:['confused','헷갈리다','헷갈리다',2],disappointing:['disappointed','실망스럽다','실망하다',2],frightening:['frightened','무섭다','겁이 나다',2],
  embarrassing:['embarrassed','창피하다','창피하다',2],annoying:['annoyed','짜증 나다','짜증이 나다',2],satisfying:['satisfied','만족스럽다','만족하다',3],
  fascinating:['fascinated','흥미롭다','매료되다',3],relaxing:['relaxed','편안하다','편안하다',3],shocking:['shocked','충격적','충격을 받다',3]};
const ETH=[['the movie','영화','exciting boring interesting surprising disappointing frightening fascinating shocking'],['the game','경기','exciting boring disappointing surprising'],
  ['the book','책','interesting boring exciting confusing fascinating'],['the trip','여행','exciting tiring boring disappointing relaxing'],['the class','수업','boring interesting confusing tiring'],
  ['the news','소식','surprising disappointing shocking exciting'],['the test','시험','confusing tiring'],['the story','이야기','interesting boring exciting frightening surprising'],
  ['the hike','등산','tiring',2],['the show','공연','exciting boring',2],['the noise','소음','annoying',2],['the mistake','실수','embarrassing',2],['the lecture','강의','boring interesting confusing fascinating',3],
  ['the result','결과','satisfying disappointing surprising shocking',3],['the music','음악','relaxing boring',3],['the situation','상황','confusing embarrassing annoying',3],
  ['the party','파티','exciting boring disappointing'],['the ride','놀이기구','exciting frightening'],['the puzzle','퍼즐','confusing interesting'],['the magic trick','마술','surprising interesting'],
  ['the homework','숙제','confusing tiring boring'],['the concert','콘서트','exciting boring',2],['the speech','연설','boring interesting',2],['the ending','결말','surprising disappointing satisfying',2],
  ['the documentary','다큐멘터리','interesting fascinating boring',3]].map(([en,ko,ok,lv])=>({en,ko,ok:ok.split(' '),lv:lv||1}));
const ETOP=[['science','과학'],['history','역사'],['music','음악'],['art','미술'],['sports','운동'],['animals','동물'],['robots','로봇'],['space','우주',2],['politics','정치',3],['economics','경제',3],['astronomy','천문학',3],['dinosaurs','공룡'],['insects','곤충'],['cooking','요리'],['math','수학'],['movies','영화'],['coding','코딩',2],['plants','식물',2],['languages','언어',2],['architecture','건축',3],['psychology','심리학',3]];
function eSkel(r,lap){for(let g=0;g<300;g++){const T=lvPick(r,ETH,lap);const ok=T.ok.filter(x=>(EMO[x][3]||1)<=lap);if(!ok.length)continue;const j=pick(r,ok);
    const pj=lvPick(r,Object.keys(EMO).filter(x=>EMO[x][2]).map(x=>({x,lv:EMO[x][3]||1})),lap).x;
    return {T,j,pj,s:pick(r,subjsFor(lap,['me','you','kid','adult','old','pron'])),tp:lvPick(r,ETOP.map(x=>({x,lv:x[2]||1})),lap).x,u:r()}}throw new Error('no emo')}
function eForm(k,f){const E=EMO[k.j],P=EMO[k.pj];let s=k.s,en,ko;const tk=josa('그 '+k.T.ko,'은/는');const cop=w=>/적$/.test(w);
  const kpast=w=>cop(w)?COP.past(w):KO.P(w);
  switch(f){
  case 'e_thing':en=SEN([k.T.en,'was',k.j]);ko=KSEN([tk,kpast(E[1])]);return {en,ko,w:[chip(k.T.ko,bare(k.T.en)),chip(E[1],k.j)]};
  case 'e_thingq':en=SEN(['was',k.T.en,k.j],1);ko=KSEN([tk,kpast(E[1])],1);return {en,ko,w:[chip(k.T.ko,bare(k.T.en)),chip(E[1],k.j)]};
  case 'e_person':en=SEN([s.en,s.was,P[0]]);ko=KSEN([s.top,KO.P(P[2])]);return {en,ko,w:[chip(P[2],P[0])]};
  case 'e_personq':s=qS(s);en=SEN([s.was,s.en,P[0]],1);ko=KSEN([s.top,KO.P(P[2])],1);return {en,ko,w:[chip(P[2],P[0])]};
  case 'e_inter':{const T=k.tp,u=k.u;if(u<.6){en=SEN([s.en,s.be,'interested in',T[0]]);ko=KSEN([s.top,T[1]+'에','관심이 있어'])}
    else if(u<.8){en=SEN([...beNeg(s),'interested in',T[0]]);ko=KSEN([s.top,T[1]+'에','관심이 없어'])}
    else{s=qS(s);en=SEN([s.be,s.en,'interested in',T[0]],1);ko=KSEN([s.top,T[1]+'에','관심이 있어'],1)}
    return {en,ko,w:[chip(T[1],T[0]),chip('관심이 있다','interested')]}}}}

// ───────── 접속사 (23단계) ─────────
const CAUSE=[['hungry','배가 고프다',[['ate some bread','빵을 먹었어'],['ate a sandwich','샌드위치를 먹었어'],['ate some rice','밥을 먹었어']]],
  ['thirsty','목이 마르다',[['drank some water','물을 마셨어'],['drank some juice','주스를 마셨어']]],['tired','피곤하다',[['went to bed early','일찍 자러 갔어'],['took a nap','낮잠을 잤어',2]]],
  ['sick','아프다',[['stayed home','집에 있었어'],['went to the hospital','병원에 갔어']]],['cold','춥다',[['wore a coat','코트를 입었어'],['closed the window','창문을 닫았어']]],
  ['hot','덥다',[['opened the window','창문을 열었어'],['ate some ice cream','아이스크림을 먹었어'],['turned on the fan','선풍기를 켰어',2]]],
  ['bored','심심하다',[['read a book','책을 읽었어'],['watched TV','TV를 봤어'],['played a game','게임을 했어']]],['sleepy','졸리다',[['went to bed','자러 갔어']]],
  ['nervous','긴장되다',[['took a deep breath','심호흡을 했어',2]],2],['lonely','외롭다',[['called a friend','친구에게 전화했어',2]],2],['exhausted','지쳐 있다',[['rested all day','하루 종일 쉬었어',3]],3],
  ['sad','슬프다',[['cried','울었어'],['called a friend','친구에게 전화했어',2]]],['happy','기쁘다',[['sang a song','노래를 불렀어'],['danced','춤을 췄어']]],
  ['full','배가 부르다',[["didn't eat dessert",'디저트를 먹지 않았어'],['stopped eating','그만 먹었어',2]]],['busy','바쁘다',[["didn't watch TV",'TV를 보지 않았어'],['skipped lunch','점심을 걸렀어',3]]],
  ['scared','무섭다',[['turned on the light','불을 켰어']]],['worried','걱정되다',[['called the teacher','선생님께 전화했어',2]],2]];
const BUT=[['tired','피곤하다',[['played soccer','축구를 했어'],['did {po} homework','숙제를 했어'],['went to school','학교에 갔어']]],['sick','아프다',[['went to school','학교에 갔어'],['did {po} homework','숙제를 했어']]],
  ['hungry','배가 고프다',[["didn't eat anything",'아무것도 먹지 않았어']]],['cold','춥다',[['went swimming','수영하러 갔어']]],['sleepy','졸리다',[['finished {po} homework','숙제를 끝냈어']]],
  ['nervous','긴장되다',[['did a great job','아주 잘했어',2]],2],['exhausted','지쳐 있다',[['finished the marathon','마라톤을 끝까지 달렸어',3]],3],
  ['busy','바쁘다',[['helped me','나를 도와줬어'],['cooked dinner','저녁을 요리했어']]],['scared','무섭다',[['watched the movie','그 영화를 봤어'],['touched the snake','뱀을 만졌어',2]]],
  ['full','배가 부르다',[['ate some cake','케이크를 먹었어']]],['sad','슬프다',[['smiled','웃었어']]],['hot','덥다',[['played outside','밖에서 놀았어']]]];
const AND=[['the park','공원',[['played soccer','축구를 했어'],['rode {po} bike','자전거를 탔어']]],['the library','도서관',[['read books','책을 읽었어'],['borrowed some books','책을 빌렸어',2]]],
  ['the store','가게',[['bought some milk','우유를 샀어'],['bought a present','선물을 샀어']]],['the beach','해변',[['swam in the sea','바다에서 수영했어'],['built a sandcastle','모래성을 쌓았어',2]]],
  ['the zoo','동물원',[['saw lions','사자를 봤어'],['fed the rabbits','토끼에게 먹이를 줬어',2]]],['the museum','박물관',[['saw old paintings','옛날 그림을 봤어',2]],2],
  ['the pool','수영장',[['swam','수영했어'],['played with a ball','공놀이를 했어']]],['the mall','쇼핑몰',[['bought some clothes','옷을 샀어'],['ate lunch','점심을 먹었어']],2],
  ['the farm','농장',[['fed the chickens','닭에게 먹이를 줬어'],['picked strawberries','딸기를 땄어']],2],['the bakery','빵집',[['bought some bread','빵을 샀어']]],
  ['the river','강',[['caught a fish','물고기를 잡았어'],['rode {po} bike','자전거를 탔어']]],['the restaurant','식당',[['ate pizza','피자를 먹었어'],['had dinner','저녁을 먹었어']]]];
const pk=(r,a,lap)=>lvPick(r,a.filter(x=>(x[3]||1)<=lap).map(x=>({x,lv:x[3]||1})),lap).x;
const pk2=(r,a,lap)=>lvPick(r,a.filter(x=>(x[2]||1)<=lap).map(x=>({x,lv:x[2]||1})),lap).x;
function jSkel(r,lap){const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron'],x=>!!x.pr));const c=pk(r,CAUSE,lap),cr=pk2(r,c[2],lap),b=pk(r,BUT,lap),br=pk2(r,b[2],lap),a=pk(r,AND,lap),ar=pk2(r,a[2],lap);return {s,c,cr,b,br,a,ar}}
function jForm(k,f){const s=k.s;let en,ko,alt;const po=x=>x.replace('{po}',s.po);
  switch(f){
  case 'j_so':en=SEN([s.en,s.was,k.c[0]+',','so',s.pr,po(k.cr[0])]);ko=KSEN([s.top,KO.P(k.c[1])+'.','그래서',k.cr[1]]);alt=[SEN([s.en,s.was,k.c[0]+'.','so',s.pr,po(k.cr[0])])];return {en,ko,alt,w:[chip(k.c[1],k.c[0])]};
  case 'j_because':en=SEN([s.en,po(k.cr[0]),'because',s.pr,s.was,k.c[0]]);ko=KSEN([s.top,KO.Pst(k.c[1])+'기 때문에',k.cr[1]]);alt=[SEN(['because',s.en,s.was,k.c[0]+',',s.pr,po(k.cr[0])])];return {en,ko,alt,w:[chip(k.c[1],k.c[0])]};
  case 'j_but':if((s.t==='adult'||s.t==='old')&&/homework/.test(k.br[0]))return jForm(Object.assign({},k,{s:SUBJ[0]}),f);en=SEN([s.en,s.was,k.b[0]+',','but',s.pr,po(k.br[0])]);ko=KSEN([s.top,KO.Pst(k.b[1])+'지만',k.br[1]]);return {en,ko,w:[chip(k.b[1],k.b[0])]};
  case 'j_and':en=SEN([s.en,'went to',k.a[0],'and',po(k.ar[0])]);ko=KSEN([s.top,k.a[1]+'에 가서',k.ar[1]]);return {en,ko,w:[chip(k.a[1],bare(k.a[0]))]}}}

// ───────── if · when (24단계) ─────────
const IFC=[['it rains','비가 오다',[['stay home','집에 있다'],['watch a movie','영화를 보다'],['play board games','보드게임을 하다']],[['go to the park','공원에 가다'],['play soccer outside','밖에서 축구를 하다'],['go on a picnic','소풍을 가다']]],
  ['it snows','눈이 오다',[['make a snowman','눈사람을 만들다'],['go sledding','썰매를 타러 가다',2],['have a snowball fight','눈싸움을 하다',2]],[['ride {po} bike','자전거를 타다']]],
  ['the weather is nice','날씨가 좋다',[['go to the park','공원에 가다'],['go on a picnic','소풍을 가다'],['ride bikes','자전거를 타다']],[['stay home','집에 있다']]],
  ['it is cold','날씨가 춥다',[['wear a coat','코트를 입다'],['stay inside','안에 있다']],[['go swimming','수영하러 가다']]],
  ['it is hot','날씨가 덥다',[['go swimming','수영하러 가다'],['eat ice cream','아이스크림을 먹다']],[['play soccer outside','밖에서 축구를 하다']]],
  ['I have time','시간이 있다',[['help you','너를 돕다'],['visit my grandma','우리 할머니 댁에 가다'],['read a book','책을 읽다']],[['watch TV','TV를 보다']],2,'I'],
  ['I finish my homework early','숙제를 일찍 끝내다',[['play games','게임을 하다'],['go to the park','공원에 가다']],[['go to bed late','늦게 자러 가다']],2,'I']];
const WHENC=[['I got home','내가 집에 왔을 때','me'],['I woke up','내가 일어났을 때','me'],['you called','네가 전화했을 때','you'],['I opened the door','내가 문을 열었을 때','me'],
  ['the teacher came in','선생님이 들어오셨을 때','the teacher'],['we arrived','우리가 도착했을 때','we',2],['the movie started','영화가 시작했을 때','',2],['the phone rang','전화가 울렸을 때','',2],['the power went out','정전이 됐을 때','',3]];
const WHENH=[['bored','심심하다',[['play games','게임을 하다'],['read books','책을 읽다'],['draw pictures','그림을 그리다']]],['tired','피곤하다',[['take a nap','낮잠을 자다',2],['listen to music','음악을 듣다']]],
  ['sad','슬프다',[['listen to music','음악을 듣다'],['call a friend','친구에게 전화하다',2]]],['happy','행복하다',[['sing','노래하다'],['dance','춤추다']]],['hungry','배가 고프다',[['eat cookies','쿠키를 먹다'],['eat bread','빵을 먹다']]],
  ['stressed','스트레스를 받다',[['exercise','운동하다'],['take a walk','산책을 하다']],3]];
function kSkel(r,lap){const c=lvPick(r,IFC.map(x=>({x,lv:x[4]||1})),lap).x;const res=pk2(r,c[2],lap),nres=pk2(r,c[3],lap);
  const s=c[5]==='I'?SUBJ[0]:pick(r,subjsFor(lap,['me','pron'],x=>x.en!=='she'||true));const tm=r()<.5;
  const wc=lvPick(r,WHENC.map(x=>({x,lv:x[3]||1})),lap).x;const ms=vSkel(r,lap,'v_pprog',['me','you','kid','adult','old','pron']);
  const wh=pk(r,WHENH,lap),whr=pk2(r,wh[2],lap),hs=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron'],x=>!!x.pr));return {c,res,nres,s,tm,wc,ms,wh,whr,hs,u:r()}}
function kForm(k,f){let s=k.s,en,ko,alt;const c=k.c,third=/^(it|the weather)/.test(c[0])||c[5]==='I'?0:0;const cond=c[0],tE=k.tm&&c[5]!=='I'?' tomorrow':'',tK=k.tm&&c[5]!=='I'?'내일 ':'';
  const po=x=>x.replace('{po}',s.po||'my');
  switch(f){
  case 'k_if':en=SEN(['if',cond+tE+',',s.en,'will',po(k.res[0])]);ko=KSEN([tK+KO.M(c[1]),s.top,KO.L(k.res[1])+' 거야']);alt=[SEN([s.en,'will',po(k.res[0]),'if',cond+tE])];return {en,ko,alt,w:[chip(k.res[1],k.res[0].replace('{po}','my'))]};
  case 'k_ifneg':if(c[5]==='I')return kForm(Object.assign({},k,{c:IFC[0],nres:IFC[0][3][0]}),'k_ifneg');en=SEN(['if',cond+tE+',',s.en,"won't",po(k.nres[0])]);ko=KSEN([tK+KO.M(c[1]),s.top,KO.S(k.nres[1])+'지 않을 거야']);alt=[SEN([s.en,"won't",po(k.nres[0]),'if',cond+tE])];return {en,ko,alt,w:[chip(k.nres[1],k.nres[0].replace('{po}','my'))]};
  case 'k_ifq':{if(c[5]==='I')return kForm(Object.assign({},k,{c:IFC[0],res:IFC[0][2][0]}),'k_ifq');const y=SUBJ[1];en=SEN(['if',cond+tE+',','will you',k.res[0].replace('{po}','your')],1);ko=KSEN([tK+KO.M(c[1]),y.top,KO.L(k.res[1])+' 거야'],1);return {en,ko,w:[chip(k.res[1],k.res[0].replace('{po}','your'))]}}
  case 'k_when':{const wc=k.wc;let M=Object.assign({},k.ms);if(M.s.en===wc[2]||(wc[2]==='me'&&M.s.t==='me')||(wc[2]==='you'&&M.s.t==='you')||(wc[2]==='we'&&M.s.en==='we'))M.s=SUBJ.find(x=>x.en==='my dad');
    const ms=M.s,e=M.v.e,o=oEn(M,ms);en=SEN(['when',wc[0]+',',ms.en,ms.was,EN.ing(e),o]);ko=KSEN([wc[1],ms.top,oKo(M),KO.S(M.v.k)+'고 있었어']);alt=[SEN([ms.en,ms.was,EN.ing(e),o,'when',wc[0]])];return {en,ko,alt,w:vChips(M)}}
  case 'k_whenhab':{const h=k.hs,third=h.s;const ve=k.whr[0];en=SEN(['when',h.pr,h.pr==='I'?'am':third?'is':'are',k.wh[0]+',',h.pr,third?EN.s3(ve):ve]);
    ko=KSEN([h.top,KO.L(k.wh[1])+' 때',KO.A(k.whr[1])]);alt=[SEN([h.en,third?EN.s3(ve):ve,'when',h.pr,h.pr==='I'?'am':third?'is':'are',k.wh[0]])];
    if(h.en!==h.pr&&!/^(I|you)$/.test(h.en))en=SEN(['when',h.en,third?'is':'are',k.wh[0]+',',h.pr,third?EN.s3(ve):ve]);return {en,ko,alt,w:[chip(k.wh[1],k.wh[0])]}}}}

// ───────── 수동태 (25단계) ─────────
const PAS=[['the cake','케이크','make','만들다','p'],['the cookies','쿠키','make','만들다','p',1],['the snowman','눈사람','make','만들다','p'],['the picture','그림','draw','그리다','p'],
  ['the letter','편지','write','쓰다','p'],['the story','이야기','write','쓰다','p'],['the kitchen','부엌','clean','청소하다','p'],['the window','창문','break','깨다','pa'],['the cookies','쿠키','eat','먹다','pa',1],
  ['the pizza','피자','eat','먹다','pa'],['the door','문','open','열다','pa'],['the vase','꽃병','break','깨다','pa',0,2],['the wall','벽','paint','칠하다','p',0,2],['the song','노래','sing','부르다','p',0,2],
  ['the email','이메일','send','보내다','p',0,2],['the dinner','저녁','cook','요리하다','p',0,2],['the house','집','build','짓다','p',0,3],['the report','보고서','write','쓰다','p',0,3],
  ['the bike','자전거','fix','고치다','p',0,2],['the photo','사진','take','찍다','p'],['the soup','수프','make','끓이다','p'],['the cup','컵','break','깨다','pa'],['the ball','공','throw','던지다','pa'],
  ['the poster','포스터','make','만들다','p'],['the sandcastle','모래성','build','쌓다','p'],['the room','방','clean','청소하다','p'],['the robot','로봇','build','만들다','p',0,2],
  ['the paper airplane','종이비행기','fold','접다','p'],['the car','차','wash','세차하다','p',0,2],['the computer','컴퓨터','fix','고치다','p',0,2]].map(([en,ko,v,kv,ag,pl,lv])=>({en,ko,v,kv,ag,pl:!!pl,lv:lv||1}));
const OBJP={I:'me',you:'you',he:'him',she:'her',we:'us',they:'them'};
const PFACT=[['Hangeul was created by King Sejong.','한글은 세종대왕이 만들었어.',1,['Hangeul was made by King Sejong.','Hangul was created by King Sejong.','Hangul was made by King Sejong.']],
  ['Cheese is made from milk.','치즈는 우유로 만들어.',1],['Paper is made from wood.','종이는 나무로 만들어.',1,['Paper is made from trees.']],['English is spoken in many countries.','영어는 많은 나라에서 쓰여.',2],
  ['The Mona Lisa was painted by Leonardo da Vinci.','모나리자는 레오나르도 다빈치가 그렸어.',2],['The Olympics are held every four years.','올림픽은 4년마다 열려.',2],
  ['The telephone was invented by Alexander Graham Bell.','전화기는 알렉산더 그레이엄 벨이 발명했어.',3],['The light bulb was invented by Thomas Edison.','전구는 토머스 에디슨이 발명했어.',3],
  ['Romeo and Juliet was written by Shakespeare.','로미오와 줄리엣은 셰익스피어가 썼어.',3],['Rice is grown in many Asian countries.','쌀은 많은 아시아 나라에서 재배돼.',3],
  ['Butter is made from milk.','버터는 우유로 만들어.',1],['Bread is made from flour.','빵은 밀가루로 만들어.',1],['Glass is made from sand.','유리는 모래로 만들어.',2],
  ['French is spoken in France.','프랑스어는 프랑스에서 쓰여.',2],['Spanish is spoken in Mexico.','스페인어는 멕시코에서 쓰여.',2],['The World Cup is held every four years.','월드컵은 4년마다 열려.',2],
  ['Coffee is grown in Brazil.','커피는 브라질에서 재배돼.',3],['Penicillin was discovered by Alexander Fleming.','페니실린은 알렉산더 플레밍이 발견했어.',3]];
function xSkel(r,lap){const T=lvPick(r,PAS,lap);const ag=pick(r,subjsFor(lap,T.ag.includes('a')?['me','you','kid','adult','old','pron','ani']:['me','you','kid','adult','old','pron']));
  return {T,ag,fa:lvPick(r,PFACT.map(x=>({x,lv:x[2]})),lap).x}}
function xForm(k,f){const T=k.T;let ag=k.ag;if(f==='x_q')ag=qS(ag,1);const by=OBJP[ag.en]||ag.en,be=T.pl?'were':'was',tk=josa('그 '+T.ko+(T.pl?'들':''),'은/는');let en,ko,alt;
  const w=[chip(T.ko,bare(T.en)),chip(T.kv,T.v)];
  switch(f){case 'x_pos':en=SEN([T.en,be,EN.pp(T.v),'by',by]);ko=KSEN([tk,ag.nom,KO.P(T.kv)]);break;
  case 'x_neg':en=SEN([T.en,T.pl?"weren't":"wasn't",EN.pp(T.v),'by',by]);ko=KSEN([tk,ag.nom,KO.N(T.kv),'게 아니야']);break;
  case 'x_q':en=SEN([be,T.en,EN.pp(T.v),'by',by],1);ko=KSEN([tk,ag.nom,KO.P(T.kv)],1);break;
  case 'x_fact':return {en:k.fa[0],ko:k.fa[1],alt:k.fa[3],w:[]}}
  return {en,ko,alt,w}}

// ───────── 현재완료 (26단계) ─────────
const EXP=[['been to Jeju Island','제주도에 가다'],['been to Japan','일본에 가다'],['been to China','중국에 가다'],['been to Busan','부산에 가다'],['been to an amusement park','놀이공원에 가다',2],
  ['been to Europe','유럽에 가다',2],['been to a concert','콘서트에 가다',2],['been to Africa','아프리카에 가다',3],['eaten sushi','초밥을 먹다'],['eaten tacos','타코를 먹다'],['eaten durian','두리안을 먹다',2],
  ['eaten pho','쌀국수를 먹다',2],['seen a whale','고래를 보다'],['seen a rainbow','무지개를 보다'],['seen a dolphin','돌고래를 보다'],['seen a shooting star','별똥별을 보다',2],
  ['seen the northern lights','오로라를 보다',3],['ridden a horse','말을 타다'],['ridden an elephant','코끼리를 타다'],['ridden a camel','낙타를 타다',2],['ridden a roller coaster','롤러코스터를 타다',2],
  ['caught a fish','물고기를 잡다'],['touched a snake','뱀을 만지다'],['climbed a tree','나무에 올라가다'],['played chess','체스를 하다',2],['played golf','골프를 치다',2],['climbed Hallasan','한라산에 오르다',2],
  ['met a famous person','유명한 사람을 만나다',2],['met a movie star','영화배우를 만나다',2],['lived abroad','외국에서 살다',3],['written a poem','시를 쓰다',3],['won a prize','상을 받다',2],
  ['been to America','미국에 가다'],['been to a farm','농장에 가다'],['eaten curry','카레를 먹다'],['eaten snails','달팽이 요리를 먹다',2],['seen a tiger','호랑이를 보다'],['seen a penguin','펭귄을 보다'],
  ['ridden a bike','자전거를 타다'],['made a cake','케이크를 만들다'],['made kimchi','김치를 만들다',2],['flown a kite','연을 날리다'],['grown a plant','식물을 키우다',2],['built a snowman','눈사람을 만들다'],
  ['swum in the sea','바다에서 수영하다'],['sung on a stage','무대에서 노래하다',2],['visited a palace','궁궐에 가다',2]];
const DUR=[['lived in Seoul','서울에서 #살고 있다',1,'',['서울','Seoul']],['lived in Busan','부산에서 #살고 있다',1,'',['부산','Busan']],['lived in this house','이 집에서 #살고 있다',1,'',['집','house']],['studied English','#영어를 공부하고 있다',1,'',['공부하다','study']],
  ['played the piano','#피아노를 치고 있다',1,'',['피아노','piano']],['learned Taekwondo','#태권도를 배우고 있다',1,'',['배우다','learn']],['known each other','#서로 알고 지내고 있다',2,'pl',['서로','each other']],['worked here','여기에서 #일하고 있다',2,'ad',['일하다','work']],['taught math','#수학을 가르치고 있다',3,'ad',['가르치다','teach']],
  ['lived in Korea','한국에서 #살고 있다',1,'',['한국','Korea']],['played soccer','#축구를 하고 있다',1,'',['축구','soccer']],['studied Chinese','#중국어를 공부하고 있다',2,'',['중국어','Chinese']],
  ['played the violin','#바이올린을 켜고 있다',2,'',['바이올린','violin']],['been friends','#친구로 지내고 있다',2,'pl',['친구','friends']],['kept a diary','#일기를 쓰고 있다',2,'',['일기','diary']],
  ['taken art lessons','#미술 수업을 받고 있다',2,'',['미술','art']],['worked at the hospital','병원에서 #일하고 있다',3,'ad',['병원','hospital']]];
function exKo(d,neg,q){const [pre,wd]=d.includes(' ')?[d.slice(0,d.lastIndexOf(' ')+1),d.slice(d.lastIndexOf(' ')+1)]:['',d];const base=wd==='보다'?pre+'본':pre+KO.A(wd)+' 본';return base+(neg?' 적이 없어':' 적 있어')+(q?'?':'')}
function hSkel(r,lap){const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron']));return {s,x:pk2(r,EXP,lap),d:pk2(r,DUR,lap),n:2+Math.floor(r()*7),m:r()<.25,u:r()}}
function hForm(k,f){let s=k.s,en,ko,alt;const has=s.s?'has':'have';
  switch(f){
  case 'h_pos':en=SEN([s.en,has,k.x[0]]);ko=KSEN([s.top,exKo(k.x[1])]);alt=[SEN([s.en,has,'ever',k.x[0]])];break;
  case 'h_never':en=SEN([s.en,has,'never',k.x[0]]);ko=KSEN([s.top,exKo(k.x[1],1)]);break;
  case 'h_q':s=qS(s);en=SEN([s.s?'has':'have',s.en,'ever',k.x[0]],1);ko=KSEN([s.top,exKo(k.x[1])],1);alt=[SEN([s.s?'has':'have',s.en,k.x[0]],1)];break;
  case 'h_for':{let d=k.d;if(d[3]==='pl'&&!s.pl)d=DUR[0];if(d[3]==='ad'&&!(s.t==='adult'||s.t==='old'))d=DUR[3];const n=k.n,unit=k.m?'months':'years',ku=k.m?'개월째':'년째';
    en=SEN([s.en,has,d[0],'for',NUMW[n],unit]);ko=KSEN([s.top,KO.A(d[1].replace('#',n+ku+' '))]);
    return {en,ko,w:[chip(d[4][0],d[4][1])]}}}
  const vv=k.x[1].split(' ').pop();return {en,ko,alt,w:[chip(k.x[1].replace(/ [^ ]+$/,'').replace(/(을|를|에)$/,''),k.x[0].split(' ').slice(1).join(' ').replace(/^(to )?(a |an |the )?/,'')),chip(vv,ppBase(k.x[0].split(' ')[0]))]}}
function ppBase(w){if(w==='been')return 'go';for(const b in C.IRV)if(C.IRV[b][1]===w)return b;if(w==='lived')return 'live';return w.replace(/ied$/,'y').replace(/ed$/,'')}

// ───────── 관계사 (27단계) ─────────
const RHEAD=[['a friend','친구'],['a boy','남자아이'],['a girl','여자아이'],['a neighbor','이웃',2],['a woman','여자',2],['a man','남자',2],['a scientist','과학자',3]];
const ROBJ=[['book','책',[['buy','사다'],['read','읽다'],['write','쓰다'],['borrow','빌리다',2]]],['cake','케이크',[['make','만들다'],['buy','사다']]],['picture','그림',[['draw','그리다']]],
  ['movie','영화',[['watch','보다']]],['song','노래',[['sing','부르다'],['listen to','듣다']]],['bike','자전거',[['ride','타다'],['buy','사다']]],['letter','편지',[['write','쓰다']]],['game','게임',[['play','하다']]],
  ['city','도시',[['visit','방문하다']],2],['restaurant','식당',[['go to','가다']],2],['robot','로봇',[['build','만들다']],3]];
const RPRED=[['my friend','내 친구'],['my cousin','내 사촌'],['my classmate','우리 반 친구',2],['a famous singer','유명한 가수',2],['my neighbor','우리 이웃',2]];
function lSkel(r,lap){const s=pick(r,subjsFor(lap,['me','you','kid','adult','old','pron']));const h=pk2(r,RHEAD,lap);let k=vSkel(r,lap,'v_prog',['kid']);for(let i=0;i<10&&(/^(get up|wake up|go to bed|travel|rest|wait|sleep|come home|go home)$/.test(k.v.e)&&!oEn(k,{po:'their'})||/\{po\}|^brush|^wash/.test(k.v.e+' '+oEn(k,{po:'{po}'})));i++)k=vSkel(r,lap,'v_prog',['kid']);const o=pk(r,ROBJ,lap),ov=pk2(r,o[2],lap);
  const ag=pick(r,subjsFor(lap,['me','kid','adult','old','pron']));return {s,h,k,o,ov,ag,p:pk2(r,RPRED,lap),u:r(),t:r()}}
function lForm(k,f){let en,ko,alt;const s=k.s;
  switch(f){
  case 'l_who':{const K=Object.assign({},k.k,{s:SUBJ[10]}),e=K.v.e,o=oEn(K,{po:'their'}).replace('their ','');const know=k.h[0]!=='a friend';
    en=SEN([s.en,know?(s.s?'knows':'know'):(s.s?'has':'have'),k.h[0],'who',EN.s3(e),o]);ko=KSEN([s.top,oKo(K),KO.NE(K.v.k),know?josa(k.h[1],'을/를'):josa(k.h[1],'이/가'),know?'알아':'있어']);
    alt=[en.replace(' who ',' that ')];return {en,ko,alt,w:vChips(K).slice(1).concat([chip(k.h[1],bare(k.h[0]))])}}
  case 'l_that':{const ag=k.ag,ov=k.ov,tm=k.t<.4;const verb=ov[0]==='go to'?'went to':EN.past(ov[0]);
    if(k.u<.5){en=SEN(['this is the',k.o[0],'that',ag.en,verb,tm&&'yesterday']);ko=KSEN(['이것은',ag.nom,tm&&'어제',KO.N(ov[1]),josa(k.o[1],'이야/야')])}
    else{const me=SUBJ[0];const A=ag.t==='me'?SUBJ[6]:ag;en=SEN(['I like the',k.o[0],'that',A.en,verb]);ko=KSEN([me.top,A.nom,KO.N(ov[1]),josa(k.o[1],'을/를'),'좋아해'])}
    alt=[en.replace(' that ',' which '),en.replace(/ that /,' ')];return {en,ko,alt,w:[chip(k.o[1],k.o[0]),chip(ov[1],ov[0])]}}
  case 'l_prog':{const K=Object.assign({},k.k,{s:SUBJ[10]}),e=K.v.e,o=oEn(K,{po:'their'}).replace('their ','');const H=/^a (boy|girl)$/.test(k.h[0])?k.h:RHEAD[k.u<.5?1:2];const hd=H[0].replace(/^an? /,'');const hk=H[1];
    en=SEN(['the',hd,'who is',EN.ing(e),o,'is',k.p[0]]);ko=KSEN([oKo(K),KO.S(K.v.k)+'고 있는',josa(hk,'은/는'),josa(k.p[1],'이야/야')]);alt=[en.replace(' who is ',' that is ')];
    return {en,ko,alt,w:vChips(K).slice(1).concat([chip(hk,hd)])}}}}

// ───────── 단계 ─────────
// blk: 한 묶음(같은 씨앗) 안에서 나오는 꼴들. 앞 단계 꼴이 섞여 있으면 「기준 문장」 역할(그 꼴의 단계로 셈).
// ───────── 짝 묶음(엄마 11/27 「엄청 많이 연습」): be↔do · 하나↔여럿 · a↔an · I eat↔He eats ─────────
const ESV=new Set(['go','watch','fix','study','fly','have','do','wash','brush','teach','tidy up','finish','catch','kiss','mix','relax']);
const VOW=w=>/^[aeiou]/i.test(w)&&!/^(uni|use|one)/i.test(w);
function zSkel(r,lap){for(let g=0;g<300;g++){
    // 3인칭 동사 변화 골고루(엄마 11/27): 절반쯤은 -es · -ies · has · does 로 바뀌는 동사
    const kv=vSkel(r,lap,'v_pos',PEOPLE,r()<.5?ESV:undefined);const s=kv.s;if(kv.v.po&&!s.po)continue;
    const adj=lvPick(r,ADJ.filter(a=>/fe|tr/.test(a.f)&&!/\bc\b/.test(a.f)),lap);
    // I eat ↔ He eats: 같은 동사·목적어, 주어만 하나(3인칭)↔여럿/나/너
    const okS=x=>!(kv.o&&(kv.o.en===x.en||kv.o.en.replace(/^(the|my|a) /,'')===x.en.replace(/^(the|my|a) /,'')))&&vpOk(x,kv.v)&&objOk(x,kv.v,kv.o)&&!(kv.v.po&&!x.po)&&!(kv.o&&/friends/.test(kv.o.en)&&/friend/.test(x.en));
    const s3=pick(r,subjsFor(lap,PEOPLE,x=>x.s&&okS(x))),sN=pick(r,subjsFor(lap,PEOPLE,x=>!x.s&&okS(x)));if(!s3||!sN)continue;
    // 하나 ↔ 여럿(직업): 학생이면 아이들, 아니면 어른들
    const job=lvPick(r,JOB,lap);const stu=job.en==='student';
    const j1=pick(r,subjsFor(lap,PEOPLE,x=>x.s&&(stu?(x.t==='kid'||x.t==='pron'):(x.t==='adult'||x.t==='pron'))&&!/^the /.test(x.en)&&!x.nj));
    const j2=pick(r,subjsFor(lap,PEOPLE,x=>x.pl&&(stu?(x.t==='kid'||x.t==='pron'):(x.t==='adult'||x.t==='pron'||x.t==='you'))&&!x.nj&&!(x.en==='my parents'&&stu)));if(!j1||!j2)continue;
    // a ↔ an: 같은 주어(어른·그·그녀), 자음 직업 하나 + 모음 직업 하나 / 또는 have a ~ ↔ have an ~
    const aj=JOB.filter(x=>x.lv<=lap&&x.en!=='student'&&!VOW(x.en)),vj=JOB.filter(x=>x.lv<=lap&&VOW(x.en));
    const ja=pick(r,subjsFor(lap,PEOPLE,x=>x.s&&(x.t==='adult'||x.t==='pron')&&!/^the /.test(x.en)&&!x.nj));
    const hv=VP.find(v=>v.have),ho=hv.o.filter(o=>o.lv<=lap&&/^an? /.test(o.en)),hoA=ho.filter(o=>/^a /.test(o.en)),hoN=ho.filter(o=>/^an /.test(o.en));
    if(!ja||!aj.length||!vj.length||!hoA.length||!hoN.length)continue;
    return {kv,s,adj,s3,sN,job,j1,j2,ja,a1:pick(r,aj),a2:pick(r,vj),hs:pick(r,subjsFor(lap,PEOPLE,x=>vpOk(x,hv))),hv,h1:pick(r,hoA),h2:pick(r,hoN),useH:r()<.4,tp:r(),tw:r(),th:r()}}
  throw new Error('no z')}
function zForm(k,f){const B=(ty,c,s,ff)=>bForm({s,ty,c,fe:c,tp:1,tw:0},ff);const Vv=(s,ff)=>{const K=Object.assign({},k.kv,{s});return vForm(K,ff)};
  const out=x=>Object.assign({},x,{alt:x.alt||[]});
  switch(f){
  case 'z_bpos':return out(B('adj',k.adj,k.s,'b_pos'));case 'z_vpos':return out(Vv(k.s,'v_pos'));
  case 'z_bneg':return out(B('adj',k.adj,k.s,'b_neg'));case 'z_vneg':return out(Vv(k.s,'v_neg'));
  case 'z_bq':return out(B('adj',k.adj,k.s,'b_q'));case 'z_vq':return out(Vv(k.s,'v_q'));
  case 'z_bpast':return out(B('adj',k.adj,k.s,'b_ppos'));case 'z_vpast':return out(Vv(k.s,'v_ppos'));
  case 'z_bpneg':return out(B('adj',k.adj,k.s,'b_pneg'));case 'z_vpneg':return out(Vv(k.s,'v_pneg'));
  case 'z_i':return out(Vv(k.sN,'v_pos'));case 'z_he':return out(Vv(k.s3,'v_pos'));
  case 'z_ineg':return out(Vv(k.sN,'v_neg'));case 'z_heneg':return out(Vv(k.s3,'v_neg'));
  case 'z_iq':return out(Vv(k.sN,'v_q'));case 'z_heq':return out(Vv(k.s3,'v_q'));
  case 'z_sg':return out(B('job',k.job,k.j1,'b_pos'));case 'z_pl':return out(B('job',k.job,k.j2,'b_pos'));
  case 'z_a':if(k.useH)return out(vForm({s:k.hs,v:k.hv,o:k.h1,th:1,tp:1,tf:1,tw:0},'v_pos'));return out(B('job',k.a1,k.ja,'b_pos'));
  case 'z_ab':return out(B('job',k.a1,k.ja,'b_pos'));case 'z_anb':return out(B('job',k.a2,k.ja,'b_pos'));
  case 'z_an':if(k.useH)return out(vForm({s:k.hs,v:k.hv,o:k.h2,th:1,tp:1,tf:1,tw:0},'v_pos'));return out(B('job',k.a2,k.ja,'b_pos'));
  default:throw new Error('form '+f)}}
// 하루마다 섞어 낼 짝 묶음(모든 단계에서): 지금 단계에 맞는 것만
const ZBLK=[{min:1,max:4,b:[['z_ab','z_anb'],['z_anb','z_ab']]},{min:2,b:[['z_sg','z_pl'],['z_pl','z_sg']]},{min:5,b:[['z_a','z_an'],['z_an','z_a']]},{min:6,b:[['z_i','z_he'],['z_he','z_i']]},{min:7,b:[['z_bpos','z_vpos'],['z_vpos','z_bpos']]},
  {min:8,b:[['z_ineg','z_heneg'],['z_heq','z_iq'],['z_bneg','z_vneg'],['z_vq','z_bq']]},{min:9,b:[['z_bpast','z_vpast'],['z_vpneg','z_bpneg']]}];
function zBlocks(stage){return ZBLK.filter(x=>stage>=x.min&&(!x.max||stage<=x.max)).flatMap(x=>x.b)}
const FAM={z:[zSkel,zForm],b:[bSkel,bForm],v:[(r,l,c)=>vSkel(r,l,c,/^v_(who|what|where|when|whatdoing|hto|dhto|htoq|sh)$/.test(c)?PEOPLE:undefined),vForm],p:[pSkel,pForm],t:[tSkel,tForm],q:[qSkel,qForm],r:[rSkel,rForm],c:[cSkel,cForm],s:[sSkel,sForm],i:[iSkel,iForm],g:[gSkel,gForm],e:[eSkel,eForm],j:[jSkel,jForm],k:[kSkel,kForm],x:[xSkel,xForm],h:[hSkel,hForm],l:[lSkel,lForm]};
const STAGES=[
 {t:'be동사 · am / is / are',ex:'I am happy. / He is happy. / They are happy.',blk:[['b_pos']]},
 {t:'하나 · 여럿 · a / an / -s',ex:'He is a student. / They are students. / She is an artist.',blk:[['z_sg','z_pl'],['z_pl','z_sg'],['z_ab','z_anb'],['z_anb','z_ab']]},
 {t:'be동사 · 아니야 · 질문',ex:"He isn't happy. / Is he happy?",blk:[['b_pos','b_neg','b_q'],['b_neg','b_q']]},
 {t:'be동사 · 과거 was / were',ex:'He was tired yesterday.',blk:[['b_pos','b_ppos','b_pneg'],['b_ppos','b_pq']]},
 {t:'일반동사 · I / you / we / they',ex:'I play soccer. / They eat apples.',blk:[['z_i']]},
 {t:'일반동사 · he / she 는 -s',ex:'I play soccer. / He plays soccer.',blk:[['z_he'],['z_i','z_he'],['z_he','z_i']]},
 {t:'be 문장 · do 문장 구분',ex:'He is hungry. / He eats bread.',blk:[['z_bpos','z_vpos'],['z_vpos','z_bpos'],['z_i','z_he']]},
 {t:"일반동사 · don't / doesn't · Do / Does ~?",ex:"He doesn't play soccer. / Does he play soccer?",blk:[['v_pos','v_neg','v_q'],['v_neg','v_q'],['z_ineg','z_heneg'],['z_heq','z_iq'],['z_bneg','z_vneg'],['z_vq','z_bq']]},
 {t:'일반동사 · 과거 -ed · 불규칙 · did',ex:"He played soccer. / He didn't play. / Did he play?",blk:[['v_pos','v_ppos','v_pneg'],['v_ppos','v_pq'],['z_bpast','z_vpast'],['z_vpneg','z_bpneg']]},
 {t:'be · do 섞기 총정리',ex:"He isn't hungry. / He doesn't eat bread. / Was he tired? / Did he sleep?",blk:[['z_bpos','z_vpos'],['z_vneg','z_bneg'],['z_bq','z_vq'],['z_vpast','z_bpast'],['z_bpneg','z_vpneg'],['z_he','z_ineg'],['z_sg','z_pl'],['z_an','z_a'],['b_q','v_q'],['b_neg','v_neg']]},
 {t:'의문사 · what / where / when / who / why',ex:'What does he eat? / Where did he go?',blk:[['v_pos','v_what'],['v_ppos','v_where'],['v_pos','v_when'],['v_ppos','v_who'],['b_pos','b_why']]},
 {t:'전치사 · 어디에 (in / on / under …)',ex:'The cat is under the table.',blk:[['p_pos','p_q'],['p_pos','p_neg'],['p_ppos','p_where']]},
 {t:'전치사 · 때와 방향 (at / on / in / from)',ex:'I get up at seven. / We swim on Sundays.',blk:[['t_at'],['t_on'],['t_in'],['t_bday','t_bdayq'],['t_from']]},
 {t:'지금 하고 있어 · be + -ing',ex:'He is reading a book now.',blk:[['v_pos','v_prog','v_progneg'],['v_prog','v_progq','v_whatdoing']]},
 {t:'하고 있었어 · was + -ing',ex:'I was watching TV when you called.',blk:[['v_prog','v_pprog'],['v_pprogneg','v_pprogq']]},
 {t:'미래 · will',ex:"I will visit Busan. / I won't …",blk:[['v_pos','v_fut','v_futneg'],['v_fut','v_futq']]},
 {t:'미래 · be going to',ex:"I'm going to play soccer tomorrow.",blk:[['v_fut','v_gon'],['v_gonneg','v_gonq']]},
 {t:"할 수 있어 · can / can't",ex:'He can swim. / Can you swim?',blk:[['v_can','v_cant'],['v_can','v_canq']]},
 {t:'해야 해 · have to / should',ex:"You have to do your homework. / You should eat vegetables.",blk:[['v_hto','v_dhto'],['v_htoq'],['v_hto','v_sh']]},
 {t:'수량 · some / any / many / much / a few',ex:"I don't have any eggs. / There isn't much milk.",blk:[['q_some','q_any','q_anyq'],['q_many','q_manyq'],['q_much','q_few']]},
 {t:'재귀대명사 · myself / himself …',ex:'She made the cake by herself.',blk:[['r_by','r_byq'],['r_can'],['r_enjoy'],['r_self']]},
 {t:'비교급 · -er than / more ~ than',ex:'Elephants are bigger than horses.',blk:[['c_pos','c_q'],['c_neg']]},
 {t:'최상급 · the -est / the most',ex:'My dad is the tallest in my family.',blk:[['s_pos','s_who'],['s_pos'],['s_fact']]},
 {t:'to부정사 · want to / decide to / to + 목적',ex:'I went to the store to buy milk.',blk:[['i_want','i_wantneg','i_wantq'],['i_decide'],['i_plan'],['i_hope'],['i_try'],['i_need'],['i_promise'],['i_purpose'],['i_purpose']]},
 {t:'동명사 · -ing (좋아해 · 잘해 · ~하는 것은)',ex:'Reading books is fun.',blk:[['g_like'],['g_enjoy'],['g_goodat','g_notgood'],['g_subj'],['g_howabout'],['g_thanks'],['g_finish'],['g_stop']]},
 {t:'감정 · -ing / -ed (exciting / excited)',ex:'The movie was boring. / I was bored.',blk:[['e_thing','e_person'],['e_thingq','e_personq'],['e_inter']]},
 {t:'접속사 · so / because / but / and',ex:'I was hungry, so I ate some bread.',blk:[['j_so','j_because'],['j_but'],['j_and']]},
 {t:'if · when',ex:'If it rains, we will stay home.',blk:[['k_if','k_ifneg'],['k_ifq'],['k_when'],['k_whenhab']]},
 {t:'수동태 · was made by',ex:'The cake was made by my mom.',blk:[['x_pos','x_q'],['x_neg'],['x_pos'],['x_fact']]},
 {t:'현재완료 · have been / have ever / for',ex:'Have you ever ridden a horse?',blk:[['h_pos','h_q'],['h_never'],['h_for']]},
 {t:'관계사 · who / that',ex:'I have a friend who plays the piano.',blk:[['l_who'],['l_that'],['l_prog']]}
];
// 꼴 → 단계 번호
const F2S={};STAGES.forEach((st,i)=>st.blk.forEach(b=>b.forEach(f=>{if(F2S[f]==null){let own=true;for(let j=0;j<i;j++)if(STAGES[j].blk.some(bb=>bb.includes(f)))own=false;if(own)F2S[f]=i+1}})));
// 문장 하나 만들기
const CACHE=new Map();
function make(id){if(CACHE.has(id))return CACHE.get(id);const [lap,f,seed,ctx]=String(id).split('.');const L=Math.max(1,Math.min(3,+lap||1));const fam=FAM[f[0]];if(!fam)return null;
  const r=rng(+seed);let it;try{const k=fam[0](r,L,ctx||f);it=fam[1](k,f)}catch(e){return null}
  it=Object.assign({id:String(id),stage:F2S[f]||0,lap:L,f},it);it.alt=it.alt||[];it.w=(it.w||[]).filter((c,i,a)=>c&&c[0]&&c[1]&&a.findIndex(x=>x[0]===c[0])===i);
  if(CACHE.size>3000)CACHE.clear();CACHE.set(id,it);return it}
// 한 묶음: 같은 씨앗으로 묶음의 꼴들
function block(stage,lap,seed,bi){const st=STAGES[stage-1];const B=st.blk[bi==null?seed%st.blk.length:bi];const ctx=B[B.length-1];return B.map(f=>make([lap,f,seed,ctx].join('.'))).filter(Boolean)}
// 짝 묶음 하나(꼴 목록을 직접): 하루 짝 연습용
function blockOf(forms,lap,seed){const ctx=forms[forms.length-1];return forms.map(f=>make([lap,f,seed,ctx].join('.'))).filter(Boolean)}
window.TALK={STAGES,make,block,blockOf,zBlocks,F2S,rng};
})();
