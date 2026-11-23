// 최상위 문제집 열쇠를 가족 DB(sihun/data/m32/bookkey)에 한 번 넣어요. 엄마가 Cloud Shell에서:
//   node setBookKey.js <열쇠>
// 열쇠는 Claude가 채팅으로만 알려 줘요(공개 저장소에 두지 않음). 앱은 로그인한 가족 계정으로 이 문서를 읽어 자동으로 열어요.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const k = String(process.argv[2] || "").trim();
if (!/^[A-Za-z0-9+/=]{40,}$/.test(k)) { console.error("열쇠가 이상해요. Claude가 준 명령어를 그대로 붙여 주세요."); process.exit(1); }
initializeApp({ projectId: "kmsysh-fa740" });
const d = { k, at: new Date().toISOString().slice(0, 10) };
getFirestore().doc("sihun/data/m32/bookkey").set({ _j: JSON.stringify(d), at: d.at, _t: Date.now() })
  .then(() => { console.log("✅ 최상위 문제집 열쇠를 넣었어요."); process.exit(0); })
  .catch((e) => { console.error("❌ 못 넣었어요:", e.message); process.exit(1); });
