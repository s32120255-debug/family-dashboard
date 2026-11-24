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
  let res;
  try {
    res = await client.beta.messages.stream({ ...base, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }).finalMessage();
  } catch (e1) {
    if (!(e1 && e1.status === 400)) throw e1;
    console.warn(opts.tag, "fallback params rejected, retrying plain", e1.message);
    res = await client.messages.stream(base).finalMessage();
  }
  if (res.stop_reason === "refusal") return { refusal: true, model: res.model, usage: { in: res.usage && res.usage.input_tokens, out: res.usage && res.usage.output_tokens } };
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { out: JSON.parse(text), model: res.model, usage: { in: res.usage && res.usage.input_tokens, out: res.usage && res.usage.output_tokens } };
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

// ----- 수학 「🧑‍🏫 AI에게 가르치기」(엄마 11/24): 하루 1문제, 시훈이가 친구 콩이(AI)에게 풀이를 설명 -----
// 콩이는 헷갈려하는 3학년 친구 역할. 시훈이가 건너뛴 단계와 순서를 콕 집어 묻고, 한 번은 일부러 틀린 풀이를 보여 주고 고쳐 달라고 해요.
// 앱이 sihun/data/m32teachai/{id} 에 요청을 쓰면 여기서 같은 문서에 res를 채워요. 대화 기록은 앱이 m32teach/ 에 따로 남겨요.
const TEACH_LIMIT = 60; // 하루 호출 상한
const TEACH_SYSTEM = `너는 "콩이"야. 시훈이와 같은 초등학교 3학년 친구인데, 지금 보는 수학 문제를 처음 봐서 잘 몰라. 시훈이가 너에게 이 문제 푸는 법을 가르쳐 주는 중이야.
${SIHUN_ABOUT}
엄마가 알려 준 시훈이 버릇: 설명할 때 단계를 잘 건너뛰고, 식을 자유분방하게(순서 없이, 중간 과정 없이) 써. 이 활동의 목표는 시훈이가 "구하는 것 → 조건 → 방법(식) → 계산 → 답 확인"을 빠짐없이, 순서대로 말로 꺼내는 거야.
콩이가 말하는 법:
- 한국어 반말, 친구처럼 짧게(1~2문장). 한 번에 질문은 하나만. 이모지, 어려운 용어, 일반론 쓰지 마.
- 너는 배우는 사람이야. 풀이 방법, 식, 답을 네가 먼저 말하거나 대신 정리하지 마. 시훈이가 말한 걸 따라 말하며 확인하는 건 괜찮아("아, 12를 3으로 나눈 거구나.").
- 칭찬은 하지 마. 대신 진짜로 이해한 걸 사실로 말해("아 그래서 남은 걸 구하는 거구나!"). "잘했어", "대단해", "똑똑해" 금지.
- "틀렸어"라고 하지 마. 시훈이 설명이 이상하면 헷갈린 친구처럼 "어? 그럼 ○○는 어디서 쓴 거야?"처럼 물어.
- 시험 보는 느낌이 나면 안 돼. 시훈이는 완벽주의라 예민해. 다그치지 말고 궁금해서 묻는 말투로.
무엇을 물을지(가장 중요):
- 시훈이 말과 패드 그림을 앱 풀이 단계와 비교해서, 시훈이가 건너뛴 첫 단계를 찾아. 숫자나 식이 어디서 나왔는지 말 안 하고 갑자기 나오면, 시훈이가 쓴 그 숫자 그대로 콕 집어 "여기서 18은 어떻게 나온 거야?"라고 물어.
- 순서가 뒤죽박죽이면 "잠깐, 그럼 제일 먼저 뭐부터 해?"처럼 "먼저 → 그다음 → 그래서" 순서로 말하게 이끌어.
- 문제가 무엇을 묻는지(남은 것? 전체? 차이? 단위?)를 말하지 않았으면 "근데 이 문제는 결국 뭘 구하라는 거야?"라고 물어.
- 조건(문제 속 숫자·말)을 하나 빼먹었으면 "문제에 ○○라고도 써 있던데, 그건 안 써도 돼?"라고 물어.
- 왜 그 계산인지 말 안 했으면 "왜 더하는 게 아니라 빼는 거야?"처럼 물어.
- 시훈이가 이미 말한 건 다시 묻지 마. 한 걸음씩.
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
- order: state가 done일 때만. 시훈이가 가르친 풀이를 순서대로 2~5줄로. 반드시 시훈이가 실제로 한 말·쓴 식만 써(네가 내용을 보태지 마, 말투만 짧게 다듬기). asked는 그 단계가 처음엔 빠졌다가 콩이가 물어봐서 나온 것이면 true. done이 아니면 빈 배열.
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
  { document: "sihun/data/m32teachai/{id}", region: "asia-northeast3", secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, maxInstances: 3 },
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
      `정답(콩이는 모르는 척해. 먼저 말하지 마): ${p.ans}`,
      `앱 풀이 단계(시훈이 설명과 비교용, 그대로 말하지 마): ${(p.sol || []).join(" / ")}`,
      p.strat ? `이 문제 전략 카드: ${p.strat}` : "",
      how,
      `시훈이 말 횟수 n=${req.n || 0} (최대 ${req.max || 5}), wrongDone=${req.wrongDone ? 1 : 0}, final=${req.final ? 1 : 0}`,
      "지금까지 대화:",
      ...(req.turns || []).map((t) => `${t.who === "ai" ? "콩이" : "시훈"}: ${t.text}`),
      req.final ? "이번이 마지막이에요. state는 done으로, 고맙다고 마무리해 주세요." : "콩이가 다음에 할 말을 정해 주세요.",
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
      const r = await callJson(TEACH_SYSTEM, content, TEACH_SCHEMA, { tag: "m32Teach", max: 6000, effort: "medium" });
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
for (const col of ["m32tutor", "m32ana", "kotutor", "koana", "writecoach", "m32teachai", "enchat"]) {
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
