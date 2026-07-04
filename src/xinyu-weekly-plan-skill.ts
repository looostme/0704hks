import {
  generateXinyuHealthDiagnosis,
  type HealingRecommendation,
  type XinyuDiagnosisResult,
  type XinyuHealthInput,
} from "./xinyu-health-diagnosis-skill";

export interface DailyHealthPlan {
  day: number;
  theme: string;
  goal: string;
  tasks: string[];
  healingModule: string;
  checkInQuestion: string;
}

export interface WeeklyHealthPlan {
  scene: XinyuDiagnosisResult["scene"];
  title: string;
  strategy: string;
  days: DailyHealthPlan[];
  weeklyReview: string[];
  safetyNote: string;
}

function getActionByCategory(
  recommendations: HealingRecommendation[],
  category: HealingRecommendation["category"],
  fallback: string,
): string {
  return recommendations.find((item) => item.category === category)?.action || fallback;
}

function buildHealthyWeek(diagnosis: XinyuDiagnosisResult): WeeklyHealthPlan {
  return {
    scene: diagnosis.scene,
    title: "7 日开心补能计划",
    strategy: "你现在的重点不是修复，而是保持好节律、增加轻盈体验、让身体和情绪继续在明亮区间运行。",
    days: [
      {
        day: 1,
        theme: "保持节律",
        goal: "不打乱已经有效的生活节奏",
        tasks: ["固定一个舒服的睡前时间", "晚间减少复杂复盘", "记录今天最顺的一件事"],
        healingModule: "轻量观察",
        checkInQuestion: "今天哪个时刻让我觉得自己状态不错？",
      },
      {
        day: 2,
        theme: "开心补能",
        goal: "主动安排一件让你开心的小事",
        tasks: ["做一件无功利的小事", "听一段喜欢的音乐", "允许自己不优化这 20 分钟"],
        healingModule: "疗愈音乐",
        checkInQuestion: "我今天有没有给快乐留位置？",
      },
      {
        day: 3,
        theme: "自然恢复",
        goal: "让身体接触真实环境",
        tasks: ["户外走 15 分钟", "观察光线、风或树影", "不边走边处理工作消息"],
        healingModule: "自然恢复任务",
        checkInQuestion: "身体在自然里有没有变松一点？",
      },
      {
        day: 4,
        theme: "轻盈食养",
        goal: "吃得舒服，不做过度进补",
        tasks: ["规律吃三餐", "选择一餐热食", "七分饱后停止进食"],
        healingModule: "食养调理",
        checkInQuestion: "今天哪一餐让我觉得身体轻松？",
      },
      {
        day: 5,
        theme: "表达舒展",
        goal: "给情绪一个低压力出口",
        tasks: ["写 5 行自由记录", "不评价文字好坏", "写完后做 3 次慢呼吸"],
        healingModule: "情绪自我照护",
        checkInQuestion: "今天有没有一个真实感受被我看见？",
      },
      {
        day: 6,
        theme: "轻社交连接",
        goal: "保留舒服的人际能量",
        tasks: ["联系一个让你放松的人", "只分享一件小事", "不勉强自己长聊"],
        healingModule: "心愈星球",
        checkInQuestion: "什么样的连接让我不消耗？",
      },
      {
        day: 7,
        theme: "整周复盘",
        goal: "看见稳定与快乐的来源",
        tasks: ["选出本周最有效的 1 个习惯", "保留下周继续做", "奖励自己一次轻松体验"],
        healingModule: "周度能量图",
        checkInQuestion: "我想把哪种好状态带到下周？",
      },
    ],
    weeklyReview: ["本周最稳定的时段是什么？", "哪件小事最补能？", "下周只保留哪一个健康动作？"],
    safetyNote: diagnosis.safetyNote,
  };
}

function buildRiskWeek(diagnosis: XinyuDiagnosisResult): WeeklyHealthPlan {
  return {
    scene: diagnosis.scene,
    title: "安全优先稳定计划",
    strategy: "当前不做复杂疗愈挑战，也不要求自我突破。先确保身边有支持，再做低刺激、低负担的稳定动作。",
    days: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      theme: "安全与稳定",
      goal: "降低风险，获得现实支持",
      tasks: [
        "确认今天可以联系的一位可信任对象",
        "避免长时间独处承受极端情绪",
        "只做补水、进食、洗漱、休息这类基础动作",
      ],
      healingModule: "安全支持清单",
      checkInQuestion: "我现在是否需要立刻联系现实中的人或专业机构？",
    })),
    weeklyReview: ["是否已经联系到可信任的人？", "是否需要预约医院心理科/精神科？", "哪些时段风险最高，需要提前陪伴？"],
    safetyNote: diagnosis.safetyNote,
  };
}

