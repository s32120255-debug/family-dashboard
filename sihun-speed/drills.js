/* ⚡ 스피드 영어 — 단계별 문장(엄마 11/25 「진짜 쉬운 것부터」).
   한 단계 = 한 가지 모양만 바꿔 말하기. 회색 「기준 문장」을 보고, 한국어 뜻대로 한 군데만 바꿔서 영어로 말해요.
   쉬운 낱말만 씀(happy, hungry, pizza, soccer…). GrammarCode 대표 예문은 쓰지 않음(직접 만든 문장).
   문장 번호(id)는 단계 + 순서라서, 목록 순서를 바꾸면 「내일 다시」 기록이 다른 문장을 가리켜요 → 새 문장은 맨 뒤에 붙이기. */
(function(){
const SUB={
  i:   {en:'I',   ko:'나는',   be:'am',  was:'was',  do:'do'},
  you: {en:'you', ko:'너는',   be:'are', was:'were', do:'do'},
  he:  {en:'he',  ko:'그는',   be:'is',  was:'was',  do:'does', s:1},
  she: {en:'she', ko:'그녀는', be:'is',  was:'was',  do:'does', s:1},
  we:  {en:'we',  ko:'우리는', be:'are', was:'were', do:'do'},
  they:{en:'they',ko:'그들은', be:'are', was:'were', do:'do'}
};
// 형용사: 지금 · 아니야 · 질문 · 과거 · 과거 아니야 · 과거 질문
const ADJ=[
  ['happy', '행복해','행복하지 않아','행복해?','행복했어','행복하지 않았어','행복했어?'],
  ['hungry','배고파','배고프지 않아','배고파?','배고팠어','배고프지 않았어','배고팠어?'],
  ['tired', '피곤해','피곤하지 않아','피곤해?','피곤했어','피곤하지 않았어','피곤했어?'],
  ['sad',   '슬퍼','슬프지 않아','슬퍼?','슬펐어','슬프지 않았어','슬펐어?'],
  ['sleepy','졸려','졸리지 않아','졸려?','졸렸어','졸리지 않았어','졸렸어?'],
  ['busy',  '바빠','바쁘지 않아','바빠?','바빴어','바쁘지 않았어','바빴어?'],
  ['hot',   '더워','덥지 않아','더워?','더웠어','덥지 않았어','더웠어?'],
  ['cold',  '추워','춥지 않아','추워?','추웠어','춥지 않았어','추웠어?']
];
// 일반동사: 원형, 3인칭 -s, 과거(쉬운 것만, 없으면 null), -ing / 한국어: 지금·아니야·질문 / 과거 3개 / can 3개 / will 3개 / ~하고 있어 3개
const VERB=[
  {v:'like pizza',s:'likes pizza',past:null,ing:null,
   k:['피자를 좋아해','피자를 좋아하지 않아','피자를 좋아해?']},
  {v:'play soccer',s:'plays soccer',past:'played soccer',ing:'playing soccer',
   k:['축구를 해','축구를 하지 않아','축구를 해?'],kp:['축구를 했어','축구를 하지 않았어','축구를 했어?'],
   kc:['축구를 할 수 있어','축구를 할 수 없어','축구를 할 수 있어?'],kf:['축구를 할 거야','축구를 하지 않을 거야','축구를 할 거야?'],
   ki:['축구를 하고 있어','축구를 하고 있지 않아','축구를 하고 있어?']},
  {v:'play basketball',s:'plays basketball',past:'played basketball',ing:'playing basketball',
   k:['농구를 해','농구를 하지 않아','농구를 해?'],kp:['농구를 했어','농구를 하지 않았어','농구를 했어?'],
   kc:['농구를 할 수 있어','농구를 할 수 없어','농구를 할 수 있어?'],kf:['농구를 할 거야','농구를 하지 않을 거야','농구를 할 거야?'],
   ki:['농구를 하고 있어','농구를 하고 있지 않아','농구를 하고 있어?']},
  {v:'eat apples',s:'eats apples',past:'ate apples',ing:'eating apples',
   k:['사과를 먹어','사과를 먹지 않아','사과를 먹어?'],kp:['사과를 먹었어','사과를 먹지 않았어','사과를 먹었어?'],
   kc:['사과를 먹을 수 있어','사과를 먹을 수 없어','사과를 먹을 수 있어?'],kf:['사과를 먹을 거야','사과를 먹지 않을 거야','사과를 먹을 거야?'],
   ki:['사과를 먹고 있어','사과를 먹고 있지 않아','사과를 먹고 있어?']},
  {v:'drink milk',s:'drinks milk',past:null,ing:'drinking milk',
   k:['우유를 마셔','우유를 마시지 않아','우유를 마셔?'],
   kf:['우유를 마실 거야','우유를 마시지 않을 거야','우유를 마실 거야?'],
   ki:['우유를 마시고 있어','우유를 마시고 있지 않아','우유를 마시고 있어?']},
  {v:'watch TV',s:'watches TV',past:'watched TV',ing:'watching TV',
   k:['TV를 봐','TV를 보지 않아','TV를 봐?'],kp:['TV를 봤어','TV를 보지 않았어','TV를 봤어?'],
   kf:['TV를 볼 거야','TV를 보지 않을 거야','TV를 볼 거야?'],
   ki:['TV를 보고 있어','TV를 보고 있지 않아','TV를 보고 있어?']},
  {v:'go to school',s:'goes to school',past:'went to school',ing:null,
   k:['학교에 가','학교에 가지 않아','학교에 가?'],kp:['학교에 갔어','학교에 가지 않았어','학교에 갔어?'],
   kf:['학교에 갈 거야','학교에 가지 않을 거야','학교에 갈 거야?']},
  {v:'have a dog',s:'has a dog',past:null,ing:null,
   k:['개가 있어','개가 없어','개가 있어?']},
  {v:'like cats',s:'likes cats',past:null,ing:null,
   k:['고양이를 좋아해','고양이를 좋아하지 않아','고양이를 좋아해?']},
  {v:'swim',s:'swims',past:null,ing:'swimming',
   k:['수영해','수영하지 않아','수영해?'],
   kc:['수영할 수 있어','수영할 수 없어','수영할 수 있어?'],kf:['수영할 거야','수영하지 않을 거야','수영할 거야?'],
   ki:['수영하고 있어','수영하고 있지 않아','수영하고 있어?']},
  {v:'read books',s:'reads books',past:null,ing:'reading books',
   k:['책을 읽어','책을 읽지 않아','책을 읽어?'],
   kc:['책을 읽을 수 있어','책을 읽을 수 없어','책을 읽을 수 있어?'],kf:['책을 읽을 거야','책을 읽지 않을 거야','책을 읽을 거야?'],
   ki:['책을 읽고 있어','책을 읽고 있지 않아','책을 읽고 있어?']},
  {v:'cook',s:'cooks',past:'cooked',ing:'cooking',
   k:['요리해','요리하지 않아','요리해?'],kp:['요리했어','요리하지 않았어','요리했어?'],
   kc:['요리할 수 있어','요리할 수 없어','요리할 수 있어?'],kf:['요리할 거야','요리하지 않을 거야','요리할 거야?'],
   ki:['요리하고 있어','요리하고 있지 않아','요리하고 있어?']},
  {v:'walk to school',s:'walks to school',past:'walked to school',ing:null,
   k:['학교에 걸어가','학교에 걸어가지 않아','학교에 걸어가?'],kp:['학교에 걸어갔어','학교에 걸어가지 않았어','학교에 걸어갔어?'],
   kf:['학교에 걸어갈 거야','학교에 걸어가지 않을 거야','학교에 걸어갈 거야?']}
];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const S=(w,end)=>cap(w.join(' '))+(end||'.');
const ko=(sb,t)=>SUB[sb].ko+' '+t+(/\?$/.test(t)?'':'.');
const ALL=['i','you','he','she','we','they'];
const pres=(sb,vb)=>SUB[sb].s?vb.s:vb.v;

// 모양 만들기
const be={
  pos:(sb,a)=>({ko:ko(sb,a[1]),en:S([SUB[sb].en,SUB[sb].be,a[0]])}),
  neg:(sb,a)=>({ko:ko(sb,a[2]),en:S([SUB[sb].en,SUB[sb].be,'not',a[0]])}),
  q:  (sb,a)=>({ko:ko(sb,a[3]),en:S([SUB[sb].be,SUB[sb].en,a[0]],'?')}),
  ppos:(sb,a)=>({ko:ko(sb,a[4]),en:S([SUB[sb].en,SUB[sb].was,a[0]])}),
  pneg:(sb,a)=>({ko:ko(sb,a[5]),en:S([SUB[sb].en,SUB[sb].was,'not',a[0]])}),
  pq: (sb,a)=>({ko:ko(sb,a[6]),en:S([SUB[sb].was,SUB[sb].en,a[0]],'?')})
};
const vb={
  pos:(sb,v)=>({ko:ko(sb,v.k[0]),en:S([SUB[sb].en,pres(sb,v)])}),
  neg:(sb,v)=>({ko:ko(sb,v.k[1]),en:S([SUB[sb].en,SUB[sb].do,'not',v.v])}),
  q:  (sb,v)=>({ko:ko(sb,v.k[2]),en:S([SUB[sb].do,SUB[sb].en,v.v],'?')}),
  ppos:(sb,v)=>({ko:ko(sb,v.kp[0]),en:S([SUB[sb].en,v.past])}),
  pneg:(sb,v)=>({ko:ko(sb,v.kp[1]),en:S([SUB[sb].en,'did','not',v.v])}),
  pq: (sb,v)=>({ko:ko(sb,v.kp[2]),en:S(['did',SUB[sb].en,v.v],'?')}),
  cpos:(sb,v)=>({ko:ko(sb,v.kc[0]),en:S([SUB[sb].en,'can',v.v])}),
  cneg:(sb,v)=>({ko:ko(sb,v.kc[1]),en:S([SUB[sb].en,'cannot',v.v])}),
  cq: (sb,v)=>({ko:ko(sb,v.kc[2]),en:S(['can',SUB[sb].en,v.v],'?')}),
  fpos:(sb,v)=>({ko:ko(sb,v.kf[0]),en:S([SUB[sb].en,'will',v.v])}),
  fneg:(sb,v)=>({ko:ko(sb,v.kf[1]),en:S([SUB[sb].en,'will','not',v.v])}),
  fq: (sb,v)=>({ko:ko(sb,v.kf[2]),en:S(['will',SUB[sb].en,v.v],'?')}),
  ipos:(sb,v)=>({ko:ko(sb,v.ki[0]),en:S([SUB[sb].en,SUB[sb].be,v.ing])}),
  ineg:(sb,v)=>({ko:ko(sb,v.ki[1]),en:S([SUB[sb].en,SUB[sb].be,'not',v.ing])}),
  iq: (sb,v)=>({ko:ko(sb,v.ki[2]),en:S([SUB[sb].be,SUB[sb].en,v.ing],'?')})
};
function item(o,base){return {ko:o.ko,en:o.en,base:base.en}}
function each(subs,list,f){const r=[];list.forEach(x=>subs.forEach(sb=>{const it=f(sb,x);if(it)r.push(it)}));return r}
// 섞기: 같은 문장을 여러 모양으로 번갈아
function mixOf(...pools){const r=[];const n=Math.max(...pools.map(p=>p.length));for(let i=0;i<n;i++)pools.forEach(p=>{if(p[i])r.push(p[i])});return r}

const NOT_I=['you','he','she','we','they'];
const Q_SUB=['you','he','she','they'];
const s1=each(NOT_I,ADJ,(sb,a)=>item(be.pos(sb,a),be.pos('i',a)));
const s2=each(ALL,ADJ,(sb,a)=>item(be.neg(sb,a),be.pos(sb,a)));
const s3=each(Q_SUB,ADJ,(sb,a)=>item(be.q(sb,a),be.pos(sb,a)));
const s5=each(ALL,ADJ,(sb,a)=>item(be.ppos(sb,a),be.pos(sb,a)));
const s6=mixOf(each(ALL,ADJ,(sb,a)=>item(be.pneg(sb,a),be.ppos(sb,a))),each(Q_SUB,ADJ,(sb,a)=>item(be.pq(sb,a),be.ppos(sb,a))));
const s7=each(['you','we','they'],VERB,(sb,v)=>item(vb.pos(sb,v),vb.pos('i',v)));
const s8=mixOf(each(['he','she'],VERB,(sb,v)=>item(vb.pos(sb,v),vb.pos('i',v))),each(['they','we'],VERB,(sb,v)=>item(vb.pos(sb,v),vb.pos('i',v))).filter((x,i)=>i%3===0));
const s9=each(['i','you','he','she','we','they'],VERB,(sb,v)=>item(vb.neg(sb,v),vb.pos(sb,v)));
const s10=each(Q_SUB,VERB,(sb,v)=>item(vb.q(sb,v),vb.pos(sb,v)));
const PASTV=VERB.filter(v=>v.past),CANV=VERB.filter(v=>v.kc),WILLV=VERB.filter(v=>v.kf),INGV=VERB.filter(v=>v.ing);
const s12=each(ALL,PASTV,(sb,v)=>item(vb.ppos(sb,v),vb.pos(sb,v)));
const s13=mixOf(each(ALL,PASTV,(sb,v)=>item(vb.pneg(sb,v),vb.ppos(sb,v))),each(Q_SUB,PASTV,(sb,v)=>item(vb.pq(sb,v),vb.ppos(sb,v))));
const s14=mixOf(each(ALL,CANV,(sb,v)=>item(vb.cpos(sb,v),vb.pos(sb,v))),each(ALL,CANV,(sb,v)=>item(vb.cneg(sb,v),vb.cpos(sb,v))),each(Q_SUB,CANV,(sb,v)=>item(vb.cq(sb,v),vb.cpos(sb,v))));
const s15=mixOf(each(ALL,WILLV,(sb,v)=>item(vb.fpos(sb,v),vb.pos(sb,v))),each(ALL,WILLV,(sb,v)=>item(vb.fneg(sb,v),vb.fpos(sb,v))),each(Q_SUB,WILLV,(sb,v)=>item(vb.fq(sb,v),vb.fpos(sb,v))));
const s16=mixOf(each(ALL,INGV,(sb,v)=>item(vb.ipos(sb,v),vb.pos(sb,v))),each(ALL,INGV,(sb,v)=>item(vb.ineg(sb,v),vb.ipos(sb,v))),each(Q_SUB,INGV,(sb,v)=>item(vb.iq(sb,v),vb.ipos(sb,v))));
// There is / are: 한 마리(개) ↔ 두·세 마리
const THING=[['dog','dogs','개','마리'],['cat','cats','고양이','마리'],['bird','birds','새','마리'],['ball','balls','공','개'],['book','books','책','권'],['apple','apples','사과','개']];
const s17=[];THING.forEach(t=>{const one={ko:`${t[2]}가 한 ${t[3]} 있어.`.replace('공가','공이').replace('책가','책이'),en:`There is a ${t[0]}.`};
  s17.push({ko:`${t[2]}가 두 ${t[3]} 있어.`.replace('공가','공이').replace('책가','책이'),en:`There are two ${t[1]}.`,base:one.en});
  s17.push({ko:`${t[2]}가 세 ${t[3]} 있어.`.replace('공가','공이').replace('책가','책이'),en:`There are three ${t[1]}.`,base:one.en});
  s17.push({ko:`${t[2]}가 한 ${t[3]} 있어?`.replace('공가','공이').replace('책가','책이'),en:`Is there a ${t[0]}?`,base:one.en});
  s17.push({ko:`${t[2]}가 두 ${t[3]} 있어?`.replace('공가','공이').replace('책가','책이'),en:`Are there two ${t[1]}?`,base:`There are two ${t[1]}.`})});

const STAGES=[
  {t:'be동사 · 주어 바꾸기',ex:'I am happy. → He is happy.',items:s1},
  {t:'be동사 · 아니야 (not)',ex:'He is happy. → He is not happy.',items:s2},
  {t:'be동사 · 질문',ex:'He is happy. → Is he happy?',items:s3},
  {t:'be동사 · 섞기',ex:'긍정 · not · 질문이 섞여 나와요',items:mixOf(s1,s2,s3)},
  {t:'be동사 · 과거 (was / were)',ex:'He is happy. → He was happy.',items:s5},
  {t:'be동사 · 과거 아니야 · 질문',ex:'He was happy. → Was he happy?',items:s6},
  {t:'일반동사 · I / you / we / they',ex:'I like pizza. → We like pizza.',items:s7},
  {t:'일반동사 · he / she 는 -s',ex:'I like pizza. → He likes pizza.',items:s8},
  {t:"일반동사 · 아니야 (don't / doesn't)",ex:"He likes pizza. → He doesn't like pizza.",items:s9},
  {t:'일반동사 · 질문 (Do / Does)',ex:'He likes pizza. → Does he like pizza?',items:s10},
  {t:'일반동사 · 섞기',ex:'긍정 · not · 질문이 섞여 나와요',items:mixOf(s7,s8,s9,s10)},
  {t:'일반동사 · 과거',ex:'I play soccer. → I played soccer.',items:s12},
  {t:"과거 · 아니야 · 질문 (did)",ex:"He played soccer. → Did he play soccer?",items:s13},
  {t:'can',ex:'He swims. → He can swim. → Can he swim?',items:s14},
  {t:'will',ex:'I play soccer. → I will play soccer.',items:s15},
  {t:'~하고 있어 (be + -ing)',ex:'He cooks. → He is cooking.',items:s16},
  {t:'There is / There are',ex:'There is a dog. → There are two dogs.',items:s17}
];
// 섞기 단계는 앞 단계 문장을 같이 쓰므로 복사해서 번호를 붙임
STAGES.forEach((st,i)=>{st.items=st.items.map((it,j)=>Object.assign({},it,{id:(i+1)+'-'+j,stage:i+1}))});
// 동사 낱말(모양이 틀리면 틀림): 원형·-s·과거·-ing
const VWORDS=new Set();VERB.forEach(v=>[v.v,v.s,v.past,v.ing].forEach(x=>{if(x)VWORDS.add(x.split(' ')[0].toLowerCase())}));
window.SPEED={STAGES,VWORDS,byId:id=>{const [a,b]=String(id).split('-').map(Number);const st=STAGES[a-1];return st&&st.items[b]||null}};
})();
