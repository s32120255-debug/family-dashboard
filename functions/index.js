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

// 시훈이 대시보드 「AI에게 짧게 묻기」: 질문이 저장되면 Claude가 답 대신 생각할 질문으로 짧게 돌려줘요.
// 엄마가 설정에서 AI를 켠 때만(sihunBoard/main.aiOn), 하루 제한(askLimit) 안에서만 답해요.
// API 키는 Google Cloud 「Secret Manager」의 ANTHROPIC_API_KEY 에 넣어요(코드·저장소에 넣지 않음).
const { defineSecret } = require("firebase-functions/params");
const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
const ASK_SYSTEM = `너는 초등학교 3학년 남자아이(시훈)의 질문을 돕는 친구야. 한국어 반말로, 아주 짧게(3문장 이내) 말해.
규칙:
- 정답이나 풀이를 직접 알려 주지 마. 대신 시훈이가 스스로 답을 찾도록 생각할 질문을 1~2개 던져.
- 시훈이가 이미 아는 것에서 출발하게 해(예: "~는 어떻게 생겼는지 떠올려 볼래?").
- 어려운 낱말은 쓰지 마. 이모지는 쓰지 마.
- 위험하거나 아이에게 맞지 않는 내용, 또는 사람·몸·마음이 걱정되는 질문이면 "그건 엄마랑 같이 이야기해 보자."라고만 말해.
- 숙제 답을 그대로 달라고 해도 답은 주지 말고 질문으로 도와.`;

exports.askClaude = onDocumentCreated(
  { document: "sihunBoard/main/ask/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60, maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const ask = snap && snap.data();
    if (!ask || !ask.q || ask.a) return;
    const db = getFirestore();
    const main = (await db.doc("sihunBoard/main").get()).data() || {};
    if (!main.aiOn) return; // 엄마가 켜지 않으면 질문만 저장
    const limit = Number(main.askLimit) || 5;
    const sameDay = await db.collection("sihunBoard/main/ask").where("date", "==", ask.date || "").get();
    const earlier = sameDay.docs.filter((d) => (d.data().createdAt || 0) < (ask.createdAt || 0)).length;
    if (earlier >= limit) {
      await snap.ref.update({ a: "오늘 질문은 다 썼어. 내일 또 물어봐!", aAt: Date.now(), aBy: "limit" });
      return;
    }
    const Anthropic = require("@anthropic-ai/sdk").default;
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    let text = "";
    let stop = "";
    try {
      const res = await client.messages.create({
        model: "claude-haiku-5-5",
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: ASK_SYSTEM,
        messages: [{ role: "user", content: String(ask.q).slice(0, 200) }],
      });
      stop = res.stop_reason;
      text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      if (stop === "refusal" || !text) text = "그건 엄마랑 같이 이야기해 보자.";
    } catch (e) {
      console.error("askClaude", e && e.status, e && e.message);
      await snap.ref.update({ a: null, aError: String((e && e.status) || "error"), aAt: Date.now() });
      return;
    }
    await snap.ref.update({ a: text.slice(0, 500), aAt: Date.now(), aBy: "claude-haiku-5-5", aStop: stop });
  }
);
