export type MbtiType =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

export type SocialEnergy = "低" | "中" | "高";
export type LocationType = "线上" | "公共地点";
export type TaskMode = "同城" | "附近" | "线上";

export interface CommunityUser {
  id: string;
  name: string;
  mbti: MbtiType;
  city: string;
  area: string;
  status: string;
  socialEnergy: SocialEnergy;
  boundaries: string[];
  rolesCanOffer: string[];
  rolesNeed: string[];
  completedTaskTags: string[];
  trustScore: number;
  reports: number;
}

export interface CommunityTask {
  id: string;
  title: string;
  ownerId: string;
  ownerMbti: MbtiType;
  city: string;
  area: string;
  statusTags: string[];
  taskTags: string[];
  mode: TaskMode;
  socialEnergy: SocialEnergy;
  locationType: LocationType;
  requiresOffline: boolean;
  acceptsWitness: boolean;
  boundaries: string[];
  createdAt: string;
}

export interface Recommendation<T> {
  item: T;
  score: number;
  explanations: string[];
}
