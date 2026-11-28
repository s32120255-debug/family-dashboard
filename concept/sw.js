/* 수학 개념 나무: 홈 화면에 앱으로 설치되게 하는 최소 서비스 워커. 캐시하지 않고 늘 새로 받아요. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
