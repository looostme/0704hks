const state = {
  screen: 'chat',
  view: 'advice',
  userIndex: 0,
  category: '推荐',
  activeTool: 'sound',
  featuredIndex: 0,
  detailOpen: false,
  savedTools: ['sound', 'tcm']
};

const users = [
  {
    type: 'INTJ',
    diagnosisName: '思维过载型身心失衡',
    risk: '低到中风险',
    diagnosisSummary: '你当前不是单纯疲惫，而是长期高负荷思考后，睡眠、肩颈和情绪出口一起变弱。',
    energyTitle: '脑内能量高，恢复能量低',
    energyCopy: '心理压力和夜间反刍偏高，身体承载与睡眠恢复偏低。',
    metrics: { mind: 82, body: 74, rhythm: 31, support: 46 },
    advice: '先修复睡眠节律，再处理反复思考和身体紧绷。',
    adviceCopy: '今晚不要继续深度分析，先做一个低负担的收尾动作，让身体知道今天结束了。',
    dimensions: [
      ['心理状态', '反复思考 + 控制感偏高', '容易把未完成事项带到夜晚继续推演。'],
      ['身体问题', '睡眠浅 + 肩颈紧', '身体长期处在工作态，恢复窗口不足。'],
      ['八字判断', '木火偏旺，土弱', '表达和思考能量强，稳定与承载感需要补足。'],
      ['MBTI 判断', 'INTJ 倾向', '更适合结构化、低打扰、可解释的方案。']
    ],
    planTitle: '7 天低打扰修复方案',
    plans: [
      ['Day 1', '睡前降噪', '停止工作型输入，建立“明日容器”。'],
      ['Day 2', '疏肝舒展', '穴位 + 胸肋舒展，降低肩颈和胸口紧绷。'],
      ['Day 3', '反复思考整理', '把念头拆成现实情况、担心推演和可做一步。'],
      ['Day 4', '食疗调养', '晚餐温热清淡，减少咖啡、冰冷和辛辣刺激。'],
      ['Day 5', '睡眠声景', '使用自然声景替代刷内容，降低夜间输入。'],
      ['Day 6', '东方哲学收尾', '练习“今天到此为止”，松动过度控制。'],
      ['Day 7', '复盘调整', '根据睡眠、肩颈、情绪和执行成本调整方案。']
    ],
    modules: [
      ['食疗调养', '个性化食养方案', '根据体质、症状和作息生成饮食结构、茶饮和忌口建议。'],
      ['认知减压训练', '反复思考整理器', '把反复想的事情拆成现实情况、担心推演和可做一步。'],
      ['声音疗愈', '睡眠声景', '用自然声、白噪声或低刺激环境声，帮助睡前从输入切换到休息。']
    ],
    priorities: [
      ['1', '睡眠节律修复', '睡眠浅和夜间反刍同时出现，优先恢复节律。'],
      ['2', '认知减压训练', '给反复思考设置边界，减少夜间内耗。'],
      ['3', '身体紧绷调养', '肩颈紧和胃口波动提示身体承载不足。']
    ],
    logic: [
      ['MBTI 第一层', 'INTJ → 方案采用“原因 + 小任务 + 反馈指标”的低打扰表达。'],
      ['身心优先级', '睡眠浅和反复思考同时出现 → 睡眠节律优先级最高。'],
      ['八字叙事', '木火偏旺、土弱 → 长期方案加入食疗调养和稳定节律。'],
      ['工具匹配', '推荐食疗、认知减压、睡眠声景，先避开强社交型疗愈。']
    ]
  },
  {
    type: 'INFJ',
    diagnosisName: '情绪压抑型能量内耗',
    risk: '低风险',
    diagnosisSummary: '你更像是长期照顾他人感受后，自己的情绪出口不足，身体开始用疲惫提醒你。',
    energyTitle: '情绪能量高，表达出口低',
    energyCopy: '共情消耗和关系压力偏高，身体恢复和边界感偏低。',
    metrics: { mind: 78, body: 62, rhythm: 44, support: 39 },
    advice: '先建立低暴露表达出口，再恢复身体节律。',
    adviceCopy: '今天不用把情绪解释完整，只需要给它一个安全容器。',
    dimensions: [
      ['心理状态', '情绪压抑 + 关系耗竭', '容易理解别人，但忽略自己的真实需求。'],
      ['身体问题', '疲惫 + 胃口不稳', '情绪压力已经影响日常恢复。'],
      ['八字判断', '水木偏弱，火土不稳', '需要补充滋养感和稳定边界。'],
      ['MBTI 判断', 'INFJ 倾向', '适合温和表达、意义感和关系边界练习。']
    ],
    planTitle: '7 天温和情绪修复方案',
    plans: [
      ['Day 1', '情绪命名', '只写一个感受词，不做长篇分析。'],
      ['Day 2', '情绪容器', '把说不出口的内容先放进安全记录，不发布。'],
      ['Day 3', '身体照顾', '安排一次温热饮食和早睡窗口。'],
      ['Day 4', '关系边界', '写下一件今天不继续承担的事。'],
      ['Day 5', '正念呼吸', '用 6 轮呼吸降低胸口紧绷。'],
      ['Day 6', '东方哲学', '练习看见念头，不急着改变它。'],
      ['Day 7', '复盘调整', '保留最不费力、最有恢复感的动作。']
    ],
    modules: [
      ['情绪自我照护', '情绪容器', '把不能说出口的内容放进安全记录，系统只做整理。'],
      ['睡前冥想', '正念入睡', '用短时呼吸和开放觉察，把注意力从关系压力中收回来。'],
      ['东方哲学', '观照练习', '训练和念头保持距离，减少自责和过度共情。']
    ],
    priorities: [
      ['1', '情绪出口建立', '情绪压抑和关系耗竭同时存在，先给情绪安全容器。'],
      ['2', '身体节律恢复', '疲惫和胃口不稳说明身体需要温和照顾。'],
      ['3', '关系边界练习', '降低过度共情带来的长期消耗。']
    ],
    logic: [
      ['MBTI 第一层', 'INFJ → 方案采用“理解 + 边界 + 温和表达”的风格。'],
      ['身心优先级', '情绪压抑和疲惫同时出现 → 先开表达出口，再修节律。'],
      ['八字叙事', '滋养感不足 → 推荐温和食养、身体觉察和边界练习。'],
      ['工具匹配', '推荐情绪容器、睡前冥想、东方哲学，不强推公开社交。']
    ]
  }
];

const categories = ['推荐', '中医', '哲学', '冥想', '艺术'];

const externalCache = {};

