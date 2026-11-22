// "서로에게 할 말"에 새 메시지가 생기면, 받는 사람 폰(알림 받기를 켠 폰)으로 푸시 알림을 보내요.
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const APP_URL = "https://s32120255-debug.github.io/family-dashboard/";

exports.notifyNote = onDocumentCreated({ document: "notes/{id}", region: "asia-northeast3" }, async (event) => {
  const note = event.data && event.data.data();
  if (!note || !note.text) return;
  const to = note.to || "모두";
  const db = getFirestore();
  const snap = await db.collection("pushTokens").get();
  const targets = snap.docs.filter((d) => {
    const who = d.data().who;
    return to === "모두" ? who !== note.from : who === to;
  });
  if (!targets.length) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens: targets.map((d) => d.id),
    webpush: {
      notification: {
        title: `${note.from || "가족"}의 메시지`,
        body: String(note.text).slice(0, 200),
        icon: APP_URL + "icon-192.png",
        tag: "family-note",
        renotify: true,
      },
      fcmOptions: { link: APP_URL },
    },
  });
  // 더 이상 쓸 수 없는 토큰은 지워요.
  await Promise.all(res.responses.map((r, i) => {
    const code = r.error && r.error.code;
    if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
      return targets[i].ref.delete();
    }
    return null;
  }));
});
