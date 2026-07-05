# Deployment Validation

This file records the local Cloudflare validation path for the deployment plan.

## Local Worker

The repository includes a minimal Worker validation API:

```text
workers/api/src/index.js
wrangler.toml
migrations/0001_intake.sql
```

It verifies:

- static asset serving through Workers Static Assets
- D1 session, raw input, signal, and audit inserts
- optional R2 media writes
- openai-next ASR through `POST /v1/audio/transcriptions`
- openai-next LLM through Anthropic native `/v1/messages`

## Commands

Apply local D1 migration:

```bash
npx wrangler d1 migrations apply 0704hks --local
```

Start local Worker without writing secrets to disk:

```bash
npx wrangler dev --local --port 8787 \
  --var OPENAI_NEXT_API_KEY:<test-key> \
  --var APP_ACCESS_TOKEN:<test-access-token>
```

Health check:

```bash
curl http://127.0.0.1:8787/api/health
```

ASR check:

```bash
curl http://127.0.0.1:8787/api/asr \
  -H "Authorization: Bearer <test-access-token>" \
  -F session_id=session_worker_smoke_001 \
  -F input_id=input_voice_001 \
  -F category=body \
  -F file=@/path/to/voice.m4a
```

LLM check:

```bash
curl http://127.0.0.1:8787/api/llm-smoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <test-access-token>" \
  -d '{"prompt":"请只输出 JSON：{\"ok\":true,\"message\":\"worker llm smoke passed\"}"}'
```

## Remote Note

Remote deploy needs:

```bash
wrangler login
wrangler d1 create 0704hks
wrangler r2 bucket create 0704hks-media
wrangler secret put OPENAI_NEXT_API_KEY
wrangler secret put APP_ACCESS_TOKEN
wrangler deploy
```

Replace the placeholder D1 `database_id` in `wrangler.toml` after creating the remote database.

If the account has not finished Workers onboarding, register a `workers.dev` subdomain in the Cloudflare Dashboard or during interactive `wrangler deploy`. If R2 is not enabled, enable R2 in the Dashboard before creating the bucket.

## 2026-07-05 Remote Validation Result

Validated with the Cloudflare account authenticated through Wrangler OAuth.

Passed remote checks:

- Wrangler login succeeded for the Cloudflare account.
- Remote D1 database `0704hks` was created in region `WNAM`.
- `wrangler.toml` and `wrangler.remote-smoke.toml` were updated to use D1 database id `fcf2685d-6e66-4497-86f4-5b05f287f5f2`.
- Remote D1 migration `0001_intake.sql` applied successfully.
- Remote D1 schema check returned the expected tables: `sessions`, `raw_inputs`, `signals`, `profile_outputs`, `audit_events`.
- `OPENAI_NEXT_API_KEY` was uploaded as a Cloudflare Worker secret for `0704hks-smoke`; the key is not stored in repository files.
- `0704hks-smoke` Worker versions were uploaded to Cloudflare with Static Assets and D1 bindings.

Blocked remote checks:

- Full R2 validation is blocked until R2 is enabled for the account. Cloudflare API returned `code: 10042` when listing buckets.

Temporary smoke config:

```text
wrangler.remote-smoke.toml
```

This config omits R2 so Worker + D1 + ASR + LLM can be deployed as soon as `workers.dev` is registered. The main `wrangler.toml` keeps the full target shape with R2.

## 2026-07-05 Public Smoke Result

Registered the account workers.dev subdomain:

```text
https://070405hks.workers.dev
```

Published smoke Worker:

```text
https://0704hks-smoke.070405hks.workers.dev
```

Passed public checks:

- Static asset root `/` returned `200 OK`.
- `GET /api/health` returned public service readiness without exposing secret binding details.
- `POST /api/sessions` inserted `session_remote_smoke_001` into remote D1.
- `POST /api/llm-smoke` called `claude-sonnet-5` through openai-next and returned `remote worker llm smoke passed`.
- `POST /api/asr` called openai-next `gpt-4o-transcribe`, returned `最近睡不好，多梦，也很容易烦。`, generated a `sleep` signal, and routed it to `["tcm_body", "psychology"]`.
- Remote D1 confirmed `sessions=1`, `raw_inputs=1`, `signals=1`, `audit_events=2`.
- Remote D1 confirmed `input_voice_remote_001` source URI as `voice://input_voice_remote_001/asr-test.m4a`.
- Non-audio `.txt` upload to public `/api/asr` was rejected before calling upstream ASR.
- Output scan found no API key or local absolute path leakage in public Worker responses.

