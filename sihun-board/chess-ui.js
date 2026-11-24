// 시훈이 대시보드 체스: 규칙은 vendor/chess.js(chess.js 1.4.0, BSD-2), 컴퓨터 상대는 여기서 직접 계산(알파베타 탐색).
// 진행 중인 판은 이 태블릿에만 저장(localStorage), 끝난 판 결과는 엄마 확인용으로 Firestore(sihunBoard/main/chess)에 남김.
import {Chess} from "./vendor/chess.js";

const VAL={p:100,n:320,b:330,r:500,q:900,k:0};
// 가운데를 좋아하게 하는 간단한 위치 점수
const CENTER=[0,1,2,3,3,2,1,0];
function evalBoard(g){ // 흰색 기준 점수
 let s=0;const b=g.board();
 for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(!p)continue;
  let v=VAL[p.type]+(p.type==="n"||p.type==="b"||p.type==="p"?(CENTER[r]+CENTER[c])*4:0);
  if(p.type==="p")v+=(p.color==="w"?(6-r):(r-1))*6;
  s+=p.color==="w"?v:-v}
 return s}
function order(ms){return ms.sort((a,b)=>(b.captured?VAL[b.captured]*10-VAL[b.piece]:0)-(a.captured?VAL[a.captured]*10-VAL[a.piece]:0)+((b.promotion?1:0)-(a.promotion?1:0))*900)}
function search(g,depth,alpha,beta,max){
 if(g.isCheckmate())return max?-100000-depth:100000+depth;
 if(g.isDraw()||g.isStalemate())return 0;
 if(depth===0)return evalBoard(g);
 const ms=order(g.moves({verbose:true}));
 if(max){let best=-Infinity;for(const m of ms){g.move(m);best=Math.max(best,search(g,depth-1,alpha,beta,false));g.undo();alpha=Math.max(alpha,best);if(beta<=alpha)break}return best}
 let best=Infinity;for(const m of ms){g.move(m);best=Math.min(best,search(g,depth-1,alpha,beta,true));g.undo();beta=Math.min(beta,best);if(beta<=alpha)break}return best}
export function bestMove(fen,level){
 const g=new Chess(fen);const ms=g.moves({verbose:true});if(!ms.length)return null;
 if(level==="easy"&&Math.random()<0.35)return ms[Math.floor(Math.random()*ms.length)];
 const depth=level==="hard"?3:level==="normal"?2:1;const white=g.turn()==="w";
 let best=[],bestS=white?-Infinity:Infinity;
 for(const m of order(ms)){g.move(m);const sc=search(g,depth-1,-Infinity,Infinity,!white);g.undo();
  if(white?sc>bestS:sc<bestS){bestS=sc;best=[m]}else if(sc===bestS)best.push(m)}
 return best[Math.floor(Math.random()*best.length)]}

