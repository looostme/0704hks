import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flag,
  HeartHandshake,
  Map,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  currentUser,
  islands,
  posts as seedPosts,
  tasks as seedTasks,
  teams,
  users,
  type CommunityPost,
  type PostType
} from "./data/community";
import { recommendRecipientsForTask, recommendTasksForUser } from "./lib/recommendation";
import type { CommunityTask } from "./lib/types";

type Section = "任务广场" | "人格岛" | "搭子 / 小队";
type FeedTab = "推荐" | "同城" | "附近" | "任务" | "帖子" | "快闪";
type PublishDraft = {
  type: PostType;
  title: string;
  body: string;
  status: string;
  socialEnergy: "低" | "中" | "高";
  anonymous: boolean;
};

type EnhancedPost = CommunityPost & {
  recommendations?: string[];
  recommendationReasons?: string[];
};

type RealmFamily = "NT" | "NF" | "SJ" | "SP";

type DetailItem = {
  eyebrow: string;
  title: string;
  body: string;
  meta: string[];
  tags: string[];
  primaryAction: string;
  secondaryAction: string;
};

const navItems: Section[] = ["任务广场", "人格岛", "搭子 / 小队"];
const feedTabs: FeedTab[] = ["推荐", "同城", "附近", "任务", "帖子", "快闪"];
const publishTypes: PostType[] = ["任务帖", "普通帖子", "复盘帖", "求见证", "快闪"];
const boundaryTags = ["不私聊", "不拍照", "可线下公共地点", "不接受建议", "可随时退出"];
const cognitionIcons = [ShieldCheck, MessageCircle, Sparkles, Users];
const taskEntryCards = [
  {
    eyebrow: "同城任务",
    title: "同城/附近的人和任务事件",
    body: "把首页承接过来的同城、附近用户和任务事件集中浏览，优先看公共地点、低压参与、可退出任务。",
    cta: "浏览附近事件"
  },
  {
    eyebrow: "诊断书任务",
    title: "查看其他人的诊断书中的任务",
    body: "从他人的人格诊断书里查看可参与的疗愈任务，先看边界、状态和任务目标，再决定是否加入。",
    cta: "查看诊断书任务"
  }
];
const partnerActions = ["找搭子", "发布找搭子", "小队招募", "平行房", "线下快闪报名"];
const tabDescriptions: Record<FeedTab, string> = {
  推荐: "按任务相似、状态、距离与 MBTI 沟通节奏综合排序。",
  同城: "展示上海范围内可以参与的任务、帖子和活动。",
  附近: "优先展示徐汇附近公共地点可参与的内容。",
  任务: "只看带明确目标、边界和参与动作的任务帖。",
  帖子: "浏览社区讨论、求见证和轻回应内容。",
  快闪: "查看平台组织的短时、公共地点、可退出活动。"
};
const tabFunctionPanels: Record<
  FeedTab,
  {
    eyebrow: string;
    title: string;
    body: string;
    actions: string[];
    points: string[];
    sideTitle: string;
    sideItems: string[];
  }
> = {
  推荐: {
    eyebrow: "算法承接",
    title: "推荐匹配台",
    body: "只处理适合你的任务和人：相似任务、可接受边界、同城距离和 MBTI 沟通节奏会一起参与排序。",
    actions: ["查看推荐逻辑", "刷新推荐池"],
    points: ["相似任务优先", "边界冲突降权", "低社交强度优先"],
    sideTitle: "推荐给你",
    sideItems: ["相似任务", "合适的人", "低风险加入"]
  },
  同城: {
    eyebrow: "城市承接",
    title: "同城事件地图",
    body: "只看上海范围内能被线下或线上参与的任务事件，重点处理城市级活动、公共地点和同城发起人。",
    actions: ["查看上海任务", "发布同城事件"],
    points: ["城市范围筛选", "公共地点优先", "同城发起人露出"],
    sideTitle: "同城参与规则",
    sideItems: ["先看地点", "再看边界", "最后决定加入"]
  },
  附近: {
    eyebrow: "附近承接",
    title: "附近可参与清单",
    body: "只看你附近地区能低压参与的任务，默认把距离、安全边界和可退出机制放在前面。",
    actions: ["查看徐汇附近", "设置附近范围"],
    points: ["徐汇优先", "可随时退出", "线下公共地点"],
    sideTitle: "附近安全筛选",
    sideItems: ["不私聊", "不拍照", "不去私密地点"]
  },
  任务: {
    eyebrow: "诊断书承接",
    title: "诊断书任务库",
    body: "只看别人诊断书里沉淀出的疗愈任务，围绕任务目标、适合状态和参与动作做浏览。",
    actions: ["筛选任务目标", "查看任务边界"],
    points: ["目标明确", "步骤清楚", "可被见证"],
    sideTitle: "任务筛选器",
    sideItems: ["按状态筛", "按 MBTI 节奏筛", "按地点筛"]
  },
  帖子: {
    eyebrow: "讨论承接",
    title: "疗愈讨论区",
    body: "只放非任务型内容：经验分享、求见证、轻回应和社区讨论，不承担找搭子和活动报名。",
    actions: ["发普通帖子", "求轻回应"],
    points: ["轻回应", "经验分享", "不变成诊断"],
    sideTitle: "帖子互动规则",
    sideItems: ["不追问隐私", "不替人诊断", "先回应再建议"]
  },
  快闪: {
    eyebrow: "平台组织",
    title: "平台快闪报名台",
    body: "只承接平台组织的短时线下活动，突出报名、集合地点、活动时长和退出机制。",
    actions: ["查看快闪日程", "报名线下快闪"],
    points: ["平台组织", "短时活动", "公共地点集合"],
    sideTitle: "快闪报名须知",
    sideItems: ["报名后显示地点", "30 分钟内可退出", "平台审核领队"]
  }
};
const realmDesigns: Record<
  RealmFamily,
  {
    pairing: string;
    role: string;
    summary: string;
    dimensions: Array<{ title: string; body: string }>;
    energy: Array<{ label: string; value: string }>;
    actions: string[];
  }