Still blocked:

- Full target deployment with R2 is blocked until R2 is enabled in the Cloudflare Dashboard. `wrangler r2 bucket create 0704hks-media` still returns Cloudflare API `code: 10042`.

## 2026-07-05 V2 Protagonist Deploy Result

Published the v2 protagonist demo through the smoke Worker:

```text
https://0704hks-smoke.070405hks.workers.dev
Cloudflare Worker version: 3298fe01-48ba-44f7-8b5d-a8f7140a59ae
Git commit: 409617f Add protagonist v2 demo and deployment path
```

Passed checks:

- `wrangler deploy -c wrangler.remote-smoke.toml` completed successfully.
- `GET /api/health` returned `200 OK` with `status=ready` and protected API routes still marked required.
- Static asset root `/` returned `200 OK` and served the Phaser v2 HTML.
- Browser execution created a `1560x3376` Phaser canvas.
- Browser execution created the DOM smoke hook `<script id="gameplay-state" type="application/json">`.
- Initial deployed state reported `activeScene=intake`, `heroBorn=false`, `activeIntake=mbti`, and `signalCount=0`.
- Deployed click smoke passed:
  - MBTI light click produced `heroBorn=true`, `activeIntake=body`, and `signalCount=1`.
  - Body object click produced `activeIntake=bazi`, `signalCount=2`, and `canGenerateProfile=true`.
- Browser console error/warning log was empty during deployed render and click smoke.

Deployment note:

- This is the current deployable smoke target while R2 remains unavailable on the Cloudflare account. The full `wrangler.toml` target still keeps the intended R2 binding for later.

## 2026-07-05 V4 Protected API Validation Result

Published the protected API hardening update through the smoke Worker:

```text
https://0704hks-smoke.070405hks.workers.dev
Cloudflare Worker version: 33668eb2-6603-4761-8a7e-3f26bf07978e
```

Passed checks:

- `GET /api/health` returned public readiness only, without exposing secret binding details.
- `GET /api/health/private` without an access token returned `401`.
- `GET /api/health/private` with the test access token returned `200` and confirmed `assets=true`, `db=true`, `media=false`, `openai_next_key=true`, and `app_access_token=true`.
- `POST /api/media` with the test access token returned `503` with an explicit missing R2 binding message in the smoke environment.
- `POST /api/sessions` with malformed JSON returned `400`.
- `POST /api/llm-smoke` ignored a user-supplied `model` field and used server-configured `claude-sonnet-5`.
- `POST /api/asr` called openai-next `gpt-4o-transcribe`, returned `最近睡不好，多梦，也很容易烦。`, generated a `sleep` signal, and routed it to `["tcm_body", "psychology"]`.
- Remote D1 confirmed `input_voice_remote_v4_001` and `sig_voice_remote_v4_001` were persisted.
- Secret scan found no test API key or local absolute path leakage in repository files.

Still blocked:

- Full media storage validation remains blocked until R2 is enabled in the Cloudflare Dashboard. `wrangler r2 bucket list` returns Cloudflare API `code: 10042`.

## 2026-07-05 Local Validation Result

Validated locally with Wrangler 4.107.0 and the temporary openai-next test key passed through `--var`, not written to disk.

Passed checks:

- `wrangler deploy --dry-run` recognized Static Assets, D1, R2, and env bindings.
- Local D1 migration `0001_intake.sql` applied successfully.
- `GET /api/health` returned Assets/D1/R2/key bindings as present.
- Static asset root `/` returned `200 OK`.
- `POST /api/sessions` inserted a session into D1.
- `POST /api/asr` uploaded voice to local R2, called openai-next `gpt-4o-transcribe`, generated a `sleep` voice signal, and inserted raw input + signal + audit rows into D1.
- Local R2 object was downloaded back and verified as M4A audio.
- `POST /api/llm-smoke` called `claude-sonnet-5` through openai-next and returned a valid smoke response.
- Non-audio `.txt` upload to `/api/asr` was rejected before calling upstream ASR.
- Output scan found no API key or local absolute path leakage in Worker ASR/LLM responses.

Observed smoke values:

```text
ASR model: gpt-4o-transcribe
Transcript: 最近睡不好，多梦，也很容易烦。
Signal: sleep -> ["tcm_body", "psychology"]
D1 rows: sessions=1, raw_inputs=1, signals=1, audit_events=2
R2 URI: r2://0704hks-media/session_worker_smoke_001/input_voice_001/asr-test.m4a
```
