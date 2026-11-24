// 시훈 공부방 · 영어 「⚡ 카츄랑 말하기」 (엄마 11/25)
// 그날 연습한 문장을 대화 속에서 실제로 꺼내 쓰기. 카츄 = 시훈이 인형(귀여운 동생). 카츄는 시훈이가 아는 단어로만 말해요(서버가 검사).
// 순서: 🎬 한국어 상황 카드 → 「알겠어」 → 카츄 영어(글자 + 느린 소리, 🐢 더 느리게, 🇰🇷 뜻) → 형아 대답(말 또는 자판, 「보내기」)
//      → 틀리면 카츄가 바르게 되받아 말함 → 한 번 따라 말하기 → 다음 상황. 오늘 문장을 다 쓰거나 10번 주고받으면 끝.
// 요청은 enchat/<id> 에 쓰고, 서버(enChat)가 같은 문서에 res를 채워요. 대화는 그 문서에 남아 엄마 리포트에 보여요.
(function(){
  const MAXR=10;
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const getDB=async()=>{try{return await HUB.db}catch(e){return null}};
  const LSK=()=>'enchat:'+today();
  const lsGet=()=>{try{return JSON.parse(localStorage.getItem(LSK())||'null')}catch(e){return null}};
  const lsSet=v=>{try{localStorage.setItem(LSK(),JSON.stringify(v))}catch(e){}};
  let VOICE=null;
  function pickVoice(){try{const V=speechSynthesis.getVoices();VOICE=V.find(v=>/en-US/i.test(v.lang)&&/female|samantha|google us/i.test(v.name))||V.find(v=>/en-US/i.test(v.lang))||V.find(v=>/^en/i.test(v.lang))||null}catch(e){}}
  try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
  function say(t,rate){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';if(VOICE)u.voice=VOICE;u.rate=rate||0.8;u.pitch=1.25;speechSynthesis.speak(u)}catch(e){}}
  const CSS=`.kc{font-family:'Noto Sans KR',system-ui,sans-serif;color:#1c2533}
.kc .card{background:#fff;border-radius:18px;padding:16px;margin:10px 0}
.kc .goal{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 2px}.kc .goal span{font-size:13px;padding:4px 8px;border-radius:10px;background:#eef1f7;color:#4a5570}.kc .goal span.on{background:#2a9d5c;color:#fff}
.kc .scene{background:#fff7d6;border:2px solid #f2c94c;border-radius:16px;padding:14px;font-size:19px;line-height:1.6}
.kc .scene .t{font-size:14px;color:#8a6d00;font-weight:700;margin-bottom:4px}
.kc .use{margin-top:8px;font-size:16px;background:#fff;border-radius:10px;padding:8px 10px}
.kc .kat{display:flex;gap:10px;align-items:flex-start;margin:8px 0}.kc .kat .av{flex:0 0 auto;width:46px;height:46px;border-radius:50%;background:#ffd84d;display:flex;align-items:center;justify-content:center;font-size:26px}
.kc .bub{background:#fffbe8;border:2px solid #f2d36b;border-radius:16px;padding:10px 14px;font:800 24px 'Noto Sans KR';line-height:1.35}
.kc .bub .ko{font:500 15px 'Noto Sans KR';color:#6b5a1a;margin-top:4px}
.kc .me{text-align:right;margin:6px 0}.kc .me span{display:inline-block;background:#e3ecff;border-radius:14px;padding:8px 12px;font:700 18px 'Noto Sans KR';color:#1f3a68}
.kc .hist{max-height:180px;overflow:auto;border-top:1px dashed #d9e1ec;margin-top:8px;padding-top:6px}.kc .hist .kat .bub{font-size:16px;padding:6px 10px}.kc .hist .kat .av{width:30px;height:30px;font-size:17px}.kc .hist .me span{font-size:15px}
.kc textarea{width:100%;font:700 20px 'Noto Sans KR';padding:10px;border:2px solid #2b4d86;border-radius:12px;box-sizing:border-box}
.kc .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;justify-content:center}
.kc button{border:none;border-radius:12px;padding:10px 14px;font:700 16px 'Noto Sans KR';cursor:pointer;background:#1f3a68;color:#fff}
.kc button.g{background:#e6ecf7;color:#1f3a68}.kc button.big{font-size:19px;padding:13px 22px}.kc button:disabled{opacity:.45}
.kc .blk button{background:#fff;color:#1f2330;border:2px solid #c3cbe0;font-size:18px}
.kc .hint{background:#eef3ff;border-radius:12px;padding:8px 12px;margin-top:8px;font-size:16px}
.kc .m{color:#6b7a90;font-size:14px;text-align:center}.kc .bad{color:#c8462f;text-align:center}.kc .ok{color:#2e8b57;font-weight:700}
.kc .fix{background:#eaf7ef;border:2px solid #7cc49a;border-radius:14px;padding:12px;margin-top:8px;font-size:17px}`;
  // ctx: {sents:[{en,ko}], vocab:[...], onSave(sum), onDone(sum)}
  function open(host,ctx){
    const root=host.getRootNode&&host.getRootNode();if(root&&!root.__kcCss){const st=document.createElement('style');st.textContent=CSS;(root.head||root).appendChild(st);root.__kcCss=1}
    host.innerHTML='';const box=document.createElement('div');box.className='kc';host.appendChild(box);
    const sk=ctx.sents.map(s=>s.en).join('|');let S=lsGet();
    if(!S||S.sk!==sk)S={sk,sid:Date.now().toString(36),turns:[],used:[],replies:0,calls:0,cur:null,react:null,phase:'start',help:{},helpMax:0,fixes:[],mom:[],done:false,err:'',t0:Date.now()};
    S.busy=false;
    const sum=()=>({sid:S.sid,used:S.used.length,of:ctx.sents.length,usedIdx:S.used.slice(),replies:S.replies,fixes:S.fixes.length,helpMax:S.helpMax,help:S.help,done:!!S.done,err:S.err||null,min:Math.max(1,Math.round((Date.now()-S.t0)/60000))});
    const keep=()=>{lsSet(S);try{ctx.onSave&&ctx.onSave(sum())}catch(e){}};
    let MIC=null,H=0,showKo=false,blk=null;
    function tgt(){const t=S.cur&&S.cur.target;return t>=1&&t<=ctx.sents.length?ctx.sents[t-1]:null}
    function goal(){return `<div class="goal">${ctx.sents.map((s,i)=>`<span class="${S.used.includes(i+1)?'on':''}">${S.used.includes(i+1)?'✅':'⬜'} ${esc(s.ko)}</span>`).join('')}</div>`}
    function hist(){const T=S.turns.slice(0,-1);if(!T.length)return '';return `<details class="hist"><summary class="m">지금까지 나눈 말 (${T.length})</summary>${T.map(t=>t.who==='ai'?`<div class="kat"><div class="av">⚡</div><div class="bub">${esc(t.text)}</div></div>`:`<div class="me"><span>${esc(t.text)}</span></div>`).join('')}</details>`}
    function draw(){
      let h=`<div class="card"><div style="font:800 20px 'Noto Sans KR'">⚡ 카츄랑 말하기</div><div class="m" style="text-align:left">오늘 배운 문장을 카츄한테 써 봐요 · ${S.used.length} / ${ctx.sents.length}</div>${goal()}</div><div class="card">`;
      if(S.busy)h+=`<div class="kat"><div class="av">⚡</div><div class="bub">…</div></div><div class="m">카츄가 생각하는 중…</div>`;
      else if(S.err)h+=`<div class="bad">${esc(S.err)}</div><div class="row"><button class="g" data-k="retry">다시 해 보기</button><button class="g" data-k="skip">오늘은 그만 · 끝 ▶</button></div>`;
      else if(S.phase==='start')h+=`<div class="scene"><div class="t">⚡ 카츄가 왔어요</div>카츄는 형아를 좋아하는 동생이에요. 카츄가 영어로 물어보면, 오늘 배운 문장으로 대답해 줘요. 천천히 말해 줄 거예요.</div><div class="row"><button class="big" data-k="begin">카츄 부르기 ▶</button></div>`;
      else if(S.phase==='fix'){const r=S.react;
        h+=`<div class="kat"><div class="av">⚡</div><div class="bub">${esc(r.react)}<div class="ko">${esc(r.reactKo)}</div></div></div>
        <div class="fix">🗣️ 카츄가 말한 바른 문장을 <b>따라 말해</b> 봐요<div style="font:800 24px 'Noto Sans KR';margin:8px 0">${esc(r.fixLine)} <button class="g" data-k="sayfix">🔊</button></div></div>
        <textarea rows="2" placeholder="말하거나 써요"></textarea><div class="row"><button class="g" data-k="mic">🎤 말로 하기</button><button data-k="fixok">따라 했어 ▶</button></div>`}
      else if(S.phase==='scene'){const t=tgt(),r=S.react;
        if(r&&r.react)h+=`<div class="kat"><div class="av">⚡</div><div class="bub">${esc(r.react)} <button class="g" data-k="sayreact" style="padding:4px 8px">🔊</button><div class="ko">${esc(r.reactKo)}</div></div></div>`;
        h+=`<div class="scene"><div class="t">🎬 이런 상황이에요</div>${esc(S.cur.scene)}${t?`<div class="use">📌 쓸 문장: <b>${esc(t.ko)}</b></div>`:''}</div><div class="row"><button class="big" data-k="ready">알겠어 👍</button></div>`}
      else if(S.phase==='talk'){const t=tgt();
        h+=`<div class="kat"><div class="av">⚡</div><div class="bub">${esc(S.cur.say)}${showKo?`<div class="ko">${esc(S.cur.ko)}</div>`:''}</div></div>
        <div class="row"><button class="g" data-k="again">🔊 다시 듣기</button><button class="g" data-k="slow">🐢 더 느리게</button>${showKo?'':`<button class="g" data-k="ko">🇰🇷 뜻</button>`}</div>`;
        if(H>=2&&t)h+=`<div class="hint">💡 이렇게 시작해요: <b>${esc(t.en.split(' ').slice(0,2).join(' '))} …</b></div>`;
        if(H>=3&&blk)h+=`<div class="hint">🧩 블록을 눌러 문장을 만들어요<div class="row blk">${blk.map((w,i)=>`<button data-b="${i}">${esc(w)}</button>`).join('')}</div></div>`;
        h+=`<textarea rows="2" placeholder="영어로 대답해요 (🎤 말로 해도 돼요)"></textarea>
        <div class="row"><button data-k="send">보내기 →</button><button class="g" data-k="mic">🎤 말로 하기</button>${H<3&&t?`<button class="g" data-k="help">💡 도와줘</button>`:''}</div>`}
      else if(S.phase==='end'){const r=S.react;
        if(r&&r.react)h+=`<div class="kat"><div class="av">⚡</div><div class="bub">${esc(r.react)}<div class="ko">${esc(r.reactKo)}</div></div></div>`;
        h+=`<div class="ok" style="text-align:center;font-size:20px;margin:10px 0">오늘 문장 ${S.used.length} / ${ctx.sents.length}개를 카츄한테 썼어요!</div><div class="row"><button class="big" data-k="finish">끝 ▶</button></div>`}
      h+=hist()+'</div>';
      box.innerHTML=h;
      box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>act(b.dataset.k));
      box.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const ta=box.querySelector('textarea');if(ta){ta.value=(ta.value.trim()+' '+b.textContent).trim();b.disabled=true}});
      const ta=box.querySelector('textarea');if(ta&&!MIC)ta.focus()}
    async function ask(kind,heard,typed){const DB=await getDB();if(!DB){S.err='인터넷 연결을 확인해 주세요.';draw();return}
      S.busy=true;S.err='';draw();
      const id=`${today()}-${S.sid}-${pad(++S.calls)}`;
      const req={at:today(),date:today(),ts:new Date().toISOString(),sid:S.sid,kind,sents:ctx.sents.map(s=>({en:s.en,ko:s.ko})),vocab:ctx.vocab||[],used:S.used.slice(),turns:S.turns.map(t=>({who:t.who,text:t.text,help:t.help||0})),heard:heard||'',typed:!!typed,turnsLeft:MAXR-S.replies};
      try{await DB.doc('enchat/'+id).set(req)}catch(e){S.busy=false;S.err='요청을 못 보냈어요.';draw();return}
      let res=null;for(let i=0;i<90&&!res;i++){await new Promise(r=>setTimeout(r,i<5?1500:1000));try{const sn=await DB.doc('enchat/'+id).get();const d=sn.exists?sn.data():null;if(d&&d.res)res=d.res}catch(e){}}
      S.busy=false;S.lastReq=kind;
      if(!res){S.err='카츄 대답이 늦어요. 잠시 뒤 다시 해 봐요.';draw();return}
      if(res.state==='limit'){S.err='오늘은 카츄가 너무 많이 말했어요. 내일 또 해요.';draw();return}
      if(res.state!=='ok'){S.err='카츄가 대답을 못 했어요. 다시 해 볼까요?';draw();return}
      (res.used||[]).forEach(n=>{if(n>=1&&n<=ctx.sents.length&&!S.used.includes(n))S.used.push(n)});
      if(res.mom)S.mom.push(res.mom);
      S.react={react:res.react||'',reactKo:res.reactKo||'',fixLine:res.fixLine||''};
      if(res.react)S.turns.push({who:'ai',text:res.react});
      if(res.fix&&res.fixLine)S.fixes.push({heard:heard||'',fix:res.fixLine});
      const allUsed=S.used.length>=ctx.sents.length;
      if(res.done||allUsed||S.replies>=MAXR||!res.say){S.done=true;S.cur=null;S.phase=res.fix&&res.fixLine?'fix':'end';S.endAfterFix=true}
      else{S.cur={scene:res.scene,say:res.say,ko:res.ko,target:res.target};S.phase=res.fix&&res.fixLine?'fix':'scene'}
      H=0;showKo=false;blk=null;keep();draw();
      if(S.phase==='fix'||S.phase==='end'||S.phase==='scene'){if(S.react.react)say(S.react.react)}}
    function act(k){const ta=box.querySelector('textarea');
      if(k!=='mic'&&MIC){MIC.stop();MIC=null}
      if(k==='begin'){ask('start')}
      else if(k==='retry'){if(!S.turns.length)ask('start');else{const last=[...S.turns].reverse().find(t=>t.who==='me');ask('reply',last?last.text:'',false)}}
      else if(k==='skip'){S.done=true;S.err=S.err||'skip';keep();ctx.onDone&&ctx.onDone(sum())}
      else if(k==='ready'){S.phase='talk';S.turns.push({who:'ai',text:S.cur.say});keep();draw();say(S.cur.say,0.8)}
      else if(k==='again')say(S.cur.say,0.8);
      else if(k==='slow')say(S.cur.say,0.55);
      else if(k==='sayreact')say(S.react.react);
      else if(k==='sayfix')say(S.react.fixLine,0.75);
      else if(k==='ko'){showKo=true;H=Math.max(H,1);draw()}
      else if(k==='help'){H++;if(H===1)showKo=true;if(H===2)showKo=true;if(H>=3){const t=tgt();if(t)blk=t.en.replace(/[.?!]$/,'').split(' ').sort(()=>Math.random()-.5)}draw()}
      else if(k==='mic'){if(MIC&&MIC.isOn()){MIC.stop();return}
        MIC=window.liveMic&&window.liveMic(ta,on=>{const b=box.querySelector('[data-k="mic"]');if(b)b.textContent=on?'⏹ 그만 듣기':'🎤 말로 하기';if(!on)MIC=null},'en-US');
        if(!MIC){const b=box.querySelector('[data-k="mic"]');if(b){b.textContent='🎤 이 기기에선 안 돼요 · 자판으로 써요';b.disabled=true}}}
      else if(k==='send'){const v=(ta&&ta.value||'').trim();if(!v)return;const typed=!S._micUsed;S.replies++;const hl=Math.max(H,showKo?1:0);S.help[hl]=(S.help[hl]||0)+1;S.helpMax=Math.max(S.helpMax,hl);
        S.turns.push({who:'me',text:v,help:hl});keep();ask('reply',v,typed)}
      else if(k==='fixok'){const v=(ta&&ta.value||'').trim();const f=S.fixes[S.fixes.length-1];if(f)f.said=v;S.phase=S.endAfterFix?'end':'scene';S.endAfterFix=false;if(S.phase==='scene'&&S.react)S.react={react:'',reactKo:''};keep();draw()}
      else if(k==='finish'){S.done=true;keep();ctx.onDone&&ctx.onDone(sum())}}
    // 마이크를 썼는지(말로 했는지) 기록용
    box.addEventListener('click',e=>{const b=e.target.closest('[data-k="mic"]');if(b)S._micUsed=true;const s=e.target.closest('[data-k="send"]');if(s)setTimeout(()=>{S._micUsed=false},0)},true);
    if(S.phase==='talk'&&S.cur)S.phase='scene';
    if(S.done&&S.phase!=='end')S.phase='end';
    draw();
    return {sum};
  }
  window.EN_CHAT={open};
})();
