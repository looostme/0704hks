import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flag,
  HeartHandshake,
  Map,
  MapPin,
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

const navItems: Section[] = ["任务广场", "人格岛", "搭子 / 小队"];
const feedTabs: FeedTab[] = ["推荐", "同城", "附近", "任务", "帖子", "快闪"];
const publishTypes: PostType[] = ["任务帖", "普通帖子", "复盘帖", "求见证", "快闪"];
const boundaryTags = ["不私聊", "不拍照", "可线下公共地点", "不接受建议", "可随时退出"];

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">MB</div>
          <div>
            <p>疗愈任务社区</p>
            <span>同城 · 附近 · MBTI</span>
          </div>
        </div>
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
        <div className="covenant-card">
          <ShieldCheck size={20} />
          <p>不诊断、不拯救、不控制、不追问、不越界。</p>
          <button type="button" onClick={() => setCovenantOpen(true)}>
            查看社区公约
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-row">
            <div className="location-pill">
              <MapPin size={17} />
              <span>上海 · 徐汇</span>
            </div>
            <button className="profile-button" onClick={() => setProfileOpen(true)} type="button">
              <span>{currentUser.mbti}</span>
              个人中心
            </button>
          </div>
          <label className="search-box">
            <Search size={17} />
            <input
              aria-label="搜索任务、帖子、活动"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="搜任务、帖子、活动"
              value={searchTerm}
            />
          </label>
          <div className="topbar-actions">
            <button className="primary-action" onClick={() => setPublishOpen(true)} type="button">
              <Plus size={17} />
              发布
            </button>
            <button className="icon-button" onClick={() => handleAction("暂无新的通知")} type="button" aria-label="通知">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <div className={`realm-panel realm-${selectedIslandData.family.toLowerCase()}`}>
            <div className="realm-copy">
              <span>{selectedIslandData.family} 人格场域 · {selectedIslandData.theme}</span>
              <h1>{activeSection}</h1>
              <p>{selectedIslandData.line} 用任务连接人，用边界保护人。</p>
            </div>
            <div className="status-orbit" aria-label="今日状态光谱">
              <Sparkles size={32} />
              <span>今日状态</span>
              <strong>{currentUser.status}</strong>
            </div>
          </div>
          <div className="quick-panel">
            <p className="eyebrow">今日边界</p>
            <div className="tag-cloud">
              {boundaryTags.map((tag) => (
                <button key={tag} onClick={() => handleAction(`已选择：${tag}`)} type="button">
                  {tag}
                </button>
              ))}
            </div>
            <button className="outline-action" onClick={() => setPublishOpen(true)} type="button">
              发起任务 <ChevronRight size={16} />
            </button>
          </div>
        </section>

        {activeSection === "任务广场" && (
          <TaskSquare
            activeTab={activeTab}
            onAction={handleAction}
            onPublish={() => setPublishOpen(true)}
            posts={visiblePosts}
            recommendations={taskRecommendations}
            setActiveTab={setActiveTab}
          />
        )}

        {activeSection === "人格岛" && (
          <PersonalityIslands
            onAction={handleAction}
            selectedIsland={selectedIsland}
            selectedIslandData={selectedIslandData}
            setSelectedIsland={setSelectedIsland}
          />
        )}

        {activeSection === "搭子 / 小队" && <PartnerTeams onAction={handleAction} />}
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
      {profileOpen && <ProfileDrawer onClose={() => setProfileOpen(false)} />}
      {covenantOpen && <CovenantModal onClose={() => setCovenantOpen(false)} />}
    </div>
  );
}

function TaskSquare({
  activeTab,
  onAction,
  onPublish,
  posts,
  recommendations,
  setActiveTab
}: {
  activeTab: FeedTab;
  onAction: (label: string) => void;
  onPublish: () => void;
  posts: EnhancedPost[];
  recommendations: ReturnType<typeof recommendTasksForUser>;
  setActiveTab: (tab: FeedTab) => void;
}) {
  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">社区大厅</p>
          <h2>浏览、参与、发帖，围绕任务发生连接</h2>
        </div>
        <button className="primary-action" onClick={onPublish} type="button">
          <Plus size={17} />
          发起任务
        </button>
      </div>
      <div className="tab-row" role="tablist" aria-label="任务广场筛选">
        {feedTabs.map((tab) => (
          <button className={tab === activeTab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>
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
        <aside className="recommend-panel">
          <p className="eyebrow">推荐给你</p>
          <h3>相似任务优先，MBTI 只做沟通参考</h3>
          {recommendations.slice(0, 3).map((result) => (
            <div className="mini-card" key={result.task.id}>
              <strong>{result.task.title}</strong>
              <span>{result.explanations.slice(0, 3).join(" · ")}</span>
              <button onClick={() => onAction(`已加入任务：${result.task.title}`)} type="button">我也在做</button>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
}

function PersonalityIslands({
  onAction,
  selectedIsland,
  selectedIslandData,
  setSelectedIsland
}: {
  onAction: (label: string) => void;
  selectedIsland: string;
  selectedIslandData: (typeof islands)[number];
  setSelectedIsland: (code: string) => void;
}) {
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
            <button key={task} onClick={() => onAction(`已领取：${task}`)} type="button">
              {index + 1}. {task}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerTeams({ onAction }: { onAction: (label: string) => void }) {
  return (
    <section className="content-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">搭子 / 小队</p>
          <h2>找同任务者、低压小队、平行房和平台快闪</h2>
        </div>
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
            <button
              className="primary-action"
              onClick={() => onAction(team.title === "低压散步小队" ? "已加入低压散步小队" : `已${team.cta.replace("申请", "申请：").replace("进入", "进入：").replace("报名", "报名：")} ${team.title}`)}
              type="button"
            >
              {team.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
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
