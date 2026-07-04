import type { CommunityTask, CommunityUser, MbtiType, Recommendation, SocialEnergy } from "./types";

const supportiveByState: Record<string, MbtiType[]> = {
  低能量: ["INFJ", "ENFJ", "INFP", "ISFJ", "ESFJ"],
  焦虑缓冲: ["INFJ", "ENFJ", "INFP", "ISFJ", "ESFJ"],
  拖延启动: ["ENTJ", "ESTJ", "ISTJ", "INTJ", "ENFJ"],
  想出门: ["ENFP", "ESFP", "ESTP", "ENFJ", "ESFJ"],
  灵感恢复: ["ENTP", "ENFP", "INTP", "INFP", "INFJ", "INTJ"],
  边界练习: ["INFJ", "ENFJ", "INTJ", "ISTJ", "ISFJ"]
};

const socialEnergyScore: Record<SocialEnergy, number> = {
  低: 1,
  中: 2,
  高: 3
};

export function getMbtiCompatibility(source: MbtiType, candidate: MbtiType, state?: string) {
  const reasons: string[] = [];
  let score = 0;
  const sourceFamily = source.slice(1, 3);
  const candidateFamily = candidate.slice(1, 3);

  if (sourceFamily === candidateFamily) {
    score += 28;
    reasons.push(`${sourceFamily} 同频`);
  }

  if (source[0] !== candidate[0]) {
    score += 15;
    reasons.push("E/I 温和互补");
  } else {
    score += 6;
    reasons.push("能量节奏相近");
  }

  if (source[3] !== candidate[3]) {
    score += 12;
    reasons.push("J/P 推进-松弛互补");
  } else {
    score += 5;
    reasons.push("生活节奏相近");
  }

  if (state && supportiveByState[state]?.includes(candidate)) {
    score += 20;
    reasons.push(`${state}支持型`);
  }

  return { score: Math.min(score, 100), reasons };
}

export function recommendRecipientsForTask(task: CommunityTask, users: CommunityUser[]) {
  return users
    .filter((user) => passesSafetyFilters(task, user))
    .map((user) => {
      const explanations: string[] = [];
      let score = 0;

      if (user.city === task.city) {
        score += 15;
        explanations.push(user.area === task.area ? "同城/附近" : "同城");
      }

      const tagOverlap = countOverlap(user.completedTaskTags, task.taskTags);
      if (tagOverlap > 0) {
        score += 25 + tagOverlap * 4;
        explanations.push("任务相似");
      }

      if (task.statusTags.includes(user.status)) {
        score += 20;
        explanations.push("状态匹配");
      }

      const mbti = getMbtiCompatibility(task.ownerMbti, user.mbti, task.statusTags[0]);
      score += mbti.score * 0.2;
      explanations.push(...mbti.reasons);

      if (areBoundariesCompatible(task.boundaries, user.boundaries)) {
        score += 10;
        explanations.push("边界兼容");
      }

      score += Math.min(10, user.trustScore / 10);

      return { user, score: Math.round(score), explanations };
    })
    .sort((a, b) => b.score - a.score);
}

export function recommendTasksForUser(user: CommunityUser, tasks: CommunityTask[]) {
  return tasks
    .filter((task) => passesTaskFiltersForUser(user, task))
    .map((task): Recommendation<CommunityTask> => {
      const explanations: string[] = [];
      let score = 0;

      const tagOverlap = countOverlap(user.completedTaskTags, task.taskTags);
      if (tagOverlap > 0) {
        score += 25 + tagOverlap * 5;
        explanations.push("任务相似");
      }

      if (task.statusTags.includes(user.status)) {
        score += 20;
        explanations.push("状态匹配");
      }

      if (task.city === user.city) {
        score += task.area === user.area ? 15 : 10;
        explanations.push(task.area === user.area ? "附近地区" : "同城");
      }

      const energyGap = Math.abs(socialEnergyScore[user.socialEnergy] - socialEnergyScore[task.socialEnergy]);
      score += energyGap === 0 ? 12 : energyGap === 1 ? 6 : 0;

      const mbti = getMbtiCompatibility(user.mbti, task.ownerMbti, user.status);
      score += mbti.score * 0.2;
      explanations.push(...mbti.reasons);

      return { item: task, task, score: Math.round(score), explanations } as Recommendation<CommunityTask> & {
        task: CommunityTask;
      };
    })
    .sort((a, b) => b.score - a.score) as Array<Recommendation<CommunityTask> & { task: CommunityTask }>;
}

function passesSafetyFilters(task: CommunityTask, user: CommunityUser) {
  if (user.reports >= 3 || user.trustScore < 60) return false;
  if (task.requiresOffline && user.city !== task.city) return false;
  if (task.requiresOffline && !user.boundaries.includes("可线下公共地点")) return false;
  if (task.socialEnergy === "低" && user.socialEnergy === "高") return false;
  return areBoundariesCompatible(task.boundaries, user.boundaries);
}

function passesTaskFiltersForUser(user: CommunityUser, task: CommunityTask) {
  if (task.ownerId === user.id) return false;
  if (task.requiresOffline && user.city !== task.city) return false;
  if (task.requiresOffline && !user.boundaries.includes("可线下公共地点")) return false;
  if (task.socialEnergy === "高" && user.socialEnergy === "低") return false;
  return areBoundariesCompatible(task.boundaries, user.boundaries);
}

function areBoundariesCompatible(taskBoundaries: string[], userBoundaries: string[]) {
  if (taskBoundaries.includes("不私聊") && userBoundaries.includes("必须私聊")) return false;
  if (taskBoundaries.includes("不拍照") && userBoundaries.includes("需要拍照")) return false;
  if (taskBoundaries.includes("不接受建议") && userBoundaries.includes("低压监督")) return false;
  return true;
}

function countOverlap(source: string[], target: string[]) {
  const targetSet = new Set(target);
  return source.filter((item) => targetSet.has(item)).length;
}