const tools = [
  {
    key: 'sound',
    category: '艺术',
    tone: 'tone-blue',
    icon: '音',
    title: '疗愈音乐',
    summary: '自然声与轻音乐，让大脑慢慢安静下来。',
    fit: '睡眠浅、脑内反复想、睡前停不下来的人群。',
    steps: ['选择雨声、林间声或古琴声景', '设置 12 分钟自动停止', '手机屏幕调暗并远离床头', '结束后只记录入睡感受'],
    action: '睡前播放 12 分钟，不搭配播客、课程或歌词内容。'
  },
  {
    key: 'painting',
    category: '艺术',
    tone: 'tone-rose',
    icon: '画',
    title: '情绪绘画',
    summary: '用颜色和线条表达感受。',
    fit: '情绪很满但不想说话，或很难把感受写成文字的人群。',
    steps: ['选择一个代表当下感受的颜色', '画出压力的形状', '给画面取一个名字', '选择保存或删除'],
    action: '用 3 分钟画一个“今天的情绪形状”。'
  },
  {
    key: 'tcm',
    category: '中医',
    tone: 'tone-green',
    icon: '穴',
    title: '穴位按揉',
    summary: '按揉常用穴位，缓解肩颈紧和胸口闷。',
    fit: '身体紧绷、压力落在肩颈和胸口的人群。',
    steps: ['太冲、内关、膻中各按揉 1 分钟', '做 3 组胸肋打开舒展', '睡前 40 分钟降低屏幕刺激', '记录胸口堵和肩颈紧的变化'],
    action: '今晚只做 3 个穴位，每个 1 分钟。'
  },
  {
    key: 'food',
    category: '中医',
    tone: 'tone-green',
    icon: '食',
    title: '药食同源',
    summary: '用日常食材和茶饮做温和调养。',
    fit: '胃口波动、睡眠浅、恢复力不足的人群。',
    steps: ['减少辛辣、油炸和冰冷食物', '晚餐保持温热易消化', '可选温和茶饮', '记录次日胃口和夜醒情况'],
    action: '今晚晚餐后不再喝咖啡或浓茶。'
  },
  {
    key: 'seasonal',
    category: '中医',
    tone: 'tone-amber',
    icon: '节',
    title: '24节气养生',
    summary: '顺着节气调整饮食、起居和身心节律。',
    fit: '作息容易受季节影响，或希望按节律调养的人群。',
    steps: ['查看当前节气的身心提示', '选择一个饮食调整', '选择一个起居调整', '记录一周内睡眠和精神变化'],
    action: '今天只做一个节气动作：早点收尾，减少夜间刺激。'
  },
  {
    key: 'philosophy',
    category: '哲学',
    tone: 'tone-amber',
    icon: '止',
    title: '道家哲学',
    summary: '少一点控制，把今天交还给今天。',
    fit: '控制感强、容易把未完成事项带到睡前的人群。',
    steps: ['写下今天已经完成的事', '承认仍有未完成事项', '放入明日容器', '默念“今晚只负责恢复”'],
    action: '睡前说一句：我把明天的问题交还给明天。'
  },
  {
    key: 'western',
    category: '哲学',
    tone: 'tone-blue',
    icon: '问',
    title: '西方哲学',
    summary: '用一个问题，换个角度看压力。',
    fit: '需要理性框架、喜欢用问题澄清自己的人群。',
    steps: ['抽取一个哲学问题', '写下直觉答案', '区分事实和解释', '保留一个新的观察角度'],
    action: '今天抽一张卡，只回答一个问题。'
  },
  {
    key: 'breath',
    category: '冥想',
    tone: 'tone-blue',
    icon: '呼',
    title: '正念呼吸',
    summary: '跟随节律呼吸，让身体先稳下来。',
    fit: '心跳快、胸闷、进入睡前仍很紧的人群。',
    steps: ['跟随圆环吸气 4 秒', '停留 1 秒', '呼气 6 秒', '完成 6 轮后停止'],
    action: '焦虑升高时做 6 轮，不追求做满很久。'
  },
  {
    key: 'sleepMeditation',
    category: '冥想',
    tone: 'tone-green',
    icon: '眠',
    title: '睡前冥想',
    summary: '给一天一个收尾，慢慢进入休息。',
    fit: '睡前仍在处理白天事务、难以切换到休息的人群。',
    steps: ['放下未完成事项', '听一段短引导', '把注意力放到呼吸', '结束后不再打开工作内容'],
    action: '今晚用 8 分钟完成睡前收尾。'
  },
  {
    key: 'nature',
    category: '艺术',
    tone: 'tone-green',
    icon: '森',
    title: '自然疗愈',
    summary: '晒光、看树、慢走，让身体恢复。',
    fit: '脑内过载、久坐、长期室内工作和情绪迟钝的人群。',
    steps: ['选择一个低人流户外空间', '慢走 12 分钟', '观察光线、风、树和身体触感', '不听课程、不处理消息'],
    action: '今天去楼下或窗边接触自然光 10 分钟。'
  }
];

const externalHealthUsers = window.XinyuHealthDataAdapter?.buildUsersFromExamples?.() || [];
if (externalHealthUsers.length) {
  users.push(...externalHealthUsers);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function currentUser() {
  return users[state.userIndex];
}

function byKey(key) {
  return tools.find((tool) => tool.key === key) || tools[0];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function buildHealthProfile(user = currentUser()) {
  const dimensionText = user.dimensions.map((item) => item.join(' ')).join(' ');
  const planText = user.plans.map((item) => item.join(' ')).join(' ');
  const priorityText = user.priorities.map((item) => item.join(' ')).join(' ');
  const sourceText = [
    user.diagnosisName,
    user.diagnosisSummary,
    user.energyTitle,
    user.energyCopy,
    user.advice,
    user.adviceCopy,
    dimensionText,
    planText,
    priorityText
  ].join(' ');
  const metrics = user.metrics || {};

  return {
    type: user.type,
    diagnosisName: user.diagnosisName,
    risk: user.risk,
    metrics,
    sourceText,
    flags: {
      highMind: Number(metrics.mind) >= 75,
      bodyLoad: Number(metrics.body) >= 60,
      lowRhythm: Number(metrics.rhythm) <= 45,
      lowSupport: Number(metrics.support) <= 50,
      sleepIssue: includesAny(sourceText, ['睡眠浅', '睡前', '夜间', '入睡', '节律']),
      rumination: includesAny(sourceText, ['反复思考', '反复想', '脑内', '推演', '控制感', '过载']),
      bodyTension: includesAny(sourceText, ['肩颈', '胸口', '紧绷', '胸闷', '身体承载']),
      appetiteIssue: includesAny(sourceText, ['胃口', '饮食', '食疗', '食养', '咖啡', '冰冷', '辛辣']),
      emotionSuppressed: includesAny(sourceText, ['情绪压抑', '情绪出口', '说不出口', '共情', '关系压力']),
      needsStructure: includesAny(sourceText, ['INTJ', '结构化', '理性', '可解释']),
      needsGentleness: includesAny(sourceText, ['INFJ', '温和', '滋养', '边界', '照顾'])
    }
  };
}

const plazaRecommendationRules = {
  sleepMeditation: {
    base: 14,
    reasons: [
      ['sleepIssue', 36, '睡前难切换，优先安排入睡练习。'],
      ['lowRhythm', 28, '节律分偏低，先帮身体进入休息。'],
      ['emotionSuppressed', 12, '情绪压着时，用温和冥想收尾。']
    ]
  },
  sound: {
    base: 12,
    reasons: [
      ['sleepIssue', 28, '睡眠浅时，低刺激声景更容易执行。'],
      ['rumination', 18, '脑内停不下来时，用声音降低输入强度。'],
      ['lowRhythm', 14, '节律偏低，适合固定睡前声景。']
    ]
  },
  breath: {
    base: 12,
    reasons: [
      ['highMind', 22, '心理负荷高，先用呼吸把身体稳住。'],
      ['bodyTension', 18, '胸口和肩颈紧时，呼吸练习负担最低。'],
      ['emotionSuppressed', 12, '情绪上来时，用短练习先缓冲。']
    ]
  },
  tcm: {
    base: 10,
    reasons: [
      ['bodyTension', 34, '肩颈和胸口紧，适合先做穴位按揉。'],
      ['bodyLoad', 16, '身体负荷偏高，需要低成本身体照护。'],
      ['sleepIssue', 8, '睡前按揉可作为收尾动作。']
    ]
  },
  food: {
    base: 10,
    reasons: [
      ['appetiteIssue', 34, '胃口和饮食波动时，先做温和食养。'],
      ['needsGentleness', 14, '需要滋养感，食养比强训练更容易坚持。'],
      ['lowRhythm', 10, '节律不稳时，晚间饮食先保持清淡。']
    ]
  },
  painting: {
    base: 8,
    reasons: [
      ['emotionSuppressed', 34, '情绪说不出来时，用绘画做低暴露表达。'],
      ['lowSupport', 14, '支持感偏低，先给情绪一个安全出口。'],
      ['highMind', 8, '分析过多时，用非语言方式放松。']
    ]
  },
  philosophy: {
    base: 10,
    reasons: [
      ['rumination', 28, '控制感强时，用道家练习松开结果。'],
      ['needsStructure', 14, '理性型用户适合一句话收尾。'],
      ['sleepIssue', 10, '睡前把明天的问题交还给明天。']
    ]
  },
  western: {
    base: 8,
    reasons: [
      ['needsStructure', 24, '需要理性框架时，用问题澄清压力。'],
      ['rumination', 14, '反复想时，先区分事实和解释。'],
      ['highMind', 8, '心理能量高时，保留一个可控问题即可。']
    ]
  },
  seasonal: {
    base: 8,
    reasons: [
      ['lowRhythm', 18, '节律偏低时，用节气动作建立生活锚点。'],
      ['appetiteIssue', 10, '饮食和作息都需要顺着节律调。'],
      ['bodyLoad', 8, '身体负荷高时，节气养生更温和。']
    ]
  },
  nature: {
    base: 7,
    reasons: [
      ['highMind', 14, '脑内过载时，接触自然能降低刺激。'],
      ['lowSupport', 10, '支持感低时，先用自然环境做轻陪伴。'],
      ['bodyLoad', 8, '久坐疲惫时，短时慢走更合适。']
    ]
  }
};

function scoreToolForProfile(tool, profile) {
  const rule = plazaRecommendationRules[tool.key] || { base: 5, reasons: [] };
  const matched = [];
  let score = rule.base;
  rule.reasons.forEach(([flag, points, reason]) => {
    if (profile.flags[flag]) {
      score += points;
      matched.push(reason);
    }
  });
  return {
    tool,
    score,
    reason: matched[0] || tool.summary,
    matchedReasons: matched
  };
}

function getPersonalizedRecommendations(user = currentUser()) {
  const profile = buildHealthProfile(user);
  return tools
    .map((tool) => scoreToolForProfile(tool, profile))
    .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title, 'zh-CN'));
}

