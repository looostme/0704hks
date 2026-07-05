# AI 生图素材制作单 V1

## 用途

这份文档把 v2 Phaser 原型拆成可以直接交给 AI 生图 / 美术同学执行的素材需求。它不是产品文案，而是素材生产单。

当前可玩原型：

```text
demo-phaser-iso/index.html
设计视口：390x844
渲染 backing：1560x3376
世界尺度：小世界 / 拉远等距视角
交互语法：点击目标 -> 主角移动 -> 到达反馈 -> 状态/内容揭示
```

目标是接近 Love Lights 参考里的“小、精细、插画化、内心世界”质感，但不要提示“照抄 Love Lights”。提示词里使用这些具体特征：

- 小型等距世界
- 拉远镜头
- 干净的矢量插画感
- 柔和手绘质感
- 手机小尺寸下轮廓清楚
- 安静的内心世界氛围
- 交互对象必须是可拆分透明素材

## 全局风格约束

每个素材都遵守这套通用约束。

```yaml
global_style:
  projection: 等距 isometric，拉远，小世界
  camera: 固定 3/4 等距视角，不要强透视
  line_quality: 干净矢量边缘，略带手绘感，不要像素风
  detail_level: 精细，但缩到 24-180 px 仍能看清
  lighting: 左上方柔光，轻微暖边光，不要硬写实
  material: 纸感插画 / 柔和 gouache / 矢量混合
  palette_base:
    background: 深梅子夜色、低饱和靛蓝、柔墨蓝
    warm: 奶油白、桃色、低饱和珊瑚
    cool: 淡蓝、薄荷绿、柔薰衣草紫
    accent: 沿用原型四维颜色
  text_inside_image: false
  forbidden:
    - 中英文文字
    - UI 外壳、按钮、卡片、气泡
    - 水印、logo、签名
    - 红十字、医院、针筒等医疗符号
    - 威胁感强的宿命/算命符号
    - 大头近景角色
    - 裁切不完整或过暗读不清的物体
```

## 输出规则

- 交互素材使用透明 PNG/WebP。
- 背景板才使用完整矩形 PNG/WebP。
- 透明素材要留安全边距，避免发光、阴影被裁掉。
- 生成尺寸建议为展示尺寸的 3-4 倍，再在资产管线里降采样。
- 图片里不要包含标签，所有文字由 Phaser 渲染。
- 命中区留在代码里，不依赖图片透明区域判断交互。

## 第一批优先级

| 优先级 | 素材组 | 为什么先做 |
|---|---|---|
| P0 | 主角光团 / 小人 / 影子 | 主角贯穿是游戏感核心。 |
| P0 | MBTI 降世门 / 光效 | 前 5 秒决定用户是否进入世界。 |
| P1 | 结果房间 / 四维宝石 | 四维画像是产品证明点。 |
| P1 | 四屋岛 / 四间房子 | 结果后的行动入口。 |
| P2 | 人格岛 / 海面 | 社交模块重要，但早期可复用形状。 |
| P2 | 身体、八字、问答采集物件 | 核心循环精致后再替换。 |

## P0：主角素材

### `protagonist_orb`

```yaml
asset_id: protagonist_orb
scene: shared / MBTI 光团降世
product_role: 出生前可控光团，之后变成主角小人
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: 拉远小世界
  target_display_size_px: 34x34
output:
  file_format: png
  canvas_px: 256x256
  transparent_background: true
  safe_padding_px: 48
style:
  mood: 温柔降临、好奇、有生命感
  palette: 奶油白核心、淡蓝光晕、非常轻的粉色副光晕
  line_quality: 干净发光边缘，不要锯齿
  material_detail: 半透明多层光、微小内核火花
  lighting: 自发光、柔光晕，不要强镜头光斑
content:
  required_objects:
    - 一个小型发光光团
    - 下方轻微椭圆接触光
    - 2-4 个靠近光团的小火花
  forbidden_objects:
    - 脸、手、翅膀、文字、符号、星座 glyph
  text_inside_image: false
layers_needed:
  - 透明单图
animation_use: breathing / hover
phaser_notes: 锚点居中，出生前约 34 px 宽，idle 时 y 方向浮动 3-5 px。
negative_prompt: 文字、logo、水印、写实镜头光斑、巨大星爆、裁切光晕
```

