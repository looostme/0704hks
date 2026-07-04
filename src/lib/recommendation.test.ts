import { describe, expect, it } from "vitest";
import {
  getMbtiCompatibility,
  recommendRecipientsForTask,
  recommendTasksForUser
} from "./recommendation";
import type { CommunityTask, CommunityUser } from "./types";

const users: CommunityUser[] = [
  {
    id: "u-infj",
    name: "林澈",
    mbti: "INFJ",
    city: "上海",
    area: "徐汇",
    status: "低能量",
    socialEnergy: "低",
    boundaries: ["不私聊", "不拍照", "可线下公共地点"],
    rolesCanOffer: ["安静陪伴", "轻回应"],
    rolesNeed: ["被见证"],
    completedTaskTags: ["低压散步", "安静共坐"],
    trustScore: 92,
    reports: 0
  },
  {
    id: "u-entj",
    name: "许越",
    mbti: "ENTJ",
    city: "上海",
    area: "静安",
    status: "拖延启动",
    socialEnergy: "中",
    boundaries: ["可私聊", "低压监督", "不拍照"],
    rolesCanOffer: ["拆任务", "带动启动"],
    rolesNeed: ["一起共学"],
    completedTaskTags: ["拖延启动", "共学"],
    trustScore: 88,
    reports: 0
  },
  {
    id: "u-estp-risk",
    name: "阿川",
    mbti: "ESTP",
    city: "上海",
    area: "徐汇",
    status: "想出门",
    socialEnergy: "高",
    boundaries: ["可私聊", "可线下公共地点"],
    rolesCanOffer: ["带人出门"],
    rolesNeed: ["一起出门"],
    completedTaskTags: ["城市漫游"],
    trustScore: 42,
    reports: 4
  },
  {
    id: "u-enfp",
    name: "小满",
    mbti: "ENFP",
    city: "杭州",
    area: "西湖",
    status: "灵感恢复",
    socialEnergy: "高",
    boundaries: ["可私聊", "可线下公共地点"],
    rolesCanOffer: ["带人出门", "轻松氛围"],
    rolesNeed: ["一起出门"],
    completedTaskTags: ["灵感漫游", "低压散步"],
    trustScore: 90,
    reports: 0
  }
];

const task: CommunityTask = {
  id: "task-walk",
  title: "20 分钟低压散步",
  ownerId: "u-owner",
  ownerMbti: "INFP",
  city: "上海",
  area: "徐汇",
  statusTags: ["低能量", "想出门"],
  taskTags: ["低压散步", "安静陪伴"],
  mode: "同城",
  socialEnergy: "低",
  locationType: "公共地点",
  requiresOffline: true,
  acceptsWitness: true,
  boundaries: ["不私聊", "不拍照", "可线下公共地点"],
  createdAt: "2026-07-04T10:00:00.000Z"
};

describe("MBTI recommendation logic", () => {
  it("scores same middle letters as same-frequency and opposite edges as gentle-complementary", () => {
    const score = getMbtiCompatibility("INFP", "ENFJ", "低能量");

    expect(score.score).toBeGreaterThan(70);
    expect(score.reasons).toContain("NF 同频");
    expect(score.reasons).toContain("E/I 温和互补");
    expect(score.reasons).not.toContain("天生绝配");
  });

  it("recommends user A's task to safe users with compatible city, boundary, task and MBTI signals", () => {
    const recommendations = recommendRecipientsForTask(task, users);

    expect(recommendations.map((item) => item.user.id)).toEqual(["u-infj"]);
    expect(recommendations[0].explanations.join(" ")).toContain("同城/附近");
    expect(recommendations[0].explanations.join(" ")).toContain("NF 同频");
  });

  it("recommends similar tasks before MBTI-only matches", () => {
    const taskPool: CommunityTask[] = [
      task,
      {
        ...task,
        id: "task-focus",
        title: "25 分钟拖延启动共学",
        ownerMbti: "ENTJ",
        statusTags: ["拖延启动"],
        taskTags: ["拖延启动", "共学"],
        socialEnergy: "中",
        requiresOffline: false,
        boundaries: ["低压监督", "不拍照"]
      },
      {
        ...task,
        id: "task-distant",
        title: "杭州灵感漫游",
        city: "杭州",
        area: "西湖",
        ownerMbti: "ENFP",
        taskTags: ["灵感漫游"],
        statusTags: ["灵感恢复"],
        socialEnergy: "高"
      }
    ];

    const results = recommendTasksForUser(users[1], taskPool);

    expect(results[0].task.id).toBe("task-focus");
    expect(results[0].explanations.join(" ")).toContain("任务相似");
    expect(results.map((result) => result.task.id)).not.toContain("task-distant");
  });

  it("does not recommend a user's own task back to that user", () => {
    const ownTask: CommunityTask = {
      ...task,
      id: "task-own",
      ownerId: "u-entj",
      ownerMbti: "ENTJ",
      statusTags: ["拖延启动"],
      taskTags: ["拖延启动", "共学"],
      requiresOffline: false,
      boundaries: ["低压监督", "不拍照"]
    };

    const results = recommendTasksForUser(users[1], [ownTask]);

    expect(results).toEqual([]);
  });
});