const GLYPH={k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟\uFE0E"};// ♟는 안드로이드에서 그림 이모지로 바뀌지 않게 글자 모양 표시(FE0E)
const LV={easy:"쉬움",normal:"보통",hard:"어려움"};
export function mountChess(el,{onEnd,gate,pay}){
 let st;try{st=JSON.parse(localStorage.getItem("sbChess")||"null")}catch(e){st=null}
 st=st||{fen:null,me:"w",level:"easy",hist:[]};
 let g=new Chess(st.fen||undefined);let sel=null,thinking=false,last=null,ended=false,paying=false;
 // 한 판에 1점: 시훈이가 그 판의 첫 수를 둘 때 낸다(st.paid). 저장돼 있던 진행 중 판은 이미 낸 것으로 봄.
 if(st.paid===undefined)st.paid=g.history().length>0;
 const save=()=>{try{localStorage.setItem("sbChess",JSON.stringify({fen:g.fen(),me:st.me,level:st.level,paid:st.paid}))}catch(e){}};
 const status=()=>{if(g.isCheckmate())return g.turn()===st.me?"체크메이트! 컴퓨터가 이겼어.":"체크메이트! 시훈이가 이겼어!";
  if(g.isStalemate())return"스테일메이트, 비겼어.";if(g.isDraw())return"비겼어.";
  if(thinking)return"컴퓨터가 생각 중…";return(g.inCheck()?"체크! ":"")+(g.turn()===st.me?"시훈이 차례":"컴퓨터 차례")};
 function finish(){if(ended||!g.isGameOver())return;ended=true;
  const res=g.isCheckmate()?(g.turn()===st.me?"lose":"win"):"draw";
  onEnd&&onEnd({result:res,level:st.level,color:st.me,moves:g.history().length,pgn:g.pgn().slice(0,4000)})}
 const inProg=()=>g.history().length>0&&!g.isGameOver();
 function render(){
  const gt=gate?gate():null;
  if(gt&&!ended&&(gt.lock||(!inProg()&&gt.used>=gt.limit))){
   el.innerHTML=`<div style="text-align:center;padding:24px 8px;display:grid;gap:8px"><b style="font-family:var(--hand);font-size:1.6rem">${gt.lock?"잠겨 있어요":"오늘 체스는 끝!"}</b><span class="meta">${gt.lock||`오늘 ${gt.limit}판 다 했어. 내일 또 하자.`}</span></div>`;return}
  const flip=st.me==="b";const b=g.board();const legal=sel?g.moves({square:sel,verbose:true}).map(m=>m.to):[];
  let cells="";
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){const r=flip?7-i:i,c=flip?7-j:j;const sq="abcdefgh"[c]+(8-r);const p=b[r][c];
   const dark=(r+c)%2===1;const isSel=sel===sq,isLeg=legal.includes(sq),isLast=last&&(last.from===sq||last.to===sq);
   cells+=`<button class="cq" data-sq="${sq}" style="background:${isSel?"#f7c873":isLast?"#f3d9a4":dark?"#8fcfb8":"#fbf5e8"}" aria-label="${sq}">${p?`<span class="pc ${p.color}">${GLYPH[p.type]}</span>`:""}${isLeg?`<span class="dot ${p?"cap":""}"></span>`:""}</button>`}
  el.innerHTML=`<div class="row between"><span class="meta">난이도</span><div class="tabs">${Object.entries(LV).map(([k,v])=>`<button data-lv="${k}" aria-pressed="${k===st.level}">${v}</button>`).join("")}</div></div>
  <div class="row between"><b id="chStatus">${status()}</b><span class="meta">${!st.paid&&pay?"첫 수에 1점 · ":""}${gt?(gt.used+1>=gt.limit?"오늘 마지막 판 · ":`오늘 ${gt.used+1}/${gt.limit}판째 · `):""}시훈이 ${st.me==="w"?"흰색":"검은색"}</span></div>
  <div class="board">${cells}</div>
  <div class="row"><button class="btn small" data-ch="undo">한 수 무르기</button><button class="btn small" data-ch="new">새 판</button></div>`;
  el.querySelectorAll(".cq").forEach(x=>x.onclick=()=>tap(x.dataset.sq));
  el.querySelectorAll("[data-lv]").forEach(x=>x.onclick=()=>{if(thinking)return;st.level=x.dataset.lv;save();render()});
  el.querySelector('[data-ch=undo]').onclick=undo;el.querySelector('[data-ch=new]').onclick=newGame}
 async function tap(sq){if(thinking||paying||g.isGameOver()||g.turn()!==st.me)return;const p=g.get(sq);
  if(sel){const mv=g.moves({square:sel,verbose:true}).find(m=>m.to===sq);
   if(mv){if(!st.paid&&pay){paying=true;const ok=await pay();paying=false;if(!ok){sel=null;render();return}st.paid=true;save()}
    const first=g.history().length===0;const gt=gate?gate():null;if(first&&gt&&gt.used+1>=gt.limit)setTimeout(()=>{const t=document.createElement("div");t.className="toast";t.textContent="오늘 마지막 판이야";document.body.appendChild(t);setTimeout(()=>t.remove(),2600)},10);
    const m=g.move({from:sel,to:sq,promotion:"q"});last=m;sel=null;save();render();finish();setTimeout(cpu,250);return}}
  sel=p&&p.color===st.me?sq:null;render()}
 function cpu(){if(g.isGameOver()||g.turn()===st.me)return;thinking=true;render();
  setTimeout(()=>{const m=bestMove(g.fen(),st.level);if(m)last=g.move(m);thinking=false;save();render();finish()},50)}
 function undo(){if(thinking)return;if(g.history().length===0)return;g.undo();if(g.turn()!==st.me&&g.history().length)g.undo();ended=false;sel=null;last=null;save();render();cpu()}
 function newGame(){if(thinking)return;const gt=gate?gate():null;if(gt&&gt.lock)return;
  if(gt&&gt.used+(inProg()?1:0)>=gt.limit&&!(inProg()===false&&gt.used<gt.limit)){const t=document.createElement("div");t.className="toast";t.textContent="오늘 체스는 끝! 내일 또 하자";document.body.appendChild(t);setTimeout(()=>t.remove(),2600);return}
  const box=document.createElement("div");box.className="layer";box.innerHTML=`<form><h3>새 판</h3><label>난이도<select name="lv">${Object.entries(LV).map(([k,v])=>`<option value="${k}" ${k===st.level?"selected":""}>${v}</option>`).join("")}</select></label><label>시훈이 색<select name="me"><option value="w" ${st.me==="w"?"selected":""}>흰색 (먼저 둠)</option><option value="b" ${st.me==="b"?"selected":""}>검은색</option></select></label><div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-x>취소</button><button class="btn primary">시작</button></div></form>`;
  document.body.appendChild(box);box.querySelector("[data-x]").onclick=()=>box.remove();
  box.querySelector("form").onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);
   if(inProg()&&!ended&&onEnd)onEnd({result:"quit",level:st.level,color:st.me,moves:g.history().length,pgn:g.pgn().slice(0,4000)});st.level=fd.get("lv");st.me=fd.get("me");g=new Chess();sel=null;last=null;ended=false;st.paid=false;box.remove();save();render();cpu()}}
 render();cpu();
 return {render:()=>{if(!thinking)render()}};
}