可复制提示词：

```text
生成一个小型等距游戏角色素材：出生前的发光光团。它会在 390x844 的手机 Phaser 场景中以约 34x34 px 显示，所以必须小而清楚。需要奶油白发光核心、淡蓝柔光晕、很轻的粉色副光晕、2-4 个近距离环绕的小火花、下方小接触光。风格是干净矢量插画边缘 + 柔和手绘质感，原创内心世界幻想感。输出透明 PNG，256x256，留安全边距。不要文字、水印、UI、脸、翅膀、星座符号。
```

### `protagonist_child_idle`

```yaml
asset_id: protagonist_child_idle
scene: shared
product_role: 光团降世后的主角小人
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: 3/4 正面，小型手机游戏角色
  target_display_size_px: 34x52
output:
  file_format: png
  canvas_px: 256x256
  transparent_background: true
  safe_padding_px: 48
style:
  mood: 温柔、好奇、非临床、内心世界旅人
  palette: 深梅子色头发/兜帽、低饱和玫瑰色衣服、奶油色脸、小型蓝粉胸口光
  line_quality: 简单清楚的轮廓，精细边缘高光
  material_detail: 柔软布料、胸口小光点，服装不要复杂
  lighting: 左上柔光，脚下轻微阴影
content:
  required_objects:
    - 小型孩童感主角
    - 圆头和简单头发/兜帽轮廓
    - 紧凑身体，适合等距行走
    - 一个可后续随场景变色的胸口小光点
  forbidden_objects:
    - 写实五官、成人比例、武器、医生/护士服、文字
  text_inside_image: false
animation_use: idle breathing
phaser_notes: 锚点放在脚底中心附近。五官极简，眼睛最多是两个小暗点。
negative_prompt: 动漫大头、夸张大眼、肖像近景、武器、医生、护士、文字、logo、水印
```

可复制提示词：

```text
生成一个小型等距手机游戏主角素材：光团变成的小人。它会在 390x844 的 Phaser 场景中以约 34x52 px 显示，所以轮廓必须非常清楚。角色温柔、好奇，有孩童感但不要幼稚；深梅子色头发或兜帽、低饱和玫瑰色衣服、奶油色脸、胸口有一个很小的蓝粉发光点。风格是干净矢量插画边缘 + 柔和手绘质感。输出透明 PNG，256x256，脚底靠近画面下方中心。不要文字、水印、UI、武器、医疗服装、夸张肖像脸。
```

### `protagonist_child_walk_sheet`

```yaml
asset_id: protagonist_child_walk_sheet
scene: shared
product_role: 点击移动时使用的可选走路帧
interactive: true
asset_type: character_sprite
camera:
  projection: isometric
  angle: 侧向偏 3/4 行走，可水平镜像
  target_display_size_px: 每帧 34x52
output:
  file_format: png
  canvas_px: 1024x256
  transparent_background: true
  safe_padding_px: 每帧 32
style:
  mood: 安静行走，轻微弹跳
  palette: 与 protagonist_child_idle 保持一致
  line_quality: 每帧轮廓一致
  material_detail: 极简，不要抖动噪声
  lighting: 左上光源一致
content:
  required_objects:
    - 横向 4 帧 sprite sheet
    - 与 idle 同一角色比例
    - 脚步接触变化清楚
    - 无背景
  forbidden_objects:
    - 帧编号、网格线、文字、过宽内嵌阴影
  text_inside_image: false
animation_use: sprite_sheet
phaser_notes: 4 帧，每帧 256x256。Phaser 可水平镜像用于向左移动。
negative_prompt: 每帧角色不一致、服装变化、文字、帧标签、裁切肢体
```

可复制提示词：

