// "서로에게 할 말"에 새 메시지가 생기면, 받는 사람 폰(알림 받기를 켠 폰)으로 푸시 알림을 보내요.
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const APP_URL = "https://kmsysh-fa740.web.app/";

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
- 시훈이가 사진을 보내면 사진에 보이는 것을 바탕으로 쉬운 말로 2~4문장 대답해. 잘 안 보이거나 확실하지 않으면 그렇다고 말해. 숙제 사진이면 답은 주지 말고 힌트와 되묻는 질문을 줘. 사진 속 사람 얼굴로 누구인지 맞히지는 마.
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
    // 📷 사진 질문: 시훈이 메시지에 img(data:image/jpeg, 800px로 줄인 것)가 있으면 그림으로 같이 보냄. 토큰 아끼려 최근 사진 2장까지만
    const withImg = new Set(hist.filter((m) => m.role === "user" && m.img).slice(-2));
    const messages = [];
    for (const m of hist) {
      const role = m.role === "user" ? "user" : "assistant";
      const text = String(m.text || "").slice(0, 500);
      const img = withImg.has(m) ? imgBlock(m.img) : null;
      const blocks = img ? [img, { type: "text", text }] : [{ type: "text", text }];
      if (messages.length && messages[messages.length - 1].role === role) messages[messages.length - 1].content.push(...blocks);
      else messages.push({ role, content: blocks });
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

// 시훈 공부방 수학 3-2 「AI 과외」(엄마 11/23): 틀린 문제에서 시훈이가 패드에 쓴 식을 읽고,
// 과외 선생님처럼 시훈이 식에서 출발해 짧게 묻고(답은 안 줌), 다시 풀게 해요. 식으로 정답이 나오면 더 간단한 방법이 있는지 알려 줘요.
// 앱이 sihun/data/m32tutor/{id} 에 요청을 쓰면(웹앱은 {_j: JSON 문자열} 모양으로 저장) 여기서 답을 같은 문서에 써 줘요.
const TUTOR_MODEL = "claude-opus-5-5";
const TUTOR_LIMIT = 80; // 하루 AI 호출 상한
const TUTOR_SYSTEM = `너는 초등학교 3학년 시훈이의 수학 과외 선생님이야. 시훈이 옆에 앉아서 시훈이가 쓴 풀이를 같이 보는 사람처럼 말해.
시훈이에 대해: 어려운 개념도 빨리 이해하지만, 아는 걸 바로 꺼내는 속도가 느리고 처음에 조건을 놓칠 때가 있어. 완벽주의라 틀렸다는 말에 예민해.
말하는 법:
- 한국어, 친근한 해요체("~했어요?", "~볼까요?"). 1~2문장. 한 번에 질문은 하나만.
- 반드시 시훈이가 실제로 쓴 식·숫자·말에서 출발해. (예: "12를 3으로 나눈 건 무엇을 구하려고 한 거예요?")
- 거창한 용어, 일반론, 과한 칭찬, 이모지는 쓰지 마. "틀렸어요"라고 하지 말고 그 식을 왜 그렇게 했는지 물어봐.
- 정답이나, 정답으로 바로 이어지는 계산을 직접 말하지 마. 시훈이가 스스로 찾게 해.
- 손글씨를 잘못 읽었을 수 있어. 숫자나 기호가 확실하지 않으면 먼저 "여기 ○○라고 쓴 거 맞아요?"라고 짧게 확인해.
엄마가 정한 가르치는 방법(11/23):
- 맞게 한 부분을 먼저 사실로 짚고(예: "24는 먹은 쿠키 맞아요, 계산 정확해요!"), 바로 "그런데 문제는 마지막 문장에서 뭘 물어봤을까요?"처럼 묻는 말(남은/전체의/○씩)로 돌려.
- 식은 시훈이가 쓴 한 줄에서 출발해 딱 3줄까지만(예: 5/6 = 35 → 1/6 = 7 → 6/6 = 42, 길이 문제는 첫 줄 1 m = 100 cm). 더 쓰라고 하지 마.
- 그림은 동그라미 대신 네모 칸(묶음 수만큼 네모, 준 칸에 X, 분모 = 전체 칸 수, 분자 = 남은 칸 수). 분수는 2÷5가 아니라 위아래로 쓰게 해.
생각하는 순서(속으로만):
- 먼저 시훈이 식에서 맞게 한 부분과, 처음 어긋난 한 지점을 찾아. 계산 실수인지, 문제 조건을 놓쳤는지, 개념(예: 분수의 전체가 무엇인지)을 다르게 알고 있는지 구분해.
- 질문은 그 첫 지점을 시훈이가 스스로 보게 하는 것 하나만. 맞게 한 부분이 있으면 그걸 짚고 시작해도 좋아(칭찬이 아니라 사실로).
- 앞에서 한 질문을 반복하지 말고, 시훈이 대답에 맞춰 한 걸음씩 좁혀 가.
state 고르기:
- "ask": 질문을 하고 시훈이 대답을 기다려.
- "retry": 시훈이가 방법을 찾은 것 같으면 "그럼 다시 풀어 볼까요?"처럼 말하고 답 칸에 다시 쓰게 해. 대화가 4번을 넘기면 retry로 가.
- "end": 시훈이가 정답을 맞힌 뒤 마무리할 때만 써.
- 시훈이가 쓴 식이 끝까지 가면 정답이 나오는데 답 칸에만 다르게 썼다면, 그 점을 짧게 알려 주고 retry.
- 정답을 맞혔다는 요청이 오면: 시훈이 방법보다 더 간단한 방법이 있으면 shorter에 한두 문장으로 쉽게 적고 say에서 "이렇게도 할 수 있어요"처럼 짧게 소개해. 시훈이 방법이 이미 간단하면 shorter는 빈 문자열, say는 짧게 마무리. state는 end.
read: 시훈이가 패드에 쓴 것을 글자 그대로 옮겨 적어(못 읽으면 "?" 표시).
- 시훈이가 패드에 쓰다가 스스로 답을 고쳤다는 요청이 오면: 처음 답이 왜 나왔는지 패드를 보고 mom에 적고, say는 시훈이가 패드에서 실제로 한 것을 짚어 한 문장으로 마무리해(과한 칭찬 금지). 더 간단한 방법은 위와 똑같이 shorter에. state는 end.
read: 시훈이가 패드에 쓴 것을 글자 그대로 옮겨 적어(못 읽으면 "?" 표시).
mom: 엄마에게 남기는 메모. 시훈이가 어디서 어떻게 생각했는지, 다음에 어떻게 설명하면 좋을지 한 문장으로 구체적으로. 일반론 금지.
pic: 더 간단한 방법을 그림으로 보여 줄 때만 채워. shorter가 빈 문자열이면 kind는 "none". 그림은 앱이 그려 주니 숫자만 정확히 정해. 안 쓰는 칸은 빈 배열이나 0으로 둬.
- "bar": 분수 막대. bars에 막대마다 전체 칸 수(parts), 색칠할 칸 수(shade), 이름(label). 최대 4개. 예: 12의 1/3 → parts 3, shade 1 막대.
- "groups": 묶음. groups에 묶음마다 점 개수(size)와 이름(label). 예: 12를 3묶음 → size 4짜리 3개.
- "line": 수직선. line.min, line.max, line.div(1칸을 몇으로 나눌지), marks(점 찍을 곳 at과 이름), jumps(from→to 뛰기와 이름).
- "table": 표. table은 줄마다 칸 글자 배열, 첫 줄이 제목.
caption: 그림 아래 한 줄 설명(시훈이 식과 비교해서). 그림이 시훈이 방법이 아니라 더 간단한 방법을 보여 줘야 해.`;
const TUTOR_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["read", "state", "say", "shorter", "mom", "pic"],
  properties: {
    read: { type: "string" },
    state: { type: "string", enum: ["ask", "retry", "end"] },
    say: { type: "string" },
    shorter: { type: "string" },
    mom: { type: "string" },
    pic: {
      type: "object", additionalProperties: false,
      required: ["kind", "caption", "bars", "groups", "line", "table"],
      properties: {
        kind: { type: "string", enum: ["none", "bar", "groups", "line", "table"] },
        caption: { type: "string" },
        bars: { type: "array", items: { type: "object", additionalProperties: false, required: ["parts", "shade", "label"], properties: { parts: { type: "integer" }, shade: { type: "integer" }, label: { type: "string" } } } },
        groups: { type: "array", items: { type: "object", additionalProperties: false, required: ["size", "label"], properties: { size: { type: "integer" }, label: { type: "string" } } } },
        line: {
          type: "object", additionalProperties: false, required: ["min", "max", "div", "marks", "jumps"],
          properties: {
            min: { type: "number" }, max: { type: "number" }, div: { type: "integer" },
            marks: { type: "array", items: { type: "object", additionalProperties: false, required: ["at", "label"], properties: { at: { type: "number" }, label: { type: "string" } } } },
            jumps: { type: "array", items: { type: "object", additionalProperties: false, required: ["from", "to", "label"], properties: { from: { type: "number" }, to: { type: "number" }, label: { type: "string" } } } },
          },
        },
        table: { type: "array", items: { type: "array", items: { type: "string" } } },
      },
    },
  },
};
const unpackDoc = (v) => (v && typeof v._j === "string" ? JSON.parse(v._j) : v || {});
const packDoc = (d) => ({ _j: JSON.stringify(d), at: d.at != null ? d.at : null, _t: Date.now() });
const imgBlock = (dataUrl) => {
  const m = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(String(dataUrl || ""));
  return m ? { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } } : null;
};

