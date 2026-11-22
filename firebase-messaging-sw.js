// 알림용 서비스 워커. 화면을 저장(캐시)하지 않아서 업데이트에 영향이 없어요.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyAsQxKpizqbWf0OzIKbUtWAoLsvK2zZRMs",
  authDomain: "kmsysh-fa740.firebaseapp.com",
  projectId: "kmsysh-fa740",
  storageBucket: "kmsysh-fa740.firebasestorage.app",
  messagingSenderId: "36140585172",
  appId: "1:36140585172:web:675f1ec32e30ec4243eb41"
});
firebase.messaging();
