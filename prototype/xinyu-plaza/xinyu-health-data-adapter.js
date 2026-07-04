const XINYU_0704HKS_HEALTH_EXAMPLES = [
  {
    session_id: 'session_relationship_001',
    created_at: '2026-07-04T13:25:00+08:00',
    goal: '最近关系里很累，总是怕别人不高兴，想知道自己为什么这样。',
    inputs: [],
    signals: [
      {
        id: 'sig_relationship_psych_001',
        modality: 'text',
        type: 'relationship_pattern',
        value: '关系里经常讨好，害怕冲突和被讨厌',
        raw_text: '我在关系里经常讨好，害怕冲突，也怕别人觉得我麻烦。',
        confidence: 'high',
        dimension_hint: ['psychology', 'mbti']
      },
      {
        id: 'sig_relationship_self_001',
        modality: 'text',
        type: 'self_evaluation',
        value: '怕自己不够好，担心被抛下',
        raw_text: '我总觉得自己不够好，如果不多做一点，对方可能就不想理我。',
        confidence: 'high',
        dimension_hint: ['psychology']
      },
      {
        id: 'sig_relationship_body_001',
        modality: 'text',
        type: 'sleep',
        value: '最近入睡难，睡前反复想白天的对话',
        raw_text: '最近入睡比较难，睡前会反复想白天的对话，担心自己说错话。',
        confidence: 'medium',
        dimension_hint: ['tcm_body', 'psychology']
      }
    ],
    unresolved_questions: [],
    safety_events: []
  },
  {
    session_id: 'session_positive_001',
    created_at: '2026-07-04T13:20:00+08:00',
    goal: '最近状态还不错，想知道怎么保持现在的节奏和行动力。',
    inputs: [],
    signals: [
      {
        id: 'sig_positive_body_001',
        modality: 'text',
        type: 'body_state',
        value: '最近睡眠稳定，醒来比较有精神，运动后恢复也不错',
        raw_text: '最近睡眠稳定，醒来比较有精神，运动后恢复也不错。',
        confidence: 'high',
        dimension_hint: ['tcm_body']
      },
      {
        id: 'sig_positive_psych_001',
        modality: 'text',
        type: 'emotion_state',
        value: '心情平稳，最近能持续推进计划',
        raw_text: '心情比较平稳，最近能持续推进计划，没有明显内耗。',
        confidence: 'high',
        dimension_hint: ['psychology']
      },
      {
        id: 'sig_positive_mbti_001',
        modality: 'text',
        type: 'mbti_known',
        value: 'ENFJ',
        raw_text: '我之前测过大概是 ENFJ，和别人协作时状态更好。',
        confidence: 'user_reported',
        dimension_hint: ['mbti']
      }
    ],
    unresolved_questions: [],
    safety_events: []
  },
  {
    userId: 'structured_problem_001',
    mbti: 'INTJ',
    mentalState: {
      anxiety: 7,
      depression: 4,
      stress: 8,
      burnout: 7,
      rumination: 8,
      socialExhaustion: 6
    },
    bodySignals: {
      sleepQuality: 4,
      energy: 4,
      digestion: 5,
      shoulderNeckTension: 7,
      headacheOrEyeStrain: 6
    },
    tcmProfile: {
      constitution: ['气郁质', '痰湿倾向'],
      patternTendency: ['肝郁气滞', '脾虚湿困']
    },
    baziProfile: {
      rhythmHint: '适合减少夜间消耗，优先建立规律睡眠和低刺激恢复。'
    },
    preferences: {
      interestedHealingMethods: ['正念冥想', '食养调理', '东方哲学', '自然恢复'],
      dailyAvailableMinutes: 20
    }
  }
];

function clampPercent(value, fallback = 50) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function score10(value, fallback = 5) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(10, value));
}

function averageScore(values) {
  const usable = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!usable.length) {
    return 5;
  }
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function compactSignalText(session) {
  return (session.signals || [])
    .map((signal) => [signal.type, signal.value, signal.raw_text, signal.transcript].filter(Boolean).join(' '))
    .join(' ');
}

function detectMbtiFromText(text, fallback = '用户画像') {
  const match = String(text).match(/\b[IE][NS][FT][JP]\b/i);
  return match ? match[0].toUpperCase() : fallback;
}

function includesOne(text, words) {
  return words.some((word) => text.includes(word));
}

