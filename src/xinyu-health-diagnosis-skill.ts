export type MbtiType =
  | "INTJ"
  | "INTP"
  | "INFJ"
  | "INFP"
  | "ENTJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | string;

export type Severity = "low" | "medium" | "high";
export type DiagnosisScene = "健康稳定" | "问题修复" | "高风险";

export interface XinyuHealthInput {
  userId?: string;
  mbti: MbtiType;
  mentalState: {
    anxiety?: number;
    depression?: number;
    stress?: number;
    burnout?: number;
    rumination?: number;
    socialExhaustion?: number;
    selfHarmIdeation?: boolean;
    notes?: string[];
  };
  bodySignals: {
    sleepQuality?: number;
    energy?: number;
    digestion?: number;
    shoulderNeckTension?: number;
    headacheOrEyeStrain?: number;
    coldHandsFeet?: number;
    appetite?: number;
    notes?: string[];
  };
  tcmProfile?: {
    constitution?: string[];
    patternTendency?: string[];
    symptoms?: string[];
  };
  baziProfile?: {
    energyNarrative?: string;
    rhythmHint?: string;
    elementBias?: string;
  };
  preferences?: {
    interestedHealingMethods?: string[];
    avoidMethods?: string[];
    dailyAvailableMinutes?: number;
  };
}

export interface HealingRecommendation {
  category: "心理调节" | "食养调理" | "作息修复" | "身体调养" | "广义疗愈";
  title: string;
  reason: string;
  action: string;
}

export interface XinyuDiagnosisResult {
  scene: DiagnosisScene;
  severity: Severity;
  title: string;
  aiSummary: string;
  conclusion: string;
  energyMap: {
    mind: number;
    body: number;
    sleep: number;
    recovery: number;
  };
  priorities: string[];
  recommendations: HealingRecommendation[];
  featuredModules: string[];
  safetyNote: string;
}

function clampScore(value: number | undefined, fallback = 5): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(10, value));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getPresentationStyle(mbti: MbtiType): {
  tone: string;
  modules: string[];
} {
  const type = String(mbti || "").toUpperCase();

  if (type === "INTJ") {
    return {
      tone: "结构化、低噪音、先结论后行动",
      modules: ["认知减压训练", "睡眠节律修复", "东方哲学观照", "自然恢复任务"],
    };
  }

  if (type === "INFJ") {
    return {
      tone: "温和、有边界、重视情绪容器",
      modules: ["情绪书写", "正念冥想", "自然恢复任务", "睡眠声景"],
    };
  }

  if (type === "INFP") {
    return {
      tone: "感受友好、允许表达、重视创造性释放",
      modules: ["疗愈音乐", "自由书写", "艺术观照", "自然恢复任务"],
    };
  }

  if (type === "ENTJ") {
    return {
      tone: "目标清晰、强调恢复效率和节奏管理",
      modules: ["压力卸载计划", "身体拉伸", "睡眠节律修复", "认知减压训练"],
    };
  }

  return {
    tone: "清晰、温和、可执行",
    modules: ["正念冥想", "食养调理", "身体拉伸", "情绪自我照护"],
  };
}

function detectScene(input: XinyuHealthInput): {
  scene: DiagnosisScene;
  severity: Severity;
  riskScore: number;
} {
  const mental = input.mentalState;
  const body = input.bodySignals;

  const mentalRisk = average([
    clampScore(mental.anxiety),
    clampScore(mental.depression),
    clampScore(mental.stress),
    clampScore(mental.burnout),
    clampScore(mental.rumination),
    clampScore(mental.socialExhaustion),
  ]);

  const bodyRisk = average([
    10 - clampScore(body.sleepQuality),
    10 - clampScore(body.energy),
    10 - clampScore(body.digestion),
    clampScore(body.shoulderNeckTension),
    clampScore(body.headacheOrEyeStrain),
  ]);

  const riskScore = Math.round(mentalRisk * 0.6 + bodyRisk * 0.4);
  const hasHighRiskSignal =
    Boolean(mental.selfHarmIdeation) ||
    clampScore(mental.depression, 0) >= 9 ||
    clampScore(body.sleepQuality, 10) <= 2;

  if (hasHighRiskSignal) {
    return { scene: "高风险", severity: "high", riskScore };
  }

  if (riskScore <= 3 && clampScore(body.energy) >= 7 && clampScore(body.sleepQuality) >= 7) {
    return { scene: "健康稳定", severity: "low", riskScore };
  }

  if (riskScore >= 7) {
    return { scene: "问题修复", severity: "high", riskScore };
  }

  return { scene: "问题修复", severity: "medium", riskScore };
}

