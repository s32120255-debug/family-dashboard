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

// 시훈이 대시보드 「놀이」: 끝말잇기·스무고개 같은 주고받기 놀이. 같은 놀이(sid)의 앞 대화를 기억해요.
// 엄마가 AI를 켠 때만(aiOn), 하루 놀이 횟수(playLimit, 시훈이가 보낸 말 기준) 안에서만 답해요.
const PLAY_SYSTEM = `너는 초등학교 3학년 남자아이(시훈)의 이야기 친구야. 시훈이는 고양이를 좋아해.
한국어 반말로 짧게 말해. 이모지는 쓰지 마. 시훈이는 놀이를 하거나 궁금한 것을 물어봐.
- 놀이: 끝말잇기, 스무고개, 수수께끼, 낱말 퀴즈 같은 놀이를 시훈이가 고르면 그 규칙대로 한 차례씩 1~2문장으로 주고받아.
- 끝말잇기: 앞 낱말의 마지막 글자로 시작하는 실제로 있는 명사만 써. 두음법칙(예: 력→역)은 써도 돼. 이미 나온 낱말은 다시 쓰지 마. 시훈이가 규칙에 안 맞는 낱말을 내면 왜 안 되는지 짧게 말하고 다시 내게 해.
- 궁금한 것(예: 지동설이 뭐야?): 초등학교 3학년이 알아들을 쉬운 말로 2~4문장 설명해. 어려운 낱말은 풀어서 말하고, 아는 것과 맞는 예를 하나 들어. 확실하지 않으면 모른다고 하고 엄마나 선생님께 여쭤보자고 해. 설명 끝에 스스로 생각해 볼 짧은 질문을 하나 붙여.
- 숙제 문제의 답을 그대로 달라고 하면 답은 바로 주지 말고, 풀 수 있게 힌트와 되묻는 질문을 줘.
- 놀이 중에 궁금한 걸 물으면 설명해 주고, 놀이를 계속할지 물어봐. 무엇을 할지 정해지지 않았으면 놀이할지 궁금한 걸 물어볼지 짧게 물어봐.
- 아이에게 맞지 않는 내용이나 사람·몸·마음이 걱정되는 말이면 "그건 엄마랑 같이 이야기해 보자."라고만 말해.`;

exports.playClaude = onDocumentCreated(
  { document: "sihunBoard/main/play/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60, maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const msg = snap && snap.data();
    if (!msg || msg.role !== "user" || !msg.text || !msg.sid) return;
    const db = getFirestore();
    const col = db.collection("sihunBoard/main/play");
    const main = (await db.doc("sihunBoard/main").get()).data() || {};
    if (!main.aiOn) return;
    const reply = (text, extra) => col.add({ sid: msg.sid, role: "ai", text, date: msg.date || "", createdAt: Date.now(), ...extra });
    const limit = Number(main.playLimit) || 30;
    const today = (await col.where("date", "==", msg.date || "").get()).docs
      .filter((d) => d.data().role === "user" && (d.data().createdAt || 0) < (msg.createdAt || 0)).length;
    if (today >= limit) return reply("오늘 놀이는 여기까지! 내일 또 하자.", { by: "limit" });
    const hist = (await col.where("sid", "==", msg.sid).get()).docs.map((d) => d.data())
      .filter((m) => (m.createdAt || 0) <= (msg.createdAt || 0) && m.by !== "limit" && m.by !== "error")
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).slice(-40);
    const messages = [];
    for (const m of hist) {
      const role = m.role === "user" ? "user" : "assistant";
      const text = String(m.text || "").slice(0, 500);
      if (messages.length && messages[messages.length - 1].role === role) messages[messages.length - 1].content += "\n" + text;
      else messages.push({ role, content: text });
    }
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return;
    const Anthropic = require("@anthropic-ai/sdk").default;
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    try {
      const res = await client.messages.create({
        model: "claude-haiku-5-5", max_tokens: 2000, output_config: { effort: "low" },
        system: PLAY_SYSTEM, messages,
      });
      let text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      if (res.stop_reason === "refusal" || !text) text = "그건 엄마랑 같이 이야기해 보자.";
      await reply(text.slice(0, 300), { by: "claude-haiku-5-5" });
    } catch (e) {
      console.error("playClaude", e && e.status, e && e.message);
      await reply("지금은 대답을 못 했어. 조금 있다 다시 해 보자.", { by: "error", err: String((e && e.status) || "error") });
    }
  }
);