function structuredInputToUser(input) {
  const mental = input.mentalState || {};
  const body = input.bodySignals || {};
  const mentalRisk = averageScore([
    score10(mental.anxiety),
    score10(mental.depression),
    score10(mental.stress),
    score10(mental.burnout),
    score10(mental.rumination),
    score10(mental.socialExhaustion)
  ]);
  const bodyLoad = averageScore([
    10 - score10(body.sleepQuality),
    10 - score10(body.energy),
    10 - score10(body.digestion),
    score10(body.shoulderNeckTension),
    score10(body.headacheOrEyeStrain)
  ]);
  const rhythm = score10(body.sleepQuality) * 10;
  const support = clampPercent(100 - score10(mental.socialExhaustion, 5) * 8, 55);
  const hasSleepIssue = score10(body.sleepQuality, 7) <= 5 || score10(mental.rumination, 0) >= 7;
  const hasBodyTension = score10(body.shoulderNeckTension, 0) >= 6 || score10(body.headacheOrEyeStrain, 0) >= 6;
  const hasAppetiteIssue = score10(body.digestion, 7) <= 5 || score10(body.appetite, 7) <= 5;

  return {
    type: input.mbti || '用户画像',
    diagnosisName: hasSleepIssue ? '高负荷节律失衡' : '身心节律观察型',
    risk: mental.selfHarmIdeation ? '高风险' : mentalRisk >= 7 ? '中高风险' : '低到中风险',
    diagnosisSummary: hasSleepIssue
      ? '当前重点是睡眠恢复、夜间反刍和身体紧绷，适合先做低刺激收尾。'
      : '当前可从节律、身体能量和轻量疗愈中找到更稳定的恢复方式。',
    energyTitle: hasSleepIssue ? '心理负荷高，睡眠恢复偏低' : '节律可维护，适合轻量补能',
    energyCopy: input.baziProfile?.rhythmHint || '根据健康输入生成广场推荐顺序。',
    metrics: {
      mind: clampPercent(mentalRisk * 10),
      body: clampPercent(bodyLoad * 10),
      rhythm: clampPercent(rhythm),
      support
    },
    dimensions: [
      ['心理状态', hasSleepIssue ? '反复思考 + 压力偏高' : '情绪较稳定', '来自 0704hks mentalState 结构化输入。'],
      ['身体问题', hasBodyTension ? '肩颈紧 + 睡眠恢复不足' : '身体状态可维护', '来自 0704hks bodySignals 结构化输入。'],
      ['八字判断', input.baziProfile?.rhythmHint || '用于节律观察，不作医学判断。', '只用于生活方式和节律叙事。'],
      ['MBTI 判断', input.mbti || '未提供', '用于调整推荐表达方式。']
    ],
    plans: [
      ['Day 1', '睡前降载', hasSleepIssue ? '睡前停止高刺激输入，播放冥想音频。' : '保留低刺激睡前收尾。'],
      ['Day 2', '身体松解', hasBodyTension ? '做穴位按揉或肩颈放松。' : '做 10 分钟自然慢走。'],
      ['Day 3', '食养稳定', hasAppetiteIssue ? '晚餐温热清淡，减少刺激。' : '保持七分饱和规律饮食。']
    ],
    modules: [
      ['睡前冥想', '正念入睡', '根据睡眠和反刍信号推荐。'],
      ['穴位按揉', '身体松解', '根据肩颈和眼脑负荷推荐。'],
      ['药食同源', '食养稳定', '根据消化和能量信号推荐。']
    ],
    priorities: [
      ['1', hasSleepIssue ? '睡眠节律修复' : '保持节律', '先处理夜间恢复窗口。'],
      ['2', hasBodyTension ? '身体紧绷调养' : '轻量补能', '把练习控制在低负担范围。'],
      ['3', '长期方案微调', '根据执行反馈调整推荐顺序。']
    ],
    logic: [
      ['数据来源', '来自 looostme/0704hks 的健康输入结构。'],
      ['推荐规则', '心理、身体、节律、支持四项指标进入广场排序。'],
      ['安全边界', '只做健康管理建议，不做医疗诊断。']
    ],
    rawHealthData: input
  };
}

