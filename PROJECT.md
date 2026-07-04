# 0704hks Project Notes

## Product Direction

The product is a multi-modal four-dimensional profile system:

- TCM body: constitution, physical tendency, lifestyle and wellness reference.
- Adler psychology: psychological motive, repeated life style, social interest, and relationship pattern reflection.
- Xuanxue spirit: Zi Ping / Ba Zi cultural interpretation and life-stage reflection.
- MBTI: personality preference and relationship interaction reflection.

The first-session collection should finish within about 30 seconds. The order is MBTI -> body -> Ba Zi -> psychology. Users must submit at least two information categories before a full profile is generated. They may skip at most two categories; once two earlier categories are skipped, every later category becomes required. A category is skipped only after an explicit user skip action; missing Ba Zi must stay as `optional_missing` or `required_missing`, not be inferred as skipped from later psychology text. Psychology is collected last with 3-5 short Adler-style questions, then continued during the interactive wellness flow.

Use “倾向 / 画像 / 调理建议 / 参考” language. Do not present outputs as medical diagnosis, official MBTI assessment, deterministic fortune telling, or treatment.

## Current Memory

- Psychology is Adler-first, based on 《理解人性》 synthesis. TCM `情志` can support body-emotion linkage but should not replace the psychology dimension.
- The LLM-first profile engine lives in `scripts/profile_engine.py`. Claude models use `POST /v1/messages` with `x-api-key`, `anthropic-version: 2023-06-01`, and `thinking` disabled.
- Default test model is `claude-sonnet-5` through `https://api.openai-next.com`; keep API keys in environment variables only.
- The output contract is four dimension values plus one current state: `positive/正`, `negative/负`, or `neutral/平`.
- Latest five-round smoke test passed on 2026-07-04: missing Ba Zi now appears as a follow-up collection question, explicit two-skip sessions require Ba Zi and psychology, and fewer than two submitted categories are blocked by `collection_gate`.

## Technical Engine

The interactive product will use **Phaser 3 + TypeScript**, with Vite and pnpm for the app scaffold.

This choice optimizes for code-driven iteration by Codex/Claude-style agents: scenes, UI, interactions, and visual polish can be changed without a GUI editor. Pin Phaser to the 3.x line explicitly; do not use `phaser@latest`, because the default package line has moved to 4.x.

Engine notes and references are in `docs/engine-selection.md`. The current no-build spike is `demo-phaser-iso/index.html`.

The current product scene map is in `docs/scene-map.md`. Confirmed scene groups include per-step collection scenes, the four-dimensional result room, a wellness island with four houses, and a social personality archipelago.

## Current Scene Memory

The active visual direction is a small isometric-world experience inspired by Love Lights. "Resolution" feedback in this project means visual scale and detail density, not only canvas backing pixels. Keep worlds small, scenes readable, and interaction hit areas larger than the visible objects.

The current spike contains four switchable mobile scenes:

1. `采集`: MBTI 光团降世.
2. `结果`: four-dimensional profile room, with selectable dimension nodes.
3. `调理`: one island with four houses: TCM, philosophy, meditation, and art.
4. `社交`: personality islands on the sea, browsable by horizontal drag/swipe.

The current spike uses a `390x844` design viewport, `4x` canvas backing, and `WORLD_SCALE = 0.58`.

## Repository

Remote: `https://github.com/looostme/0704hks`

Current branches:

| User | Branch |
|---|---|
| looostme | `main` |
| liuxingyin1998 | `feat/alice` |
| taoj0599-sys | `feat/taoj0599-sys` |
| carinashu7 | `feat/carinashu7` |
| unassigned | `feat/bob` |

## Collaboration Flow

1. `git clone https://github.com/looostme/0704hks.git`
2. `git checkout feat/<name>`
3. Make changes.
4. `git commit`
5. `git push origin feat/<name>`
6. Open a pull request into `main`.

## Knowledge Base

The local knowledge base is in `knowledge-base/`.

It currently contains:

- `tcm`: 209 chunks from 中医基础理论.
- `psychology`: 9 chunks from an Adlerian individual psychology product synthesis based on 《理解人性》.
- `xuanxue`: 393 chunks from OCR of `梁湘润-子平基础概要.pdf`.
- `mbti`: 20 chunks, covering four preference dimensions and 16 MBTI-style type summaries.
- `knowledge-base/index/kb.sqlite`: SQLite + FTS5 keyword search index.
- `knowledge-base/index/retrieval_policy.json`: routing policy for the four dimensions.

`子平基础概要.txt` has been replaced with the successful OCR text. The original PDF is a scanned image PDF without a useful text layer.

## Regeneration

OCR prerequisites:

- `pdftoppm`
- `tesseract`
- Tesseract language data for `chi_tra_vert`, `chi_tra`, `chi_sim_vert`, `chi_sim`, and `eng`

Regenerate Zi Ping OCR:

```bash
python3 scripts/ocr_xuanxue.py
```

Rebuild chunks and SQLite index:

```bash
python3 scripts/build_kb.py all
```

If the original TCM source is available, place it at `data/中医基础.txt` or set `TCM_SOURCE=/path/to/中医基础.txt`. Otherwise the script reuses `knowledge-base/raw_clean/tcm_basis.clean.txt`.

## Storage Notes

Do not commit generated page images. They can be hundreds of MB and are ignored by `.gitignore`.
