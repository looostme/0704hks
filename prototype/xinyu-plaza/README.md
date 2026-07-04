# 心愈广场原型

这个目录包含“心愈广场”的静态产品原型，可直接用浏览器打开：

```text
prototype/xinyu-plaza/index.html
```

## 包含内容

- 心愈聊天诊断建议页
- 心愈广场工具推荐页
- 中医、哲学、冥想、艺术分类
- 药食同源、《食疗本草》接入
- 24 节气养生、《养生导引秘籍》接入
- 道家哲学练习接入
- 睡前冥想练习和音频播放
- 情绪绘画互动沙画
- 基于 `0704hks` 健康数据结构的广场个性化推荐

## 健康数据适配

`xinyu-health-data-adapter.js` 支持两类数据：

- `examples/intake-*.json` 的 `MultimodalIntakeSession`
- `src/xinyu-health-diagnosis-skill.ts` 中的 `XinyuHealthInput`

归一化后会输出当前前端可使用的用户画像，并驱动“为你推荐”和顶部精选内容排序。
