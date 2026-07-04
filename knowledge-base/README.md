# Four-Dimensional Profile Knowledge Base

Built at: 2026-07-04T15:22:06.913868+00:00

This directory contains the first local KB for the product idea:

- `tcm`: 中医基础理论 + 古籍舌诊/望诊补充，用于身体/情志/体质/调理倾向参考。
- `psychology`: 阿德勒个体心理学摘要，用于心理动力、生活风格、关系模式和 grill-me 追问。
- `xuanxue`: 梁湘润《子平基础概要》OCR 后的子平/四柱文化解释参考。
- `mbti`: MBTI-style 偏好维度与 16 类型画像，用于人格和关系互动。

## TCM Ancient Diagnostic Supplements

Selected from `xiaopangxia/TCM-Ancient-Books`:

- Primary tongue diagnosis: `516-临症验舌法.txt`
- Supplementary tongue diagnosis: `521-察舌辨症新法.txt`, `490-伤寒舌鉴.txt`
- Primary face/color observation: `517-望诊遵经.txt`
- Supplementary external observation: `510-形色外诊简摩.txt`

These sources stay in the `tcm` domain and are tagged with `舌诊`, `舌图`, `望诊`, `面诊`, `望色`, `明堂`, and related diagnostic tags. They are evidence for low-risk observation only, not image-based diagnosis or direct prescriptions.

## Files

- `chunks/tcm.jsonl`
- `chunks/psychology.jsonl`
- `chunks/xuanxue.jsonl`
- `chunks/mbti.jsonl`
- `index/kb.sqlite`
- `index/kb_manifest.json`
- `schemas/chunk.schema.json`

## Retrieval

For simple keyword retrieval, use SQLite FTS when available:

```sql
SELECT id, domain, text
FROM chunks_fts
WHERE chunks_fts MATCH '阴阳 OR 体质'
LIMIT 5;
```

For application RAG, read the JSONL chunks, embed `text`, and keep `domain`, `tags`, `locator`, and `safety` as metadata filters.

## Intake Policy

The first session follows MBTI -> body -> Ba Zi -> psychology. A full profile requires at least two submitted categories. Users may skip at most two categories; after two explicit skips, all later categories are required. Missing Ba Zi is not the same as skipped Ba Zi: if no birth date/time is provided and the user did not skip it, the engine should keep Ba Zi as a follow-up question.

## Product Boundary

Use these chunks to generate “倾向/画像/建议”, not medical diagnosis, clinical diagnosis, fortune determinism, or official psychometric assessment.
