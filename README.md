# 0704hks

四维画像产品实验仓库：中医身体、阿德勒心理、玄学心灵、MBTI 人格偏好，加上 30 秒采集、互动调理和社交模块。

详细背景、分支分工和协作流程见 [PROJECT.md](PROJECT.md)。

项目逻辑梳理见 [docs/project-logic.md](docs/project-logic.md)。

产品场景地图见 [docs/scene-map.md](docs/scene-map.md)。

后续互动和 AI 精细素材计划见 [docs/interaction-asset-plan.md](docs/interaction-asset-plan.md)。

grill-me 采集到四维画像产出的流程见 [docs/diagnosis-flow.md](docs/diagnosis-flow.md)。

多模态输入契约见 [docs/multimodal-input.md](docs/multimodal-input.md)，JSON Schema 见 [schemas/profile-signal.schema.json](schemas/profile-signal.schema.json)，示例见 [examples/multimodal-intake.example.json](examples/multimodal-intake.example.json)。

语音 ASR 转写脚本见 [scripts/transcribe_audio.py](scripts/transcribe_audio.py)，示例输出见 [examples/voice-transcription.example.json](examples/voice-transcription.example.json)。

四维值与当前状态的 LLM-first 画像引擎见 [docs/profile-engine-flow.md](docs/profile-engine-flow.md) 和 [scripts/profile_engine.py](scripts/profile_engine.py)。

Cloudflare 部署方案见 [docs/deployment-cloudflare.md](docs/deployment-cloudflare.md)。

部署验证记录见 [docs/deployment-validation.md](docs/deployment-validation.md)。

v2 之后的 AI 生图素材制作单见 [docs/asset-generation-specs-v1.md](docs/asset-generation-specs-v1.md)。

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

当前 main 前端里的心愈逻辑定义：

- `心愈诊断` 是四维房间当前状态 `正 / 负 / 平` 的用户可读描述，不是额外的医疗或心理诊断层。
- `心愈广场` 对应前端里的 `调理岛`：四间房子承载中医、哲学、冥想、艺术工具，并根据四维房间状态推荐今日练习。
- 调理岛推荐来自四维值和当前状态，优先输出低负担、可立即执行的调理动作。

## Knowledge Base

本仓库已内置第一版本地知识库：

- `knowledge-base/chunks/tcm.jsonl`
- `knowledge-base/chunks/psychology.jsonl`
- `knowledge-base/chunks/xuanxue.jsonl`
- `knowledge-base/chunks/mbti.jsonl`
- `knowledge-base/index/kb.sqlite`
- `knowledge-base/index/retrieval_policy.json`

TCM 域已补充 `xiaopangxia/TCM-Ancient-Books` 中的舌诊与望诊资料：`临症验舌法`、`察舌辨症新法`、`伤寒舌鉴`、`望诊遵经`、`形色外诊简摩`。这些材料只用于舌图、面部气色和外在体征的低风险观察参考。

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