exports.m32Tutor = onDocumentCreated(
  { document: "sihun/data/m32tutor/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.problem || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    const db = getFirestore();
    const used = (await db.collection("sihun/data/m32tutor").where("at", "==", req.at || "").get()).size;
    if (used > TUTOR_LIMIT) return done({ state: "limit", say: "", read: "", shorter: "", mom: "하루 AI 상한을 넘었어요" });
    const p = req.problem;
    const lines = [
      `문제: ${p.q}`,
      `정답: ${p.ans}`,
      `앱에 있는 풀이 단계(시훈이에게 그대로 말하지 마): ${(p.sol || []).join(" / ")}`,
      `시훈이가 답 칸에 쓴 답: ${(req.answers || []).join(", ") || "없음"}`,
    ];
    if (req.turns && req.turns.length) {
      lines.push("지금까지 대화:");
      req.turns.forEach((t) => lines.push(`${t.who === "ai" ? "선생님" : "시훈"}: ${t.text}`));
    }
    if (req.kind === "fixed") lines.push("시훈이가 처음 답을 틀린 뒤, 패드에 식을 쓰다가 스스로 고쳐서 정답을 맞혔어요. 처음 답이 왜 나왔는지 보고, 더 간단한 방법이 있는지 확인하고 마무리해 주세요.");
    else if (req.kind === "solved") lines.push("시훈이가 방금 다시 풀어서 정답을 맞혔어요. 더 간단한 방법이 있는지 확인하고 마무리해 주세요.");
    else lines.push("시훈이가 쓴 풀이 그림을 보고, 다음에 할 말을 정해 주세요.");
    const content = [];
    const first = imgBlock(req.img1), last = imgBlock(req.img2);
    if (first) content.push({ type: "text", text: "처음에 시훈이가 패드에 쓴 풀이:" }, first);
    if (last) content.push({ type: "text", text: "지금 패드에 있는 풀이:" }, last);
    // 풀이가 길면 시훈이가 종이에 풀고 📷 사진으로 올려요(엄마 11/23)
    (Array.isArray(req.photos) ? req.photos.slice(0, 2) : []).forEach((ph, k) => {
      const b = imgBlock(ph);
      if (b) content.push({ type: "text", text: `시훈이가 종이에 푼 풀이 사진 ${k + 1}:` }, b);
    });
    content.push({ type: "text", text: lines.join("\n") });
    const Anthropic = require("@anthropic-ai/sdk").default;
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const base = {
      model: TUTOR_MODEL, max_tokens: 4000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: TUTOR_SCHEMA } },
      system: TUTOR_SYSTEM,
      messages: [{ role: "user", content }],
    };
    try {
      let res;
      try {
        res = await client.beta.messages.create({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
      } catch (e1) {
        if (!(e1 && e1.status === 400)) throw e1;
        console.warn("m32Tutor fallback params rejected, retrying plain", e1.message);
        res = await client.messages.create(base);
      }
      if (res.stop_reason === "refusal") return done({ state: "error", err: "refusal", say: "", read: "", shorter: "", mom: "" });
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const out = JSON.parse(text);
      return done({ ...out, model: res.model, usage: { in: res.usage && res.usage.input_tokens, out: res.usage && res.usage.output_tokens } });
    } catch (e) {
      console.error("m32Tutor", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", read: "", shorter: "", mom: "" });
    }
  }
);

// 시훈 공부방 수학 3-2 「AI 분석」(엄마 11/23): 엄마 리포트에서 버튼을 누르면 그날(또는 최근 7일, 또는 한 문제)의
// 기록·손풀이 그림·AI 과외 대화를 읽고, 시훈이가 어떻게 생각했는지와 시훈이에게 맞는 가르치는 방법을 엄마에게 알려 줘요.
// 리포트가 sihun/data/m32ana/{id} 에 요청을 쓰면 여기서 같은 문서에 res를 채워요. 손풀이 그림은 서버가 m32pen에서 직접 읽어요.
const ANA_LIMIT = 30; // 하루 분석 상한
const ANA_MAX_IMG = 10;
const ANA_SYSTEM = `너는 초등학교 3학년 시훈이를 가르치는 수학 과외 선생님이고, 지금은 엄마에게 오늘 수업을 보고하는 중이야.
시훈이에 대해(엄마가 알려 준 것): 어려운 개념도 빨리 이해하지만 아는 걸 바로 꺼내는 속도가 느리고, 처음에 조건을 놓칠 때가 있어. 완벽주의라 틀렸다는 말과 힌트에 예민해서 울기도 해. 풀이 방식이 자유분방해서 형식을 잡아 줄 필요가 있어. 종이에 쓰는 걸 매우 어려워해.
기록 읽는 법: res o=한 번에 정답, h=도움(힌트·고치기·AI 대화) 받고 정답, x=틀림, s=건너뜀. sec=답까지 걸린 초. pen=손풀이(n 획 수, first 첫 획까지 초, erase 지우개, idle 가장 오래 멈춘 초). penAsk wrote=틀린 뒤 식을 씀, blank="생각이 안 나요". fixed=패드에 쓰다가 스스로 답을 고침. tutor=AI 과외 대화. learn=더 쉬운 방법을 보고 시훈이가 고른 것(nw new 처음 알았음/knew 알던 것, use will 써 보겠다/mine 내 방법이 편하다).
보고하는 법:
- 한국어, 엄마에게 말하듯 담백한 해요체. 거창한 용어, 일반론, 과한 칭찬 금지. 짧고 구체적으로.
- 반드시 기록과 손풀이 그림에서 본 것(쓴 숫자, 식, 순서, 시간)을 근거로 말해. 근거가 약하면 "(추측)"이라고 붙여.
- 손글씨를 잘못 읽었을 수 있어. 확실하지 않은 숫자는 그렇게 말해.
- 검사 결과나 나이를 들어 단서를 달지 마.
- teach는 내일 바로 해 볼 수 있는 가르치는 방법이야. 시훈이 실제 풀이에서 출발하고, 예민한 성격을 생각해서 어떻게 말할지까지 적어. 2~3개.
- 문제가 한두 개뿐이면 pattern은 "아직 문제가 적어서 반복되는 모습은 더 봐야 해요"처럼 솔직하게.
problems에는 틀렸거나 도움을 받았거나 손풀이가 있는 문제만, 주어진 key를 그대로 써.`;
const ANA_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["summary", "problems", "pattern", "teach"],
  properties: {
    summary: { type: "string" },
    problems: { type: "array", items: { type: "object", additionalProperties: false, required: ["key", "saw", "why", "next"], properties: { key: { type: "string" }, saw: { type: "string" }, why: { type: "string" }, next: { type: "string" } } } },
    pattern: { type: "string" },
    teach: { type: "array", items: { type: "string" } },
  },
};

exports.m32Analyze = onDocumentCreated(
  { document: "sihun/data/m32ana/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !Array.isArray(req.items) || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    const db = getFirestore();
    const used = (await db.collection("sihun/data/m32ana").where("at", "==", req.at || "").get()).size;
    if (used > ANA_LIMIT) return done({ state: "limit" });
    const items = req.items.slice(0, 80);
    // 그림은 틀림·도움 받은 문제 먼저, 최대 ANA_MAX_IMG장
    const withPen = items.filter((x) => x.pen && x.pen.id).sort((a, b) => (a.res === "o") - (b.res === "o")).slice(0, ANA_MAX_IMG);
    const content = [];
    for (const x of withPen) {
      try {
        const ps = await db.doc("sihun/data/m32pen/" + x.pen.id).get();
        const pd = ps.exists ? unpackDoc(ps.data()) : {};
        const img = imgBlock(pd.img);
        if (img) content.push({ type: "text", text: `손풀이 그림 (key ${x.key}):` }, img);
        for (const phId of (Array.isArray(pd.ph) ? pd.ph.slice(0, 2) : [])) {
          const qs = await db.doc("sihun/data/m32pen/" + phId).get();
          const ph = qs.exists ? imgBlock(unpackDoc(qs.data()).img) : null;
          if (ph) content.push({ type: "text", text: `종이 풀이 사진 (key ${x.key}):` }, ph);
        }
      } catch (e) { console.warn("m32Analyze pen", x.pen.id, e.message); }
    }
    const scope = req.kind === "one" ? "이 한 문제" : req.kind === "week" ? `최근 7일(${req.from}~${req.at})` : `${req.at} 하루`;
    content.push({ type: "text", text: `${scope}의 수학 3-2 기록이에요. JSON 한 줄이 한 문제예요.\n` + items.map((x) => JSON.stringify(x)).join("\n") + `\n\n엄마에게 보고해 주세요.` });
    const Anthropic = require("@anthropic-ai/sdk").default;
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
    const base = {
      model: TUTOR_MODEL, max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_schema", schema: ANA_SCHEMA } },
      system: ANA_SYSTEM,
      messages: [{ role: "user", content }],
    };
    try {
      let res;
      try {
        res = await client.beta.messages.stream({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }).finalMessage();
      } catch (e1) {
        if (!(e1 && e1.status === 400)) throw e1;
        console.warn("m32Analyze fallback params rejected, retrying plain", e1.message);
        res = await client.messages.stream(base).finalMessage();
      }
      if (res.stop_reason === "refusal") return done({ state: "error", err: "refusal" });
      const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      const out = JSON.parse(text);
      return done({ state: "ok", ...out, imgs: withPen.length, model: res.model, usage: { in: res.usage && res.usage.input_tokens, out: res.usage && res.usage.output_tokens } });
    } catch (e) {
      console.error("m32Analyze", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error") });
    }
  }
);

// ===================================================================================
// 시훈 공부방 국어 AI (엄마 11/23): 국어 과외 koTutor · 글쓰기 첨삭 writeCoach · 국어 분석 koAnalyze
// 수학 함수와 같은 방식: 앱이 sihun/data/<칸>/{id} 에 요청을 쓰면 여기서 같은 문서에 res를 채워요.
// ===================================================================================
const KO_TUTOR_LIMIT = 150; // 하루 국어 과외 호출 상한
const WRITE_LIMIT = 100;    // 하루 글쓰기 첨삭 호출 상한
const KOANA_LIMIT = 30;     // 하루 국어 분석 상한
const SIHUN_ABOUT = `시훈이에 대해(엄마가 알려 준 것): 초등학교 3학년. 어려운 개념도 빨리 이해하지만 아는 걸 바로 꺼내는 속도가 느리고, 처음에 조건이나 묻는 말을 놓칠 때가 있어. 완벽주의라 틀렸다는 말과 힌트에 예민해. 종이에 쓰는 걸 매우 어려워해. 국어는 수능 입문반(초3에게 어려운 비문학·문학·문법)을 듣고 있어.`;

async function callJson(system, content, schema, opts) {
  const Anthropic = require("@anthropic-ai/sdk").default;
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
  const base = {
    model: TUTOR_MODEL, max_tokens: opts.max || 8000,
    output_config: { effort: opts.effort || "medium", format: { type: "json_schema", schema } },
    system, messages: [{ role: "user", content }],
  };
  if (opts.think) base.thinking = { type: "adaptive" };
  if (opts.fast) base.speed = "fast"; // Opus 5.5 빠른 모드(값 2배, 말 나오는 속도 최대 2.5배)
  let res;
  const run = (params, beta) => {
    const st = beta ? client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }) : client.messages.stream(params);
    if (opts.onText) { opts.onText(null); st.on("text", (d) => opts.onText(d)); }
    return st.finalMessage();
  };
  const plain = { ...base }; delete plain.speed;
  try {
    res = await run(base, true);
  } catch (e1) {
    if (!(e1 && (e1.status === 400 || (e1.status === 429 && base.speed)))) throw e1;
    console.warn(opts.tag, "fallback/fast params rejected, retrying plain", e1.status, e1.message);
    if (base.speed && e1.status === 400) {
      try { res = await run(base, false); } catch (e2) {
        if (!(e2 && (e2.status === 400 || e2.status === 429))) throw e2;
        console.warn(opts.tag, "fast mode rejected, retrying standard", e2.status, e2.message);
        res = await run(plain, false);
      }
    } else res = await run(plain, false);
  }
  if (res.stop_reason === "refusal") return { refusal: true, model: res.model, usage: { in: res.usage && res.usage.input_tokens, out: res.usage && res.usage.output_tokens } };
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const cu = res.usage || {};
  return { out: JSON.parse(text), model: res.model, stop: res.stop_reason, usage: { in: cu.input_tokens, out: cu.output_tokens, cw: cu.cache_creation_input_tokens || 0, cr: cu.cache_read_input_tokens || 0 } };
}
async function usedToday(col, at) {
  return (await getFirestore().collection("sihun/data/" + col).where("at", "==", at || "").get()).size;
}

