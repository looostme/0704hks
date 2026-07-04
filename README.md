# 0704hks

四维画像产品实验仓库：中医身体/心理、玄学心灵、MBTI 人格偏好，加上 30 秒采集、互动调理和社交模块。

详细背景、分支分工和协作流程见 [PROJECT.md](PROJECT.md)。

## Knowledge Base

本仓库已内置第一版本地知识库：

- `knowledge-base/chunks/tcm.jsonl`
- `knowledge-base/chunks/xuanxue.jsonl`
- `knowledge-base/chunks/mbti.jsonl`
- `knowledge-base/index/kb.sqlite`
- `knowledge-base/index/retrieval_policy.json`

快速检查：

```bash
sqlite3 knowledge-base/index/kb.sqlite "select domain, count(*) from chunks group by domain;"
```

重建知识库：

```bash
python3 scripts/build_kb.py all
```

如需重跑子平 PDF OCR：

```bash
python3 scripts/ocr_xuanxue.py
```
