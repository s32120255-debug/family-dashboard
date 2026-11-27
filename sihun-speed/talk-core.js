/* ⚡ 스피드 영어 · 문장 만들기 ① 말 바꾸는 규칙(한국어 활용·영어 동사 모양)과 낱말 (엄마 11/27)
   이 파일은 아이 기록과 상관없는 순수한 문장 만들기 부품이에요(누구 기록도 안 읽고 안 씀).
   낱말 목록은 순서가 문장 번호(id)에 들어가니, 새 낱말은 각 목록 **맨 뒤에** 붙이기. */
(function(){
'use strict';
// ───────── 한글 조각 ─────────
const HB=0xAC00;
const dec=ch=>{const n=ch.charCodeAt(0)-HB;return n<0||n>11171?null:[Math.floor(n/588),Math.floor(n%588/28),n%28]};
const com=(a,b,c)=>String.fromCharCode(HB+a*588+b*28+c);
const jong=w=>{const d=dec(String(w).slice(-1));return d?d[2]:-1};
// 조사: 받침 있으면 앞, 없으면 뒤 (영어·숫자로 끝나면 받침 없는 쪽)
function josa(w,pair){const [a,b]=pair.split('/'),j=jong(w);if(a==='으로')return (j>0&&j!==8)?w+'으로':w+'로';return w+(j>0?a:b)}
// 불규칙: ㅂ(돕다·춥다…), ㄷ(듣다·걷다), ㅅ(짓다·낫다). 르는 저절로.
const IB=new Set('돕 곱 눕 춥 덥 무섭 어렵 쉽 귀엽 반갑 가볍 무겁 놀랍 즐겁 아름답 더럽 맵 시끄럽 부럽 고맙 외롭 너그럽 가깝 차갑 뜨겁 부끄럽 두껍 날카롭 새롭 흥미롭 지혜롭 평화롭 부드럽'.split(' '));
const ID=new Set('듣 걷 묻 싣'.split(' '));
const IS=new Set('짓 낫 붓 잇'.split(' '));
const isB=s=>IB.has(s)||/스럽$|롭$/.test(s);
const bright=v=>v===0||v===2||v===8;
function lastWord(w){const i=w.lastIndexOf(' ');return i<0?['',w]:[w.slice(0,i+1),w.slice(i+1)]}
function K(w,f){const [pre,word]=lastWord(w);return pre+f(word.slice(0,-1))}  // '배가 고프다' → '배가 ' + f('고프')
function _A(s){const L=s.slice(-1),p=s.slice(0,-1),[c,v,j]=dec(L);
  if(L==='하')return p+'해';
  if(isB(s))return p+com(c,v,0)+((s==='돕'||s==='곱')?'와':'워');
  if(ID.has(L))return p+com(c,v,8)+(bright(v)?'아':'어');
  if(IS.has(L))return p+com(c,v,0)+(bright(v)?'아':'어');
  if(j)return s+(bright(v)?'아':'어');
  if(L==='르'&&p){const q=p.slice(-1),[qc,qv]=dec(q);return p.slice(0,-1)+com(qc,qv,8)+(bright(qv)?'라':'러')}
  switch(v){case 0:case 1:case 3:case 4:case 5:case 6:case 7:return s;
    case 8:return p+com(c,9,0);case 13:return p+com(c,14,0);case 20:return p+com(c,6,0);case 11:return p+com(c,10,0);
    case 18:{const pv=p?dec(p.slice(-1))[1]:4;return p+com(c,bright(pv)?0:4,0)}
    default:return s+'어'}}
function _P(s){const a=_A(s),L=a.slice(-1),[c,v]=dec(L);return a.slice(0,-1)+com(c,v,20)+'어'}       // 먹었어
function _Pst(s){return _P(s).slice(0,-1)}                                                               // 먹었 (지만·기 때문에·을 때)
function _L(s){const L=s.slice(-1),p=s.slice(0,-1),[c,v,j]=dec(L);                                     // 먹을 · 갈 · 만들 · 도울
  if(j===0)return p+com(c,v,8);if(j===8)return s;if(isB(s))return p+com(c,v,0)+'울';
  if(ID.has(L))return p+com(c,v,8)+'을';if(IS.has(L))return p+com(c,v,0)+'을';return s+'을'}
function _N(s){const L=s.slice(-1),p=s.slice(0,-1),[c,v,j]=dec(L);                                     // 먹은 · 간 · 만든 · 도운 (동사 과거 / 형용사 지금)
  if(/[있없]$/.test(s))return s+'는';
  if(j===0||j===8)return p+com(c,v,4);if(isB(s))return p+com(c,v,0)+'운';
  if(ID.has(L))return p+com(c,v,8)+'은';if(IS.has(L))return p+com(c,v,0)+'은';return s+'은'}
function _NE(s){const L=s.slice(-1),p=s.slice(0,-1),[c,v,j]=dec(L);return j===8?p+com(c,v,0)+'는':s+'는'} // 먹는 · 만드는
function _E(s,a,b){const L=s.slice(-1),p=s.slice(0,-1),[c,v,j]=dec(L);                                 // 면/으면 · 려고/으려고 · 러/으러
  if(j===0||j===8)return s+a;if(isB(s))return p+com(c,v,0)+'우'+a;if(ID.has(L))return p+com(c,v,8)+b;if(IS.has(L))return p+com(c,v,0)+b;return s+b}
const KO={
  A:w=>K(w,_A),P:w=>K(w,_P),Pst:w=>K(w,_Pst),L:w=>K(w,_L),N:w=>K(w,_N),NE:w=>K(w,_NE),S:w=>K(w,s=>s),
  M:w=>K(w,s=>_E(s,'면','으면')),R:w=>K(w,s=>_E(s,'려고','으려고')),RU:w=>K(w,s=>_E(s,'러','으러'))};
// 이다(명사 + 이야): 학생이야 · 의사야
const COP={pos:n=>josa(n,'이야/야'),neg:n=>josa(n,'이/가')+' 아니야',past:n=>josa(n,'이었어/였어'),pneg:n=>josa(n,'이/가')+' 아니었어',
  mod:n=>josa(n,'인/인')};

// ───────── 영어 동사 모양 ─────────
const IRV={be:['was','been'],go:['went','gone'],eat:['ate','eaten'],drink:['drank','drunk'],see:['saw','seen'],make:['made','made'],have:['had','had'],
  read:['read','read'],write:['wrote','written'],draw:['drew','drawn'],ride:['rode','ridden'],swim:['swam','swum'],run:['ran','run'],sleep:['slept','slept'],
  sing:['sang','sung'],buy:['bought','bought'],teach:['taught','taught'],meet:['met','met'],break:['broke','broken'],build:['built','built'],come:['came','come'],
  get:['got','gotten'],take:['took','taken'],wear:['wore','worn'],forget:['forgot','forgotten'],know:['knew','known'],give:['gave','given'],lose:['lost','lost'],
  speak:['spoke','spoken'],win:['won','won'],do:['did','done'],tell:['told','told'],bring:['brought','brought'],catch:['caught','caught'],fly:['flew','flown'],feed:['fed','fed'],
  sit:['sat','sat'],hear:['heard','heard'],wake:['woke','woken'],feel:['felt','felt'],leave:['left','left'],find:['found','found'],begin:['began','begun'],
  overcome:['overcame','overcome'],understand:['understood','understood'],spend:['spent','spent'],think:['thought','thought'],put:['put','put'],cut:['cut','cut'],
  hurt:['hurt','hurt'],lead:['led','led'],grow:['grew','grown'],throw:['threw','thrown'],choose:['chose','chosen'],keep:['kept','kept'],hold:['held','held'],
  send:['sent','sent'],pay:['paid','paid'],say:['said','said'],sell:['sold','sold'],stand:['stood','stood'],fall:['fell','fallen'],drive:['drove','driven']};
const DBL=new Set('stop plan shop jog hop chat drop hug clap swim run sit begin get put cut win forget'.split(' '));
const head=v=>v.split(' ')[0],tail=v=>{const i=v.indexOf(' ');return i<0?'':v.slice(i)};
function b3(v){if(v==='have')return 'has';if(v==='do')return 'does';if(v==='go')return 'goes';if(/(s|x|z|ch|sh)$/.test(v))return v+'es';if(/[^aeiou]y$/.test(v))return v.slice(0,-1)+'ies';return v+'s'}
function bPast(v){if(IRV[v])return IRV[v][0];if(/e$/.test(v))return v+'d';if(/[^aeiou]y$/.test(v))return v.slice(0,-1)+'ied';if(DBL.has(v))return v+v.slice(-1)+'ed';return v+'ed'}
function bPP(v){return IRV[v]?IRV[v][1]:bPast(v)}
function bIng(v){if(/ie$/.test(v))return v.slice(0,-2)+'ying';if(/[^e]e$/.test(v)&&v!=='be')return v.slice(0,-1)+'ing';if(DBL.has(v))return v+v.slice(-1)+'ing';return v+'ing'}
const EN={base:v=>v,s3:v=>b3(head(v))+tail(v),past:v=>bPast(head(v))+tail(v),pp:v=>bPP(head(v))+tail(v),ing:v=>bIng(head(v))+tail(v)};
const AN=w=>/^(a|e|i|o|u|honest|hour)/i.test(w)&&!/^(uni|use|eu|one)/i.test(w)?'an':'a';

// ───────── 주어 ─────────
// t: me · you · kid(아이) · adult(어른) · old(할머니·할아버지) · pron(그·그녀·우리·그들) · ani(동물)
// s: 3인칭 단수 / pl: 여럿 / r: 재귀 / po: 소유격 / pr: 뒷문장에서 받는 대명사 / q: 물을 때 바뀌는 말(나의 → 너의)
const SUBJ=[
 {en:'I',ko:'나',nom:'내가',t:'me',r:'myself',po:'my',pr:'I'},
 {en:'you',ko:'너',nom:'네가',t:'you',r:'yourself',po:'your',pr:'you'},
 {en:'he',ko:'그',t:'pron',s:1,r:'himself',po:'his',pr:'he'},
 {en:'she',ko:'그녀',t:'pron',s:1,r:'herself',po:'her',pr:'she'},
 {en:'we',ko:'우리',t:'pron',pl:1,r:'ourselves',po:'our',pr:'we'},
 {en:'they',ko:'그들',t:'pron',pl:1,r:'themselves',po:'their',pr:'they'},
 {en:'my mom',ko:'우리 엄마',qen:'your mom',qko:'너희 엄마',t:'adult',s:1,r:'herself',po:'her',pr:'she'},
 {en:'my dad',ko:'우리 아빠',qen:'your dad',qko:'너희 아빠',t:'adult',s:1,r:'himself',po:'his',pr:'he'},
 {en:'my grandma',ko:'우리 할머니',qen:'your grandma',qko:'너희 할머니',t:'old',s:1,r:'herself',po:'her',pr:'she'},
 {en:'my grandpa',ko:'우리 할아버지',qen:'your grandpa',qko:'너희 할아버지',t:'old',s:1,r:'himself',po:'his',pr:'he'},
 {en:'my friend',ko:'내 친구',qen:'your friend',qko:'네 친구',t:'kid',s:1},
 {en:'the teacher',ko:'선생님',t:'adult',s:1},
 {en:'my friends',ko:'내 친구들',qen:'your friends',qko:'네 친구들',t:'kid',pl:1,r:'themselves',po:'their',pr:'they'},
 {en:'the students',ko:'그 학생들',t:'kid',pl:1,r:'themselves',po:'their',pr:'they'},
 {en:'the dog',ko:'그 개',t:'ani',s:1,an:'dog'},
 {en:'the cat',ko:'그 고양이',t:'ani',s:1,an:'cat'},
 {en:'the dogs',ko:'그 개들',t:'ani',pl:1,an:'dog'},
 {en:'my neighbor',ko:'우리 이웃',qen:'your neighbor',qko:'너희 이웃',t:'adult',s:1,lv:2},
 {en:'the doctor',ko:'그 의사',t:'adult',s:1,lv:2},
 {en:'the scientists',ko:'그 과학자들',t:'adult',pl:1,lv:3,r:'themselves',po:'their',pr:'they'},
 {en:'the professor',ko:'그 교수님',t:'adult',s:1,lv:3},
 {en:'my classmate',ko:'우리 반 친구',qen:'your classmate',qko:'너희 반 친구',t:'kid',s:1},
 {en:'my cousin',ko:'내 사촌',qen:'your cousin',qko:'네 사촌',t:'kid',s:1},
 {en:'the boy',ko:'그 남자아이',t:'kid',s:1,r:'himself',po:'his',pr:'he'},
 {en:'the girl',ko:'그 여자아이',t:'kid',s:1,r:'herself',po:'her',pr:'she'},
 {en:'the children',ko:'그 아이들',t:'kid',pl:1,r:'themselves',po:'their',pr:'they'},
 {en:'my classmates',ko:'우리 반 친구들',qen:'your classmates',qko:'너희 반 친구들',t:'kid',pl:1,lv:2,r:'themselves',po:'their',pr:'they'},
 {en:'my teacher',ko:'우리 선생님',qen:'your teacher',qko:'너희 선생님',t:'adult',s:1,nj:1},
 {en:'my parents',ko:'우리 부모님',qen:'your parents',qko:'너희 부모님',t:'adult',pl:1,r:'themselves',po:'their',pr:'they'},
 {en:'the farmer',ko:'그 농부',t:'adult',s:1,lv:2},
 {en:'the nurse',ko:'그 간호사',t:'adult',s:1,lv:2},
 {en:'my coach',ko:'우리 코치님',qen:'your coach',qko:'너희 코치님',t:'adult',s:1,lv:2,nj:1},
 {en:'the police officer',ko:'그 경찰관',t:'adult',s:1,lv:2},
 {en:'the artist',ko:'그 화가',t:'adult',s:1,lv:3},
 {en:'the engineers',ko:'그 엔지니어들',t:'adult',pl:1,lv:3,r:'themselves',po:'their',pr:'they'},
 {en:'the puppy',ko:'그 강아지',t:'ani',s:1,an:'dog'}
];
SUBJ.forEach((x,i)=>{x.i=i;x.lv=x.lv||1;x.nom=x.nom||josa(x.ko,'이/가');x.top=josa(x.ko,'은/는');
  x.be=x.s?'is':x.t==='me'?'am':'are';x.was=x.s||x.t==='me'?'was':'were';x.do=x.s?'does':'do'});
const PEOPLE=['me','you','kid','adult','old','pron'];

// ───────── 동사구 ─────────
// e: 영어 동사(+뒤에 붙는 말) · k: 한국어 기본형 · p: 목적어 조사(을·에·이·에게·에서) · o: [영어, 한국어, 단계(1 초등·2 중등·3 수능), 표시]
// 표시: h0 = 「매일」 같은 말과 안 어울림 · xA = 어른·할머니 빼기 · xO = 할머니·할아버지 빼기 · xK = 아이 빼기 · a = 동물도 됨
// 묶음 표시: st = 상태(진행형·때 말 없음) · sk = 할 줄 아는 것(can) · h = 「매일·주말마다」 됨 · n = 부정일 때 바뀌는 한국어(있다→없다)
// po = 영어에 {po}(his·her…)가 들어감 → 성별을 아는 주어만
const V=(e,k,p,o,f)=>Object.assign({e,k,p,o:o?o.map(x=>({en:x[0],ko:x[1],lv:x[2]||1,f:x[3]||''})):null},f||{});
const VP=[
 V('play','하다','을',[['soccer','축구'],['basketball','농구',1,'xO'],['baseball','야구'],['tennis','테니스'],['badminton','배드민턴'],['dodgeball','피구',1,'xA'],
   ['board games','보드게임'],['computer games','컴퓨터 게임'],['tag','술래잡기',1,'xA'],['hide-and-seek','숨바꼭질',1,'xA'],['volleyball','배구',2],['table tennis','탁구',2],['chess','체스',2],['golf','골프',3,'xK'],['jacks','공기놀이',1,'xA'],['cards','카드놀이'],['rugby','럭비',2],['ice hockey','아이스하키',3]],{h:1,sk:1}),
 V('play','치다','을',[['the piano','피아노'],['the guitar','기타'],['the drums','드럼'],['the ukulele','우쿨렐레',2]],{h:1,sk:1}),
 V('play','켜다','을',[['the violin','바이올린',2],['the cello','첼로',3]],{h:1,sk:1}),
 V('play','불다','을',[['the recorder','리코더'],['the flute','플루트',2]],{h:1,sk:1}),
 V('eat','먹다','을',[['apples','사과'],['bread','빵'],['rice','밥'],['pizza','피자'],['noodles','국수'],['ice cream','아이스크림'],['cookies','쿠키'],['carrots','당근'],
   ['fish','생선'],['eggs','달걀'],['sandwiches','샌드위치'],['vegetables','채소',2],['salad','샐러드',2],['cereal','시리얼',2],['seafood','해산물',3],['organic food','유기농 음식',3],['bananas','바나나'],['strawberries','딸기'],['chicken','치킨'],['soup','국'],['kimchi','김치'],['dumplings','만두'],['tofu','두부',2],['oranges','오렌지'],['grapes','포도'],['spaghetti','스파게티',2],['steak','스테이크',2]],{h:1}),
 V('drink','마시다','을',[['milk','우유'],['water','물'],['juice','주스'],['hot chocolate','코코아',2],['green tea','녹차',3],['coffee','커피',2,'xK'],['lemonade','레모네이드'],['soda','탄산음료'],['tea','차',2],['smoothies','스무디',2]],{h:1}),
 V('like','좋아하다','을',[['pizza','피자'],['cats','고양이'],['dogs','개'],['music','음악'],['math','수학'],['science','과학'],['English','영어'],['books','책'],['summer','여름'],
   ['winter','겨울'],['ice cream','아이스크림'],['soccer','축구'],['history','역사',2],['art','미술',2],['spicy food','매운 음식',2],['horror movies','공포 영화',2],['classical music','클래식 음악',3],['poetry','시',3],['jazz','재즈',3]],{st:1}),
 V('watch','보다','을',[['TV','TV'],['movies','영화'],['cartoons','만화'],['soccer games','축구 경기'],['the news','뉴스',2,'xK'],['dramas','드라마',2],['documentaries','다큐멘터리',3],['animal videos','동물 영상'],['baseball games','야구 경기'],['musicals','뮤지컬',2],['the stars','별',2,'h0']],{h:1}),
 V('read','읽다','을',[['books','책'],['comics','만화책'],['stories','이야기'],['novels','소설',2],['the newspaper','신문',2,'xK'],['magazines','잡지',2],['poems','시',3],['articles','기사',3],['biographies','위인전',3],['fairy tales','동화'],['picture books','그림책'],['science books','과학책'],['history books','역사책',2],['essays','수필',3]],{h:1}),
 V('study','공부하다','을',[['English','영어'],['math','수학'],['science','과학'],['Korean','국어',1,'xA'],['history','역사',2],['Chinese','중국어',2],['Japanese','일본어',2],['economics','경제학',3,'xO'],['philosophy','철학',3,'xO'],['psychology','심리학',3,'xO'],['art','미술'],['music','음악'],['social studies','사회',1,'xA'],['biology','생물학',3,'xO'],['physics','물리학',3,'xO']],{h:1}),
 V('go','가다','에',[['to school','학교',1,'xA'],['to the park','공원',1,'a'],['to the library','도서관'],['to the zoo','동물원',1,'h0'],['to the pool','수영장'],['to the store','가게'],
   ['to the beach','해변',1,'h0'],['to the hospital','병원',2,'h0'],['to the museum','박물관',2,'h0'],['to the market','시장',2],['to the airport','공항',3,'h0'],['to the dentist','치과',3,'h0'],['to city hall','시청',3,'h0'],['to the bakery','빵집'],['to the playground','놀이터',1,'xA'],['to the mall','쇼핑몰',2],['to the gym','체육관',2],['to the bank','은행',2,'xK']],{h:1,go:1}),
 V('clean','청소하다','을',[['the room','방'],['the kitchen','부엌'],['the classroom','교실'],['the bathroom','화장실'],['the house','집'],['the garage','차고',2],['the laboratory','실험실',3,'xK'],['the desk','책상'],['the windows','창문'],['the car','차',2],['the yard','마당',2]],{h:1}),
 V('make','만들다','을',[['cookies','쿠키'],['sandwiches','샌드위치'],['a cake','케이크',1,'h0'],['paper planes','종이비행기'],['a snowman','눈사람',1,'h0'],['pancakes','팬케이크',2],['a robot','로봇',2,'h0'],['a short film','단편 영화',3,'h0'],['soup','수프'],['a sandcastle','모래성',1,'h0'],['a kite','연',1,'h0'],['kimchi','김치',2],['bracelets','팔찌',2],['a website','웹사이트',3,'h0']],{h:1}),
 V('draw','그리다','을',[['pictures','그림'],['cats','고양이'],['flowers','꽃'],['maps','지도',2],['cartoons','만화',2],['portraits','초상화',3],['dogs','개'],['robots','로봇'],['trees','나무'],['landscapes','풍경화',3]],{h:1,sk:1}),
 V('have','있다','이',[['a dog','개'],['an umbrella','우산'],['an orange','오렌지'],['an eraser','지우개'],['an old bike','낡은 자전거',2],['an iguana','이구아나',2],['a cat','고양이'],['a bike','자전거'],['a ball','공'],['a car','차',2,'xK'],['a garden','정원',2,'xK'],['a laptop','노트북',3],['a passport','여권',3],['a hamster','햄스터'],['a rabbit','토끼'],['a piano','피아노'],['a tablet','태블릿',2],['a camera','카메라',2]],{st:1,n:'없다',have:1}),
 V('swim','수영하다',null,null,{h:1,sk:1,a:['dog']}),
 V('run','달리다',null,null,{h:1,a:['dog','cat']}),
 V('sleep','자다',null,null,{a:['dog','cat'],nt:1}),
 V('sing','노래하다',null,null,{h:1,sk:1}),
 V('dance','춤추다',null,null,{h:1,sk:1}),
 V('cook','요리하다',null,null,{h:1,sk:1}),
 V('walk','걸어가다','에',[['to school','학교',1,'xA'],['to the park','공원'],['to the library','도서관'],['to the station','역',2]],{h:1,go:1}),
 V('ride','타다','을',[['a bike','자전거'],['a horse','말',1,'h0'],['the bus','버스'],['a skateboard','스케이트보드'],['the subway','지하철',2],['a motorcycle','오토바이',3,'xK'],['a scooter','킥보드'],['the train','기차'],['a boat','배',2,'h0']],{h:1,sk:1}),
 V('learn','배우다','을',[['English','영어'],['Taekwondo','태권도'],['the piano','피아노'],['swimming','수영'],['coding','코딩',2],['ballet','발레',2],['calligraphy','서예',3],['sign language','수어',3],['the guitar','기타'],['soccer','축구'],['Chinese','중국어',2],['cooking','요리',2],['magic tricks','마술',2],['photography','사진',3]],{h:1}),
 V('teach','가르치다','을',[['English','영어'],['math','수학'],['science','과학'],['music','음악'],['history','역사',2],['art','미술',2],['economics','경제학',3],['Korean','국어'],['dance','춤',2],['cooking','요리',2],['physics','물리학',3]],{h:1,x:['me','you','kid']}),
 V('help','돕다','을',[['the teacher','선생님'],['my mom','우리 엄마',1,'nm'],['my neighbors','우리 이웃들',2],['the patients','환자들',3,'xK']],{h:1}),
 V('open','열다','을',[['the door','문'],['the window','창문'],['the box','상자',1,'h0'],['the gate','대문',2],['the package','택배 상자',3,'h0']],{}),
 V('close','닫다','을',[['the door','문'],['the window','창문'],['the curtains','커튼',2]],{}),
 V('meet','만나다','을',[['friends','친구들'],['the teacher','선생님'],['the doctor','의사 선생님',2],['the client','고객',3,'xK']],{h:1}),
 V('listen to','듣다','을',[['music','음악'],['the radio','라디오'],['songs','노래'],['podcasts','팟캐스트',2],['lectures','강의',3],['classical music','클래식 음악',3],['K-pop','케이팝'],['audiobooks','오디오북',2]],{h:1}),
 V('wait for','기다리다','을',[['the bus','버스'],['my friend','내 친구',1,'nf'],['the train','기차',2],['the results','결과',3]],{}),
 V('write','쓰다','을',[['letters','편지'],['stories','이야기'],['emails','이메일',2],['essays','에세이',2],['reports','보고서',3,'xK'],['poems','시',3],['cards','카드'],['notes','쪽지'],['songs','노래',2],['blog posts','블로그 글',3]],{h:1}),
 V('buy','사다','을',[['bread','빵'],['milk','우유'],['books','책'],['flowers','꽃'],['a present','선물',1,'h0'],['a new bike','새 자전거',1,'h0'],['a ticket','표',2,'h0'],['groceries','식료품',2],['a house','집',3,'xK h0'],['apples','사과'],['snacks','과자'],['clothes','옷'],['shoes','신발'],['vegetables','채소'],['a laptop','노트북',3,'h0']],{h:1}),
 V('speak','하다','을',[['English','영어'],['Korean','한국어'],['Chinese','중국어',2],['Japanese','일본어',2],['French','프랑스어',3],['Spanish','스페인어',3],['German','독일어',3],['Vietnamese','베트남어',3]],{st:1,sk:1}),
 V('brush','닦다','을',[['{po} teeth','이']],{h:1,po:1}),
 V('do','하다','을',[['{po} homework','숙제',1,'xA'],['the dishes','설거지']],{h:1,po:1}),
 V('get up','일어나다',null,null,{h:1,rt:1}),
 V('come','오다','에',[['home','집']],{h:1,rt:1,go:1,home:1}),
 V('go to bed','자러 가다',null,null,{h:1,rt:1}),
 V('take','하다','을',[['a shower','샤워'],['a walk','산책',2]],{h:1}),
 V('visit','방문하다','을',[['the museum','박물관'],['Seoul','서울'],['the palace','궁궐',2],['the factory','공장',3,'xK'],['Busan','부산'],['the zoo','동물원'],['the farm','농장'],['the aquarium','아쿠아리움',2]],{lv:2}),
 V('borrow','빌리다','을',[['books','책'],['an umbrella','우산',2,'h0']],{lv:2,h:1}),
 V('practice','연습하다','을',[['the piano','피아노'],['soccer','축구'],['the speech','연설',3,'h0'],['the violin','바이올린'],['basketball','농구'],['the song','노래',2,'h0'],['the dance','춤',2,'h0']],{lv:2,h:1}),
 V('solve','풀다','을',[['math problems','수학 문제'],['the puzzle','퍼즐',2,'h0'],['the mystery','수수께끼',3,'h0']],{lv:2,h:1,sk:1}),
 V('recycle','재활용하다','을',[['plastic','플라스틱'],['paper','종이'],['cans','캔']],{lv:2,h:1}),
 V('save','아끼다','을',[['water','물'],['money','돈'],['energy','에너지',3]],{lv:2,ab:1}),
 V('protect','보호하다','을',[['the environment','환경'],['animals','동물'],['endangered species','멸종 위기 동물',3]],{lv:2,ab:1}),
 V('explain','설명하다','을',[['the rules','규칙'],['the problem','문제']],{lv:2,x:['kid']}),
 V('prepare','준비하다','을',[['dinner','저녁',2],['the presentation','발표',2],['the documents','서류',3,'xK']],{lv:2}),
 V('exercise','운동하다',null,null,{lv:2,h:1}),
 V('volunteer','봉사하다',null,null,{lv:2,h:1}),
 V('travel','여행하다',null,null,{lv:2}),
 V('analyze','분석하다','을',[['the data','데이터',3],['the results','결과',3]],{lv:3,x:['kid']}),
 V('conduct','하다','을',[['research','연구',3],['experiments','실험',3],['a survey','설문 조사',3,'h0']],{lv:3,x:['kid']}),
 V('reduce','줄이다','을',[['waste','쓰레기',3],['stress','스트레스',3],['costs','비용',3,'xK']],{lv:3,ab:1}),
 V('acquire','익히다','을',[['new skills','새로운 기술',3],['knowledge','지식',3]],{lv:3,ab:1}),
 V('participate in','참여하다','에',[['the competition','대회',3],['the discussion','토론',3],['the project','프로젝트',3]],{lv:3}),
 V('contribute to','기여하다','에',[['society','사회',3],['the project','프로젝트',3]],{lv:3,x:['kid'],ab:1}),
 V('persuade','설득하다','을',[['{po} parents','부모님',3],['the teacher','선생님',3]],{lv:3,po:1,ab:1}),
 V('concentrate','집중하다',null,null,{lv:2,h:1}),
 V('climb','오르다','에',[['trees','나무'],['the mountain','산'],['the rope','밧줄',2]],{h:1,sk:1}),
 V('fly','날리다','을',[['a kite','연'],['a drone','드론',2]],{h:1,sk:1}),
 V('skate','스케이트를 타다',null,null,{h:1,sk:1}),
 V('ski','스키를 타다',null,null,{h:1,sk:1,lv:2}),
 V('jump rope','줄넘기하다',null,null,{h:1,sk:1}),
 V('whistle','휘파람을 불다',null,null,{h:1,sk:1,lv:2}),
 V('fix','고치다','을',[['bikes','자전거'],['computers','컴퓨터',2],['the roof','지붕',3,'xK']],{h:1,sk:1}),
 V('build','만들다','을',[['sandcastles','모래성'],['robots','로봇',2],['websites','웹사이트',3]],{h:1,sk:1}),
 V('feed','먹이를 주다','에게',[['the dog','개'],['the fish','물고기'],['the chickens','닭',2]],{h:1}),
 V('wear','쓰다','을',[['a helmet','헬멧'],['a mask','마스크'],['a hat','모자']],{h:1}),
 V('wash','씻다','을',[['{po} hands','손']],{h:1,po:1}),
 V('tidy up','정리하다','을',[['{po} room','방'],['{po} desk','책상']],{h:1,po:1})
];
VP.forEach((v,i)=>{v.i=i;v.lv=v.lv||1;if(v.o)v.o.forEach((o,j)=>{o.j=j;if(v.lv>o.lv)o.lv=v.lv})});

// ───────── be 뒤에 오는 말 ─────────
// 형용사: [영어, 한국어 기본형, 단계, 표시] 표시: a 동물도 · tr 성격·생김새(「어제」 안 붙임) · fe 느낌(왜 물어보기 좋음) · c 이다형 · n:없다형
const AD=(en,ko,lv,f,n)=>({en,ko,lv:lv||1,f:f||'',n});
const ADJ=[
 AD('happy','행복하다',1,'a fe'),AD('hungry','배가 고프다',1,'a fe'),AD('full','배가 부르다',1,'a fe'),AD('tired','피곤하다',1,'a fe'),AD('sad','슬프다',1,'a fe'),
 AD('sleepy','졸리다',1,'a fe'),AD('busy','바쁘다',1,'fe'),AD('sick','아프다',1,'a fe'),AD('cold','춥다',1,'a fe'),AD('hot','덥다',1,'a fe'),AD('thirsty','목이 마르다',1,'a fe'),
 AD('bored','심심하다',1,'fe'),AD('kind','친절하다',1,'tr'),AD('funny','웃기다',1,'tr'),AD('cute','귀엽다',1,'a tr'),AD('smart','똑똑하다',1,'a tr'),AD('tall','키가 크다',1,'tr'),
 AD('strong','힘이 세다',1,'tr'),AD('fast','빠르다',1,'a tr'),AD('quiet','조용하다',1,'a'),
 AD('angry','화가 나다',1,'a fe'),AD('scared','무섭다',1,'a fe'),AD('excited','신나다',1,'a fe'),AD('short','키가 작다',1,'tr'),AD('friendly','다정하다',1,'a tr'),
 AD('shy','수줍음이 많다',1,'a tr'),AD('slow','느리다',1,'a tr'),AD('weak','힘이 약하다',1,'tr'),AD('young','어리다',1,'a tr'),
 AD('lonely','외롭다',2,'a fe'),AD('healthy','건강하다',2,'a'),AD('honest','정직하다',2,'tr'),AD('brave','용감하다',2,'a tr'),AD('lazy','게으르다',2,'a tr'),AD('famous','유명하다',2,'tr'),
 AD('curious','호기심이 많다',2,'a tr'),AD('upset','속상하다',2,'fe'),AD('calm','침착하다',2,'tr'),AD('polite','예의 바르다',2,'tr'),AD('popular','인기가 많다',2,'tr'),AD('nervous','긴장되다',2,'fe'),
 AD('proud','뿌듯하다',2,'fe'),AD('worried','걱정되다',2,'fe'),AD('careful','조심성이 많다',2,'tr'),AD('clever','영리하다',2,'a tr'),AD('gentle','온순하다',2,'a tr'),
 AD('wise','지혜롭다',2,'tr'),AD('rude','무례하다',2,'tr'),AD('cheerful','쾌활하다',2,'tr'),AD('active','활발하다',2,'a tr'),AD('embarrassed','창피하다',2,'fe'),
 AD('diligent','성실하다',3,'tr'),AD('generous','너그럽다',3,'tr'),AD('confident','자신감이 있다',3,'tr','자신감이 없다'),AD('responsible','책임감이 있다',3,'tr','책임감이 없다'),
 AD('patient','참을성이 있다',3,'tr','참을성이 없다'),AD('anxious','불안하다',3,'fe'),AD('modest','겸손하다',3,'tr'),AD('sensitive','예민하다',3,'tr'),AD('stubborn','고집이 세다',3,'tr'),
 AD('mature','성숙하다',3,'tr'),AD('independent','독립적',3,'tr c'),AD('ambitious','야망이 있다',3,'tr','야망이 없다'),AD('optimistic','낙천적',3,'tr c'),AD('exhausted','지쳐 있다',3,'fe'),
 AD('considerate','사려 깊다',3,'tr'),AD('talented','재능이 있다',3,'tr','재능이 없다'),AD('sincere','진실하다',3,'tr'),AD('cautious','신중하다',3,'tr'),AD('energetic','활기차다',3,'a tr'),
 AD('grateful','고맙다',3,'fe'),AD('frustrated','답답하다',3,'fe'),AD('relieved','안심이 되다',3,'fe')
];
const PLACE=[ // be + 곳: 「있다/없다」
 AD('at home','집에 있다',1,'a','집에 없다'),AD('at school','학교에 있다',1,'','학교에 없다'),AD('in the park','공원에 있다',1,'a','공원에 없다'),
 AD('in the library','도서관에 있다',1,'','도서관에 없다'),AD('in the kitchen','부엌에 있다',1,'a','부엌에 없다'),AD('in the garden','정원에 있다',2,'a','정원에 없다'),
 AD('in the hospital','병원에 있다',2,'','병원에 없다'),AD('at the museum','박물관에 있다',2,'','박물관에 없다'),AD('at the airport','공항에 있다',3,'','공항에 없다'),
 AD('in the laboratory','실험실에 있다',3,'xK','실험실에 없다'),
 AD('at the zoo','동물원에 있다',1,'a','동물원에 없다'),AD('at the beach','해변에 있다',1,'a','해변에 없다'),AD('in the classroom','교실에 있다',1,'','교실에 없다'),
 AD('in the living room','거실에 있다',1,'a','거실에 없다'),AD('in the car','차 안에 있다',1,'a','차 안에 없다'),AD('at the store','가게에 있다',1,'','가게에 없다'),
 AD('at the bank','은행에 있다',2,'','은행에 없다'),AD('at the station','역에 있다',2,'','역에 없다'),AD('in the gym','체육관에 있다',2,'','체육관에 없다'),
 AD('at the bakery','빵집에 있다',2,'','빵집에 없다'),AD('in the auditorium','강당에 있다',3,'','강당에 없다'),AD('at the conference','회의에 가 있다',3,'xK','회의에 가 있지 않다')
];
const JOB=[ // be + 직업: [영어 하나, 영어 여럿, 한국어, 단계]
 ['student','students','학생',1],['doctor','doctors','의사',1],['nurse','nurses','간호사',1],['cook','cooks','요리사',1],['farmer','farmers','농부',1],['singer','singers','가수',1],
 ['police officer','police officers','경찰관',1],['firefighter','firefighters','소방관',2],['pilot','pilots','비행기 조종사',2],['scientist','scientists','과학자',2],['engineer','engineers','엔지니어',2],
 ['dentist','dentists','치과 의사',2],['lawyer','lawyers','변호사',3],['architect','architects','건축가',3],['journalist','journalists','기자',3],['professor','professors','교수',3],
 ['teacher','teachers','선생님',1],['actor','actors','배우',1],['office worker','office workers','회사원',1],['English teacher','English teachers','영어 선생님',1],['animal doctor','animal doctors','동물 의사',1],['baker','bakers','제빵사',2],['vet','vets','수의사',2],['writer','writers','작가',2],['artist','artists','화가',2],['musician','musicians','음악가',2],
 ['soldier','soldiers','군인',2],['dancer','dancers','무용수',2],['photographer','photographers','사진작가',3],['designer','designers','디자이너',3],['astronaut','astronauts','우주 비행사',3]
].map(([en,pl,ko,lv],i)=>({en,pl,ko,lv,i}));
ADJ.forEach((x,i)=>x.i=i);PLACE.forEach((x,i)=>x.i=i);

// 때를 나타내는 말
const TIME={hab:[['every day','매일'],['on weekends','주말마다'],['in the morning','아침에'],['after school','방과 후에','kid']],
  past:[['yesterday','어제'],['last weekend','지난 주말에'],['last night','어젯밤에']],
  fut:[['tomorrow','내일'],['this weekend','이번 주말에'],['next week','다음 주에']]};

window.TALKCORE={dec,com,jong,josa,KO,COP,EN,AN,IRV,SUBJ,PEOPLE,VP,ADJ,PLACE,JOB,TIME};
})();
