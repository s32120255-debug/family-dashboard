// 🌐 시훈이 게임 보기(엄마 11/28): 코딩방에서 「🌐 웹에 올리기」 한 최신 모습을 서버(codePlay)에서 받아 잠긴 상자에 띄워요.
// 올린 적이 없거나 서버가 안 되면 저장소 원본(code/games/{게임}/index.html)을 보여 줘요.
import { mountGame } from './box.js?v=1';
const API = 'https://asia-northeast3-kmsysh-fa740.cloudfunctions.net/codePlay';
export async function play(g, base) {
  const stage = document.getElementById('stage');
  const msg = (t) => { stage.innerHTML = `<p style="font:20px sans-serif;padding:24px;color:#1f2530">${t}</p>`; };
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(g || '')) return msg('게임 이름이 없어요.');
  let html = '', title = '';
  try {
    const r = await fetch(`${API}?g=${encodeURIComponent(g)}&t=${Date.now()}`, { cache: 'no-store' });
    if (r.ok) { const d = await r.json(); html = d.html || ''; title = d.title || ''; }
  } catch (e) { /* 저장소 원본으로 */ }
  if (!html) {
    try { const r = await fetch(`${base}games/${g}/index.html`, { cache: 'no-store' }); if (r.ok) { html = await r.text(); title = (html.match(/<title>([^<]{1,60})<\/title>/i) || [])[1] || ''; } } catch (e) {}
  }
  if (!html) return msg('아직 올라온 게임이 없어요.');
  if (title) document.title = title;
  mountGame(stage, html);
}