```text
生成一个 4 帧横向 sprite sheet，用于小型等距主角走路。画布 1024x256，透明背景，每帧严格 256x256。角色与 idle 版一致：深梅子色头发或兜帽、低饱和玫瑰色衣服、奶油色脸、胸口有很小的蓝粉光点。表现轻微走路循环，脚步接触变化要清楚，适合每帧缩到约 34x52 px。四帧比例必须一致。不要背景、文字、帧编号、网格线、水印。
```

## P0：MBTI 光团降世

### `mbti_sky_plate`

```yaml
asset_id: mbti_sky_plate
scene: MbtiLightDescentScene
product_role: 第一次降临场景背景板
interactive: false
asset_type: background_plate
camera:
  projection: 暗示等距世界，不要纯太空壁纸
  angle: 拉远，竖向手机构图
  target_display_size_px: 390x390 可玩上半区
output:
  file_format: png
  canvas_px: 1560x1560
  transparent_background: false
  safe_padding_px: 0
style:
  mood: 安静夜色、内心宇宙、柔和降临
  palette: 深梅子色、墨蓝、低饱和薰衣草紫、小奶油色星点
  line_quality: 柔和插画背景，不要硬网格
  material_detail: 淡雾、微弱星座线、小尘埃
  lighting: 中央降落区有柔光
content:
  required_objects:
    - 抽象内心夜空
    - 微弱星座弧线
    - 中央预留 landing gate 的空位
    - 下方稍暗，方便主角读清
  forbidden_objects:
    - UI 卡片、文字、带星座名的星球、写实银河照片
  text_inside_image: false
animation_use: static / slow parallax
phaser_notes: 放在 MBTI 场景物件后面。不要把 gate 或可点击光团画进去。
negative_prompt: 写实银河、文字、UI、星盘、塔罗、过密星点、高对比噪声
```

可复制提示词：

```text
生成一个竖向方形背景板，用于小型等距内心世界的 MBTI 光团降世场景。它会放在 390x844 手机 Phaser 屏幕的上半区，源图 1560x1560。氛围是安静夜色和内心宇宙，深梅子色、墨蓝、低饱和薰衣草紫、微弱星座弧线、少量奶油色尘埃星点，中央留出可读的降落柔光区域。不要画 landing gate 或可点击光团。不要 UI、文字、星座标签、塔罗、写实银河。输出完整矩形 PNG，1560x1560。
```

### `landing_gate`

```yaml
asset_id: landing_gate
scene: MbtiLightDescentScene
product_role: 光团回到这里并变成主角
interactive: true
asset_type: object_sprite
camera:
  projection: isometric
  angle: 小平台，可见顶面
  target_display_size_px: 90x58
output:
  file_format: png
  canvas_px: 512x384
  transparent_background: true
  safe_padding_px: 64
style:
  mood: 安全降落，有仪式感但简单
  palette: 低饱和紫石、淡蓝内光、奶油色边缘高光
  line_quality: 干净细描边、柔和倒角
  material_detail: 石质 / 纸雕平台、轻微内嵌光
  lighting: 内部蓝光 + 左上柔光
content:
  required_objects:
    - 小型等距菱形平台
    - 中央有轻微 portal 线或降落标记
    - 不要巨大建筑或门洞
  forbidden_objects:
    - 文字、符文、星座符号、宗教符号、UI 标签
  text_inside_image: false
animation_use: click_reveal / glow pulse
phaser_notes: 命中区在代码里放大。锚点居中。
negative_prompt: 文字、符文字母、星座符号、巨大传送门、石拱门、水印
```

可复制提示词：

```text
生成一个小型等距 landing gate 素材，用于手机 Phaser 游戏。它是光团降落并变成小人的菱形平台，显示尺寸约 90x58 px。需要低饱和紫色石质或纸雕平台、淡蓝内光、奶油色边缘高光、简单中央降落标记。感觉安全、有一点仪式感，但不要宗教感或宿命感。输出透明 PNG，512x384，留安全边距。不要文字、符文、星座符号、UI、水印。
```

## P1：结果房间

### `profile_room_plate`

