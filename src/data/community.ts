import type { CommunityTask, CommunityUser, MbtiType } from "../lib/types";

export type PostType = "任务帖" | "普通帖子" | "复盘帖" | "求见证" | "快闪";

export interface CommunityPost {
  id: string;
  type: PostType;
  title: string;
  body: string;
  city: string;
  area: string;
  author: string;
  authorMbti: MbtiType;
  status: string;
  tags: string[];
  actions: number;
  createdAt: string;
  relatedTaskId?: string;
}

export interface PersonalityIsland {
  code: string;
  name: string;
  family: "NT" | "NF" | "SJ" | "SP";
  theme: string;
  line: string;
  recommendedTasks: string[];
  guide: string;
}

export interface TeamCard {
  id: string;
  title: string;
  type: "搭子" | "小队" | "平行房" | "平台快闪";
  city: string;
  area: string;
  members: string;
  socialEnergy: string;
  boundary: string;
  cta: string;
}

export const currentUser: CommunityUser = {
  id: "u-current",
  name: "Tao",
  mbti: "INFP",
  city: "上海",
  area: "徐汇",
  status: "低能量",
  socialEnergy: "低",
  boundaries: ["不私聊", "不拍照", "可线下公共地点"],
  rolesCanOffer: ["轻回应"],
  rolesNeed: ["被见证", "安静陪伴"],
  completedTaskTags: ["低压散步", "安静共坐", "求见证"],
  trustScore: 95,
  reports: 0
};

export const users: CommunityUser[] = [
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
    id: "u-enfp",
    name: "小满",
    mbti: "ENFP",
    city: "上海",
    area: "长宁",
    status: "想出门",
    socialEnergy: "中",
    boundaries: ["可私聊", "不拍照", "可线下公共地点"],
    rolesCanOffer: ["带人出门", "轻松氛围"],
    rolesNeed: ["一起出门"],
    completedTaskTags: ["灵感漫游", "低压散步"],
    trustScore: 90,
    reports: 0
  },
  {
    id: "u-isfj",
    name: "南枝",
    mbti: "ISFJ",
    city: "上海",
    area: "徐汇",
    status: "身体恢复",
    socialEnergy: "低",
    boundaries: ["不私聊", "不拍照", "可线下公共地点"],
    rolesCanOffer: ["生活照料", "安静陪伴"],
    rolesNeed: ["一起散步"],
    completedTaskTags: ["热饭", "低压散步"],
    trustScore: 96,
    reports: 0
  }
];

export const tasks: CommunityTask[] = [
  {
    id: "task-walk",
    title: "20 分钟低压散步",
    ownerId: "u-current",
    ownerMbti: "INFP",
    city: "上海",
    area: "徐汇",
    statusTags: ["低能量", "想出门"],
    taskTags: ["低压散步", "安静陪伴"],
    mode: "附近",
    socialEnergy: "低",
    locationType: "公共地点",
    requiresOffline: true,
    acceptsWitness: true,
    boundaries: ["不私聊", "不拍照", "可线下公共地点"],
    createdAt: "2026-07-04T10:00:00.000Z"
  },
  {
    id: "task-focus",
    title: "25 分钟拖延启动共学",
    ownerId: "u-entj",
    ownerMbti: "ENTJ",
    city: "上海",
    area: "静安",
    statusTags: ["拖延启动"],
    taskTags: ["拖延启动", "共学"],
    mode: "同城",
    socialEnergy: "中",
    locationType: "线上",
    requiresOffline: false,
    acceptsWitness: true,
    boundaries: ["低压监督", "不拍照"],
    createdAt: "2026-07-04T11:00:00.000Z"
  },
  {
    id: "task-cafe",
    title: "咖啡馆安静共坐",
    ownerId: "platform",
    ownerMbti: "INFJ",
    city: "上海",
    area: "徐汇",
    statusTags: ["孤独但不想说话", "低能量"],
    taskTags: ["安静共坐", "低压散步"],
    mode: "附近",
    socialEnergy: "低",
    locationType: "公共地点",
    requiresOffline: true,
    acceptsWitness: false,
    boundaries: ["不私聊", "不拍照", "可线下公共地点"],
    createdAt: "2026-07-04T12:00:00.000Z"
  }
];

