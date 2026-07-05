const DEFAULT_BASE_URL = "https://api.openai-next.com";
const DEFAULT_MODEL = "claude-sonnet-5";
const DEFAULT_ASR_MODELS = ["gpt-4o-transcribe", "whisper-1"];
const MAX_ID_LENGTH = 120;
const MAX_GOAL_LENGTH = 500;
const MAX_LLM_SMOKE_PROMPT_LENGTH = 500;
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  ".aac",
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".oga",
  ".ogg",
  ".wav",
  ".webm",
]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".heic", ".heif", ".jpeg", ".jpg", ".png", ".webp"]);
const COLLECTION_CATEGORIES = new Set(["mbti", "body", "bazi", "psychology"]);
const CATEGORY_DIMENSIONS = {
  mbti: ["mbti"],
  body: ["tcm_body", "psychology"],
  bazi: ["xuanxue_spirit"],
  psychology: ["psychology"],
};
const CATEGORY_SIGNAL_TYPE = {
  mbti: "preference_clue",
  body: "body_state",
  bazi: "birth_info",
  psychology: "stress_state",
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      return jsonResponse(
        {
          ok: false,
          error: sanitizeError(error && error.message ? error.message : String(error)),
        },
        error && error.status ? error.status : 500,
      );
    }
  },
};

async function routeRequest(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "0704hks-worker",
      status: "ready",
      protected_api: "required",
    });
  }

  if (url.pathname === "/api/health/private" && request.method === "GET") {
    requireAppAccess(request, env);
    return jsonResponse({
      ok: true,
      service: "0704hks-worker",
      status: "ready",
      bindings: {
        assets: Boolean(env.ASSETS),
        db: Boolean(env.DB),
        media: Boolean(env.MEDIA),
        openai_next_key: Boolean(env.OPENAI_NEXT_API_KEY),
        app_access_token: Boolean(env.APP_ACCESS_TOKEN),
      },
      config: publicConfig(env),
    });
  }

  if (url.pathname === "/api/sessions" && request.method === "POST") {
    requireAppAccess(request, env);
    return createSession(request, env);
  }

  if (url.pathname === "/api/media" && request.method === "POST") {
    requireAppAccess(request, env);
    return storeMedia(request, env);
  }

  if (url.pathname === "/api/asr" && request.method === "POST") {
    requireAppAccess(request, env);
    return transcribeVoice(request, env);
  }

  if (url.pathname === "/api/llm-smoke" && request.method === "POST") {
    requireAppAccess(request, env);
    return llmSmoke(request, env);
  }

  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }
  return jsonResponse({ ok: false, error: "Not found" }, 404);
}