> = {
  NT: {
    pairing: "直觉 × 思考",
    role: "你是战略的构建者，思想的远见者。",
    summary: "你在寻找更清晰的系统，也需要被允许安静地推演。",
    dimensions: [
      { title: "逻辑核心", body: "把问题拆成结构，再决定行动。" },
      { title: "远景映射", body: "看见更远的路径，不急着被情绪带走。" },
      { title: "自我校准", body: "允许自己先验证，再回应他人。" },
      { title: "能量边界", body: "减少无效争辩，保留深度思考空间。" }
    ],
    energy: [
      { label: "思维洞察", value: "75%" },
      { label: "执行促成", value: "30%" },
      { label: "内在稳定", value: "55%" },
      { label: "情感感知", value: "40%" }
    ],
    actions: ["深度思考", "记录关键假设", "验证最小步骤", "知取假设", "推进实验"]
  },
  NF: {
    pairing: "直觉 × 情感",
    role: "你是意义的探寻者，心灵的倾听者。",
    summary: "你在用心连接世界，也需要照顾好自己的内心。",
    dimensions: [
      { title: "情绪锚点", body: "先确认此刻感受，再决定是否回应。" },
      { title: "共情能力", body: "理解他人前，先确认自己的需求。" },
      { title: "理想愿景", body: "把心中方向转成一个低压行动。" },
      { title: "能量承载", body: "高共感时保留退出和静默空间。" }
    ],
    energy: [
      { label: "你在认可", value: "75%" },
      { label: "行动实践", value: "30%" },
      { label: "行动决策", value: "30%" },
      { label: "其他感知", value: "60%" }
    ],
    actions: ["倾听内心", "表达感受", "帮助他人", "创造价值", "自我关怀"]
  },
  SJ: {
    pairing: "感觉 × 判断",
    role: "你是秩序的守护者，可靠的执行者。",
    summary: "你在用秩序守护世界，也需要给自己一些灵活的空间。",
    dimensions: [
      { title: "责任边界", body: "先分清自己的事，再决定照顾范围。" },
      { title: "细节关注", body: "用稳定步骤减少消耗和反复确认。" },
      { title: "秩序构建", body: "把日常恢复做成可重复的小流程。" },
      { title: "能量恢复", body: "让休息成为计划的一部分。" }
    ],
    energy: [
      { label: "责任担当", value: "75%" },
      { label: "适应灵活", value: "30%" },
      { label: "执行能力", value: "55%" },
      { label: "细节关注", value: "60%" }
    ],
    actions: ["制定计划", "完成任务", "优化流程", "关注细节", "适应放松"]
  },
  SP: {
    pairing: "感觉 × 知觉",
    role: "你是体验的创造者，灵活的适应者。",
    summary: "你在享受当下的美好，也需要规律一点长远的规划。",
    dimensions: [
      { title: "即时体验", body: "从真实身体感受里找回行动力。" },
      { title: "灵活适应", body: "允许路径变化，但保留安全边界。" },
      { title: "行动冲刺", body: "先做一个短小真实的现场任务。" },
      { title: "能量欢愉", body: "把恢复做得轻盈、具体、可感知。" }
    ],
    energy: [
      { label: "感官体验", value: "75%" },
      { label: "即兴性", value: "30%" },
      { label: "行动能力", value: "55%" },
      { label: "灵活适应", value: "60%" }
    ],
    actions: ["享受当下", "探索新事物", "保持灵活", "记录体验", "设定小目标"]
  }
};