```yaml
asset_id: profile_room_plate
scene: ProfileRoomScene
product_role: 四维结果房间背景，不包含维度宝石
interactive: false
asset_type: background_plate
camera:
  projection: isometric
  angle: 小房间，两面墙和地板可见
  target_display_size_px: 300x270
output:
  file_format: png
  canvas_px: 1200x1080
  transparent_background: true
  safe_padding_px: 96
style:
  mood: 内心房间、反思、温暖但非临床
  palette: 梅子色墙、低饱和玫瑰色地板、奶油细节、柔蓝灯光
  line_quality: 精细插画几何，边缘干净
  material_detail: 小书、镜子、桌子、植物、灯、细地板线
  lighting: 暖灯 + 冷环境光
content:
  required_objects:
    - 等距房间，含地板和两面墙
    - 中央留空，主角可以行走
    - 预留四个维度宝石位置
    - 小桌子 / 灯 / 镜子 / 书架 / 植物等细节
  forbidden_objects:
    - 文字、医疗图表、诊断 UI、大角色、烘焙进去的维度标签
  text_inside_image: false
animation_use: static
phaser_notes: 维度宝石、主角、光束、卡片都保持 Phaser 独立对象。
negative_prompt: 文字、仪表盘 UI、医院房间、巨大报告卡、人物、水印、裁切房间
```

可复制提示词：

```text
生成一个小型等距内心房间背景板，用于四维画像结果场景。它会在 390x844 手机 Phaser 游戏中显示约 300x270 px。房间要有两面墙和地板，梅子色墙、低饱和玫瑰色地板、奶油色细节、暖灯、很小的镜子/书架/桌子/植物，中间留出主角行走空间。预留四个小位置给后续独立的维度宝石素材，但不要画宝石或标签。风格是干净矢量插画几何 + 柔和手绘细节，温暖反思，不要临床感。输出透明 PNG，1200x1080，留安全边距。不要文字、UI 卡片、医疗图表、人物、水印。
```

### 四维宝石素材组

四个素材使用同一几何结构，只换强调色和内部小母题。

| asset_id | 维度 | 强调色 | 内部母题 |
|---|---|---|---|
| `dimension_orb_body` | 中医身体 | 薄荷绿 | 脉冲叶片 / 身体节律波 |
| `dimension_orb_mind` | 阿德勒心理 | 暖琥珀 | 小灯 / 路径结 |
| `dimension_orb_spirit` | 玄学心灵 | 柔粉色 | 时间弯月 / 反思星点 |
| `dimension_orb_mbti` | MBTI | 淡蓝色 | 镜面切片 / 对话火花 |

```yaml
asset_type: object_sprite
target_display_size_px: 34x44
output_canvas_px: 256x256
transparent_background: true
safe_padding_px: 48
animation_use: hover / selected glow
phaser_notes: 四个宝石统一中心锚点。选中环可以 Phaser 画，也可以后续单独生成。
negative_prompt: 文字、字母、MBTI 类型标签、医疗 icon、星座 glyph、水印
```

可复制提示词：

```text
生成一个小型等距漂浮水晶宝石，用于手机 Phaser 的四维画像房间。显示尺寸约 34x44 px，源图 256x256 透明 PNG。四个变体使用同一钻石/宝石几何。当前变体：[维度名]，强调色：[颜色]，内部有非常轻微的母题：[母题]。物体需要暗色小核心、彩色半透明宝石体、奶油色高光、柔和光晕。不要文字、标签、MBTI 字母、医疗符号、星座 glyph、水印。
```

## P1：四屋岛

### `wellness_island_base`