async function createSession(request, env) {
  requireDb(env);
  const body = await readJson(request);
  const id = normalizeIdentifier(body.session_id, `session_${crypto.randomUUID()}`, "session_id");
  const goal = normalizeText(body.goal, MAX_GOAL_LENGTH, "goal");
  const createdAt = new Date().toISOString();
  const skippedCategories = normalizeSkippedCategories(body.skipped_categories);

  await env.DB.prepare(
    "INSERT INTO sessions (id, created_at, goal, status, skipped_categories_json) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(id, createdAt, goal, "collecting", JSON.stringify(skippedCategories))
    .run();

  await audit(env, id, "session_created", { goal_present: Boolean(goal) });
  return jsonResponse({ ok: true, session_id: id, created_at: createdAt });
}

async function storeMedia(request, env) {
  requireDb(env);
  requireMedia(env);
  const form = await request.formData();
  const file = requiredFile(form, "file");
  const mediaKind = validateMediaFile(file, env);
  const sessionId = normalizeIdentifier(form.get("session_id"), null, "session_id");
  const inputId = normalizeIdentifier(form.get("input_id"), `input_${mediaKind}_${crypto.randomUUID()}`, "input_id");
  const category = normalizeCategory(form.get("category"), "body");

  await ensureSession(env, sessionId);
  const key = `${sessionId}/${inputId}/${safeFileName(file.name)}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
    customMetadata: {
      session_id: sessionId,
      input_id: inputId,
      category,
    },
  });

  const quality = acceptedMediaQuality(mediaKind);
  const sourceUri = `r2://0704hks-media/${key}`;
  await insertRawInput(env, {
    id: inputId,
    sessionId,
    modality: mediaKind,
    sourceUri,
    mimeType: file.type || "application/octet-stream",
    quality,
  });
  await audit(env, sessionId, "media_stored", { input_id: inputId, source_uri: sourceUri });

  return jsonResponse({ ok: true, input_id: inputId, modality: mediaKind, source_uri: sourceUri, quality });
}

async function transcribeVoice(request, env) {
  requireApiKey(env);
  const form = await request.formData();
  const sessionId = normalizeIdentifier(form.get("session_id"), `session_${crypto.randomUUID()}`, "session_id");
  const inputId = normalizeIdentifier(form.get("input_id"), "input_voice_001", "input_id");
  const signalId = normalizeIdentifier(form.get("signal_id"), "sig_voice_001", "signal_id");
  const category = normalizeCategory(form.get("category"), "body");
  const file = requiredFile(form, "file");
  validateAudioFile(file, env);

  if (env.DB) {
    await ensureSession(env, sessionId);
  }

  let sourceUri = `voice://${inputId}/${safeFileName(file.name)}`;
  if (env.MEDIA) {
    const key = `${sessionId}/${inputId}/${safeFileName(file.name)}`;
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { session_id: sessionId, input_id: inputId, category },
    });
    sourceUri = `r2://0704hks-media/${key}`;
  }

  const asrResult = await callAsrWithFallback(env, file);
  const transcript = String(asrResult.response.text || "").trim();
  const [quality, transcriptConfidence] = qualityForTranscript(transcript);
  const signalType = inferSignalType(transcript, category);
  const dimensions = inferDimensions(signalType, category);
  const input = {
    id: inputId,
    modality: "voice",
    created_at: new Date().toISOString(),
    source: {
      kind: "voice_recording",
      uri: sourceUri,
      mime_type: file.type || "application/octet-stream",
    },
    quality,
  };
  const signal = transcript
    ? buildVoiceSignal(signalId, inputId, transcript, transcriptConfidence, signalType, dimensions)
    : null;

  if (env.DB) {
    await insertRawInput(env, {
      id: inputId,
      sessionId,
      modality: "voice",
      sourceUri,
      mimeType: file.type || "application/octet-stream",
      quality,
    });
    if (signal) {
      await insertSignal(env, sessionId, signal);
    }
    await audit(env, sessionId, "asr_completed", {
      input_id: inputId,
      model: asrResult.model,
      transcript_length: transcript.length,
      fallback_count: asrResult.fallback_errors.length,
    });
  }

  return jsonResponse({
    ok: true,
    session_id: sessionId,
    transcript,
    transcript_confidence: transcriptConfidence,
    asr: {
      provider: "openai-compatible",
      base_url: baseUrl(env),
      endpoint: `${baseUrl(env)}/v1/audio/transcriptions`,
      model: asrResult.model,
      attempted_models: asrModels(env),
      fallback_errors: asrResult.fallback_errors,
    },
    input,
    signal,
  });
}

async function llmSmoke(request, env) {
  requireApiKey(env);
  const body = await readJson(request);
  const prompt =
    normalizeText(body.prompt, MAX_LLM_SMOKE_PROMPT_LENGTH, "prompt") ||
    "请只输出 JSON：{\"ok\":true,\"message\":\"0704hks cloudflare worker llm smoke passed\"}";
  const model = env.OPENAI_NEXT_MODEL || DEFAULT_MODEL;
  const response = model.startsWith("claude")
    ? await callAnthropicMessages(env, model, prompt)
    : await callChatCompletions(env, model, prompt);
  return jsonResponse({
    ok: true,
    model,
    content: extractTextContent(response),
  });
}

async function callAsrWithFallback(env, file) {
  const errors = [];
  for (const model of asrModels(env)) {
    const form = new FormData();
    form.set("model", model);
    form.set("response_format", "json");
    form.set("language", env.OPENAI_NEXT_ASR_LANGUAGE || "zh");
    form.set("file", file, file.name || "voice.m4a");
    const response = await fetch(`${baseUrl(env)}/v1/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_NEXT_API_KEY}`,
        "User-Agent": "curl/8.7.1",
      },
      body: form,
    });
    const text = await response.text();
    const parsed = parseJson(text);
    if (response.ok && parsed && !parsed.error) {
      return { model, response: parsed, fallback_errors: errors };
    }
    errors.push({
      model,
      error: sanitizeError(parsed && parsed.error ? JSON.stringify(parsed.error) : text || response.statusText),
    });
  }
  throw new Error(`All ASR models failed: ${JSON.stringify(errors)}`);
}