function buildRepairWeek(diagnosis: XinyuDiagnosisResult): WeeklyHealthPlan {
  const sleepAction = getActionByCategory(diagnosis.recommendations, "作息修复", "睡前 60 分钟停止高刺激输入，写下明日清单。");
  const mindAction = getActionByCategory(diagnosis.recommendations, "心理调节", "写下一个反复念头，区分事实、推测和可控动作。");
  const foodAction = getActionByCategory(diagnosis.recommendations, "食养调理", "选择热食，规律进餐，减少冰冷和深夜进食。");
  const bodyAction = getActionByCategory(diagnosis.recommendations, "身体调养", "做 5 分钟肩颈拉伸，力度以舒服为准。");
  const broadAction = getActionByCategory(diagnosis.recommendations, "广义疗愈", "接触自然光或户外空气 10 分钟，只观察身体感觉。");

  return {
    scene: diagnosis.scene,
    title: "7 日身心节律修复计划",
    strategy: "按“睡眠降载 -> 压力出口 -> 食养稳定 -> 身体释放 -> 情绪容器”的顺序推进，每天只做少量动作。",
    days: [
      {
        day: 1,
        theme: "夜间降载",
        goal: "减少睡前脑内推演",
        tasks: [sleepAction, "把未完成事项写到明天，不在床上继续想", "睡前做 3 分钟慢呼吸"],
        healingModule: "睡眠节律修复",
        checkInQuestion: "今晚最需要被放下的一个念头是什么？",
      },
      {
        day: 2,
        theme: "压力拆解",
        goal: "把模糊压力拆成可控动作",
        tasks: [mindAction, "只处理一个最小可控步骤", "暂停对自己的过度追责"],
        healingModule: "认知减压训练",
        checkInQuestion: "这件事里哪些是事实，哪些只是推演？",
      },
      {
        day: 3,
        theme: "温和食养",
        goal: "稳定脾胃和能量感",
        tasks: [foodAction, "晚餐不过饱", "饭后轻走 10 分钟"],
        healingModule: "食养调理",
        checkInQuestion: "今天吃完后身体是更轻还是更沉？",
      },
      {
        day: 4,
        theme: "身体释放",
        goal: "让肩颈和眼脑从紧绷中退出",
        tasks: [bodyAction, "离屏看远 2 分钟", "睡前热敷肩颈或眼周"],
        healingModule: "身体拉伸",
        checkInQuestion: "我身体最紧的地方在哪里？",
      },
      {
        day: 5,
        theme: "情绪容器",
        goal: "建立非暴露式表达出口",
        tasks: ["写一段只给自己看的情绪记录", "标出事实、情绪、需求", "不急着发给任何人"],
        healingModule: "情绪自我照护",
        checkInQuestion: "我真正想被理解的是什么？",
      },
      {
        day: 6,
        theme: "广义疗愈",
        goal: "用自然、休息或哭泣释放系统压力",
        tasks: [broadAction, "允许自己睡一觉或安静待着", "如果想哭，不把它判定为失控"],
        healingModule: "自然恢复任务",
        checkInQuestion: "什么方式让我不用解释也能恢复一点？",
      },
      {
        day: 7,
        theme: "复盘与保留",
        goal: "只留下最有效的恢复动作",
        tasks: ["回看本周能量变化", "选出最有效的 1 个动作", "设定下周继续做 3 次"],
        healingModule: "周度能量图",
        checkInQuestion: "哪一个小动作最值得保留？",
      },
    ],
    weeklyReview: ["睡眠有没有轻微改善？", "反复思考是否更容易停止？", "身体紧绷是否下降？", "下周最应该保留哪个模块？"],
    safetyNote: diagnosis.safetyNote,
  };
}

export function generateXinyuWeeklyPlan(
  input: XinyuHealthInput,
  diagnosis: XinyuDiagnosisResult = generateXinyuHealthDiagnosis(input),
): WeeklyHealthPlan {
  if (diagnosis.scene === "健康稳定") return buildHealthyWeek(diagnosis);
  if (diagnosis.scene === "高风险") return buildRiskWeek(diagnosis);
  return buildRepairWeek(diagnosis);
}