```yaml
asset_id: wellness_island_base
scene: WellnessIslandScene
product_role: 不含房子和店长的岛屿底座
interactive: false
asset_type: background_plate
camera:
  projection: isometric
  angle: 拉远岛屿，可见顶面
  target_display_size_px: 300x230
output:
  file_format: png
  canvas_px: 1200x920
  transparent_background: true
  safe_padding_px: 96
style:
  mood: 温柔行动中心、调理、安静岛屿
  palette: 低饱和绿色陆地、深青水边、奶油色路径、梅子阴影
  line_quality: 清楚岛屿轮廓，柔和质感
  material_detail: 四个空房屋底座、细路径、小植物、小石头
  lighting: 与结果房间一致的左上光
content:
  required_objects:
    - 一个小型等距岛屿
    - 四个空房屋底座
    - 连接房屋底座的路径
    - 每个底座前都有主角落脚空间
  forbidden_objects:
    - 房子、店长、文字、UI、医院符号
  text_inside_image: false
animation_use: static / later subtle water edge
phaser_notes: 房子和店长都是独立素材。主角站在每间房子前方。
negative_prompt: 文字、完整 UI、内嵌建筑、遮挡底座的大树、医院、水印
```

可复制提示词：

```text
生成一个小型等距岛屿底座，用于手机 Phaser 的调理/行动中心。显示尺寸约 300x230 px。岛屿包含低饱和绿色陆地、深青色水边、奶油色路径、梅子色阴影、小植物和小石头，以及四个空房屋底座，路径连接四个底座。不要画房子或角色，它们会作为独立素材导入。每个房屋底座前要留出一个小主角站立空间。输出透明 PNG，1200x920，留安全边距。不要文字、UI、医院符号、水印。
```

### 四间房子素材组

每间房子单独生成，保持相同 footprint 和光源。

| asset_id | 角色 | 轮廓 | 强调色 |
|---|---|---|---|
| `house_tcm` | 中医 | 草药小屋、小通风口、植物架 | 薄荷绿 |
| `house_philosophy` | 哲学 | 小书房/观测屋、书本形窗户 | 暖琥珀 |
| `house_meditation` | 冥想 | 圆顶静修亭、柔软帘门 | 淡蓝 |
| `house_art` | 艺术 | 小画室、斜屋顶、彩色窗片 | 柔粉 |

```yaml
asset_type: object_sprite
target_display_size_px: 54x58
output_canvas_px: 384x384
transparent_background: true
safe_padding_px: 56
animation_use: hover / selected bounce
phaser_notes: 底部 footprint 保持一致，方便放到 island pads 上。
negative_prompt: 文字、招牌、店名、十字架、宗教 icon、巨大烟囱烟雾、水印
```

可复制提示词：

```text
生成一个小型等距房子素材，用于手机 Phaser 的四屋调理岛。显示尺寸约 54x58 px，轮廓必须在小尺寸下清楚可辨。房子类型：[中医草药小屋 / 哲学书房 / 冥想亭 / 艺术画室]。共享风格：干净矢量插画、柔和手绘质感、左上光源、低饱和主体色，屋顶或细节使用 [强调色]。房子需要统一的小型等距底部 footprint，透明背景。输出 384x384 PNG，留安全边距。不要文字、招牌、医疗十字、宗教符号、水印。
```

### 店长素材组

```yaml
asset_ids:
  - keeper_tcm
  - keeper_philosophy
  - keeper_meditation
  - keeper_art
scene: WellnessIslandScene
product_role: 聚焦房屋后出现的小店长
asset_type: character_sprite
target_display_size_px: 24x34
output_canvas_px: 256x256
transparent_background: true
safe_padding_px: 56
style:
  mood: 温柔引导者，不是医生/治疗师权威
  silhouette: 很小，通过配饰区分，不靠文字
phaser_notes: 尺寸要小于或接近主角；用走出/弹跳方式 reveal。
negative_prompt: 白大褂、听诊器、夹板、文字、气泡、权威训话姿势
```

可复制提示词：

```text
生成一个小型等距店长角色素材，用于四屋调理岛。显示尺寸约 24x34 px，源图 256x256 透明 PNG。角色类型：[中医草药店长 / 哲学店长 / 冥想店长 / 艺术店长]。角色是温柔引导者，不是医生或治疗师权威。通过小配饰或轮廓区分：草药袋、小书、柔软披肩、画画围裙。细节要在很小尺寸下仍可读。不要文字、气泡、白大褂、听诊器、夹板、水印。
```

## P2：人格岛

### `sea_plate_loopable`