export const posts: CommunityPost[] = [
  {
    id: "post-1",
    type: "求见证",
    title: "想整理桌面 10 分钟，有人看见就好",
    body: "不用聊天，结束时给我一个看见你了就可以。",
    city: "上海",
    area: "徐汇",
    author: "南枝",
    authorMbti: "ISFJ",
    status: "拖延启动",
    tags: ["求见证", "整理", "低压"],
    actions: 18,
    createdAt: "15 分钟前",
    relatedTaskId: "task-focus"
  },
  {
    id: "post-2",
    type: "快闪",
    title: "平台快闪：周六低压散步",
    body: "公共公园入口集合，30 分钟路线，不强聊天，可随时退出。",
    city: "上海",
    area: "徐汇",
    author: "平台组织",
    authorMbti: "ENFJ",
    status: "想出门",
    tags: ["平台快闪", "公共地点", "低社交"],
    actions: 42,
    createdAt: "1 小时前",
    relatedTaskId: "task-walk"
  },
  {
    id: "post-3",
    type: "普通帖子",
    title: "低能量日怎么发帖不变成情绪倾倒？",
    body: "我发现写清楚我需要什么，比只说我很糟糕更容易被温柔回应。",
    city: "上海",
    area: "长宁",
    author: "小满",
    authorMbti: "ENFP",
    status: "低能量",
    tags: ["社区讨论", "边界", "轻回应"],
    actions: 26,
    createdAt: "2 小时前"
  }
];

export const islands: PersonalityIsland[] = [
  {
    code: "NT",
    name: "人格开场页",
    family: "NT",
    theme: "紫色星河",
    line: "系统、战略、逻辑与远景。",
    recommendedTasks: ["理性决策清单", "25 分钟深度共学", "把问题拆成三步"],
    guide: "适合用结构化任务降低混乱，避免把他人的感受当成辩题。"
  },
  {
    code: "NF",
    name: "人格开场页",
    family: "NF",
    theme: "绿色森林",
    line: "情感、意义、成长与温柔启动。",
    recommendedTasks: ["20 分钟低压散步", "写下三个真实感受", "找一个轻回应见证者"],
    guide: "适合被理解后再行动，不建议上来就被训话或高压监督。"
  },
  {
    code: "SJ",
    name: "人格开场页",
    family: "SJ",
    theme: "蓝色海岸",
    line: "稳定、秩序、照料与日常恢复。",
    recommendedTasks: ["整理一个角落", "给自己热一顿饭", "睡前降噪 15 分钟"],
    guide: "适合明确流程和稳定节奏，注意不要把照顾别人变成默认义务。"
  },
  {
    code: "SP",
    name: "人格开场页",
    family: "SP",
    theme: "白金暖光",
    line: "体验、行动、身体与当下感。",
    recommendedTasks: ["城市灵感漫游", "轻运动启动", "公共场所短时见面"],
    guide: "适合用真实场景恢复活力，线下任务必须保留退出机制。"
  }
];

export const teams: TeamCard[] = [
  {
    id: "team-walk",
    title: "低压散步小队",
    type: "小队",
    city: "上海",
    area: "徐汇",
    members: "3/6",
    socialEnergy: "低",
    boundary: "不拍照、不强聊、公共路线",
    cta: "加入小队"
  },
  {
    id: "room-focus",
    title: "25 分钟共学平行房",
    type: "平行房",
    city: "上海",
    area: "线上",
    members: "12 人在线",
    socialEnergy: "低",
    boundary: "默认静音，只打开始和结束卡",
    cta: "进入平行房"
  },
  {
    id: "buddy-cafe",
    title: "咖啡馆安静搭子",
    type: "搭子",
    city: "上海",
    area: "徐汇",
    members: "推荐 4 人",
    socialEnergy: "低",
    boundary: "不私聊、不追问、只完成任务",
    cta: "申请搭子"
  },
  {
    id: "flash-saturday",
    title: "周六咖啡馆安静共坐",
    type: "平台快闪",
    city: "上海",
    area: "静安",
    members: "18/24",
    socialEnergy: "低",
    boundary: "平台组织，签到后可随时退出",
    cta: "报名活动"
  }
];