function personalizedToolCopy(tool, user = currentUser()) {
  const recommendation = getPersonalizedRecommendations(user).find((item) => item.tool.key === tool.key);
  return recommendation?.reason || tool.summary;
}

function getVisibleTools() {
  const ranked = getPersonalizedRecommendations(currentUser());
  if (state.category === '推荐') {
    return ranked.slice(0, 6).map((item) => item.tool);
  }
  return ranked
    .filter((item) => item.tool.category === state.category)
    .map((item) => item.tool);
}

function setScreen(screen) {
  state.screen = screen;
  qsa('.screen').forEach((item) => {
    item.classList.toggle('active', item.id === `screen-${screen}`);
  });
  qsa('.tab').forEach((item) => {
    item.classList.toggle('active', item.dataset.screen === screen);
  });

  const labels = {
    chat: ['心愈聊天', '你的诊断建议'],
    plaza: ['心愈广场', state.detailOpen ? '工具详情' : '心愈广场'],
    planet: ['心愈星球', '互动社区'],
    mine: ['我的心愈', '我的档案']
  };
  qs('#screenKicker').textContent = labels[screen][0];
  qs('#screenTitle').textContent = labels[screen][1];
  qs('#switchUser').textContent = screen === 'plaza' ? '换一个' : '切换样例';
  qs('.app-header').classList.toggle('plaza-mode', screen === 'plaza');
}

function setView(view) {
  state.view = view;
  qsa('.chat-view').forEach((item) => {
    item.classList.toggle('active', item.id === `view-${view}`);
  });
  qsa('.subtab').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });
}

function renderAdvice() {
  const user = currentUser();
  qs('#diagnosisName').textContent = user.diagnosisName;
  qs('#riskBadge').textContent = user.risk;
  qs('#diagnosisSummary').textContent = user.diagnosisSummary;
  qs('#energyTitle').textContent = user.energyTitle;
  qs('#energyCopy').textContent = user.energyCopy;
  qs('#mainAdvice').textContent = user.advice;
  qs('#mainAdviceCopy').textContent = user.adviceCopy;

  qs('#diagnosisCards').innerHTML = user.dimensions.map((item) => `
    <button class="diagnosis-item" type="button">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <p>${item[2]}</p>
    </button>
  `).join('');
}

function renderPlan() {
  const user = currentUser();
  qs('#planTitle').textContent = user.planTitle;
  qs('#planList').innerHTML = user.plans.map((item, index) => `
    <div class="plan-item ${index === 0 ? 'active' : ''}">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <p>${item[2]}</p>
    </div>
  `).join('');

  qs('#moduleList').innerHTML = user.modules.map((item) => `
    <button class="module-item" type="button">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <p>${item[2]}</p>
    </button>
  `).join('');
}

function renderLogic() {
  const user = currentUser();
  qs('#logicFlow').innerHTML = user.logic.map((item, index) => `
    <div class="logic-step">
      <em>${index + 1}</em>
      <div>
        <strong>${item[0]}</strong>
        <p>${item[1]}</p>
      </div>
    </div>
  `).join('');
}

function renderResultPage() {
  const user = currentUser();
  qs('#resultDiagnosis').textContent = user.diagnosisName;
  qs('#resultSummary').textContent = user.diagnosisSummary;
  qs('#resultRisk').textContent = user.risk;
  qs('#metricMind').textContent = user.metrics.mind;
  qs('#metricBody').textContent = user.metrics.body;
  qs('#metricRhythm').textContent = user.metrics.rhythm;
  qs('#metricSupport').textContent = user.metrics.support;
  qs('#resultAdvice').textContent = user.advice;
  qs('#resultAdviceCopy').textContent = user.adviceCopy;
  qs('#resultPlanTitle').textContent = user.planTitle;

  qs('#resultPriorities').innerHTML = user.priorities.map((item) => `
    <div class="priority-row">
      <em>${item[0]}</em>
      <div>
        <strong>${item[1]}</strong>
        <p>${item[2]}</p>
      </div>
    </div>
  `).join('');

  qs('#resultSchedule').innerHTML = user.plans.map((item) => `
    <div class="schedule-row">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <p>${item[2]}</p>
    </div>
  `).join('');

  qs('#resultModules').innerHTML = user.modules.map((item) => `
    <div class="result-module">
      <span>${item[0]}</span>
      <strong>${item[1]}</strong>
      <p>${item[2]}</p>
    </div>
  `).join('');
}

