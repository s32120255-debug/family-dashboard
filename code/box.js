// 🎮 잠긴 상자: 시훈이 게임을 바깥 연결 없이 돌리는 곳(코딩 앱·게임 보기·가족 대시보드가 같이 씀)
/* ---------------- 잠긴 상자(게임 실행) ----------------
   바깥 상자(srcdoc, sandbox=allow-scripts) 안에 게임 상자(srcdoc, sandbox=allow-scripts)를 넣어요.
   - sandbox: 새 창·맨 위 창 이동·다른 창 건드리기·폼 보내기 모두 막힘(allow-same-origin 없음 → 우리 로그인·저장소에도 못 닿음).
   - 바깥 상자 CSP: frame-src 'none' → 게임이 자기 자리를 다른 사이트로 바꾸려 해도 막힘. connect-src 'none' → 인터넷 요청 막힘.
     이미지·소리는 data:/blob:만, 글꼴만 Google Fonts 허용. */
export const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob:; media-src data: blob:; connect-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'; manifest-src 'none'";
const SHIM = `<meta http-equiv="Content-Security-Policy" content="${CSP}"><script>(function(){var m={},s={getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}};try{window.localStorage.getItem('x')}catch(e){try{Object.defineProperty(window,'localStorage',{value:s,configurable:true})}catch(e2){}}try{window.sessionStorage.getItem('x')}catch(e){try{Object.defineProperty(window,'sessionStorage',{value:s,configurable:true})}catch(e2){}}window.open=function(){return null};})();<\/script>`;
export function gameDoc(html) {
  let h = String(html || '').replace(/<link[^>]+rel=["']?(manifest|icon|apple-touch-icon|preconnect)["']?[^>]*>/gi, '').replace(/<base\b[^>]*>/gi, '');
  if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, (m) => m + SHIM);
  else h = SHIM + h;
  return h;
}
export function boxDoc(html) {
  const inner = gameDoc(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden;background:#fff}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe sandbox="allow-scripts allow-modals" allow="autoplay" srcdoc="${inner}"></iframe></body></html>`;
}
export function mountGame(el, html) {
  el.innerHTML = '';
  if (!html) return;
  const f = document.createElement('iframe');
  f.setAttribute('sandbox', 'allow-scripts allow-modals');
  f.setAttribute('allow', 'autoplay');
  f.setAttribute('referrerpolicy', 'no-referrer');
  f.title = '게임';
  f.srcdoc = boxDoc(html);
  el.appendChild(f);
}
