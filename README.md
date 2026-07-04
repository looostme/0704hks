# 0704hks

四维画像产品实验仓库：中医身体、阿德勒心理、玄学心灵、MBTI 人格偏好，加上 30 秒采集、互动调理和社交模块。

详细背景、分支分工和协作流程见 [PROJECT.md](PROJECT.md)。

项目逻辑梳理见 [docs/project-logic.md](docs/project-logic.md)。

产品场景地图见 [docs/scene-map.md](docs/scene-map.md)。

grill-me 采集到四维画像产出的流程见 [docs/diagnosis-flow.md](docs/diagnosis-flow.md)。

多模态输入契约见 [docs/multimodal-input.md](docs/multimodal-input.md)，JSON Schema 见 [schemas/profile-signal.schema.json](schemas/profile-signal.schema.json)，示例见 [examples/multimodal-intake.example.json](examples/multimodal-intake.example.json)。

四维值与当前状态的 LLM-first 画像引擎见 [docs/profile-engine-flow.md](docs/profile-engine-flow.md) 和 [scripts/profile_engine.py](scripts/profile_engine.py)。

当前首轮采集规则：

- 顺序固定为 MBTI -> 身体 -> 八字 -> 心理。
- 至少提交两类信息才生成完整画像。
- 最多跳过两类；前面已经跳过两类后，后续类别必填。
- 只有用户显式跳过才算 `skipped`；缺八字默认进入下一步补采。

## Engine

交互引擎选定为 Phaser 3 + TypeScript，后续正式应用脚手架建议使用 Vite + pnpm。选型说明见 [docs/engine-selection.md](docs/engine-selection.md)。

当前有一个无需构建的技术验证 spike：

```text
demo-phaser-iso/index.html
```

直接用浏览器打开即可验证手机竖屏等距场景 demo：采集光团、四维房间、调理岛和社交人格岛。

## Knowledge Base

本仓库已内置第一版本地知识库：

- `knowledge-base/chunks/tcm.jsonl`
- `knowledge-base/chunks/psychology.jsonl`
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
