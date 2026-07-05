#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const DEFAULT_WORKER_URL = "https://0704hks-smoke.070405hks.workers.dev";
const args = process.argv.slice(2);
const workerUrl = normalizeUrl(readOptionValue("--url") || process.env.WORKER_URL || DEFAULT_WORKER_URL);
const token = process.env.APP_ACCESS_TOKEN || "";
const withAi = args.includes("--with-ai");
const audioPath = readOptionValue("--audio");

if (!token) {
  fail("APP_ACCESS_TOKEN is required for protected smoke checks.");
}

const protectedHeaders = {
  Authorization: `Bearer ${token}`,
};

const privateHealth = {};

await check("public health", async () => {
  const response = await requestJson("/api/health");
  assertEqual(response.status, 200, "status");
  assertEqual(response.body.ok, true, "ok");
  assertEqual(response.body.protected_api, "required", "protected_api");
});

await check("private health rejects missing token", async () => {
  const response = await requestJson("/api/health/private");
  assertEqual(response.status, 401, "status");
});

await check("private health accepts token", async () => {
  const response = await requestJson("/api/health/private", { headers: protectedHeaders });
  assertEqual(response.status, 200, "status");
  assertEqual(response.body.ok, true, "ok");
  Object.assign(privateHealth, response.body);
});

await check("bad json returns 400", async () => {
  const response = await requestText("/api/sessions", {
    method: "POST",
    headers: {
      ...protectedHeaders,
      "Content-Type": "application/json",
    },
    body: "{",
  });
  assertEqual(response.status, 400, "status");
});

await check("media route reports binding state", async () => {
  const response = await requestJson("/api/media", {
    method: "POST",
    headers: protectedHeaders,
  });
  const mediaBinding = privateHealth.bindings && privateHealth.bindings.media;
  assertEqual(response.status, mediaBinding ? 400 : 503, "status");
});

if (withAi) {
  await check("llm smoke uses server model", async () => {
    const response = await requestJson("/api/llm-smoke", {
      method: "POST",
      headers: {
        ...protectedHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "user-supplied-model-should-be-ignored",
        prompt: "只输出这一行：verify worker llm passed",
      }),
    });
    assertEqual(response.status, 200, "status");
    assertEqual(response.body.model, privateHealth.config.model, "model");
    assertIncludes(response.body.content, "verify worker llm passed", "content");
  });
} else {
  console.log("[skip] llm smoke; pass --with-ai to enable");
}

if (audioPath) {
  await check("asr smoke", async () => {
    const fileBuffer = await readFile(audioPath);
    const form = new FormData();
    const suffix = Date.now().toString(36);
    form.set("session_id", `session_verify_${suffix}`);
    form.set("input_id", `input_voice_verify_${suffix}`);
    form.set("signal_id", `sig_voice_verify_${suffix}`);
    form.set("category", "body");
    form.set("file", new Blob([fileBuffer], { type: mimeTypeFor(audioPath) }), fileNameFor(audioPath));
    const response = await requestJson("/api/asr", {
      method: "POST",
      headers: protectedHeaders,
      body: form,
    });
    assertEqual(response.status, 200, "status");
    assertTruthy(response.body.transcript, "transcript");
    assertTruthy(response.body.signal, "signal");
  });
} else {
  console.log("[skip] asr smoke; pass --audio <path> to enable");
}

console.log(`[pass] smoke verification complete for ${workerUrl}`);

function readOptionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function normalizeUrl(value) {
  return String(value || DEFAULT_WORKER_URL).replace(/\/$/, "");
}

async function requestJson(path, init = {}) {
  const response = await fetchWithHint(`${workerUrl}${path}`, init);
  const text = await response.text();
  return {
    status: response.status,
    body: parseJson(text),
    text,
  };
}

async function requestText(path, init = {}) {
  const response = await fetchWithHint(`${workerUrl}${path}`, init);
  return {
    status: response.status,
    text: await response.text(),
  };
}

async function fetchWithHint(url, init) {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (hasProxyEnv() && !process.env.NODE_USE_ENV_PROXY) {
      throw new Error(`${error.message}; proxy env detected, retry with NODE_USE_ENV_PROXY=1`);
    }
    throw error;
  }
}

async function check(label, fn) {
  try {
    await fn();
    console.log(`[pass] ${label}`);
  } catch (error) {
    fail(`${label}: ${error.message}`);
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTruthy(value, label) {
  if (!value) {
    throw new Error(`${label} expected a value`);
  }
}

function assertIncludes(value, expected, label) {
  if (!String(value || "").includes(expected)) {
    throw new Error(`${label} expected to include ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
  }
}

function fail(message) {
  console.error(`[fail] ${message}`);
  process.exit(1);
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function hasProxyEnv() {
  return Boolean(
    process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.ALL_PROXY ||
      process.env.all_proxy,
  );
}

function fileNameFor(path) {
  return path.split(/[\\/]/).pop() || "voice.m4a";
}

function mimeTypeFor(path) {
  const extension = extname(path).toLowerCase();
  const mapping = {
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".oga": "audio/ogg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
  };
  return mapping[extension] || "application/octet-stream";
}
