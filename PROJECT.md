# 0704hks Project Notes

## Product Direction

The product is a multi-modal four-dimensional profile system:

- TCM body: constitution, physical tendency, lifestyle and wellness reference.
- TCM psychology: emotion, stress, sleep, and affective state through TCM concepts.
- Xuanxue spirit: Zi Ping / Ba Zi cultural interpretation and life-stage reflection.
- MBTI: personality preference and relationship interaction reflection.

The first-session collection should finish within 30 seconds. Ask only the minimum follow-up questions needed to produce a first-pass profile, then continue collecting signals during the interactive wellness flow.

Use “倾向 / 画像 / 调理建议 / 参考” language. Do not present outputs as medical diagnosis, official MBTI assessment, deterministic fortune telling, or treatment.

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