function renderCategories() {
  qs('#categoryRow').innerHTML = categories.map((category) => `
    <button class="category-chip ${state.category === category ? 'active' : ''}" type="button" data-category="${category}">
      ${category}
    </button>
  `).join('');

  qsa('.category-chip').forEach((button) => {
    button.addEventListener('click', () => {
      state.category = button.dataset.category;
      state.detailOpen = false;
      renderPlaza();
      setScreen('plaza');
    });
  });
}

function renderTools() {
  const visibleTools = getVisibleTools();
  qs('#toolCount').textContent = state.category === '推荐' ? '为你推荐' : state.category;
  qs('#toolGrid').innerHTML = visibleTools.map((tool) => `
    <button class="tool-card ${tool.tone} ${state.savedTools.includes(tool.key) ? 'saved' : ''}" type="button" data-tool="${tool.key}">
      <span class="tool-title-row">
        <span class="tool-icon">${tool.icon}</span>
        <strong>${tool.title}</strong>
      </span>
      <p>${personalizedToolCopy(tool)}</p>
      <em>${toolActionLabel(tool.key)}</em>
    </button>
  `).join('');

  qsa('.tool-card').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeTool = button.dataset.tool;
      state.detailOpen = true;
      renderPlaza();
      setScreen('plaza');
    });
  });
}

function toolActionLabel(key) {
  const labels = {
    sound: '试听',
    painting: '创作',
    tcm: '按揉',
    food: '选食养',
    seasonal: '看节气',
    nature: '开始',
    philosophy: '收尾',
    western: '思考',
    breath: '呼吸',
    sleepMeditation: '入睡',
    nature: '开始'
  };
  return labels[key] || '开始';
}

function renderFeatured() {
  const recommendations = getPersonalizedRecommendations(currentUser());
  const featured = recommendations[state.featuredIndex % Math.min(4, recommendations.length)];
  const tool = featured?.tool || tools[0];
  qs('#featuredTitle').textContent = tool.title;
  qs('#featuredCopy').textContent = featured?.reason || tool.summary;
  qs('#featuredOpen').onclick = () => {
    state.activeTool = tool.key;
    state.detailOpen = true;
    renderPlaza();
    setScreen('plaza');
  };
}

function renderDetail() {
  const tool = byKey(state.activeTool);
  const saved = state.savedTools.includes(tool.key);
  const personalizedCopy = personalizedToolCopy(tool);
  qs('#toolDetailView').classList.toggle('active', state.detailOpen);
  qs('#plazaHome').style.display = state.detailOpen ? 'none' : 'block';

  if (!state.detailOpen) {
    qs('#toolDetailView').innerHTML = '';
    return;
  }

  qs('#toolDetailView').innerHTML = `
    <button class="back-button" id="backToPlaza" type="button">返回心愈广场</button>
    <div class="tool-detail-card">
      <span>${tool.category}</span>
      <strong>${tool.title}</strong>
      <p>${tool.summary}</p>
    </div>
    <div class="detail-section">
      <span>为什么推荐</span>
      <p>${personalizedCopy}</p>
    </div>
    <div class="detail-section">
      <span>工具内容</span>
      <ul>
        ${tool.steps.map((step) => `<li>${step}</li>`).join('')}
      </ul>
    </div>
    <div class="detail-section">
      <span>今日动作</span>
      <p>${tool.action}</p>
    </div>
    <div class="detail-section live-section" id="liveData">
      <span>现在就用</span>
      <p>正在准备可用内容...</p>
    </div>
    <button class="save-button ${saved ? 'saved' : ''}" id="toggleSave" type="button">
      ${saved ? '已在我的计划 · 点击移出' : '加入我的计划'}
    </button>
  `;

  loadLiveData(tool.key);

  qs('#backToPlaza').addEventListener('click', () => {
    state.detailOpen = false;
    renderPlaza();
    setScreen('plaza');
  });

  qs('#toggleSave').addEventListener('click', () => {
    state.savedTools = saved
      ? state.savedTools.filter((key) => key !== tool.key)
      : [...state.savedTools, tool.key];
    renderPlaza();
  });
}

function renderPlaza() {
  renderFeatured();
  renderCategories();
  renderTools();
  renderDetail();
}

function renderLiveData(html) {
  const target = qs('#liveData');
  if (target) {
    target.innerHTML = `<span>现在就用</span>${html}`;
    bindLiveInteractions(target);
    initSandCanvas(target);
  }
}

function bindLiveInteractions(target) {
  target.querySelectorAll('.action-list button, .color-row button, .art-item button, .practice-button').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.closest('.action-list, .color-row, .art-grid');
      if (group) {
        group.querySelectorAll('button').forEach((item) => item.classList.remove('selected'));
      }
      button.classList.add('selected');

      if (button.classList.contains('practice-button')) {
        button.textContent = button.dataset.done || '已记录到我的心愈';
      }

      let result = target.querySelector('.use-result');
      if (!result) {
        result = document.createElement('p');
        result.className = 'use-result';
        button.closest('.live-section')?.appendChild(result);
      }
      if (result) {
        result.textContent = button.dataset.result || `已选择：${button.textContent.trim()}`;
      }
    });
  });
}