async function callAnthropicMessages(env, model, prompt) {
  const response = await fetch(`${baseUrl(env)}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": env.OPENAI_NEXT_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
      "User-Agent": "curl/8.7.1",
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      temperature: 0,
      thinking: { type: "disabled" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const text = await response.text();
  const parsed = parseJson(text);
  if (!response.ok || (parsed && parsed.error)) {
    throw new Error(`LLM API error: ${sanitizeError(text)}`);
  }
  return parsed;
}

async function callChatCompletions(env, model, prompt) {
  const response = await fetch(`${baseUrl(env)}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_NEXT_API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "curl/8.7.1",
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const text = await response.text();
  const parsed = parseJson(text);
  if (!response.ok || (parsed && parsed.error)) {
    throw new Error(`LLM API error: ${sanitizeError(text)}`);
  }
  return parsed;
}

async function ensureSession(env, sessionId) {
  if (!env.DB) return;
  await env.DB.prepare(
    "INSERT OR IGNORE INTO sessions (id, created_at, goal, status, skipped_categories_json) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(sessionId, new Date().toISOString(), "", "collecting", "[]")
    .run();
}

async function insertRawInput(env, input) {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO raw_inputs (id, session_id, modality, source_uri, mime_type, quality_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      input.id,
      input.sessionId,
      input.modality,
      input.sourceUri,
      input.mimeType,
      JSON.stringify(input.quality),
      new Date().toISOString(),
    )
    .run();
}

async function insertSignal(env, sessionId, signal) {
  await env.DB.prepare(
    "INSERT OR REPLACE INTO signals (id, session_id, modality, type, value, confidence, dimension_hint_json, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      signal.id,
      sessionId,
      signal.modality,
      signal.type,
      signal.value,
      signal.confidence,
      JSON.stringify(signal.dimension_hint),
      JSON.stringify(signal),
      new Date().toISOString(),
    )
    .run();
}

async function audit(env, sessionId, kind, payload) {
  if (!env.DB) return;
  await env.DB.prepare(
    "INSERT INTO audit_events (id, session_id, kind, payload_json, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(`audit_${crypto.randomUUID()}`, sessionId || null, kind, JSON.stringify(payload || {}), new Date().toISOString())
    .run();
}

function buildVoiceSignal(signalId, inputId, transcript, transcriptConfidence, signalType, dimensions) {
  return {
    id: signalId,
    modality: "voice",
    type: signalType,
    value: compactValue(transcript),
    transcript,
    transcript_confidence: transcriptConfidence,
    confidence: transcriptConfidence === "unknown" || transcriptConfidence === "low" ? "low" : "medium",
    dimension_hint: dimensions,
    evidence: [{ kind: "raw_input", id: inputId }],
    safety: {
      usage: "语音转文字后作为用户自述线索，进入后续文本信号抽取和四维画像。",
      must_not: ["医学诊断", "心理诊断", "人格定论", "真实性判断"],
    },
  };
}

function inferSignalType(transcript, category) {
  const upper = transcript.toUpperCase();
  if (/\b[IE][NS][FT][JP]\b/.test(upper)) return "mbti_known";
  if (/\d{4}.*(年|\/|-).*(\d{1,2}|[一二三四五六七八九十]{1,3}).*(月|\/|-)/.test(transcript)) {
    return "birth_info";
  }
  const rules = [
    ["sleep", ["睡", "多梦", "失眠", "醒", "困", "熬夜"]],
    ["digestion", ["胃", "消化", "腹", "便", "食欲", "胀", "反酸"]],
    ["temperature_sense", ["怕冷", "怕热", "手脚冷", "燥热", "出汗"]],
    ["emotion_state", ["焦虑", "烦", "难过", "低落", "生气", "麻木"]],
    ["repeated_pattern", ["拖延", "讨好", "控制", "回避", "反复", "总是"]],
    ["relationship_pattern", ["关系", "伴侣", "朋友", "同事", "家人", "冲突"]],
    ["stress_state", ["压力", "紧张", "内耗", "崩", "累"]],
  ];
  for (const [type, keywords] of rules) {
    if (keywords.some((keyword) => transcript.includes(keyword))) return type;
  }
  return CATEGORY_SIGNAL_TYPE[category] || "other";
}

function inferDimensions(signalType, category) {
  if (["sleep", "digestion", "temperature_sense", "body_state"].includes(signalType)) {
    return ["tcm_body", "psychology"];
  }
  if (
    [
      "emotion_state",
      "stress_state",
      "repeated_pattern",
      "self_evaluation",
      "relationship_pattern",
      "voice_delivery",
    ].includes(signalType)
  ) {
    return ["psychology"];
  }
  if (signalType === "birth_info") return ["xuanxue_spirit"];
  if (["mbti_known", "preference_clue"].includes(signalType)) return ["mbti"];
  return CATEGORY_DIMENSIONS[category] || [];
}

function qualityForTranscript(transcript) {
  if (!transcript) {
    return [
      {
        status: "unusable",
        issues: ["incomplete"],
        should_retry: true,
        retry_prompt: "这段语音没有识别出有效内容，可以重新录一遍，或直接打字告诉我最困扰你的点。",
      },
      "unknown",
    ];
  }
  if (transcript.length < 4) {
    return [
      {
        status: "low",
        issues: ["incomplete"],
        should_retry: true,
        retry_prompt: "这段语音识别内容太短，可以重新录一遍，或直接打字补充完整。",
      },
      "low",
    ];
  }
  return [usableQuality(), "medium"];
}

function usableQuality() {
  return {
    status: "medium",
    issues: [],
    should_retry: false,
    notes: "ASR 已识别出可用文本；未提供词级置信度，按中等置信度进入后续抽取。",
  };
}

function acceptedMediaQuality(mediaKind) {
  if (mediaKind === "image") {
    return {
      status: "medium",
      issues: [],
      should_retry: false,
      notes: "图片已通过基础格式和大小检查；仍需后续图像质量门控和观察抽取。",
    };
  }
  return {
    status: "medium",
    issues: [],
    should_retry: false,
    notes: "音频已通过基础格式和大小检查；如需画像信号，请继续执行 ASR 转写。",
  };
}

function validateAudioFile(file, env) {
  const maxMb = Number(env.OPENAI_NEXT_ASR_MAX_AUDIO_MB || 24);
  if (!file || typeof file.size !== "number") {
    throw new HttpError(400, "Missing audio file.");
  }
  if (file.size <= 0) {
    throw new HttpError(400, "Audio file is empty.");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new HttpError(400, `Audio file is too large. Limit is ${maxMb} MB.`);
  }
  const extension = extensionOf(file.name || "");
  const mimeType = file.type || "application/octet-stream";
  if (!SUPPORTED_AUDIO_EXTENSIONS.has(extension) && !mimeType.startsWith("audio/") && mimeType !== "video/mp4") {
    throw new HttpError(400, `Unsupported audio format: ${extension || "unknown"} (${mimeType}).`);
  }
  return "voice";
}

function validateMediaFile(file, env) {
  if (!file || typeof file.size !== "number") {
    throw new HttpError(400, "Missing media file.");
  }
  const extension = extensionOf(file.name || "");
  const mimeType = file.type || "application/octet-stream";
  if (SUPPORTED_AUDIO_EXTENSIONS.has(extension) || mimeType.startsWith("audio/") || mimeType === "video/mp4") {
    return validateAudioFile(file, env);
  }
  if (SUPPORTED_IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith("image/")) {
    return validateImageFile(file, env);
  }
  throw new HttpError(400, `Unsupported media format: ${extension || "unknown"} (${mimeType}).`);
}

function validateImageFile(file, env) {
  const maxMb = Number(env.MEDIA_MAX_IMAGE_MB || 10);
  if (file.size <= 0) {
    throw new HttpError(400, "Image file is empty.");
  }
  if (file.size > maxMb * 1024 * 1024) {
    throw new HttpError(400, `Image file is too large. Limit is ${maxMb} MB.`);
  }
  const extension = extensionOf(file.name || "");
  const mimeType = file.type || "application/octet-stream";
  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension) && !mimeType.startsWith("image/")) {
    throw new HttpError(400, `Unsupported image format: ${extension || "unknown"} (${mimeType}).`);
  }
  return "image";
}

function extractTextContent(response) {
  if (response && Array.isArray(response.content)) {
    return response.content
      .map((item) => {
        if (item && item.type === "text") return item.text || "";
        if (typeof item === "string") return item;
        return "";
      })
      .join("\n")
      .trim();
  }
  const content = response && response.choices && response.choices[0] && response.choices[0].message.content;
  return typeof content === "string" ? content : JSON.stringify(content || "");
}

function asrModels(env) {
  return String(env.OPENAI_NEXT_ASR_MODELS || DEFAULT_ASR_MODELS.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function baseUrl(env) {
  return String(env.OPENAI_NEXT_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function publicConfig(env) {
  return {
    base_url: baseUrl(env),
    model: env.OPENAI_NEXT_MODEL || DEFAULT_MODEL,
    asr_models: asrModels(env),
    asr_language: env.OPENAI_NEXT_ASR_LANGUAGE || "zh",
    asr_max_audio_mb: Number(env.OPENAI_NEXT_ASR_MAX_AUDIO_MB || 24),
    media_max_image_mb: Number(env.MEDIA_MAX_IMAGE_MB || 10),
  };
}

function requireApiKey(env) {
  if (!env.OPENAI_NEXT_API_KEY) throw new Error("Missing OPENAI_NEXT_API_KEY binding.");
}

function requireAppAccess(request, env) {
  if (!env.APP_ACCESS_TOKEN) {
    throw new HttpError(503, "Missing APP_ACCESS_TOKEN binding; protected API routes are disabled.");
  }
  const provided = accessTokenFromRequest(request);
  if (!provided || !constantTimeEqual(provided, env.APP_ACCESS_TOKEN)) {
    throw new HttpError(401, "Missing or invalid access token.");
  }
}

function accessTokenFromRequest(request) {
  const authorization = request.headers.get("Authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();
  return (request.headers.get("X-0704HKS-Access-Token") || "").trim();
}

function constantTimeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  let diff = a.length ^ b.length;
  const maxLength = Math.max(a.length, b.length);
  for (let index = 0; index < maxLength; index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return diff === 0;
}

function requireDb(env) {
  if (!env.DB) throw new Error("Missing D1 DB binding.");
}

function requireMedia(env) {
  if (!env.MEDIA) throw new Error("Missing R2 MEDIA binding.");
}

async function readJson(request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return {};
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

function requiredField(form, name) {
  const value = form.get(name);
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `Missing form field: ${name}`);
  return value.trim();
}

function requiredFile(form, name) {
  const value = form.get(name);
  if (!(value instanceof File)) throw new HttpError(400, `Missing file field: ${name}`);
  return value;
}

function stringOrDefault(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeFileName(name) {
  return String(name || "voice.m4a").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "voice.m4a";
}

function normalizeIdentifier(value, fallback, fieldName) {
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallback;
  if (!raw) {
    throw new HttpError(400, `Missing ${fieldName}.`);
  }
  if (raw.length > MAX_ID_LENGTH || !/^[A-Za-z0-9_-]+$/.test(raw)) {
    throw new HttpError(400, `Invalid ${fieldName}. Use 1-${MAX_ID_LENGTH} letters, numbers, hyphens, or underscores.`);
  }
  return raw;
}

function normalizeText(value, maxLength, fieldName) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new HttpError(400, `Invalid ${fieldName}.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new HttpError(400, `${fieldName} is too long. Limit is ${maxLength} characters.`);
  }
  return text;
}

function normalizeCategory(value, fallback) {
  const category = typeof value === "string" && value.trim() ? value.trim() : fallback;
  if (!COLLECTION_CATEGORIES.has(category)) {
    throw new HttpError(400, `Invalid category: ${category}.`);
  }
  return category;
}

function normalizeSkippedCategories(value) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new HttpError(400, "skipped_categories must be an array.");
  }
  const normalized = [];
  for (const item of value) {
    if (typeof item !== "string" || !COLLECTION_CATEGORIES.has(item)) {
      throw new HttpError(400, `Invalid skipped category: ${String(item)}.`);
    }
    if (!normalized.includes(item)) normalized.push(item);
  }
  return normalized;
}

function extensionOf(name) {
  const match = String(name).toLowerCase().match(/\.[^.]+$/);
  return match ? match[0] : "";
}

function compactValue(text, limit = 80) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1)}...`;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sanitizeError(message) {
  return String(message || "")
    .replace(/(Bearer|x-api-key)\s+[A-Za-z0-9._:-]+/g, "$1 [redacted]")
    .replace(/sk-[A-Za-z0-9]+/g, "sk-[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

function jsonResponse(payload, status = 200) {
  return withCors(
    new Response(JSON.stringify(payload, null, 2), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }),
  );
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization,X-0704HKS-Access-Token");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