const defaultDraft: PublishDraft = {
  type: "任务帖",
  title: "",
  body: "希望找一个低社交强度的同任务者，不强聊，只完成今天这一小步。",
  status: "低能量",
  socialEnergy: "低",
  anonymous: false
};

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>("任务广场");
  const [activeTab, setActiveTab] = useState<FeedTab>("推荐");
  const [searchTerm, setSearchTerm] = useState("");
  const [posts, setPosts] = useState<EnhancedPost[]>(seedPosts);
  const [tasks, setTasks] = useState<CommunityTask[]>(seedTasks);
  const [publishOpen, setPublishOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [covenantOpen, setCovenantOpen] = useState(false);
  const [draft, setDraft] = useState<PublishDraft>(defaultDraft);
  const [selectedIsland, setSelectedIsland] = useState("NF");
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [toast, setToast] = useState("");

  const taskRecommendations = useMemo(() => recommendTasksForUser(currentUser, tasks), [tasks]);
  const selectedIslandData = islands.find((item) => item.code === selectedIsland) ?? islands[1];

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const visiblePosts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      const bySearch =
        !normalized ||
        post.title.toLowerCase().includes(normalized) ||
        post.body.toLowerCase().includes(normalized) ||
        post.tags.join(" ").toLowerCase().includes(normalized);
      const byTab =
        activeTab === "推荐" ||
        (activeTab === "同城" && post.city === currentUser.city) ||
        (activeTab === "附近" && post.area === currentUser.area) ||
        (activeTab === "任务" && post.type === "任务帖") ||
        (activeTab === "帖子" && post.type !== "任务帖" && post.type !== "快闪") ||
        (activeTab === "快闪" && post.type === "快闪");
      return bySearch && byTab;
    });
  }, [activeTab, posts, searchTerm]);

  function handlePublishSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = draft.title.trim() || "想找一个安静陪走的低压散步任务";
    const relatedTask: CommunityTask = {
      id: `task-${Date.now()}`,
      title: cleanTitle,
      ownerId: currentUser.id,
      ownerMbti: currentUser.mbti,
      city: currentUser.city,
      area: currentUser.area,
      statusTags: [draft.status, "想出门"],
      taskTags: draft.type === "任务帖" ? ["低压散步", "安静陪伴"] : ["轻回应"],
      mode: "附近",
      socialEnergy: draft.socialEnergy,
      locationType: "公共地点",
      requiresOffline: true,
      acceptsWitness: true,
      boundaries: ["不私聊", "不拍照", "可线下公共地点"],
      createdAt: new Date().toISOString()
    };
    const recommendations = recommendRecipientsForTask(relatedTask, users).slice(0, 3);
    const newPost: EnhancedPost = {
      id: `post-${Date.now()}`,
      type: draft.type,
      title: cleanTitle,
      body: draft.body,
      city: currentUser.city,
      area: currentUser.area,
      author: draft.anonymous ? "匿名用户" : currentUser.name,
      authorMbti: currentUser.mbti,
      status: draft.status,
      tags: [draft.type, draft.status, "低社交"],
      actions: 0,
      createdAt: "刚刚",
      relatedTaskId: relatedTask.id,
      recommendations: recommendations.map((item) => item.user.name),
      recommendationReasons: recommendations.flatMap((item) => item.explanations.slice(0, 2))
    };

    setTasks((current) => [relatedTask, ...current]);
    setPosts((current) => [newPost, ...current]);
    setPublishOpen(false);
    setDraft(defaultDraft);
    setActiveSection("任务广场");
    setActiveTab("推荐");
    setToast(`已发布，并推荐给 ${newPost.recommendations?.join("、") || "同城同任务用户"}`);
  }

  function handleAction(label: string) {
    setToast(label);
  }

  function handleDetailAction(label: string) {
    setDetail(null);
    setToast(label);
  }

  return (
    <div className={`app-shell realm-${selectedIslandData.family.toLowerCase()}`}>
      <aside className="sidebar">
        <nav aria-label="主导航" className="side-nav">
          {navItems.map((item) => (
            <button
              className={item === activeSection ? "active" : ""}
              key={item}
              onClick={() => setActiveSection(item)}
              type="button"
            >
              {item === "任务广场" && <Compass size={18} />}
              {item === "人格岛" && <Map size={18} />}
              {item === "搭子 / 小队" && <Users size={18} />}
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-area">
        <header aria-label="页面工具" className="utility-bar">
          <div className="utility-current">
            <span>当前入口</span>
            <strong>{activeSection}</strong>
          </div>
          <div className="utility-actions">
            <button onClick={() => setCovenantOpen(true)} type="button">
              <ShieldCheck size={15} />
              公约
            </button>
            <button className="utility-profile" onClick={() => setProfileOpen(true)} type="button">
              <span>{currentUser.mbti}</span>
              个人
            </button>
          </div>
        </header>

        {activeSection === "人格岛" && (
          <RealmOpening
            activeSection={activeSection}
            onAction={handleAction}
            onOpenProfile={() => setActiveSection("人格岛")}
            onPublish={() => setPublishOpen(true)}
            selectedIslandData={selectedIslandData}
          />
        )}

        {activeSection === "任务广场" && (
          <TaskSquare
            activeTab={activeTab}
            onAction={handleAction}
            onOpenDetail={setDetail}
            onPublish={() => setPublishOpen(true)}
            posts={visiblePosts}
            recommendations={taskRecommendations}
            searchTerm={searchTerm}
            setActiveTab={setActiveTab}
            setSearchTerm={setSearchTerm}
          />
        )}

        {activeSection === "人格岛" && (
          <PersonalityIslands
            onOpenDetail={setDetail}
            selectedIsland={selectedIsland}
            selectedIslandData={selectedIslandData}
            setSelectedIsland={setSelectedIsland}
          />
        )}

        {activeSection === "搭子 / 小队" && <PartnerTeams onAction={handleAction} onOpenDetail={setDetail} />}
      </main>

      {toast ? (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      ) : null}

      {publishOpen && (
        <PublishModal
          draft={draft}
          onClose={() => setPublishOpen(false)}
          onSubmit={handlePublishSubmit}
          setDraft={setDraft}
        />
      )}
      {detail && <DetailModal detail={detail} onAction={handleDetailAction} onClose={() => setDetail(null)} />}
      {profileOpen && <ProfileDrawer onClose={() => setProfileOpen(false)} />}
      {covenantOpen && <CovenantModal onClose={() => setCovenantOpen(false)} />}
    </div>
  );
}

function RealmOpening({
  activeSection,
  onAction,
  onOpenProfile,
  onPublish,
  selectedIslandData
}: {
  activeSection: Section;
  onAction: (label: string) => void;
  onOpenProfile: () => void;
  onPublish: () => void;
  selectedIslandData: (typeof islands)[number];
}) {
  const realm = realmDesigns[selectedIslandData.family];

  return (
    <section className="hero-grid">
      <div className={`realm-panel realm-opening realm-${selectedIslandData.family.toLowerCase()}`}>
        <div className="realm-opening-header">
          <div className="realm-copy">
            <span>{selectedIslandData.family} 人格开场页 · {selectedIslandData.theme}</span>
            <h1>{selectedIslandData.family}</h1>
            <strong>{realm.pairing}</strong>
            <p>{realm.role} 用任务连接人，用边界保护人。</p>
          </div>
          <div className="realm-context">
            <span>当前入口</span>
            <strong>{activeSection}</strong>
          </div>
        </div>

        <div className="realm-stage">
          <section className="cognition-panel" aria-label="认知维度探索">
            <p className="eyebrow">认知维度探索</p>
            <div className="cognition-grid">
              {realm.dimensions.map((dimension, index) => {
                const Icon = cognitionIcons[index];
                return (
                  <article className="cognition-card" key={dimension.title}>
                    <div className="cognition-icon">
                      <Icon size={16} />
                    </div>
                    <strong>{dimension.title}</strong>
                    <p>{dimension.body}</p>
                    <button onClick={() => onAction(`正在评估：${dimension.title}`)} type="button">
                      在看详情
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="summary-strip">
              <span>一句话总结</span>
              <p>{realm.summary}</p>
            </div>
          </section>

          <section className="spectrum-panel" aria-label="你的能量光谱">
            <div className="spectrum-head">
              <p className="eyebrow">你的能量光谱</p>
              <span>{currentUser.status}</span>
            </div>
            <div className="spectrum-layout">
              <div className="energy-spectrum" aria-label={`${selectedIslandData.family} 能量光谱`}>
                <div className="spectrum-ring ring-one" />
                <div className="spectrum-ring ring-two" />
                <div className="spectrum-core">
                  <Sparkles size={28} />
                  <strong>今日状态</strong>
                  <span>{currentUser.status}</span>
                </div>
                {realm.energy.map((item, index) => (
                  <div className={`energy-node energy-node-${index}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="action-list-card">
                <p>今日建设行动</p>
                <ol>
                  {realm.actions.map((action) => (
                    <li className="action-step" key={action}>{action}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </div>

        <div className="realm-footer">
          <div className="tag-cloud">
            {boundaryTags.map((tag) => (
              <button key={tag} onClick={() => onAction(`已选择：${tag}`)} type="button">
                {tag}
              </button>
            ))}
          </div>
          <div className="realm-footer-actions">
            <button className="ghost-action" onClick={() => onAction("已回到安全边界")} type="button">
              返回
            </button>
            <button className="outline-action" onClick={onOpenProfile} type="button">
              查看完整画像 <ChevronRight size={16} />
            </button>
            <button className="primary-action" onClick={onPublish} type="button">
              查看疗愈方案 <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskSquare({
  activeTab,
  onAction,
  onOpenDetail,
  onPublish,
  posts,
  recommendations,
  searchTerm,
  setActiveTab,
  setSearchTerm
}: {
  activeTab: FeedTab;
  onAction: (label: string) => void;
  onOpenDetail: (detail: DetailItem) => void;
  onPublish: () => void;
  posts: EnhancedPost[];
  recommendations: ReturnType<typeof recommendTasksForUser>;
  searchTerm: string;
  setActiveTab: (tab: FeedTab) => void;
  setSearchTerm: (term: string) => void;
}) {
  const activeTabPanel = tabFunctionPanels[activeTab];

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">社区大厅</p>
          <h2>浏览、参与、发帖，围绕任务发生连接</h2>
        </div>
      </div>
      <div className="task-command-row">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="搜索任务、帖子、活动"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜任务、帖子、活动"
            value={searchTerm}
          />
        </label>
        <button className="primary-action" onClick={onPublish} type="button">
          <Plus size={17} />
          发布
        </button>
      </div>
      <div className="tab-row" role="tablist" aria-label="任务广场筛选">
        {feedTabs.map((tab) => (
          <button className={tab === activeTab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>
      <div className="browse-summary" aria-live="polite">
        <strong>当前浏览：{activeTab}</strong>
        <span>{tabDescriptions[activeTab]}</span>
      </div>
      <div className="tab-function-panel" aria-label={`${activeTab}专属功能`}>
        <div>
          <p className="eyebrow">{activeTabPanel.eyebrow}</p>
          <h3>{activeTabPanel.title}</h3>
          <p>{activeTabPanel.body}</p>
        </div>
        <div className="tab-function-actions">
          {activeTabPanel.actions.map((action) => (
            <button key={action} onClick={() => onAction(action)} type="button">
              {action}
            </button>
          ))}
        </div>
        <div className="tab-function-points">
          {activeTabPanel.points.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      </div>
      {activeTab === "推荐" ? (
        <div className="entry-brief-grid" aria-label="任务广场承接入口">
          {taskEntryCards.map((card) => (
            <article className="entry-brief-card" key={card.title}>
              <p className="eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <button onClick={() => onAction(card.cta)} type="button">{card.cta}</button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="dashboard-grid">
        <div className="feed-list">
          {posts.map((post) => (
            <article className="community-card" key={post.id}>
              <div className="card-meta">
                <span>{post.type}</span>
                <span>{post.city} · {post.area}</span>
                <span>{post.createdAt}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div className="chips">
                {post.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              {post.recommendations?.length ? (
                <div className="recommendation-strip">
                  <strong>已为这条任务推荐给</strong>
                  <div className="recipient-row">
                    {post.recommendations.map((name) => (
                      <span key={name}>{name}</span>
                    ))}
                  </div>
                  <small>{post.recommendationReasons?.slice(0, 3).join(" · ")}</small>
                </div>
              ) : null}
              <div className="card-actions">
                <button onClick={() => onOpenDetail(createPostDetail(post))} type="button">浏览帖子详情</button>
                <button onClick={() => onAction(`已加入：${post.title}`)} type="button">加入</button>
                <button onClick={() => onAction("看见你了")} type="button">看见你了</button>
                <button onClick={() => onAction(`已收藏：${post.title}`)} type="button">收藏</button>
                <button onClick={() => onAction("已提交举报，运营会审核")} type="button">
                  <Flag size={14} />
                  举报
                </button>
              </div>
            </article>
          ))}
        </div>
        {activeTab === "推荐" ? (
          <aside className="recommend-panel">
            <p className="eyebrow">{activeTabPanel.sideTitle}</p>
            <h3>相似任务优先，MBTI 只做沟通参考</h3>
            {recommendations.slice(0, 3).map((result) => (
              <div className="mini-card" key={result.task.id}>
                <strong>{result.task.title}</strong>
                <span>{result.explanations.slice(0, 3).join(" · ")}</span>
                <div className="mini-actions">
                  <button onClick={() => onOpenDetail(createTaskDetail(result.task, result.explanations))} type="button">浏览推荐任务</button>
                  <button onClick={() => onAction(`已加入任务：${result.task.title}`)} type="button">我也在做</button>
                </div>
              </div>
            ))}
          </aside>
        ) : (
          <aside className="recommend-panel tab-context-panel">
            <p className="eyebrow">{activeTabPanel.sideTitle}</p>
            <h3>{activeTab} tab 只处理自己的场景</h3>
            <div className="context-list">
              {activeTabPanel.sideItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

function PersonalityIslands({
  onOpenDetail,
  selectedIsland,
  selectedIslandData,
  setSelectedIsland
}: {
  onOpenDetail: (detail: DetailItem) => void;
  selectedIsland: string;
  selectedIslandData: (typeof islands)[number];
  setSelectedIsland: (code: string) => void;
}) {
  const nextIslandCode = selectedIsland === "SP" ? "NF" : "SP";

  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">人格岛</p>
          <h2>按 MBTI 进入任务包，而不是标签审判区</h2>
        </div>
      </div>
      <div className="island-grid">
        {islands.map((island) => (
          <button
            className={`island-card island-${island.family.toLowerCase()} ${selectedIsland === island.code ? "active" : ""}`}
            key={island.code}
            onClick={() => setSelectedIsland(island.code)}
            type="button"
          >
            <span>{island.code}</span>
            <strong>{island.theme}</strong>
            <small>{island.line}</small>
          </button>
        ))}
      </div>
      <div className={`island-detail island-${selectedIslandData.family.toLowerCase()}`}>
        <div>
          <p className="eyebrow">{selectedIslandData.code} 岛任务包</p>
          <h3>{selectedIslandData.guide}</h3>
        </div>
        <div className="task-ladder">
          {selectedIslandData.recommendedTasks.map((task, index) => (
            <button
              aria-label={`浏览岛屿任务：${task}`}
              key={task}
              onClick={() => onOpenDetail(createIslandTaskDetail(selectedIslandData, task, index))}
              type="button"
            >
              {index + 1}. {task}
            </button>
          ))}
        </div>
      </div>
      <div className="island-community-grid">
        <article className="island-community-card">
          <p className="eyebrow">四大人格类型专属任务</p>
          <h3>{selectedIslandData.code} 岛今日任务</h3>
          <p>围绕 {selectedIslandData.family} 类型的行动节奏、能量边界和疗愈目标生成任务包。</p>
          <button onClick={() => onOpenDetail(createIslandTaskDetail(selectedIslandData, selectedIslandData.recommendedTasks[0], 0))} type="button">
            进入{selectedIslandData.code}岛屿圈子
          </button>
        </article>
        <article className="island-community-card">
          <p className="eyebrow">四大人格类型讨论</p>
          <h3>岛屿讨论区</h3>
          <p>围绕 NT / NF / SJ / SP 的真实任务体验、关系边界和行动方式发起讨论。</p>
          <div className="mini-chip-row">
            {islands.map((island) => (
              <button key={island.code} onClick={() => setSelectedIsland(island.code)} type="button">
                {island.code}讨论
              </button>
            ))}
          </div>
        </article>
        <article className="island-community-card">
          <p className="eyebrow">岛屿互访内容</p>
          <h3>去别的岛看看</h3>
          <p>可以登陆不同岛屿互访内容，查看其他人格类型如何做任务、写分享、设边界。</p>
          <button onClick={() => setSelectedIsland(nextIslandCode)} type="button">互访 {nextIslandCode} 岛</button>
        </article>
        <article className="island-community-card">
          <p className="eyebrow">疗愈分享帖子</p>
          <h3>岛内分享精选</h3>
          <p>收集同类型用户完成任务后的轻复盘、疗愈感受、低压陪伴经验。</p>
          <button onClick={() => onOpenDetail(createIslandShareDetail(selectedIslandData))} type="button">浏览疗愈分享</button>
        </article>
      </div>
    </section>
  );
}

function PartnerTeams({
  onAction,
  onOpenDetail
}: {
  onAction: (label: string) => void;
  onOpenDetail: (detail: DetailItem) => void;
}) {
  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">搭子 / 小队</p>
          <h2>找搭子、发布找搭子、小队招募、平行房和线下快闪报名</h2>
        </div>
      </div>
      <div className="partner-action-grid" aria-label="搭子和小队入口">
        {partnerActions.map((action) => (
          <button key={action} onClick={() => onAction(`已进入：${action}`)} type="button">
            {action}
          </button>
        ))}
      </div>
      <div className="team-grid">
        {teams.map((team) => (
          <article className="team-card" key={team.id}>
            <div className="team-icon">
              {team.type === "平台快闪" ? <CalendarDays size={22} /> : <HeartHandshake size={22} />}
            </div>
            <span>{team.type} · {team.city} · {team.area}</span>
            <h3>{team.title}</h3>
            <p>{team.boundary}</p>
            <div className="team-stats">
              <strong>{team.members}</strong>
              <span>社交强度 {team.socialEnergy}</span>
            </div>
            <div className="team-actions">
              <button className="ghost-action" onClick={() => onOpenDetail(createTeamDetail(team))} type="button">
                浏览小队详情
              </button>
              <button
                className="primary-action"
                onClick={() => onAction(team.title === "低压散步小队" ? "已加入低压散步小队" : `已${team.cta.replace("申请", "申请：").replace("进入", "进入：").replace("报名", "报名：")} ${team.title}`)}
                type="button"
              >
                {team.cta}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function createPostDetail(post: EnhancedPost): DetailItem {
  return {
    eyebrow: `${post.type} · ${post.city} ${post.area}`,
    title: post.title,
    body: `${post.body} 这个入口适合先浏览规则、边界和参与方式，再决定是否加入。`,
    meta: [`作者 ${post.author} · ${post.authorMbti}`, `状态 ${post.status}`, `互动 ${post.actions}`],
    tags: uniqueTags(post.recommendations?.length ? [...post.tags, `推荐给 ${post.recommendations.join("、")}`] : post.tags),
    primaryAction: post.type === "快闪" ? "报名这个快闪" : "参与这个入口",
    secondaryAction: "收藏入口"
  };
}

function createTaskDetail(task: CommunityTask, explanations: string[] = []): DetailItem {
  return {
    eyebrow: `${task.mode}任务 · ${task.city} ${task.area}`,
    title: task.title,
    body: `社交强度 ${task.socialEnergy}，${task.locationType}执行。系统推荐理由：${explanations.slice(0, 3).join(" · ") || "任务相似、状态接近、边界兼容"}。`,
    meta: [`发起者 ${task.ownerMbti}`, task.acceptsWitness ? "可求见证" : "不需要见证", task.requiresOffline ? "线下公共地点" : "线上可完成"],
    tags: uniqueTags([...task.statusTags, ...task.taskTags, ...task.boundaries]),
    primaryAction: "我也在做",
    secondaryAction: "先收藏任务"
  };
}

function createIslandTaskDetail(
  island: (typeof islands)[number],
  task: string,
  index: number
): DetailItem {
  return {
    eyebrow: `${island.code} 岛任务包 · 第 ${index + 1} 步`,
    title: task,
    body: `${island.guide} 这个任务包用于给 ${island.code} 用户一个可先看、再领取的低压入口。`,
    meta: [`场域 ${island.theme}`, island.line, "点击领取后进入任务广场"],
    tags: uniqueTags([island.code, island.family, "人格岛", "任务包"]),
    primaryAction: "领取这个任务",
    secondaryAction: "稍后再看"
  };
}

function createTeamDetail(team: (typeof teams)[number]): DetailItem {
  return {
    eyebrow: `${team.type} · ${team.city} ${team.area}`,
    title: team.title,
    body: `${team.boundary} 浏览后可以选择加入、申请、进入或报名，平台快闪只保留公共地点和可退出机制。`,
    meta: [`成员 ${team.members}`, `社交强度 ${team.socialEnergy}`, `动作 ${team.cta}`],
    tags: uniqueTags([team.type, team.city, team.area, "边界优先"]),
    primaryAction: team.cta,
    secondaryAction: "收藏小队"
  };
}

function createIslandShareDetail(island: (typeof islands)[number]): DetailItem {
  return {
    eyebrow: `${island.code} 岛 · 疗愈分享帖子`,
    title: `${island.code} 岛内分享精选`,
    body: `这里展示 ${island.family} 类型用户完成专属任务后的疗愈分享、任务经验和边界练习。`,
    meta: [`主题 ${island.theme}`, "可互访", "可收藏"],
    tags: uniqueTags([island.code, island.family, "疗愈分享帖子", "岛屿互访内容"]),
    primaryAction: "进入岛屿圈子",
    secondaryAction: "收藏分享"
  };
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags));
}

function DetailModal({
  detail,
  onAction,
  onClose
}: {
  detail: DetailItem;
  onAction: (label: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section aria-label={`${detail.title}详情`} aria-modal="true" className="modal-card compact" role="dialog">
        <div className="modal-title">
          <div>
            <p className="eyebrow">浏览入口详情</p>
            <h2>{detail.title}</h2>
          </div>
          <button aria-label="关闭详情" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <p className="detail-eyebrow">{detail.eyebrow}</p>
        <p className="detail-copy">{detail.body}</p>
        <div className="detail-meta">
          {detail.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="chips detail-tags">
          {detail.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="modal-actions">
          <button className="ghost-action" onClick={() => onAction(`已收藏：${detail.title}`)} type="button">
            {detail.secondaryAction}
          </button>
          <button className="primary-action" onClick={() => onAction(`已选择：${detail.title}`)} type="button">
            {detail.primaryAction}
          </button>
        </div>
      </section>
    </div>
  );
}

function PublishModal({
  draft,
  onClose,
  onSubmit,
  setDraft
}: {
  draft: PublishDraft;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setDraft: (updater: PublishDraft | ((draft: PublishDraft) => PublishDraft)) => void;
}) {
  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={onSubmit}>
        <div className="modal-title">
          <div>
            <p className="eyebrow">发布</p>
            <h2>把任务、帖子或求见证发到社区大厅</h2>
          </div>
          <button aria-label="关闭发布" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="publish-types">
          {publishTypes.map((type) => (
            <button
              className={draft.type === type ? "active" : ""}
              key={type}
              onClick={() => setDraft((current) => ({ ...current, type }))}
              type="button"
            >
              {type === "任务帖" ? "发任务帖" : type}
            </button>
          ))}
        </div>
        <label className="field">
          <span>标题</span>
          <input
            aria-label="标题"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="例如：想找一个安静陪走的低压散步任务"
            value={draft.title}
          />
        </label>
        <label className="field">
          <span>正文</span>
          <textarea
            onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
            value={draft.body}
          />
        </label>
        <div className="form-grid">
          <label className="field">
            <span>当前状态</span>
            <select onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} value={draft.status}>
              <option>低能量</option>
              <option>焦虑缓冲</option>
              <option>拖延启动</option>
              <option>想出门</option>
              <option>灵感恢复</option>
            </select>
          </label>
          <label className="field">
            <span>社交强度</span>
            <select
              onChange={(event) => setDraft((current) => ({ ...current, socialEnergy: event.target.value as PublishDraft["socialEnergy"] }))}
              value={draft.socialEnergy}
            >
              <option>低</option>
              <option>中</option>
              <option>高</option>
            </select>
          </label>
        </div>
        <label className="checkbox-line">
          <input
            checked={draft.anonymous}
            onChange={(event) => setDraft((current) => ({ ...current, anonymous: event.target.checked }))}
            type="checkbox"
          />
          匿名发布
        </label>
        <div className="modal-actions">
          <button className="ghost-action" onClick={onClose} type="button">取消</button>
          <button className="primary-action" type="submit">发布到任务广场</button>
        </div>
      </form>
    </div>
  );
}

function ProfileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop align-right">
      <aside className="drawer">
        <div className="modal-title">
          <div>
            <p className="eyebrow">个人中心</p>
            <h2>{currentUser.name} · {currentUser.mbti}</h2>
          </div>
          <button aria-label="关闭个人中心" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="profile-grid">
          <span>城市</span><strong>{currentUser.city} · {currentUser.area}</strong>
          <span>今日状态</span><strong>{currentUser.status}</strong>
          <span>社交强度</span><strong>{currentUser.socialEnergy}</strong>
          <span>守约分</span><strong>{currentUser.trustScore}</strong>
        </div>
        <div className="chips">
          {currentUser.boundaries.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="mini-card">
          <strong>登录功能</strong>
          <span>当前为演示登录态。正式接入时使用手机号验证码/邮箱登录，并在注册时确认 18+ 与社区公约。</span>
        </div>
      </aside>
    </div>
  );
}

function CovenantModal({ onClose }: { onClose: () => void }) {
  const rules = ["不诊断", "不拯救", "不控制", "不追问", "不越界"];
  return (
    <div className="modal-backdrop">
      <section className="modal-card compact">
        <div className="modal-title">
          <div>
            <p className="eyebrow">社区公约</p>
            <h2>所有参与都以任务、许可和边界为前提</h2>
          </div>
          <button aria-label="关闭社区公约" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="rule-grid">
          {rules.map((rule) => <strong key={rule}>{rule}</strong>)}
        </div>
        <p className="rule-copy">
          禁止心理诊断、医疗建议、自伤方法、人肉搜索、泄露隐私、人格歧视、诱导私密线下见面。
          线下任务只允许公共地点，可随时退出。
        </p>
        <button className="primary-action full" onClick={onClose} type="button">我知道了</button>
      </section>
    </div>
  );
}
