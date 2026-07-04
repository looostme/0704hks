# 心愈广场个性化推荐 Skill

## 目标

根据用户前置诊断和健康数据，动态选择“心愈广场”的展示顺序、顶部精选内容、每个入口的推荐理由和可执行动作。

## 输入数据

当前实现支持 `looostme/0704hks` 仓库里的两类健康数据：

1. `examples/intake-*.json` 的 `MultimodalIntakeSession` 格式：包含 `session_id`、`goal`、`signals`、`safety_events`。
2. `src/xinyu-health-diagnosis-skill.ts` 的 `XinyuHealthInput` 格式：包含 `mentalState`、`bodySignals`、`tcmProfile`、`baziProfile`、`preferences`。

前端适配代码在：

```text
xinyu-health-data-adapter.js
```

核心调用：

```js
const userProfile = window.XinyuHealthDataAdapter.normalize(healthData);
const userProfileFromApi = await window.XinyuHealthDataAdapter.fetchHealthData('/api/user/health-intake.json');
```

归一化之后会得到当前原型可直接使用的用户画像：

```json
{
  "userId": "用户ID",
  "diagnosisName": "思维过载型身心失衡",
  "risk": "低到中风险",
  "summary": "用户诊断摘要",
  "metrics": {
    "mind": 82,
    "body": 74,
    "rhythm": 31,
    "support": 46
  },
  "dimensions": [
    { "name": "心理状态", "value": "反复思考、焦虑紧绷、情绪压抑" },
    { "name": "身体问题", "value": "睡眠浅、肩颈紧、胃口波动" },
    { "name": "八字判断", "value": "木火偏旺，土弱" },
    { "name": "MBTI 判断", "value": "INTJ 倾向" }
  ],
  "recentSignals": {
    "sleep": "睡眠浅",
    "appetite": "胃口波动",
    "emotion": "焦虑紧绷",
    "body": "肩颈紧"
  }
}
```

## 可推荐内容

```json
[
  { "key": "sleepMeditation", "name": "睡前冥想", "category": "冥想" },
  { "key": "sound", "name": "疗愈音乐", "category": "艺术" },
  { "key": "breath", "name": "正念呼吸", "category": "冥想" },
  { "key": "tcm", "name": "穴位按揉", "category": "中医" },
  { "key": "food", "name": "药食同源", "category": "中医" },
  { "key": "painting", "name": "情绪绘画", "category": "艺术" },
  { "key": "philosophy", "name": "道家哲学", "category": "哲学" },
  { "key": "western", "name": "西方哲学", "category": "哲学" },
  { "key": "seasonal", "name": "24节气养生", "category": "中医" },
  { "key": "nature", "name": "自然疗愈", "category": "艺术" }
]
```

## 推荐规则

- 如果节律分低、出现睡眠浅、睡前反刍，优先推荐：睡前冥想、疗愈音乐、正念呼吸。
- 如果身体分高、出现肩颈紧、胸口闷，优先推荐：穴位按揉、正念呼吸、自然疗愈。
- 如果出现胃口波动、饮食不规律、恢复力不足，优先推荐：药食同源、24节气养生。
- 如果出现情绪压抑、说不出口、支持感低，优先推荐：情绪绘画、睡前冥想。
- 如果出现控制感强、反复思考、脑内推演，优先推荐：道家哲学、西方哲学、正念呼吸。
- 如果用户偏理性或 INTJ，推荐理由要结构化、低情绪化、强调“小任务”。
- 如果用户偏共情或 INFJ，推荐理由要温和、低暴露、强调“安全容器”。

## 输出格式

```json
{
  "featured": {
    "key": "sleepMeditation",
    "title": "睡前冥想",
    "reason": "睡前难切换，优先安排入睡练习。"
  },
  "recommendations": [
    {
      "key": "sleepMeditation",
      "score": 78,
      "reason": "睡前难切换，优先安排入睡练习。",
      "action": "今晚用 8 分钟完成睡前收尾。"
    }
  ],
  "displayRules": {
    "maxHomeItems": 6,
    "sortBy": "score",
    "hideLowScore": false
  }
}
```

## Prompt 模板

你是“心愈广场”的个性化推荐引擎。请根据用户健康数据，从候选疗愈内容中选择最适合当前状态的展示顺序。

要求：

1. 不做疾病诊断，不承诺疗效。
2. 推荐理由必须短、具体、用户能看懂。
3. 每条理由不超过 24 个中文字符。
4. 优先推荐低负担、今晚能执行的小练习。
5. 如果用户有睡眠、情绪、身体紧绷、胃口波动等多重问题，先处理节律和身体稳定，再处理长期探索。
6. 输出严格使用 JSON，不要输出解释文字。

输入：

```json
{{healthData}}
```

候选内容：

```json
{{plazaTools}}
```

请输出：

```json
{
  "featured": {},
  "recommendations": [],
  "displayRules": {}
}
```