function buildEnergyMap(input: XinyuHealthInput) {
  const mental = input.mentalState;
  const body = input.bodySignals;

  return {
    mind: Math.round(10 - average([
      clampScore(mental.anxiety),
      clampScore(mental.stress),
      clampScore(mental.rumination),
    ])),
    body: Math.round(average([
      clampScore(body.energy),
      clampScore(body.digestion),
      10 - clampScore(body.shoulderNeckTension),
    ])),
    sleep: Math.round(clampScore(body.sleepQuality)),
    recovery: Math.round(10 - average([
      clampScore(mental.burnout),
      10 - clampScore(body.energy),
      10 - clampScore(body.sleepQuality),
    ])),
  };
}

function pickPriorities(input: XinyuHealthInput, scene: DiagnosisScene): string[] {
  if (scene === "健康稳定") {
    return ["保持当前节律", "增加开心补能", "轻量观察身心变化"];
  }

  if (scene === "高风险") {
    return ["先保证安全和支持", "降低独处风险", "联系专业帮助"];
  }

  const priorities: string[] = [];
  const mental = input.mentalState;
  const body = input.bodySignals;

  if (clampScore(body.sleepQuality) <= 5 || clampScore(mental.rumination) >= 7) {
    priorities.push("先修复睡眠和夜间反刍");
  }
  if (clampScore(mental.stress) >= 7 || clampScore(mental.burnout) >= 7) {
    priorities.push("降低系统负荷，建立压力出口");
  }
  if (clampScore(body.digestion) <= 5 || input.tcmProfile?.patternTendency?.some((item) => item.includes("脾"))) {
    priorities.push("用温和食养稳定脾胃和能量");
  }
  if (clampScore(body.shoulderNeckTension) >= 6 || clampScore(body.headacheOrEyeStrain) >= 6) {
    priorities.push("释放肩颈和眼脑过载");
  }

  return priorities.slice(0, 3).length ? priorities.slice(0, 3) : ["稳定作息", "降低压力", "建立低成本疗愈习惯"];
}

function buildRecommendations(input: XinyuHealthInput, scene: DiagnosisScene): HealingRecommendation[] {
  if (scene === "健康稳定") {
    return [
      {
        category: "广义疗愈",
        title: "开心补能任务",
        reason: "你的整体状态较稳定，此时更适合把疗愈变成轻松的正向体验，而不是继续找问题。",
        action: "今天安排一件纯粹让你开心的小事：晒太阳、散步、看展、见喜欢的人，任选一个即可。",
      },
      {
        category: "作息修复",
        title: "保持当前睡眠节律",
        reason: "稳定节律本身就是最重要的健康资产，不需要为了优化而打乱它。",
        action: "保留固定入睡前 30 分钟的低刺激时间，少做复杂复盘。",
      },
      {
        category: "食养调理",
        title: "轻盈食养",
        reason: "健康状态下食疗不需要过度进补，重点是清爽、规律和舒服。",
        action: "今天选择一餐七分饱，搭配温热主食、优质蛋白和一份蔬菜。",
      },
    ];
  }

  if (scene === "高风险") {
    return [
      {
        category: "心理调节",
        title: "安全优先",
        reason: "当前信号已经超过普通健康建议适用范围，需要先确保你不是一个人硬扛。",
        action: "请尽快联系可信任的人，或联系当地心理危机热线/医院心理科/精神科获得支持。",
      },
      {
        category: "作息修复",
        title: "降低夜间刺激",
        reason: "严重失眠或极端情绪会放大风险，先减少继续消耗。",
        action: "今晚不做深度自我分析，只做简单洗漱、补水、躺下休息，并让身边人知道你的状态。",
      },
    ];
  }

  return [
    {
      category: "心理调节",
      title: "反刍终止练习",
      reason: "你的压力更像持续脑内推演，核心不是想得不够，而是缺少停止机制。",
      action: "写下一个反复出现的念头，标注它是事实、推测还是担心，再只选一个可控动作。",
    },
    {
      category: "食养调理",
      title: "温和食养支持",
      reason: "当压力和睡眠影响身体时，脾胃与能量感通常会先下降，食养应以稳定为主。",
      action: "优先选择热食、规律进餐，减少冰冷、重油、过甜和深夜进食。",
    },
    {
      category: "作息修复",
      title: "睡前降载",
      reason: "夜间脑过载会削弱恢复力，先把大脑从任务模式切换出来。",
      action: "睡前 60 分钟停止高刺激输入，把未完成事项写入明日清单，不在床上继续推演。",
    },
    {
      category: "身体调养",
      title: "肩颈与眼脑释放",
      reason: "脑力工作者常把压力累积在肩颈、眼部和头部，身体放松会反向降低心理紧绷。",
      action: "做 5 分钟肩颈拉伸，配合按揉太阳穴、风池或内关，力度以舒服为准。",
    },
    {
      category: "广义疗愈",
      title: "自然恢复任务",
      reason: "疗愈不只发生在工具里，睡觉、哭、散步、晒太阳、靠近自然都可以帮助系统回到正常节律。",
      action: "今天找 10 分钟接触自然光或户外空气，不听课、不复盘，只观察身体感觉。",
    },
  ];
}