function initSandCanvas(root) {
  const canvas = root.querySelector('[data-sand-canvas]');
  if (!canvas || canvas.dataset.ready === 'true') {
    return;
  }
  canvas.dataset.ready = 'true';

  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  const width = canvas.width;
  const height = canvas.height;
  const grid = new Uint8Array(width * height);
  const colors = {
    1: [211, 169, 92],
    2: [78, 146, 182],
    3: [84, 132, 82],
    4: [216, 103, 66],
    5: [113, 89, 68]
  };
  const materialNames = {
    1: '细沙',
    2: '清水',
    3: '绿芽',
    4: '暖光',
    5: '今日色'
  };
  const accentColor = parseHexColor(root.querySelector('[data-sand-color]')?.dataset.sandColor);
  if (accentColor) {
    colors[5] = accentColor;
  }
  let current = 1;
  let drawing = false;
  let frame = 0;

  const indexAt = (x, y) => y * width + x;
  const isEmpty = (x, y) => x >= 0 && x < width && y >= 0 && y < height && grid[indexAt(x, y)] === 0;
  const swap = (x1, y1, x2, y2) => {
    const first = indexAt(x1, y1);
    const second = indexAt(x2, y2);
    const value = grid[first];
    grid[first] = grid[second];
    grid[second] = value;
  };

  function paint(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * height);
    const radius = current === 0 ? 8 : 5;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radius * radius) {
          continue;
        }
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) {
          continue;
        }
        grid[indexAt(px, py)] = current;
      }
    }
  }

  function step() {
    frame += 1;
    for (let y = height - 2; y >= 0; y -= 1) {
      const direction = frame % 2 === 0 ? 1 : -1;
      for (let offset = 0; offset < width; offset += 1) {
        const x = direction === 1 ? offset : width - 1 - offset;
        const value = grid[indexAt(x, y)];
        if (value === 1 || value === 5) {
          if (isEmpty(x, y + 1) || grid[indexAt(x, y + 1)] === 2) {
            swap(x, y, x, y + 1);
          } else if (isEmpty(x - direction, y + 1)) {
            swap(x, y, x - direction, y + 1);
          } else if (isEmpty(x + direction, y + 1)) {
            swap(x, y, x + direction, y + 1);
          }
        }
        if (value === 2) {
          if (isEmpty(x, y + 1)) {
            swap(x, y, x, y + 1);
          } else if (isEmpty(x + direction, y)) {
            swap(x, y, x + direction, y);
          } else if (isEmpty(x - direction, y)) {
            swap(x, y, x - direction, y);
          }
        }
        if (value === 4) {
          if (Math.random() > 0.985) {
            grid[indexAt(x, y)] = 0;
          }
          if (y > 0 && Math.random() > 0.94 && isEmpty(x, y - 1)) {
            swap(x, y, x, y - 1);
          }
          const below = y + 1 < height ? indexAt(x, y + 1) : -1;
          if (below >= 0 && grid[below] === 3 && Math.random() > 0.9) {
            grid[below] = 4;
          }
        }
        if (value === 3 && y + 1 < height && (grid[indexAt(x, y + 1)] === 2 || grid[indexAt(x, y + 1)] === 5) && Math.random() > 0.997) {
          const nextY = y - 1;
          if (nextY > 0 && isEmpty(x, nextY)) {
            grid[indexAt(x, nextY)] = 3;
          }
        }
      }
    }
  }

  function draw() {
    const image = ctx.createImageData(width, height);
    for (let i = 0; i < grid.length; i += 1) {
      const value = grid[i];
      const pixel = i * 4;
      if (value === 0) {
        image.data[pixel] = 250;
        image.data[pixel + 1] = 246;
        image.data[pixel + 2] = 235;
        image.data[pixel + 3] = 255;
        continue;
      }
      const color = colors[value];
      const shade = (i + frame) % 5;
      image.data[pixel] = Math.max(0, color[0] - shade);
      image.data[pixel + 1] = Math.max(0, color[1] - shade);
      image.data[pixel + 2] = Math.max(0, color[2] - shade);
      image.data[pixel + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }

  function animate() {
    if (!canvas.isConnected) {
      return;
    }
    step();
    draw();
    window.requestAnimationFrame(animate);
  }

  root.querySelectorAll('[data-sand]').forEach((button) => {
    button.addEventListener('click', () => {
      current = Number(button.dataset.sand);
      root.querySelectorAll('[data-sand]').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      const result = root.querySelector('.use-result');
      if (result) {
        result.textContent = current === 0
          ? '已切换为擦除，可以整理画面。'
          : `已选择${materialNames[current]}，按住画布拖动即可。`;
      }
    });
  });

  root.querySelector('[data-sand-clear]')?.addEventListener('click', () => {
    grid.fill(0);
    const result = root.querySelector('.use-result');
    if (result) {
      result.textContent = '画布已清空，可以重新开始。';
    }
  });

  canvas.addEventListener('pointerdown', (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    paint(event);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (drawing) {
      paint(event);
    }
  });
  canvas.addEventListener('pointerup', () => {
    drawing = false;
  });
  canvas.addEventListener('pointercancel', () => {
    drawing = false;
  });

  root.querySelector('[data-sand="1"]')?.classList.add('selected');
  draw();
  animate();
}

function parseHexColor(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!match) {
    return null;
  }
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16)
  ];
}

function renderLiveFallback(toolKey) {
  const fallback = {
    food: '<p class="tool-use-copy">今晚只做一个选择：吃温热、清淡、易消化的食物。</p><div class="action-list"><button type="button">温热晚餐</button><button type="button">少油少辣</button><button type="button">睡前不加餐</button></div><p class="use-result">选择一个今晚要做的食养动作。</p>',
    seasonal: '<p class="tool-use-copy">今日为夏至，宜清心、养阳、少耗气。今晚练习做轻、短、慢。</p><div class="classic-card"><span>《养生导引秘籍》</span><strong>顺天时者，吉。</strong><p>顺应时令变化，调整起居与练习强度。</p></div><div class="action-list"><button type="button">早点收尾</button><button type="button">少刷屏</button><button type="button">轻拉伸</button></div><p class="use-result">选择一个今天要做的养生动作。</p>',
    nature: '<p class="tool-use-copy">今天去窗边、楼下或公园接触自然光 10 分钟，不处理消息。</p><div class="action-list"><button type="button">看树 3 分钟</button><button type="button">慢走 10 分钟</button><button type="button">不听课程</button></div><p class="use-result">选择一个自然疗愈动作。</p>',
    sound: '<p class="tool-use-copy">当前音频暂时不可用。你可以先打开雨声、白噪音或古琴声，播放 12 分钟。</p>',
    sleepMeditation: `<p class="tool-use-copy">今晚只做一个短练习：跟着呼吸，把注意力慢慢收回到此刻。</p><div class="sleep-practice-list"><div class="prompt-card sleep-practice-card"><span>5 分钟</span><strong>呼吸专注</strong><p>自然呼吸，不追求放空；走神时轻轻回来。</p>${renderInlineAudio(fallbackMeditationAudioTracks()[0])}</div><div class="prompt-card sleep-practice-card"><span>8 分钟</span><strong>慈心入睡</strong><p>给自己一句温和祝福，让身体知道今天结束了。</p>${renderInlineAudio(fallbackMeditationAudioTracks()[1])}</div><div class="prompt-card sleep-practice-card"><span>10 分钟</span><strong>开放觉察</strong><p>允许念头、声音和身体感受经过，不追着它们走。</p>${renderInlineAudio(fallbackMeditationAudioTracks()[2])}</div></div><p class="use-result">选择一段音频播放，音量调低即可。</p>`,
    painting: '<p class="tool-use-copy">选择一种材料，在画布上按住拖动，让情绪自然流动。</p><div class="sand-playground"><div class="sand-toolbar"><button type="button" data-sand="1">细沙</button><button type="button" data-sand="2">清水</button><button type="button" data-sand="3">绿芽</button><button type="button" data-sand="4">暖光</button><button type="button" data-sand="0">擦除</button><button type="button" data-sand-clear>清空</button></div><canvas class="sand-canvas" width="280" height="170" data-sand-canvas></canvas></div><p class="use-result">选择细沙，按住画布拖动即可。</p>',
    philosophy: '<p class="tool-use-copy">当你想控制结果时，先做一个放下练习。</p><div class="tao-practice-list"><div class="prompt-card tao-card"><span>道家一句</span><strong>上善若水</strong><p>水不争抢，却能顺势前行。今晚先少一点用力。</p></div></div><div class="action-list"><button type="button" data-result="今晚练习：先停一下，看到自己正在用力">觉察抓紧</button><button type="button" data-result="今晚练习：分清现实需要和控制欲">分辨执念</button><button type="button" data-result="今晚练习：呼气时把未完成先放下">呼吸放下</button></div><p class="use-result">选择一个今晚要做的放下动作。</p>',
    western: '<p class="tool-use-copy">今天的问题：这件事里，哪些是事实，哪些只是解释？</p><button class="practice-button" type="button" data-done="已打开记录：我的答案">写下我的答案</button>'
  };
  renderLiveData(fallback[toolKey] || '<p>这个内容当前使用心愈内置练习。</p>');
}

function liveSourceFor(toolKey) {
  const sourceMap = {
    food: '古籍食养',
    seasonal: '古籍依据',
    nature: '自然练习',
    sound: '在线音频库',
    sleepMeditation: '正念冥想',
    painting: '艺术灵感库',
    philosophy: '道家练习',
    western: '哲思短句库',
    tcm: '心愈中医养生知识库'
  };
  return sourceMap[toolKey] || '心愈内置内容';
}

