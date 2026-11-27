/* ⚡ 스피드 영어 · 문장 만들기 ② 단계별 문장 틀 (엄마 11/27 「문법 단계에 따라 고급 말하기까지」)
   문장 번호 = 바퀴.꼴.씨앗.묶음꼴  예) 1.v_neg.123456.v_q
   같은 씨앗이면 같은 뼈대(주어·동사·목적어)라서, 한 묶음 안에서 「He plays → He doesn't play → Does he play?」처럼 꼴만 바뀌어요.
   바퀴(lap) 1 = 초등 낱말, 2 = 중등까지, 3 = 수능까지. */
(function(){
'use strict';
const C=window.TALKCORE,{josa,KO,COP,EN,AN,SUBJ,PEOPLE,VP,ADJ,PLACE,JOB,TIME}=C;
// 가족 낱말 막기(엄마 11/28 「우리 아빠 · 우리 형 그런 거 빼」): 시훈이 가족 이야기를 지어내지 않게
const FAM_EN=/\b(my|your|our|his|her|their)\s+(mom|dad|mother|father|grandma|grandpa|grandmother|grandfather|grandparents|parents|brothers?|sisters?|uncle|aunt|cousins?|family)\b|\b(Mom|Dad|Grandma|Grandpa|family|families|parents|brothers?|sisters?|cousins?|uncle|aunt)\b/;
const FAM_KO=/(엄마|아빠|부모님|사촌|가족|삼촌|이모|고모|누나|언니|오빠|동생|형제|(우리|내|너희|네|그의|그녀의) 형)|(우리|내|너희|네) (할머니|할아버지)|(할머니|할아버지)(께|댁|에게|의 )/;
function isFam(it){return FAM_EN.test(it.en)||FAM_KO.test(it.ko)}
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
const POSS=[['my','내'],['your','네'],['his','그의'],['her','그녀의'],["Tom's",'톰의'],["Mina's",'미나의'],["my friend's",'내 친구']];
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
const PB=SUBJ.filter(s=>['the librarian','the bus driver','the old lady','the old man','my friend','the teacher'].includes(s.en));
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
  cute:['the cutest','귀엽다'],quiet:['the quietest','조용하다'],shy:['the shyest','수줍음이 많다'],slow:['the slowest','느리다'],short:['the shortest','키가 작다'],
  brave:['the bravest','용감하다',2],calm:['the calmest','침착하다',2],lazy:['the laziest','게으르다',2],healthy:['the healthiest','건강하다',2],polite:['the most polite','예의가 바르다',2],
  curious:['the most curious','호기심이 많다',2],cheerful:['the most cheerful','쾌활하다',2],active:['the most active','활발하다',2],
  patient:['the most patient','참을성이 많다',3],responsible:['the most responsible','책임감이 강하다',3],talented:['the most talented','재능이 많다',3]};
const SGRP=[['in my family','우리 가족 중에서',['me','adult','old'],['in your family','너희 가족 중에서']],['in our class','우리 반에서',['me','kid','pron'],['in your class','너희 반에서']],['on the team','그 팀에서',['pron','kid'],['on the team','그 팀에서']],['in our school','우리 학교에서',['me','kid','pron'],['in your school','너희 학교에서']],['in the club','그 동아리에서',['pron','kid'],['in the club','그 동아리에서']]];
for(let i=SGRP.length-1;i>=0;i--)if(/family/.test(SGRP[i][0]))SGRP.splice(i,1);
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
  ['I have time','시간이 있다',[['help you','너를 돕다'],['visit my friend','친구 집에 가다'],['read a book','책을 읽다']],[['watch TV','TV를 보다']],2,'I'],
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
  case 'k_when':{const wc=k.wc;let M=Object.assign({},k.ms);if(M.s.en===wc[2]||(wc[2]==='me'&&M.s.t==='me')||(wc[2]==='you'&&M.s.t==='you')||(wc[2]==='we'&&M.s.en==='we'))M.s=SUBJ.find(x=>x.en==='the bus driver');
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
const RPRED=[['my friend','내 친구'],['my teammate','우리 팀 친구'],['my classmate','우리 반 친구',2],['a famous singer','유명한 가수',2],['my neighbor','우리 이웃',2]];
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
// ───────── 초등 빈칸 8단계(엄마 11/27 「이대로」): this·There is·대명사·명령문·How·빈도부사·비인칭 it·감탄문 ─────────
// 물건·동물·먹을 것: [하나, 여럿, 한국어, 세는 말, 종류(o 물건 · a 동물 · f 먹을 것), 단계, 표시(B 큰 것 · xn There 문장 빼기)]
const NT=[['bag','bags','가방','개','o'],['book','books','책','권','o'],['pencil','pencils','연필','자루','o'],['ball','balls','공','개','o'],['cup','cups','컵','개','o'],
 ['hat','hats','모자','개','o'],['box','boxes','상자','개','o'],['chair','chairs','의자','개','o',1,'B'],['desk','desks','책상','개','o',1,'B'],['umbrella','umbrellas','우산','개','o'],
 ['eraser','erasers','지우개','개','o'],['watch','watches','시계','개','o'],['toy','toys','장난감','개','o'],['doll','dolls','인형','개','o'],['key','keys','열쇠','개','o'],
 ['picture','pictures','그림','장','o'],['bike','bikes','자전거','대','o',1,'B'],['dish','dishes','접시','개','o'],['notebook','notebooks','공책','권','o'],['flower','flowers','꽃','송이','l'],
 ['dog','dogs','개','마리','a'],['cat','cats','고양이','마리','a'],['puppy','puppies','강아지','마리','a'],['rabbit','rabbits','토끼','마리','a'],['bird','birds','새','마리','a'],
 ['apple','apples','사과','개','f'],['orange','oranges','오렌지','개','f'],['egg','eggs','달걀','개','f'],['cookie','cookies','쿠키','개','f'],['banana','bananas','바나나','개','f'],
 ['sandwich','sandwiches','샌드위치','개','f'],['tomato','tomatoes','토마토','개','f',2],['potato','potatoes','감자','개','f',2],['knife','knives','칼','자루','o',2],
 ['fish','fish','물고기','마리','a',2,'xn'],['mouse','mice','쥐','마리','a',2],['sheep','sheep','양','마리','a',2,'B'],['leaf','leaves','나뭇잎','장','l',2],['glass','glasses','유리잔','개','o',2],
 ['brush','brushes','붓','자루','o',2],['strawberry','strawberries','딸기','개','f',2],['candle','candles','양초','개','o',3],['ladder','ladders','사다리','개','o',3,'B'],['bench','benches','벤치','개','o',3,'B']
].map(([en,pl,ko,cn,c,lv,f])=>({en,pl,ko,cn,c,lv:lv||1,f:f||''}));
// 물건을 꾸미는 말: [영어, 한국어 기본형, 어울리는 종류, 단계]
const TA=[['big','크다','oafl'],['small','작다','oafl'],['heavy','무겁다','o'],['light','가볍다','o'],['pretty','예쁘다','oal'],['cute','귀엽다','a'],['expensive','비싸다','o'],
 ['cheap','싸다','o'],['clean','깨끗하다','o'],['dirty','더럽다','oa'],['delicious','맛있다','f'],['fast','빠르다','a'],['sweet','달다','f'],['fresh','신선하다','f',2],['soft','부드럽다','oa',2],
 ['old','오래되다','o',3]].map(([en,ko,c,lv])=>({en,ko,c,lv:lv||1}));
const taFor=(n,lap)=>TA.filter(x=>x.lv<=lap&&x.c.includes(n.c)&&!(x.en==='old')&&(!x.only||x.only.includes(n.en)));
const kN=(n,pl)=>pl?n.ko+'들':n.ko;
const nChip=n=>chip(n.ko,n.en);
const PD=[[null,null],['my','내'],['your','네'],['his','그의'],['her','그녀의']];
// ① this · that · these · those
function dSkel(r,lap){for(let g=0;g<200;g++){const n=lvPick(r,NT,lap);const as=taFor(n,lap);if(!as.length)continue;return {n,a:pick(r,as),p:pick(r,PD),q:pick(r,PD.slice(2)),far:r()<.5}}throw new Error('no d')}
function dForm(k,f){const {n,a}=k;const far=/that|those/.test(f)||(/^d_q/.test(f)&&k.far);const pl=/these|those|pl$/.test(f);
  const dE=far?(pl?'those':'that'):(pl?'these':'this'),dK=far?(pl?'저것들':'저거'):(pl?'이것들':'이거'),dT=far?(pl?'저것들은':'저건'):(pl?'이것들은':'이건'),dM=far?'저':'이';
  const nE=pl?n.pl:n.en,P=k.p,pre=P[0]?P[0]:pl?'':AN(n.en),pk=P[1]?P[1]+' ':'';let en,ko;
  switch(f){
  case 'd_this':case 'd_that':case 'd_these':case 'd_those':en=SEN([dE,pl?'are':'is',pre,nE]);ko=KSEN([dT,COP.pos(pk+kN(n,pl))]);break;
  case 'd_thisa':case 'd_thata':case 'd_thesea':case 'd_thosea':en=SEN([dE,nE,pl?'are':'is',a.en]);ko=KSEN([dM,josa(kN(n,pl),'은/는'),KO.A(a.ko)]);break;
  case 'd_q':case 'd_qpl':en=SEN([pl?'are':'is',dE,k.q[0],nE],1);ko=KSEN([dK,COP.pos(k.q[1]+' '+kN(n,pl))],1);break}
  const w=[nChip(n)];if(/a$/.test(f))w.push(chip(a.ko,a.en));return {en,ko,w}}
// ② There is · There are
const KNUM=['','한','두','세','네','다섯'];
function nSkel(r,lap){for(let g=0;g<300;g++){const n=lvPick(r,NT.filter(x=>!/xn/.test(x.f)),lap);const l=lvPick(r,LOC.filter(x=>(n.c!=='a'||x.ani)&&!(x.bag&&n.en==='bag')&&x.en!=='the '+n.en),lap);if(!l)continue;
  let ps=l.ps;if(/B/.test(n.f))ps=ps.filter(p=>/next|behind|front/.test(p));if(!ps.length)continue;return {n,l,p:PREP[pick(r,ps)],m:2+Math.floor(r()*4)}}throw new Error('no n')}
function nForm(k,f){const {n,l,p,m}=k;const where=[p[0],l.en],kw=l.ko+' '+p[1];const many=n.ko+' '+KNUM[m]+' '+n.cn;let en,ko;
  switch(f){
  case 'n_is':en=SEN(['there is',AN(n.en),n.en,...where]);ko=KSEN([kw,josa(n.ko,'이/가'),'있어']);break;
  case 'n_are':en=SEN(['there are',NUMW[m],n.pl,...where]);ko=KSEN([kw,josa(many,'이/가'),'있어']);break;
  case 'n_neg':en=SEN(["there isn't",AN(n.en),n.en,...where]);ko=KSEN([kw,josa(n.ko,'이/가'),'없어']);break;
  case 'n_q':en=SEN(['is there',AN(n.en),n.en,...where],1);ko=KSEN([kw,josa(n.ko,'이/가'),'있어'],1);break;
  case 'n_qpl':en=SEN(['are there',NUMW[m],n.pl,...where],1);ko=KSEN([kw,josa(many,'이/가'),'있어'],1);break}
  return {en,ko,w:[nChip(n),chip(l.ko,bare(l.en)),chip(p[1],p[0])]}}
// ③ 대명사 · me him · my · mine
const PRN=[{en:'I',ob:'me',ko:'나',po:'my',pk:'내',mi:'mine',mk:'내 거',g:1},{en:'you',ob:'you',ko:'너',po:'your',pk:'네',mi:'yours',mk:'네 거',g:2},
 {en:'he',ob:'him',ko:'그',po:'his',pk:'그의',mi:'his',mk:'그의 거',s:1,g:3},{en:'she',ob:'her',ko:'그녀',po:'her',pk:'그녀의',mi:'hers',mk:'그녀의 거',s:1,g:4},
 {en:'we',ob:'us',ko:'우리',po:'our',pk:'우리',mi:'ours',mk:'우리 거',g:1},{en:'they',ob:'them',ko:'그들',po:'their',pk:'그들의',mi:'theirs',mk:'그들의 거',g:5}];
// [영어 동사, 한국어 기본형, 조사(을 · 에게 · 와)]
const PV=[['like','좋아하다','을'],['love','사랑하다','을'],['help','돕다','을'],['know','알다','을'],['call','전화하다','에게'],['wait for','기다리다','을'],['teach','가르치다','을'],
 ['play with','같이 놀다','와'],['visit','찾아가다','을'],['miss','그리워하다','을',2],['trust','믿다','을',2],['understand','이해하다','을',2],['invite','초대하다','을',2],['respect','존경하다','을',3]];
const pjosa=(w,p)=>p==='을'?josa(w,'을/를'):p==='와'?josa(w,'과/와'):w+p;
function oSkel(r,lap){for(let g=0;g<100;g++){const A=pick(r,PRN),B=pick(r,PRN);if(A.g===B.g)continue;const v=pick(r,PV.filter(x=>(x[3]||1)<=lap));
  const n=lvPick(r,NT,lap);const as=taFor(n,lap);if(!as.length)continue;return {A,B,v,n,a:pick(r,as),P:pick(r,PRN),far:r()<.3}}throw new Error('no o')}
function oSent(S,O,v){return {en:SEN([S.en,S.s?EN.s3(v[0]):v[0],O.ob]),ko:KSEN([josa(S.ko,'은/는'),pjosa(O.ko,v[2]),KO.A(v[1])])}}
function oForm(k,f){const {n,P}=k;let x;const dE=k.far?'that':'this',dK=k.far?'저':'이';
  switch(f){
  case 'o_obj':x=oSent(k.A,k.B,k.v);x.w=[chip(k.v[1],k.v[0])];break;
  case 'o_swap':x=oSent(k.B,k.A,k.v);x.w=[chip(k.v[1],k.v[0])];break;
  case 'o_this':x={en:SEN([dE,'is',P.po,n.en]),ko:KSEN([dK==='이'?'이건':'저건',COP.pos(P.pk+' '+n.ko)])};x.w=[nChip(n)];break;
  case 'o_mine':x={en:SEN([dE,n.en,'is',P.mi]),ko:KSEN([dK,josa(n.ko,'은/는'),P.mk+'야'])};x.w=[nChip(n)];break;
  case 'o_pos':x={en:SEN([P.po,n.en,'is',k.a.en]),ko:KSEN([josa(P.pk+' '+n.ko,'은/는'),KO.A(k.a.ko)])};x.w=[nChip(n),chip(k.a.ko,k.a.en)];break}
  return x}
// ④ 명령문 · Don't · Let's  [영어, 한국어 기본형, d 해 · n 하지 마 · l 하자, 단계]
const IMP=[['close the door','문을 닫다','dn'],['open the window','창문을 열다','dnl'],['wash your hands','손을 씻다','dl'],['brush your teeth','이를 닦다','dl'],['sit down','앉다','dl'],
 ['stand up','일어서다','dl'],['be quiet','조용히 하다','dl'],['be careful','조심하다','dl'],['clean your room','방을 청소하다','d'],['look at the board','칠판을 보다','d'],
 ['come here','이리 오다','d'],['go to bed','자러 가다','dl'],['take an umbrella','우산을 챙기다','dl'],['help your friends','친구들을 돕다','dl'],['eat your vegetables','채소를 먹다','dl'],
 ['run in the hallway','복도에서 뛰다','n'],['be late','늦다','n'],['be sad','슬퍼하다','n'],['cry','울다','n'],['shout','소리를 지르다','n'],['fight','싸우다','n'],
 ['forget your homework','숙제를 잊어버리다','n'],['eat too much candy','사탕을 너무 많이 먹다','n'],['touch the stove','가스레인지를 만지다','n',2],['talk in class','수업 시간에 떠들다','n'],
 ['play soccer','축구를 하다','l'],['go home','집에 가다','l'],['go to the park','공원에 가다','l'],['eat lunch','점심을 먹다','l'],['take a break','쉬다','l'],
 ['sing together','같이 노래하다','l'],['draw a picture','그림을 그리다','l'],['make a cake','케이크를 만들다','l'],['watch a movie','영화를 보다','l'],['ride our bikes','자전거를 타다','l'],
 ['read a book','책을 읽다','l'],['study English','영어를 공부하다','l'],['be friends','친구가 되다','l',2],['clean up together','같이 치우다','l'],['be honest','정직하다','d',2],
 ['put on your coat','외투를 입다','dl'],['take off your shoes','신발을 벗다','dl'],['line up','줄을 서다','dl'],['raise your hand','손을 들다','dl'],['open your books','책을 펴다','dl'],
 ['close your eyes','눈을 감다','dl'],['listen carefully','잘 듣다','dl'],['speak slowly','천천히 말하다','dl'],['drink some water','물을 좀 마시다','dl'],['say thank you','고맙다고 말하다','dl'],
 ['hold my hand','내 손을 잡다','d'],['look at me','나를 보다','d'],['follow me','나를 따라오다','d'],['wait for me','나를 기다리다','dn'],['turn on the TV','TV를 켜다','dnl'],
 ['feed the cat','고양이에게 밥을 주다','dl'],['water the plants','화분에 물을 주다','dl',2],['put away your toys','장난감을 치우다','dl'],['wake up','일어나다','d'],['hurry up','서두르다','dl'],
 ['use a pencil','연필을 쓰다','d'],['write your name','이름을 쓰다','d'],['share your snacks','간식을 나눠 먹다','dl'],['say sorry','미안하다고 말하다','dl'],['wear a helmet','헬멧을 쓰다','dl',2],
 ['run inside','안에서 뛰다','n'],['eat in the library','도서관에서 먹다','n'],['play with fire','불장난을 하다','n'],['cross the street alone','혼자 길을 건너다','n'],['pick the flowers','꽃을 꺾다','n'],
 ['make a noise','시끄럽게 하다','n'],['push your friends','친구를 밀다','n'],['be rude','무례하게 굴다','n',2],['give up','포기하다','nl'],['worry','걱정하다','n'],['be shy','부끄러워하다','n'],
 ['feed the ducks','오리에게 먹이를 주다','n',2],['go outside','밖에 나가다','nl'],['stay up late','늦게까지 안 자다','n',2],['jump on the bed','침대에서 뛰다','n'],
 ['play hide-and-seek','숨바꼭질을 하다','l'],['go to the beach','해변에 가다','l'],['have a picnic','소풍을 가다','l'],['build a sandcastle','모래성을 쌓다','l'],['fly a kite','연을 날리다','l'],
 ['bake some cookies','쿠키를 굽다','l'],['play a game','게임을 하다','l'],['go swimming','수영하러 가다','l'],['take a picture','사진을 찍다','l'],['plant a tree','나무를 심다','l',2],
 ['meet at the park','공원에서 만나다','l'],['start now','지금 시작하다','l'],['walk to school','학교에 걸어가다','l'],['ask the teacher','선생님께 여쭤보다','l'],['try again','다시 해 보다','dl'],
 ['turn off the light','불을 끄다','dl',2],['wait here','여기서 기다리다','dl'],['be afraid','무서워하다','n'],['waste water','물을 낭비하다','n',2],['tell a lie','거짓말을 하다','n']
].map(([en,ko,m,lv])=>({en,ko,m,lv:lv||1}));
function mSkel(r,lap){const L=x=>IMP.filter(i=>i.lv<=lap&&i.m.includes(x));return {d:pick(r,L('d')),n:pick(r,L('n')),l:pick(r,L('l'))}}
function mForm(k,f){let en,ko,i;
  switch(f){
  case 'm_do':i=k.d;en=SEN([i.en]);ko=KSEN([i.en==='be honest'?'정직하게 행동해':KO.A(i.ko)]);break;
  case 'm_dont':i=k.n;en=SEN(["don't",i.en]);ko=KSEN([KO.S(i.ko)+'지 마']);break;
  case 'm_lets':i=k.l;en=SEN(["let's",i.en.replace(/\byour\b/,'our')]);ko=KSEN([KO.S(i.ko)+'자']);break}
  return {en,ko,w:[chip(i.ko,f==='m_lets'?i.en.replace(/\byour\b/,'our'):i.en)]}}
// ⑤ How · Whose
const WOLD=[['you','너','are'],['your mom','너희 엄마'],['your dad','너희 아빠'],['your grandma','너희 할머니'],['your grandpa','너희 할아버지'],['your dog','네 개'],['your cat','네 고양이'],
 ['your cousin','네 사촌'],['the baby','그 아기'],['your teacher','너희 선생님']];
const WANS=[['I','나','am',7,12],['my cousin','내 사촌','is',2,12],['my dog','우리 개','is',1,12],['my cat','우리 고양이','is',1,12],['the baby','그 아기','is',1,2],['my friend','내 친구','is',8,11],['the puppy','그 강아지','is',1,2]];
const KAGE=['','한','두','세','네','다섯','여섯','일곱','여덟','아홉','열','열한','열두'];
const WS=[['you','너'],['he','그',1],['she','그녀',1],['they','그들'],['your friend','네 친구',1],['your mom','너희 엄마',1],['your dad','너희 아빠',1],['your cousin','네 사촌',1]];
const UNC=[['milk','우유'],['water','물'],['juice','주스'],['money','돈'],['time','시간'],['cheese','치즈'],['bread','빵'],['homework','숙제'],['rice','쌀',2],['sugar','설탕',2]];
const WGO=[['school','학교에','kid'],['the park','공원에'],['the library','도서관에'],['work','회사에','adult'],['the zoo','동물원에'],['the hospital','병원에',null,2]];
function wSkel(r,lap){for(let g=0;g<100;g++){const n=lvPick(r,NT,lap),o=lvPick(r,NT.filter(x=>x.c==='o'),lap);const s=pick(r,WS),u=pick(r,UNC.filter(x=>(x[2]||1)<=lap));
  const ans=pick(r,WANS),age=ans[3]+Math.floor(r()*(ans[4]-ans[3]+1));const go=pick(r,WGO.filter(x=>(x[3]||1)<=lap&&!(x[2]==='kid'&&/mom|dad/.test(s[0]))&&!(x[2]==='adult'&&/^(you|your friend|your cousin)$/.test(s[0]))));
  if(!n||!o)continue;return {n,o,s,u,old:pick(r,WOLD),ans,age,go}}throw new Error('no w')}
function wForm(k,f){const {n,o,s,u}=k;let en,ko,w=[];const top=josa(s[1],'은/는');
  switch(f){
  case 'w_old':en=SEN(['how old',k.old[2]||'is',k.old[0]],1);ko=KSEN([josa(k.old[1],'은/는'),'몇 살이야'],1);break;
  case 'w_oldans':{const a=k.ans;en=SEN([a[0],a[2],NUMW[k.age],k.age===1?'year old':'years old']);ko=KSEN([josa(a[1],'은/는'),KAGE[k.age]+' 살이야']);break}
  case 'w_many':en=SEN(['how many',n.pl,s[2]?'does':'do',s[0],'have'],1);ko=KSEN([top,josa(n.ko,'이/가'),'몇',n.cn,'있어'],1);w=[nChip(n)];break;
  case 'w_muchn':en=SEN(['how much',u[0],s[2]?'does':'do',s[0],'have'],1);ko=KSEN([top,josa(u[1],'이/가'),'얼마나 있어'],1);w=[chip(u[1],u[0])];break;
  case 'w_price':en=SEN(['how much is this',o.en],1);ko=KSEN(['이',josa(o.ko,'은/는'),'얼마야'],1);w=[nChip(o)];break;
  case 'w_pricepl':en=SEN(['how much are these',o.pl],1);ko=KSEN(['이',josa(o.ko+'들','은/는'),'얼마야'],1);w=[nChip(o)];break;
  case 'w_whose':en=SEN(['whose',o.en,'is this'],1);ko=KSEN(['이건 누구',COP.pos(o.ko)],1);w=[nChip(o)];break;
  case 'w_whosepl':en=SEN(['whose',o.pl,'are these'],1);ko=KSEN(['이것들은 누구',COP.pos(o.ko+'들')],1);w=[nChip(o)];break;
  case 'w_how':en=SEN(['how',s[2]?'does':'do',s[0],'go to',k.go[0]],1);ko=KSEN([top,k.go[1],'어떻게 가'],1);break}
  return {en,ko,w}}
// ⑥ 빈도부사 · always · usually · often · sometimes · never
const ADV=[['always','항상'],['usually','보통'],['often','자주'],['sometimes','가끔'],['never','절대']];
const FLATE={en:'late',ko:'늦다',f:'fe',i:-1};
function fSkel(r,lap){for(let g=0;g<200;g++){const k=vSkel(r,lap,'v_pos',PEOPLE);if(!k.v.h||(k.o&&/h0/.test(k.o.f))||k.v.nt||k.v.st||k.v.n)continue;
  const ad=lvPick(r,ADJ.filter(a=>/fe|tr/.test(a.f)&&!/\bc\b/.test(a.f)),lap);return {k:Object.assign({},k,{th:0}),adv:pick(r,ADV),adv2:pick(r,ADV),adj:r()<.25?FLATE:ad}}throw new Error('no f')}
const insAfter=(ko,top,w)=>ko.indexOf(top+' ')===0?top+' '+w+' '+ko.slice(top.length+1):w+' '+ko;
function fForm(k,f){let en,ko,w;
  if(f==='f_v'){const K=k.k,s=K.s,A=k.adv,neg=A[0]==='never';const P=vForm(K,'v_pos'),N=neg?vForm(K,'v_neg'):P;
    en=SEN([s.en,A[0],P.en.slice(s.en.length+1).replace(/\.$/,'')]);ko=insAfter(N.ko,s.top,A[1]);w=P.w}
  else{const s=k.k.s,A=k.adv2,neg=A[0]==='never',c=k.adj;const B=bForm({s,ty:'adj',c,fe:c,tp:1,tw:0},neg?'b_neg':'b_pos');
    en=SEN([s.en,s.be,A[0],c.en]);ko=insAfter(B.ko,s.top,A[1]);w=B.w}
  w=(w||[]).concat([chip(f==='f_v'?k.adv[1]:k.adv2[1],f==='f_v'?k.adv[0]:k.adv2[0])]);return {en,ko,w}}
// ⑦ 비인칭 it · 날씨 · 요일 · 시각
const WEA=[['sunny','화창하다'],['rainy','비가 오다'],['cloudy','흐리다'],['windy','바람이 불다'],['snowy','눈이 오다'],['hot','덥다'],['cold','춥다'],['warm','따뜻하다'],['cool','시원하다'],
 ['foggy','안개가 끼다',2],['dark','어둡다'],['humid','습하다',2],['freezing','몹시 춥다',2]];
const WNOW=[['today','오늘은'],['outside','밖은'],['in Busan','부산은'],['in Seoul','서울은'],['this morning','오늘 아침은'],['in Jeju','제주는'],['in London','런던은',2],['in the mountains','산은'],['at the beach','해변은'],['this afternoon','오늘 오후는']],WPAST=[['yesterday','어제는'],['last night','어젯밤은'],['last weekend','지난 주말은']];
function uSkel(r,lap){const w=pick(r,WEA.filter(x=>(x[2]||1)<=lap));return {w,now:w[0]==='dark'?WNOW[1]:pick(r,WNOW),past:pick(r,WPAST),d:pick(r,DAYS),h:1+Math.floor(r()*12)}}
function uForm(k,f){const W=k.w,N=k.now,P=k.past;let en,ko,alt;
  switch(f){
  case 'u_w':en=SEN(["it's",W[0],N[0]]);ko=KSEN([N[1],KO.A(W[1])]);alt=[SEN(['it is',W[0],N[0]])];break;
  case 'u_wp':en=SEN(['it was',W[0],P[0]]);ko=KSEN([P[1],KO.P(W[1])]);break;
  case 'u_wneg':en=SEN(["it isn't",W[0],N[0]]);ko=KSEN([N[1],KO.S(W[1])+'지 않아']);alt=[SEN(["it's not",W[0],N[0]])];break;
  case 'u_wq':en=SEN(['is it',W[0],N[0]],1);ko=KSEN([N[1],KO.A(W[1])],1);break;
  case 'u_day':en=SEN(["it's",k.d[0],'today']);ko=KSEN(['오늘은',COP.pos(k.d[1])]);alt=[SEN(['it is',k.d[0],'today'])];break;
  case 'u_time':en=SEN(["it's",NUMW[k.h],"o'clock"]);ko=KSEN([COP.pos(KAGE[k.h]+' 시')]);alt=[SEN(['it is',NUMW[k.h],"o'clock"]),SEN(["it's",NUMW[k.h]])];break}
  return {en,ko,alt,w:f==='u_day'?[chip(k.d[1],k.d[0])]:f==='u_time'?[]:[chip(W[1],W[0])]}}
// ⑧ 감탄문 · What a ~! · How ~!
const EX=(a,q)=>cap(sp(a))+'!';
function ySkel(r,lap){for(let g=0;g<100;g++){const n=lvPick(r,NT,lap);const as=taFor(n,lap).filter(x=>!/light|cheap/.test(x.en));if(!as.length)continue;return {n,a:pick(r,as)}}throw new Error('no y')}
function yForm(k,f){const {n,a}=k;let en,ko;
  switch(f){
  case 'y_what':en=EX(['what',AN(a.en),a.en,n.en]);ko='정말 '+KO.N(a.ko)+' '+josa(n.ko,'이구나/구나')+'!';break;
  case 'y_whatpl':en=EX(['what',a.en,n.pl]);ko='정말 '+KO.N(a.ko)+' '+n.ko+'들이구나!';break;
  case 'y_how':en=EX(['how',a.en,'this',n.en,'is']);ko='이 '+josa(n.ko,'은/는')+' 정말 '+KO.S(a.ko)+'구나!';break;
  case 'y_howpl':en=EX(['how',a.en,'these',n.pl,'are']);ko='이 '+josa(n.ko+'들','은/는')+' 정말 '+KO.S(a.ko)+'구나!';break}
  return {en,ko,w:[nChip(n),chip(a.ko,a.en)]}}

// ───────── 중등 15단계(엄마 11/27 66단계 순서 OK) ─────────
const PS=[{en:'I',ko:'나',nom:'내가',ob:'me',oko:'나',be:'am',was:'was',g:1},{en:'you',ko:'너',nom:'네가',ob:'you',oko:'너',be:'are',was:'were',g:2},
 {en:'he',ko:'그',nom:'그가',ob:'him',oko:'그',be:'is',was:'was',s:1,g:3},{en:'she',ko:'그녀',nom:'그녀가',ob:'her',oko:'그녀',be:'is',was:'was',s:1,g:4},
 {en:'we',ko:'우리',nom:'우리가',ob:'us',oko:'우리',be:'are',was:'were',g:1},{en:'they',ko:'그들',nom:'그들이',ob:'them',oko:'그들',be:'are',was:'were',g:5}];
PS.forEach(x=>x.top=josa(x.ko,'은/는'));
const NP=(en,ko,g,pl)=>({en,ko,nom:josa(ko,'이/가'),ob:en,oko:ko,top:josa(ko,'은/는'),be:pl?'are':'is',was:pl?'were':'was',s:pl?0:1,g:g||9});
const ADU=[NP('the librarian','그 사서',6),NP('the bus driver','그 버스 기사',7),NP('the teacher','선생님',8),NP('my coach','코치님',10),NP('my grandma','할머니',11)];
const s3=(S,e)=>S.s?EN.s3(e):e;
const pfx=(en)=>en.replace(/[.?!]$/,'');
const Q=(a)=>KSEN(a,1),D=(a)=>KSEN(a);
// A 부가의문문
const tagS=(lap)=>subjsFor(lap,['you','kid','adult','old','pron'],x=>!!x.pr&&x.t!=='me');
function ASkel(r,lap){for(let g=0;g<200;g++){const s=pick(r,tagS(lap));const c=lvPick(r,ADJ.filter(a=>/fe|tr/.test(a.f)&&!/\bc\b/.test(a.f)),lap);
  let k;try{k=vSkel(r,lap,'v_can',[s.t],undefined)}catch(e){continue}if(k.v.po&&!s.po)continue;if(!vpOk(s,k.v))continue;k=Object.assign({},k,{s,th:0,tp:0});return {s,c,k}}throw new Error('no A')}
function AForm(k,f){const s=k.s,c=k.c,K=k.k,pr=s.pr==='I'?'I':s.pr,w=K.v.k,n=K.v.n,ok=oKo(K),o=oEn(K,s);let en,ko;
  const be=s.be,nbe=be==='is'?"isn't":"aren't",ndo=s.s?"doesn't":"don't",dd=s.s?'does':'do';
  switch(f){
  case 'A_bpos':en=SEN([s.en,be,c.en]).replace(/\.$/,', '+nbe+' '+pr+'?');ko=Q([s.top,KO.S(c.ko)+'지, 그렇지']);break;
  case 'A_bneg':en=SEN([s.en,nbe,c.en]).replace(/\.$/,', '+be+' '+pr+'?');ko=Q([s.top,(c.n?KO.S(c.n)+'지':KO.S(c.ko)+'지 않지')+', 그렇지']);break;
  case 'A_vpos':en=SEN([s.en,s3(s,K.v.e),o]).replace(/\.$/,', '+ndo+' '+pr+'?');ko=Q([s.top,ok,KO.S(w)+'지, 그렇지']);break;
  case 'A_vneg':en=SEN([s.en,ndo,K.v.e,o]).replace(/\.$/,', '+dd+' '+pr+'?');ko=Q([s.top,ok,(n?KO.S(n)+'지':KO.S(w)+'지 않지')+', 그렇지']);break;
  case 'A_vpast':en=SEN([s.en,EN.past(K.v.e),o]).replace(/\.$/,", didn't "+pr+'?');ko=Q([s.top,ok,KO.Pst(w)+'지, 그렇지']);break;
  case 'A_can':en=SEN([s.en,'can',K.v.e,o]).replace(/\.$/,", can't "+pr+'?');ko=Q([s.top,ok,KO.L(w)+' 수 있지, 그렇지']);break}
  return {en,ko,w:/^A_b/.test(f)?[chip(c.ko,c.en)]:vChips(Object.assign({},K,{s}))}}
// B must · may · could · would
const REQ=[['open the window','창문을 열어 줄 수 있어'],['help me','나를 도와줄 수 있어'],['close the door','문을 닫아 줄 수 있어'],['pass me the salt','소금 좀 건네줄 수 있어'],
 ['lend me your pencil','연필 좀 빌려줄 수 있어'],['turn down the music','음악 소리를 줄여 줄 수 있어'],['wait for me','나를 기다려 줄 수 있어'],['carry this box','이 상자를 들어 줄 수 있어'],
 ['say that again','다시 말해 줄 수 있어'],['speak more slowly','더 천천히 말해 줄 수 있어'],['take a picture of us','우리 사진을 찍어 줄 수 있어'],['turn on the light','불을 켜 줄 수 있어']];
const MAYI=[['use your pencil','네 연필을 써도 돼'],['go to the bathroom','화장실에 가도 돼'],['come in','들어가도 돼'],['sit here','여기 앉아도 돼'],['open the window','창문을 열어도 돼'],
 ['borrow your book','네 책을 빌려도 돼'],['ask a question','질문해도 돼'],['have some water','물 좀 마셔도 돼'],['play outside','밖에서 놀아도 돼'],['watch TV','TV 봐도 돼'],['try it','해 봐도 돼'],['use your phone','네 휴대폰을 써도 돼']];
const MUSTN=[['run in the hallway','복도에서 뛰다'],['eat in class','수업 시간에 먹다'],['touch the stove','가스레인지를 만지다'],['swim here','여기서 수영하다'],['use phones in class','수업 시간에 휴대폰을 쓰다'],['be late','늦다'],['cross the street alone','혼자 길을 건너다'],['feed the animals','동물들에게 먹이를 주다'],['make noise in the library','도서관에서 떠들다'],['play with fire','불장난을 하다'],['forget the rules','규칙을 잊어버리다']];
const WOULD=[['some juice','주스 좀 마실래'],['some water','물 좀 마실래'],['some milk','우유 좀 마실래'],['some cookies','쿠키 좀 먹을래'],['some cake','케이크 좀 먹을래'],['some tea','차 좀 마실래'],
 ['some bread','빵 좀 먹을래'],['some fruit','과일 좀 먹을래'],['some ice cream','아이스크림 좀 먹을래'],['some pizza','피자 좀 먹을래'],['some soup','수프 좀 먹을래']];
function BSkel(r,lap){const k=vSkel(r,lap,'v_hto',PEOPLE);const k2=vSkel(r,lap,'v_fut',PEOPLE);return {k:Object.assign({},k,{th:0}),k2:Object.assign({},k2,{th:0}),rq:pick(r,REQ),ms:pick(r,[PS[1],PS[4],NP('students','학생들',30,1),NP('children','아이들',13,1)]),mn:pick(r,MUSTN),mi:pick(r,MAYI),wo:pick(r,WOULD),t:r()}}
function BForm(k,f){const K=k.k,s=K.s,w=K.v.k,ok=oKo(K),o=oEn(K,s);let en,ko,alt=[];
  switch(f){
  case 'B_must':{const x=vForm(K,'v_hto');en=x.en.replace(/\b(have|has) to\b/,'must');ko=x.ko;break}
  case 'B_mustnt':{const S=k.ms,x=k.mn;en=SEN([S.en,'must not',x[0]]);alt=[en.replace('must not',"mustn't")];ko=D([S.top,KO.M(x[1])+' 안 돼']);return {en,ko,alt,w:[]}}
  case 'B_may':{const K2=k.k2,s2=K2.s,t=k.t<.5&&!K2.v.nt?TIME.fut[Math.floor(k.t*2*TIME.fut.length)]:null;en=SEN([s2.en,'may',K2.v.e,oEn(K2,s2),t&&t[0]]);ko=D([s2.top,t&&t[1],oKo(K2),KO.L(K2.v.k)+'지도 몰라']);
    return {en,ko,alt,w:vChips(K2)}}
  case 'B_could':en=SEN(['could you',k.rq[0]],1);ko=Q([k.rq[1]]);return {en,ko,alt:[en.replace(/^Could/,'Can')],w:[]};
  case 'B_mayI':en=SEN(['may I',k.mi[0]],1);ko=Q([k.mi[1]]);return {en,ko,alt:[],w:[]};
  case 'B_would':en=SEN(['would you like',k.wo[0]],1);ko=Q([k.wo[1]]);return {en,ko,alt:[],w:[]}}
  return {en,ko,alt,w:vChips(K)}}
// C 주다 · 보여 주다 (4형식) [동사, 과거, to/for, [[물건, 한국어 동사구]]]
const GV=[['give','gave','to',[['a book','책을 주다'],['a present','선물을 주다'],['some candy','사탕을 주다'],['a ticket','표를 주다'],['some flowers','꽃을 주다']]],
 ['show','showed','to',[['the map','지도를 보여 주다'],['the picture','그 그림을 보여 주다'],['the photos','사진들을 보여 주다'],['a magic trick','마술을 보여 주다']]],
 ['send','sent','to',[['a letter','편지를 보내다'],['a card','카드를 보내다'],['a message','메시지를 보내다'],['a package','소포를 보내다']]],
 ['tell','told','to',[['a story','이야기를 해 주다'],['the answer','답을 말해 주다'],['a secret','비밀을 말해 주다'],['a funny joke','웃긴 농담을 해 주다']]],
 ['buy','bought','for',[['a cake','케이크를 사 주다'],['a new bag','새 가방을 사 주다'],['some ice cream','아이스크림을 사 주다'],['a book','책을 사 주다']]],
 ['make','made','for',[['a sandwich','샌드위치를 만들어 주다'],['a cake','케이크를 만들어 주다'],['a kite','연을 만들어 주다'],['breakfast','아침을 만들어 주다']]],
 ['teach','taught','to',[['English','영어를 가르쳐 주다'],['math','수학을 가르쳐 주다'],['a new song','새 노래를 가르쳐 주다'],['chess','체스를 가르쳐 주다']]],
 ['lend','lent','to',[['an umbrella','우산을 빌려주다'],['some money','돈을 좀 빌려주다'],['a book','책을 빌려주다'],['an eraser','지우개를 빌려주다']]],
 ['read','read','to',[['a story','이야기를 읽어 주다'],['a book','책을 읽어 주다'],['a letter','편지를 읽어 주다']]],
 ['write','wrote','to',[['a letter','편지를 써 주다'],['a card','카드를 써 주다'],['a note','쪽지를 써 주다']]],
 ['cook','cooked','for',[['dinner','저녁을 요리해 주다'],['some noodles','국수를 요리해 주다'],['pancakes','팬케이크를 요리해 주다']]]];
const IOX=[NP('my friend','내 친구',12),NP('the children','아이들',13,1),NP('my grandma','할머니',11),NP('my mom','엄마',6),NP('the teacher','선생님',8)];
function CSkel(r,lap){for(let g=0;g<100;g++){const S=pick(r,PS.concat(ADU)),O=pick(r,PS.concat(IOX));if(S.g===O.g||(S.g===1&&O.g===1))continue;const V=pick(r,GV);const ob=pick(r,V[3]);return {S,O,V,ob}}throw new Error('no C')}
function CForm(k,f){const {S,O,V,ob}=k;const ko=D([S.top,O.oko+'에게',KO.P(ob[1])]);const en=f==='C_io'?SEN([S.en,V[1],O.ob,ob[0]]):SEN([S.en,V[1],ob[0],V[2],O.ob]);
  return {en,ko,alt:[],w:[chip(ob[1].split(' ').pop(),V[0])]}}
// D make me happy · keep · find · call (5형식)
const MKS=[['the movie','그 영화'],['the song','그 노래'],['the news','그 소식'],['the game','그 경기'],['the story','그 이야기'],['the letter','그 편지'],['his joke','그의 농담'],['the test','그 시험'],['the long walk','오래 걷기']];
const MKA=[['happy','행복하다'],['sad','슬프다'],['angry','화가 나다'],['tired','피곤하다'],['excited','신나다'],['nervous','긴장되다'],['sleepy','졸리다'],['hungry','배고프다']];
const KEEP=[['this coat','이 외투','warm','따뜻하다'],['this fan','이 선풍기','cool','시원하다'],['exercise','운동','healthy','건강하다'],['this blanket','이 담요','warm','따뜻하다'],['music','음악','calm','차분하다'],['water','물','cool','시원하다']];
const FND=[['the book','그 책'],['the movie','그 영화'],['the test','그 시험'],['the game','그 게임'],['the class','그 수업'],['the puzzle','그 퍼즐'],['the question','그 문제']];
const FNA=[['interesting','재미있다'],['boring','지루하다'],['easy','쉽다'],['difficult','어렵다'],['exciting','흥미진진하다']];
const PETN=[['the dog','그 개'],['the cat','그 고양이'],['the puppy','그 강아지'],['the rabbit','그 토끼'],['the hamster','그 햄스터'],['the robot','그 로봇']],NMS=[['Coco','코코'],['Max','맥스'],['Lucy','루시'],['Bori','보리'],['Choco','초코'],['Toby','토비'],['Dubu','두부']];
function DSkel(r,lap){return {m:pick(r,MKS),a:pick(r,MKA),O:pick(r,PS),k:pick(r,KEEP),Ok:pick(r,PS),S:pick(r,PS),fn:pick(r,FND),fa:pick(r,FNA),p:pick(r,PETN),nm:pick(r,NMS),S2:pick(r,PS.filter(x=>x.g!==2))}}
function DForm(k,f){let en,ko;switch(f){
  case 'D_make':en=SEN([k.m[0],'made',k.O.ob,k.a[0]]);ko=D([josa(k.m[1],'은/는'),josa(k.O.oko,'을/를'),KO.S(k.a[1])+'게 했어']);return {en,ko,w:[chip(k.a[1],k.a[0])]};
  case 'D_keep':en=SEN([k.k[0],'keeps',k.Ok.ob,k.k[2]]);ko=D([josa(k.k[1],'은/는'),josa(k.Ok.oko,'을/를'),KO.S(k.k[3])+'게 해 줘']);return {en,ko,w:[chip(k.k[3],k.k[2])]};
  case 'D_find':en=SEN([k.S.en,'found',k.fn[0],k.fa[0]]);ko=D([k.S.top,josa(k.fn[1],'이/가'),k.fa[1]+'고 생각했어']);return {en,ko,w:[chip(k.fa[1],k.fa[0])]};
  case 'D_call':{const S=k.S2,p=k.p;en=SEN([S.en,s3(S,'call'),p[0],k.nm[0]]);ko=D([S.top,josa(p[1],'을/를'),josa(k.nm[1],'이라고/라고'),'불러']);return {en,ko,w:[chip('부르다','call')]}}}}
// E want · tell · ask + 사람 + to
const ACT=[['clean the room','방을 청소하다'],['do the dishes','설거지를 하다'],['come early','일찍 오다'],['be quiet','조용히 하다'],['wait here','여기서 기다리다'],['close the window','창문을 닫다'],
 ['read this book','이 책을 읽다'],['wear a coat','외투를 입다'],['go to bed early','일찍 자다'],['practice the piano','피아노를 연습하다'],['finish the homework','숙제를 끝내다'],['bring an umbrella','우산을 가져오다'],
 ['be careful','조심하다'],['turn off the TV','TV를 끄다'],['eat more vegetables','채소를 더 먹다'],['tidy up the toys','장난감을 정리하다']];
function ESkel(r,lap){for(let g=0;g<100;g++){const S=pick(r,[PS[0],PS[2],PS[3]].concat(ADU)),O=pick(r,PS);if(S.g===O.g||(S.g===1&&O.g===1))continue;return {S,O,a:pick(r,ACT)}}throw new Error('no E')}
function EForm(k,f){const {S,O,a}=k;let en,ko;switch(f){
  case 'E_want':en=SEN([S.en,s3(S,'want'),O.ob,'to',a[0]]);ko=D([S.top,O.nom,KO.S(a[1])+'기를 원해']);break;
  case 'E_tell':en=SEN([S.en,'told',O.ob,'to',a[0]]);ko=D([S.top,O.oko+'에게',KO.RU(a[1]).replace(/러$/,'라고'),'했어']);break;
  case 'E_ask':en=SEN([S.en,'asked',O.ob,'to',a[0]]);ko=D([S.top,O.oko+'에게',KO.A(a[1])+' 달라고 부탁했어']);break}
  return {en,ko,w:[chip(a[1],a[0])]}}
// F 지각·사역동사 see · hear · let · make
const SEEV=[['run','뛰다'],['dance','춤추다'],['swim','수영하다'],['cry','울다'],['fall down','넘어지다'],['cross the street','길을 건너다'],['leave the room','방을 나가다'],['play soccer','축구를 하다'],['ride a bike','자전거를 타다'],['climb the tree','나무에 올라가다']];
const HEARV=[['sing','노래하다'],['cry','울다'],['laugh','웃다'],['play the piano','피아노를 치다'],['shout','소리를 지르다'],['knock on the door','문을 두드리다'],['open the door','문을 열다'],['talk on the phone','전화 통화를 하다']];
const LETV=[['play games','게임을 하다'],['watch TV','TV를 보다'],['go outside','밖에 나가다'],['eat ice cream','아이스크림을 먹다'],['use the computer','컴퓨터를 쓰다'],['stay up late','늦게까지 안 자다'],['go to the party','파티에 가다'],['ride the bike','자전거를 타다']];
const MAKEV=[['clean the room','방을 청소하다'],['do it again','다시 하다'],['say sorry','미안하다고 말하다'],['wait outside','밖에서 기다리다'],['eat vegetables','채소를 먹다'],['write it again','다시 쓰다'],['practice more','더 연습하다'],['go to bed','자러 가다']];
const SEEO=[NP('the boy','그 남자아이',20),NP('the girl','그 여자아이',21),NP('my friend','내 친구',12),NP('the dog','그 개',22),NP('the children','그 아이들',13,1)];
function FSkel(r,lap){for(let g=0;g<100;g++){const S=pick(r,PS),O=pick(r,PS.concat(SEEO));if(S.g===O.g||(S.g===1&&O.g===1))continue;const S2=pick(r,ADU.concat([PS[2],PS[3]])),O2=pick(r,PS.filter(x=>x.g!==S2.g));
  return {S,O,S2,O2,sv:pick(r,SEEV.filter(x=>!(O.en==='the dog'&&!/^(run|swim)$/.test(x[0])))),hv:pick(r,HEARV.filter(x=>!(O.en==='the dog'&&!/^(cry)$/.test(x[0])))),lv:pick(r,LETV),mv:pick(r,MAKEV)}}throw new Error('no F')}
function FForm(k,f){let en,ko,v;switch(f){
  case 'F_see':v=k.sv;en=SEN([k.S.en,'saw',k.O.ob,v[0]]);ko=D([k.S.top,k.O.nom,KO.NE(v[1]),'것을 봤어']);break;
  case 'F_hear':v=k.hv;if(k.O.en==='the dog')v=['bark','짖다'];en=SEN([k.S.en,'heard',k.O.ob,v[0]]);ko=D([k.S.top,k.O.nom,KO.NE(v[1]),'것을 들었어']);break;
  case 'F_let':v=k.lv;en=SEN([k.S2.en,'let',k.O2.ob,v[0]]);ko=D([k.S2.top,k.O2.nom,KO.S(v[1])+'게 해 줬어']);break;
  case 'F_make':v=k.mv;en=SEN([k.S2.en,'made',k.O2.ob,v[0]]);ko=D([k.S2.top,k.O2.nom,KO.S(v[1])+'게 했어']);break}
  return {en,ko,w:[chip(v[1],v[0])]}}
// G too ~ to · enough to · how to · what to
const TOO=[['tired','피곤하다','walk any more','더 걷다'],['full','배가 부르다','eat any more','더 먹다'],['sleepy','졸리다','study','공부하다'],['busy','바쁘다','play with you','너랑 놀다'],
 ['young','어리다','drive a car','운전하다'],['short','키가 작다','reach the shelf','선반에 손이 닿다'],['sick','아프다','go to school','학교에 가다'],['scared','무섭다','go in','들어가다'],
 ['weak','힘이 약하다','lift the box','상자를 들다'],['nervous','긴장되다','speak','말하다'],['hot','덥다','run outside','밖에서 뛰다','it'],['cold','춥다','swim','수영하다','it'],['late','늦다','go out','나가다','it']];
const ENG=[['tall','키가 크다','reach the shelf','선반에 손이 닿다'],['strong','힘이 세다','carry the box','상자를 들다'],['fast','빠르다','win the race','경주에서 이기다'],['brave','용감하다','go alone','혼자 가다'],
 ['smart','똑똑하다','solve the puzzle','퍼즐을 풀다'],['big','크다','ride a bike','자전거를 타다'],['warm','따뜻하다','go outside','밖에 나가다','it']];
const HOWTO=[['swim','수영하다'],['ride a bike','자전거를 타다'],['make kimchi','김치를 만들다'],['play chess','체스를 두다'],['use this machine','이 기계를 쓰다'],['cook ramen','라면을 끓이다'],
 ['tie shoelaces','신발 끈을 묶다'],['solve this problem','이 문제를 풀다'],['fix a bike','자전거를 고치다'],['bake bread','빵을 굽다'],['skate','스케이트를 타다'],['speak Chinese','중국어를 하다']];
const WTO=[['what to do','뭘 해야 할지'],['what to eat','뭘 먹어야 할지'],['what to wear','뭘 입어야 할지'],['what to say','뭐라고 말해야 할지'],['where to go','어디에 가야 할지'],['when to start','언제 시작해야 할지'],['what to buy','뭘 사야 할지'],['which one to choose','어떤 걸 골라야 할지']];
function GSkel(r,lap){return {S:pick(r,PS),S2:pick(r,PS),t:pick(r,TOO),e:pick(r,ENG),h:pick(r,HOWTO),w:pick(r,WTO),q:r()}}
function GForm(k,f){let en,ko,x;switch(f){
  case 'G_too':x=k.t;if(x[4]){en=SEN(['it is too',x[0],'to',x[2]]);ko=D(['너무',KO.A(x[1])+'서',KO.L(x[3])+' 수 없어'])}else{const S=k.S;en=SEN([S.en,S.be,'too',x[0],'to',x[2]]);ko=D([S.top,'너무',KO.A(x[1])+'서',KO.L(x[3])+' 수 없어'])}return {en,ko,w:[chip(x[1],x[0])]};
  case 'G_enough':x=k.e;if(x[4]){en=SEN(['it is',x[0],'enough to',x[2]]);ko=D([KO.L(x[3])+' 만큼',KO.A(x[1])])}else{const S=k.S;en=SEN([S.en,S.be,x[0],'enough to',x[2]]);ko=D([S.top,KO.L(x[3])+' 만큼',KO.A(x[1])])}return {en,ko,w:[chip(x[1],x[0])]};
  case 'G_howto':x=k.h;{const S=k.S2;if(k.q<.35){en=SEN([S.s?'does':'do',S.en,'know how to',x[0]],1);ko=Q([S.top,KO.NE(x[1]),'법을 알아'])}else{en=SEN([S.en,s3(S,'know'),'how to',x[0]]);ko=D([S.top,KO.NE(x[1]),'법을 알아'])}}return {en,ko,w:[chip(x[1],x[0])]};
  case 'G_what':x=k.w;{const S=k.S2;en=SEN([S.en,S.s?"doesn't":"don't",'know',x[0]]);ko=D([S.top,x[1],S.g===1?'모르겠어':'몰라'])}return {en,ko,w:[]}}}
// H 가주어 it
const ITA=[['fun','재미있다'],['hard','어렵다'],['easy','쉽다'],['important','중요하다'],['dangerous','위험하다'],['interesting','재미있다'],['good for your health','건강에 좋다'],['exciting','신나다']];
const ITV=[['swim in the sea','바다에서 수영하다','fun dangerous exciting'],['ride a bike','자전거를 타다','fun easy good'],['learn English','영어를 배우다','fun important hard interesting'],
 ['brush your teeth','이를 닦다','important'],['wake up early','일찍 일어나다','hard important'],['make friends','친구를 사귀다','easy hard important fun'],['cross the street alone','혼자 길을 건너다','dangerous'],
 ['read books','책을 읽다','fun important interesting'],['play with fire','불장난을 하다','dangerous'],['eat vegetables','채소를 먹다','important good'],['solve this puzzle','이 퍼즐을 풀다','hard easy fun'],
 ['keep a diary','일기를 쓰다','hard important'],['save money','돈을 모으다','important hard'],['climb the mountain','산에 오르다','hard fun exciting'],['walk every day','매일 걷다','good important'],
 ['ride a roller coaster','롤러코스터를 타다','fun exciting'],['learn a new language','새 언어를 배우다','hard interesting fun'],['sleep well','잘 자다','important good']];
function HSkel(r,lap){for(let g=0;g<50;g++){const v=pick(r,ITV),a=pick(r,ITA.filter(x=>v[2].split(' ').includes(x[0].split(' ')[0])));if(a)return {v,a,S:pick(r,PS),q:r()}}throw new Error('no H')}
function HForm(k,f){const v=k.v,a=k.a,ing=EN.ing(v[0].split(' ')[0])+v[0].slice(v[0].split(' ')[0].length);let en,ko;switch(f){
  case 'H_it':en=SEN(['it is',a[0],'to',v[0]]);ko=D([KO.NE(v[1]),'것은',KO.A(a[1])]);break;
  case 'H_ing':en=SEN([ing,'is',a[0]]);ko=D([KO.NE(v[1]),'것은',KO.A(a[1])]);break;
  case 'H_for':en=SEN(['it is',a[0],'for',k.S.ob,'to',v[0]]);ko=D([k.S.oko+'에게는',KO.NE(v[1]),josa('것','이/가'),KO.A(a[1])]);break;
  case 'H_q':en=SEN(['is it',a[0],'to',v[0]],1);ko=Q([KO.NE(v[1]),'것은',KO.A(a[1])]);break}
  return {en,ko,alt:f==='H_it'?[en.replace(/^It is/,"It's")]:[],w:[chip(a[1],a[0])]}}
// I as ~ as · the 비교급, the 비교급
const NMP=[['Tom','톰'],['Mina','미나'],['Jake','제이크'],['Yuna','유나'],['Ben','벤'],['Sora','소라'],['the boy','그 남자아이'],['the girl','그 여자아이']];
const ASA=[['tall','키가 크다'],['fast','빠르다'],['strong','힘이 세다'],['smart','똑똑하다'],['funny','웃기다'],['kind','친절하다'],['busy','바쁘다'],['old','나이가 많다'],['brave','용감하다']];
const THE=[['the more you practice','the better you get','연습을 많이 할수록 더 잘하게 돼'],['the more you read','the more you learn','많이 읽을수록 더 많이 배워'],['the higher you climb','the colder it gets','높이 올라갈수록 더 추워져'],
 ['the more you eat','the fuller you get','많이 먹을수록 더 배불러져'],['the faster you run','the more tired you get','빨리 달릴수록 더 피곤해져'],['the more you smile','the happier you feel','많이 웃을수록 더 행복해져'],
 ['the earlier you go to bed','the earlier you get up','일찍 잘수록 더 일찍 일어나'],['the older he gets','the wiser he becomes','그는 나이가 들수록 더 지혜로워져'],['the more you study','the more you know','공부를 많이 할수록 더 많이 알게 돼'],
 ['the sooner you start','the sooner you finish','빨리 시작할수록 더 빨리 끝나'],['the bigger the box is','the heavier it is','상자가 클수록 더 무거워'],['the more we walk','the healthier we become','많이 걸을수록 우리는 더 건강해져']];
function ISkel(r,lap){for(let g=0;g<50;g++){const A=pick(r,NMP),B=pick(r,NMP);if(A===B)continue;return {A,B,a:pick(r,ASA),t:pick(r,THE)}}throw new Error('no I')}
function IForm(k,f){const {A,B,a}=k;let en,ko;switch(f){
  case 'I_as':en=SEN([A[0],'is as',a[0],'as',B[0]]);ko=D([josa(A[1],'은/는'),B[1]+'만큼',KO.A(a[1])]);return {en,ko,w:[chip(a[1],a[0])]};
  case 'I_notas':en=SEN([A[0],"isn't as",a[0],'as',B[0]]);ko=D([josa(A[1],'은/는'),B[1]+'만큼',KO.S(a[1])+'지 않아']);return {en,ko,alt:[en.replace("isn't",'is not')],w:[chip(a[1],a[0])]};
  case 'I_the':en=cap(k.t[0])+', '+k.t[1]+'.';ko=k.t[2]+'.';return {en,ko,w:[]}}}
// J 분사로 꾸미기
const JING=[['sleeping','baby','자는 아기'],['crying','girl','우는 여자아이'],['running','dog','달리는 개'],['flying','bird','날아가는 새'],['singing','bird','노래하는 새'],['falling','leaves','떨어지는 나뭇잎들',1],
 ['smiling','boy','웃고 있는 남자아이'],['barking','dog','짖는 개'],['dancing','girl','춤추는 여자아이'],['swimming','fish','헤엄치는 물고기들',1],['rising','sun','떠오르는 해'],['shining','stars','빛나는 별들',1]];
const JED=[['broken','window','깨진 창문'],['broken','cup','깨진 컵'],['fallen','leaves','떨어진 나뭇잎들',1],['boiled','eggs','삶은 달걀들',1],['lost','dog','길 잃은 개'],['closed','door','닫힌 문'],
 ['burned','toast','탄 토스트'],['stolen','bike','도둑맞은 자전거'],['painted','wall','색칠한 벽'],['frozen','lake','얼어붙은 호수'],['fried','eggs','달걀 프라이들',1],['baked','potatoes','구운 감자들',1],['torn','paper','찢어진 종이'],['spilled','milk','쏟은 우유']];
const JPOST=[['playing soccer','축구를 하고 있는'],['reading a book','책을 읽고 있는'],['wearing a red cap','빨간 모자를 쓴'],['standing over there','저기 서 있는'],['sitting on the bench','벤치에 앉아 있는'],['talking to the teacher','선생님과 이야기하고 있는'],['wearing glasses','안경을 쓴'],['riding a bike','자전거를 타고 있는'],['holding a balloon','풍선을 들고 있는'],['waiting for the bus','버스를 기다리고 있는'],['eating ice cream','아이스크림을 먹고 있는']];
const JWHO=[['the boy','남자아이'],['the girl','여자아이'],['the man','남자'],['the woman','여자']],JIS=[['my friend','내 친구'],['my cousin','내 사촌'],['my neighbor','우리 이웃'],['my classmate','우리 반 친구']];
const JPP=[['a picture','그림','painted by my friend','내 친구가 그린'],['a book','책','written in English','영어로 쓰인'],['a car','차','made in Korea','한국에서 만든'],['a letter','편지','written by my teacher','우리 선생님이 쓰신'],
 ['a song','노래','sung by children','아이들이 부르는'],['a cake','케이크','made by my friend','내 친구가 만든'],['a toy','장난감','made of wood','나무로 만든'],['a house','집','built 100 years ago','100년 전에 지어진'],['a bag','가방','made of paper','종이로 만든'],['a photo','사진','taken in Jeju','제주에서 찍은'],['a song','노래','written by my teacher','우리 선생님이 쓰신'],['a dish','요리','loved by children','아이들이 좋아하는'],['a bridge','다리','built long ago','오래전에 지어진']];
function JSkel(r,lap){return {S:pick(r,PS),i:pick(r,JING),e:pick(r,JED),p:pick(r,JPOST),wh:pick(r,JWHO),is:pick(r,JIS),pp:pick(r,JPP),q:r()}}
function JForm(k,f){let en,ko;switch(f){
  case 'J_ing':case 'J_ed':{const x=f==='J_ing'?k.i:k.e;const saw=k.q<.5;en=saw?SEN([k.S.en+' saw',x[3]||/milk|toast|paper/.test(x[1])?'':AN(x[0]),x[0],x[1]]):SEN(['look at the',x[0],x[1]]);
    if(saw&&/milk|toast|paper/.test(x[1]))en=SEN([k.S.en+' saw the',x[0],x[1]]);ko=D(saw?[k.S.top,josa(x[2],'을/를'),'봤어']:[josa(x[2],'을/를'),'봐']);return {en,ko,w:[chip(x[2].split(' ').pop().replace(/들$/,''),x[1])]}}
  case 'J_post':en=SEN([k.wh[0],k.p[0],'is',k.is[0]]);ko=D([k.p[1],josa(k.wh[1],'은/는'),COP.pos(k.is[1])]);return {en,ko,w:[]};
  case 'J_pp':en=SEN(['this is',k.pp[0],k.pp[2]]);ko=D(['이건',k.pp[3],COP.pos(k.pp[1])]);return {en,ko,w:[]}}}
// K 관계사 which · whose · what
const WHOSE=[['a friend','친구','dog is very smart','개가 아주 똑똑한'],['a friend','친구','garden is very big','정원이 아주 큰'],['a neighbor','이웃','dog is very big','개가 아주 큰'],
 ['a friend','친구','house is near the park','집이 공원 근처인'],['a classmate','반 친구','hobby is drawing','취미가 그림 그리기인'],['a classmate','반 친구','name is Max','이름이 맥스인'],
 ['a friend','친구','birthday is in May','생일이 5월인'],['a neighbor','이웃','garden is beautiful','정원이 아름다운'],['a teacher','선생님','voice is very soft','목소리가 아주 부드러운'],['a friend','친구','bike is red','자전거가 빨간색인']];
const WHAT=[['want','원하는',1],['need','필요한',1],['like','좋아하는',1],['made','만든'],['bought','산'],['drew','그린'],['found','찾은'],['cooked','요리한']];
function KSkel(r,lap){return {l:lSkel(r,lap),w:pick(r,WHOSE),S:pick(r,PS),wt:pick(r,WHAT),S2:pick(r,PS),know:r()<.5}}
function KForm(k,f){let en,ko;switch(f){
  case 'K_which':{const x=lForm(k.l,'l_that');return {en:x.en.replace(' that ',' which '),ko:x.ko,alt:[x.en],w:x.w}}
  case 'K_whose':{const S=k.S,x=k.w;en=SEN([S.en,S.s?'has':'have',x[0],'whose',x[2]]);ko=D([S.top,x[3],josa(x[1],'이/가'),'있어']);return {en,ko,w:[]}}
  case 'K_what':{const S=k.S2,x=k.wt;const v=x[2]?s3(S,x[0]):x[0];en=SEN(['this is what',S.en,v]);ko=D(['이게',S.nom,x[1],'거야']);return {en,ko,w:[]}}}}
// L 관계부사 where · when · why · how
const LWH=[['park','공원',[['we play soccer','우리가 축구를 하는'],['I met Mina','내가 미나를 만난'],['children like to run','아이들이 뛰어놀기 좋아하는']]],['library','도서관',[['I read books','내가 책을 읽는'],['we study after school','우리가 방과 후에 공부하는']]],
 ['restaurant','식당',[['we had dinner','우리가 저녁을 먹은'],['the nurse works','그 간호사가 일하는']]],['beach','해변',[['we built a sandcastle','우리가 모래성을 쌓은'],['we swam last summer','우리가 지난여름에 수영한']]],
 ['house','집',[['my friend lives','내 친구가 사는'],['I was born','내가 태어난']]],['school','학교',[['my teacher studied','우리 선생님이 공부하신'],['I go every day','내가 매일 가는']]],['town','동네',[['I grew up','내가 자란'],['we live','우리가 사는']]]];
const LWN=[['the day','날',[['we first met','우리가 처음 만난'],['we went to the zoo','우리가 동물원에 간'],['it snowed a lot','눈이 많이 온'],['I learned to swim','내가 수영을 배운']]],['the summer','여름',[['we visited Jeju','우리가 제주에 간'],['I learned to ride a bike','내가 자전거 타는 법을 배운']]],['the time','때',[['we got lost','우리가 길을 잃은'],['he won the race','그가 경주에서 이긴']]]];
const LWY=[['you were late','네가 늦은'],['you are sad','네가 슬픈'],['he left early','그가 일찍 간'],['she was angry','그녀가 화난'],['you like it','네가 그걸 좋아하는'],['they moved','그들이 이사한'],['you chose this book','네가 이 책을 고른']];
const LHW=[['I made the cake','내가 케이크를 만든'],['he solved the problem','그가 문제를 푼'],['we built the sandcastle','우리가 모래성을 쌓은'],['she learned English','그녀가 영어를 배운'],['I fixed my bike','내가 자전거를 고친'],['they won the game','그들이 경기에서 이긴']];
function LSkel(r,lap){const p=pick(r,LWH),n=pick(r,LWN);return {p,pc:pick(r,p[2]),n,nc:pick(r,n[2]),y:pick(r,LWY),h:pick(r,LHW),S:pick(r,[PS[0],PS[2],PS[3],PS[4]])}}
function LForm(k,f){let en,ko,alt=[];switch(f){
  case 'L_where':en=SEN(['this is the',k.p[0],'where',k.pc[0]]);ko=D(['여기가',k.pc[1],COP.pos(k.p[1])]);break;
  case 'L_when':en=SEN([k.S.en,s3(k.S,'remember'),k.n[0],'when',k.nc[0]]);ko=D([k.S.top,k.nc[1],josa(k.n[1],'을/를'),'기억해']);alt=[en.replace(' when ',' ')];break;
  case 'L_why':en=SEN(['tell me the reason why',k.y[0]]);ko=D([k.y[1],'이유를 말해 줘']);alt=[en.replace(' the reason why',' why'),en.replace(' why ',' ')];break;
  case 'L_how':en=SEN(['this is how',k.h[0]]);ko=D(['이게',k.h[1],'방법이야']);alt=[en.replace('how','the way')];break}
  return {en,ko,alt,w:[]}}
// M 간접의문문 · that 절 · whether
const CL=[['where','live','어디에','살다'],['what','like','뭘','좋아하다'],['when','come home','언제 집에','오다'],['why','cry','왜','울다'],['what','want','뭘','원하다'],['where','go after school','방과 후에 어디에','가다'],
 ['how','go to school','학교에 어떻게','가다'],['what time','get up','몇 시에','일어나다'],['what','eat for lunch','점심으로 뭘','먹다'],['who','like','누구를','좋아하다'],['why','laugh','왜','웃다'],['where','work','어디에서','일하다']];
const MV=[['I know','나는','알아'],["I don't know",'나는','몰라'],['I wonder','나는','궁금해'],['do you know','너는','알아',1]];
const WILLV=[['come','오다'],['like it','그걸 좋아하다'],['win','이기다'],['be late','늦다'],['call me','나에게 전화하다'],['join us','우리랑 같이하다'],['pass the test','시험에 합격하다'],['remember me','나를 기억하다']];
function MSkel(r,lap){for(let g=0;g<50;g++){const S=pick(r,PS.filter(x=>x.g!==1&&x.g!==2).concat([NP('my friend','내 친구',12),NP('your teacher','너희 선생님',6)]));const c=pick(r,CL);if(/work/.test(c[1])&&S.g===12)continue;
  return {S,c,m:pick(r,MV),b:lvPick(r,ADJ.filter(a=>/tr/.test(a.f)&&!/\bc\b/.test(a.f)),lap),wv:pick(r,WILLV),S0:pick(r,[PS[0],PS[4]])}}throw new Error('no M')}
function MForm(k,f){const {S,c,m}=k;let en,ko;switch(f){
  case 'M_wh':{const tail=SEN([c[0],S.en,s3(S,c[1])]).replace(/^./,x=>x.toLowerCase()).replace(/\.$/,'');en=m[3]?SEN([m[0],tail],1):SEN([m[0],tail]);ko=(m[3]?Q:D)([m[1],S.nom,c[2],KO.NE(c[3])+'지',m[2]]);return {en,ko,w:[]}}
  case 'M_q':{en=SEN([c[0],S.s?'does':'do',S.en,c[1]],1);ko=Q([S.top,c[2],KO.A(c[3])]);return {en,ko,w:[]}}
  case 'M_that':{const b=k.b;en=SEN([k.S0.en,'think that',S.en,S.be,b.en]);ko=D([k.S0.top,S.nom,(b.ko)+'고 생각해']);return {en,ko,alt:[en.replace(' that ',' ')],w:[chip(b.ko,b.en)]}}
  case 'M_if':{const v=k.wv;en=SEN(["I don't know if",S.en,'will',v[0]]);ko=D(['나는',S.nom,KO.L(v[1])+'지 모르겠어']);return {en,ko,alt:[en.replace(' if ',' whether ')],w:[]}}}}
// N so that · although · both · either · neither · not only
const SOT=[['got up early','일찍 일어났어',[['catch the bus','버스를 타다'],['eat breakfast','아침을 먹다'],['be on time','늦지 않다']]],['studied hard','열심히 공부했어',[['pass the test','시험에 합격하다'],['get a good grade','좋은 점수를 받다']]],
 ['ran fast','빨리 뛰었어',[['catch the bus','버스를 타다'],['win the race','경주에서 이기다']]],['saved money','돈을 모았어',[['buy a new bike','새 자전거를 사다'],['buy a present','선물을 사다']]],
 ['spoke slowly','천천히 말했어',[['everyone could understand','모두가 이해하다',1]]],['wore a coat','외투를 입었어',[['stay warm','따뜻하게 지내다']]],['wrote it down','그걸 적어 두었어',[['remember it','그걸 기억하다']]]];
const ALT=[['it was raining','비가 오고 있었지만','we played soccer','우리는 축구를 했어'],['he was tired','그는 피곤했지만','he finished his homework','숙제를 끝냈어'],['she was sick','그녀는 아팠지만','she went to school','학교에 갔어'],
 ['it was cold','추웠지만','we went swimming','우리는 수영하러 갔어'],['the test was hard','시험은 어려웠지만','I got a good grade','나는 좋은 점수를 받았어'],['he is young','그는 어리지만','he is very wise','아주 지혜로워'],
 ['I was hungry','나는 배가 고팠지만','I didn\'t eat anything','아무것도 먹지 않았어'],['the movie was long','영화는 길었지만','it was interesting','재미있었어'],['we lost the game','우리는 경기에서 졌지만','we had fun','즐거웠어'],
 ['she is small','그녀는 작지만','she is very strong','아주 힘이 세']];
const LIKES=[['pizza','피자를 좋아하다'],['soccer','축구를 좋아하다'],['music','음악을 좋아하다'],['cats','고양이를 좋아하다'],['math','수학을 좋아하다'],['ice cream','아이스크림을 좋아하다']];
const EITH=[['juice','milk','주스','우유','마시다'],['pizza','pasta','피자','파스타','먹다'],['the red one','the blue one','빨간 거','파란 거','고르다'],['a cat','a dog','고양이','개','키우다'],['soccer','baseball','축구','야구','하다']];
function NSkel(r,lap){for(let g=0;g<50;g++){const A=pick(r,NMP),B=pick(r,NMP);if(A===B)continue;const PA=ASA.filter(x=>!/old|busy/.test(x[0]));const a1=pick(r,PA),AS2=[a1,pick(r,PA.filter(x=>x!==a1))];const s=pick(r,SOT);return {A,B,s,sp:pick(r,s[2]),S:pick(r,PS),al:pick(r,ALT),lk:pick(r,LIKES),ei:pick(r,EITH),a1:AS2[0],a2:AS2[1]}}throw new Error('no N')}
function NForm(k,f){const {A,B,S}=k;let en,ko,alt=[];switch(f){
  case 'N_sothat':{const p=k.sp;en=p[2]?SEN([S.en,k.s[0],'so that',p[0]]):SEN([S.en,k.s[0],'so that',S.en,'could',p[0]]);ko=p[2]?D([S.top,'모두가 이해할 수 있게',k.s[1]]):D([S.top,KO.R(p[1]),k.s[1]]);break}
  case 'N_although':en=cap('although '+k.al[0])+', '+k.al[2]+'.';ko=k.al[1]+' '+k.al[3]+'.';alt=[cap('though '+k.al[0])+', '+k.al[2]+'.'];break;
  case 'N_both':en=SEN(['both',A[0],'and',B[0],'like',k.lk[0]]);ko=D([josa(A[1],'과/와'),B[1],'둘 다',KO.A(k.lk[1])]);break;
  case 'N_either':{const e=k.ei;en=SEN(['you can have either',e[0],'or',e[1]]);if(e[4]!=='마시다'&&e[4]!=='먹다')en=SEN(['you can choose either',e[0],'or',e[1]]);ko=D(['너는',josa(e[2],'이나/나'),e[3],'중 하나를',KO.L(e[4])+' 수 있어']);break}
  case 'N_neither':en=SEN(['neither',A[0],'nor',B[0],'is here']);ko=D([A[1]+'도',B[1]+'도','여기 없어']);break;
  case 'N_notonly':en=SEN([S.en,S.be,'not only',k.a1[0],'but also',k.a2[0]]);ko=D([S.top,KO.L(k.a1[1])+' 뿐만 아니라',KO.S(k.a2[1])+'기도 해']);break}
  return {en,ko,alt,w:[]}}
// O used to · one / another / the other
const USED=[['live in Busan','부산에 살다'],['play the piano','피아노를 치다'],['go to bed early','일찍 자다'],['ride a tricycle','세발자전거를 타다'],['eat a lot of candy','사탕을 많이 먹다'],
 ['cry a lot','많이 울다'],['walk to school','학교에 걸어 다니다'],['watch cartoons every day','매일 만화를 보다'],['be afraid of dogs','개를 무서워하다'],['be very shy','아주 수줍음을 타다'],['have long hair','머리가 길다'],['collect stickers','스티커를 모으다']];
const COL=[['red','빨간색'],['blue','파란색'],['green','초록색'],['yellow','노란색'],['black','검은색'],['white','흰색'],['pink','분홍색']];
const ONEN=[['pencils','연필','자루'],['bags','가방','개'],['umbrellas','우산','개'],['cups','컵','개'],['balls','공','개'],['caps','모자','개']];
function OSkel(r,lap){const c=[...COL].sort(()=>r()-.5);return {S:pick(r,PS.concat([NP('my coach','우리 코치님',7),NP('my friend','내 친구',12)])),u:pick(r,USED),c,n:pick(r,ONEN)}}
function OForm(k,f){const {S,u,c,n}=k;let en,ko;switch(f){
  case 'O_used':en=SEN([S.en,'used to',u[0]]);ko=D([S.top,'예전에는',KO.S(u[1])+'곤 했어']);if(/^(be|have) /.test(u[0]))ko=D([S.top,'예전에는',KO.P(u[1])]);return {en,ko,w:[chip(u[1],u[0])]};
  case 'O_usedneg':en=SEN([S.en,"didn't use to",u[0]]);ko=D([S.top,'예전에는',KO.S(u[1])+'지 않았어']);return {en,ko,w:[chip(u[1],u[0])]};
  case 'O_two':en='I have two '+n[0]+'. One is '+c[0][0]+', and the other is '+c[1][0]+'.';ko='나는 '+n[1]+' 두 '+n[2]+'가 있어. 하나는 '+josa(c[0][1],'이고/고')+', 다른 하나는 '+COP.pos(c[1][1])+'.';return {en,ko,w:[]};
  case 'O_three':en='I have three '+n[0]+'. One is '+c[0][0]+', another is '+c[1][0]+', and the other is '+c[2][0]+'.';ko='나는 '+n[1]+' 세 '+n[2]+'가 있어. 하나는 '+josa(c[0][1],'이고/고')+', 또 하나는 '+josa(c[1][1],'이고/고')+', 나머지 하나는 '+COP.pos(c[2][1])+'.';return {en,ko,w:[]}}}
// ───────── 고등·수능 12단계 ─────────
const FX=(L)=>(r)=>pick(r,L);
// P 과거완료 had p.p.
const PWHEN=[['I got to the station','the train had already left','내가 역에 도착했을 때 기차는 이미 떠났어'],['we got home','the pizza had already arrived','우리가 집에 왔을 때 피자는 이미 와 있었어'],
 ['I woke up','the sun had already risen','내가 일어났을 때 해는 이미 떠 있었어'],['he called me','I had already gone to bed','그가 전화했을 때 나는 이미 잠자리에 들었어'],
 ['the teacher came in','we had already finished our homework','선생님이 들어오셨을 때 우리는 이미 숙제를 끝냈어'],['I arrived at the theater','the movie had already started','내가 극장에 도착했을 때 영화는 이미 시작했어'],
 ['we got to the store','it had already closed','우리가 가게에 도착했을 때 가게는 이미 문을 닫았어'],['I opened the box','someone had already eaten the cookies','내가 상자를 열었을 때 누군가 이미 쿠키를 먹었어'],
 ['she came back','the snow had already melted','그녀가 돌아왔을 때 눈은 이미 녹았어'],['we reached the top','the sun had already set','우리가 꼭대기에 도착했을 때 해는 이미 졌어']];
const PACT=[['finish the homework','숙제를 끝내다'],['clean the room','방을 청소하다'],['eat lunch','점심을 먹다'],['read the book','그 책을 읽다'],['pack the bag','가방을 싸다'],['wash the dishes','설거지를 하다'],['write the letter','편지를 쓰다']];
const PBEF=[['before dinner','저녁 먹기 전에'],['before the class started','수업이 시작하기 전에'],['before the teacher came','선생님이 오시기 전에'],['before the movie started','영화가 시작하기 전에'],['before we left','우리가 나가기 전에']];
const PNEV=[['I had never seen snow before I went to Canada.','나는 캐나다에 가기 전에는 눈을 본 적이 없었어.'],['He had never ridden a horse before that day.','그는 그날 전에는 말을 타 본 적이 없었어.'],
 ['She had never eaten kimchi before she came to Korea.','그녀는 한국에 오기 전에는 김치를 먹어 본 적이 없었어.'],['We had never seen such a big fish before.','우리는 전에 그렇게 큰 물고기를 본 적이 없었어.'],
 ['I had never flown in a plane before last summer.','나는 지난여름 전에는 비행기를 타 본 적이 없었어.'],['They had never heard that song before.','그들은 전에 그 노래를 들어 본 적이 없었어.']];
const ppPh=e=>{const h=e.split(' ')[0];return EN.pp(h)+e.slice(h.length)};
function PSkel(r,lap){return {w:pick(r,PWHEN),a:pick(r,PACT),b:pick(r,PBEF),S:pick(r,PS),n:pick(r,PNEV)}}
function PForm(k,f){let en,ko;switch(f){
  case 'P_when':en=cap('when '+k.w[0])+', '+k.w[1]+'.';ko=k.w[2]+'.';return {en,ko,alt:[cap(k.w[1])+' when '+k.w[0]+'.'],w:[]};
  case 'P_before':en=SEN([k.S.en,'had already',ppPh(k.a[0]),k.b[0]]);ko=D([k.S.top,k.b[1],'이미',KO.P(k.a[1])]);return {en,ko,w:[chip(k.a[1],k.a[0])]};
  case 'P_q':en=SEN(['had',k.S.g===2?'you':k.S.en,ppPh(k.a[0]),k.b[0]],1);ko=Q([k.S.top,k.b[1],KO.P(k.a[1])]);return {en,ko,w:[chip(k.a[1],k.a[0])]};
  case 'P_never':return {en:k.n[0],ko:k.n[1],w:[]}}}
// Q 현재완료진행 · 미래진행
const QACT=[['wait','기다리다','s'],['study English','영어를 공부하다','sl'],['play soccer','축구를 하다','s'],['read this book','이 책을 읽다','s'],['learn the piano','피아노를 배우다','l'],['live in Seoul','서울에 살다','l'],
 ['clean the house','집을 청소하다','s'],['watch TV','TV를 보다','s'],['practice taekwondo','태권도를 연습하다','l'],['work here','여기서 일하다','l'],['write the story','이야기를 쓰다','s'],['look for my key','열쇠를 찾다','s']];
const QDUR=[['for an hour','한 시간 동안','s'],['for two hours','두 시간 동안','s'],['since this morning','오늘 아침부터','s'],['for three years','3년 동안','l'],['since last year','작년부터','l'],['all day','하루 종일','s'],['for a long time','오랫동안','l']];
const QWT=[['at ten tonight','오늘 밤 10시에'],['this time tomorrow','내일 이맘때'],['at noon tomorrow','내일 정오에'],['when you arrive','네가 도착할 때'],['at 8 tomorrow morning','내일 아침 8시에']];
const QWA=[['sleep','자다'],['have dinner','저녁을 먹다'],['study','공부하다'],['play soccer','축구를 하다'],['watch a movie','영화를 보다'],['swim','수영하다'],['take a test','시험을 보다'],['fly to Jeju','제주행 비행기를 타다']];
function QSkel(r,lap){for(let g=0;g<50;g++){const a=pick(r,QACT),d=pick(r,QDUR.filter(x=>a[2].includes(x[2])));if(d)return {S:pick(r,PS),a,d,wt:pick(r,QWT),wa:pick(r,QWA)}}throw new Error('no Q')}
function QForm(k,f){const S=k.S,a=k.a,h=a[0].split(' ')[0],ing=EN.ing(h)+a[0].slice(h.length);let en,ko;switch(f){
  case 'Q_hv':en=SEN([S.en,S.s?'has been':'have been',ing,k.d[0]]);ko=D([S.top,k.d[1],KO.S(a[1])+'고 있어']);return {en,ko,w:[chip(a[1],a[0])]};
  case 'Q_hvq':en=SEN(['how long',S.s?'has':'have',S.en,'been',ing],1);ko=Q([S.top,'얼마 동안',KO.S(a[1])+'고 있었어']);return {en,ko,w:[chip(a[1],a[0])]};
  case 'Q_willbe':{const x=k.wa,hh=x[0].split(' ')[0];en=SEN([S.en,'will be',EN.ing(hh)+x[0].slice(hh.length),k.wt[0]]);ko=D([S.top,k.wt[1],KO.S(x[1])+'고 있을 거야']);return {en,ko,alt:[en.replace(/^(\w+) will/,(m,a)=>({I:"I'll",You:"You'll",He:"He'll",She:"She'll",We:"We'll",They:"They'll"}[a]||m))],w:[chip(x[1],x[0])]}}}}
// R should have p.p. · must have p.p.
const RSH=[['studied harder','더 열심히 공부하다'],['gone to bed earlier','더 일찍 자다'],['listened to the teacher','선생님 말씀을 듣다'],['brought an umbrella','우산을 가져오다'],['said sorry','미안하다고 말하다'],
 ['eaten breakfast','아침을 먹다'],['checked the answers','답을 확인하다'],['left earlier','더 일찍 출발하다'],['asked for help','도움을 요청하다'],['practiced more','더 연습하다'],['worn a coat','외투를 입다']];
const RSN=[['eaten so much','그렇게 많이 먹다'],['gone to bed so late','그렇게 늦게 자다'],['said that','그런 말을 하다'],['spent all the money','돈을 다 쓰다'],['played games all night','밤새 게임을 하다'],['told a lie','거짓말을 하다'],['run in the rain','빗속에서 뛰다']];
const RMV=[['left already','이미 떠나다'],['forgotten about it','그걸 잊어버리다'],['lost the key','열쇠를 잃어버리다'],['missed the bus','버스를 놓치다'],['finished the work','일을 끝내다'],['heard the news','그 소식을 듣다'],['taken the wrong bus','버스를 잘못 타다'],['dropped it somewhere','어딘가에 떨어뜨리다'],['gone home','집에 가다'],['fallen asleep','잠들다'],['seen the movie','그 영화를 보다'],['broken the vase','꽃병을 깨다'],['eaten the cake','케이크를 먹다'],['practiced a lot','연습을 많이 하다']];
function RSkel(r,lap){const A=RSH.concat(TC.filter(c=>!c[2]).map(c=>[ppPh(c[0]),c[1]])),N=RSN.concat(TC.filter(c=>c[2]).map(c=>[ppPh(c[0]),c[1]]));return {S:pick(r,HS),a:pick(r,A),n:pick(r,N),m:pick(r,RMV),adj:lvPick(r,ADJ.filter(a=>/fe/.test(a.f)&&!/\bc\b/.test(a.f)&&!a.n),lap),q:r()}}
function RForm(k,f){const S=k.S;let en,ko;switch(f){
  case 'R_should':en=SEN([S.en,'should have',k.a[0]]);ko=D([S.top,KO.P(k.a[1])+'야 했어']);return {en,ko,w:[chip(k.a[1],k.a[0])]};
  case 'R_shouldnt':en=SEN([S.en,"shouldn't have",k.n[0]]);ko=D([S.top,KO.S(k.n[1])+'지 말았어야 했어']);return {en,ko,alt:[en.replace("shouldn't",'should not')],w:[chip(k.n[1],k.n[0])]};
  case 'R_must':if(k.q<.5){en=SEN([S.en,'must have been',k.adj.en]);ko=D([S.top,KO.Pst(k.adj.ko)+'던 게 분명해']);return {en,ko,w:[chip(k.adj.ko,k.adj.en)]}}
    en=SEN([S.en,'must have',k.m[0]]);ko=D([S.top,KO.N(k.m[1])+' 게 분명해']);return {en,ko,w:[chip(k.m[1],k.m[0])]}}}
// S 가정법 과거
const SIF=[['If I were a bird, I would fly to you.','내가 새라면 너에게 날아갈 텐데.'],['If I had a lot of money, I would buy a big house.','나에게 돈이 많다면 큰 집을 살 텐데.'],
 ['If I were you, I would tell the truth.','내가 너라면 사실대로 말할 텐데.'],['If I knew the answer, I would tell you.','내가 답을 안다면 너에게 말해 줄 텐데.'],
 ['If I had a dog, I would walk it every day.','나에게 개가 있다면 매일 산책을 시킬 텐데.'],['If it were sunny, we would go to the beach.','날씨가 화창하다면 우리는 해변에 갈 텐데.'],
 ['If I could fly, I would visit every country.','내가 날 수 있다면 모든 나라를 가 볼 텐데.'],['If he were here, he would help us.','그가 여기 있다면 우리를 도와줄 텐데.'],
 ['If I had more time, I would read more books.','나에게 시간이 더 있다면 책을 더 많이 읽을 텐데.'],['If she lived near here, we would play together every day.','그녀가 이 근처에 산다면 우리는 매일 같이 놀 텐데.'],
 ['If I were taller, I could reach the shelf.','내가 키가 더 크다면 선반에 손이 닿을 텐데.'],['If we had a car, we could go camping.','우리에게 차가 있다면 캠핑을 갈 수 있을 텐데.'],
 ['If I were a teacher, I would give no homework.','내가 선생님이라면 숙제를 안 낼 텐데.'],['If it didn\'t rain, we would play soccer.','비가 오지 않는다면 우리는 축구를 할 텐데.'],
 ['If I spoke English well, I would make many foreign friends.','내가 영어를 잘한다면 외국인 친구를 많이 사귈 텐데.'],['If I lived by the sea, I would swim every day.','내가 바닷가에 산다면 매일 수영할 텐데.']];
const SQ=[['What would you do if you won a lot of money?','너는 돈이 많이 생긴다면 뭘 할 거야?'],['Where would you go if you could go anywhere?','어디든 갈 수 있다면 너는 어디에 갈 거야?'],
 ['What would you buy if you had a million won?','백만 원이 있다면 너는 뭘 살 거야?'],['Who would you meet if you could meet anyone?','누구든 만날 수 있다면 너는 누구를 만날 거야?'],
 ['What would you do if you were invisible?','네가 투명 인간이라면 뭘 할 거야?'],['Which animal would you be if you could be an animal?','동물이 될 수 있다면 너는 어떤 동물이 될 거야?']];
function SSkel(r){return {a:pick(r,SIF),q:pick(r,SQ)}}
function SForm(k,f){const x=f==='S_q'?k.q:k.a;return {en:x[0],ko:x[1],w:[]}}
// T 가정법 과거완료 · 혼합
const TIF=[['If I had studied harder, I would have passed the test.','내가 더 열심히 공부했다면 시험에 합격했을 텐데.'],['If we had left earlier, we would have caught the bus.','우리가 더 일찍 출발했다면 버스를 탔을 텐데.'],
 ['If it hadn\'t rained, we would have gone on a picnic.','비가 오지 않았다면 우리는 소풍을 갔을 텐데.'],['If he had told me, I would have helped him.','그가 나에게 말했다면 나는 그를 도와줬을 텐데.'],
 ['If I had known your number, I would have called you.','내가 네 번호를 알았다면 너에게 전화했을 텐데.'],['If she had been careful, she wouldn\'t have fallen.','그녀가 조심했다면 넘어지지 않았을 텐데.'],
 ['If you had asked me, I would have said yes.','네가 나에게 물어봤다면 나는 좋다고 했을 텐데.'],['If we had practiced more, we would have won the game.','우리가 더 연습했다면 경기에서 이겼을 텐데.'],
 ['If I had brought an umbrella, I wouldn\'t have gotten wet.','내가 우산을 가져왔다면 젖지 않았을 텐데.'],['If they had woken up on time, they wouldn\'t have been late.','그들이 제시간에 일어났다면 늦지 않았을 텐데.']];
const TMX=[['If I had eaten breakfast, I wouldn\'t be hungry now.','내가 아침을 먹었다면 지금 배고프지 않을 텐데.'],['If I had gone to bed early, I wouldn\'t be tired now.','내가 일찍 잤다면 지금 피곤하지 않을 텐데.'],
 ['If he had taken the medicine, he would be fine now.','그가 약을 먹었다면 지금 괜찮을 텐데.'],['If we had bought the tickets, we would be at the concert now.','우리가 표를 샀다면 지금 콘서트에 있을 텐데.'],
 ['If I had learned to swim, I could swim with you now.','내가 수영을 배웠다면 지금 너랑 수영할 수 있을 텐데.'],['If she had saved money, she would have a new bike now.','그녀가 돈을 모았다면 지금 새 자전거가 있을 텐데.']];
function TSkel(r){return {a:pick(r,TIF),m:pick(r,TMX)}}
function TForm(k,f){const x=f==='T_mix'?k.m:k.a;return {en:x[0],ko:x[1],w:[]}}
// U I wish · as if · without
const UW=[['I wish I had a dog.','나에게 개가 있으면 좋을 텐데.'],['I wish I could fly.','내가 날 수 있으면 좋을 텐데.'],['I wish I were taller.','내가 키가 더 크면 좋을 텐데.'],
 ['I wish it were Saturday today.','오늘이 토요일이면 좋을 텐데.'],['I wish I knew the answer.','내가 답을 알면 좋을 텐데.'],['I wish I lived near the beach.','내가 해변 근처에 살면 좋을 텐데.'],
 ['I wish I had more time.','나에게 시간이 더 있으면 좋을 텐데.'],['I wish you were here.','네가 여기 있으면 좋을 텐데.'],['I wish I could speak Chinese.','내가 중국어를 할 수 있으면 좋을 텐데.'],
 ['I wish I had studied harder.','내가 더 열심히 공부했더라면 좋았을 텐데.'],['I wish I hadn\'t said that.','내가 그 말을 하지 않았더라면 좋았을 텐데.']];
const UA=[['He talks as if he knew everything.','그는 모든 걸 아는 것처럼 말해.'],['She acts as if she were a queen.','그녀는 자기가 여왕인 것처럼 행동해.'],['He looks as if he were sick.','그는 아픈 것처럼 보여.'],
 ['You talk as if you had seen a ghost.','너는 유령을 본 것처럼 말하네.'],['The dog ran as if it were chasing something.','그 개는 뭔가를 쫓는 것처럼 달렸어.'],['She smiled as if nothing had happened.','그녀는 아무 일도 없었던 것처럼 웃었어.'],
 ['He spends money as if he were rich.','그는 부자인 것처럼 돈을 써.']];
const UO=[['Without water, we couldn\'t live.','물이 없다면 우리는 살 수 없을 거야.'],['Without your help, I couldn\'t have finished it.','네 도움이 없었다면 나는 그걸 끝내지 못했을 거야.'],
 ['Without the sun, nothing could grow.','해가 없다면 아무것도 자랄 수 없을 거야.'],['Without music, life would be boring.','음악이 없다면 삶은 지루할 거야.'],
 ['Without a map, we would have gotten lost.','지도가 없었다면 우리는 길을 잃었을 거야.'],['Without friends, school would be lonely.','친구가 없다면 학교는 외로울 거야.']];
function USkel(r){return {w:pick(r,UW),a:pick(r,UA),o:pick(r,UO)}}
function UForm(k,f){const x=f==='U_wish'?k.w:f==='U_asif'?k.a:k.o;return {en:x[0],ko:x[1],w:[]}}
// V 분사구문
const VP2=[['Walking home, I met my friend.','집에 걸어가다가 나는 친구를 만났어.'],['Feeling tired, I went to bed early.','피곤해서 나는 일찍 잤어.'],['Hearing the news, she started to cry.','그 소식을 듣고 그녀는 울기 시작했어.'],
 ['Opening the door, he saw a cat.','문을 열자 그는 고양이를 봤어.'],['Not knowing what to say, I kept quiet.','뭐라고 말해야 할지 몰라서 나는 가만히 있었어.'],['Seeing the teacher, the students stood up.','선생님을 보고 학생들은 일어섰어.'],
 ['Listening to music, I did my homework.','음악을 들으면서 나는 숙제를 했어.'],['Being hungry, he ate two sandwiches.','배가 고파서 그는 샌드위치를 두 개 먹었어.'],['Smiling brightly, she said hello.','밝게 웃으면서 그녀는 인사했어.'],
 ['Finishing his homework, he went out to play.','숙제를 끝내고 그는 놀러 나갔어.'],['Running to school, I dropped my bag.','학교로 뛰어가다가 나는 가방을 떨어뜨렸어.'],['Having lost the key, I couldn\'t open the door.','열쇠를 잃어버려서 나는 문을 열 수 없었어.'],
 ['Written in easy English, the book is good for kids.','쉬운 영어로 쓰여 있어서 그 책은 아이들에게 좋아.'],['Tired from the long walk, we sat down.','오래 걸어서 지친 우리는 앉았어.'],['Turning left, you will see the library.','왼쪽으로 돌면 도서관이 보일 거야.'],
 ['Not feeling well, she stayed home.','몸이 좋지 않아서 그녀는 집에 있었어.']];
function VSkel(r){return {a:pick(r,VP2)}}
function VForm(k,f){return {en:k.a[0],ko:k.a[1],w:[]}}
// W with + 명사 + 분사
const WW=[['He sat with his eyes closed.','그는 눈을 감은 채로 앉아 있었어.'],['She listened with her arms crossed.','그녀는 팔짱을 낀 채로 들었어.'],['Don\'t talk with your mouth full.','입에 음식을 가득 넣은 채로 말하지 마.'],
 ['He fell asleep with the TV on.','그는 TV를 켠 채로 잠들었어.'],['She left with the door open.','그녀는 문을 열어 둔 채로 나갔어.'],['The dog came in with its tail wagging.','그 개는 꼬리를 흔들며 들어왔어.'],
 ['I can\'t sleep with the light on.','나는 불을 켠 채로는 잘 수 없어.'],['He stood there with his hands in his pockets.','그는 주머니에 손을 넣은 채로 거기 서 있었어.'],['She ran with her hair flying.','그녀는 머리를 휘날리며 달렸어.'],
 ['We watched the movie with the lights off.','우리는 불을 끈 채로 영화를 봤어.'],['He walked away with tears running down his face.','그는 눈물을 흘리며 걸어갔어.'],['Don\'t read with your head down so low.','고개를 그렇게 숙인 채로 읽지 마.']];
function WSkel(r){return {a:pick(r,WW)}}
function WForm(k,f){return {en:k.a[0],ko:k.a[1],w:[]}}
// X 관계사 계속적 용법 · 전치사 + 관계사
const XC=[['I have a friend, who lives in Busan.','나에게는 친구가 한 명 있는데, 그 친구는 부산에 살아.'],['My uncle, who is a pilot, travels a lot.','우리 삼촌은 비행기 조종사인데, 여행을 많이 다니셔.'],
 ['I read the book, which was very interesting.','나는 그 책을 읽었는데, 그건 아주 재미있었어.'],['We visited Jeju, which is a beautiful island.','우리는 제주에 갔는데, 그곳은 아름다운 섬이야.'],
 ['She bought a new bike, which is red.','그녀는 새 자전거를 샀는데, 그건 빨간색이야.'],['Mr. Kim, who teaches us math, is very kind.','김 선생님은 우리에게 수학을 가르치시는데, 아주 친절하셔.'],
 ['He lost his phone, which made him upset.','그는 휴대폰을 잃어버렸는데, 그게 그를 속상하게 했어.'],['I met Tom, who is my best friend.','나는 톰을 만났는데, 그는 내 가장 친한 친구야.']];
const XP=[['This is the house in which I was born.','이건 내가 태어난 집이야.'],['That is the girl with whom I went to the park.','저 애가 내가 같이 공원에 간 여자아이야.'],
 ['This is the box in which I keep my toys.','이건 내가 장난감을 넣어 두는 상자야.'],['He is the friend to whom I sent the letter.','그는 내가 편지를 보낸 친구야.'],
 ['This is the chair on which the cat likes to sleep.','이건 고양이가 자기 좋아하는 의자야.'],['The town in which we live is very quiet.','우리가 사는 동네는 아주 조용해.'],
 ['The pen with which I write is blue.','내가 쓰는 펜은 파란색이야.'],['Is this the bus on which you left your bag?','이게 네가 가방을 두고 내린 버스야?']];
function XSkel(r){return {c:pick(r,XC),p:pick(r,XP)}}
function XForm(k,f){const x=f==='X_prep'?k.p:k.c;return {en:x[0],ko:x[1],w:[]}}
// Y whoever · whatever · wherever · however
const YV=[['eat','먹다','먹어도'],['buy','사다','사도'],['draw','그리다','그려도'],['read','읽다','읽어도'],['choose','고르다','골라도'],['play','하고 놀다','하고 놀아도'],['watch','보다','봐도'],['take','가져가다','가져가도']];
const YF=[['Whoever comes first will get a prize.','누구든지 먼저 오는 사람은 상을 받을 거야.'],['Wherever you go, I will follow you.','네가 어디에 가든지 나는 너를 따라갈 거야.'],
 ['However hard it is, don\'t give up.','아무리 어려워도 포기하지 마.'],['Whenever I see him, he is smiling.','내가 그를 볼 때마다 그는 웃고 있어.'],['Whatever happens, I will be on your side.','무슨 일이 있어도 나는 네 편이야.'],
 ['However tired you are, brush your teeth.','아무리 피곤해도 이를 닦아.'],['Whoever wants to come can join us.','오고 싶은 사람은 누구든지 같이 가도 돼.'],['Whenever it rains, the dog hides under the bed.','비가 올 때마다 그 개는 침대 밑에 숨어.']];
function YSkel(r){return {v:pick(r,YV),f:pick(r,YF),S:pick(r,[PS[1],PS[2],PS[3],PS[4],PS[5]])}}
function YForm(k,f){if(f==='Y_fix')return {en:k.f[0],ko:k.f[1],w:[]};const v=k.v,S=k.S;
  return {en:SEN([S.en,'can',v[0],'whatever',S.en,s3(S,'want')]),ko:D([S.top,'원하는 건',v[0]==='play'?'뭐든지 하고 놀아도 돼':'뭐든지 '+v[2]+' 돼']),w:[chip(v[1],v[0])]}}
// Z 강조 · 도치 · So do I
const ZDO=[['broke the window','창문을 깨다'],['ate the cake','케이크를 먹다'],['found the key','열쇠를 찾다'],['won the race','경주에서 이기다'],['called me','나에게 전화하다'],['drew this picture','이 그림을 그리다'],['opened the door','문을 열다']];
const ZSO=[['likes pizza','피자를 좋아해','do','so',''],['can swim','수영을 할 수 있어','can','so',''],['is hungry','배가 고파','am','so',''],['was tired','피곤했어','was','so',''],['went to the park','공원에 갔어','did','so',''],
 ["doesn't like carrots",'당근을 좋아하지 않아','do','neither'],["can't sing well",'노래를 잘 못 해','can','neither'],["isn't sleepy",'졸리지 않아','am','neither'],["didn't go to school",'학교에 가지 않았어','did','neither'],["wasn't at home",'집에 없었어','was','neither']];
const ZNV=[['Never have I seen such a big fish.','나는 그렇게 큰 물고기를 한 번도 본 적이 없어.'],['Little did I know that he was my new teacher.','그가 내 새 선생님이라는 걸 나는 전혀 몰랐어.'],
 ['Never have I been so happy.','나는 이렇게 행복했던 적이 한 번도 없어.'],['Not only is she smart, but she is also kind.','그녀는 똑똑할 뿐만 아니라 친절하기도 해.'],
 ['Here comes the bus.','버스가 여기 온다.'],['There goes the bus.','저기 버스가 간다.']];
function ZSkel(r){return {n:pick(r,NMP),d:pick(r,ZDO),S:pick(r,[PS[2],PS[3],NP('my friend','내 친구',12),NP('Tom','톰',40)]),so:pick(r,ZSO),nv:pick(r,ZNV)}}
function ZForm(k,f){let en,ko;switch(f){
  case 'Z_it':en=SEN(['it was',k.n[0],'that',k.d[0]]);ko=D([KO.N(k.d[1]),'건 바로',josa(k.n[1],'이었어/였어')]);return {en,ko,alt:[en.replace(' that ',' who ')],w:[]};
  case 'Z_so':{const x=k.so,S=k.S;en=cap(S.en)+' '+x[0]+', and '+x[3]+' '+x[2]+' I.';ko=S.top+' '+x[1]+', 나도 그래.';return {en,ko,w:[]}}
  case 'Z_nv':return {en:k.nv[0],ko:k.nv[1],w:[]}}}
// a to · -ing 뜻 차이 · 수일치 · 시제일치
const RMA=[['lock the door','문을 잠그다'],['turn off the light','불을 끄다'],['feed the cat','고양이에게 밥을 주다'],['close the window','창문을 닫다'],['bring the homework','숙제를 가져오다'],['call Tom','톰에게 전화하다'],['water the plants','화분에 물을 주다']];
const AGR=[['Each student has a locker.','학생마다 사물함이 하나씩 있어.'],['Every child likes this game.','모든 아이가 이 게임을 좋아해.'],['One of my friends lives in Busan.','내 친구들 중 한 명은 부산에 살아.'],
 ['The number of students is increasing.','학생 수가 늘고 있어.'],['A number of students are absent today.','오늘 많은 학생들이 결석했어.'],['Everyone in my class is excited.','우리 반 모두가 신이 났어.'],
 ['Neither of them knows the answer.','그들 중 누구도 답을 몰라.'],['Both of my friends play soccer.','내 친구 둘 다 축구를 해.'],['Most of the cake was eaten.','케이크의 대부분을 먹었어.'],
 ['Most of the students were there.','학생들 대부분이 거기 있었어.'],['Reading books is my hobby.','책 읽기는 내 취미야.'],['The boys in the park are my friends.','공원에 있는 남자아이들은 내 친구들이야.']];
const SAID=[['tired','피곤하다'],['hungry','배가 고프다'],['busy','바쁘다'],['happy','행복하다'],['sick','아프다'],['sleepy','졸리다'],['bored','심심하다']];
const SAIDW=[['come','오다'],['help me','나를 돕다'],['call me','나에게 전화하다'],['be late','늦다'],['join us','우리랑 같이하다']];
function aSkel(r){return {S:pick(r,[PS[2],PS[3],NP('Tom','톰',40),NP('Mina','미나',41)]),m:pick(r,RMA),g:pick(r,AGR),sa:pick(r,SAID),sw:pick(r,SAIDW),q:r()}}
function aForm(k,f){const S=k.S,m=k.m;let en,ko;const pr=S.en==='he'||S.en==='Tom'?'he':'she';
  switch(f){
  case 'a_remto':en=SEN(['remember to',m[0]]);ko=D(['잊지 말고',KO.A(m[1])]);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_reming':{const h=m[0].split(' ')[0];en=SEN(['I remember',EN.ing(h)+m[0].slice(h.length)]);ko=D(['나는',KO.N(m[1]),'걸 기억해']);return {en,ko,w:[chip(m[1],m[0])]}}
  case 'a_forgetto':en=SEN(["I forgot to",m[0]]);ko=D(['나는',KO.NE(m[1]),'걸 깜빡했어']);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_stop':{const x=k.q<.5;en=x?SEN([S.en,'stopped to drink water']):SEN([S.en,'stopped drinking soda']);ko=x?D([S.top,'물을 마시려고 멈췄어']):D([S.top,'탄산음료 마시는 걸 그만뒀어']);return {en,ko,w:[]}}
  case 'a_agree':return {en:k.g[0],ko:k.g[1],w:[]};
  case 'a_said':if(k.q<.5){en=SEN([S.en,'said that',pr,'was',k.sa[0]]);ko=D([S.top,k.sa[1]+'고 말했어']);return {en,ko,alt:[en.replace(' that ',' ')],w:[chip(k.sa[1],k.sa[0])]}}
    en=SEN([S.en,'said that',pr,'would',k.sw[0]]);ko=D([S.top,KO.L(k.sw[1]),'거라고 말했어']);return {en,ko,alt:[en.replace(' that ',' ')],w:[chip(k.sw[1],k.sw[0])]}}}
// ───────── 58~63단계 자동 생성(엄마 11/27 「다 채워」) ─────────
const PO=['my','your','his','her','our','their'];
const HS=PS.map((x,i)=>Object.assign({},x,{po:PO[i],pr:x.en,wish:x.s?'wishes':'wish'})).concat([Object.assign(NP('Tom','톰',40),{pr:'he',po:'his',wish:'wishes'}),Object.assign(NP('Mina','미나',41),{pr:'she',po:'her',wish:'wishes'}),Object.assign(NP('Jake','제이크',42),{pr:'he',po:'his',wish:'wishes'}),Object.assign(NP('Yuna','유나',43),{pr:'she',po:'her',wish:'wishes'}),Object.assign(NP('Ben','벤',44),{pr:'he',po:'his',wish:'wishes'}),Object.assign(NP('Sora','소라',45),{pr:'she',po:'her',wish:'wishes'})]);
const fillS=(t,S)=>t.replace('{N}',S.nom).replace('{E}',S.ko+'에게');
const dropS=t=>t.replace(/\{[NE]\} /,'');
const isCop=t=>/[가-힣]이다$/.test(t)&&!/있다$/.test(t);
const kIf=t=>isCop(t)?josa(t.slice(0,-2),'이라면/라면'):t.replace(/다$/,'다면');
const kMyeon=t=>isCop(t)?josa(t.slice(0,-2),'이면/면'):KO.M(t);
// 가정법 과거: [조건(영어 과거꼴, 주어 뒤), 한국어 기본형({N} 주어 · {E} ~에게), 결과 [[영어 동사구, 한국어 기본형]]]
const SC=[['were a bird','{N} 새이다',[['fly over the mountains','산 위를 날아가다'],['fly to the sea','바다로 날아가다'],['sing every morning','매일 아침 노래하다']]],
 ['had a lot of money','{E} 돈이 많다',[['buy a big house','큰 집을 사다'],['travel around the world','세계 여행을 하다'],['help poor people','가난한 사람들을 돕다']]],
 ['had a dog','{E} 개가 있다',[['walk it every day','매일 개를 산책시키다'],['play with it after school','방과 후에 개랑 놀다']]],
 ['knew the answer','{N} 답을 알다',[['tell everyone','모두에게 말해 주다'],['write it down','그걸 적다']]],
 ['could fly','{N} 날 수 있다',[['visit every country','모든 나라에 가 보다'],['go to school in a minute','1분 만에 학교에 가다'],['see the whole city','도시 전체를 보다']]],
 ['were taller','{N} 키가 더 크다',[['reach the top shelf','맨 위 선반에 손이 닿다'],['play basketball better','농구를 더 잘하다']]],
 ['had more time','{E} 시간이 더 있다',[['read more books','책을 더 많이 읽다'],['learn the guitar','기타를 배우다'],['play outside longer','밖에서 더 오래 놀다']]],
 ['lived near the sea','{N} 바닷가 근처에 살다',[['swim every day','매일 수영하다'],['go fishing on weekends','주말마다 낚시하러 가다'],['build sandcastles every day','매일 모래성을 쌓다']]],
 ['were a teacher','{N} 선생님이다',[['give no homework','숙제를 안 내 주다'],['play games with the students','학생들과 게임을 하다']]],
 ['spoke English well','{N} 영어를 잘하다',[['make many foreign friends','외국인 친구를 많이 사귀다'],['travel alone','혼자 여행하다'],['watch movies without subtitles','자막 없이 영화를 보다']]],
 ['were invisible','{N} 투명 인간이다',[['play tricks on everyone','모두에게 장난을 치다'],['go anywhere','어디든 가다']]],
 ['had a robot','{E} 로봇이 있다',[['play with it all day','하루 종일 로봇이랑 놀다'],['let it clean the room','로봇에게 방 청소를 맡기다']]],
 ['were older','{N} 나이가 더 많다',[['ride the roller coaster','롤러코스터를 타다'],['stay up late','늦게까지 깨어 있다']]],
 ['had a big garden','{E} 큰 정원이 있다',[['grow vegetables','채소를 기르다'],['plant many flowers','꽃을 많이 심다'],['have a picnic every weekend','주말마다 소풍을 하다']]],
 ["didn't have homework",'{E} 숙제가 없다',[['play outside','밖에서 놀다'],['watch a movie','영화를 보다'],['go to the park','공원에 가다']]],
 ['could cook well','{N} 요리를 잘할 수 있다',[['make dinner for everyone','모두를 위해 저녁을 만들다'],['open a restaurant','식당을 열다']]],
 ['lived in a castle','{N} 성에 살다',[['have a party every day','매일 파티를 하다'],['invite many friends','친구들을 많이 초대하다']]],
 ['were a doctor','{N} 의사이다',[['help sick people','아픈 사람들을 돕다'],['work at a hospital','병원에서 일하다']]],
 ['had a time machine','{E} 타임머신이 있다',[['go back to the past','과거로 돌아가다'],['see the dinosaurs','공룡을 보다'],['visit the future','미래에 가 보다']]],
 ['were stronger','{N} 힘이 더 세다',[['carry the heavy box','무거운 상자를 들다'],['win the game','경기에서 이기다']]],
 ['could talk to animals','{N} 동물과 말할 수 있다',[['talk with the birds','새들과 이야기하다'],['understand the dog','그 개의 마음을 알다']]],
 ['had a bike','{E} 자전거가 있다',[['ride to school','학교에 자전거를 타고 가다'],['go to the park faster','공원에 더 빨리 가다']]],
 ['were the president','{N} 대통령이다',[['build more parks','공원을 더 짓다'],['make every Friday a holiday','금요일을 모두 쉬는 날로 만들다']]],
 ["didn't feel sick",'{N} 아프지 않다',[['go to school','학교에 가다'],['play soccer','축구를 하다']]],
 ['had a camera','{E} 카메라가 있다',[['take pictures of the sunset','노을 사진을 찍다'],['make a video','영상을 만들다']]],
 ["weren't busy",'{N} 바쁘지 않다',[['come to the party','파티에 가다'],['play with the children','아이들과 놀다']]],
 ['had wings','{E} 날개가 있다',[['fly to school','학교에 날아가다'],['fly over the sea','바다 위를 날다']]],
 ['were a famous singer','{N} 유명한 가수이다',[['sing on TV','TV에서 노래하다'],['give concerts all over the world','전 세계에서 콘서트를 하다']]],
 ['lived in the countryside','{N} 시골에 살다',[['raise chickens','닭을 키우다'],['see more stars at night','밤에 별을 더 많이 보다']]],
 ['could run faster','{N} 더 빨리 달릴 수 있다',[['win the race','경주에서 이기다'],['catch the bus','버스를 타다']]],
 ['had a magic wand','{E} 마법 지팡이가 있다',[['make it snow in summer','여름에 눈이 오게 하다'],['turn the classroom into a playground','교실을 놀이터로 바꾸다']]],
 ['were a scientist','{N} 과학자이다',[['invent a flying car','하늘을 나는 차를 발명하다'],['study space','우주를 연구하다']]],
 ['had a bigger room','{E} 더 큰 방이 있다',[['put a piano in it','거기에 피아노를 놓다'],['have a sleepover','친구들과 밤샘 파티를 하다']]],
 ["weren't tired",'{N} 피곤하지 않다',[['finish the work tonight','오늘 밤에 일을 끝내다'],['go for a walk','산책하러 가다']]],
 ['had a pool','{E} 수영장이 있다',[['swim every day','매일 수영하다'],['invite friends to swim','친구들을 불러 수영하다']]],
 ['were rich','{N} 부자이다',[['buy a boat','보트를 사다'],['give money to poor people','가난한 사람들에게 돈을 주다']]],
 ['could play the piano','{N} 피아노를 칠 수 있다',[['join the school band','학교 밴드에 들어가다'],['play songs for the class','반 친구들에게 노래를 연주해 주다']]],
 ['lived next to the school','{N} 학교 바로 옆에 살다',[['sleep longer in the morning','아침에 더 오래 자다'],['walk to school','학교에 걸어가다']]],
 ['had a pet rabbit','{E} 애완 토끼가 있다',[['feed it carrots','토끼에게 당근을 주다'],['build a house for it','토끼 집을 지어 주다']]]];
const SQW=[['What would','do','뭘 할 거야'],['Where would','go','어디에 갈 거야'],['What would','buy','뭘 살 거야']];
function S2Skel(r){const c=pick(r,SC);const one=/^were (a|an|the) /.test(c[0]);return {S:pick(r,HS.filter(x=>!one||x.s||x.en==='I'||x.en==='you')),c,res:pick(r,c[2]),could:r()<.35,q:pick(r,SQW)}}
function S2Form(k,f){const {S,c,res}=k;let en,ko;
  if(f==='S_q'){const q=k.q,c2=SC.indexOf(c);en=q[0]+' you '+q[1]+' if you '+c[0]+'?';ko=fillS(kIf(c[1]),PS[1])+' 너는 '+q[2]+'?';if(q[1]==='buy'&&!/money|rich/.test(c[0])){en='What would you do if you '+c[0]+'?';ko=fillS(kIf(c[1]),PS[1])+' 너는 뭘 할 거야?'}return {en,ko,w:[]}}
  const md=k.could?'could':'would';en=cap('if '+S.en+' '+c[0])+', '+S.pr+' '+md+' '+res[0]+'.';ko=fillS(kIf(c[1]),S)+' '+KO.L(res[1])+(k.could?' 수 있을 텐데':' 텐데')+'.';
  return {en,ko,alt:[cap(S.en+' '+md+' '+res[0]+' if '+S.pr+' '+c[0]+'.')],w:[chip(res[1],res[0])]}}
// 가정법 과거완료: [조건 동사구, 한국어, 부정 조건?, 결과 [[동사구, 한국어, +/-]]]
const TC=[['study harder','더 열심히 공부하다',0,[['pass the test','시험에 합격하다',1],['get a better grade','더 좋은 점수를 받다',1],['fail the test','시험에 떨어지다',0]]],
 ['leave earlier','더 일찍 출발하다',0,[['catch the bus','버스를 타다',1],['miss the train','기차를 놓치다',0],['be late','늦다',0]]],
 ['bring an umbrella','우산을 가져오다',0,[['get wet','비에 젖다',0]]],['practice more','더 연습하다',0,[['win the game','경기에서 이기다',1],['lose the game','경기에서 지다',0]]],
 ['eat breakfast','아침을 먹다',0,[['be hungry in class','수업 시간에 배고프다',0]]],['go to bed earlier','더 일찍 자다',0,[['fall asleep in class','수업 시간에 졸다',0],['feel better','컨디션이 더 좋다',1]]],
 ['listen to the teacher','선생님 말씀을 듣다',0,[['make that mistake','그런 실수를 하다',0],['understand the lesson','수업을 이해하다',1]]],['wear a coat','외투를 입다',0,[['catch a cold','감기에 걸리다',0]]],
 ['take the medicine','약을 먹다',0,[['get better faster','더 빨리 낫다',1]]],['save money','돈을 모으다',0,[['buy the bike','그 자전거를 사다',1]]],['ask for help','도움을 요청하다',0,[['finish on time','제시간에 끝내다',1]]],
 ['be careful','조심하다',0,[['fall down','넘어지다',0],['break the vase','꽃병을 깨다',0]]],['wake up on time','제시간에 일어나다',0,[['be late for school','학교에 늦다',0]]],['read the map','지도를 보다',0,[['get lost','길을 잃다',0]]],
 ['tell the truth','사실대로 말하다',0,[['get in trouble','혼나다',0]]],['buy the tickets','표를 사다',0,[['see the concert','콘서트를 보다',1]]],['see the sign','표지판을 보다',0,[['take the wrong road','길을 잘못 들다',0],['stop the car','차를 세우다',1]]],
 ['finish the homework','숙제를 끝내다',0,[['play outside','밖에서 놀다',1],['watch the movie','그 영화를 보다',1]]],['clean the room','방을 청소하다',0,[['find the key','열쇠를 찾다',1]]],
 ['run faster','더 빨리 뛰다',0,[['catch the bus','버스를 타다',1],['win the race','경주에서 이기다',1]]],['charge the phone','휴대폰을 충전하다',0,[['call the teacher','선생님께 전화하다',1]]],
 ['follow the recipe','요리법을 따르다',0,[['burn the cake','케이크를 태우다',0],['make a better cake','더 맛있는 케이크를 만들다',1]]],['go to the party','파티에 가다',0,[['meet the famous singer','그 유명한 가수를 만나다',1]]],
 ['stay home','집에 있다',0,[['catch a cold','감기에 걸리다',0]]],['check the answers','답을 확인하다',0,[['get a perfect score','만점을 받다',1],['make that mistake','그런 실수를 하다',0]]],
 ['eat so much','그렇게 많이 먹다',1,[['get a stomachache','배가 아프다',0],['get a stomachache','배탈이 나다',0]]],['stay up so late','그렇게 늦게까지 깨어 있다',1,[['be tired','피곤하다',0],['fall asleep in class','수업 시간에 졸다',0]]],
 ['play games all night','밤새 게임을 하다',1,[['fail the test','시험에 떨어지다',0]]],['forget the homework','숙제를 잊어버리다',1,[['get a good grade','좋은 점수를 받다',1]]],['lose the key','열쇠를 잃어버리다',1,[['get into the house','집에 들어가다',1]]],
 ['run in the hallway','복도에서 뛰다',1,[['fall down','넘어지다',0],['bump into the teacher','선생님과 부딪치다',0]]],['skip breakfast','아침을 거르다',1,[['be so hungry','그렇게 배고프다',0]]]];
const TM=[['eat breakfast','아침을 먹다',0,[["wouldn't be hungry now",'지금 배고프지 않을 텐데']]],['go to bed early','일찍 자다',0,[["wouldn't be tired now",'지금 피곤하지 않을 텐데'],['would feel better now','지금 컨디션이 더 좋을 텐데']]],
 ['take the medicine','약을 먹다',0,[['would be fine now','지금 괜찮을 텐데']]],['learn to swim','수영을 배우다',0,[['could swim in the sea now','지금 바다에서 수영할 수 있을 텐데']]],['save money','돈을 모으다',0,[['would have a new bike now','지금 새 자전거가 있을 텐데']]],
 ['study Chinese','중국어를 공부하다',0,[['could talk with Chinese friends now','지금 중국 친구들과 이야기할 수 있을 텐데']]],['buy the tickets','표를 사다',0,[['would be at the concert now','지금 콘서트장에 있을 텐데']]],
 ['finish the homework','숙제를 끝내다',0,[['could watch TV now','지금 TV를 볼 수 있을 텐데'],['would be free now','지금 한가할 텐데']]],['bring a jacket','재킷을 가져오다',0,[["wouldn't be cold now",'지금 춥지 않을 텐데']]],
 ['practice the piano','피아노를 연습하다',0,[['could play the song now','지금 그 곡을 칠 수 있을 텐데']]],['eat so much','그렇게 많이 먹다',1,[["wouldn't feel sick now",'지금 속이 괜찮을 텐데'],['would feel better now','지금 속이 더 편할 텐데']]],
 ['stay up so late','그렇게 늦게까지 깨어 있다',1,[["wouldn't be sleepy now",'지금 졸리지 않을 텐데']]],['lose the map','지도를 잃어버리다',1,[["wouldn't be lost now",'지금 길을 잃지 않았을 텐데'],['would be home now','지금 집에 있을 텐데']]],
 ['move to Busan','부산으로 이사하다',0,[['would live near the sea now','지금 바다 근처에 살 텐데']]]];
const kCond=(S,c,neg)=>S.nom+' '+(neg?KO.S(c)+'지 않았다면':KO.Pst(c)+'다면');
function T2Skel(r){const c=pick(r,TC),m=pick(r,TM);return {S:pick(r,HS),c,res:pick(r,c[3]),m,mr:pick(r,m[3]),could:r()<.3}}
function T2Form(k,f){const S=k.S;let en,ko;
  if(f==='T_mix'){const m=k.m;en=cap('if '+S.en+' '+(m[2]?"hadn't ":'had ')+ppPh(m[0]))+', '+S.pr+' '+k.mr[0]+'.';ko=kCond(S,m[1],m[2])+' '+k.mr[1]+'.';return {en,ko,w:[chip(m[1],m[0])]}}
  const c=k.c,x=k.res,pos=x[2]===1,cd=pos&&k.could;
  en=cap('if '+S.en+' '+(c[2]?"hadn't ":'had ')+ppPh(c[0]))+', '+S.pr+' '+(pos?(cd?'could have ':'would have '):"wouldn't have ")+ppPh(x[0])+'.';
  ko=kCond(S,c[1],c[2])+' '+(pos?(cd?KO.L(x[1])+' 수 있었을 텐데':KO.Pst(x[1])+'을 텐데'):KO.S(x[1])+'지 않았을 텐데')+'.';return {en,ko,w:[chip(c[1],c[0])]}}
// I wish · as if · without
const ASIF=[['knew everything','모든 걸 아는'],['were the boss','대장인'],['were sick','아픈'],['had seen a ghost','유령을 본'],['were a baby','아기인'],['were very tired','아주 피곤한'],['were the best player','최고의 선수인'],
 ['had won a prize','상을 받은'],['were in a hurry','급한'],["didn't hear me",'내 말을 못 들은'],['were a movie star','영화배우인'],['had never seen snow','눈을 한 번도 본 적 없는'],['were angry','화난'],['were the teacher','선생님인'],['owned the whole park','공원 주인인']];
const ASM=[['talk','말하다'],['act','행동하다'],['look','보이다']];
const WOUT=[['water','물','we',[["couldn't live",'살 수 없을 거야']]],['the sun','해','nothing',[['could grow','자랄 수 없을 거야']]],['music','음악','life',[['would be boring','지루할 거야']]],['friends','친구','school',[['would be lonely','외로울 거야']]],
 ['your help','네 도움','I',[["couldn't finish this",'이걸 끝낼 수 없을 거야']]],['a map','지도','we',[['would get lost','길을 잃을 거야']]],['books','책','life',[['would be less fun','덜 재미있을 거야']]],['phones','휴대폰','we',[["couldn't call our friends",'친구들에게 전화할 수 없을 거야']]],
 ['air','공기','we',[["couldn't breathe",'숨을 쉴 수 없을 거야']]],['rain','비','plants',[["couldn't grow",'자랄 수 없을 거야']]],['a teacher','선생님','we',[["couldn't learn much",'많이 배울 수 없을 거야']]],['electricity','전기','we',[["couldn't watch TV",'TV를 볼 수 없을 거야']]],['umbrellas','우산','we',[['would get wet','비에 젖을 거야']]]];
const WOK={we:'우리는',nothing:'아무것도',life:'삶은',school:'학교는',I:'나는',plants:'식물은'};
function U2Skel(r){const c=pick(r,SC),t=pick(r,TC),wo=pick(r,WOUT),S=pick(r,HS);return {S,c,t,a:pick(r,ASIF.filter(x=>S.s||S.en==='I'||S.en==='you'||!/^were (a|an) /.test(x[0]))),m:pick(r,ASM),wo,wr:pick(r,wo[3])}}
function U2Form(k,f){const S=k.S,me=S.g===1;let en,ko;switch(f){
  case 'U_wish':{const c=k.c;en=SEN([S.en,S.wish,S.pr,c[0]]);ko=me?kMyeon(fillS(c[1],S))+' 좋을 텐데.':S.top+' '+kMyeon(dropS(c[1]))+' 좋겠다고 생각해.';return {en,ko,w:[]}}
  case 'U_wishp':{const t=k.t,neg=t[2];en=SEN([S.en,S.wish,S.pr,(neg?"hadn't ":'had ')+ppPh(t[0])]);const body=neg?KO.S(t[1])+'지 않았더라면':KO.Pst(t[1])+'더라면';ko=me?S.nom+' '+body+' 좋았을 텐데.':S.top+' '+body+' 좋았겠다고 생각해.';return {en,ko,w:[chip(t[1],t[0])]}}
  case 'U_asif':{const a=k.a,m=S.g===1&&k.m[0]==='look'?ASM[0]:k.m;if(S.g===1&&a[0]==="didn't hear me")return U2Form(Object.assign({},k,{a:ASIF[0]}),f);en=SEN([S.en,s3(S,m[0]),'as if',S.pr,a[0]]);ko=D([S.top,a[1],'것처럼',KO.A(m[1])]);return {en,ko,w:[chip(m[1],m[0])]}}
  case 'U_without':{const w=k.wo,x=k.wr;en=cap('without '+w[0])+', '+w[2]+' '+x[0]+'.';ko=josa(w[1],'이/가')+' 없다면 '+WOK[w[2]]+' '+x[1]+'.';if(w[2]==='nothing')ko=josa(w[1],'이/가')+' 없다면 아무것도 '+x[1]+'.';return {en,ko,w:[]}}}}
// 분사구문
const VWH=[['walk home','집에 걸어가다'],['listen to music','음악을 듣다'],['wait for the bus','버스를 기다리다'],['read a book','책을 읽다'],['ride a bike','자전거를 타다'],['clean {po} room','방을 청소하다'],
 ['walk in the park','공원을 걷다'],['look out the window','창밖을 보다'],['play in the garden','정원에서 놀다'],['swim in the sea','바다에서 수영하다'],['look for {po} key','열쇠를 찾다'],['run to school','학교로 뛰어가다']];
const VEV=[['met {po} friend','친구를 만났어'],['saw a rainbow','무지개를 봤어'],['found a coin','동전을 주웠어'],['heard a strange noise','이상한 소리를 들었어'],['saw a shooting star','별똥별을 봤어'],
 ['found an old photo','옛날 사진을 찾았어'],['dropped {po} phone','휴대폰을 떨어뜨렸어'],['thought of a good idea','좋은 생각을 떠올렸어'],['saw a big dog','큰 개를 봤어']];
const VWHY=[['tired','피곤하다',[['went to bed early','일찍 잤어'],['took a nap','낮잠을 잤어'],['sat down on the bench','벤치에 앉았어']]],['hungry','배가 고프다',[['ate a sandwich','샌드위치를 먹었어'],['made some ramen','라면을 끓였어']]],
 ['sick','아프다',[['stayed home','집에 있었어'],['went to the doctor','병원에 갔어']]],['bored','심심하다',[['read a comic book','만화책을 읽었어'],['called a friend','친구에게 전화했어']]],
 ['cold','춥다',[['put on a coat','외투를 입었어'],['closed the window','창문을 닫았어']]],['scared','무섭다',[['turned on the light','불을 켰어'],['ran to the teacher','선생님에게 달려갔어']]],
 ['thirsty','목이 마르다',[['drank some water','물을 좀 마셨어']]],['sleepy','졸리다',[['washed {po} face','세수를 했어'],['went to bed','자러 갔어']]]];
const VHAV=[['finished {po} homework','숙제를 끝내고',[['went out to play','놀러 나갔어'],['watched TV','TV를 봤어']]],['lost {po} key','열쇠를 잃어버려서',[["couldn't open the door",'문을 열 수 없었어'],['waited outside','밖에서 기다렸어']]],
 ['eaten lunch','점심을 먹고',[['went back to class','교실로 돌아갔어'],['played soccer','축구를 했어']]],['missed the bus','버스를 놓쳐서',[['walked to school','학교에 걸어갔어'],['was late for school','학교에 늦었어']]],
 ['seen the movie before','그 영화를 전에 봐서',[['knew the ending','결말을 알았어']]],['heard the news','그 소식을 듣고',[['called Tom','톰에게 전화했어'],['started to cry','울기 시작했어']]]];
const VNOT=[['knowing what to do','뭘 해야 할지 몰라서',[['asked the teacher','선생님께 여쭤봤어'],['called the teacher','선생님께 전화했어'],['waited','기다렸어']]],['feeling well','몸이 좋지 않아서',[['stayed home','집에 있었어'],['went to bed early','일찍 잤어']]],
 ['wanting to be late','늦고 싶지 않아서',[['ran to the bus stop','버스 정류장으로 뛰어갔어'],['got up early','일찍 일어났어']]]];
const po2=(t,S)=>t.replace('{po}',S.po);
const VOK=(w,e)=>/photo/.test(e[0])?/clean|look for/.test(w[0]):/swim/.test(w[0])?/^(saw|heard|thought)/.test(e[0]):/dropped|wallet|coin/.test(e[0])?!/look out|sit on/.test(w[0]):true;
function V2Skel(r){const S=pick(r,HS),w=pick(r,VWH),e=pick(r,VEV.filter(x=>VOK(w,x))),y=pick(r,VWHY),h=pick(r,VHAV),n=pick(r,VNOT);return {S,w,e,y,yr:pick(r,y[2]),h,hr:pick(r,h[2]),n,nr:pick(r,n[2])}}
function V2Form(k,f){const S=k.S;let en,ko;switch(f){
  case 'V_a':{const w=k.w,e=k.e,hh=w[0].split(' ')[0];en=cap(EN.ing(hh)+po2(w[0].slice(hh.length),S))+', '+S.en+' '+po2(e[0],S)+'.';ko=KO.S(w[1])+'다가 '+S.top+' '+e[1]+'.';return {en,ko,w:[chip(w[1],w[0].split(' ')[0])]}}
  case 'V_b':{const y=k.y,x=k.yr;en=cap('feeling '+y[0])+', '+S.en+' '+po2(x[0],S)+'.';ko=KO.A(y[1])+'서 '+S.top+' '+x[1]+'.';return {en,ko,alt:[cap('being '+y[0])+', '+S.en+' '+po2(x[0],S)+'.'],w:[chip(y[1],y[0])]}}
  case 'V_c':{const h=k.h,x=k.hr;en=cap('having '+po2(h[0],S))+', '+S.en+' '+x[0]+'.';ko=h[1]+' '+S.top+' '+x[1]+'.';return {en,ko,w:[]}}
  case 'V_d':{const n=k.n,x=k.nr;en=cap('not '+n[0])+', '+S.en+' '+x[0]+'.';ko=n[1]+' '+S.top+' '+x[1]+'.';return {en,ko,w:[]}}}}
// with + 명사 + 분사
const WV=[['sat','앉아 있었어','e a l n s d'],['stood there','거기 서 있었어','a h d'],['listened','들었어','e a'],['slept','잤어','e t l w m s f'],['walked','걸었어','h r'],['sang','노래했어','e'],
 ['read the book','책을 읽었어','l t'],['studied','공부했어','t l w m'],['waited','기다렸어','a h d'],['smiled','웃었어','e'],['ran','달렸어','r'],['watched the movie','영화를 봤어','f t'],['lay on the sofa','소파에 누워 있었어','e t m l s'],['danced','춤을 췄어','r m e'],['did the homework','숙제를 했어','t m l w'],['talked on the phone','통화했어','h a'],['fell asleep','잠들었어','t l w m e s'],['cooked dinner','저녁을 만들었어','m w'],['drew a picture','그림을 그렸어','m l t'],['played the piano','피아노를 쳤어','e w m'],['thought for a while','잠시 생각했어','e a h d'],['looked at the sky','하늘을 봤어','h a'],['walked home','집에 걸어갔어','h d m']];
const WW2=[['e','{po} eyes closed','눈을 감은 채로'],['a','{po} arms crossed','팔짱을 낀 채로'],['h','{po} hands in {po} pockets','주머니에 손을 넣은 채로'],['n','{po} legs crossed','다리를 꼰 채로'],
 ['t','the TV on','TV를 켠 채로'],['l','the lights on','불을 켠 채로'],['w','the window open','창문을 열어 둔 채로'],['f','the lights off','불을 끈 채로'],['r','{po} hair flying','머리를 휘날리며'],['m','music playing','음악을 틀어 놓은 채로'],['w','the door open','문을 열어 둔 채로'],['m','the radio on','라디오를 켠 채로'],['s','{po} shoes on','신발을 신은 채로'],['d','{po} head down','고개를 숙인 채로'],['f','the curtains closed','커튼을 친 채로']];
const WDONT=[['talk','말하다','{po} mouth full','입에 음식을 가득 넣은 채로'],['sleep','자다','the light on','불을 켠 채로'],['walk','걷다','{po} hands in {po} pockets','주머니에 손을 넣은 채로'],
 ['read','책을 읽다','{po} head down so low','고개를 너무 숙인 채로'],['leave','나가다','the door open','문을 열어 둔 채로'],['eat','먹다','{po} mouth open','입을 벌린 채로'],['cross the street','길을 건너다','{po} eyes on {po} phone','휴대폰을 보면서']];
function W2Skel(r){for(let g=0;g<50;g++){const v=pick(r,WV),w=pick(r,WW2.filter(x=>v[2].split(' ').includes(x[0])));if(w)return {S:pick(r,HS),v,w,d:pick(r,WDONT)}}throw new Error('no W')}
function W2Form(k,f){const S=k.S;if(f==='W_d'){const d=k.d,Y=HS[1];return {en:SEN(["don't",d[0],'with',po2(po2(d[2],Y),Y)]),ko:D([d[3],KO.S(d[1])+'지 마']),w:[]}}
  return {en:SEN([S.en,k.v[0],'with',po2(po2(k.w[1],S),S)]),ko:D([S.top,k.w[2],k.v[1]]),w:[]}}
// 관계사 계속적 용법 · 전치사 + 관계사
const XH=[['friend','친구'],['teammate','팀 친구'],['neighbor','이웃'],['classmate','반 친구']];
const XVP=[['lives in Busan','부산에 살아'],['plays the violin','바이올린을 켜'],['speaks three languages','세 가지 언어를 해'],['runs very fast','아주 빨리 달려'],['draws very well','그림을 아주 잘 그려'],
 ['loves dinosaurs','공룡을 아주 좋아해'],['wants to be a pilot','비행기 조종사가 되고 싶어 해'],['has a big dog','큰 개를 키워'],['moved here last year','작년에 여기로 이사 왔어'],['is good at math','수학을 잘해'],['knows a lot about space','우주에 대해 많이 알아'],['makes great cookies','쿠키를 아주 잘 만들어']];
const XTH=[['bought','샀는데',[['a new bike','새 자전거'],['a backpack','배낭'],['a board game','보드게임'],['a toy robot','장난감 로봇']],[['was very cheap','아주 쌌어'],['was bigger than expected','생각보다 컸어'],['made everyone happy','모두를 기쁘게 했어']]],
 ['read','읽었는데',[['a book','책'],['a comic book','만화책'],['a long story','긴 이야기'],['a letter from Tom','톰의 편지']],[['was very interesting','아주 재미있었어'],['was a little boring','조금 지루했어'],['made me cry','나를 울게 했어']]],
 ['watched','봤는데',[['a movie','영화'],['a documentary','다큐멘터리'],['a soccer game','축구 경기']],[['was very interesting','아주 재미있었어'],['was a little boring','조금 지루했어'],['took three hours','세 시간이 걸렸어']]],
 ['made','만들었는데',[['a cake','케이크'],['a kite','연'],['a sandcastle','모래성']],[['took three hours','세 시간이 걸렸어'],['made everyone happy','모두를 기쁘게 했어'],['was bigger than expected','생각보다 컸어']]],
 ['visited','갔는데',[['Jeju','제주'],['a museum','박물관'],['an old castle','오래된 성'],['a big zoo','큰 동물원']],[['was very interesting','아주 재미있었어'],['was very crowded','사람이 아주 많았어'],['was really beautiful','정말 아름다웠어']]]];
const XPP=[['house','집','in which',[['I was born','내가 태어난'],['we lived last year','우리가 작년에 살았던']]],['box','상자','in which',[['I keep my toys','내가 장난감을 넣어 두는'],['we found the old letters','우리가 옛날 편지를 찾은']]],
 ['chair','의자','on which',[['the cat likes to sleep','고양이가 자기 좋아하는'],['the teacher used to sit','선생님이 앉곤 하셨던']]],['town','동네','in which',[['we live','우리가 사는'],['my teacher grew up','우리 선생님이 자란']]],
 ['friend','친구','with whom',[['I went to the park','내가 같이 공원에 간'],['I study every day','내가 매일 같이 공부하는']]],['girl','여자아이','to whom',[['I sent the letter','내가 편지를 보낸'],['I gave my old bike','내가 옛날 자전거를 준']]],
 ['boy','남자아이','from whom',[['I borrowed this book','내가 이 책을 빌린'],['I got this present','내가 이 선물을 받은']]],['park','공원','in which',[['we played soccer','우리가 축구를 한'],['we had a picnic','우리가 소풍을 간']]],
 ['pen','펜','with which',[['I write my diary','내가 일기를 쓰는'],['he signed his name','그가 이름을 쓴']]],['bus','버스','on which',[['I left my bag','내가 가방을 두고 내린']]],['teacher','선생님','from whom',[['we learned English','우리가 영어를 배운']]],['room','방','in which',[['we sleep','우리가 자는'],['the party was held','파티가 열린']]]];
function X2Skel(r){const S=pick(r,HS),t=pick(r,XTH),p=pick(r,XPP),me=x=>S.en==='I'||!/\bme\b/.test(x[0]);return {S,h:pick(r,XH),vp:pick(r,XVP.filter(me)),t,to:pick(r,t[2]),pr:pick(r,t[3].filter(me)),p,pc:pick(r,p[3]),th:r()<.5}}
function X2Form(k,f){const S=k.S;let en,ko;switch(f){
  case 'X_c':{const h=k.h;en=SEN([S.en,S.s?'has':'have','a',h[0]+',','who',k.vp[0]]).replace(' ,',',');ko=S.ko+'에게는 '+h[1]+'가 한 명 있는데, 그 '+josa(h[1],'은/는')+' '+k.vp[1]+'.';ko=ko.replace(h[1]+'가 한',josa(h[1],'이/가')+' 한');return {en,ko,w:[]}}
  case 'X_w':{const t=k.t,o=k.to;en=SEN([S.en,t[0],o[0]+',','which',k.pr[0]]).replace(' ,',',');ko=S.top+' '+josa(o[1],'을/를')+' '+t[1]+', 그건 '+k.pr[1]+'.';if(t[0]==='visited')ko=S.top+' '+o[1]+'에 '+t[1]+', 거기는 '+k.pr[1]+'.';return {en,ko,w:[]}}
  case 'X_prep':{const p=k.p,c=k.pc;en=k.th?SEN(['this is the',p[0],p[2],c[0]]):SEN(['that is the',p[0],p[2],c[0]]);const per=/friend|girl|boy|teacher/.test(p[0]),plc=/house|town|park|room/.test(p[0]);ko=(plc?(k.th?'여기가 ':'저기가 '):per?(p[0]==='teacher'?(k.th?'이분이 ':'저분이 '):(k.th?'이 아이가 ':'저 아이가 ')):(k.th?'이게 ':'저게 '))+c[1]+' '+COP.pos(p[1])+'.';return {en,ko,alt:[],w:[]}}}}
// ───────── 더 채우기 2(엄마 11/27 「다 채워」): 59·60·61·62·63·64·65·66·54단계 ─────────
TC.push(['look both ways','양쪽을 잘 살피다',0,[['have the accident','그 사고를 당하다',0],['cross safely','안전하게 건너다',1]]],
 ['set an alarm','알람을 맞추다',0,[['wake up late','늦게 일어나다',0],['get up on time','제시간에 일어나다',1]]],['eat more vegetables','채소를 더 먹다',0,[['get sick','아프다',0]]],
 ['wear sunscreen','선크림을 바르다',0,[['get sunburned','햇볕에 타다',0]]],['check the weather','날씨를 확인하다',0,[['bring an umbrella','우산을 가져오다',1],['get wet','비에 젖다',0]]],
 ['listen carefully','잘 듣다',0,[['understand the question','질문을 이해하다',1],['make that mistake','그런 실수를 하다',0]]],['practice every day','매일 연습하다',0,[['win the contest','대회에서 우승하다',1],['do better','더 잘하다',1]]],
 ['walk faster','더 빨리 걷다',0,[['get there on time','제시간에 도착하다',1],['miss the start','시작을 놓치다',0]]],['take a taxi','택시를 타다',0,[['arrive on time','제시간에 도착하다',1],['be late','늦다',0]]],
 ['ask the way','길을 묻다',0,[['get lost','길을 잃다',0],['find the place','그곳을 찾다',1]]],['save the file','파일을 저장하다',0,[['lose the homework','숙제를 잃어버리다',0]]],
 ['tie the shoelaces','신발 끈을 묶다',0,[['fall down','넘어지다',0]]],['hold the railing','난간을 잡다',0,[['fall down the stairs','계단에서 넘어지다',0]]],['close the window','창문을 닫다',0,[['catch a cold','감기에 걸리다',0]]],
 ['put on a helmet','헬멧을 쓰다',0,[['get hurt','다치다',0]]],['drink more water','물을 더 마시다',0,[['feel dizzy','어지럽다',0],['get a headache','머리가 아프다',0]]],
 ['go to the doctor','병원에 가다',0,[['get better sooner','더 빨리 낫다',1]]],['tell Mom','엄마에게 말하다',0,[['get help','도움을 받다',1]]],
 ['take notes','필기하다',0,[['remember the answer','답을 기억하다',1],['forget the answer','답을 잊어버리다',0]]],['read the question carefully','문제를 꼼꼼히 읽다',0,[['get it right','맞히다',1],['make a mistake','실수하다',0]]],
 ['leave home on time','제시간에 집에서 나오다',0,[['miss the bus','버스를 놓치다',0],['catch the bus','버스를 타다',1]]],['bring the ticket','표를 가져오다',0,[['get on the train','기차를 타다',1]]],
 ['know the rules','규칙을 알다',0,[['win the game','경기에서 이기다',1],['make that mistake','그런 실수를 하다',0]]],['take the subway','지하철을 타다',0,[['arrive earlier','더 일찍 도착하다',1]]],
 ['wait for the rain to stop','비가 그칠 때까지 기다리다',0,[['get wet','비에 젖다',0]]],['study with friends','친구들과 공부하다',0,[['have more fun','더 재미있다',1]]],
 ['go to the beach','바닷가에 가다',0,[['swim in the sea','바다에서 수영하다',1],['see the sunset','노을을 보다',1]]],['visit the museum','박물관에 가다',0,[['learn a lot','많이 배우다',1]]],
 ['join the club','동아리에 들어가다',0,[['make new friends','새 친구들을 사귀다',1]]],['read the instructions','설명서를 읽다',0,[['build it correctly','그걸 제대로 조립하다',1],['break the toy','장난감을 망가뜨리다',0]]],
 ['bring a snack','간식을 가져오다',0,[['be so hungry','그렇게 배고프다',0]]],['get up earlier','더 일찍 일어나다',0,[['see the sunrise','해돋이를 보다',1],['eat breakfast','아침을 먹다',1]]],
 ['eat so much candy','사탕을 그렇게 많이 먹다',1,[['get a toothache','이가 아프다',0]]],['watch TV so long','TV를 그렇게 오래 보다',1,[['get a headache','머리가 아프다',0],['finish the homework','숙제를 끝내다',1]]],
 ['spend all the money','돈을 다 쓰다',1,[['buy the present','선물을 사다',1]]],['drop the phone','휴대폰을 떨어뜨리다',1,[['break it','그걸 망가뜨리다',0]]],
 ['run so fast','그렇게 빨리 뛰다',1,[['fall down','넘어지다',0]]],['shout so loudly','그렇게 크게 소리치다',1,[['wake the baby','아기를 깨우다',0]]],
 ['skip practice','연습을 빼먹다',1,[['lose the game','경기에서 지다',0],['play better','더 잘하다',1]]],['talk in class','수업 시간에 떠들다',1,[['get in trouble','혼나다',0],['hear the teacher','선생님 말씀을 듣다',1]]],
 ['eat the old bread','오래된 빵을 먹다',1,[['get a stomachache','배탈이 나다',0]]],['play in the rain','빗속에서 놀다',1,[['catch a cold','감기에 걸리다',0]]],['lie to Mom','엄마에게 거짓말하다',1,[['get in trouble','혼나다',0]]],
 ['take a different road','다른 길로 가다',1,[['get lost','길을 잃다',0]]],['forget the password','비밀번호를 잊어버리다',1,[['open the file','파일을 열다',1]]],
 ['leave the bag on the bus','가방을 버스에 두고 내리다',1,[['lose the homework','숙제를 잃어버리다',0]]]);
TM.push(['wear a coat','외투를 입다',0,[["wouldn't be cold now",'지금 춥지 않을 텐데']]],['charge the phone','휴대폰을 충전하다',0,[['could call Tom now','지금 톰에게 전화할 수 있을 텐데']]],
 ['drink water','물을 마시다',0,[["wouldn't be thirsty now",'지금 목마르지 않을 텐데']]],['eat lunch','점심을 먹다',0,[["wouldn't be hungry now",'지금 배고프지 않을 텐데']]],
 ['play games all night','밤새 게임을 하다',1,[["wouldn't be so tired now",'지금 이렇게 피곤하지 않을 텐데']]],['spend all the money','돈을 다 쓰다',1,[['could buy the book now','지금 그 책을 살 수 있을 텐데'],['would have some money now','지금 돈이 좀 있을 텐데']]],
 ['catch a cold','감기에 걸리다',1,[['could go to the party now','지금 파티에 갈 수 있을 텐데']]],['lose the ticket','표를 잃어버리다',1,[['would be on the train now','지금 기차에 타 있을 텐데']]],
 ['fix the bike','자전거를 고치다',0,[['could ride it now','지금 그걸 탈 수 있을 텐데']]],['practice more','더 연습하다',0,[['would be a better player now','지금 더 잘하는 선수일 텐데']]]);
ASIF.push(['were a king','왕인'],['were a robot','로봇인'],['were five years old','다섯 살인'],['were a famous singer','유명한 가수인'],['knew the answer','답을 아는'],["didn't care",'신경 안 쓰는'],
 ['had done nothing wrong','아무 잘못도 안 한'],['were the only one here','여기 혼자만 있는'],['were a little child','어린아이인'],['had been there before','전에 거기 가 본'],['were a doctor','의사인'],
 ['had lost something','뭔가를 잃어버린'],['were scared','겁먹은'],['were very happy','아주 행복한'],['were a superhero','슈퍼히어로인'],['had heard a funny joke','웃긴 농담을 들은']);
VWH.push(['walk to the store','가게에 걸어가다'],['cross the bridge','다리를 건너다'],['sit on the bench','벤치에 앉아 있다'],['play soccer','축구를 하다']);
VEV.push(['saw a cute cat','귀여운 고양이를 봤어'],['met {po} teacher','선생님을 만났어'],['found a wallet','지갑을 주웠어'],['heard someone call {po} name','누가 이름을 부르는 소리를 들었어']);
// W: 태그를 늘리고 새 꼴 붙이기
[['sat','o p g c k b i'],['stood there','p u c k b'],['slept','o g c k'],['fell asleep','o g c k b'],['read the book','g'],['listened','y'],['smiled','y'],['waited','u c k b'],['walked','b c k'],['walked home','c k b'],['watched the movie','g o'],['studied','g']].forEach(([v,t])=>{const x=WV.find(a=>a[0]===v);if(x)x[2]+=' '+t});
WV.push(['said goodbye','작별 인사를 했어','y e'],['sat on the floor','바닥에 앉아 있었어','e a n l t'],['sat at the desk','책상에 앉아 있었어','l t p g'],['lay on the grass','풀밭에 누워 있었어','e a'],['ate dinner','저녁을 먹었어','t m'],
 ['wrote a letter','편지를 썼어','m l t g'],['came into the room','방에 들어왔어','h c k b'],['left the house','집을 나섰어','c k b l t'],['went out','밖에 나갔어','w l t'],['rode a bike','자전거를 탔어','r'],['ran home','집으로 뛰어갔어','r b'],
 ['played games','게임을 했어','t l m f'],['cleaned the room','방을 청소했어','m w']);
WW2.push(['o','{po} mouth open','입을 벌린 채로'],['p','{po} back straight','허리를 곧게 편 채로'],['g','{po} glasses on','안경을 쓴 채로'],['c','{po} coat on','외투를 입은 채로'],['k','{po} cap on','모자를 쓴 채로'],
 ['u','{po} hands up','손을 든 채로'],['b','a book in {po} hand','손에 책을 든 채로'],['i','{po} feet in the water','발을 물에 담근 채로'],['y','tears in {po} eyes','눈에 눈물이 고인 채로']);
WDONT.push(['go out','밖에 나가다','{po} hair wet','머리가 젖은 채로'],['come in','들어오다','{po} shoes on','신발을 신은 채로'],['study','공부하다','the TV on','TV를 켠 채로'],
 ['eat','먹다','{po} phone in {po} hand','휴대폰을 손에 든 채로'],['leave','나가다','the lights on','불을 켠 채로']);
// X: 더 많은 사람 이야기 · 물건
XVP.push(['can play the drums','드럼을 칠 줄 알아'],['sings really well','노래를 정말 잘해'],['reads a book every day','매일 책을 한 권씩 읽어'],['has been to Canada','캐나다에 가 본 적이 있어'],
 ['loves cooking','요리를 아주 좋아해'],['wants to be a doctor','의사가 되고 싶어 해'],['always makes me laugh','늘 나를 웃게 해'],['goes swimming every morning','매일 아침 수영하러 가'],['is learning Chinese','중국어를 배우고 있어'],
 ['collects stamps','우표를 모아'],['plays chess very well','체스를 아주 잘 둬'],['was born in Jeju','제주에서 태어났어'],['writes funny stories','재미있는 이야기를 써'],['knows every bird name','새 이름을 다 알아']);
(function(){const f=v=>XTH.find(x=>x[0]===v);
 f('bought')[2].push(['a pair of shoes','신발 한 켤레'],['a new jacket','새 재킷']);
 f('read')[2].push(['a poem','시'],['a story about space','우주에 관한 이야기'],['a science book','과학책']);f('read')[3].push(['taught me a lot','나에게 많은 걸 가르쳐 줬어']);
 f('watched')[2].push(['a play','연극'],['a magic show','마술 쇼'],['a baseball game','야구 경기']);f('watched')[3].push(['ended very late','아주 늦게 끝났어']);
 f('made')[2].push(['a birdhouse','새집'],['a paper boat','종이배']);f('made')[3].push(['was not easy','쉽지 않았어']);
 f('visited')[2].push(['Busan','부산'],['a farm','농장'],['the science museum','과학관']);f('visited')[3].push(['was far from home','집에서 멀었어']);})();
XTH.push(['found','찾았는데',[['an old map','오래된 지도'],['a strange stone','이상한 돌'],['an old coin','오래된 동전']],[['was under the bed','침대 밑에 있었어'],['looked very strange','아주 이상하게 생겼어']]],
 ['got','받았는데',[['a present','선물'],['a letter','편지'],['a postcard','엽서']],[['made me very happy','나를 아주 기쁘게 했어'],['came from Canada','캐나다에서 왔어']]]);
// 64 whoever · whatever · however: 자동 생성
YV.push(['wear','입다','입어도'],['bring','가져오다','가져와도'],['order','주문하다','주문해도'],['write','쓰다','써도'],['cook','요리하다','요리해도'],['do','하다','해도'],['ask','물어보다','물어봐도']);
const YWN=[['feel sad','슬프다',[['listen to music','음악을 듣다'],['call Tom','톰에게 전화하다'],['draw pictures','그림을 그리다']]],['feel tired','피곤하다',[['take a short nap','잠깐 낮잠을 자다'],['drink some water','물을 좀 마시다']]],
 ['go to the beach','바닷가에 가다',[['build a sandcastle','모래성을 쌓다'],['look for shells','조개껍데기를 찾다']]],['visit Jeju','제주에 가다',[['eat a lot','많이 먹다'],['sleep well','잘 자다']]],
 ['have free time','시간이 나다',[['read comic books','만화책을 읽다'],['play soccer','축구를 하다'],['ride a bike','자전거를 타다']]],['hear this song','이 노래를 듣다',[['start to dance','춤을 추기 시작하다'],['sing along','따라 부르다']]],
 ['see a dog','개를 보다',[['want to pet it','쓰다듬고 싶다'],['smile','웃다']]],['go to the library','도서관에 가다',[['borrow three books','책을 세 권 빌리다'],['read for an hour','한 시간 동안 책을 읽다']]],
 ['get a cold','감기에 걸리다',[['drink warm tea','따뜻한 차를 마시다'],['stay in bed','침대에 누워 있다']]],['eat ice cream','아이스크림을 먹다',[['feel happy','기분이 좋다'],['choose chocolate','초콜릿 맛을 고르다']]],
 ['go camping','캠핑을 가다',[['look at the stars','별을 보다'],['cook ramen','라면을 끓이다']]],['feel nervous','긴장되다',[['take a deep breath','숨을 크게 쉬다'],['count to ten','열까지 세다']]],
 ['finish the homework','숙제를 끝내다',[['play games','게임을 하다'],['go outside','밖에 나가다']]],['get angry','화가 나다',[['go for a walk','산책하다'],['count to ten','열까지 세다']]],
 ['see a rainbow','무지개를 보다',[['make a wish','소원을 빌다'],['take a picture','사진을 찍다']]],['travel','여행을 가다',[['buy a postcard','엽서를 사다'],['keep a diary','일기를 쓰다']]],
 ['watch a scary movie','무서운 영화를 보다',[['hold a pillow','베개를 꼭 안다'],['turn on the light','불을 켜다']]]];
const YWR=[['take {po} camera','카메라를 가져가다'],['take {po} notebook','공책을 가져가다'],['wear {po} cap','모자를 쓰다'],['make new friends','새 친구를 사귀다'],['carry an umbrella','우산을 들고 다니다'],
 ['take pictures','사진을 찍다'],['look for a good restaurant','맛집을 찾다'],['buy a postcard','엽서를 사다']];
const YHP=[['tired','피곤하다',[['brush {po} teeth','이를 닦다'],['finish {po} homework','숙제를 끝내다'],['wash {po} hands','손을 씻다']]],['busy','바쁘다',[['eat breakfast','아침을 먹다'],['get enough sleep','잠을 충분히 자다']]],
 ['hungry','배가 고프다',[['wash {po} hands first','먼저 손을 씻다'],['wait for everyone','모두를 기다리다']]],['angry','화가 나다',[['speak kindly','친절하게 말하다'],['listen first','먼저 듣다']]],
 ['scared','무섭다',[['tell the truth','사실대로 말하다']]],['excited','신나다',[['walk in the hallway','복도에서는 걷다'],['listen to the teacher','선생님 말씀을 듣다']]],
 ['sleepy','졸리다',[['finish {po} homework','숙제를 끝내다'],['brush {po} teeth','이를 닦다']]]];
const YWO=[['finishes first','먼저 끝내는','g'],['answers first','먼저 대답하는','g'],['gets the most points','점수를 가장 많이 받는','g'],['finds the key','열쇠를 찾는','g'],['wins the race','경주에서 이기는','g'],
 ['comes last','마지막에 오는','b'],['breaks the rule','규칙을 어기는','b'],['loses the game','게임에서 지는','b'],['wants to come','오고 싶은','w'],['wants to help','돕고 싶은','w'],['needs help','도움이 필요한','n']];
const YWOR={g:[['will get a prize','상을 받을 거야'],['can choose the next game','다음 게임을 고를 수 있어'],['can go home first','먼저 집에 갈 수 있어']],b:[['will clean the classroom','교실을 청소할 거야'],['must sing a song','노래를 한 곡 불러야 해'],['will wash the dishes','설거지를 할 거야']],
 w:[['can join us','같이해도 돼'],['is welcome','환영이야']],n:[['can ask me','나에게 물어봐도 돼'],['should raise a hand','손을 들어야 해']]};
const beOf=S=>S.be;
function Y2Skel(r){const S=pick(r,HS),w=pick(r,YWN),h=pick(r,YHP),o=pick(r,YWO);return {S,v:pick(r,YV),w,wr:pick(r,w[2]),wh:pick(r,YWR),h,hr:pick(r,h[2]),o,or:pick(r,YWOR[o[2]]),f:pick(r,YF)}}
function Y2Form(k,f){const S=k.S;let en,ko;switch(f){
  case 'Y_fix':return {en:k.f[0],ko:k.f[1],w:[]};
  case 'Y_what':{const v=k.v;en=SEN([S.en,'can',v[0],'whatever',S.pr,s3(S,'want')]);ko=D([S.top,'원하는 건',v[0]==='play'?'뭐든지 하고 놀아도 돼':'뭐든지 '+v[2]+' 돼']);return {en,ko,w:[chip(v[1],v[0])]}}
  case 'Y_when':{const w=k.w,x=k.wr;en=cap('whenever '+S.en+' '+s3(S,w[0]))+', '+S.pr+' '+s3(S,po2(x[0],S))+'.';ko=S.top+' '+KO.L(w[1])+' 때마다 '+KO.A(po2(x[1],S))+'.';return {en,ko,w:[chip(w[1],w[0])]}}
  case 'Y_where':{const x=k.wh;en=cap('wherever '+S.en+' '+s3(S,'go'))+', '+S.pr+' '+s3(S,po2(x[0],S))+'.';ko=S.top+' 어디에 가든지 '+KO.A(x[1])+'.';return {en,ko,w:[]}}
  case 'Y_how':{const h=k.h,x=k.hr;en=cap('however '+h[0]+' '+S.en+' '+beOf(S))+', '+S.pr+' should '+po2(x[0],S)+'.';ko='아무리 '+KO.A(h[1])+'도 '+S.top+' '+KO.A(x[1])+'야 해.';return {en,ko,w:[chip(h[1],h[0])]}}
  case 'Y_who':{const o=k.o,x=k.or;en=cap('whoever '+o[0]+' '+x[0])+'.';ko='누구든지 '+o[1]+' 사람은 '+x[1]+'.';return {en,ko,w:[]}}}}
// 65 강조 · 도치: 자동 생성
ZDO.push(['made this cake','이 케이크를 만들다'],['cleaned the room','방을 청소하다'],['told me the news','나에게 그 소식을 알려 주다'],['helped me','나를 도와주다'],['took my pencil','내 연필을 가져가다'],
 ['sent this letter','이 편지를 보내다'],['turned off the light','불을 끄다'],['wrote this song','이 노래를 쓰다'],['found the puppy','강아지를 찾다'],['left the door open','문을 열어 두다']);
const ZWHO=NMP.concat([['my mom','엄마'],['my dad','아빠'],['the teacher','선생님'],['my friend','내 친구']]);
const ZW=[['in the park','공원에서였어'],['yesterday','어제였어'],['at school','학교에서였어'],['last Sunday','지난 일요일이었어'],['in the library','도서관에서였어'],['at the zoo','동물원에서였어'],['this morning','오늘 아침이었어'],['at the beach','바닷가에서였어']];
const ZE=[['I found the key','내가 열쇠를 찾은'],['we met Tom','우리가 톰을 만난'],['I lost my cap','내가 모자를 잃어버린'],['Mina saw the cat','미나가 그 고양이를 본'],['we played soccer','우리가 축구를 한'],['he broke his phone','그가 휴대폰을 망가뜨린'],
 ['I took this picture','내가 이 사진을 찍은'],['she learned to ride a bike','그녀가 자전거 타는 법을 배운'],['they had a picnic','그들이 소풍을 한']];
ZSO.push(['likes cats','고양이를 좋아해','do','so'],['plays the piano','피아노를 쳐','do','so'],['can ride a bike','자전거를 탈 수 있어','can','so'],['is tired','피곤해','am','so'],['was late','늦었어','was','so'],
 ['ate pizza','피자를 먹었어','did','so'],['wants to go home','집에 가고 싶어 해','do','so'],['can speak English','영어를 할 수 있어','can','so'],['was at the park','공원에 있었어','was','so'],['watched the movie','그 영화를 봤어','did','so'],
 ["doesn't eat fish",'생선을 안 먹어','do','neither'],["can't swim",'수영을 못 해','can','neither'],["isn't hungry",'배가 안 고파','am','neither'],["didn't see it",'그걸 못 봤어','did','neither'],["wasn't ready",'준비가 안 됐었어','was','neither'],
 ["doesn't like spiders",'거미를 안 좋아해','do','neither'],['has been to Jeju','제주에 가 본 적이 있어','have','so'],["hasn't finished yet",'아직 다 못 끝냈어','have','neither'],['will come','올 거야','will','so'],["won't be late",'안 늦을 거야','will','neither']);
const ZS1=[NP('my friend','내 친구',12)].concat(HS.filter(x=>x.s&&x.g!==1));
const ZS2=[PS[0],PS[4],PS[5]].concat(NMP.slice(0,6).map((x,i)=>NP(x[0],x[1],40+i)),[NP('my mom','엄마',6),NP('my dad','아빠',7)]);
const zAux=(a,S)=>a==='do'?(S.s?'does':'do'):a==='am'?beOf(S):a==='was'?S.was:a==='have'?(S.s?'has':'have'):a;
const ZNS=[['big fish','그렇게 큰 물고기'],['tall tree','그렇게 큰 나무'],['beautiful sunset','그렇게 아름다운 노을'],['funny movie','그렇게 웃긴 영화'],['cute puppy','그렇게 귀여운 강아지'],['long line','그렇게 긴 줄'],
 ['huge cake','그렇게 커다란 케이크'],['strange bird','그렇게 이상한 새'],['bright star','그렇게 밝은 별'],['crowded beach','그렇게 붐비는 바닷가']];
function Z2Skel(r){for(let g=0;g<50;g++){const S1=pick(r,ZS1),S2=pick(r,ZS2);if(S1.en===S2.en)continue;const a1=pick(r,ASA.filter(x=>!/old|busy/.test(x[0])));const a2=pick(r,ASA.filter(x=>!/old|busy/.test(x[0])&&x!==a1));
  return {n:pick(r,ZWHO),d:pick(r,ZDO),zw:pick(r,ZW),ze:pick(r,ZE),S1,S2,so:pick(r,ZSO),nv:pick(r,ZNV),N:pick(r,[PS[0],PS[2],PS[3],PS[4],PS[5]]),ns:pick(r,ZNS),A:pick(r,HS.filter(x=>x.s)),a1,a2}}throw new Error('no Z')}
function Z2Form(k,f){let en,ko;switch(f){
  case 'Z_it':en=SEN(['it was',k.n[0],'that',k.d[0]]);ko=D([KO.N(k.d[1]),'건 바로',josa(k.n[1],'이었어/였어')]);return {en,ko,alt:[en.replace(' that ',' who ')],w:[]};
  case 'Z_itw':en=SEN(['it was',k.zw[0],'that',k.ze[0]]);ko=D([k.ze[1],'건 바로',k.zw[1]]);return {en,ko,w:[]};
  case 'Z_so':{const x=k.so,A=k.S1,B=k.S2;en=cap(A.en)+' '+x[0]+', and '+x[3]+' '+zAux(x[2],B)+' '+B.en+'.';ko=A.top+' '+x[1]+', '+B.ko+'도 그래.';return {en,ko,w:[]}}
  case 'Z_nv':{const S=k.N;en='Never '+(S.s?'has':'have')+' '+S.en+' seen such a '+k.ns[0]+'.';ko=S.top+' '+josa(k.ns[1],'을/를')+' 한 번도 본 적이 없어.';return {en,ko,w:[]}}
  case 'Z_fix':return {en:k.nv[0],ko:k.nv[1],w:[]};
  case 'Z_not':{const A=k.A;en='Not only '+A.be+' '+A.en+' '+k.a1[0]+', but '+A.pr+' '+A.be+' also '+k.a2[0]+'.';ko=A.top+' '+KO.L(k.a1[1])+' 뿐만 아니라 '+KO.S(k.a2[1])+'기도 해.';return {en,ko,w:[]}}}}
// 66 to · -ing · 수일치 · 시제일치: 자동 생성
RMA.push(['turn off the TV','TV를 끄다'],['take the medicine','약을 먹다'],['buy some milk','우유를 사다'],['send the letter','편지를 보내다'],['charge the phone','휴대폰을 충전하다'],['wash the dishes','설거지를 하다'],
 ['set the alarm','알람을 맞추다'],['return the book','책을 반납하다'],['take out the trash','쓰레기를 내다 버리다'],['clean the table','식탁을 닦다'],['bring the ticket','표를 가져오다'],['meet the coach at three','3시에 코치님을 만나다']);
const AFG=[['meeting the famous singer','그 유명한 가수를 만났던'],['seeing the sea for the first time','처음 바다를 봤던'],['riding the roller coaster','롤러코스터를 탔던'],['winning the race','경주에서 이겼던'],['visiting Jeju','제주에 갔던'],['seeing the fireworks','불꽃놀이를 봤던']];
const ASTI=[['eating snacks','과자 먹는 걸 그만뒀어'],['playing games','게임하는 걸 그만뒀어'],['crying','울음을 그쳤어'],['talking','이야기를 멈췄어'],['drinking soda','탄산음료 마시는 걸 끊었어'],['biting {po} nails','손톱 물어뜯는 걸 그만뒀어'],['watching TV','TV 보는 걸 멈췄어'],['laughing','웃음을 멈췄어']];
const ASTT=[['drink water','물을 마시다'],['take a picture','사진을 찍다'],['tie {po} shoes','신발 끈을 묶다'],['look at the map','지도를 보다'],['buy some water','물을 사다'],['talk to a friend','친구와 이야기하다'],['rest','쉬다']];
const AQS=[['each student','학생마다',1],['every child','모든 아이가',1],['everyone in my class','우리 반 모두가',1],['one of my friends','내 친구들 중 한 명이',1],['each of the boys','남자아이들 각자가',1],
 ['both of my friends','내 친구 둘 다',0],['most of the students','학생들 대부분이',0],['a lot of children','많은 아이들이',0],['all of us','우리 모두',0],['many people','많은 사람들이',0],['the boys in the park','공원에 있는 남자아이들이',0]];
const AQV=[['has a phone','have a phone','휴대폰을 가지고 있어'],['likes this game','like this game','이 게임을 좋아해'],['wants to win','want to win','이기고 싶어 해'],['knows the answer','know the answer','답을 알아'],
 ['is excited','are excited','신이 났어'],['brings lunch','bring lunch','도시락을 가져와'],['lives near here','live near here','이 근처에 살아'],['plays soccer','play soccer','축구를 해'],['is ready','are ready','준비가 됐어'],['was late','were late','늦었어']];
SAID.push(['ready','준비가 됐다'],['scared','무섭다'],['full','배가 부르다'],['cold','춥다'],['excited','신이 난다'],['fine','괜찮다']);
SAIDW.push(['win','이기다'],['call back','다시 전화하다'],['finish it soon','곧 끝내다'],['bring snacks','간식을 가져오다'],['clean the room','방을 청소하다']);
const SAIDH=[['finished the homework','숙제를 끝내다'],['seen the movie','그 영화를 보다'],['lost the key','열쇠를 잃어버리다'],['eaten lunch','점심을 먹다'],['been to Jeju','제주에 가 보다'],['met Tom before','전에 톰을 만나 보다']];
function a2Skel(r){const S=pick(r,HS);return {S,m:pick(r,RMA),g:pick(r,AGR),sa:pick(r,SAID),sw:pick(r,SAIDW),sh:pick(r,SAIDH),fg:pick(r,AFG),si:pick(r,ASTI),stt:pick(r,ASTT),qs:pick(r,AQS),qv:pick(r,AQV),q:r()}}
function a2Form(k,f){const S=k.S,m=k.m,pr=S.pr;let en,ko;const ing=x=>{const h=x.split(' ')[0];return EN.ing(h)+x.slice(h.length)};
  switch(f){
  case 'a_remto':en=SEN(['remember to',m[0]]);ko=D(['잊지 말고',KO.A(m[1])]);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_reming':en=SEN([S.en,s3(S,'remember'),ing(m[0])]);ko=D([S.top,KO.N(m[1]),'걸 기억해']);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_remed':en=SEN([S.en,'remembered to',m[0]]);ko=D([S.top,'잊지 않고',KO.P(m[1])]);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_forgetto':en=SEN([S.en,'forgot to',m[0]]);ko=D([S.top,KO.NE(m[1]),'걸 깜빡했어']);return {en,ko,w:[chip(m[1],m[0])]};
  case 'a_never':en=SEN([S.en,'will never forget',k.fg[0]]);ko=D([S.top,k.fg[1],'걸 절대 잊지 못할 거야']);return {en,ko,w:[]};
  case 'a_stop':en=SEN([S.en,'stopped',po2(k.si[0],S)]);ko=D([S.top,k.si[1]]);return {en,ko,w:[]};
  case 'a_stopto':en=SEN([S.en,'stopped to',po2(k.stt[0],S)]);ko=D([S.top,KO.R(k.stt[1]),'멈췄어']);return {en,ko,w:[chip(k.stt[1],k.stt[0].split(' ')[0])]};
  case 'a_agree':return {en:k.g[0],ko:k.g[1],w:[]};
  case 'a_agr2':{const s=k.qs,v=k.qv;en=SEN([s[0],s[2]?v[0]:v[1]]);ko=D([s[1],v[2]]);return {en,ko,w:[]}}
  case 'a_said':{const be=S.was;if(k.q<.4){en=SEN([S.en,'said that',pr,be,k.sa[0]]);ko=D([S.top,k.sa[1]+'고 말했어'])}
    else if(k.q<.75){en=SEN([S.en,'said that',pr,'would',k.sw[0]]);ko=D([S.top,KO.L(k.sw[1]),'거라고 말했어'])}
    else{en=SEN([S.en,'said that',pr,'had',k.sh[0]]);ko=D([S.top,KO.Pst(k.sh[1])+'다고 말했어'])}
    return {en,ko,alt:[en.replace(' that ',' ')],w:[]}}}}
// 54 관계부사: 자동 생성
const LPL=[['park','공원',[['play soccer','축구를 하다'],['ride bikes','자전거를 타다'],['have picnics','소풍을 하다']]],['library','도서관',[['read books','책을 읽다'],['study after school','방과 후에 공부하다'],['borrow books','책을 빌리다']]],
 ['school','학교',[['study every day','매일 공부하다'],['eat lunch','점심을 먹다'],['play basketball','농구를 하다']]],['restaurant','식당',[['eat pizza','피자를 먹다'],['have dinner on Sundays','일요일마다 저녁을 먹다']]],
 ['store','가게',[['buy snacks','과자를 사다'],['buy pencils','연필을 사다']]],['pool','수영장',[['swim','수영하다'],['take swimming lessons','수영 수업을 듣다']]],['beach','바닷가',[['build sandcastles','모래성을 쌓다'],['swim in summer','여름에 수영하다']]],
 ['room','방',[['sleep','자다'],['do homework','숙제를 하다']]],['bakery','빵집',[['buy bread','빵을 사다']]],['playground','놀이터',[['play after school','방과 후에 놀다']]]];
const LDY=[['learned to swim','수영을 배우다'],['moved here','여기로 이사 오다'],['won the race','경주에서 이기다'],['got lost','길을 잃다'],['went to the zoo','동물원에 가다'],['saw snow for the first time','처음으로 눈을 보다'],['met Tom','톰을 만나다'],['lost the key','열쇠를 잃어버리다']];
const LRY=[['left early','일찍 가다'],['cried','울다'],['got angry','화가 나다'],['moved','이사하다'],['chose this book','이 책을 고르다'],['said that','그런 말을 하다'],['missed the bus','버스를 놓치다'],['came back','돌아오다'],['laughed','웃다']];
const LHO=[['made the cake','케이크를 만들다'],['solved the problem','문제를 풀다'],['built the sandcastle','모래성을 쌓다'],['learned English','영어를 배우다'],['fixed the bike','자전거를 고치다'],['won the game','경기에서 이기다'],['found the key','열쇠를 찾다'],['opened the box','상자를 열다']];
const LTM=[['the day','날'],['the summer','여름'],['the time','때']];
function L2Skel(r){const p=pick(r,LPL);return {S:pick(r,PS),p,pc:pick(r,p[2]),dy:pick(r,LDY),tm:pick(r,LTM),ry:pick(r,LRY),ho:pick(r,LHO),S2:pick(r,PS.filter(x=>x.g!==1)),R:pick(r,[PS[0],PS[2],PS[3],PS[4]])}}
function L2Form(k,f){const S=k.S;let en,ko,alt=[];switch(f){
  case 'L_where':en=SEN(['this is the',k.p[0],'where',S.en,s3(S,k.pc[0])]);ko=D(['여기가',S.nom,KO.NE(k.pc[1]),COP.pos(k.p[1])]);break;
  case 'L_when':{const R=k.R,t=k.tm;en=SEN([R.en,s3(R,'remember'),t[0],'when',S.en,k.dy[0]]);ko=D([R.top,S.nom,KO.N(k.dy[1]),josa(t[1],'을/를'),'기억해']);alt=[en.replace(' when ',' ')];break}
  case 'L_why':{const S2=k.S2;en=SEN(['tell me the reason why',S2.en,k.ry[0]]);ko=D([S2.nom,KO.N(k.ry[1]),'이유를 말해 줘']);alt=[en.replace(' the reason why',' why'),en.replace(' why ',' ')];break}
  case 'L_how':en=SEN(['this is how',S.en,k.ho[0]]);ko=D(['이게',S.nom,KO.N(k.ho[1]),'방법이야']);alt=[en.replace('how','the way')];break}
  return {en,ko,alt,w:[]}}
// ───────── 더 채우기 3(엄마 11/28 「채워줘」): 적은 단계 모두 ─────────
// 2단계: 성격 + 직업(a kind doctor · an honest doctor ↔ kind doctors)
const PTR=new Set(['cute','fast','slow','weak','lazy','rude','young','famous']);
const zSkel0=zSkel;
function zSkel3(r,lap,c){const k=zSkel0(r,lap,c);const ta=lvPick(r,ADJ.filter(a=>/tr/.test(a.f)&&!/\bc\b/.test(a.f)&&!a.n&&!PTR.has(a.en)),lap);return Object.assign(k,{ta,zn:z2Skel(r,lap)})}
function zForm3(k,f){if(f==='z_itsg'||f==='z_itpl')return z2Form(k.zn,f);if(f!=='z_jsg'&&f!=='z_jpl')return zForm(k,f);const a=k.ta,j=k.job;
  if(f==='z_jsg'){const S=k.j1;return {en:SEN([S.en,S.t==='me'?'am':S.s?'is':'are',AN(a.en),a.en,j.en]),ko:KSEN([S.top,COP.pos(KO.N(a.ko)+' '+j.ko)]),alt:[],w:[chip(a.ko,a.en),chip(j.ko,j.en)]}}
  const S=k.j2.en.includes(j.pl)?SUBJ[5]:k.j2;return {en:SEN([S.en,'are',a.en,j.pl]),ko:KSEN([S.top,COP.pos(KO.N(a.ko)+' '+j.ko+'들')]),alt:[],w:[chip(a.ko,a.en),chip(j.ko,j.en)]}}
// 2단계: 그건 ~야 / 그것들은 ~들이야 (a big bag · an expensive bag ↔ big bags)
function z2Skel(r,lap){for(let g=0;g<100;g++){const n=lvPick(r,NT,lap);const as=taFor(n,lap);if(!as.length)continue;return {n,a:pick(r,as),bare:r()<.3}}throw new Error('no z2')}
function z2Form(k,f){const {n,a}=k;const pl=f==='z_itpl';const adj=k.bare?null:a;const nE=pl?n.pl:n.en;
  const en=pl?SEN(['they are',adj&&adj.en,nE]):SEN(['it is',AN(adj?adj.en:n.en),adj&&adj.en,nE]);
  const ko=KSEN([pl?'그것들은':'그건',COP.pos((adj?KO.N(adj.ko)+' ':'')+kN(n,pl))]);
  return {en,ko,alt:[en.replace(/^It is/,"It's").replace(/^They are/,"They're")],w:[nChip(n)].concat(adj?[chip(adj.ko,adj.en)]:[])}}
// 12단계: 이름 불러서 · please · 놀이 낱말로 Let's
const MNM=[['Tom','톰'],['Mina','미나'],['Jake','제이크'],['Yuna','유나'],['Ben','벤'],['Sora','소라']];
IMP.forEach(i=>{if(/^(put on your coat|raise your hand)$/.test(i.en))i.m=i.m.replace('l','')});
function m3Skel(r,lap){const k=mSkel(r,lap);const v=pick(r,VP.filter(x=>x.h&&!x.st&&!x.po&&!x.n&&x.o&&x.lv<=lap&&!/like|love|have|know|want|need/.test(x.e)));const o=lvPick(r,v.o.filter(o=>!/x[AOK]/.test(o.f)&&!/\{po\}/.test(o.en)),lap);
  return Object.assign(k,{v,o,nm:r()<.5?pick(r,MNM):null,pl:r()<.5})}
function m3Form(k,f){const nm=k.nm;const call=(x,ko)=>nm?{en:nm[0]+', '+x.charAt(0).toLowerCase()+x.slice(1),ko:nm[1]+', '+ko}:{en:x,ko};
  if(f==='m_lets2'){if(!k.o)return mForm(k,'m_lets');const ob=k.o,v=k.v;const K={s:SUBJ[4],v,o:ob,th:1,tp:1,tf:1,tw:0};const P=vForm(K,'v_pos');
    const x=call("Let's "+P.en.replace(/^We /,'').replace(/ (every day|on weekends|in the morning|after school|every morning)\.$/,'.'),KSEN([oKo(K),KO.S(v.k)+'자']));return {en:x.en,ko:x.ko,alt:[],w:P.w}}
  if(f==='m_please'){const i=k.d;if(/^be |^try /.test(i.en))return m3Form(k,'m_do2');const x=call('Please '+i.en+'.',KO.A(i.ko)+' 줘.');const y=call(SEN([i.en]).replace(/\.$/,', please.'),'');return {en:x.en,ko:x.ko,alt:[y.en],w:[chip(i.ko,i.en)]}}
  if(f==='m_do2'){const i=k.d;const x=call(SEN([i.en]),KSEN([i.en==='be honest'?'정직하게 행동해':KO.A(i.ko)]));return {en:x.en,ko:x.ko,alt:[],w:[chip(i.ko,i.en)]}}
  if(f==='m_dont2'){const i=k.n;const x=call(SEN(["don't",i.en]),KSEN([KO.S(i.ko)+'지 마']));return {en:x.en,ko:x.ko,alt:[x.en.replace("Don't","Do not").replace("don't","do not")],w:[chip(i.ko,i.en)]}}
  return mForm(k,f)}
// 16단계: 묻는 사람 늘리기 · 누구 거야 대답
WS.push(['your teacher','너희 선생님',1],['your grandma','너희 할머니',1],['your grandpa','너희 할아버지',1],['your friends','네 친구들'],['your classmates','너희 반 친구들'],['we','우리'],
 ['Tom','톰',1],['Mina','미나',1],['Jake','제이크',1],['Yuna','유나',1]);
WOLD.push(['your friend','네 친구'],['your classmate','너희 반 친구'],['Tom','톰'],['Mina','미나'],['the puppy','그 강아지'],['your neighbor','너희 이웃']);
WGO.push(['the pool','수영장에'],['the beach','해변에'],['the museum','박물관에',null,2],['the store','가게에'],['the station','역에',null,2]);
const WOWN=[['Tom','톰'],['Mina','미나'],['Jake','제이크'],['Yuna','유나'],['Ben','벤'],['Sora','소라'],['my grandma','할머니'],['my cousin','내 사촌'],['my classmate','우리 반 친구'],['my mom','엄마'],['my dad','아빠'],['my friend','내 친구'],['the teacher','선생님']];
const w0Skel=wSkel;function w3Skel(r,lap,c){return Object.assign(w0Skel(r,lap,c),{ow:pick(r,WOWN)})}
function w3Form(k,f){const o=k.o,w=k.ow;if(f==='w_whoseans')return {en:SEN(["it's",w[0]+"'s",o.en]),ko:KSEN(['그건',COP.pos(w[1]+'의 '+o.ko)]),alt:[SEN(['it is',w[0]+"'s",o.en]),SEN(["it's",w[0]+"'s"])],w:[nChip(o)]};
  if(f==='w_whoseanspl')return {en:SEN(["they're",w[0]+"'s",o.pl]),ko:KSEN(['그것들은',COP.pos(w[1]+'의 '+o.ko+'들')]),alt:[SEN(['they are',w[0]+"'s",o.pl])],w:[nChip(o)]};
  return wForm(k,f)}
// 20단계: 날씨 · 곳 · 지난 때
WEA.push(['nice','날씨가 좋다'],['chilly','쌀쌀하다',2],['stormy','폭풍이 치다',2],['bright','밝다']);
WNOW.push(['in Daegu','대구는'],['in Gwangju','광주는'],['in Incheon','인천은'],['in Tokyo','도쿄는'],['in New York','뉴욕은',2],['in Paris','파리는',2],['in my town','우리 동네는'],['here','여기는'],['in the city','도시는'],['at school','학교는']);
WPAST.push(['last Sunday','지난 일요일은'],['two days ago','이틀 전에는']);
const WPL=[['in Busan','부산은'],['in Seoul','서울은'],['in Jeju','제주는'],['in Daegu','대구는'],['in Tokyo','도쿄는'],['at the beach','해변은'],['in the mountains','산은'],['in my town','우리 동네는']];
const WPT=[['yesterday','어제'],['last night','어젯밤'],['last weekend','지난 주말'],['last Sunday','지난 일요일'],['this morning','오늘 아침']];
function u3Skel(r,lap){const k=uSkel(r,lap);return Object.assign(k,{now:k.w[0]==='dark'||k.w[0]==='bright'?pick(r,WNOW.filter(x=>/outside|here|today/.test(x[0]))):pick(r,WNOW.filter(x=>(x[2]||1)<=lap)),pl:pick(r,WPL),pt:pick(r,WPT)})}
function u3Form(k,f){const W=k.w,L=k.pl,T=k.pt;const kt=T[1]+' '+L[1];
  switch(f){
  case 'u_wpp':return {en:SEN(['it was',W[0],L[0],T[0]]),ko:KSEN([kt,KO.P(W[1])]),alt:[],w:[chip(W[1],W[0])]};
  case 'u_wpneg':return {en:SEN(["it wasn't",W[0],L[0],T[0]]),ko:KSEN([kt,KO.S(W[1])+'지 않았어']),alt:[SEN(['it was not',W[0],L[0],T[0]])],w:[chip(W[1],W[0])]};
  case 'u_wpq':return {en:SEN(['was it',W[0],L[0],T[0]],1),ko:KSEN([kt,KO.P(W[1])],1),alt:[],w:[chip(W[1],W[0])]}}
  return uForm(k,f)}
// 29단계: 꾸미는 말 더 · 저 ~ 는 정말 ~구나
TA.push({en:'long',ko:'길다',c:'o',lv:1,only:['pencil','umbrella','bench','ladder','knife','brush']},{en:'funny',ko:'웃기다',c:'a',lv:1},{en:'smart',ko:'똑똑하다',c:'a',lv:1},{en:'beautiful',ko:'아름답다',c:'ol',lv:1,only:['flower','picture','leaf','bag','hat','doll','dish','cup']},{en:'round',ko:'둥글다',c:'of',lv:1,only:['ball','dish','cookie','orange','apple','watch','cup']},
 {en:'lovely',ko:'사랑스럽다',c:'al',lv:2},{en:'colorful',ko:'알록달록하다',c:'ol',lv:2,only:['ball','bag','hat','picture','flower','umbrella','toy','leaf']});
function y3Form(k,f){const {n,a}=k;if(f==='y_howthat')return {en:EX(['how',a.en,'that',n.en,'is']),ko:'저 '+josa(n.ko,'은/는')+' 정말 '+KO.S(a.ko)+'구나!',w:[nChip(n),chip(a.ko,a.en)]};
  if(f==='y_howthose')return {en:EX(['how',a.en,'those',n.pl,'are']),ko:'저 '+josa(n.ko+'들','은/는')+' 정말 '+KO.S(a.ko)+'구나!',w:[nChip(n),chip(a.ko,a.en)]};
  return yForm(k,f)}
// 40단계: 감정 · 주어 늘리기
const EMO3={happy:'행복하다',sad:'슬프다',angry:'화가 나다',tired:'피곤하다',excited:'신나다',nervous:'긴장되다',sleepy:'졸리다',hungry:'배고프다',bored:'심심하다',worried:'걱정되다',proud:'뿌듯하다',calm:'차분하다',thirsty:'목마르다'};
const MK2=[['the movie','그 영화','happy sad excited sleepy bored'],['the song','그 노래','happy sad calm sleepy'],['the news','그 소식','happy sad angry excited worried'],['the game','그 경기','excited tired nervous'],
 ['the story','그 이야기','sad happy sleepy'],['the letter','그 편지','happy sad'],['his joke','그의 농담','happy'],['the test','그 시험','nervous tired worried'],['the long walk','오래 걷기','tired hungry thirsty'],
 ['the cartoon','그 만화','happy excited'],['the gift','그 선물','happy excited'],['the music','그 음악','calm happy sleepy'],['the rain','그 비','sad calm'],['the loud noise','그 큰 소리','angry nervous'],
 ['the hot weather','더운 날씨','tired thirsty'],['the scary movie','그 무서운 영화','nervous'],['the good news','그 좋은 소식','happy excited proud'],['the homework','그 숙제','tired bored'],['the race','그 경주','tired thirsty hungry excited']];
FND.push(['the show','그 쇼'],['the trip','그 여행'],['the book about space','우주에 관한 책'],['the new game','새 게임'],['the math test','수학 시험'],['the movie about dinosaurs','공룡 영화'],['the homework','그 숙제']);
FNA.push(['scary','무섭다'],['funny','웃기다'],['strange','이상하다'],['useful','유용하다']);
FNA.forEach(x=>{if(x[0]==='exciting')x[1]='흥미진진하다'});
function D3Skel(r,lap){const k=DSkel(r,lap);const m=pick(r,MK2),e=pick(r,m[2].split(' '));return Object.assign(k,{m:[m[0],m[1]],a:[e,EMO3[e]],O:pick(r,HS),Ok:pick(r,HS),S:pick(r,HS),S2:pick(r,HS.filter(x=>x.g!==2))})}
// 42단계
SEEV.push(['jump','뛰어오르다'],['sing','노래하다'],['walk home','집에 걸어가다'],['open the door','문을 열다'],['eat lunch','점심을 먹다'],['draw a picture','그림을 그리다']);
HEARV.push(['come in','들어오다'],['play the guitar','기타를 치다'],['sneeze','재채기하다'],['call my name','내 이름을 부르다']);
LETV.push(['play outside','밖에서 놀다'],['have a cookie','쿠키를 먹다'],['choose the movie','영화를 고르다'],['sleep over','자고 가다']);
MAKEV.push(['wash the dishes','설거지를 하다'],['finish the homework','숙제를 끝내다'],['take a bath','목욕하다'],['wear a coat','외투를 입다']);
function F3Skel(r,lap){for(let g=0;g<100;g++){const S=pick(r,HS),O=pick(r,HS.concat(SEEO));if(S.g===O.g||(S.g===1&&O.g===1))continue;const S2=pick(r,ADU.concat([PS[2],PS[3]],HS.slice(6))),O2=pick(r,HS.filter(x=>x.g!==S2.g&&!(x.g===1&&S2.g===1)));
  const hv=pick(r,HEARV.filter(x=>!(O.en==='the dog'&&!/^(cry)$/.test(x[0]))&&!(x[0]==='call my name'&&(S.g===1||O.g===1))));
  return {S,O,S2,O2,sv:pick(r,SEEV.filter(x=>!(O.en==='the dog'&&!/^(run|swim|jump)$/.test(x[0])))),hv,lv:pick(r,LETV),mv:pick(r,MAKEV)}}throw new Error('no F')}
// 43단계
TOO.push(['tired','피곤하다','play outside','밖에서 놀다'],['tired','피곤하다','do the homework','숙제를 하다'],['full','배가 부르다','eat dessert','디저트를 먹다'],['sleepy','졸리다','watch the movie','영화를 보다'],
 ['busy','바쁘다','call Grandma','할머니께 전화하다'],['short','키가 작다','ride the roller coaster','롤러코스터를 타다'],['sick','아프다','play soccer','축구를 하다'],['scared','무섭다','watch the movie','그 영화를 보다'],
 ['nervous','긴장되다','sing on stage','무대에서 노래하다'],['young','어리다','watch this movie','이 영화를 보다'],['weak','힘이 약하다','open the jar','병뚜껑을 열다'],['hungry','배가 고프다','study','공부하다'],['sleepy','졸리다','read the book','그 책을 읽다']);
ENG.push(['tall','키가 크다','ride the roller coaster','롤러코스터를 타다'],['strong','힘이 세다','open the jar','병뚜껑을 열다'],['fast','빠르다','catch the bus','버스를 타다'],['brave','용감하다','touch the snake','뱀을 만지다'],
 ['smart','똑똑하다','answer the question','그 질문에 답하다'],['big','크다','go to school alone','혼자 학교에 가다']);
HOWTO.push(['draw a cat','고양이를 그리다'],['make a paper plane','종이비행기를 접다'],['play the guitar','기타를 치다'],['use chopsticks','젓가락을 쓰다'],['cook rice','밥을 하다'],['ski','스키를 타다'],['whistle','휘파람을 불다'],['dance','춤을 추다'],['fold a shirt','셔츠를 개다'],['read a map','지도를 보다']);
WTO.push(['who to ask','누구에게 물어봐야 할지'],['how to start','어떻게 시작해야 할지'],['where to sit','어디에 앉아야 할지'],['which book to read','어떤 책을 읽어야 할지']);
function G3Skel(r,lap){return Object.assign(GSkel(r,lap),{S:pick(r,HS),S2:pick(r,HS)})}
function G3Form(k,f){if(f==='G_learn'){const x=k.h,S=k.S2;return {en:SEN([S.en,'learned how to',x[0]]),ko:D([S.top,KO.NE(x[1]),'법을 배웠어']),w:[chip(x[1],x[0])]}}
  if(f==='G_what'){const x=k.w,S=k.S2;return {en:SEN([S.en,S.s?"doesn't":"don't",'know',x[0]]),ko:D([S.top,x[1],S.g===1&&S.en==='I'?'모르겠어':'몰라']),w:[]}}return GForm(k,f)}
// 44단계
ITA.forEach(x=>{if(x[0]==='interesting')x[1]='흥미롭다'});
ITV.push(['play the piano','피아노를 치다','fun hard'],['speak in front of people','사람들 앞에서 말하다','hard exciting'],['swim in the river','강에서 수영하다','dangerous'],['run in the hallway','복도에서 뛰다','dangerous'],
 ['help others','다른 사람을 돕다','important'],['learn to swim','수영을 배우다','important fun'],['make a snowman','눈사람을 만들다','fun'],['fly a kite','연을 날리다','fun easy'],['bake cookies','쿠키를 굽다','fun easy'],
 ['drink enough water','물을 충분히 마시다','important good'],['eat breakfast','아침을 먹다','important good'],['wash your hands','손을 씻다','important'],['tell the truth','사실대로 말하다','important hard'],
 ['say sorry','미안하다고 말하다','hard important'],['watch scary movies','무서운 영화를 보다','fun exciting'],['go camping','캠핑을 가다','fun exciting'],['plant trees','나무를 심다','important'],
 ['build a sandcastle','모래성을 쌓다','fun'],['solve math problems','수학 문제를 풀다','fun hard interesting'],['learn about space','우주에 대해 배우다','interesting fun'],['exercise every day','매일 운동하다','good important hard'],['use a computer','컴퓨터를 쓰다','easy']);
function H3Skel(r,lap){return Object.assign(HSkel(r,lap),{S:pick(r,HS)})}
function H3Form(k,f){const v=k.v,a=k.a;if(f==='H_for'&&/good/.test(a[0]))return HForm(k,'H_it');if(f==='H_was'&&/important|good/.test(a[0]))return HForm(k,'H_it');if(f==='H_for'){const S=k.S,ve=v[0].replace(/\byour\b/,S.po||'your');return {en:SEN(['it is',a[0],'for',S.ob,'to',ve]),ko:D([S.oko+'에게는',KO.NE(v[1]),josa('것','이/가'),KO.A(a[1])]),alt:[],w:[chip(a[1],a[0])]}}
  if(f==='H_was')return {en:SEN(['it was',a[0],'to',v[0]]),ko:D([KO.NE(v[1]),'것은',KO.P(a[1])]),alt:[],w:[chip(a[1],a[0])]};
  if(f==='H_neg'){if(!/hard/.test(v[2]))return H3Form(k,'H_was');return {en:SEN(["it isn't easy to",v[0]]),ko:D([KO.NE(v[1]),'것은 쉽지 않아']),alt:[SEN(["it's not easy to",v[0]]),SEN(['it is not easy to',v[0]])],w:[]}}
  return HForm(k,f)}
// 45단계
const NMP2=NMP.concat([['my dad','아빠'],['my mom','엄마'],['my friend','내 친구'],['the teacher','선생님']]);
const ASA2=ASA.concat([['short','키가 작다'],['quiet','조용하다'],['shy','수줍음이 많다']]);
function I3Skel(r,lap){for(let g=0;g<50;g++){const A=pick(r,NMP2),B=pick(r,NMP2);if(A===B)continue;return {A,B,a:pick(r,ASA2),t:pick(r,THE)}}throw new Error('no I')}
// 48단계
JWHO.length=0;JWHO.push(['the boy','남자아이','k'],['the girl','여자아이','k'],['the man','남자','a'],['the woman','여자','a'],['the student','학생','k'],['the old man','할아버지','o'],['the old woman','할머니','o']);
JIS.length=0;JIS.push(['my friend','내 친구','k'],['my cousin','내 사촌','ka'],['my neighbor','우리 이웃','kao'],['my classmate','우리 반 친구','k'],['my teacher','우리 선생님','a'],['my coach','우리 코치님','a']);
JPOST.push(['playing the guitar','기타를 치고 있는'],['walking a dog','개를 산책시키고 있는'],['carrying a big box','큰 상자를 나르고 있는']);
JING.push(['laughing','children','웃고 있는 아이들',1],['shouting','man','소리치는 남자'],['jumping','frog','뛰어오르는 개구리'],['sleeping','cat','자는 고양이'],['burning','house','불타는 집'],
 ['smiling','girl','웃고 있는 여자아이'],['moving','car','움직이는 차'],['sleeping','puppy','자는 강아지'],['playing','children','놀고 있는 아이들',1]);
JED.push(['locked','door','잠긴 문'],['broken','chair','부러진 의자'],['lost','key','잃어버린 열쇠'],['frozen','fish','얼린 생선'],['closed','window','닫힌 창문'],['opened','box','열린 상자'],['fallen','tree','쓰러진 나무'],['cracked','egg','금 간 달걀']);
function J3Skel(r,lap){for(let g=0;g<50;g++){const k=JSkel(r,lap);const wh=pick(r,JWHO),is=pick(r,JIS.filter(x=>x[2].includes(wh[2])));if(!is)continue;if(wh[2]==='o'&&/soccer|riding/.test(k.p[0]))continue;return Object.assign(k,{S:pick(r,HS),wh,is})}throw new Error('no J')}
function J3Form(k,f){const wh=k.wh,p=k.p;
  if(f==='J_know')return {en:SEN(['do you know the',wh[0].replace(/^the /,''),p[0]],1),ko:Q([p[1],josa(wh[1],'을/를'),'알아']),w:[]};
  if(f==='J_saw2'){const S=k.S,n=wh[0].replace(/^the /,'');return {en:SEN([S.en,'saw',AN(n),n,p[0]]),ko:D([S.top,p[1],josa(wh[1],'을/를'),'봤어']),w:[]}}
  return JForm(k,f)}
// 50·51·52단계: 주어 늘리기
function K3Skel(r,lap){return Object.assign(KSkel(r,lap),{S:pick(r,HS),S2:pick(r,HS)})}
function L3Skel(r,lap){return Object.assign(L2Skel(r,lap),{S:pick(r,HS),S2:pick(r,HS.filter(x=>x.g!==1)),R:pick(r,HS)})}
CL.push(['where','buy bread','어디에서 빵을','사다'],['what','do on weekends','주말에 뭘','하다'],['when','go to bed','언제','자다'],['why','study English','왜 영어를','공부하다'],
 ['who','meet after school','방과 후에 누구를','만나다'],['how','make kimchi','김치를 어떻게','만들다'],['where','play soccer','어디에서 축구를','하다'],['what','read','뭘','읽다']);
MV.push(['I want to know','나는','알고 싶어'],['can you tell me','너는','말해 줄 수 있어',1]);
WILLV.push(['bring snacks','간식을 가져오다'],['like the gift','그 선물을 좋아하다'],['finish on time','제시간에 끝내다'],['come back','돌아오다'],['say yes','좋다고 하다'],['win the race','경주에서 이기다']);
function M3Skel(r,lap){for(let g=0;g<50;g++){const k=MSkel(r,lap);const S=pick(r,HS.filter(x=>x.g!==1&&x.g!==2).concat([NP('my friend','내 친구',12),NP('your teacher','너희 선생님',6)]));if(/work/.test(k.c[1])&&(S.g===12||S.g>=40))continue;const S0=pick(r,HS.filter(x=>x.en!==S.en));return Object.assign(k,{S,S0})}throw new Error('no M')}
function M3Form(k,f){if(f==='M_that'){const b=k.b,S=k.S,S0=k.S0;const en=SEN([S0.en,s3(S0,'think'),'that',S.en,S.be,b.en]);return {en,ko:D([S0.top,S.nom,b.ko+'고 생각해']),alt:[en.replace(' that ',' ')],w:[chip(b.ko,b.en)]}}return MForm(k,f)}
// 53단계
LIKES.push(['dogs','개를 좋아하다'],['drawing','그림 그리기를 좋아하다'],['swimming','수영을 좋아하다'],['science','과학을 좋아하다'],['bananas','바나나를 좋아하다'],['chocolate','초콜릿을 좋아하다']);
EITH.push(['tea','water','차','물','마시다'],['rice','noodles','밥','국수','먹다'],['cookies','cake','쿠키','케이크','먹다'],['chess','badminton','체스','배드민턴','하다']);
function N3Skel(r,lap){const k=NSkel(r,lap);const S=pick(r,HS);let b,br;for(let g=0;g<30;g++){b=pick(r,BUT);br=pick(r,b[2]);if(!(br[2]>1)&&!(S.en==='I'&&/\bme\b/.test(br[0])))break}return Object.assign(k,{S,bu:b,br})}
function N3Form(k,f){const {A,B,S}=k;
  if(f==='N_sothat'){const p=k.sp;const en=p[2]?SEN([S.en,k.s[0],'so that',p[0]]):SEN([S.en,k.s[0],'so that',S.pr,'could',p[0]]);return {en,ko:p[2]?D([S.top,'모두가 이해할 수 있게',k.s[1]]):D([S.top,KO.R(p[1]),k.s[1]]),alt:[],w:[]}}
  if(f==='N_although2'){const b=k.bu,x=k.br,po=t=>t.replace('{po}',S.po);return {en:cap('although '+S.en+' '+S.was+' '+b[0])+', '+S.pr+' '+po(x[0])+'.',ko:S.top+' '+KO.Pst(b[1])+'지만 '+x[1]+'.',alt:[cap('though '+S.en+' '+S.was+' '+b[0])+', '+S.pr+' '+po(x[0])+'.'],w:[chip(b[1],b[0])]}}
  if(f==='N_bothadj'){const a=k.a1;return {en:SEN(['both',A[0],'and',B[0],'are',a[0]]),ko:D([josa(A[1],'과/와'),josa(B[1],'은/는'),'둘 다',KO.A(a[1])]),alt:[],w:[chip(a[1],a[0])]}}
  if(f==='N_neitherlk')return {en:SEN(['neither',A[0],'nor',B[0],'likes',k.lk[0]]),ko:D([A[1]+'도',B[1]+'도',KO.S(k.lk[1])+'지 않아']),alt:[],w:[]};
  return NForm(k,f)}
// 55단계
const PW2=[['got to the station','역에 도착했을',[['the train had already left','기차는 이미 떠났어'],['the bus had already gone','버스는 이미 가 버렸어']]],['got to the theater','극장에 도착했을',[['the movie had already started','영화는 이미 시작했어']]],
 ['got home','집에 왔을',[['the pizza had already arrived','피자는 이미 와 있었어'],['everyone had already eaten','모두 이미 밥을 먹었어'],['the party had already ended','파티는 이미 끝났어']]],
 ['got to school','학교에 도착했을',[['the class had already started','수업은 이미 시작했어'],['the bell had already rung','종은 이미 울렸어']]],['got to the store','가게에 도착했을',[['it had already closed','가게는 이미 문을 닫았어']]],
 ['woke up','일어났을',[['the sun had already risen','해는 이미 떴어'],['the bus had already left','버스는 이미 떠났어'],['the snow had already stopped','눈은 이미 그쳤어']]],
 ['got to the park','공원에 도착했을',[['the game had already finished','경기는 이미 끝났어'],['the rain had already stopped','비는 이미 그쳤어']]],['opened the fridge','냉장고를 열었을',[['someone had already eaten the cake','누군가 이미 케이크를 먹었어']]],
 ['came back','돌아왔을',[['the ice had already melted','얼음은 이미 녹았어']]]];
PACT.push(['feed the cat','고양이에게 밥을 주다'],['make the bed','침대를 정리하다'],['take a shower','샤워를 하다'],['buy the tickets','표를 사다'],['charge the phone','휴대폰을 충전하다'],['call Tom','톰에게 전화하다'],['set the table','상을 차리다'],['water the plants','화분에 물을 주다']);
PBEF.push(['before breakfast','아침 먹기 전에'],['before the game started','경기가 시작하기 전에'],['before school','학교 가기 전에'],['before the guests arrived','손님들이 도착하기 전에']);
function P3Skel(r,lap){const w=pick(r,PW2);return Object.assign(PSkel(r,lap),{S:pick(r,HS),w2:w,we:pick(r,w[2])})}
function P3Form(k,f){if(f==='P_when2'){const S=k.S,w=k.w2,e=k.we;return {en:cap('when '+S.en+' '+w[0])+', '+e[0]+'.',ko:S.nom+' '+w[1]+' 때 '+e[1]+'.',alt:[cap(e[0])+' when '+S.en+' '+w[0]+'.'],w:[]}}
  if(f==='P_q'){const S=k.S;return {en:SEN(['had',S.en,'already',ppPh(k.a[0]),k.b[0]],1),ko:Q([S.top,k.b[1],'이미',KO.P(k.a[1])]),alt:[SEN(['had',S.en,ppPh(k.a[0]),k.b[0]],1)],w:[chip(k.a[1],k.a[0])]}}
  return PForm(k,f)}
// 56단계
QACT.forEach(x=>{if(x[0]==='look for my key')x[0]='look for the key'});
QACT.push(['draw the picture','그림을 그리다','s'],['play the violin','바이올린을 켜다','l'],['run','달리다','s'],['talk on the phone','통화하다','s'],['learn Chinese','중국어를 배우다','l'],['build the sandcastle','모래성을 쌓다','s'],['take swimming lessons','수영 수업을 듣다','l'],['fix the bike','자전거를 고치다','s']);
QDUR.push(['for thirty minutes','30분 동안','s'],['since noon','정오부터','s'],['for two years','2년 동안','l'],['since I was seven','일곱 살 때부터','l']);
QWT.push(['at this time next week','다음 주 이맘때'],['at 3 tomorrow afternoon','내일 오후 3시에'],['when the movie starts','영화가 시작할 때']);
QWA.push(['ride a bike','자전거를 타다'],['read a book','책을 읽다'],['play the piano','피아노를 치다'],['eat lunch','점심을 먹다'],['wait for you','너를 기다리다'],['travel in Japan','일본을 여행하다']);
function Q3Skel(r,lap){for(let g=0;g<50;g++){const k=QSkel(r,lap);const S=pick(r,HS);if(k.d[0]==='since I was seven'&&S.en!=='I')continue;if(k.wa[0]==='wait for you'&&S.en==='you')continue;return Object.assign(k,{S})}throw new Error('no Q')}
// 57단계
RMV.push(['eaten the cookies','쿠키를 먹다'],['taken the umbrella','우산을 가져가다'],['left the door open','문을 열어 두다'],['run all the way','내내 뛰다'],['forgotten the password','비밀번호를 잊어버리다']);
function R3Form(k,f){if(f==='R_could'){const S=k.S;return {en:SEN([S.en,'could have',k.a[0]]),ko:D([S.top,KO.L(k.a[1])+' 수 있었을 텐데']),w:[chip(k.a[1],k.a[0])]}}return RForm(k,f)}
// 64단계
YWN.push(['go to the zoo','동물원에 가다',[['see the lions first','사자를 먼저 보다'],['buy a balloon','풍선을 사다']]],['feel bored','심심하다',[['read a comic book','만화책을 읽다'],['play with blocks','블록을 가지고 놀다']]],
 ['go to the park','공원에 가다',[['ride a bike','자전거를 타다'],['feed the ducks','오리에게 먹이를 주다']]],['get a present','선물을 받다',[['say thank you','고맙다고 말하다'],['write a thank-you card','감사 카드를 쓰다']]],
 ['make a mistake','실수하다',[['try again','다시 해 보다'],['say sorry','미안하다고 말하다']]],['feel hungry','배가 고프다',[['eat a banana','바나나를 먹다'],['drink some milk','우유를 좀 마시다']]],
 ['go to the beach','바닷가에 가다',[['swim in the sea','바다에서 수영하다']]],['hear thunder','천둥소리를 듣다',[['hide under the blanket','이불 속에 숨다'],['cover the ears','귀를 막다']]],
 ['go to the farm','농장에 가다',[['help on the farm','농장 일을 돕다']]],['see a cat','고양이를 보다',[['stop and watch it','멈춰서 지켜보다']]],['win a game','게임에서 이기다',[['jump for joy','기뻐서 펄쩍 뛰다']]]);
const YHT=[['open the jar','병뚜껑을 열다'],['solve the puzzle','퍼즐을 풀다'],['fall asleep','잠들다'],['catch the ball','공을 잡다'],['finish it in time','제시간에 그걸 끝내다'],['lift the box','상자를 들다'],['remember the word','그 낱말을 기억하다']];
const YAN=[['invite','초대하다','초대해도'],['ask','물어보다','물어봐도'],['choose','고르다','골라도'],['play with','같이 놀다','같이 놀아도']];
function Y3Skel(r,lap){return Object.assign(Y2Skel(r,lap),{ht:pick(r,YHT),an:pick(r,YAN)})}
function Y3Form(k,f){const S=k.S;
  if(f==='Y_hard')return {en:cap('however hard '+S.en+' '+s3(S,'try'))+', '+S.pr+" can't "+k.ht[0]+'.',ko:'아무리 열심히 해도 '+S.top+' '+KO.L(k.ht[1])+' 수 없어.',alt:[cap('however hard '+S.en+' '+s3(S,'try'))+', '+S.pr+' cannot '+k.ht[0]+'.'],w:[chip(k.ht[1],k.ht[0])]};
  if(f==='Y_whoany'){const a=k.an;return {en:SEN([S.en,'can',a[0],'whoever',S.pr,s3(S,'want')]),ko:D([S.top,'원하는 사람은 누구든지',a[2],'돼']),w:[chip(a[1],a[0])]}}
  return Y2Form(k,f)}
// 66단계
RMA.push(['bring a water bottle','물병을 가져오다'],['close the gate','대문을 닫다'],['pay for the snacks','과자값을 내다'],['print the homework','숙제를 출력하다'],['buy some eggs','달걀을 사다'],
 ['feed the fish','물고기에게 밥을 주다'],['pack the swimsuit','수영복을 챙기다'],['sign the paper','종이에 서명하다'],['turn off the oven','오븐을 끄다'],['say goodbye','작별 인사를 하다']);
// 43 · 44 · 50 · 64 · 66 더
function G4Form(k,f){const S=k.S;
  if(f==='G_toopast'){const x=k.t;if(x[4])return {en:SEN(['it was too',x[0],'to',x[2]]),ko:D(['너무',KO.A(x[1])+'서',KO.L(x[3])+' 수 없었어']),w:[chip(x[1],x[0])]};return {en:SEN([S.en,S.was,'too',x[0],'to',x[2]]),ko:D([S.top,'너무',KO.A(x[1])+'서',KO.L(x[3])+' 수 없었어']),w:[chip(x[1],x[0])]}}
  if(f==='G_wantlearn'){const x=k.h,S2=k.S2;return {en:SEN([S2.en,s3(S2,'want'),'to learn how to',x[0]]),ko:D([S2.top,KO.NE(x[1]),'법을',S2.en==='I'?'배우고 싶어':'배우고 싶어 해']),w:[chip(x[1],x[0])]}}
  return G3Form(k,f)}
ITV.push(['grow vegetables','채소를 기르다','fun interesting'],['ride a horse','말을 타다','fun exciting dangerous'],['skate on the ice','얼음 위에서 스케이트를 타다','fun dangerous'],['draw animals','동물을 그리다','fun easy hard'],
 ['learn magic tricks','마술을 배우다','fun interesting'],['go to bed early','일찍 자다','important good hard'],['visit a museum','박물관에 가다','interesting fun'],['write a story','이야기를 쓰다','fun hard'],
 ['ride the subway alone','혼자 지하철을 타다','dangerous exciting'],['play outside','밖에서 놀다','fun good'],['wear a helmet','헬멧을 쓰다','important'],['listen to others','다른 사람 말을 듣다','important'],
 ['make a cake','케이크를 만들다','fun hard'],['catch a fish','물고기를 잡다','fun hard exciting'],['sing in front of the class','반 친구들 앞에서 노래하다','hard exciting']);
WHAT.push(['wrote','쓴'],['chose','고른'],['said','말한'],['saw','본'],['heard','들은']);
YWN.push(['go to the store','가게에 가다',[['buy some gum','껌을 사다'],['look at the toys','장난감을 구경하다']]],['take a bath','목욕하다',[['sing a song','노래를 부르다'],['play with a rubber duck','고무 오리를 가지고 놀다']]],
 ['ride the bus','버스를 타다',[['sit by the window','창가에 앉다'],['read a book','책을 읽다']]],['feel happy','기분이 좋다',[['sing a song','노래를 부르다'],['dance','춤을 추다']]],
 ['go to the pool','수영장에 가다',[['jump into the water','물에 뛰어들다'],['swim for an hour','한 시간 동안 수영하다']]],['see a puppy','강아지를 보다',[['say hello','인사하다'],['smile','웃다']]],
 ['get home','집에 오다',[['wash {po} hands','손을 씻다'],['drink some water','물을 좀 마시다']]],['wake up early','일찍 일어나다',[['take a walk','산책하다'],['read a book','책을 읽다']]],
 ['go to the movies','영화관에 가다',[['buy popcorn','팝콘을 사다'],['sit in the front','앞쪽에 앉다']]],['feel cold','춥다',[['drink hot chocolate','코코아를 마시다'],['put on a sweater','스웨터를 입다']]]);
YWR.push(['bring a water bottle','물병을 챙기다'],['say hello to everyone','모두에게 인사하다'],['try the local food','그 지역 음식을 먹어 보다'],['keep a diary','일기를 쓰다'],['wear sunscreen','선크림을 바르다'],['draw pictures','그림을 그리다']);
YHP.push(['cold','춥다',[['go to school','학교에 가다'],['wear a coat','외투를 입다']]],['bored','심심하다',[['finish {po} homework','숙제를 끝내다'],['sit quietly','조용히 앉아 있다']]],['nervous','긴장되다',[['try {po} best','최선을 다하다']]]);
AFG.push(['going to the zoo','동물원에 갔던'],['learning to swim','수영을 배웠던'],['seeing a rainbow','무지개를 봤던'],['flying in a plane','비행기를 탔던'],['camping in the mountains','산에서 캠핑했던'],['building a snowman','눈사람을 만들었던']);
ASTT.push(['tie {po} shoes','신발 끈을 묶다'],['pick up a coin','동전을 줍다'],['read the sign','표지판을 읽다'],['wave to a friend','친구에게 손을 흔들다'],['pet a dog','개를 쓰다듬다']);
ASTI.push(['running','달리기를 멈췄어'],['playing the piano','피아노 치는 걸 멈췄어'],['singing','노래를 멈췄어'],['eating candy','사탕 먹는 걸 끊었어']);
SAIDW.push(['help the teacher','선생님을 돕다'],['study harder','더 열심히 공부하다'],['go to bed early','일찍 자다'],['wait for us','우리를 기다리다']);
SAIDH.push(['cleaned the room','방을 청소하다'],['read the book','그 책을 읽다'],['forgotten the password','비밀번호를 잊어버리다'],['won the race','경주에서 이기다'],['visited the museum','박물관에 가 보다']);

function H4Form(k,f){if(f==='H_forq'){const v=k.v,a=k.a,S=k.S.en==='I'?HS[1]:k.S;if(/good/.test(a[0]))return HForm(k,'H_q');const ve=v[0].replace(/\byour\b/,S.po||'your');return {en:SEN(['is it',a[0],'for',S.ob,'to',ve],1),ko:Q([S.oko+'에게는',KO.NE(v[1]),josa('것','이/가'),KO.A(a[1])]),alt:[],w:[chip(a[1],a[0])]}}return H3Form(k,f)}
function Y4Form(k,f){if(f==='Y_whenp'){const S=k.S,w=k.w,x=k.wr;return {en:cap('whenever '+S.en+' '+EN.past(w[0]))+', '+S.pr+' '+EN.past(po2(x[0],S))+'.',ko:S.top+' '+KO.L(w[1])+' 때마다 '+KO.P(po2(x[1],S))+'.',w:[chip(w[1],w[0])]}}return Y3Form(k,f)}
function G5Form(k,f){if(f==='G_enoughp'){const x=k.e,S=k.S;if(x[4])return {en:SEN(['it was',x[0],'enough to',x[2]]),ko:D([KO.L(x[3])+' 만큼',KO.P(x[1])]),w:[chip(x[1],x[0])]};return {en:SEN([S.en,S.was,x[0],'enough to',x[2]]),ko:D([S.top,KO.L(x[3])+' 만큼',KO.P(x[1])]),w:[chip(x[1],x[0])]}}return G4Form(k,f)}
// 가족 낱말이 든 사람·말 목록 정리(생성 전에)
[WOLD,WS,WANS,WOWN,JIS,NMP2,ZWHO,ADU,IOX,ZS2,SEEO].forEach(A=>{for(let i=A.length-1;i>=0;i--){const e=A[i];const en=Array.isArray(e)?e[0]:e.en,ko=Array.isArray(e)?e[1]:e.ko;if(isFam({en,ko})||/(엄마|아빠|할머니|할아버지|사촌)/.test(ko))A.splice(i,1)}});
// 하루마다 섞어 낼 짝 묶음(모든 단계에서): 지금 단계에 맞는 것만
const ZBLK=[{min:1,max:6,b:[['z_ab','z_anb'],['z_anb','z_ab']]},{min:2,b:[['z_sg','z_pl'],['z_pl','z_sg']]},{min:3,b:[['d_this','d_these'],['d_that','d_those']]},{min:5,b:[['n_is','n_are']]},
  {min:7,b:[['z_a','z_an'],['z_an','z_a']]},{min:8,b:[['z_i','z_he'],['z_he','z_i']]},{min:9,b:[['z_bpos','z_vpos'],['z_vpos','z_bpos']]},{min:10,b:[['o_obj','o_swap'],['o_this','o_mine']]},
  {min:11,b:[['z_ineg','z_heneg'],['z_heq','z_iq'],['z_bneg','z_vneg'],['z_vq','z_bq']]},{min:13,b:[['z_bpast','z_vpast'],['z_vpneg','z_bpneg']]},{min:16,b:[['w_many','w_muchn']]},{min:17,b:[['f_v','f_b']]},{min:39,b:[['C_io','C_to']]},{min:44,b:[['H_it','H_ing']]},{min:52,b:[['M_wh','M_q']]},{min:66,b:[['a_remto','a_reming']]}];
function zBlocks(stage){return ZBLK.filter(x=>stage>=x.min&&(!x.max||stage<=x.max)).flatMap(x=>x.b)}
const FAM={z:[zSkel,zForm],b:[bSkel,bForm],v:[(r,l,c)=>vSkel(r,l,c,/^v_(who|what|where|when|whatdoing|hto|dhto|htoq|sh)$/.test(c)?PEOPLE:undefined),vForm],p:[pSkel,pForm],t:[tSkel,tForm],q:[qSkel,qForm],r:[rSkel,rForm],c:[cSkel,cForm],s:[sSkel,sForm],i:[iSkel,iForm],g:[gSkel,gForm],e:[eSkel,eForm],j:[jSkel,jForm],k:[kSkel,kForm],x:[xSkel,xForm],h:[hSkel,hForm],l:[lSkel,lForm],d:[dSkel,dForm],n:[nSkel,nForm],o:[oSkel,oForm],m:[mSkel,mForm],w:[wSkel,wForm],f:[fSkel,fForm],u:[uSkel,uForm],y:[ySkel,yForm],A:[ASkel,AForm],B:[BSkel,BForm],C:[CSkel,CForm],D:[DSkel,DForm],E:[ESkel,EForm],F:[FSkel,FForm],G:[GSkel,GForm],H:[HSkel,HForm],I:[ISkel,IForm],J:[JSkel,JForm],K:[KSkel,KForm],L:[LSkel,LForm],M:[MSkel,MForm],N:[NSkel,NForm],O:[OSkel,OForm],P:[PSkel,PForm],Q:[QSkel,QForm],R:[RSkel,RForm],S:[S2Skel,S2Form],T:[T2Skel,T2Form],U:[U2Skel,U2Form],V:[V2Skel,V2Form],W:[W2Skel,W2Form],X:[X2Skel,X2Form],Y:[YSkel,YForm],Z:[ZSkel,ZForm],a:[aSkel,aForm]};
Object.assign(FAM,{D:[D3Skel,DForm],F:[F3Skel,FForm],G:[G3Skel,G5Form],H:[H3Skel,H4Form],I:[I3Skel,IForm],J:[J3Skel,J3Form],K:[K3Skel,KForm],M:[M3Skel,M3Form],N:[N3Skel,N3Form],P:[P3Skel,P3Form],Q:[Q3Skel,QForm],R:[RSkel,R3Form],z:[zSkel3,zForm3],m:[m3Skel,m3Form],w:[w3Skel,w3Form],u:[u3Skel,u3Form],y:[ySkel,y3Form],Y:[Y3Skel,Y4Form],Z:[Z2Skel,Z2Form],a:[a2Skel,a2Form],L:[L3Skel,L2Form]});
const STAGES=[
 {t:'be동사 · am / is / are',ex:'I am happy. / He is happy. / They are happy.',blk:[['b_pos']]},
 {t:'하나 · 여럿 · a / an / -s',ex:'He is a student. / They are students. / She is an artist.',blk:[['z_sg','z_pl'],['z_pl','z_sg'],['z_ab','z_anb'],['z_anb','z_ab'],['z_jsg','z_jpl'],['z_jpl','z_jsg'],['z_itsg','z_itpl'],['z_itpl','z_itsg']]},
 {t:'this · that · these · those',ex:'This is my bag. / These are my books. / That dog is cute.',blk:[['d_this','d_these'],['d_that','d_those'],['d_thisa','d_thesea'],['d_thata','d_thosea'],['d_q','d_qpl']]},
 {t:'be동사 · 아니야 · 질문',ex:"He isn't happy. / Is he happy?",blk:[['b_pos','b_neg','b_q'],['b_neg','b_q']]},
 {t:'There is · There are',ex:'There is a cat under the table. / There are three apples in the box.',blk:[['n_is','n_are'],['n_are','n_is'],['n_is','n_neg'],['n_q','n_qpl']]},
 {t:'be동사 · 과거 was / were',ex:'He was tired yesterday.',blk:[['b_pos','b_ppos','b_pneg'],['b_ppos','b_pq']]},
 {t:'일반동사 · I / you / we / they',ex:'I play soccer. / They eat apples.',blk:[['z_i']]},
 {t:'일반동사 · he / she 는 -s',ex:'I play soccer. / He plays soccer.',blk:[['z_he'],['z_i','z_he'],['z_he','z_i']]},
 {t:'be 문장 · do 문장 구분',ex:'He is hungry. / He eats bread.',blk:[['z_bpos','z_vpos'],['z_vpos','z_bpos'],['z_i','z_he']]},
 {t:'대명사 · me / him · my / his · mine',ex:'I like him. / He likes me. / This bag is mine.',blk:[['o_obj','o_swap'],['o_this','o_mine'],['o_pos','o_obj'],['o_mine','o_this']]},
 {t:"일반동사 · don't / doesn't · Do / Does ~?",ex:"He doesn't play soccer. / Does he play soccer?",blk:[['v_pos','v_neg','v_q'],['v_neg','v_q'],['z_ineg','z_heneg'],['z_heq','z_iq'],['z_bneg','z_vneg'],['z_vq','z_bq']]},
 {t:"명령문 · Don't · Let's",ex:"Close the door. / Don't run. / Let's play soccer.",blk:[['m_do','m_dont'],['m_lets','m_do'],['m_dont','m_lets'],['m_do2','m_dont2'],['m_lets2','m_please'],['m_please','m_dont2'],['m_lets2','m_do2']]},
 {t:'일반동사 · 과거 -ed · 불규칙 · did',ex:"He played soccer. / He didn't play. / Did he play?",blk:[['v_pos','v_ppos','v_pneg'],['v_ppos','v_pq'],['z_bpast','z_vpast'],['z_vpneg','z_bpneg']]},
 {t:'be · do 섞기 총정리',ex:"He isn't hungry. / He doesn't eat bread. / Was he tired? / Did he sleep?",blk:[['z_bpos','z_vpos'],['z_vneg','z_bneg'],['z_bq','z_vq'],['z_vpast','z_bpast'],['z_bpneg','z_vpneg'],['z_he','z_ineg'],['z_sg','z_pl'],['z_an','z_a'],['b_q','v_q'],['b_neg','v_neg']]},
 {t:'의문사 · what / where / when / who / why',ex:'What does he eat? / Where did he go?',blk:[['v_pos','v_what'],['v_ppos','v_where'],['v_pos','v_when'],['v_ppos','v_who'],['b_pos','b_why']]},
 {t:'How · Whose (몇 살 · 몇 개 · 얼마 · 누구 것)',ex:'How old are you? / How many books do you have? / Whose bag is this?',blk:[['w_old','w_oldans'],['w_many','w_muchn'],['w_price','w_pricepl'],['w_whose','w_whosepl'],['w_how','w_many'],['w_whose','w_whoseans'],['w_whosepl','w_whoseanspl']]},
 {t:'빈도부사 · always / usually / sometimes / never',ex:'I always get up early. / He is always late.',blk:[['f_v','f_b'],['f_b','f_v'],['f_v']]},
 {t:'전치사 · 어디에 (in / on / under …)',ex:'The cat is under the table.',blk:[['p_pos','p_q'],['p_pos','p_neg'],['p_ppos','p_where']]},
 {t:'전치사 · 때와 방향 (at / on / in / from)',ex:'I get up at seven. / We swim on Sundays.',blk:[['t_at'],['t_on'],['t_in'],['t_bday','t_bdayq'],['t_from']]},
 {t:'비인칭 it · 날씨 · 요일 · 시각',ex:"It's cold today. / It was rainy yesterday. / It's Monday today.",blk:[['u_w','u_wp'],['u_w','u_wneg'],['u_wq','u_w'],['u_day','u_time'],['u_wpp','u_wpneg'],['u_wpq','u_wpp']]},
 {t:'지금 하고 있어 · be + -ing',ex:'He is reading a book now.',blk:[['v_pos','v_prog','v_progneg'],['v_prog','v_progq','v_whatdoing']]},
 {t:'미래 · will',ex:"I will visit Busan. / I won't …",blk:[['v_pos','v_fut','v_futneg'],['v_fut','v_futq']]},
 {t:'미래 · be going to',ex:"I'm going to play soccer tomorrow.",blk:[['v_fut','v_gon'],['v_gonneg','v_gonq']]},
 {t:"할 수 있어 · can / can't",ex:'He can swim. / Can you swim?',blk:[['v_can','v_cant'],['v_can','v_canq']]},
 {t:'해야 해 · have to / should',ex:"You have to do your homework. / You should eat vegetables.",blk:[['v_hto','v_dhto'],['v_htoq'],['v_hto','v_sh']]},
 {t:'수량 · some / any / many / much / a few',ex:"I don't have any eggs. / There isn't much milk.",blk:[['q_some','q_any','q_anyq'],['q_many','q_manyq'],['q_much','q_few']]},
 {t:'비교급 · -er than / more ~ than',ex:'Elephants are bigger than horses.',blk:[['c_pos','c_q'],['c_neg']]},
 {t:'최상급 · the -est / the most',ex:'My dad is the tallest in my family.',blk:[['s_pos','s_who'],['s_pos'],['s_fact']]},
 {t:'감탄문 · What a ~! · How ~!',ex:'What a big dog! / How cute these puppies are!',blk:[['y_what','y_how'],['y_whatpl','y_howpl'],['y_what','y_whatpl'],['y_howthat','y_howthose'],['y_what','y_howthat']]},
 {t:'하고 있었어 · was + -ing',ex:'I was watching TV when you called.',blk:[['v_prog','v_pprog'],['v_pprogneg','v_pprogq']]},
 {t:"부가의문문 · ~, isn't he?",ex:"You are tired, aren't you? / He likes pizza, doesn't he?",blk:[['A_bpos','A_bneg'],['A_vpos','A_vneg'],['A_vpast','A_can'],['A_bneg','A_vpos']]},
 {t:"조동사 · must / may / could / would",ex:"You must wear a helmet. / May I come in? / Could you help me?",blk:[['B_must','B_mustnt'],['B_may'],['B_could','B_mayI'],['B_would','B_mayI']]},
 {t:'재귀대명사 · myself / himself …',ex:'She made the cake by herself.',blk:[['r_by','r_byq'],['r_can'],['r_enjoy'],['r_self']]},
 {t:'to부정사 · want to / decide to / to + 목적',ex:'I went to the store to buy milk.',blk:[['i_want','i_wantneg','i_wantq'],['i_decide'],['i_plan'],['i_hope'],['i_try'],['i_need'],['i_promise'],['i_purpose'],['i_purpose']]},
 {t:'동명사 · -ing (좋아해 · 잘해 · ~하는 것은)',ex:'Reading books is fun.',blk:[['g_like'],['g_enjoy'],['g_goodat','g_notgood'],['g_subj'],['g_howabout'],['g_thanks'],['g_finish'],['g_stop']]},
 {t:'감정 · -ing / -ed (exciting / excited)',ex:'The movie was boring. / I was bored.',blk:[['e_thing','e_person'],['e_thingq','e_personq'],['e_inter']]},
 {t:'접속사 · so / because / but / and',ex:'I was hungry, so I ate some bread.',blk:[['j_so','j_because'],['j_but'],['j_and']]},
 {t:'if · when',ex:'If it rains, we will stay home.',blk:[['k_if','k_ifneg'],['k_ifq'],['k_when'],['k_whenhab']]},
 {t:"주다 · 보여 주다 (give me a book)",ex:"She gave me a book. / She gave a book to me.",blk:[['C_io','C_to'],['C_to','C_io']]},
 {t:"make me happy · call it Coco",ex:"The movie made me sad. / We call our dog Coco.",blk:[['D_make','D_keep'],['D_find'],['D_call','D_make']]},
 {t:"want him to · tell him to · ask him to",ex:"Mom told me to clean the room. / I want you to come early.",blk:[['E_want','E_tell'],['E_tell','E_ask'],['E_ask','E_want']]},
 {t:"지각·사역동사 · see him run · let me go",ex:"I saw him run. / Mom let me play games.",blk:[['F_see','F_hear'],['F_let','F_make'],['F_make','F_see']]},
 {t:"too ~ to · enough to · how to",ex:"I'm too tired to walk. / I know how to swim.",blk:[['G_too','G_enough'],['G_howto','G_what'],['G_too','G_howto'],['G_learn','G_howto'],['G_what','G_learn'],['G_toopast','G_too'],['G_wantlearn','G_learn'],['G_enoughp','G_enough']]},
 {t:"가주어 it · It is fun to ~",ex:"It is fun to swim in the sea. / Swimming in the sea is fun.",blk:[['H_it','H_ing'],['H_for','H_q'],['H_ing','H_it'],['H_was','H_neg'],['H_for','H_was'],['H_forq','H_for']]},
 {t:"as ~ as · the 비교급, the 비교급",ex:"Tom is as tall as Mina. / The more you read, the more you learn.",blk:[['I_as','I_notas'],['I_the'],['I_notas','I_as']]},
 {t:'수동태 · was made by',ex:'The cake was made by my mom.',blk:[['x_pos','x_q'],['x_neg'],['x_pos'],['x_fact']]},
 {t:'현재완료 · have been / have ever / for',ex:'Have you ever ridden a horse?',blk:[['h_pos','h_q'],['h_never'],['h_for']]},
 {t:"분사로 꾸미기 · a sleeping baby · a broken window",ex:"Look at the sleeping baby. / I saw a broken window.",blk:[['J_ing','J_ed'],['J_post','J_pp'],['J_ed','J_ing'],['J_know','J_saw2'],['J_saw2','J_post']]},
 {t:'관계사 · who / that',ex:'I have a friend who plays the piano.',blk:[['l_who'],['l_that'],['l_prog']]},
 {t:"관계사 · which / whose / what",ex:"I have a friend whose dad is a pilot. / This is what I want.",blk:[['K_which','K_whose'],['K_what'],['K_whose','K_what']]},
 {t:"관계부사 · where / when / why / how",ex:"This is the park where we play soccer.",blk:[['L_where','L_when'],['L_why','L_how'],['L_where']]},
 {t:"간접의문문 · that 절 · if / whether",ex:"I know where he lives. / Where does he live?",blk:[['M_wh','M_q'],['M_that','M_if'],['M_q','M_wh']]},
 {t:"so that · although · both / either / neither",ex:"Although it was raining, we played soccer.",blk:[['N_sothat','N_although'],['N_both','N_neither'],['N_either','N_notonly'],['N_although2','N_bothadj'],['N_neitherlk','N_both'],['N_although2','N_sothat']]},
 {t:"used to · one / another / the other",ex:"I used to live in Busan. / One is red, and the other is blue.",blk:[['O_used','O_usedneg'],['O_two','O_three'],['O_used']]},
 {t:"과거완료 · had + p.p.",ex:"When I arrived, the movie had already started.",blk:[['P_when'],['P_before','P_q'],['P_never'],['P_when2'],['P_when2','P_before']]},
 {t:"현재완료진행 · 미래진행",ex:"I have been waiting for an hour. / I will be sleeping at ten.",blk:[['Q_hv','Q_hvq'],['Q_willbe'],['Q_hv','Q_willbe']]},
 {t:"should have p.p. · must have p.p.",ex:"I should have studied harder. / He must have been tired.",blk:[['R_should','R_shouldnt'],['R_must'],['R_should','R_must'],['R_could','R_should']]},
 {t:"가정법 과거 · If I were ~",ex:"If I were a bird, I would fly to you.",blk:[['S_if'],['S_if','S_q'],['S_if']]},
 {t:"가정법 과거완료 · 혼합",ex:"If I had studied harder, I would have passed the test.",blk:[['T_if'],['T_mix','T_if'],['T_if']]},
 {t:"I wish · as if · without",ex:"I wish I could fly. / He talks as if he knew everything.",blk:[['U_wish','U_wishp'],['U_asif'],['U_without'],['U_wishp','U_asif']]},
 {t:"분사구문",ex:"Walking home, I met my friend.",blk:[['V_a'],['V_b'],['V_c'],['V_d'],['V_a','V_b']]},
 {t:"with + 명사 + 분사",ex:"He sat with his eyes closed.",blk:[['W_a'],['W_a','W_d'],['W_a']]},
 {t:"관계사 계속적 용법 · 전치사 + 관계사",ex:"I have a friend, who lives in Busan. / This is the house in which I was born.",blk:[['X_c'],['X_w'],['X_prep'],['X_c','X_w']]},
 {t:"whoever · whatever · however",ex:"You can eat whatever you want. / However hard it is, don't give up.",blk:[['Y_what'],['Y_when'],['Y_where','Y_how'],['Y_who','Y_fix'],['Y_how','Y_when'],['Y_hard','Y_whoany'],['Y_when','Y_hard'],['Y_whenp','Y_when']]},
 {t:"강조 · 도치 · So do I",ex:"It was Tom that broke the window. / He likes pizza, and so do I.",blk:[['Z_it','Z_itw'],['Z_so'],['Z_nv','Z_not'],['Z_so','Z_fix']]},
 {t:"to · -ing 뜻 차이 · 수일치 · 시제일치",ex:"Remember to lock the door. / I remember locking the door.",blk:[['a_remto','a_reming'],['a_remed','a_forgetto'],['a_stop','a_stopto'],['a_agree','a_agr2'],['a_said'],['a_never','a_reming']]}
];
// 꼴 → 단계 번호
const F2S={};STAGES.forEach((st,i)=>st.blk.forEach(b=>b.forEach(f=>{if(F2S[f]==null){let own=true;for(let j=0;j<i;j++)if(STAGES[j].blk.some(bb=>bb.includes(f)))own=false;if(own)F2S[f]=i+1}})));
// 문장 하나 만들기
const CACHE=new Map();
function make(id){if(CACHE.has(id))return CACHE.get(id);const [lap,f,seed,ctx]=String(id).split('.');const L=Math.max(1,Math.min(3,+lap||1));const fam=FAM[f[0]];if(!fam)return null;
  const r=rng(+seed);let it;try{const k=fam[0](r,L,ctx||f);it=fam[1](k,f)}catch(e){return null}
  if(it&&!window.TALK_NOFAM&&isFam(it)){CACHE.set(id,null);return null}
  it=Object.assign({id:String(id),stage:F2S[f]||0,lap:L,f},it);it.alt=it.alt||[];it.w=(it.w||[]).filter((c,i,a)=>c&&c[0]&&c[1]&&a.findIndex(x=>x[0]===c[0])===i);
  if(CACHE.size>3000)CACHE.clear();CACHE.set(id,it);return it}
// 한 묶음: 같은 씨앗으로 묶음의 꼴들
function block(stage,lap,seed,bi){const st=STAGES[stage-1];const B=st.blk[bi==null?seed%st.blk.length:bi];const ctx=B[B.length-1];return B.map(f=>make([lap,f,seed,ctx].join('.'))).filter(Boolean)}
// 짝 묶음 하나(꼴 목록을 직접): 하루 짝 연습용
function blockOf(forms,lap,seed){const ctx=forms[forms.length-1];return forms.map(f=>make([lap,f,seed,ctx].join('.'))).filter(Boolean)}
window.TALK={STAGES,make,block,blockOf,zBlocks,F2S,rng};
})();