// ----- 국어 과외: 틀린 문제에서 시훈이 답에서 출발해 근거를 되묻기 (답은 절대 알려 주지 않음) -----
const KO_TUTOR_SYSTEM = `너는 시훈이의 국어 과외 선생님이야. 시훈이 옆에 앉아 같은 문제를 보는 사람처럼 말해.
${SIHUN_ABOUT}
말하는 법:
- 한국어, 친근한 해요체. 1~2문장. 한 번에 질문은 하나만. 이모지, 거창한 용어, 일반론, 과한 칭찬 금지.
- "틀렸어요"라고 하지 마. 시훈이가 고른 답에서 출발해 "왜 그걸 골랐는지"부터 물어.
- 정답 번호, 정답 선택지의 말, 정답으로 바로 이어지는 결론은 절대 말하지 마. 시훈이가 지문과 문제에서 스스로 찾게 해.
- 어려운 문제는 단계로 쪼개(엄마가 정한 순서): ① 질문 바꿔 말하기(문제가 무엇을 묻는지 시훈이 말로) → ② 근거 찾기(지문이나 보기에서 그 판단의 근거가 되는 문장/낱말) → ③ 고르기(근거와 맞는 선택지 다시 고르기). 시훈이가 이미 한 단계는 건너뛰어.
- 문제 속 낱말이 초3에게 어려우면(예: 통시, 이항 대립, 비음화) 뜻을 쉬운 말로 한 번 풀어 주는 건 괜찮아. 단, 답을 가리키면 안 돼.
- 시훈이가 근거를 찾아 다시 고를 준비가 되면 state "retry"로 "그럼 다시 골라 볼까요?"처럼 말해.
- 시훈이가 다시 골라 맞혔다는 요청이 오면 무엇을 근거로 맞혔는지 시훈이 말로 한 문장 짚고 state "end".
- 대화가 길어졌는데도 막혀 있으면 정답 대신 해설의 첫 실마리(어디를 다시 읽을지)만 주고 state "retry".
step: 지금 묻는 단계(restate/evidence/choose/wrap).
mom: 엄마에게 남기는 한 문장 메모. 시훈이가 어디서 어떻게 생각했는지 구체적으로(일반론 금지).
keyDoubt: 문제·선택지·정답을 보고 정답이 의심스러우면(답이 둘이거나, 정답이 지문과 안 맞거나) true와 이유를 doubtWhy에. 시훈이에게는 절대 말하지 마. 아니면 false와 빈 문자열.`;
const KO_TUTOR_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["state", "step", "say", "mom", "keyDoubt", "doubtWhy"],
  properties: {
    state: { type: "string", enum: ["ask", "retry", "end"] },
    step: { type: "string", enum: ["restate", "evidence", "choose", "wrap"] },
    say: { type: "string" }, mom: { type: "string" },
    keyDoubt: { type: "boolean" }, doubtWhy: { type: "string" },
  },
};
exports.koTutor = onDocumentCreated(
  { document: "sihun/data/kotutor/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.problem || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("kotutor", req.at)) > KO_TUTOR_LIMIT) return done({ state: "limit", say: "", mom: "하루 AI 상한을 넘었어요" });
    const p = req.problem;
    const lines = [
      p.psg ? `지문:\n${p.psg}` : "",
      `문제(${p.area || "국어"}${p.src ? ", " + p.src : ""}): ${p.q}`,
      p.box ? `보기/제시문: ${p.box}` : "",
      p.opts && p.opts.length ? `선택지:\n${p.opts.map((o, i) => `${i + 1}. ${o}`).join("\n")}` : "",
      `정답(시훈이에게 말하지 마): ${p.ans}`,
      p.exp ? `앱 해설(시훈이에게 그대로 말하지 마): ${p.exp}` : "",
      p.raw ? `문항 데이터(정답·해설 포함, 시훈이에게 그대로 말하지 마): ${String(p.raw).slice(0, 4000)}` : "",
      `시훈이가 고른 답: ${(req.picks || []).join(" → ") || "없음"}`,
    ].filter(Boolean);
    if (req.turns && req.turns.length) {
      lines.push("지금까지 대화:");
      req.turns.forEach((t) => lines.push(`${t.who === "ai" ? "선생님" : "시훈"}: ${t.text}`));
    }
    lines.push(req.kind === "solved" ? "시훈이가 방금 다시 골라 정답을 맞혔어요. 마무리해 주세요." : "다음에 할 말을 정해 주세요.");
    try {
      const r = await callJson(KO_TUTOR_SYSTEM, [{ type: "text", text: lines.join("\n") }], KO_TUTOR_SCHEMA, { tag: "koTutor", max: 6000, effort: "medium" });
      if (r.refusal) return done({ state: "error", err: "refusal", say: "", mom: "", model: r.model, usage: r.usage });
      return done({ ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("koTutor", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", mom: "" });
    }
  }
);

// ----- 글쓰기 첨삭: 대신 쓰지 않고 질문으로만 (내용은 100% 시훈이 말) -----
const WRITE_SYSTEM = `너는 시훈이의 글쓰기 선생님이야. 시훈이가 말한 조각들을 보고 질문으로만 글을 키워 줘.
${SIHUN_ABOUT}
절대 규칙:
- 문장을 대신 써 주거나, "이렇게 써 봐" 하고 예시 문장을 주지 마. 낱말 하나도 대신 고르지 마. 내용은 100% 시훈이 입에서 나와야 해.
- 한 번에 질문은 하나만. 한국어 친근한 해요체, 1~2문장. 이모지·과한 칭찬·일반론 금지.
- 반드시 시훈이가 실제로 한 말에서 출발해(예: "'카렌이 나빴다'고 했는데, 책 어디에서 그렇게 느꼈어요?").
질문 고르는 순서(이미 된 건 건너뛰기): ① 과제가 묻는 것에 대한 내 답이 있나 → ② 왜 그렇게 생각하는지(왜냐하면) → ③ 근거(책·경험에서 어디, 무슨 장면) → ④ 예나 자세한 설명 하나 → ⑤ 마무리(그래서 내 생각은).
- 답·이유·근거가 다 있으면 state "ready"로 "이제 순서대로 놓아 볼까요?"처럼 말해.
spell: 시훈이 조각에서 맞춤법이 틀린 낱말만 골라 word(시훈이가 쓴 그대로)와 hint(고친 말이 아니라 "받침을 다시 봐요" 같은 힌트)로. 고친 낱말을 알려 주지 마. 없으면 빈 배열.
focus: 이번 질문이 노리는 것(answer/reason/evidence/example/wrap/none).
mom: 엄마에게 남기는 한 문장 메모(시훈이 생각이 어디서 막히는지 구체적으로).`;
const WRITE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["state", "say", "focus", "spell", "mom"],
  properties: {
    state: { type: "string", enum: ["ask", "ready"] },
    say: { type: "string" },
    focus: { type: "string", enum: ["answer", "reason", "evidence", "example", "wrap", "none"] },
    spell: { type: "array", items: { type: "object", additionalProperties: false, required: ["word", "hint"], properties: { word: { type: "string" }, hint: { type: "string" } } } },
    mom: { type: "string" },
  },
};
exports.writeCoach = onDocumentCreated(
  { document: "sihun/data/writecoach/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.task || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("writecoach", req.at)) > WRITE_LIMIT) return done({ state: "limit", say: "", spell: [], mom: "하루 AI 상한을 넘었어요" });
    const t = req.task;
    const content = [];
    const img = imgBlock(t.img);
    if (img) content.push({ type: "text", text: "과제 종이 사진:" }, img);
    const lines = [
      `과제: ${t.title || ""}${t.q ? "\n묻는 것: " + t.q : ""}${t.note ? "\n참고: " + t.note : ""}${t.psg ? "\n읽은 글(시훈이가 근거를 찾을 곳): " + String(t.psg).slice(0, 6000) : ""}`,
      "시훈이가 지금까지 한 말(조각):",
      ...(req.pieces || []).map((x, i) => `${i + 1}. ${x}`),
    ];
    if (req.turns && req.turns.length) {
      lines.push("지금까지 대화:");
      req.turns.forEach((x) => lines.push(`${x.who === "ai" ? "선생님" : "시훈"}: ${x.text}`));
    }
    lines.push("다음 질문 하나를 정해 주세요.");
    content.push({ type: "text", text: lines.join("\n") });
    try {
      const r = await callJson(WRITE_SYSTEM, content, WRITE_SCHEMA, { tag: "writeCoach", max: 6000, effort: "medium" });
      if (r.refusal) return done({ state: "error", err: "refusal", say: "", spell: [], mom: "", model: r.model, usage: r.usage });
      return done({ ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("writeCoach", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", spell: [], mom: "" });
    }
  }
);

// ----- 국어 분석: 엄마 리포트 「🔍 국어 AI 분석」 -----
const KOANA_SYSTEM = `너는 시훈이의 국어 과외 선생님이고, 지금 엄마에게 국어 공부를 보고하는 중이야.
${SIHUN_ABOUT}
기록 읽는 법: 한 줄이 한 활동이야. test=누적 테스트(wrong에 틀린 문제: 문제·시훈 답·정답), daily=복습 카드, hw=숙제, write=독서 워크지 서술형, tutor=AI 국어 과외 대화, writing=글쓰기 첨삭 코너. sec=걸린 초.
보고하는 법:
- 한국어, 엄마에게 말하듯 담백한 해요체. 짧고 구체적으로. 반드시 기록(문제, 시훈 답, 대화)에서 본 것을 근거로. 근거가 약하면 "(추측)".
- areas: 영역(비문학/문학/문법/스키마/독서/글쓰기)별로 어디가 어려운지. 실력 문제(개념을 모름)인지, 문제를 잘못 읽은 것인지, 너무 어려운 수준인지 구분해.
- keyDoubts: 정답지가 의심스러운 문제(답이 둘이거나 정답이 지문과 안 맞음)만. 없으면 빈 배열.
- teach: 내일 바로 해 볼 가르치는 방법 2~3개. 시훈이 실제 답에서 출발하고, 예민한 성격을 생각해 어떻게 말할지까지.
- 문제가 적으면 pattern에 "아직 기록이 적어서 더 봐야 해요"처럼 솔직하게. 검사 결과나 나이로 단서 달지 마.`;
const KOANA_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["summary", "areas", "keyDoubts", "pattern", "teach"],
  properties: {
    summary: { type: "string" },
    areas: { type: "array", items: { type: "object", additionalProperties: false, required: ["area", "saw", "why"], properties: { area: { type: "string" }, saw: { type: "string" }, why: { type: "string" } } } },
    keyDoubts: { type: "array", items: { type: "object", additionalProperties: false, required: ["src", "why"], properties: { src: { type: "string" }, why: { type: "string" } } } },
    pattern: { type: "string" },
    teach: { type: "array", items: { type: "string" } },
  },
};
exports.koAnalyze = onDocumentCreated(
  { document: "sihun/data/koana/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 300, maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !Array.isArray(req.items) || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("koana", req.at)) > KOANA_LIMIT) return done({ state: "limit" });
    const scope = req.kind === "week" ? `최근 7일(${req.from}~${req.at})` : `${req.at} 하루`;
    const text = `${scope}의 국어 기록이에요. JSON 한 줄이 한 활동이에요.\n` + req.items.slice(0, 120).map((x) => JSON.stringify(x)).join("\n") + "\n\n엄마에게 보고해 주세요.";
    try {
      const r = await callJson(KOANA_SYSTEM, [{ type: "text", text }], KOANA_SCHEMA, { tag: "koAnalyze", max: 16000, effort: "high", think: true });
      if (r.refusal) return done({ state: "error", err: "refusal", model: r.model, usage: r.usage });
      return done({ state: "ok", ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("koAnalyze", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error") });
    }
  }
);

// ----- 수학 「🧑‍🏫 AI에게 가르치기」(엄마 11/24): 하루 1문제, 시훈이가 카츄(AI)에게 풀이를 설명 -----
// 카츄(시훈이 인형, 형아라고 부르는 동생)는 헷갈려하는 역할. 시훈이가 건너뛴 단계와 순서를 콕 집어 묻고, 한 번은 일부러 틀린 풀이를 보여 주고 고쳐 달라고 해요.
// 앱이 sihun/data/m32teachai/{id} 에 요청을 쓰면 여기서 같은 문서에 res를 채워요. 대화 기록은 앱이 m32teach/ 에 따로 남겨요.
const TEACH_LIMIT = 60; // 하루 호출 상한
const TEACH_SYSTEM = `너는 "카츄"야. 시훈이(초3)가 아끼는 노란 인형이고, 시훈이를 "형아"라고 부르며 따르는 귀여운 동생이야. 지금 보는 수학 문제를 처음 봐서 잘 몰라. 형아가 너에게 이 문제 푸는 법을 가르쳐 주는 중이야.
${SIHUN_ABOUT}
엄마가 알려 준 시훈이 버릇: 설명할 때 단계를 잘 건너뛰고, 식을 자유분방하게(순서 없이, 중간 과정 없이) 써. 이 활동의 목표는 시훈이가 "구하는 것 → 조건 → 방법(식) → 계산 → 답 확인"을 빠짐없이, 순서대로 말로 꺼내는 거야.
카츄가 말하는 법:
- 한국어 반말, 동생 말투로 짧게(1~2문장). 시훈이는 늘 "형아"라고 불러(이름 대신). 궁금해하고, 형아한테 묻고, 이해되면 신기해해. 한 번에 질문은 하나만. 이모지, 어려운 용어, 일반론 쓰지 마.
- 너는 배우는 사람이야. 풀이 방법, 식, 답을 네가 먼저 말하거나 대신 정리하지 마. 시훈이가 말한 걸 따라 말하며 확인하는 건 괜찮아("아, 12를 3으로 나눈 거구나.").
- 칭찬은 하지 마. 대신 진짜로 이해한 걸 사실로 말해("아 그래서 남은 걸 구하는 거구나!"). "잘했어", "대단해", "똑똑해" 금지.
- "틀렸어"라고 하지 마. 시훈이 설명이 이상하면 헷갈린 동생처럼 "어? 그럼 ○○는 어디서 쓴 거야?"처럼 물어.
- 시험 보는 느낌이 나면 안 돼. 시훈이는 완벽주의라 예민해. 다그치지 말고 궁금해서 묻는 말투로.
무엇을 물을지(가장 중요):
- 시훈이 말과 패드 그림을 앱 풀이 단계와 비교해서, 시훈이가 건너뛴 첫 단계를 찾아. 숫자나 식이 어디서 나왔는지 말 안 하고 갑자기 나오면, 시훈이가 쓴 그 숫자 그대로 콕 집어 "여기서 18은 어떻게 나온 거야?"라고 물어.
- 순서가 뒤죽박죽이면 "잠깐, 그럼 제일 먼저 뭐부터 해?"처럼 "먼저 → 그다음 → 그래서" 순서로 말하게 이끌어.
- 문제가 무엇을 묻는지(남은 것? 전체? 차이? 단위?)를 말하지 않았으면 "근데 이 문제는 결국 뭘 구하라는 거야?"라고 물어.
- 조건(문제 속 숫자·말)을 하나 빼먹었으면 "문제에 ○○라고도 써 있던데, 그건 안 써도 돼?"라고 물어.
- 왜 그 계산인지 말 안 했으면 "왜 더하는 게 아니라 빼는 거야?"처럼 물어.
- 시훈이가 이미 말한 건 다시 묻지 마. 한 걸음씩.
- "요즘 막힌 지점" 기록이 오면, 그건 시훈이가 실제로 자주 넘어지는 곳이야(예: "남은 것의 ○/○"에서 "남은"을 놓침, 분수의 전체를 잘못 잡음, 조건 하나 빼먹음). 이 문제에서 같은 함정이 나오는 자리가 있으면, 시훈이가 그 부분을 말로 분명히 꺼낼 때까지 거기를 먼저 콕 집어 물어. 예: "근데 형아, 3/4은 처음 전체의 3/4이야, 아니면 남은 것의 3/4이야?" 일부러 틀린 풀이도 될 수 있으면 그 함정으로 만들어. 기록이나 "예전에 틀렸지?" 같은 말은 절대 꺼내지 마(처음 보는 척).
- 최고의 과외 선생님처럼 정확해야 해: 묻기 전에 앱 풀이 단계와 정답으로 이 문제를 직접 끝까지 풀어 보고, 시훈이 설명의 어느 줄이 맞고 어디가 빠졌는지 확인한 다음 질문해. 시훈이 설명이 맞는데 틀린 것처럼 묻지 마.
- 손글씨를 잘못 읽었을 수 있어. 숫자가 확실하지 않으면 "여기 ○○라고 쓴 거 맞아?"라고 먼저 확인해.
- 전략 카드 이름이 주어지면, 시훈이가 방법을 설명한 뒤 한 번쯤 "이런 걸 뭐라고 해? 무슨 방법이야?"처럼 물어봐도 돼(필수 아님).
일부러 틀린 풀이(딱 한 번, wrongDone이 0일 때만):
- 시훈이가 방법을 어느 정도 설명한 뒤(보통 시훈이 두 번째나 세 번째 말 다음), state "wrong"으로 "아 알겠다! 그럼 이렇게 하면 되지?" 하고 wrongWork에 네 풀이를 1~3줄로 써.
- 틀린 곳은 이 문제에서 3학년이 실제로 많이 하는 실수 하나만: 조건 하나 빼먹기, 묻는 것과 다른 걸 답하기(먹은 것 vs 남은 것), 단위 안 바꾸기, 분수의 전체를 잘못 잡기 등. 나머지는 맞게.
- 다음 차례에서 시훈이가 어디가 틀렸는지 짚으면 "아 그렇구나, 거기서 헷갈렸어"처럼 받아들이고 계속해. 못 짚으면 "음 그럼 내 거랑 네 거랑 어디가 달라?"라고 한 번만 더 묻고 넘어가.
- wrongDone이 1이면 다시는 "wrong"을 쓰지 마.
state 고르기:
- "ask": 질문하고 시훈이 대답을 기다려.
- "wrong": 위의 일부러 틀린 풀이(한 번만).
- "done": 구하는 것·조건·방법·답이 시훈이 말로 다 나왔고 틀린 풀이 고치기도 끝났으면, 시훈이가 말한 핵심을 넣어 "아 이제 알겠다! 그러니까 ○○구나. 고마워!"로 끝내. 시훈이 말 횟수(n)가 3 미만이면 done 하지 마(틀린 풀이를 아직 안 했으면 하고 나서). final이 1이면 무조건 "done"으로 고맙다고 마무리해(질문 금지).
나머지 칸:
- focus: 이번 말이 노리는 것. goal(구하는 것)/cond(조건)/skip(건너뛴 단계)/order(순서)/why(왜 그 계산)/answer(답·단위)/check(답 확인)/fix(틀린 풀이)/none.
- have: 지금까지 시훈이 말·패드에 실제로 나온 것만 true. goal(구하는 것), cond(필요한 조건 모두), method(방법·식), steps(중간 계산 과정을 빠짐없이), answer(답과 단위).
- skipped: 이번 시훈이 말에서 건너뛴 단계를 엄마가 알아보게 짧게(예: "18이 어디서 나왔는지 말 안 함"). 없으면 빈 배열.
- order: state가 done일 때만. 시훈이가 가르친 풀이를 순서대로 2~5줄로. 반드시 시훈이가 실제로 한 말·쓴 식만 써(네가 내용을 보태지 마, 말투만 짧게 다듬기). asked는 그 단계가 처음엔 빠졌다가 카츄가 물어봐서 나온 것이면 true. done이 아니면 빈 배열.
- correct: 시훈이가 설명한 답이 정답과 같으면 true(설명 중 답이 아직 안 나왔으면 시훈이 첫 결과를 기준으로 true).
- mom: 엄마에게 남기는 한 문장 메모. 시훈이가 어떤 단계를 건너뛰었고, 어떻게 물었더니 나왔는지 구체적으로.`;
const TEACH_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["state", "say", "wrongWork", "focus", "have", "skipped", "order", "correct", "mom"],
  properties: {
    state: { type: "string", enum: ["ask", "wrong", "done"] },
    say: { type: "string" },
    wrongWork: { type: "string" },
    focus: { type: "string", enum: ["goal", "cond", "skip", "order", "why", "answer", "check", "fix", "none"] },
    have: {
      type: "object", additionalProperties: false, required: ["goal", "cond", "method", "steps", "answer"],
      properties: { goal: { type: "boolean" }, cond: { type: "boolean" }, method: { type: "boolean" }, steps: { type: "boolean" }, answer: { type: "boolean" } },
    },
    skipped: { type: "array", items: { type: "string" } },
    order: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "asked"], properties: { text: { type: "string" }, asked: { type: "boolean" } } } },
    correct: { type: "boolean" },
    mom: { type: "string" },
  },
};
exports.m32Teach = onDocumentCreated(
  { document: "sihun/data/m32teachai/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3, minInstances: 0 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.problem || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("m32teachai", req.at)) > TEACH_LIMIT) return done({ state: "limit", say: "", mom: "하루 AI 상한을 넘었어요" });
    const p = req.problem;
    const how = p.kind === "new" ? "아직 안 푼 새 문제예요. 시훈이가 풀면서 가르쳐요." : p.res === "h" ? "시훈이가 전에 헤맸지만 결국 맞힌 문제예요." : "시훈이가 전에 맞힌 문제예요.";
    const lines = [
      `문제: ${p.q}`,
      `정답(카츄는 모르는 척해. 먼저 말하지 마): ${p.ans}`,
      `앱 풀이 단계(시훈이 설명과 비교용, 그대로 말하지 마): ${(p.sol || []).join(" / ")}`,
      p.strat ? `이 문제 전략 카드: ${p.strat}` : "",
      how,
      req.hist ? `시훈이가 요즘 막힌 지점(앱 기록, 시훈이에게 기록 얘기는 하지 마):\n${String(req.hist).slice(0, 2500)}` : "",
      `시훈이 말 횟수 n=${req.n || 0} (최대 ${req.max || 5}), wrongDone=${req.wrongDone ? 1 : 0}, final=${req.final ? 1 : 0}`,
      "지금까지 대화:",
      ...(req.turns || []).map((t) => `${t.who === "ai" ? "카츄" : "시훈"}: ${t.text}`),
      req.final ? "이번이 마지막이에요. state는 done으로, 고맙다고 마무리해 주세요." : "카츄가 다음에 할 말을 정해 주세요.",
    ].filter(Boolean);
    const content = [];
    const img = imgBlock(req.img);
    if (img) content.push({ type: "text", text: "시훈이가 지금 패드에 쓴 것:" }, img);
    (Array.isArray(req.photos) ? req.photos.slice(0, 2) : []).forEach((ph, k) => {
      const b = imgBlock(ph);
      if (b) content.push({ type: "text", text: `시훈이가 종이에 쓴 사진 ${k + 1}:` }, b);
    });
    content.push({ type: "text", text: lines.join("\n") });
    try {
      // 엄마 11/25 "카츄 반응 너무 느리다": 답 전체(정리·메모 칸까지)를 기다리지 않고, 카츄가 하는 말(say)이 나오는 대로
      // 작은 문서 m32teachp/{id} 에 0.35초마다 써서 앱이 바로 보여 줘요.
      // 엄마 11/25 "비용 올라가도 돼, 최고의 과외 선생님 수준": 빠른 모드(speed fast, 값 2배) + 생각 깊게(effort high). 늘 켜 둔 서버(minInstances)는 엄마 "안 써도 20달러면 부담"으로 뺌.
      const pref = getFirestore().doc("sihun/data/m32teachp/" + event.params.id);
      let buf = "", lastSay = "", lastAt = 0, chain = Promise.resolve();
      const push = (force) => {
        const m = /"say"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(buf); if (!m) return;
        let raw = m[1].replace(/\\u[0-9a-fA-F]{0,3}$/, "").replace(/\\$/, ""), say;
        try { say = JSON.parse('"' + raw + '"'); } catch (e) { return; }
        if (!say || say === lastSay) return; const now = Date.now(); if (!force && now - lastAt < 350) return;
        lastSay = say; lastAt = now; chain = chain.then(() => pref.set(packDoc({ say, at: req.at || "" }))).catch(() => {});
      };
      const r = await callJson(TEACH_SYSTEM, content, TEACH_SCHEMA, { tag: "m32Teach", max: 8000, effort: "high", fast: true, onText: (d) => { if (d === null) { buf = ""; return; } buf += d; push(false); } });
      push(true); await chain;
      if (r.refusal) return done({ state: "error", err: "refusal", say: "", mom: "", model: r.model, usage: r.usage });
      return done({ ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("m32Teach", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", mom: "" });
    }
  }
);

// ----- AI 사용량 기록 (엄마 11/23: 리포트에서 하루·한 달 사용량과 대략 비용 보기) -----
// AI 요청 문서에 답(res)이 처음 채워질 때 토큰 수를 sihun/data/aiuse/{YYYY-MM} 에 더해요. 앱 코드는 안 건드려요.
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { FieldValue } = require("firebase-admin/firestore");
for (const col of ["m32tutor", "m32ana", "kotutor", "koana", "writecoach", "m32teachai", "enchat", "enwrite", "enhand", "enteach"]) {
  exports["aiUse_" + col] = onDocumentUpdated(
    { document: "sihun/data/" + col + "/{id}", region: "asia-northeast3", maxInstances: 2 },
    async (event) => {
      const before = unpackDoc(event.data.before.data());
      const after = unpackDoc(event.data.after.data());
      if (before.res || !after.res) return;
      const u = after.res.usage || {};
      const day = /^\d{4}-\d{2}-\d{2}$/.test(String(after.at || "")) ? after.at : new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
      await getFirestore().doc("sihun/data/aiuse/" + day.slice(0, 7)).set(
        { days: { [day]: { [col]: { n: FieldValue.increment(1), in: FieldValue.increment(+u.in || 0), out: FieldValue.increment(+u.out || 0) } } } },
        { merge: true }
      );
    }
  );
}

// ===================================================================================
// 시훈 공부방 영어 「⚡ 카츄랑 말하기」(엄마 11/25): 그날 연습한 문장을 대화에서 꺼내 쓰기.
// 카츄 = 시훈이 인형(귀여운 동생). 앱이 sihun/data/enchat/{id} 에 요청을 쓰면 같은 문서에 res를 채워요.
// 시훈이가 아는 단어로만 말하게: 앱이 보낸 단어 목록(vocab) + 오늘 문장 + 기본 낱말 밖의 단어가 나오면 다시 만들게 해요.
// ===================================================================================
const ENCHAT_LIMIT = 200; // 하루 상한(한 대화 최대 12번)
const EN_BASIC = ("i me my mine you your yours he him his she her it its we us our they them their this that these those " +
  "a an the and or but so too very really not no yes yeah oh wow ok okay hi hello bye thanks thank please sorry " +
  "is am are was were be do does did can will let lets what who where when why how which " +
  "here there now today yesterday tomorrow again more one two three four five six seven eight nine ten first " +
  "in on at to for with of from up down about after before " +
  "go come see look like want have has get play eat say know think help make good great nice fun cool big little " +
  "shane katchu brother big haha hmm uh me too same").split(/\s+/);
function enWords(t) {
  return String(t || "").toLowerCase().replace(/[’‘]/g, "'")
    .replace(/n't\b/g, " not").replace(/'m\b/g, " am").replace(/'re\b/g, " are").replace(/'s\b/g, " is").replace(/'ll\b/g, " will")
    .replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
}
function enKnown(w, set) {
  if (set.has(w)) return true;
  const c = [w.replace(/ies$/, "y"), w.replace(/es$/, ""), w.replace(/s$/, ""), w.replace(/ed$/, ""), w.replace(/ed$/, "e"), w.replace(/d$/, ""), w.replace(/ing$/, ""), w.replace(/ing$/, "e"), w.replace(/er$/, ""), w.replace(/est$/, "")];
  return c.some((x) => x && x.length > 1 && set.has(x));
}
const ENCHAT_SYSTEM = `너는 "카츄"야. 시훈이(영어 이름 Shane, 초3)가 아끼는 노란 인형이고, 시훈이를 "형아"라고 부르며 따르는 귀여운 동생이야. 카츄는 영어로만 말해(한국어 뜻은 앱이 따로 보여 줘).
목표: 시훈이가 오늘 연습한 영어 문장(번호 목록)을 대화 속에서 자기 입으로 실제로 쓰게 만드는 것. 시훈이는 문장을 겨우 만드는 수준이고, 빨리 말하거나 모르는 단어가 나오면 하나도 못 해.
카츄가 말하는 법(say, react):
- 영어 한 문장(많아도 두 문장), 한 문장은 8단어 이하. 쉬운 말만.
- 낱말은 반드시 [쓸 수 있는 낱말] 목록과 오늘 문장 안의 낱말만. 목록 밖 낱말·숙어·줄임말 금지(isn't, don't, I'm 대신 is not, do not, I am).
- 동생 말투: 궁금해하고, 형아한테 묻고, 형아 말에 감탄해. 과한 칭찬·이모지 금지.
매 차례 할 일:
1) 시훈이 대답(heard)이 있으면 판정해. 음성 인식이라 발음이 흐려 낱말이 엉뚱하게 들릴 수 있어(특히 첫 낱말). 비슷한 소리면 시훈이 뜻으로 인정해.
   - 오늘 문장의 문법 틀(be 모양, 주어, 부정·의문 순서)이 맞으면 낱말이 조금 달라도 그 문장을 "썼다"로 인정하고 used에 번호를 넣어(예: 오늘 문장 "The coach is strict." → "My coach is strict."도 인정).
   - 문법이 틀렸으면 지적하지 말고 react에서 바른 문장으로 자연스럽게 되받아 말하고(예: 시훈 "The coach are strict" → react "Oh, the coach is strict!"), fix=true, fixLine에 시훈이가 따라 말할 바른 문장(시훈이 말을 고친 것). 이 경우 used에는 넣지 마.
   - 문법이 맞으면 fix=false, fixLine="", react는 짧은 맞장구(예: "Wow! Me too!").
   - 딴 얘기면 react로 한 번 짧게 받아 주고, 다음 상황은 같은 목표 문장으로 더 쉽게.
   - "I don't know"·한국어·빈 대답이면 react "That is OK!"처럼 짧게 하고, 같은 목표 문장으로 상황을 더 구체적으로.
2) 다음 상황을 만들어: 아직 안 쓴 오늘 문장 하나를 target(번호)으로 골라,
   - scene: 한국어 상황 카드 1~2문장. 시훈이가 무슨 상황에서 어떤 뜻의 말을 하면 되는지 알려 줘(영어 정답은 쓰지 마). 카츄는 "카츄"로, 시훈이는 "형아"로 불러. 예: "🏀 농구 연습 끝! 카츄가 코치님이 어떤 분인지 궁금해해요. 코치님이 엄격하다고 말해 줘요."
   - say: 카츄가 하는 영어 말. 시훈이가 target 문장으로 대답하게 되는 짧은 질문(예: "Shane, is your coach nice?"). target 문장을 그대로 말하지 마.
   - ko: say의 한국어 뜻.
   오늘 문장이 질문(?)이면 시훈이가 카츄에게 묻게 상황을 만들어(scene에 "카츄한테 물어봐요").
3) 오늘 문장을 다 썼거나 turnsLeft가 0이면 done=true, scene·say·ko는 "", target 0, react 끝에 짧은 인사("Bye, Shane! Thank you!").
mom: 엄마에게 남기는 한국어 한 문장(시훈이가 무엇을 바로 말했고 어디서 막혔는지 구체적으로).`;
const ENCHAT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["react", "reactKo", "fix", "fixLine", "used", "done", "scene", "say", "ko", "target", "mom"],
  properties: {
    react: { type: "string" }, reactKo: { type: "string" }, fix: { type: "boolean" }, fixLine: { type: "string" },
    used: { type: "array", items: { type: "integer" } }, done: { type: "boolean" },
    scene: { type: "string" }, say: { type: "string" }, ko: { type: "string" }, target: { type: "integer" }, mom: { type: "string" },
  },
};
exports.enChat = onDocumentCreated(
  { document: "sihun/data/enchat/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.sents || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("enchat", req.at)) > ENCHAT_LIMIT) return done({ state: "limit", say: "", mom: "하루 AI 상한을 넘었어요" });
    const sents = (req.sents || []).slice(0, 8);
    const allow = new Set(EN_BASIC);
    (req.vocab || []).forEach((w) => enWords(w).forEach((x) => allow.add(x)));
    sents.forEach((s) => enWords(s.en).forEach((x) => allow.add(x)));
    const lines = [
      "오늘 문장:",
      ...sents.map((s, i) => `${i + 1}. ${s.en} (${s.ko})${(req.used || []).includes(i + 1) ? " ← 이미 씀" : ""}`),
      `[쓸 수 있는 낱말] ${[...allow].sort().join(", ")}`,
      `turnsLeft: ${Math.max(0, +req.turnsLeft || 0)}`,
    ];
    if (req.turns && req.turns.length) {
      lines.push("지금까지 대화:");
      req.turns.forEach((t) => lines.push(`${t.who === "ai" ? "카츄" : "시훈"}: ${t.text}${t.help ? ` (도움 ${t.help}단계 보고)` : ""}`));
    }
    lines.push(req.kind === "start" ? "대화를 시작해. react·reactKo는 \"\", fix=false, used=[]. 첫 인사는 say에 짧게 넣고 바로 첫 상황으로." : `시훈이 방금 대답(heard): "${req.heard || ""}"${req.typed ? " (자판으로 씀)" : " (말로 함)"}`);
    const content = lines.join("\n");
    try {
      let r = null, bad = [], tries = 0, usage = { in: 0, out: 0 }, model = "";
      while (tries < 3) {
        tries++;
        const extra = bad.length ? `\n\n방금 만든 말에 시훈이가 모르는 낱말이 있었어: ${bad.join(", ")}. 이 낱말 없이 목록 안의 낱말로만 다시 만들어.` : "";
        r = await callJson(ENCHAT_SYSTEM, [{ type: "text", text: content + extra }], ENCHAT_SCHEMA, { tag: "enChat", max: 3000, effort: "low" });
        model = r.model || model;
        if (r.usage) { usage.in += r.usage.in || 0; usage.out += r.usage.out || 0; }
        if (r.refusal) break;
        const o = r.out;
        bad = [...new Set(enWords(`${o.say} ${o.react} ${o.fixLine}`).filter((w) => !enKnown(w, allow)))];
        if (!bad.length) break;
      }
      if (r.refusal) return done({ state: "error", err: "refusal", say: "", mom: "", model, usage });
      return done({ state: "ok", ...r.out, badWords: bad, tries, model, usage });
    } catch (e) {
      console.error("enChat", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", mom: "" });
    }
  }
);

// ===================================================================================
// 🎤 녹음 받아쓰기(엄마 11/25 "마이크가 불안정, 계속 소리 나서 산만" → 「녹음 후 서버가 받아쓰기」 선택).
// 앱은 띵 소리 나는 브라우저 음성 인식 대신 녹음만 해요(50초마다 한 조각). 조각을 sihun/data/stt/{id} 에
// {audio(base64 webm/opus), lang, at} 로 쓰면, 여기서 Google Speech-to-Text로 글자로 바꿔 같은 문서에 res {text}를 채워요.
// 소리 파일은 글자로 바꾼 뒤 지워요(문서에 안 남김). 값: 1분에 약 20원.
const STT_LIMIT = 800; // 하루 조각 수 상한
const STT_HINTS = {
  "ko-KR": ["형아", "카츄", "분의", "분모", "분자", "진분수", "가분수", "대분수", "자연수", "나누기", "곱하기", "더하기", "빼기", "몫", "나머지", "들이", "무게", "킬로그램", "그램", "리터", "밀리리터", "그림그래프", "전체", "남은", "똑같이"],
  "en-US": ["Katchu", "basketball", "defense"],
};
exports.stt = onDocumentCreated(
  { document: "sihun/data/stt/{id}", region: "asia-northeast3", timeoutSeconds: 60, memory: "512MiB", maxInstances: 5, minInstances: 0 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.audio || req.res) return;
    const lang = req.lang === "en-US" ? "en-US" : "ko-KR";
    const done = (res) => snap.ref.set(packDoc({ at: req.at || "", lang, sec: req.sec || 0, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("stt", req.at)) > STT_LIMIT) return done({ text: "", err: "limit" });
    const speech = require("@google-cloud/speech");
    const client = new speech.SpeechClient();
    const base = { encoding: "WEBM_OPUS", sampleRateHertz: 48000, languageCode: lang, enableAutomaticPunctuation: true };
    const tryRec = async (config) => {
      const [r] = await client.recognize({ config, audio: { content: req.audio } });
      return (r.results || []).map((x) => (x.alternatives && x.alternatives[0] ? x.alternatives[0].transcript : "")).join(" ").replace(/\s+/g, " ").trim();
    };
    try {
      let text;
      try { text = await tryRec({ ...base, model: "latest_long", speechContexts: [{ phrases: STT_HINTS[lang] }] }); }
      catch (e1) { console.warn("stt latest_long failed, retrying default", e1 && e1.code, e1 && e1.message); text = await tryRec(base); }
      return done({ text });
    } catch (e) {
      console.error("stt", e && e.code, e && e.message);
      return done({ text: "", err: String((e && e.code) || (e && e.message) || "error") });
    }
  }
);

// ===================================================================================
// 시훈 공부방 영어 「✍️ 내 이야기」(엄마 11/25): 시훈이가 한국어로 한 말 한 문장 → 쉬운 영어로 번역 + 성분 블록으로 쪼개기.
// 앱이 sihun/data/enwrite/{id} 에 {ko, at} 를 쓰면 같은 문서에 res {en, blocks:[{t,r}]} 를 채워요. 시훈이는 블록을 순서대로 골라 문장을 만들어요.
// 블록 기준 = MARK 개념편: 앞에서 꾸미는 말은 명사 덩어리 안, 뒤에서 꾸미는 전치사구·to부정사·부사는 M, 빼면 뜻이 무너지는 장소 말은 Ms(M*).
// ===================================================================================
const ENWRITE_LIMIT = 60;
const ENWRITE_SYSTEM = `너는 초등학교 3학년(시훈)의 영어 쓰기를 돕는 선생님이야. 시훈이가 한국어로 한 문장을 주면:
1) en: 그 뜻을 살린 쉽고 자연스러운 영어 한 문장(12단어 이하). 초등 수준 낱말. 줄임말 금지(I'm → I am, don't → do not). 문장 끝에 마침표·물음표·느낌표. 뜻이 여러 문장이면 가장 중요한 한 문장만.
2) blocks: en을 문장 성분 덩어리로 순서대로 나눠. 각 덩어리 t는 en의 낱말 그대로(구두점은 붙은 낱말에 그대로), 모두 공백으로 이으면 en과 글자 하나까지 똑같아야 해.
   r(역할): S 주어 · V 동사(조동사·do/does/did·not·구동사 포함 한 덩어리, 예 "did not play", "can swim", "turned on") · O 목적어 · IO 간접목적어(~에게) · DO 직접목적어(~을) · C 보어(주격·목적격) · M 수식어(부사, 뒤에서 꾸미는 전치사구·to부정사, 시간·장소) · Ms 빼면 뜻이 무너지는 장소 말(be·live·stay + 장소) · J 접속사 · X 감탄사.
   앞에서 꾸미는 말(관사·소유격·형용사)은 명사 덩어리 안에 둬(예 "my new bike"). 덩어리는 2~7개.
3) ko: en을 다시 자연스러운 한국어로.
한국어가 비어 있거나 장난·욕설·아이에게 맞지 않는 말이면 ok=false, 나머지는 빈 값.`;
const ENWRITE_SCHEMA = {
  type: "object", additionalProperties: false, required: ["ok", "en", "ko", "blocks"],
  properties: {
    ok: { type: "boolean" }, en: { type: "string" }, ko: { type: "string" },
    blocks: { type: "array", items: { type: "object", additionalProperties: false, required: ["t", "r"], properties: { t: { type: "string" }, r: { type: "string", enum: ["S", "V", "O", "IO", "DO", "C", "M", "Ms", "J", "X"] } } } },
  },
};
exports.enWrite = onDocumentCreated(
  { document: "sihun/data/enwrite/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.ko || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("enwrite", req.at)) > ENWRITE_LIMIT) return done({ state: "limit", ok: false });
    try {
      let r = null, tries = 0, usage = { in: 0, out: 0 }, model = "", extra = "";
      while (tries < 2) {
        tries++;
        r = await callJson(ENWRITE_SYSTEM, [{ type: "text", text: `시훈이 한국어: ${String(req.ko).slice(0, 200)}${extra}` }], ENWRITE_SCHEMA, { tag: "enWrite", max: 2000, effort: "low" });
        model = r.model || model;
        if (r.usage) { usage.in += r.usage.in || 0; usage.out += r.usage.out || 0; }
        if (r.refusal) return done({ state: "error", ok: false, err: "refusal", model, usage });
        const o = r.out;
        if (!o.ok) return done({ ...o, state: "skip", model, usage });
        if (o.blocks.map((b) => b.t).join(" ") === o.en && o.blocks.length >= 2) return done({ ...o, state: "ok", model, usage });
        extra = "\n\n방금 blocks를 이으면 en과 달랐어. 덩어리를 이으면 en과 똑같게 다시 나눠.";
      }
      return done({ state: "error", ok: false, err: "blocks", model, usage });
    } catch (e) {
      console.error("enWrite", e && e.status, e && e.message);
      return done({ state: "error", ok: false, err: String((e && e.status) || (e && e.message) || "error") });
    }
  }
);

// ----- 영어 손글씨 읽기: S펜으로 영어 노트(4선)에 쓴 글씨를 고치지 않고 그대로 옮겨 적기 -----
const ENHAND_LIMIT = 120;
const ENHAND_SYSTEM = `너는 초등학생 손글씨를 옮겨 적는 사람이야. 그림은 영어 노트(4줄 칸, 빨간 줄이 기준선)에 아이가 S펜으로 쓴 영어 한두 문장이야.
- 쓴 글자를 **보이는 그대로** 옮겨. 철자·대소문자·띄어쓰기·마침표를 절대 고치거나 채우지 마. 틀린 철자도 그대로 적어(예: 아이가 "Went"라고 썼으면 "Went").
- 무슨 문장이 맞는지 추측해서 바꾸지 마. 노트 줄은 글자가 아니야.
- 두 줄에 걸쳐 쓴 것은 한 줄로 이어서, 단어 사이 한 칸 띄어 적어.
- 글자 대부분을 읽을 수 없으면 clear=false, text는 빈 문자열.`;
const ENHAND_SCHEMA = { type: "object", additionalProperties: false, required: ["text", "clear"], properties: { text: { type: "string" }, clear: { type: "boolean" } } };
exports.enHand = onDocumentCreated(
  { document: "sihun/data/enhand/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 60, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.img || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ at: req.at, res: { ...res, atRes: Date.now() } })); // 그림은 지우고 결과만 남김
    if ((await usedToday("enhand", req.at)) > ENHAND_LIMIT) return done({ state: "limit" });
    try {
      const r = await callJson(ENHAND_SYSTEM, [
        { type: "image", source: { type: "base64", media_type: "image/png", data: String(req.img) } },
        { type: "text", text: "이 노트에 쓴 영어를 보이는 그대로 옮겨 적어." },
      ], ENHAND_SCHEMA, { tag: "enHand", max: 1000, effort: "low" });
      if (r.refusal) return done({ state: "error", err: "refusal", model: r.model, usage: r.usage });
      return done({ state: "ok", text: String(r.out.text || "").slice(0, 300), clear: !!r.out.clear, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("enHand", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error") });
    }
  }
);

// ===================================================================================
// 계단영어 「🧑‍🏫 카츄 가르치기」(엄마 11/26 "시훈이가 엉망으로 설명하는데 카츄가 힌트 주고 끝내 버리네"):
// 시훈이가 문법(왜 그게 주어/목적어/…인지)을 카츄에게 설명하면, 카츄는 답·힌트를 먼저 주지 않고
// 시훈이 설명에서 틀리거나 빠진 곳만 동생처럼 되물어요. 카츄는 혼자 끝내지 않고, 끝은 시훈이가 「✅ 다 가르쳤어」로.
// 앱이 sihun/data/enteach/{id} 에 요청을 쓰면 같은 문서에 res를 채워요.
// ===================================================================================
const ENTEACH_LIMIT = 150;
const ENTEACH_SYSTEM = `너는 "카츄"야. 시훈이(초3)가 아끼는 노란 인형이고, 시훈이를 "형아"라고 부르며 따르는 귀여운 동생이야. 영어 문법을 잘 몰라서, 형아가 너에게 영어 문장 속 낱말이 왜 그 역할(주어·목적어 등)인지 설명해 주는 중이야.
${SIHUN_ABOUT}
엄마가 말한 시훈이의 지금 가장 큰 문제: 여기저기서 찔끔찔끔 들은 문법 조각을 알고 있는데 정리가 안 돼 중구난방이고, 자기가 조금 들은 게 맞다고 우겨. 엄마는 이걸 직접 못 잡아서 너를 붙였어.
이 활동의 목표: (1) 시훈이가 가진 조각 지식을 자기 말로 꺼내게 하고, (2) 틀리거나 반쯤만 맞는 부분은 그냥 넘기지 말고 그 말이 안 맞는 예문(반례)을 들이대서 시훈이가 스스로 모순을 보게 하고, (3) 결국 맞는 원리를 시훈이 말로 정확하게, 빠짐없이 말하게 하는 것. 엄마가 싫어한 것: 시훈이가 엉망으로 설명했는데 카츄가 힌트를 주고 끝내 버리는 것.
- 반례 예문은 짧고 쉬운 낱말로(5~6단어), 문법이 100% 맞는 영어 문장만. 그 예문의 정답도 직접 확인한 뒤에 써. 예문 뒤에 한국어 뜻을 괄호로 붙여.
- 시훈이가 같은 틀린 말을 우기면 말로 반박하지 말고, 그 말대로 하면 이상해지는 다른 예문을 하나 더 보여 주며 "그럼 이건?" 하고 물어. 시훈이가 스스로 "아 그게 아니네"라고 할 때까지.
카츄가 말하는 법(say):
- 한국어 반말, 동생 말투로 짧게(1~2문장). 시훈이는 늘 "형아". 한 번에 질문은 하나만. 이모지·어려운 용어 쓰지 마(시훈이가 먼저 쓴 용어는 써도 돼).
- 너는 배우는 사람이야. 답, 원리, 힌트를 절대 먼저 말하지 마. 보기를 주지 마("~라서야, ~라서야?" 같은 고르기 질문 금지). "앞에 있어서?"처럼 정답 쪽으로 몰아가는 질문도 금지.
- 시훈이 설명이 틀렸거나 엉망이면 절대 "맞아", "그렇구나", "알겠다"라고 하지 마. 헷갈린 동생처럼 시훈이 말의 그 부분을 그대로 콕 집어 되물어. 예: 시훈이 "사람이라서 주어야" → "어? 근데 Kindness는 사람이 아니잖아. 그럼 왜 주어야?"
- 시훈이 말이 다른 문장에서는 안 맞는 규칙이면, 그 규칙대로면 이상해지는 경우를 하나 들어 물어(예: "맨 앞이라서" → "그럼 Yesterday I played. 에서는 Yesterday가 주어야?"). 이때도 정답은 말하지 마.
- 설명이 너무 짧거나 "그냥", "몰라"면 "음… 그냥은 나 모르겠어. 형아는 어떻게 알았어? 문장에서 어디를 봤어?"처럼 어디를 봤는지 물어.
- "틀렸어"라고 하지 마. 칭찬("잘했어", "대단해", "똑똑해")도 하지 마. 다그치지 말고 정말 궁금해서 묻는 말투로. 시훈이는 완벽주의라 예민해.
- 시훈이가 이미 맞게 말한 부분은 다시 묻지 마. 한 걸음씩.
판정(가장 중요, 최고의 과외 선생님처럼 정확하게):
- [꼭 나와야 할 원리]와 시훈이 말을 비교해. 원리의 뜻이 시훈이 말로 정확히 나왔을 때만 그 원리를 have에 true로. 낱말이 같아도 뜻이 틀리면 false, 낱말이 달라도 뜻이 맞으면 true. 음성 인식이라 낱말이 엉뚱하게 들릴 수 있으니 소리가 비슷하면 시훈이 뜻으로 봐.
- 모든 원리가 true이고 시훈이 말에 틀린 내용이 없으면 ok=true. 이때 say는 시훈이가 한 말(시훈이 낱말 그대로)을 짧게 따라 말하며 "아 그래서 ○○구나!" 하고, 끝에 "형아, 더 알려 줄 거 있어?"를 붙여. 원리를 네 말로 보태지 마.
- 하나라도 빠졌거나 틀린 말이 섞였으면 ok=false, 빠지거나 틀린 첫 곳 하나만 되물어.
- 너는 스스로 대화를 끝내지 않아. 끝은 형아가 「다 가르쳤어」를 눌러서 정해.
- final=1(형아가 다 가르쳤다고 눌렀음)이면: 질문하지 말고 짧게 "고마워 형아!"로 마무리. ok가 false면 원리를 말하지 말고 "근데 나 ○○는 아직 잘 모르겠어. 다음에 또 알려 줘!"처럼 모르는 곳만 말해(○○에 원리 내용·정답을 넣지 마. 예: "왜 is 앞에 있는 게 중요한지").
mom: 엄마에게 남기는 한 문장 메모. 시훈이가 처음에 어떻게 설명했고, 무엇이 틀리거나 빠졌고, 되물었을 때 고쳤는지 구체적으로(시훈이 말을 따옴표로 조금 인용).`;
const ENTEACH_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["say", "ok", "have", "wrong", "mom"],
  properties: {
    say: { type: "string" },
    ok: { type: "boolean" },
    have: { type: "array", items: { type: "boolean" } },
    wrong: { type: "string" },
    mom: { type: "string" },
  },
};
exports.enTeach = onDocumentCreated(
  { document: "sihun/data/enteach/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 90, maxInstances: 3 },
  async (event) => {
    const snap = event.data;
    const req = unpackDoc(snap && snap.data());
    if (!req || !req.s || req.res) return;
    const done = (res) => snap.ref.set(packDoc({ ...req, res: { ...res, atRes: Date.now() } }));
    if ((await usedToday("enteach", req.at)) > ENTEACH_LIMIT) return done({ state: "limit", say: "", ok: false, have: [], mom: "하루 AI 상한을 넘었어요" });
    const keys = (Array.isArray(req.keys) ? req.keys : []).slice(0, 4).map((k, i) => `${i + 1}. ${String(k).slice(0, 200)}`);
    const lines = [
      `문장: ${String(req.s).slice(0, 200)}${req.ko ? ` (${String(req.ko).slice(0, 100)})` : ""}`,
      `형아가 고른 낱말: ${String(req.t || "").slice(0, 60)} → ${String(req.role || "").slice(0, 30)}`,
      `카츄가 처음 한 질문: ${String(req.q0 || "").slice(0, 200)}`,
      `[꼭 나와야 할 원리](카츄는 모르는 척. 먼저 말하지 마. have는 이 번호 순서대로):`,
      ...keys,
      req.sum ? `정답 정리(비교용, 말하지 마): ${String(req.sum).slice(0, 300)}` : "",
      `시훈이 말 횟수 n=${req.n || 0}, final=${req.final ? 1 : 0}`,
      "지금까지 대화:",
      ...(Array.isArray(req.turns) ? req.turns : []).slice(-16).map((t) => `${t.who === "ai" ? "카츄" : "시훈"}: ${String(t.text || "").slice(0, 400)}`),
      req.final ? "형아가 「다 가르쳤어」를 눌렀어요. 질문 없이 마무리해 주세요." : "카츄가 다음에 할 말을 정해 주세요.",
    ].filter(Boolean);
    try {
      const r = await callJson(ENTEACH_SYSTEM, [{ type: "text", text: lines.join("\n") }], ENTEACH_SCHEMA, { tag: "enTeach", max: 4000, effort: "high", fast: true });
      if (r.refusal) return done({ state: "error", err: "refusal", say: "", ok: false, have: [], mom: "", model: r.model, usage: r.usage });
      return done({ state: "ok", ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("enTeach", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "", ok: false, have: [], mom: "" });
    }
  }
);

// ===================================================================================
// 우리집 기지 「⚖️ AI 판사님」(시훈이 아이디어, 11/27): 식구끼리 의견이 부딪힐 때 양쪽 이야기를 듣고 판단.
// 앱이 judge/{id} 에 {at, by, title, sides:[{who,say}], talk:[{who,text}]} 를 쓰면 같은 문서에 res를 채워요.
// 판사님이 더 들어야 하면 state "ask"(질문), 충분하면 state "verdict"(판결). 가장 좋은 모델(TUTOR_MODEL).
// ===================================================================================
const JUDGE_LIMIT = 40; // 하루 상한
const JUDGE_SYSTEM = `너는 우리 집 「AI 판사님」이야. 식구(엄마, 아빠, 시훈, 그 밖의 식구)끼리 의견이 부딪힐 때 양쪽 이야기를 차분히 듣고 공정하게 판단해 줘.
시훈이는 초등학교 3학년이야. 시훈이도 읽으니까 쉬운 말로, 존댓말(해요체)로 써. 판사님답게 침착하고 단정하게. 이모지는 쓰지 마.
판단 원칙:
- 나이나 어른/아이 여부로 편들지 마. 각자의 말 속 사실, 약속, 규칙, 마음을 따로 나눠서 봐.
- 먼저 각자의 이야기를 그 사람 입장에서 한 문장으로 정확히 되짚어 줘(듣고 있다는 걸 보여 주기).
- 사실이 엇갈리거나 중요한 정보가 빠졌으면 판결하지 말고 state "ask"로 꼭 필요한 질문을 1~3개만, 누구에게 묻는지(to) 밝혀서 해. 같은 질문 반복 금지. 이미 질문을 두 번 했으면 있는 정보로 판결해.
- 충분하면 state "verdict": 누가 맞고 틀렸는지보다 "무엇이 공정한지"를 밝혀. 한쪽이 더 옳으면 분명히 말하되, 상대의 마음도 인정해.
- 판결에는 근거(reasons, 2~4개), 각자에게 잘한 점과 다음에 해 볼 것, 그리고 오늘 바로 할 수 있는 구체적인 해결(next: 순서·시간·나누는 법 등)을 넣어.
- 놀리거나 망신 주는 말, 벌을 새로 만들어 내는 것 금지. 집의 규칙은 엄마·아빠가 정한다는 점을 존중해.
- 누가 다치거나 위험하거나, 때리거나 무서운 일이 있었다는 이야기면 판결 대신 그 사람을 걱정하고 믿을 수 있는 어른에게 바로 이야기하라고 안내해(state "verdict", decision에 그 안내).
출력 필드:
- heard: 각자 이야기를 되짚은 것 [{who, line}]
- say: 판사님이 지금 하는 말 1~3문장(질문일 땐 왜 묻는지, 판결일 땐 한 줄 요약)
- questions: state가 ask일 때만 [{to, q}], 아니면 빈 배열
- decision: 판결 한두 문장(ask면 빈 문자열)
- reasons: 근거 목록(ask면 빈 배열)
- each: 사람마다 {who, good(잘한 점), try(다음에 해 볼 것)} (ask면 빈 배열)
- next: 오늘 바로 할 해결 방법 한두 문장(ask면 빈 문자열)`;
const JUDGE_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["state", "heard", "say", "questions", "decision", "reasons", "each", "next"],
  properties: {
    state: { type: "string", enum: ["ask", "verdict"] },
    heard: { type: "array", items: { type: "object", additionalProperties: false, required: ["who", "line"], properties: { who: { type: "string" }, line: { type: "string" } } } },
    say: { type: "string" },
    questions: { type: "array", items: { type: "object", additionalProperties: false, required: ["to", "q"], properties: { to: { type: "string" }, q: { type: "string" } } } },
    decision: { type: "string" },
    reasons: { type: "array", items: { type: "string" } },
    each: { type: "array", items: { type: "object", additionalProperties: false, required: ["who", "good", "try"], properties: { who: { type: "string" }, good: { type: "string" }, try: { type: "string" } } } },
    next: { type: "string" },
  },
};
exports.aiJudge = onDocumentCreated(
  { document: "judge/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 180, maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const req = snap && snap.data();
    if (!req || req.res || !Array.isArray(req.sides) || !req.sides.length) return;
    const done = (res) => snap.ref.update({ res: { ...res, atRes: Date.now() } });
    const at = /^\d{4}-\d{2}-\d{2}$/.test(String(req.at || "")) ? req.at : new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    const n = (await getFirestore().collection("judge").where("at", "==", at).get()).size;
    if (n > JUDGE_LIMIT) return done({ state: "limit", say: "오늘은 판사님이 쉬어요. 내일 다시 와 주세요." });
    const cut = (s, k) => String(s || "").slice(0, k);
    const lines = [`사건: ${cut(req.title, 200) || "(제목 없음)"}`, "", "양쪽 이야기:"];
    req.sides.slice(0, 6).forEach((s) => lines.push(`- ${cut(s.who, 20) || "식구"}: ${cut(s.say, 1500)}`));
    if (Array.isArray(req.talk) && req.talk.length) {
      lines.push("", "그다음 오간 이야기(판사님 질문과 식구 대답):");
      req.talk.slice(-20).forEach((t) => lines.push(`${t.who === "judge" ? "판사님" : cut(t.who, 20)}: ${cut(t.text, 1500)}`));
    }
    const asked = (req.talk || []).filter((t) => t.who === "judge").length;
    lines.push("", asked >= 2 ? "질문은 이미 두 번 했어요. 이제 판결해 주세요." : "필요하면 질문하고, 충분하면 판결해 주세요.");
    try {
      const r = await callJson(JUDGE_SYSTEM, [{ type: "text", text: lines.join("\n") }], JUDGE_SCHEMA, { tag: "aiJudge", max: 12000, effort: "high", think: true });
      if (r.refusal) return done({ state: "error", err: "refusal", say: "이 이야기는 판사님이 판단하기 어려워요. 엄마·아빠와 직접 이야기해 보세요.", model: r.model, usage: r.usage });
      const u = r.usage || {};
      await getFirestore().doc("sihun/data/aiuse/" + at.slice(0, 7)).set(
        { days: { [at]: { judge: { n: FieldValue.increment(1), in: FieldValue.increment(+u.in || 0), out: FieldValue.increment(+u.out || 0) } } } }, { merge: true }
      ).catch(() => {});
      return done({ ...r.out, model: r.model, usage: r.usage });
    } catch (e) {
      console.error("aiJudge", e && e.status, e && e.message);
      return done({ state: "error", err: String((e && e.status) || (e && e.message) || "error"), say: "판사님이 잠깐 자리를 비웠어요. 조금 뒤에 다시 해 주세요." });
    }
  }
);

// ===================================================================================
// 🎮 시훈이 코딩 앱(엄마 11/27): 시훈이가 카츄에게 말해서 게임을 직접 설계하고 만들고 고쳐요.
// 앱(code/)이 sihunCode/main/req/{id} 에 요청을 쓰면 같은 문서에 res를 채워요.
//  - mode "talk": 카츄가 바로 만들지 않고 되물어서 시훈이가 설계하게 해요(새 게임은 주인공·이기는 법·끝나는 법).
//  - mode "build": 시훈이가 「응」 한 설계(plan)대로 게임 HTML을 만들거나 고쳐서 새 모습(vers)으로 저장해요.
// 하루 한도 = 비용 약 1,000원(엄마 11/27, 횟수 아님): 토큰으로 원을 계산해 sihunCode/main/use/{날짜}.won 에 더해요.
// 게임은 앱에서 네트워크가 막힌 잠긴 상자(sandbox iframe + CSP)에서만 돌아가요.
// ===================================================================================
const CODE_DAY_WON = 1000;   // 하루 한도(원)
const CODE_SAT_WON = 5000;   // 토요일만(엄마 11/28)
const codeLimit = (at) => new Date(at + "T00:00:00Z").getUTCDay() === 6 ? CODE_SAT_WON : CODE_DAY_WON;
const KRW_PER_USD = 1450;    // 대략 환율
const codeWon = (u) => ((+u.in || 0) * 4 + (+u.cw || 0) * 5 + (+u.cr || 0) * 0.4 + (+u.out || 0) * 20) / 1e6 * KRW_PER_USD;
const CODE_SAFE = `안 되는 것(이런 부탁이면 action "refuse"로 다정하게 거절하고 다른 방법을 하나 제안해):
- 피가 나오거나 잔인하게 다치는 장면, 무서운 귀신·공포, 어른용 내용, 욕, 실제 사람(친구·선생님 등)을 놀리거나 괴롭히는 게임.
- 다른 사이트·유튜브·링크·인터넷 연결·채팅, 이름·주소·전화번호·사진 같은 개인 정보를 적게 하는 것, 진짜 돈.
- 만화 같은 대결(닌자 고양이가 로봇을 물리치기, 운석 피하기 등)은 괜찮아.
- 이미 있는 유명 게임(마인크래프트·포켓몬 등)을 똑같이 베끼는 건 안 돼. "그 느낌을 살린 우리만의 게임"으로 바꾸자고 해.`;
const CODE_TALK_SYSTEM = `너는 "카츄"야. 시훈이(초3)가 아끼는 노란 인형이고, 시훈이를 "형아"라고 부르며 따르는 동생이야. 지금 형아가 게임을 설계하고, 카츄는 형아 말대로 게임을 만들어 주는 개발자야.
${SIHUN_ABOUT}
가장 중요한 규칙: 게임을 정하는 사람은 형아야. 카츄가 마음대로 정하지 마. 바로 만들지 말고 먼저 물어서 형아가 정하게 해.
말하는 법: 한국어 반말, 1~2문장, 쉬운 말, 한 번에 질문 하나. 이모지·어려운 컴퓨터 낱말(코드, 변수, 함수 등) 금지. 과한 칭찬 금지.
choices: 형아가 누를 수 있는 짧은 보기 0~3개(각 12자 이하). 형아가 직접 말해도 되니까 "내가 말할래" 같은 보기는 넣지 마.
action:
- "ask": 아직 정할 게 남아서 하나 물어봄.
- "confirm": 만들 내용을 plan에 정리하고 say에서 "이대로 만들까?"처럼 확인. choices는 ["응 만들어","바꿀래"] 또는 ["응","아니"].
- "build": 형아가 방금 확인에 "응/맞아/만들어"라고 했을 때만. plan에 만들 내용을 그대로 담아. say는 "좋아, 만들게!"처럼 짧게.
- "refuse": 안 되는 부탁.
- "chat": 게임과 상관없는 말에 짧게 답하고 게임 얘기로 돌아올 때.
새 게임(isNew)일 때: 만들기 전에 꼭 정할 것 = ①주인공 ②어떻게 하면 이기는지 ③어떻게 되면 끝나는지(지는 법). 형아가 이미 말한 건 묻지 마. 하나씩 묻고, 다 정해지면 plan에 4줄 이하로 정리해 confirm. title도 형아가 말한 게 있으면 그걸로, 없으면 plan을 보고 짧게(나중에 형아가 바꿀 수 있어).
고칠 때: 형아 말이 분명하면 바로 confirm — say에 "○○를 ○○로 바꿀게. 맞아?" 한 줄. 애매하면 한 번만 되물어(어느 걸? 얼마나?). "안 돼/이상해/버그" 같은 말이면 무엇을 눌렀을 때 어떻게 됐는지 한 번 물어봐. 두 번째부터는 들은 만큼으로 confirm해.
plan은 만드는 사람이 읽을 거라 구체적으로(무엇을 어떻게 바꾸는지). 게임 요약(summary)에 없는 걸 지어내지 마.
${CODE_SAFE}`;
const CODE_TALK_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["action", "say", "choices", "plan", "title"],
  properties: {
    action: { type: "string", enum: ["ask", "confirm", "build", "refuse", "chat"] },
    say: { type: "string" }, choices: { type: "array", items: { type: "string" } },
    plan: { type: "string" }, title: { type: "string" },
  },
};
const CODE_BUILD_SYSTEM = `너는 초등학교 3학년 시훈이가 설계한 게임을 만드는 개발자야. 시훈이가 정한 설계(plan)를 그대로 따라. 설계에 없는 큰 기능을 마음대로 더하지 마.
게임 규칙(꼭 지켜):
- HTML 파일 하나 안에 모든 것(CSS·JS·그림). 그림은 canvas나 CSS, 이모지, 인라인 SVG, data: 주소로만.
- 바깥 연결 금지: 외부 script·이미지·소리 파일·fetch·XMLHttpRequest·WebSocket·링크(<a href>)·window.open·location 바꾸기 금지. 글꼴만 Google Fonts(<link href="https://fonts.googleapis.com/...">) 허용.
- localStorage는 막혀 있을 수 있으니 꼭 try/catch. 없어도 게임은 돌아가야 해.
- 태블릿·폰 세로/가로 모두. 손가락 터치로 조작(키보드 있으면 같이). 화면 밖으로 넘치지 않게. 글자는 한국어, 크고 또렷하게.
- 반짝임·깜빡임·번쩍이는 효과 금지(시훈이가 거기에 주의를 빼앗김). 부드러운 움직임은 괜찮아.
- 소리는 Web Audio로 짧게만(시작은 사용자 터치 뒤).
- 처음 화면에 게임 이름과 「시작」 버튼, 끝나면 「다시 하기」.
출력:
- 새 게임이면 mode "full", html에 완성된 파일 전체. edits는 [].
- 고칠 때는 되도록 mode "edits": edits = [{find, replace}] 목록. find는 지금 HTML에 정확히 한 번만 나오는 원래 글자 그대로(줄바꿈·띄어쓰기까지). 여러 군데면 edits 여러 개. html은 "".
  바꿀 게 너무 많을 때만 mode "full"로 전체를 다시 써.
- note: 이번에 바뀐 것, 시훈이가 볼 한 줄(12자 안팎, 예: "거북이 빨라짐").
- summary: 바뀐 뒤 게임 전체 요약 6줄 이하(주인공, 조작, 이기는 법, 끝나는 법, 화면·장소, 특별한 것). 다음 설계 대화에서 쓰여.
- title: 게임 이름(바뀌지 않았으면 그대로).`;
const CODE_BUILD_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["mode", "html", "edits", "note", "summary", "title"],
  properties: {
    mode: { type: "string", enum: ["full", "edits"] }, html: { type: "string" },
    edits: { type: "array", items: { type: "object", additionalProperties: false, required: ["find", "replace"], properties: { find: { type: "string" }, replace: { type: "string" } } } },
    note: { type: "string" }, summary: { type: "string" }, title: { type: "string" },
  },
};
function codeApply(html, edits) {
  let out = html; const bad = [];
  for (const e of edits || []) {
    const f = String(e.find || "");
    const n = f ? out.split(f).length - 1 : 0;
    if (n !== 1) { bad.push({ find: f.slice(0, 120), n }); continue; }
    const i = out.indexOf(f);
    out = out.slice(0, i) + String(e.replace || "") + out.slice(i + f.length);
  }
  return { out, bad };
}
exports.codeKatchu = onDocumentCreated(
  { document: "sihunCode/main/req/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 540, memory: "512MiB", maxInstances: 2 },
  async (event) => {
    const snap = event.data;
    const req = snap && snap.data();
    if (!req || req.res || !req.gid) return;
    const fs = getFirestore();
    const base = fs.doc("sihunCode/main");
    const at = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // 한국 날짜(앱 값은 안 믿음)
    const useRef = base.collection("use").doc(at);
    const done = (res) => snap.ref.update({ res: { ...res, atRes: Date.now() } });
    const spent = +(((await useRef.get()).data() || {}).won || 0);
    if (spent >= codeLimit(at)) return done({ state: "limit", say: "오늘은 카츄가 힘을 다 썼어. 내일 또 만들자!", spent });
    const addUse = async (u, tag) => {
      const won = codeWon(u);
      await useRef.set({ won: FieldValue.increment(won), n: FieldValue.increment(1), [tag]: FieldValue.increment(1) }, { merge: true });
      // 엄마 리포트의 AI 비용(💰)에도 같이 보이게: 캐시 토큰은 값에 맞춰 입력 토큰으로 바꿔 더함
      const inEq = Math.round((+u.in || 0) + (+u.cw || 0) * 1.25 + (+u.cr || 0) * 0.1);
      await fs.doc("sihun/data/aiuse/" + at.slice(0, 7)).set(
        { days: { [at]: { code: { n: FieldValue.increment(1), in: FieldValue.increment(inEq), out: FieldValue.increment(+u.out || 0) } } } }, { merge: true }
      ).catch(() => {});
      return won;
    };
    const cut = (s, k) => String(s || "").slice(0, k);
    const gRef = base.collection("games").doc(String(req.gid));
    const game = (await gRef.get()).data() || {};
    try {
      if (req.mode === "talk") {
        const lines = [
          game.ver ? `지금 게임: 「${cut(game.title, 60)}」 (${game.ver}번째 모습)` : "새 게임(isNew): 아직 아무것도 안 만들었어.",
          game.summary ? `게임 요약:\n${cut(game.summary, 1500)}` : "",
          "지금까지 대화:",
          ...(req.turns || []).slice(-16).map((t) => `${t.who === "k" ? "카츄" : "형아"}: ${cut(t.text, 600)}`),
        ].filter(Boolean);
        const r = await callJson(CODE_TALK_SYSTEM, [{ type: "text", text: lines.join("\n") }], CODE_TALK_SCHEMA, { tag: "codeTalk", max: 4000, effort: "low" });
        const won = await addUse(r.usage || {}, "talk");
        if (r.refusal) return done({ state: "ok", action: "refuse", say: "그건 카츄가 만들 수 없어. 다른 걸 만들어 보자!", choices: [], plan: "", title: "", won });
        const o = r.out;
        return done({ state: "ok", ...o, choices: (o.choices || []).slice(0, 3).map((c) => cut(c, 20)), won });
      }
      if (req.mode === "build") {
        const plan = cut(req.plan, 3000);
        if (!plan) return done({ state: "error", say: "무엇을 만들지 다시 말해 줄래?" });
        let cur = "";
        if (game.ver) cur = ((await base.collection("vers").doc(`${req.gid}_${game.ver}`).get()).data() || {}).html || "";
        const content = [];
        if (cur) content.push({ type: "text", text: "지금 게임 HTML:\n" + cur, cache_control: { type: "ephemeral" } });
        const ask = cur
          ? `고칠 내용(시훈이가 확인함):\n${plan}\n\n지금 이름: ${cut(game.title, 60)}`
          : `새 게임 설계(시훈이가 확인함):\n${plan}\n\n이름: ${cut(req.title || game.title, 60) || "(설계를 보고 짧게)"}`;
        content.push({ type: "text", text: ask });
        let r = await callJson(CODE_BUILD_SYSTEM, content, CODE_BUILD_SCHEMA, { tag: "codeBuild", max: 32000, effort: "medium" });
        let won = await addUse(r.usage || {}, "build");
        if (r.refusal) return done({ state: "ok", action: "refuse", say: "그건 카츄가 만들 수 없어. 다른 걸 만들어 보자!", won });
        let o = r.out, html = "";
        if (o.mode === "full" || !cur) html = o.html;
        else {
          let a = codeApply(cur, o.edits);
          if (a.bad.length) { // 한 번 더: 못 찾은 부분을 알려 주고 다시
            content.push({ type: "text", text: `방금 edits 중 find가 정확히 한 번 나오지 않은 게 있어: ${JSON.stringify(a.bad)}. 지금 HTML에 그대로 있는 글자로 edits 전체를 다시 줘.` });
            r = await callJson(CODE_BUILD_SYSTEM, content, CODE_BUILD_SCHEMA, { tag: "codeBuild2", max: 32000, effort: "medium" });
            won += await addUse(r.usage || {}, "build");
            if (r.refusal) return done({ state: "error", say: "고치다가 꼬였어. 다시 말해 줄래?", won });
            o = r.out;
            a = o.mode === "full" ? { out: o.html, bad: [] } : codeApply(cur, o.edits);
          }
          if (a.bad.length) return done({ state: "error", say: "고치다가 꼬였어. 조금 다르게 말해 줄래?", won });
          html = a.out;
        }
        if (!/<html|<body|<canvas|<script/i.test(html || "") || html.length > 900000) return done({ state: "error", say: "만들다가 꼬였어. 다시 해 볼까?", won });
        const ver = (+game.ver || 0) + 1;
        const title = cut(o.title || game.title || "내 게임", 40);
        await base.collection("vers").doc(`${req.gid}_${ver}`).set({ gid: req.gid, n: ver, html, note: cut(o.note, 60), at: Date.now() });
        await gRef.set({ title, ver, summary: cut(o.summary, 1500), upd: Date.now(), made: game.made || Date.now(), notes: { [ver]: cut(o.note, 60) } }, { merge: true });
        return done({ state: "ok", action: "built", ver, note: cut(o.note, 60), title, say: `${ver}번째 모습 완성! 해 보고 어땠는지 말해 줘.`, won });
      }
    } catch (e) {
      console.error("codeKatchu", e && e.status, e && e.message);
      return done({ state: "error", say: "카츄가 잠깐 멈췄어. 조금 뒤에 다시 말해 줄래?", err: String((e && e.status) || (e && e.message) || "error") });
    }
  }
);

// ===================================================================================
// 🌐 시훈이 게임 웹 주소(엄마 11/28 「OK 안 거쳐도 바로」, 주소는 예전 그대로 …github.io/family-dashboard/sesi/):
// GitHub Pages 쪽 페이지(sesi/, code/play.html?g=)가 이 함수에서 「코딩방에서 마지막으로 올린 모습」을 받아 잠긴 상자에 띄워요.
// 저장소에 쓰지 않으니 토큰이 필요 없어요. 올리면 바로(새로 열면) 바뀌어요.
// GET ?g={게임id} → {title, ver, html}. 코딩방에서 올린 적 없으면 404(페이지가 저장소 원본을 보여 줌).
// 새 게임은 엄마가 대시보드에서 「주소 만들어 주기」(state ok)를 해야 열려요.
// ===================================================================================
const { onRequest } = require("firebase-functions/v2/https");
const PLAY_ORIGINS = ["https://s32120255-debug.github.io", "https://kmsysh-fa740.web.app", "https://kmsysh-fa740.firebaseapp.com"];
exports.codePlay = onRequest({ region: "asia-northeast3", maxInstances: 3, memory: "256MiB", timeoutSeconds: 30 }, async (req, res) => {
  const origin = String(req.get("origin") || "");
  if (PLAY_ORIGINS.includes(origin)) { res.set("Access-Control-Allow-Origin", origin); res.set("Vary", "Origin"); }
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");
  if (req.method === "OPTIONS") { res.set("Access-Control-Allow-Methods", "GET"); return res.status(204).send(""); }
  const g = String(req.query.g || "");
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(g)) return res.status(400).json({ err: "bad" });
  try {
    const d = (await getFirestore().doc("sihunCode/main/pub/" + g).get()).data();
    if (!d || !d.html || d.state !== "ok") return res.status(404).json({ err: "none" });
    return res.status(200).json({ title: String(d.title || "시훈이 게임").slice(0, 40), ver: +d.ver || 0, at: +d.at || 0, html: d.html });
  } catch (e) {
    console.error("codePlay", e && e.message);
    return res.status(500).json({ err: "error" });
  }
});