async function loadLiveData(toolKey) {
  const supported = ['food', 'seasonal', 'nature', 'sound', 'sleepMeditation', 'painting', 'philosophy', 'western'];
  if (!supported.includes(toolKey)) {
    renderLiveData(renderBuiltInPractice(toolKey));
    return;
  }

  if (externalCache[toolKey]) {
    renderLiveData(externalCache[toolKey]);
    return;
  }

  try {
    const html = await fetchLiveData(toolKey);
    externalCache[toolKey] = html;
    renderLiveData(html);
  } catch (error) {
    renderLiveFallback(toolKey);
  }
}

function renderBuiltInPractice(toolKey) {
  const practices = {
    tcm: `
      <p class="tool-use-copy">跟着顺序按揉 3 个穴位，每个 1 分钟即可。</p>
      <div class="action-list">
        <button type="button">太冲：脚背大脚趾与二脚趾之间</button>
        <button type="button">内关：手腕横纹上约三指</button>
        <button type="button">膻中：胸口正中，轻轻按揉</button>
      </div>
      <button class="practice-button" type="button">开始 3 分钟按揉</button>
    `,
    philosophy: `
      <p class="tool-use-copy">睡前用一句话收尾，把明天的问题交还给明天。</p>
      <div class="prompt-card">
        <strong>今天到此为止</strong>
        <p>我已经完成了今天能完成的部分，剩下的明天再处理。</p>
      </div>
      <button class="practice-button" type="button">保存这句收尾</button>
    `,
    breath: `
      <p class="tool-use-copy">跟随 4 秒吸气、6 秒呼气，完成 6 轮。</p>
      <div class="breath-circle">呼</div>
      <button class="practice-button" type="button">开始呼吸练习</button>
    `,
  };

  return practices[toolKey] || '<p class="tool-use-copy">选择一个小动作开始，完成后加入“我的心愈”。</p>';
}

async function fetchJson(url) {
  return fetchJsonWithTimeout(url, 1800);
}

