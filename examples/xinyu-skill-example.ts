import { generateXinyuHealthDiagnosis } from "../src/xinyu-health-diagnosis-skill";
import { generateXinyuWeeklyPlan } from "../src/xinyu-weekly-plan-skill";

const healthyInput = {
  mbti: "INTJ",
  mentalState: {
    anxiety: 2,
    depression: 1,
    stress: 3,
    burnout: 2,
    rumination: 2,
    socialExhaustion: 3,
  },
  bodySignals: {
    sleepQuality: 8,
    energy: 8,
    digestion: 8,
    shoulderNeckTension: 2,
    headacheOrEyeStrain: 2,
  },
  tcmProfile: {
    constitution: ["平和质"],
    patternTendency: [],
  },
  baziProfile: {
    rhythmHint: "适合保持稳定节律，并增加户外与创造性补能。",
  },
  preferences: {
    interestedHealingMethods: ["自然恢复", "疗愈音乐", "食养调理"],
    dailyAvailableMinutes: 15,
  },
};

const problemInput = {
  mbti: "INTJ",
  mentalState: {
    anxiety: 7,
    depression: 4,
    stress: 8,
    burnout: 7,
    rumination: 8,
    socialExhaustion: 6,
  },
  bodySignals: {
    sleepQuality: 4,
    energy: 4,
    digestion: 5,
    shoulderNeckTension: 7,
    headacheOrEyeStrain: 6,
  },
  tcmProfile: {
    constitution: ["气郁质", "痰湿倾向"],
    patternTendency: ["肝郁气滞", "脾虚湿困"],
  },
  baziProfile: {
    rhythmHint: "适合减少夜间消耗，优先建立规律睡眠和低刺激恢复。",
  },
  preferences: {
    interestedHealingMethods: ["正念冥想", "食养调理", "东方哲学", "自然恢复"],
    dailyAvailableMinutes: 20,
  },
};

const riskInput = {
  mbti: "INFJ",
  mentalState: {
    anxiety: 8,
    depression: 9,
    stress: 9,
    burnout: 9,
    rumination: 9,
    socialExhaustion: 8,
    selfHarmIdeation: true,
  },
  bodySignals: {
    sleepQuality: 2,
    energy: 2,
    digestion: 3,
    shoulderNeckTension: 8,
    headacheOrEyeStrain: 7,
  },
  preferences: {
    dailyAvailableMinutes: 5,
  },
};

for (const input of [healthyInput, problemInput, riskInput]) {
  const diagnosis = generateXinyuHealthDiagnosis(input);
  const weeklyPlan = generateXinyuWeeklyPlan(input, diagnosis);

  console.log(JSON.stringify({ diagnosis, weeklyPlan }, null, 2));
}

