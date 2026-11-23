// 시훈 공부방 · ✍️ 글쓰기 첨삭 코너 (엄마 11/23)
// 과제 고르기 → 생각 꺼내기(말·자판) → AI 선생님 질문(한 번에 하나, 대신 써 주지 않음) → 순서 맞추기 → 원고지 S펜/종이 사진 → 💾 저장
// 내용은 100% 시훈이 말. AI 요청은 writecoach/<id>, 저장은 writelog/<id>, 엄마가 넣은 과제는 writetasks/list.
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const strip=t=>String(t==null?'':t).replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const SID=Date.now().toString(36);let SEQ=0;
  const LS={get(k,d){try{const v=localStorage.getItem('write:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('write:'+k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem('write:'+k)}catch(e){}}};
  const CSS=`:host{display:block;--bg:#f5f2fa;--card:#fff;--ink:#2a2140;--sub:#6b6680;--line:#e2dcef;--acc:#6b4fa8;--ok:#2e8b57;--bad:#c8462f}
*{box-sizing:border-box}.body{min-height:100vh;background:var(--bg);color:var(--ink);font-family:'Noto Sans KR',system-ui,sans-serif;line-height:1.6}
main{max-width:820px;margin:0 auto;padding:16px 16px 80px}
.top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}.top h1{font:400 28px 'Jua',sans-serif;margin:0;flex:1}
button{font:inherit;cursor:pointer;touch-action:manipulation}
.b{border:none;border-radius:12px;padding:11px 16px;font-weight:700;font-size:16px;background:var(--acc);color:#fff}.b.g{background:#ebe5f6;color:var(--ink)}.b.big{width:100%;font-size:19px;padding:14px}.b:disabled{opacity:.45}
.nav{display:flex;align-items:center;gap:6px;margin:6px 0 12px}.nav button{border:1.5px solid var(--line);background:var(--card);border-radius:12px;padding:8px 12px;font-weight:700;font-size:14px;color:var(--ink)}.nav button:disabled{opacity:.35}.nav span{flex:1;text-align:center;color:var(--sub);font-size:14px;font-weight:700}
.card{background:var(--card);border:1.5px solid var(--line);border-radius:18px;padding:16px;margin-bottom:12px}
.card h2{font:400 22px 'Jua',sans-serif;margin:0 0 8px}.m{color:var(--sub);font-size:14px}
.task{display:block;width:100%;text-align:left;background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:12px 14px;margin:8px 0;color:var(--ink)}.task b{display:block;font-size:17px}
.task.on{border-color:var(--acc);box-shadow:inset 0 0 0 1.5px var(--acc)}
textarea,input[type=text]{width:100%;font:600 18px 'Noto Sans KR';padding:10px;border:2px solid var(--acc);border-radius:12px;color:var(--ink);background:#fff}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.pc{display:flex;gap:8px;align-items:flex-start;background:#f8f5fd;border-radius:12px;padding:8px 10px;margin:6px 0}.pc span{flex:1;font-size:17px}.pc button{border:none;background:none;color:var(--sub);font-size:14px}
.ai{background:#efeafb;border-left:5px solid var(--acc);border-radius:0 12px 12px 0;padding:10px 12px;font-size:19px;margin:10px 0}
.sp{color:var(--bad);font-size:14px;margin:2px 0}
.blk{border:2px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;margin:6px 4px 0 0;font-size:16px;text-align:left;color:var(--ink)}
.built{min-height:60px;border:2px dashed var(--acc);border-radius:12px;padding:10px;font-size:18px;background:#fff}
.gwrap{position:relative;margin-top:10px;background:#fff;border:2px solid #c9a0a0;touch-action:none}
.gwrap canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none}
.photo img{max-width:100%;border-radius:10px;border:1.5px solid var(--line);margin-top:8px}
.ok{color:var(--ok);font-weight:700}.bad{color:var(--bad)}
.steps{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 10px}.steps span{font-size:13px;padding:3px 10px;border-radius:999px;background:#ebe5f6;color:var(--sub)}.steps span.on{background:var(--acc);color:#fff}.steps span.done{background:#dff1e6;color:var(--ok)}`;
  let host,sr,$,W=null,V='list',DB=null,MOMT=[];
  const STEPS=['생각 꺼내기','순서 맞추기','옮겨 쓰기'];
  function mount(){if(sr)return;host=document.createElement('div');host.id='host-write';host.className='apphost';host.hidden=true;document.body.appendChild(host);
    sr=host.attachShadow({mode:'open'});sr.innerHTML=`<style>${CSS}</style><div class="body"><main id="main"></main></div>`;$=s=>sr.querySelector(s);
    sr.addEventListener('click',onClick);HUB.db.then(d=>{DB=d;loadMom()})}
  async function loadMom(){if(!DB)return;try{const s=await DB.doc('writetasks/list').get();MOMT=s.exists?(s.data().items||[]):[]}catch(e){}if(V==='list'&&!host.hidden)render()}
  function essays(){try{return (typeof APP_KO!=='undefined'&&APP_KO.essays)?APP_KO.essays():[]}catch(e){return []}}
  function tasks(){const L=[];
    MOMT.filter(t=>!t.hide).forEach(t=>L.push({id:'mom-'+t.id,kind:'mom',title:t.title,q:t.q||'',note:t.note||'',img:t.img||''}));
    essays().forEach(e=>L.push({id:'ko-'+e.id,kind:'ko',title:`📚 ${e.title} 서술형`,q:e.q,psg:e.psg||'',note:e.pg?`교재 ${e.pg}쪽 ${e.no||''}번`:''}));
    (LS.get('own',[])).forEach(t=>L.push(t));return L}
  // ----- 작업 상태 -----
  function fresh(task){return {task,step:0,pieces:[],turns:[],spell:[],order:[],final:'',img:'',photo:'',t0:Date.now(),sec0:0,id:task.id+'-'+today()}}
  function open(t){const sv=LS.get('w:'+t.id+'-'+today(),null);W=sv?Object.assign(sv,{t0:Date.now(),busy:false,err:''}):fresh(t);V='work';render()}
  function keep(){if(!W)return;const c=Object.assign({},W);c.sec0=W.sec0+Math.round((Date.now()-W.t0)/1000);c.t0=Date.now();delete c.busy;delete c.err;LS.set('w:'+W.id,c)}
  async function save(done){if(!W||!DB){toast('저장할 수 없어요. 인터넷을 확인해 주세요.');return false}
    keep();const c=LS.get('w:'+W.id,{});
    const rec={at:new Date().toISOString(),date:today(),task:{id:W.task.id,kind:W.task.kind,title:W.task.title,q:W.task.q,note:W.task.note},pieces:W.pieces,turns:W.turns,spell:W.spell,final:W.final,img:W.img||'',photo:W.photo||'',sec:c.sec0,done:!!done,step:STEPS[W.step]};
    try{await DB.doc('writelog/'+W.id).set(rec);W.saved=(W.saved||0)+1;STAT.n=Math.max(STAT.n,1);toast(done?'💾 저장했어요! 잘했어요.':'💾 저장했어요');return true}catch(e){toast('저장이 안 됐어요: '+(e.code||e.message));return false}}
  const STAT={n:0};
  async function loadStat(){if(!DB)return;try{const L=await DB.collection('writelog').orderBy('at','desc').limit(30).get();STAT.n=L.docs.filter(d=>(d.data().date)===today()).length}catch(e){}}
  // ----- AI -----
  async function coach(){if(!DB){W.err='인터넷 연결을 확인해 주세요.';render();return}
    if(!W.pieces.length){W.err='먼저 내 생각을 한 조각이라도 써요.';render();return}
    W.busy=true;W.err='';render();const id=`${today()}-${SID}-${String(++SEQ).padStart(3,'0')}`;
    const req={at:today(),date:today(),ts:new Date().toISOString(),wid:W.id,task:{title:W.task.title,q:W.task.q,note:W.task.note,psg:W.task.psg||'',img:W.task.img||W.taskImg||''},pieces:W.pieces.slice(),turns:W.turns.map(t=>({who:t.who,text:t.text}))};
    try{await DB.doc('writecoach/'+id).set(req)}catch(e){W.busy=false;W.err='요청을 못 보냈어요.';render();return}
    let res=null;for(let i=0;i<90&&!res;i++){await new Promise(r=>setTimeout(r,i<5?1500:1000));try{const sn=await DB.doc('writecoach/'+id).get();const d=sn.exists?sn.data():null;if(d&&d.res)res=d.res}catch(e){}}
    W.busy=false;
    if(!res)W.err='선생님 답이 늦어요. 잠시 뒤 다시 눌러요.';
    else if(res.state==='limit')W.err='오늘 AI 선생님 시간을 다 썼어요.';
    else if(res.state==='error'||!res.say)W.err='선생님이 대답을 못 했어요. 다시 눌러 볼까요?';
    else{W.turns.push({who:'ai',text:res.say,focus:res.focus});W.spell=res.spell||[];W.ready=res.state==='ready';W.ask=res.say;speak(res.say)}
    keep();render()}
  function speak(t){try{const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
  let REC=null;
  function mic(btn){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;const ta=$('#ta');if(!SR){toast('이 기기에선 말하기가 안 돼요. 자판으로 써요.');return}
    if(REC){try{REC.stop()}catch(e){}return}
    const r=new SR();REC=r;r.lang='ko-KR';r.interimResults=false;r.continuous=true;btn.textContent='⏹ 그만 듣기';
    r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal&&ta)ta.value=(ta.value+' '+e.results[i][0].transcript).trim()};
    r.onend=()=>{REC=null;const b=$('[data-a="mic"]');if(b)b.textContent='🎤 말로 하기'};r.onerror=()=>{};try{r.start()}catch(e){REC=null}}
  // ----- 화면 -----
  function toast(m){const t=$('#toast');if(t){t.textContent=m;return}}
  function render(){if(!sr)return;window.scrollTo(0,0);V==='list'?list():V==='mom'?momView():work()}
  function list(){const L=tasks();
    $('#main').innerHTML=`<div class="top"><h1>✍️ 글쓰기 첨삭</h1><button class="b g" data-a="hub">← 오늘의 공부</button></div>
      <div class="card"><h2>어떤 글을 쓸까?</h2><div class="m">선생님은 글을 대신 써 주지 않아요. 내 생각을 꺼내도록 질문만 해요.</div>
      ${L.length?L.map((t,i)=>`<button class="task" data-a="open" data-i="${i}"><b>${esc(t.title)}</b>${t.q?`<span class="m">${esc(strip(t.q).slice(0,80))}</span>`:''}${LS.get('w:'+t.id+'-'+today(),null)?' <span class="ok">· 이어서 하기</span>':''}</button>`).join(''):'<p class="m">아직 과제가 없어요.</p>'}</div>
      <div class="card"><h2>📷 새 과제 올리기</h2><div class="m">소설 토론 과제, 학교 글쓰기처럼 밖에서 받은 과제를 올려요.</div>
      <input type="text" id="nt" placeholder="과제 이름 (예: 수요일 소설 토론)" style="margin-top:8px"><textarea id="nq" rows="2" placeholder="무엇을 쓰라고 했어? (질문을 그대로 써요)" style="margin-top:8px"></textarea>
      <div class="row"><label class="b g" style="display:inline-block">📷 과제 사진<input type="file" id="np" accept="image/*" capture="environment" hidden></label><span class="m" id="npm"></span><button class="b" data-a="add">과제 만들기 →</button></div></div>
      <div class="row" style="justify-content:flex-end"><button class="b g" data-a="mom">👩 엄마: 과제 넣기</button></div><div class="m" id="toast"></div>`;
    const np=$('#np');if(np)np.onchange=async()=>{const f=np.files[0];if(!f)return;$('#npm').textContent='줄이는 중…';NEWIMG=await shrink(f,1100);$('#npm').textContent='✓ 사진 넣음'}}
  let NEWIMG='';
  function momView(){HUB.gate($('#main'),()=>{const rows=MOMT.map((t,i)=>`<div class="pc"><span><b>${esc(t.title)}</b><br><span class="m">${esc(t.q||'')}</span></span><button data-a="mdel" data-i="${i}">${t.hide?'다시 보이기':'숨기기'}</button></div>`).join('');
    $('#main').innerHTML=`<div class="top"><h1>👩 글쓰기 과제 넣기</h1><button class="b g" data-a="list">◀ 돌아가기</button></div>
      <div class="card"><input type="text" id="mt" placeholder="과제 이름"><textarea id="mq" rows="3" placeholder="질문 (시훈이에게 보일 그대로)" style="margin-top:8px"></textarea><input type="text" id="mn" placeholder="참고 (책 이름, 쪽수 등 · 선택)" style="margin-top:8px">
      <div class="row"><button class="b" data-a="madd">넣기</button></div></div><div class="card"><h2>넣은 과제</h2>${rows||'<p class="m">없음</p>'}</div><div class="m" id="toast"></div>`})}
  async function momSave(){if(!DB)return;try{await DB.doc('writetasks/list').set({items:MOMT,updated:new Date().toISOString()});toast('저장했어요')}catch(e){toast('저장 안 됨: '+(e.code||e.message))}}
  function stepsBar(){return `<div class="steps">${STEPS.map((s,i)=>`<span class="${i===W.step?'on':i<W.step?'done':''}">${i+1}. ${s}</span>`).join('')}</div>`}
  function navBar(){return `<div class="nav"><button data-a="step" data-s="0" ${W.step?'':'disabled'}>⏮ 처음으로</button><button data-a="step" data-s="${W.step-1}" ${W.step?'':'disabled'}>◀ 이전</button><span>${W.step+1} / ${STEPS.length}</span><button data-a="step" data-s="${W.step+1}" ${W.step<STEPS.length-1?'':'disabled'}>다음 ▶</button></div>`}
  function work(){const T=W.task;let h=`<div class="top"><h1>✍️ ${esc(T.title)}</h1><button class="b g" data-a="save">💾 저장</button><button class="b g" data-a="list">◀ 과제 목록</button></div>${navBar()}${stepsBar()}
    <div class="card"><div class="m">과제</div><div style="font-size:18px">${esc(strip(T.q))||'(질문 없음)'}</div>${T.note?`<div class="m">${esc(T.note)}</div>`:''}${T.img?`<div class="photo"><img src="${T.img}" alt="과제 사진"></div>`:''}</div>`;
    if(W.step===0){const last=[...W.turns].reverse().find(t=>t.who==='ai');
      h+=`<div class="card"><h2>1. 내 생각 꺼내기</h2>${last?`<div class="ai">🤖 ${esc(last.text)}</div>`:'<div class="m">맞춤법은 신경 쓰지 말고, 생각나는 대로 말하거나 써요. 한 번에 한 생각씩!</div>'}
        <textarea id="ta" rows="3" placeholder="${last?'선생님 질문에 대한 내 생각':'내 생각'}"></textarea>
        <div class="row"><button class="b" data-a="addp">➕ 내 생각 넣기</button><button class="b g" data-a="mic">🎤 말로 하기</button>${last?'<button class="b g" data-a="again">🔊 다시 듣기</button>':''}</div>
        ${W.pieces.length?`<div class="m" style="margin-top:12px">내가 한 말</div>${W.pieces.map((p,i)=>`<div class="pc"><span>${esc(p)}</span><button data-a="delp" data-i="${i}">지우기</button></div>`).join('')}`:''}
        ${(W.spell||[]).length?`<div class="m" style="margin-top:8px">✏️ 다시 볼 낱말 (고치는 건 시훈이가!)</div>${W.spell.map(s=>`<div class="sp">「${esc(s.word)}」 — ${esc(s.hint)}</div>`).join('')}`:''}
        ${W.busy?'<p class="m">🤖 선생님이 읽는 중…</p>':''}${W.err?`<p class="bad">${esc(W.err)}</p>`:''}
        <div class="row"><button class="b" data-a="coach" ${W.busy||!W.pieces.length?'disabled':''}>🤖 선생님 질문 받기</button>${W.pieces.length>=2?`<button class="b ${W.ready?'':'g'}" data-a="step" data-s="1">순서 맞추기 →</button>`:''}</div>
        ${W.ready?'<p class="ok">선생님: 이제 순서대로 놓아 볼까요?</p>':''}</div>`}
    else if(W.step===1){const left=W.pieces.map((p,i)=>i).filter(i=>!W.order.includes(i));
      h+=`<div class="card"><h2>2. 순서 맞추기</h2><div class="m">내 답 → 왜냐하면 → 근거(책 어디) → 그래서 내 생각은. 내가 한 말을 순서대로 눌러요.</div>
        <div class="built" style="margin-top:8px">${W.order.map(i=>esc(W.pieces[i])).join(' ')||'<span class="m">여기에 쌓여요</span>'}</div>
        <div>${left.map(i=>`<button class="blk" data-a="ord" data-i="${i}">${esc(W.pieces[i])}</button>`).join('')}</div>
        <div class="row"><button class="b g" data-a="ordreset">다시 놓기</button>${!left.length?'<button class="b" data-a="ordok">이 순서로 할래요 →</button>':''}</div>
        ${W.final?`<div class="m" style="margin-top:12px">완성 글 (조사나 이음말은 내가 고쳐도 돼요)</div><textarea id="fin" rows="4">${esc(W.final)}</textarea><div class="row"><button class="b" data-a="finok">옮겨 쓰기 →</button></div>`:''}</div>`}
    else{const txt=W.final||W.pieces.join(' ');const cols=10,rows=Math.max(4,Math.ceil(txt.length/cols)+1);
      h+=`<div class="card"><h2>3. 옮겨 쓰기</h2><div class="ai" style="font-size:20px">${esc(txt)}</div><div class="m">원고지에 S펜으로 옮겨 쓰거나, 종이에 쓰고 사진을 올려요. 한 칸에 한 글자, 띄어쓰기는 한 칸 비우기.</div>
        <div class="row"><button class="b g" data-a="gundo">↶ 되돌리기</button><button class="b g" data-a="gclr">전체 지우기</button><label class="b g" style="display:inline-block">📷 종이 사진<input type="file" id="ph" accept="image/*" capture="environment" hidden></label></div>
        <div class="gwrap" id="gw" data-cols="${cols}" data-rows="${rows}"><canvas id="gcv"></canvas></div>
        ${W.photo?`<div class="photo"><div class="m">올린 사진</div><img src="${W.photo}" alt="종이 사진"></div>`:''}
        <div class="row" style="justify-content:flex-end"><button class="b big" data-a="fin">💾 다 했어요 · 저장</button></div><div class="m" id="toast"></div></div>`}
    if(W.step!==2)h+='<div class="m" id="toast"></div>';
    $('#main').innerHTML=h;
    if(W.step===2)grid();
    const ph=$('#ph');if(ph)ph.onchange=async()=>{const f=ph.files[0];if(!f)return;toast('사진 줄이는 중…');W.photo=await shrink(f,1100);keep();render()}}
  // 원고지 (S펜·마우스만, 손가락·손바닥 무시: 엄마 11/22)
  let PAD=null;
  function grid(){const gw=$('#gw');const cols=+gw.dataset.cols,rows=+gw.dataset.rows;const W0=Math.min(gw.parentNode.clientWidth-4,cols*76);const c=Math.floor(W0/cols);
    gw.style.width=c*cols+'px';gw.style.height=c*rows+'px';gw.style.backgroundImage='linear-gradient(#e7b8b8 1px,transparent 1px),linear-gradient(90deg,#e7b8b8 1px,transparent 1px)';gw.style.backgroundSize=c+'px '+c+'px';
    const cv=$('#gcv');const ctx=cv.getContext('2d');const d=window.devicePixelRatio||1;cv.width=c*cols*d;cv.height=c*rows*d;ctx.setTransform(d,0,0,d,0,0);
    const S=PAD&&PAD.id===W.id?PAD.strokes:[];PAD={id:W.id,strokes:S,cur:null,pid:null};
    const draw=()=>{ctx.clearRect(0,0,cv.width,cv.height);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#1c2533';ctx.lineWidth=3.5;for(const s of PAD.strokes.concat(PAD.cur?[PAD.cur]:[])){ctx.beginPath();s.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}};
    const pt=e=>{const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
    cv.onpointerdown=e=>{if(e.pointerType!=='pen'&&e.pointerType!=='mouse')return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}PAD.pid=e.pointerId;PAD.cur=[pt(e)]};
    cv.onpointermove=e=>{if(e.pointerId!==PAD.pid||!PAD.cur)return;e.preventDefault();PAD.cur.push(pt(e));draw()};
    cv.onpointerup=cv.onpointercancel=e=>{if(e.pointerId!==PAD.pid)return;PAD.pid=null;if(PAD.cur&&PAD.cur.length)PAD.strokes.push(PAD.cur);PAD.cur=null;draw()};
    cv.oncontextmenu=e=>e.preventDefault();draw()}
  function padImg(){const cv=$('#gcv');if(!cv||!PAD||!PAD.strokes.length)return '';const o=document.createElement('canvas');const w=700,h=Math.round(cv.height/cv.width*700);o.width=w;o.height=h;const c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,w,h);const gw=$('#gw');const n=+gw.dataset.cols,m=+gw.dataset.rows,q=w/n;c.strokeStyle='#e7b8b8';c.lineWidth=1;for(let i=0;i<=n;i++){c.beginPath();c.moveTo(i*q,0);c.lineTo(i*q,h);c.stroke()}for(let j=0;j<=m;j++){c.beginPath();c.moveTo(0,j*q);c.lineTo(w,j*q);c.stroke()}c.drawImage(cv,0,0,w,h);return o.toDataURL('image/jpeg',.7)}
  function shrink(f,max){return new Promise(res=>{const im=new Image();const u=URL.createObjectURL(f);im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.7))};im.onerror=()=>res('');im.src=u})}
  async function onClick(e){const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
    if(a==='hub'){try{speechSynthesis.cancel()}catch(_){}HUB.back('write');return}
    if(a==='list'){if(W)keep();V='list';W=null;render();return}
    if(a==='mom'){V='mom';render();return}
    if(a==='madd'){const t=$('#mt').value.trim(),q=$('#mq').value.trim();if(!t){return}MOMT.unshift({id:Date.now().toString(36),title:t,q,note:$('#mn').value.trim(),at:today()});await momSave();render();return}
    if(a==='mdel'){const t=MOMT[+b.dataset.i];t.hide=!t.hide;await momSave();render();return}
    if(a==='open'){open(tasks()[+b.dataset.i]);return}
    if(a==='add'){const t=$('#nt').value.trim(),q=$('#nq').value.trim();if(!t&&!q&&!NEWIMG){toast('과제 이름이나 질문을 써요');return}
      const own=LS.get('own',[]);const task={id:'own-'+Date.now().toString(36),kind:'own',title:t||'내 과제',q,note:'',img:NEWIMG};own.unshift(task);LS.set('own',own.slice(0,20));NEWIMG='';open(task);return}
    if(!W)return;
    if(a==='save'){if(W.step===2)W.img=padImg()||W.img;await save(false);return}
    if(a==='step'){const s=+b.dataset.s;if(s<0||s>2)return;if(W.step===2)W.img=padImg()||W.img;if(s===1&&!W.order.length&&W.pieces.length){W.order=[]}if(s===2&&!W.final)W.final=W.order.length===W.pieces.length&&W.pieces.length?W.order.map(i=>W.pieces[i]).join(' '):W.pieces.join(' ');W.step=s;keep();render();return}
    if(a==='addp'){const v=($('#ta').value||'').trim();if(!v)return;W.pieces.push(v);const last=[...W.turns].reverse()[0];W.turns.push({who:'me',text:v});W.order=[];W.final='';keep();render();return}
    if(a==='delp'){W.pieces.splice(+b.dataset.i,1);W.order=[];W.final='';keep();render();return}
    if(a==='mic'){mic(b);return}
    if(a==='again'){const l=[...W.turns].reverse().find(t=>t.who==='ai');if(l)speak(l.text);return}
    if(a==='coach'){coach();return}
    if(a==='ord'){W.order.push(+b.dataset.i);if(W.order.length===W.pieces.length)W.final='';keep();render();return}
    if(a==='ordreset'){W.order=[];W.final='';keep();render();return}
    if(a==='ordok'){W.final=W.order.map(i=>W.pieces[i]).join(' ');keep();render();return}
    if(a==='finok'){const f=$('#fin');if(f)W.final=f.value.trim();W.step=2;keep();render();return}
    if(a==='gundo'){if(PAD&&PAD.strokes.length){PAD.strokes.pop();grid()}return}
    if(a==='gclr'){if(PAD){PAD.strokes=[];grid()}return}
    if(a==='fin'){W.img=padImg()||W.img;if(!W.img&&!W.photo){toast('원고지에 쓰거나 종이 사진을 올려요');return}const ok=await save(true);if(ok){LS.del('w:'+W.id);PAD=null}return}
  }
  window.APP_WRITE={
    open(){mount();host.hidden=false;loadStat();if(!W)V='list';render()},
    leave(){try{speechSynthesis.cancel()}catch(e){}if(W)keep();if(host)host.hidden=true},
    stats(){return {n:STAT.n,ok:STAT.n}},
    host:()=>{mount();return host}
  };
  // 오늘 저장 수 미리 읽기(홈 표시용)
  HUB.db.then(d=>{DB=d;loadStat()});
})();