async function fetchJsonWithTimeout(url, timeout = 1800) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchAncientBookExcerpt() {
  const cacheKey = 'yangsheng-guide';
  if (externalCache[cacheKey]) {
    return externalCache[cacheKey];
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/xiaopangxia/TCM-Ancient-Books@master/550-%E5%85%BB%E7%94%9F%E5%AF%BC%E5%BC%95%E7%A7%98%E7%B1%8D.txt', {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('gb18030');
    const text = decoder.decode(buffer);
    const excerpt = pickYangshengExcerpt(text);
    externalCache[cacheKey] = excerpt;
    return excerpt;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchFoodTherapyExcerpt() {
  const cacheKey = 'food-therapy-book';
  if (externalCache[cacheKey]) {
    return externalCache[cacheKey];
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch('https://raw.githubusercontent.com/xiaopangxia/TCM-Ancient-Books/master/004-%E9%A3%9F%E7%96%97%E6%9C%AC%E8%8D%89.txt', {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('gb18030');
    const text = decoder.decode(buffer);
    const entries = pickFoodTherapyEntries(text);
    externalCache[cacheKey] = entries;
    return entries;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function pickFoodTherapyEntries(text) {
  const candidateMap = [
    {
      name: '绿豆',
      title: '绿豆清养',
      quote: '补益，和五脏，安精神，行十二经脉。',
      plain: '适合夏季烦热、睡前心里燥时，做成温热绿豆汤，少糖即可。',
      action: '今晚煮一碗温热绿豆汤'
    },
    {
      name: '薯蓣',
      title: '山药养脾',
      quote: '熟煮和蜜，或为汤煎，或为粉，并佳。',
      plain: '适合胃口不稳、恢复力不足时，蒸山药或山药粥更温和。',
      action: '晚餐加一份蒸山药'
    },
    {
      name: '粳米',
      title: '粳米养中',
      quote: '温中益气，补下元。',
      plain: '适合疲惫、胃里空虚或饮食不规律时，用清粥把身体先稳住。',
      action: '明早喝一碗清粥'
    }
  ];

  const entries = candidateMap.map((candidate) => {
    const pattern = new RegExp(`<篇名>${candidate.name}[^\\n]*\\n+内容：([\\s\\S]*?)(?=\\n+<目录>|\\n+<篇名>|$)`);
    const match = text.match(pattern);
    const content = match ? cleanClassicText(match[1]) : '';
    const quote = content.includes(candidate.quote)
      ? candidate.quote
      : content.slice(0, 40);
    return {
      ...candidate,
      quote: quote || foodTherapyFallbackQuote(candidate.name),
      source: '《食疗本草》'
    };
  });

  return entries;
}

function cleanClassicText(text) {
  return text
    .replace(/〔[^〕]*〕/g, '')
    .replace(/（[一二三四五六七八九十]+）/g, '')
    .replace(/[()（）]/g, '')
    .replace(/\s+/g, '')
    .replace(/香港脚/g, '脚气')
    .trim();
}

function foodTherapyFallbackQuote(name) {
  const fallback = {
    绿豆: '补益，和五脏，安精神，行十二经脉。',
    薯蓣: '熟煮和蜜，或为汤煎，或为粉，并佳。',
    粳米: '温中益气，补下元。'
  };
  return fallback[name] || '食养贵在温和、适量、长期。';
}

async function fetchTaoistSurrenderGuide() {
  const cacheKey = 'taoist-surrender-guide';
  if (externalCache[cacheKey]) {
    return externalCache[cacheKey];
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch('https://raw.githubusercontent.com/mcltyl/taoist-surrender-skills/main/skills/taoist-surrender/SKILL.md', {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const guide = pickTaoistSurrenderGuide(text);
    externalCache[cacheKey] = guide;
    return guide;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchMindfulnessMeditationGuide() {
  const cacheKey = 'mindfulness-meditation-guide';
  if (externalCache[cacheKey]) {
    return externalCache[cacheKey];
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch('https://raw.githubusercontent.com/choupiyang/ZAI_SKILLS/main/mindfulness-meditation/SKILL.md', {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    const guide = pickMindfulnessMeditationGuide(text);
    externalCache[cacheKey] = guide;
    return guide;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function pickMindfulnessMeditationGuide(text) {
  const has = (value) => text.includes(value);
  return {
    sessions: [
      {
        title: '呼吸专注',
        duration: has('5 min') ? '5 分钟' : '短练习',
        plain: '把注意力放在自然呼吸上；走神时，不责备自己，轻轻回到下一次呼气。',
        action: '5 分钟呼吸'
      },
      {
        title: '慈心入睡',
        duration: has('Loving-Kindness') ? '8 分钟' : '温和练习',
        plain: '在心里对自己说一句祝福：愿我今晚可以安全休息。',
        action: '8 分钟慈心'
      },
      {
        title: '开放觉察',
        duration: has('Open Awareness') ? '10 分钟' : '安静练习',
        plain: '允许念头、声音和身体感受经过，不追着它们走。',
        action: '10 分钟觉察'
      }
    ],
    tips: [
      '不用追求脑袋空白，发现走神就是练习的一部分。',
      '睡前从 2 到 5 分钟开始，比偶尔做很久更容易坚持。',
      '结束后不再打开工作内容，只保留安静收尾。'
    ]
  };
}

async function fetchMeditationAudioTracks() {
  const data = await fetchJsonWithTimeout('https://de1.api.radio-browser.info/json/stations/search?tag=meditation&limit=6&hidebroken=true&order=clickcount&reverse=true', 5500);
  const labels = [
    ['睡前静心', '适合入睡前播放，音量调低，跟着呼吸慢下来。'],
    ['瑜伽放松', '适合做 8 分钟慈心练习时作为背景声。'],
    ['深睡声景', '适合练习结束后继续安静陪伴。']
  ];
  return (Array.isArray(data) ? data : [])
    .map((station, index) => {
      const streamUrl = station.url_resolved || station.url;
      const label = labels[index] || ['冥想音频', '适合短时放松和睡前收尾。'];
      return streamUrl
        ? { title: label[0], copy: label[1], url: streamUrl }
        : null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function fallbackMeditationAudioTracks() {
  return [
    {
      title: '睡前静心',
      copy: '适合入睡前播放，音量调低，跟着呼吸慢下来。',
      url: 'http://radio.stereoscenic.com/asp-h'
    },
    {
      title: '瑜伽放松',
      copy: '适合做 8 分钟慈心练习时作为背景声。',
      url: 'http://178.32.111.41:8027/stream-128kmp3-YogaChill'
    },
    {
      title: '自然白噪',
      copy: '适合练习结束后继续安静陪伴。',
      url: 'https://stream.zeno.fm/3ac97ysh6f0uv.aac'
    }
  ];
}

function renderAudioCards(tracks) {
  return tracks.map((track) => renderAudioCard(track)).join('');
}

function renderAudioCard(track) {
  return `
    <div class="audio-card">
      <div>
        <strong>${escapeHtml(track.title)}</strong>
        <p>${escapeHtml(track.copy)}</p>
      </div>
      <audio controls preload="none" src="${escapeHtml(track.url)}"></audio>
    </div>
  `;
}

function renderInlineAudio(track) {
  return track?.url
    ? `<audio class="inline-audio" controls preload="none" src="${escapeHtml(track.url)}"></audio>`
    : '';
}

function pickTaoistSurrenderGuide(text) {
  const hasQuote = (quote) => text.includes(quote);
  return [
    {
      title: '无为',
      quote: hasQuote('道常無為而無不為') ? '道常无为而无不为' : '少一点强推，事情反而有路。',
      plain: '不是躺平，而是停止和现实较劲，等身体安静后再行动。',
      action: '先停一下'
    },
    {
      title: '若水',
      quote: hasQuote('上善若水') ? '上善若水，水善利万物而不争。' : '像水一样，顺势而行。',
      plain: '遇到阻力时，先换一个角度，不必立刻证明自己。',
      action: '换个角度'
    },
    {
      title: '柔胜刚',
      quote: hasQuote('天下莫柔弱於水') ? '天下莫柔弱于水，而攻坚强者莫之能胜。' : '柔软不是退让，是不被僵硬困住。',
      plain: '把“必须马上解决”换成“我先做能做的一小步”。',
      action: '松开一点'
    },
    {
      title: '静处行动',
      quote: hasQuote('靜為躁君') ? '静为躁君。' : '先静下来，再决定下一步。',
      plain: '行动可以继续，但不要从恐惧、面子和控制欲里出发。',
      action: '安静行动'
    }
  ];
}

function pickYangshengExcerpt(text) {
  const compact = text.replace(/\s+/g, '');
  const candidates = [
    '侮天时者，凶；顺天时者，吉',
    '闲心荣形，养生之方也',
    '神形早衰，欲与天地长久，非所闻也',
    '饮食过差'
  ];
  const found = candidates.find((item) => compact.includes(item));
  if (!found) {
    return {
      quote: '顺天时者，吉。',
      plain: '顺应时令变化，调整起居与练习强度。',
      source: '《养生导引秘籍》'
    };
  }
  const index = compact.indexOf(found);
  const quote = compact.slice(Math.max(0, index - 8), Math.min(compact.length, index + found.length + 16));
  return {
    quote,
    plain: found.includes('天时')
      ? '节气养生的核心是顺应时令：夏令少耗气，寒令重保暖，夜间练习宜轻缓。'
      : '养生导引强调调心、调身、调息，适合做轻量、持续的小练习。',
    source: '《养生导引秘籍》'
  };
}

async function fetchLiveData(toolKey) {
  if (toolKey === 'food') {
    const entries = await fetchFoodTherapyExcerpt().catch(() => [
      {
        title: '绿豆清养',
        quote: '补益，和五脏，安精神，行十二经脉。',
        plain: '适合夏季烦热、睡前心里燥时，做成温热绿豆汤，少糖即可。',
        action: '今晚煮一碗温热绿豆汤',
        source: '《食疗本草》'
      },
      {
        title: '山药养脾',
        quote: '熟煮和蜜，或为汤煎，或为粉，并佳。',
        plain: '适合胃口不稳、恢复力不足时，蒸山药或山药粥更温和。',
        action: '晚餐加一份蒸山药',
        source: '《食疗本草》'
      },
      {
        title: '粳米养中',
        quote: '温中益气，补下元。',
        plain: '适合疲惫、胃里空虚或饮食不规律时，用清粥把身体先稳住。',
        action: '明早喝一碗清粥',
        source: '《食疗本草》'
      }
    ]);
    return `
      <p class="tool-use-copy">从《食疗本草》中选取温和食材，今晚只做一个轻量选择。</p>
      <div class="food-classic-list">
        ${entries.map((entry) => `
          <div class="classic-card food-classic-card">
            <span>${escapeHtml(entry.source)}</span>
            <strong>${escapeHtml(entry.title)}：${escapeHtml(entry.quote)}</strong>
            <p>${escapeHtml(entry.plain)}</p>
          </div>
        `).join('')}
      </div>
      <div class="action-list">
        ${entries.map((entry) => `<button type="button" data-result="今晚食养：${escapeHtml(entry.action)}">${escapeHtml(entry.action)}</button>`).join('')}
      </div>
      <p class="use-result">选择一个方向，心愈会把它加入今晚提醒。</p>
      <button class="practice-button" type="button" data-done="已加入今晚食养提醒">加入今晚食养提醒</button>
    `;
  }

  if (toolKey === 'seasonal') {
    const book = await fetchAncientBookExcerpt().catch(() => ({
        quote: '顺天时者，吉。',
        plain: '顺应时令变化，调整起居与练习强度。',
        source: '《养生导引秘籍》'
      }));
    return `
      <p class="tool-use-copy">今日为夏至，阳气在外，宜清心、养阳、少耗气。今晚练习做轻、短、慢。</p>
      <div class="classic-card">
        <span>${escapeHtml(book.source)}</span>
        <strong>${escapeHtml(book.quote)}</strong>
        <p>${escapeHtml(book.plain)}</p>
      </div>
      <div class="action-list">
        <button type="button" data-result="今晚计划：早点收尾">早点收尾</button>
        <button type="button" data-result="今晚计划：减少夜间输入">少刷屏</button>
        <button type="button" data-result="今晚计划：做轻拉伸">轻拉伸</button>
      </div>
      <p class="use-result">选择一个今天要做的养生动作。</p>
    `;
  }

  if (toolKey === 'nature') {
    return `
      <p class="tool-use-copy">把注意力交给真实的自然环境，短一点也有效。</p>
      <div class="action-list">
        <button type="button" data-result="自然疗愈：接触自然光">接触自然光</button>
        <button type="button" data-result="自然疗愈：看树 3 分钟">看树 3 分钟</button>
        <button type="button" data-result="自然疗愈：慢走 10 分钟">慢走 10 分钟</button>
      </div>
      <p class="use-result">选择一个自然疗愈动作。</p>
    `;
  }

  if (toolKey === 'philosophy') {
    const guide = await fetchTaoistSurrenderGuide().catch(() => pickTaoistSurrenderGuide('上善若水 道常無為而無不為 天下莫柔弱於水 靜為躁君'));
    return `
      <p class="tool-use-copy">当你想控制结果时，先做一个放下练习：看见抓紧，再从安静处行动。</p>
      <div class="tao-practice-list">
        ${guide.map((item) => `
          <div class="prompt-card tao-card">
            <span>道家一句</span>
            <strong>${escapeHtml(item.title)}：${escapeHtml(item.quote)}</strong>
            <p>${escapeHtml(item.plain)}</p>
          </div>
        `).join('')}
      </div>
      <div class="action-list">
        ${guide.map((item) => `<button type="button" data-result="今晚练习：${escapeHtml(item.action)}">${escapeHtml(item.action)}</button>`).join('')}
      </div>
      <div class="prompt-card tao-question">
        <strong>今晚问自己</strong>
        <p>我是在回应现实，还是在和想象中的结果较劲？</p>
      </div>
      <p class="use-result">选择一个今晚要做的放下动作。</p>
      <button class="practice-button" type="button" data-done="已记录到我的心愈：今晚少一点用力">记录这次练习</button>
    `;
  }

  if (toolKey === 'sleepMeditation') {
    const guide = await fetchMindfulnessMeditationGuide().catch(() => pickMindfulnessMeditationGuide('5 min Loving-Kindness Open Awareness'));
    const tracks = await fetchMeditationAudioTracks().catch(() => fallbackMeditationAudioTracks());
    return `
      <p class="tool-use-copy">睡前只选一个练习，不追求放空大脑；发现走神，再回到呼吸即可。</p>
      <div class="sleep-practice-list">
        ${guide.sessions.map((session, index) => `
          <div class="prompt-card sleep-practice-card">
            <span>${escapeHtml(session.duration)}</span>
            <strong>${escapeHtml(session.title)}</strong>
            <p>${escapeHtml(session.plain)}</p>
            ${renderInlineAudio(tracks[index] || fallbackMeditationAudioTracks()[index])}
          </div>
        `).join('')}
      </div>
      <div class="prompt-card sleep-tip-card">
        <strong>睡前提醒</strong>
        <p>${escapeHtml(guide.tips.join(' '))}</p>
      </div>
      <p class="use-result">选择一段音频播放，音量调低即可。</p>
      <button class="practice-button" type="button" data-done="已记录到我的心愈：今晚完成睡前冥想">记录这次冥想</button>
    `;
  }

  if (toolKey === 'sound') {
    const data = await fetchJson('https://de1.api.radio-browser.info/json/stations/search?tag=meditation&limit=4&hidebroken=true');
    const stations = (Array.isArray(data) ? data : []).slice(0, 3);
    const soundLabels = [
      ['雨夜放松', '适合睡前收尾，音量调低后播放。'],
      ['林间冥想', '适合呼吸练习或安静陪伴。'],
      ['深度睡眠', '适合入睡前 12 分钟安静陪伴。']
    ];
    const audioCards = stations.length
      ? stations.map((station, index) => {
        const label = soundLabels[index] || ['放松声景', '适合短时放松和睡前降噪。'];
        const streamUrl = station.url_resolved || station.url;
        return `
          <div class="audio-card">
            <div>
              <strong>${label[0]}</strong>
              <p>${label[1]}</p>
            </div>
            <audio controls preload="none" src="${escapeHtml(streamUrl)}"></audio>
          </div>
        `;
      }).join('')
      : `
        <div class="audio-card">
          <div>
            <strong>本地声景建议</strong>
            <p>当前未读取到可播放电台，可先使用雨声、白噪音或古琴声。</p>
          </div>
        </div>
      `;
    return `
      <p class="tool-use-copy">选择一个声景，音量调低，播放 12 分钟即可。</p>
      <div class="audio-list">
        ${audioCards}
      </div>
    `;
  }

  if (toolKey === 'painting') {
    const colorData = await fetchJson('https://x-colors.yurace.pro/api/random').catch(() => null);
    const apiColor = colorData?.hex || '#386f9f';
    return `
      <p class="tool-use-copy">选择一种材料，在画布上按住拖动，让情绪自然流动。</p>
      <div class="sand-playground">
        <div class="sand-toolbar">
          <button type="button" data-sand="1">细沙</button>
          <button type="button" data-sand="2">清水</button>
          <button type="button" data-sand="3">绿芽</button>
          <button type="button" data-sand="4">暖光</button>
          <button type="button" data-sand="5" data-sand-color="${escapeHtml(apiColor)}" style="--sand-accent:${escapeHtml(apiColor)}">今日色</button>
          <button type="button" data-sand="0">擦除</button>
          <button type="button" data-sand-clear>清空</button>
        </div>
        <canvas class="sand-canvas" width="280" height="170" data-sand-canvas aria-label="情绪沙画画布"></canvas>
      </div>
      <p class="use-result">选择细沙，按住画布拖动即可。</p>
    `;
  }

  if (toolKey === 'western') {
    const data = await fetchJson('https://dummyjson.com/quotes/random');
    const prompts = [
      ['区分事实', '先把事实和解释分开，情绪会更容易落地。', '这件事里，我真正看见的事实是什么？'],
      ['回到当下', '不要一次解决整个人生，只找下一步能做的小动作。', '我现在能做的最小一步是什么？'],
      ['松开控制', '能控制的事认真做，不能控制的事先放回世界。', '哪些部分已经超出我的控制？']
    ];
    const prompt = prompts[Math.abs(Number(data.id) || 0) % prompts.length];
    return `
      <p class="tool-use-copy">读完这句话，回答下面这个问题，不需要写很多。</p>
      <blockquote>${escapeHtml(prompt[1])}</blockquote>
      <div class="prompt-card">
        <strong>${escapeHtml(prompt[0])}</strong>
        <p>${escapeHtml(prompt[2])}</p>
      </div>
      <button class="practice-button" type="button" data-done="已打开记录：我的一步">写下我的一步</button>
    `;
  }

  return '<p>这个工具当前使用心愈内置内容。</p>';
}

function renderAll() {
  renderAdvice();
  renderPlan();
  renderLogic();
  renderResultPage();
  renderPlaza();
  setScreen(state.screen);
  setView(state.view);
}

qsa('.tab').forEach((button) => {
  button.addEventListener('click', () => setScreen(button.dataset.screen));
});

qsa('.subtab').forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

qs('#switchUser').addEventListener('click', () => {
  if (state.screen === 'plaza') {
    state.featuredIndex += 1;
    state.category = '推荐';
    state.detailOpen = false;
    renderPlaza();
    setScreen('plaza');
  } else {
    state.userIndex = (state.userIndex + 1) % users.length;
    renderAll();
  }
});

renderAll();