```yaml
asset_id: sea_plate_loopable
scene: PersonalityArchipelagoScene
product_role: 可横向拖动的人格岛海面背景
interactive: false
asset_type: background_plate
target_display_size_px: 390x320
output:
  file_format: png
  canvas_px: 1560x1280
  transparent_background: false
  safe_padding_px: 0
style:
  mood: 平静社交探索
  palette: 深墨蓝水面、低对比薰衣草波纹、微弱暖反光
content:
  required_objects:
    - 柔和水平波浪线
    - 低对比纹理
    - 不含岛屿和 UI
  forbidden_objects:
    - 文字、地图标签、巨浪、船、写实海面照片
phaser_notes: 可作为岛屿 carousel 后景，也可静态铺底。
```

可复制提示词：

```text
生成一个平静插画海面背景板，用于手机 Phaser 的人格岛横向 carousel。显示区域约 390x320 px，源图 1560x1280。使用深墨蓝水面、低对比薰衣草波纹、微弱暖反光、柔和纹理。它要支持多个小岛在上方横向移动。不要岛、船、文字、地图标签、UI、写实海面、水印。
```

### 人格岛素材组

```yaml
asset_ids:
  - personality_island_base_a
  - personality_island_base_b
  - personality_island_base_c
scene: PersonalityArchipelagoScene
asset_type: object_sprite
target_display_size_px: 82x72
output_canvas_px: 512x512
transparent_background: true
safe_padding_px: 80
style:
  mood: 小型生活地点、社交原型、友好距离感
  palette: 低饱和绿色陆地、彩色屋顶强调、深青底部
content:
  required_objects:
    - 小型岛屿底座
    - 一个小房子或可放房子的空位
    - 前方有清楚落脚区
  forbidden_objects:
    - 文字标签、MBTI 字母、巨大人物、UI 徽章
phaser_notes: Phaser 单独放文字标签。不同变体尺寸要接近。
```

可复制提示词：

```text
生成一个小型等距人格岛素材，用于手机 Phaser 社交 carousel。显示尺寸约 82x72 px，源图 512x512 透明 PNG。岛屿像一个小型生活地点：低饱和绿色陆地、深青色底部、一个小房子或可放房子的区域、前方有主角可站立的 dock/落脚点。生成三个不同岛屿轮廓变体，但比例保持一致。不要文字、MBTI 字母、UI 徽章、巨大角色、水印。
```

### `island_selection_ring` / `island_dock_marker`

```yaml
asset_ids:
  - island_selection_ring
  - island_dock_marker
scene: PersonalityArchipelagoScene
asset_type: effect_sprite
target_display_size_px: ring 110x70, marker 36x18
output_canvas_px: 512x256
transparent_background: true
style:
  mood: 柔和选中，不像硬游戏准星
  palette: 奶油色线条、轻微强调色光
phaser_notes: ring 放在选中岛后方，dock marker 放在岛屿前下方。
negative_prompt: 文字、箭头标签、UI 按钮、强霓虹、水印
```

可复制提示词：

```text
生成两个透明效果素材，用于小型等距人格岛 carousel：一个柔和奶油色椭圆选中环，带轻微强调色光；一个小型 dock/落脚标记，给主角站立。输出透明 PNG，512x256，两个效果分开并留足边距。风格精细插画，不要强霓虹。不要文字、箭头、UI 按钮、水印。
```

## P2：采集场景物件

### 身体庭院物件

每个物件单独生成透明图，目标显示约 `42x42`，源图 `256x256`。

| asset_id | 信号 | 视觉要求 |
|---|---|---|
| `body_moon_pool` | 睡眠 | 小月池、涟漪、淡蓝光 |
| `body_warm_cool_basin` | 冷热 | 半暖炉、半冷盆，琥珀/薄荷对比 |
| `body_rice_bowl` | 消化 | 小碗、轻蒸汽、奶油/薄荷高光 |
| `body_stone_bench` | 疲劳 | 柔和小石凳、低阴影、粉紫色调 |

可复制提示词：

