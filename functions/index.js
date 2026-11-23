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