export function generateXinyuHealthDiagnosis(input: XinyuHealthInput): XinyuDiagnosisResult {
  const { scene, severity, riskScore } = detectScene(input);
  const style = getPresentationStyle(input.mbti);
  const energyMap = buildEnergyMap(input);
  const priorities = pickPriorities(input, scene);
  const recommendations = buildRecommendations(input, scene);
  const tcmText = input.tcmProfile?.patternTendency?.join("、") || "暂未发现明显体质偏向";
  const rhythmHint = input.baziProfile?.rhythmHint || "适合以稳定节律和低成本恢复作为长期观察方向";

  if (scene === "健康稳定") {
    return {
      scene,
      severity,
      title: "状态明亮稳定，适合继续扩展你的好能量",
      aiSummary: `从当前结果看，你的心理压力、身体能量和睡眠恢复整体处在较好的区间。心愈不会为了制造焦虑而放大问题，你现在更适合保持节律、增加开心补能，并探索让生活更有光感的疗愈方式。`,
      conclusion: `当前建议不是“修复问题”，而是守住好状态。基于 ${style.tone} 的呈现方式，你可以把健康管理做得轻一点：睡好、吃舒服、去自然里走走、保留让你开心的连接。`,
      energyMap,
      priorities,
      recommendations,
      featuredModules: ["开心补能", "自然恢复任务", "轻盈食养", ...style.modules].slice(0, 5),
      safetyNote: "",
    };
  }

  if (scene === "高风险") {
    return {
      scene,
      severity,
      title: "当前需要先把安全和专业支持放在第一位",
      aiSummary: `你的输入中出现了高风险信号，已经不适合只依赖 App 内的普通疗愈建议。此时最重要的不是继续分析原因，而是让自己尽快获得现实中的支持和专业帮助。`,
      conclusion: `心愈可以陪你做基础稳定，但不能替代心理危机干预或医生诊疗。请优先联系可信任的人、当地心理危机热线，或前往医院心理科/精神科。`,
      energyMap,
      priorities,
      recommendations,
      featuredModules: ["安全支持清单", "夜间稳定模式", "呼吸安定练习"],
      safetyNote: "如果你正在考虑伤害自己或已经无法保证安全，请立即联系当地急救电话、心理危机热线，或前往最近的急诊/医院寻求帮助。",
    };
  }

  return {
    scene,
    severity,
    title: riskScore >= 7 ? "系统高负载，需要先降噪再修复" : "轻中度失衡，适合用 7 天计划拉回节律",
    aiSummary: `你的状态更像长期高负载后的身心联动失衡：心理上容易反复推演、紧绷或疲惫，身体上可能表现为睡眠浅、肩颈紧、消化和能量波动。中医养生倾向可参考：${tcmText}。`,
    conclusion: `下一步不建议同时做很多事，而是按照“先睡眠、再压力、再身体、最后表达出口”的顺序推进。结合 ${style.tone} 的方式，方案会以清晰计划和低打扰任务为主。八字能量提示可作为节律观察：${rhythmHint}。`,
    energyMap,
    priorities,
    recommendations,
    featuredModules: [...style.modules, "食养调理", "情绪自我照护"].slice(0, 6),
    safetyNote: "",
  };
}

