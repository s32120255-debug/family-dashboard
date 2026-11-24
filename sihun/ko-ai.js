// 시훈 공부방 · 국어 AI 과외 (엄마 11/23)
// 틀린 문제에서 「🤖 같이 생각해 보기」 → AI가 시훈이 답에서 출발해 질문 바꿔 말하기 → 근거 찾기 → 다시 고르기로 되물어요.
// 답은 알려 주지 않아요. 요청은 kotutor/<id> 에 쓰고, 서버(koTutor)가 같은 문서에 res를 채워요. 대화는 그 문서에 남아 엄마 리포트에 보여요.
(function(){
  const MAX_AI=7;
  const pad=n=>String(n).padStart(2,'0');
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
  const SID=Date.now().toString(36);let SEQ=0;
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const strip=t=>String(t==null?'':t).replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  const getDB=async()=>{try{return await HUB.db}catch(e){return null}};
  function say(t){try{const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=0.95;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
  function listen(onText,onEnd){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){onEnd&&onEnd('none');return null}
    const r=new SR();r.lang='ko-KR';r.interimResults=false;r.continuous=false;let got='';
    r.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)got+=e.results[i][0].transcript};
    r.onend=()=>{onText(got.trim());onEnd&&onEnd()};r.onerror=()=>{};try{r.start()}catch(e){onEnd&&onEnd('err')}return r}
  const CSS=`.kai{margin-top:12px;border:2px solid #9db6e6;background:#f5f8ff;border-radius:14px;padding:12px;font-family:'Noto Sans KR',system-ui,sans-serif;color:#1c2533}
.kai .t{display:flex;gap:8px;margin:8px 0;line-height:1.6}.kai .t b{flex:0 0 auto}.kai .ai{font-size:18px}.kai .me{color:#2b4d86}
.kai textarea{width:100%;font:600 18px 'Noto Sans KR';padding:10px;border:2px solid #2b4d86;border-radius:12px;box-sizing:border-box}
.kai .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}
.kai button{border:none;border-radius:12px;padding:10px 14px;font:700 16px 'Noto Sans KR';cursor:pointer;background:#1f3a68;color:#fff}
.kai button.g{background:#e6ecf7;color:#1f3a68}.kai button:disabled{opacity:.45}.kai .op{display:block;width:100%;text-align:left;background:#fff;color:#1c2533;border:2px solid #d9e1ec;margin:6px 0}
.kai .m{color:#6b7a90;font-size:14px}.kai .bad{color:#c8462f}.kai .ok{color:#2e8b57;font-weight:700}`;
  // ctx: {q, box, psg, opts[], ans(text), exp, area, src, picks[], raw}
  function open(host,ctx){
    if(host.querySelector('.kai'))return;
    const root=host.getRootNode&&host.getRootNode();if(root&&!root.__kaiCss){const st=document.createElement('style');st.textContent=CSS;(root.head||root).appendChild(st);root.__kaiCss=1}
    const box=document.createElement('div');box.className='kai';host.appendChild(box);
    const S={sid:SID+'-'+(++SEQ),turns:[],picks:(ctx.picks||[]).filter(Boolean),calls:0,busy:false,state:'ask',mom:[],done:false,t0:Date.now()};
    const draw=()=>{const last=S.turns.length?S.turns[S.turns.length-1]:null;
      let h=`<div class="m">🤖 같이 생각해 보기 · 선생님은 답을 알려 주지 않아요. 내 생각을 말해 봐요.</div>`;
      h+=S.turns.map(t=>`<div class="t ${t.who==='ai'?'ai':'me'}"><b>${t.who==='ai'?'🤖':'🙋'}</b><span>${esc(t.text)}</span></div>`).join('');
      if(S.busy)h+=`<div class="m">생각하는 중…</div>`;
      else if(S.err)h+=`<div class="bad">${esc(S.err)}</div><div class="row"><button class="g" data-k="retryreq">다시 해 보기</button><button class="g" data-k="close">닫기</button></div>`;
      else if(S.done)h+=`<div class="ok">잘했어요. 이제 다음으로 넘어가요.</div><div class="row"><button class="g" data-k="close">닫기</button></div>`;
      else if(S.state==='retry'&&ctx.opts&&ctx.opts.length)h+=`<div class="m">근거를 생각하며 다시 골라 봐요.</div>${ctx.opts.map((o,i)=>`<button class="op" data-op="${i}">${i+1}. ${esc(strip(o))}</button>`).join('')}<div class="row"><button class="g" data-k="more">아직 모르겠어요 · 더 물어볼래요</button></div>`;
      else if(S.state==='retry')h+=`<div class="m">👆 위 문제에서 근거를 생각하며 다시 골라 봐요.</div><div class="row"><button class="g" data-k="more">아직 모르겠어요 · 더 물어볼래요</button><button class="g" data-k="close">닫기</button></div>`;
      else if(last&&last.who==='ai')h+=`<textarea rows="2" placeholder="내 생각을 써요 (🎤 말로 해도 돼요)"></textarea><div class="row"><button data-k="send">보내기 →</button><button class="g" data-k="mic">🎤 말로 하기</button><button class="g" data-k="again">🔊 다시 듣기</button><button class="g" data-k="close">그만할래요</button></div>`;
      box.innerHTML=h;
      box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>act(b.dataset.k,b));
      box.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>pick(+b.dataset.op));
      const ta=box.querySelector('textarea');if(ta)ta.focus()};
    async function ask(kind){const DB=await getDB();if(!DB){S.err='인터넷 연결을 확인해 주세요.';draw();return}
      if(S.calls>=MAX_AI){S.done=true;draw();return}
      S.busy=true;S.err='';draw();
      const id=`${today()}-${S.sid}-${String(++S.calls).padStart(2,'0')}`;
      const req={at:today(),date:today(),ts:new Date().toISOString(),sid:S.sid,kind,problem:{q:strip(ctx.q),box:strip(ctx.box),psg:strip(ctx.psg),opts:(ctx.opts||[]).map(strip),ans:strip(ctx.ans),exp:strip(ctx.exp),area:ctx.area||'',src:ctx.src||'',raw:ctx.raw||''},picks:S.picks.map(strip),turns:S.turns.map(t=>({who:t.who,text:t.text}))};
      try{await DB.doc('kotutor/'+id).set(req)}catch(e){S.busy=false;S.err='요청을 못 보냈어요.';draw();return}
      let res=null;for(let i=0;i<90&&!res;i++){await new Promise(r=>setTimeout(r,i<5?1500:1000));try{const sn=await DB.doc('kotutor/'+id).get();const d=sn.exists?sn.data():null;if(d&&d.res)res=d.res}catch(e){}}
      S.busy=false;
      if(!res){S.err='선생님 답이 늦어요. 잠시 뒤 다시 해 봐요.';draw();return}
      if(res.state==='limit'){S.err='오늘 AI 선생님 시간을 다 썼어요. 내일 또 해요.';draw();return}
      if(res.state==='error'||!res.say){S.err='선생님이 대답을 못 했어요. 다시 해 볼까요?';draw();return}
      S.turns.push({who:'ai',text:res.say});S.state=res.state;if(res.state==='end')S.done=true;say(res.say);draw()}
    let MIC=null;
    function act(k){const ta=box.querySelector('textarea');
      if(k!=='mic'&&MIC){MIC.stop();MIC=null}
      if(k==='send'){const v=(ta&&ta.value||'').trim();if(v.replace(/\s/g,'').length<1)return;S.turns.push({who:'me',text:v});ask('reply')}
      else if(k==='mic'){if(MIC&&MIC.isOn()){MIC.stop();return}
        MIC=window.liveMic&&window.liveMic(ta,on=>{const b=box.querySelector('[data-k="mic"]');if(b)b.textContent=on?'⏹ 그만 듣기':'🎤 말로 하기';if(!on)MIC=null});
        if(!MIC&&ta)ta.placeholder='이 기기에선 말하기가 안 돼요. 자판으로 써요.'}
      else if(k==='again'){const a=[...S.turns].reverse().find(t=>t.who==='ai');if(a)say(a.text)}
      else if(k==='more'){S.turns.push({who:'me',text:'아직 모르겠어요.'});ask('reply')}
      else if(k==='retryreq'){S.err='';if(S.turns.length&&S.turns[S.turns.length-1].who==='me')ask('reply');else ask(S.turns.length?'reply':'start')}
      else if(k==='close'){try{speechSynthesis.cancel()}catch(e){}box.remove()}}
    function pick(i){const o=ctx.opts[i];S.picks.push(o);
      if(strip(o)===strip(ctx.ans)){S.turns.push({who:'me',text:`(다시 고름) ${i+1}. ${strip(o)}`});S.state='ask';ask('solved')}
      else{S.turns.push({who:'me',text:`(다시 고름) ${i+1}. ${strip(o)} — 아직 아니래요`});S.state='ask';ask('reply')}}
    draw();ask('start');
  }
  // 버튼 하나 붙이기
  function btn(host,ctx,label){if(!host||host.querySelector('.kaibtn'))return;
    const b=document.createElement('button');b.className='btn ghost sm kaibtn';b.style.marginTop='8px';b.textContent=label||'🤖 같이 생각해 보기';
    b.onclick=()=>{b.remove();open(host,typeof ctx==='function'?ctx():ctx)};host.appendChild(b)}
  window.KOAI={open,btn};
})();