```text
生成一个小型透明等距身体庭院物件，用于手机 Phaser 采集场景。物件：[月池 / 冷热盆 / 米碗 / 石凳]。显示尺寸约 42x42 px，源图 256x256 PNG。它表示 [睡眠 / 冷热体感 / 消化 / 疲劳] 这种温和身体线索，不是诊断。使用干净插画边缘、柔和质感、左上光源。不要文字、医疗符号、器官、医院意象、水印。
```

### 八字/时间观星台物件

| asset_id | 显示尺寸 | 用途 |
|---|---:|---|
| `bazi_star_clock` | 96x96 | 主观星台物件 |
| `bazi_birth_lantern_lit` | 36x48 | 已提供时间，高置信 |
| `bazi_birth_lantern_uncertain` | 36x48 | 时间不确定，低置信 |
| `bazi_skip_dock` | 48x28 | 显式跳过落脚点 |

可复制提示词：

```text
生成一个小型等距时间观星台物件，用于手机 Phaser 采集场景。素材：[星钟 / 点亮出生时间灯 / 不确定出生时间灯 / 跳过 dock]。它用于反思性的时间输入，不是决定论算命。使用低饱和紫色石质、柔粉和奶油光、干净矢量插画边缘。不要文字、星座 glyph、威胁感符号、塔罗牌、水印。透明 PNG，星钟源图 512x512，灯/dock 源图 256x256。
```

### 心理回声小径物件

| asset_id | 显示尺寸 | 用途 |
|---|---:|---|
| `psychology_echo_path_plate` | 220x140 | 小径/桥背景板 |
| `psychology_stepping_stone_a` | 48x32 | 反复模式 |
| `psychology_stepping_stone_b` | 48x32 | 在保护什么 |
| `psychology_stepping_stone_c` | 48x32 | 小实验 |
| `evidence_spark` | 18x18 | 可复用证据火花 |

可复制提示词：

```text
生成一个小型等距回声小径物件，用于手机 Phaser 心理采集场景。素材：[小径背景 / 踏石 / 证据火花]。氛围是温柔反思，表示一个小问题或自我观察，不是心理诊断。使用低饱和紫色路径材质、暖琥珀高光、干净插画边缘、柔和阴影。不要文字、脑 icon、医疗或治疗符号、对话气泡、水印。透明 PNG，尺寸按规格。
```

## 导入前验收清单

- 图片里没有文字、水印、logo、UI 外壳或不该出现的符号。
- 缩到目标显示尺寸后仍能读清。
- 透明素材有足够安全边距，发光和阴影不被裁。
- 可交互对象是单独文件，没有被烘焙进背景板。
- 房子和岛屿不靠文字也能区分。
- 主角能在所有背景前读清。
- 所有素材使用同一镜头角度和左上光源。
- 文件名可以直接使用 `asset_id`。

## 建议文件结构

```text
public/assets/v1/
  protagonist/
    protagonist_orb.png
    protagonist_child_idle.png
    protagonist_child_walk_sheet.png
  mbti/
    mbti_sky_plate.png
    landing_gate.png
  profile/
    profile_room_plate.png
    dimension_orb_body.png
    dimension_orb_mind.png
    dimension_orb_spirit.png
    dimension_orb_mbti.png
  wellness/
    wellness_island_base.png
    house_tcm.png
    house_philosophy.png
    house_meditation.png
    house_art.png
    keeper_tcm.png
    keeper_philosophy.png
    keeper_meditation.png
    keeper_art.png
  social/
    sea_plate_loopable.png
    personality_island_base_a.png
    personality_island_base_b.png
    personality_island_base_c.png
    island_selection_ring.png
    island_dock_marker.png
  collection/
    body_moon_pool.png
    body_warm_cool_basin.png
    body_rice_bowl.png
    body_stone_bench.png
    bazi_star_clock.png
    bazi_birth_lantern_lit.png
    bazi_birth_lantern_uncertain.png
    bazi_skip_dock.png
    psychology_echo_path_plate.png
    psychology_stepping_stone_a.png
    psychology_stepping_stone_b.png
    psychology_stepping_stone_c.png
    evidence_spark.png
```