function intakeSessionToUser(session) {
  const text = compactSignalText(session);
  const isPositive = includesOne(text, ['稳定', '有精神', '平稳', '没有明显内耗', '恢复也不错']);
  const sleepIssue = includesOne(text, ['睡不好', '入睡难', '睡前', '多梦', '睡眠']);
  const rumination = includesOne(text, ['反复想', '拖延', '担心', '怕做不好', '看低', '说错话']);
  const relationship = includesOne(text, ['讨好', '冲突', '被讨厌', '关系', '不够好', '抛下']);
  const mbti = detectMbtiFromText(text, relationship ? 'INFJ' : '用户画像');

  const metrics = isPositive
    ? { mind: 28, body: 24, rhythm: 82, support: 76 }
    : {
      mind: rumination || relationship ? 80 : 62,
      body: sleepIssue ? 58 : 42,
      rhythm: sleepIssue ? 35 : 55,
      support: relationship ? 38 : 50
    };

  return {
    type: mbti,
    diagnosisName: isPositive ? '稳定节律保持型' : relationship ? '关系压力型身心消耗' : '保护性内耗型身心失衡',
    risk: isPositive ? '低风险' : '低到中风险',
    diagnosisSummary: isPositive
      ? '你当前状态较稳定，适合维持节律、补充开心体验和轻量探索。'
      : relationship
        ? '你当前更像在关系里长期照顾他人感受，睡前反刍和支持感不足一起出现。'
        : '你当前容易在重要任务前反复推演，睡眠和行动力受到影响。',
    energyTitle: isPositive ? '恢复状态稳定，适合保持' : '心理消耗偏高，恢复窗口不足',
    energyCopy: session.goal || '根据 0704hks intake signals 生成当前状态。',
    metrics,
    dimensions: [
      ['心理状态', isPositive ? '心情平稳 + 行动力稳定' : relationship ? '讨好倾向 + 害怕冲突' : '拖延 + 评价担心', '来自 0704hks signals 的心理线索。'],
      ['身体问题', sleepIssue ? '入睡难 + 睡前反刍' : '睡眠和精力较稳定', '来自 0704hks signals 的身体线索。'],
      ['八字判断', '当前样例未提供完整出生信息', '缺失时只做节律观察，不强行推断。'],
      ['MBTI 判断', mbti, '来自用户自述或 signals 偏好线索。']
    ],
    plans: [
      ['Day 1', isPositive ? '开心补能' : '睡前降噪', isPositive ? '安排一件轻松开心的小事。' : '睡前播放冥想音频，停止复盘对话。'],
      ['Day 2', relationship ? '边界练习' : '自然恢复', relationship ? '写下一件今天不继续承担的事。' : '接触自然光或慢走 10 分钟。'],
      ['Day 3', '稳定食养', '晚餐温热清淡，保持身体稳定。']
    ],
    modules: [
      isPositive ? ['自然疗愈', '开心补能', '状态稳定时优先补充正向体验。'] : ['睡前冥想', '正念入睡', '睡前反刍时优先恢复节律。'],
      relationship ? ['情绪绘画', '低暴露表达', '不想说出来时先用图像承接情绪。'] : ['疗愈音乐', '低刺激声景', '降低夜间输入强度。'],
      ['药食同源', '食养稳定', '用温和饮食保持恢复窗口。']
    ],
    priorities: [
      ['1', isPositive ? '保持节律' : '睡眠和夜间反刍', isPositive ? '不制造问题，先保持已有节奏。' : '先让夜间大脑停止继续工作。'],
      ['2', relationship ? '关系边界' : '身体稳定', relationship ? '减少过度承担。' : '用低负担动作恢复身体。'],
      ['3', '长期追踪', '根据完成度调整广场排序。']
    ],
    logic: [
      ['输入结构', '读取 0704hks MultimodalIntakeSession。'],
      ['信号提取', '从 signals 的 value/raw_text/transcript 识别睡眠、心理、身体和 MBTI 线索。'],
      ['广场排序', '将线索转换为 mind/body/rhythm/support 四项指标。']
    ],
    rawHealthData: session
  };
}

function normalize0704HksHealthData(input) {
  if (input?.signals && Array.isArray(input.signals)) {
    return intakeSessionToUser(input);
  }
  if (input?.mentalState || input?.bodySignals) {
    return structuredInputToUser(input);
  }
  throw new Error('Unsupported 0704hks health data format');
}

function buildUsersFrom0704HksExamples(examples = XINYU_0704HKS_HEALTH_EXAMPLES) {
  return examples.map((example) => normalize0704HksHealthData(example));
}

async function fetch0704HksHealthData(url, options = {}) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    ...options
  });
  if (!response.ok) {
    throw new Error(`0704hks health data request failed: ${response.status}`);
  }
  return normalize0704HksHealthData(await response.json());
}

window.XinyuHealthDataAdapter = {
  examples: XINYU_0704HKS_HEALTH_EXAMPLES,
  normalize: normalize0704HksHealthData,
  buildUsersFromExamples: buildUsersFrom0704HksExamples,
  fetchHealthData: fetch0704HksHealthData
};
