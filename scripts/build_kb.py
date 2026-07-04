#!/usr/bin/env python3
import hashlib
import json
import os
import re
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "knowledge-base"
WORK = ROOT / ".cache"

TCM_SOURCE = Path(os.environ.get("TCM_SOURCE", ROOT / "data" / "中医基础.txt"))
XUANXUE_SOURCE = ROOT / "梁湘润-子平基础概要.pdf"


def repo_path(path):
    path = Path(path)
    try:
        return str(path.resolve().relative_to(ROOT.resolve()))
    except ValueError:
        return str(path)


def ensure_dirs():
    for path in [
        OUTPUT,
        OUTPUT / "raw_clean",
        OUTPUT / "chunks",
        OUTPUT / "index",
        OUTPUT / "schemas",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def run_textutil_rtf(path):
    result = subprocess.run(
        ["textutil", "-format", "rtf", "-convert", "txt", "-stdout", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return normalize_text(result.stdout)


def read_source_text(path):
    try:
        return run_textutil_rtf(path)
    except Exception:
        return normalize_text(path.read_text(encoding="utf-8", errors="ignore"))


def iter_tcm_sections(text):
    lines = [line.strip() for line in text.splitlines()]
    current_title = "前言"
    current = []
    chapter_re = re.compile(r"^(绪论|第[一二三四五六七八九十]+章|第[一二三四五六七八九十]+节|参考文献)")

    for line in lines:
        if not line:
            if current:
                current.append("")
            continue
        if chapter_re.match(line) and current:
            yield current_title, normalize_text("\n".join(current))
            current_title = line
            current = []
        else:
            if chapter_re.match(line):
                current_title = line
            current.append(line)

    if current:
        yield current_title, normalize_text("\n".join(current))


def chunk_text(text, max_chars=1300, overlap=160):
    text = normalize_text(text)
    if not text:
        return []

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks = []
    buf = ""
    for para in paragraphs:
        if len(buf) + len(para) + 2 <= max_chars:
            buf = f"{buf}\n\n{para}".strip()
        else:
            if buf:
                chunks.append(buf)
            if len(para) <= max_chars:
                buf = para
            else:
                start = 0
                while start < len(para):
                    chunks.append(para[start : start + max_chars])
                    start += max_chars - overlap
                buf = ""
    if buf:
        chunks.append(buf)

    if overlap <= 0 or len(chunks) <= 1:
        return chunks

    overlapped = []
    prev_tail = ""
    for chunk in chunks:
        if prev_tail:
            chunk = f"{prev_tail}\n{chunk}"
        overlapped.append(chunk[: max_chars + overlap])
        prev_tail = chunk[-overlap:]
    return overlapped


def classify_tcm(text):
    tags = []
    patterns = {
        "哲学基础": r"精气|阴阳|五行",
        "藏象": r"藏象|五脏|六腑|肝|心|脾|肺|肾",
        "气血津液": r"气血|津液|血|气",
        "经络": r"经络|十二经|奇经",
        "体质": r"体质|禀赋|寒热虚实",
        "病因": r"六淫|七情|饮食|劳逸|病因",
        "病机": r"病机|邪正|阴阳失调",
        "治则": r"治则|预防|三因制宜|治未病|调理",
        "情志": r"情志|怒|喜|思|悲|恐|忧",
    }
    for tag, pattern in patterns.items():
        if re.search(pattern, text):
            tags.append(tag)
    return tags or ["中医基础"]


def write_jsonl(path, rows):
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def build_tcm():
    clean_path = OUTPUT / "raw_clean" / "tcm_basis.clean.txt"
    if TCM_SOURCE.exists():
        text = read_source_text(TCM_SOURCE)
        source_path = TCM_SOURCE
    elif clean_path.exists():
        text = normalize_text(clean_path.read_text(encoding="utf-8"))
        source_path = clean_path
    else:
        raise FileNotFoundError(
            f"Missing TCM source. Put it at {TCM_SOURCE} or keep {clean_path}."
        )
    clean_path.write_text(text, encoding="utf-8")
    source_hash = sha256_file(source_path) if source_path.exists() else sha256_text(text)

    rows = []
    sections = list(iter_tcm_sections(text))
    for section_idx, (title, section_text) in enumerate(sections, start=1):
        for idx, chunk in enumerate(chunk_text(section_text), start=1):
            chunk_id = f"tcm_{section_idx:03d}_{idx:03d}"
            rows.append(
                {
                    "id": chunk_id,
                    "domain": "tcm",
                    "source": {
                        "title": "中医基础理论",
                        "path": repo_path(source_path),
                        "clean_path": repo_path(clean_path),
                        "source_sha256": source_hash,
                    },
                    "locator": {"section": title, "chunk_index": idx},
                    "tags": classify_tcm(chunk),
                    "text": chunk,
                    "text_sha256": sha256_text(chunk),
                    "safety": {
                        "mode": "educational_and_wellness_reference",
                        "must_not": ["替代医学诊断", "直接开方用药", "承诺疗效"],
                    },
                }
            )

    chunks_path = OUTPUT / "chunks" / "tcm.jsonl"
    write_jsonl(chunks_path, rows)
    return {"rows": rows, "clean_path": clean_path, "chunks_path": chunks_path}


PSYCHOLOGY_SOURCES = [
    {
        "title": "Alfred Adler - Understanding Human Nature / 理解人性",
        "url": "https://github.com/holyshell/Books/blob/master/%5B%E7%90%86%E8%A7%A3%E4%BA%BA%E6%80%A7%5D.%E9%98%BF%E5%BE%B7%E5%8B%92.pdf",
    }
]


ADLER_TOPICS = [
    {
        "code": "overview",
        "title": "阿德勒心理维度总则",
        "tags": ["阿德勒", "个体心理学", "心理维度", "目标导向", "生活风格"],
        "signals": ["主诉/目标", "反复困扰", "关系情境", "压力反应", "行动卡点"],
        "use_for": ["建立心理动力假设", "生成低风险解释", "选择追问方向"],
        "text": (
            "阿德勒个体心理学适合作为产品的心理维度主框架。它不把用户拆成孤立症状，"
            "而是把情绪、行为、关系和选择理解为一个朝向目标的整体模式。"
            "在 grill-me 采集中，应优先读取用户反复出现的困扰、想达成的目标、在关系里采取的策略，"
            "以及压力下如何保护自尊。输出时使用“可能的心理动力”“反复模式”“当前策略”这类语言，"
            "避免把解释写成临床诊断或人格定论。"
        ),
    },
    {
        "code": "inferiority_compensation",
        "title": "自卑感与补偿",
        "tags": ["阿德勒", "自卑感", "补偿", "过度补偿", "胜任感", "自尊保护"],
        "signals": ["害怕不够好", "强烈比较", "证明自己", "逃避尝试", "对评价敏感"],
        "use_for": ["解释过度努力或退缩", "识别自尊保护策略", "生成温和追问"],
        "text": (
            "阿德勒认为自卑感是人成长中的普遍体验，不等同于病态。用户如果反复表达“不够好”、"
            "害怕被比较、必须证明自己，或在重要任务前退缩，可以把它理解为自卑感与补偿策略的线索。"
            "补偿可以表现为投入练习、追求能力，也可能变成过度控制、完美主义、回避失败或用优越感防御。"
            "产品结论应描述“你可能正在用某种方式保护胜任感”，再给出小步验证和降低失败成本的建议。"
        ),
    },
    {
        "code": "striving_goal",
        "title": "目标导向与重要感",
        "tags": ["阿德勒", "目标导向", "重要感", "优越目标", "意义感", "行动动机"],
        "signals": ["想被看见", "想赢", "想掌控", "没有动力", "方向感弱"],
        "use_for": ["解释行为背后的目的", "从目标反推模式", "连接意义感与行动"],
        "text": (
            "阿德勒式心理读取会问：这个行为在替用户达成什么心理目的？同样是拖延，"
            "可能是在避免失败；同样是强势，可能是在争取掌控和重要感；同样是讨好，"
            "可能是在换取关系位置。grill-me 不应只记录表面行为，而要追问“这样做之后你得到了什么保护、"
            "避免了什么风险、希望别人怎么看你”。输出时把行为写成目的性策略，而不是道德评价。"
        ),
    },
    {
        "code": "life_style",
        "title": "生活风格",
        "tags": ["阿德勒", "生活风格", "早期经验", "核心信念", "行为模式", "自我叙事"],
        "signals": ["总是", "每次都", "从小就", "习惯性反应", "固定关系剧本"],
        "use_for": ["识别反复模式", "组织用户故事", "生成长期画像"],
        "text": (
            "生活风格可以理解为用户长期形成的自我叙事和应对世界的方式。它包括用户如何看待自己、"
            "他人、关系、竞争和失败。采集时要特别注意“总是、每次、从小就、我这种人”这类表达，"
            "它们往往指向稳定脚本。产品不应说早期经验决定一生，而应说“这些经验可能形成了某种默认策略”，"
            "并通过后续互动观察它是否仍在当前情境中有效。"
        ),
    },
    {
        "code": "social_interest",
        "title": "共同体感觉",
        "tags": ["阿德勒", "共同体感觉", "社会兴趣", "合作", "归属感", "贡献"],
        "signals": ["孤立", "不被理解", "关系紧张", "想有归属", "想贡献价值"],
        "use_for": ["评估关系连接感", "设计社交和调理任务", "把自我问题放回关系场"],
        "text": (
            "共同体感觉是阿德勒心理框架中判断心理健康的重要方向，可理解为一个人与他人、群体和生活任务的连接感。"
            "当用户感到孤立、不被理解，或把所有问题都变成个人胜负时，心理维度可以提示关系连接和合作感正在变窄。"
            "建议应优先鼓励低压力连接、可完成的小贡献、清晰表达需求，而不是要求用户立刻变得外向或积极。"
        ),
    },
    {
        "code": "safeguarding",
        "title": "防御策略与借口",
        "tags": ["阿德勒", "防御策略", "借口", "回避", "拖延", "完美主义", "控制"],
        "signals": ["拖延", "找理由", "先放弃", "必须完美", "怕开始", "过度控制"],
        "use_for": ["识别保护性回避", "解释行动卡点", "生成低挫败行动建议"],
        "text": (
            "阿德勒框架会把一些表面上的问题行为理解为保护性策略。拖延、借口、先放弃、过度准备、"
            "完美主义和控制感，都可能是在避免自尊受损或避免暴露能力不足。产品输出应避免责备用户，"
            "可以说“这像是一种降低失败风险的保护动作”。建议要把行动拆小，降低评价压力，"
            "让用户在可承受范围内重新获得掌控感。"
        ),
    },
    {
        "code": "relationship_pattern",
        "title": "关系模式与权力位置",
        "tags": ["阿德勒", "关系模式", "权力位置", "亲密关系", "合作", "边界"],
        "signals": ["讨好", "争执", "冷处理", "害怕被抛下", "想赢过对方", "边界困难"],
        "use_for": ["解释亲密关系互动", "生成关系追问", "连接 MBTI 互动偏好"],
        "text": (
            "在关系里，用户常常会用某种方式争取安全感、重要感或控制感。讨好可能是在保住关系位置，"
            "冷处理可能是在避免失控，争辩可能是在维护价值感，过度承担可能是在换取被需要。"
            "心理维度应读取这些关系动作背后的目的，再和 MBTI 的互动偏好区分开："
            "MBTI 说明用户偏好如何沟通，阿德勒说明用户为什么需要这种关系位置。"
        ),
    },
    {
        "code": "family_context",
        "title": "家庭氛围与早期位置",
        "tags": ["阿德勒", "家庭氛围", "早期经验", "出生序位", "归属位置", "非决定论"],
        "signals": ["家庭角色", "排行", "被期待", "被比较", "照顾者", "缺席感"],
        "use_for": ["补充长期模式线索", "解释归属和竞争敏感点", "生成谨慎追问"],
        "text": (
            "阿德勒重视家庭氛围、早期位置和被期待的角色，但产品必须以非决定论方式使用。"
            "排行、家庭角色、被比较、长期照顾他人或缺席感，都只能作为理解生活风格的线索，"
            "不能写成“因为你是某个排行所以必然如何”。更合适的表达是："
            "“你早期在关系中的位置，可能影响了你现在对责任、竞争或被看见的敏感度。”"
        ),
    },
    {
        "code": "grill_me_questions",
        "title": "grill-me 心理维度采集问题",
        "tags": ["阿德勒", "grill-me", "心理采集", "追问", "结构化信号"],
        "signals": ["开放回答", "选择题", "追问"],
        "use_for": ["生成心理维度追问", "结构化采集", "30秒首轮画像"],
        "text": (
            "grill-me 采集心理维度时，应用少量问题抓住心理目的和反复模式。可用问题包括："
            "你最近最想改变的反复模式是什么；当这件事发生时你最怕别人怎么看你；"
            "你通常会证明自己、回避、讨好、控制还是先放弃；这个反应保护了你什么；"
            "你希望在关系里获得安全、认可、自由、掌控还是被需要。首轮不要超过三问，"
            "信息不足时输出低置信度假设，并把下一问设计成验证假设。"
        ),
    },
]


def build_psychology():
    rows = []
    for topic in ADLER_TOPICS:
        text = (
            f"{topic['title']}\n"
            f"{topic['text']}\n"
            f"grill-me 信号：{'；'.join(topic['signals'])}\n"
            f"产品用途：{'；'.join(topic['use_for'])}"
        )
        rows.append(
            {
                "id": f"psychology_adler_{topic['code']}",
                "domain": "psychology",
                "source": {"title": "Adler psychology product synthesis", "sources": PSYCHOLOGY_SOURCES},
                "locator": {"framework": "Adler individual psychology", "topic": topic["code"]},
                "tags": topic["tags"],
                "text": text,
                "structured": {
                    "framework": "adler_individual_psychology",
                    "topic": topic["code"],
                    "signals": topic["signals"],
                    "use_for": topic["use_for"],
                },
                "text_sha256": sha256_text(text),
                "safety": {
                    "mode": "psychological_reflection",
                    "must_not": ["临床诊断", "人格定论", "创伤定论", "替代心理咨询/精神科诊断"],
                    "risk_flags": ["自伤/他伤风险必须升级为安全提示和专业求助建议"],
                },
            }
        )

    ref = [
        "# Adler Psychology Knowledge Notes",
        "",
        "This local KB layer is a product-oriented synthesis of Adlerian individual psychology concepts.",
        "It supports the psychological dimension of the four-dimensional profile system.",
        "It is intended for reflective pattern reading, grill-me follow-up selection, and low-stakes self-understanding.",
        "",
        "## Sources",
    ]
    for source in PSYCHOLOGY_SOURCES:
        ref.append(f"- {source['title']}: {source['url']}")
    ref.append("")
    ref.append("## Product Boundary")
    ref.append("- Use language such as 可能, 模式, 策略, 心理动力, 反复脚本.")
    ref.append("- Do not present Adlerian interpretation as clinical diagnosis.")
    ref.append("- Do not infer trauma, pathology, or fixed personality from one signal.")
    ref_path = OUTPUT / "raw_clean" / "adler_reference.md"
    ref_path.write_text("\n".join(ref), encoding="utf-8")

    chunks_path = OUTPUT / "chunks" / "psychology.jsonl"
    write_jsonl(chunks_path, rows)
    return {"rows": rows, "reference_path": ref_path, "chunks_path": chunks_path}


MBTI_SOURCES = [
    {
        "title": "The Myers-Briggs Company - MBTI personality types",
        "url": "https://www.themyersbriggs.com/en-US/Products-and-Services/Myers-Briggs/MBTI-Personality-types",
    },
    {
        "title": "The Myers-Briggs Company - the 16 MBTI personality types",
        "url": "https://www.themyersbriggs.com/en-US/Products-and-Services/Myers-Briggs/MBTI-Personality-Types",
    },
    {
        "title": "The Myers-Briggs Foundation - The 16 MBTI personality types",
        "url": "https://www.myersbriggs.org/my-mbti-personality-type/the-16-mbti-personality-types/",
    },
]


MBTI_TYPES = {
    "ISTJ": {
        "preferences": ["I", "S", "T", "J"],
        "profile": "稳健、讲秩序、重事实和责任。倾向用既有规则和可验证信息做判断，适合处理流程、风险和细节。",
        "stress": "压力下容易变得固执、过度纠错，或对不可控变化产生防御。",
        "relationship": "偏好清楚承诺、明确边界和可兑现的行动。",
        "growth": "练习表达情绪需要，并给新方案留出小规模试验空间。",
    },
    "ISFJ": {
        "preferences": ["I", "S", "F", "J"],
        "profile": "细心、照顾型、重稳定和具体体验。容易记住他人需求，也容易默默承担过多。",
        "stress": "压力下可能委屈、回避冲突，或陷入反复担心。",
        "relationship": "重视被看见、被感谢，以及日常可靠的回应。",
        "growth": "练习说出边界，把照顾别人和照顾自己放在同一优先级。",
    },
    "INFJ": {
        "preferences": ["I", "N", "F", "J"],
        "profile": "洞察型、理想驱动、重意义和长期方向。善于理解隐含动机，适合做深度关系和愿景整合。",
        "stress": "压力下容易过度解读、情绪耗竭，或把理想变成自我要求。",
        "relationship": "需要真诚、深度交流和价值观一致。",
        "growth": "把宏大愿景拆成可执行步骤，并定期校准现实反馈。",
    },
    "INTJ": {
        "preferences": ["I", "N", "T", "J"],
        "profile": "战略型、系统化、重模型和长期效率。倾向先理解底层结构，再设计路径。",
        "stress": "压力下容易过度控制、低估情绪成本，或对低效环境失去耐心。",
        "relationship": "欣赏能力、诚实和清晰目标。",
        "growth": "练习把判断背后的关心说出来，给他人参与感。",
    },
    "ISTP": {
        "preferences": ["I", "S", "T", "P"],
        "profile": "实操型、冷静、重问题现场和工具感。擅长拆解系统、快速定位故障。",
        "stress": "压力下可能抽离、沉默，或用冒险行为释放压力。",
        "relationship": "需要空间、信任和少量高质量沟通。",
        "growth": "提前说明自己的思考节奏，避免让他人把沉默理解成疏离。",
    },
    "ISFP": {
        "preferences": ["I", "S", "F", "P"],
        "profile": "感受型、审美敏锐、重真实体验和个人价值。喜欢自然、不被强压的表达。",
        "stress": "压力下容易退缩、自责，或对外界评价高度敏感。",
        "relationship": "需要温柔、不评判和尊重个人节奏。",
        "growth": "把价值感转成具体选择，练习在冲突中稳定表达立场。",
    },
    "INFP": {
        "preferences": ["I", "N", "F", "P"],
        "profile": "理想主义、内在价值强、重身份认同和可能性。善于共情、创作和意义探索。",
        "stress": "压力下容易陷入内耗、拖延，或因不够完美而迟迟不行动。",
        "relationship": "需要被理解内在动机，而不仅是外在表现。",
        "growth": "用小行动保护理想，把感受落成可被他人理解的请求。",
    },
    "INTP": {
        "preferences": ["I", "N", "T", "P"],
        "profile": "分析型、概念驱动、重逻辑一致性。喜欢探索系统漏洞、理论模型和新解释。",
        "stress": "压力下可能过度怀疑、拖延决策，或忽视身体和关系维护。",
        "relationship": "欣赏智性交流、自由空间和低控制感。",
        "growth": "给开放探索设置阶段性输出，把思考转成可验证原型。",
    },
    "ESTP": {
        "preferences": ["E", "S", "T", "P"],
        "profile": "行动型、反应快、重现场反馈。擅长谈判、应急和把机会变成动作。",
        "stress": "压力下容易冲动、低估长期后果，或厌烦重复细节。",
        "relationship": "需要直接、轻松、有活力的互动。",
        "growth": "在行动前加一个风险检查点，让速度和可持续性并存。",
    },
    "ESFP": {
        "preferences": ["E", "S", "F", "P"],
        "profile": "体验型、热情、重人与现场氛围。能带动情绪，也擅长把抽象目标变成可感知体验。",
        "stress": "压力下可能逃避沉重议题，或被即时反馈牵着走。",
        "relationship": "需要温暖回应、共同体验和真实赞赏。",
        "growth": "为重要目标设置轻量计划，避免只凭当下感觉决定。",
    },
    "ENFP": {
        "preferences": ["E", "N", "F", "P"],
        "profile": "启发型、好奇、重可能性和人际能量。善于连接想法、激励他人和打开新局面。",
        "stress": "压力下容易分散、情绪波动，或因选择太多而疲惫。",
        "relationship": "需要自由、真诚和被鼓励探索。",
        "growth": "把灵感筛成少数优先级，并建立完成闭环。",
    },
    "ENTP": {
        "preferences": ["E", "N", "T", "P"],
        "profile": "辩论型、创新、重假设挑战。擅长发现反常识机会、重组规则和快速试错。",
        "stress": "压力下可能争辩过度、忽视执行细节，或对常规维护失去兴趣。",
        "relationship": "需要智性刺激、幽默感和开放讨论。",
        "growth": "区分探索和承诺，给已经选择的事留出稳定执行期。",
    },
    "ESTJ": {
        "preferences": ["E", "S", "T", "J"],
        "profile": "组织型、务实、重标准和效率。擅长建立流程、推进责任和把资源落到结果。",
        "stress": "压力下容易强势、急于纠正，或低估他人的情绪负荷。",
        "relationship": "需要可靠、坦率和行动上的配合。",
        "growth": "在推动前先确认他人的感受和信息缺口，提升协同质量。",
    },
    "ESFJ": {
        "preferences": ["E", "S", "F", "J"],
        "profile": "协调型、热心、重群体秩序和照应。善于营造稳定关系和照顾具体需求。",
        "stress": "压力下容易过度迎合、担心评价，或用控制感换安全感。",
        "relationship": "需要被回应、被重视，以及明确的关系位置。",
        "growth": "把外部认可和内部判断分开，练习表达真实偏好。",
    },
    "ENFJ": {
        "preferences": ["E", "N", "F", "J"],
        "profile": "引导型、共情强、重人成长和共同愿景。擅长组织人心、表达价值和推动群体改变。",
        "stress": "压力下容易过度负责、替别人做决定，或忽视自己的真实疲惫。",
        "relationship": "需要共同目标、情感回应和信任感。",
        "growth": "把帮助他人和尊重他人自主分开，定期检查自身需求。",
    },
    "ENTJ": {
        "preferences": ["E", "N", "T", "J"],
        "profile": "指挥型、目标导向、重战略和资源配置。擅长制定方向、做艰难决策和推进规模化结果。",
        "stress": "压力下容易过度压迫、忽略关系温度，或把脆弱感视作低效。",
        "relationship": "欣赏能力、清晰沟通和共同野心。",
        "growth": "在决策中纳入情绪与关系成本，用解释提升认同感。",
    },
}


def mbti_dimension_rows():
    dimensions = [
        (
            "E-I",
            "Extraversion / Introversion",
            "关注能量指向。E 倾向从外部互动、行动和现场反馈获得能量；I 倾向从独处、内部整理和深度聚焦获得能量。",
            ["采集时询问：你恢复能量更靠独处还是互动？", "结果中避免把 E/I 简化成外向/内向标签。"],
        ),
        (
            "S-N",
            "Sensing / Intuition",
            "关注信息偏好。S 倾向重事实、细节、经验和现实证据；N 倾向重模式、意义、未来可能和抽象联系。",
            ["采集时询问：你更信具体经历还是整体预感？", "报告中把 S/N 用于解释信息处理方式。"],
        ),
        (
            "T-F",
            "Thinking / Feeling",
            "关注决策准则。T 倾向重逻辑、公平原则和因果一致；F 倾向重价值、关系影响和人的感受。",
            ["采集时询问：冲突中你先看规则逻辑还是关系感受？", "避免把 T 写成冷漠、F 写成不理性。"],
        ),
        (
            "J-P",
            "Judging / Perceiving",
            "关注生活组织方式。J 倾向计划、闭环和可控节奏；P 倾向开放、弹性和根据现场调整。",
            ["采集时询问：你更喜欢先定计划还是边走边调？", "把 J/P 用于设计调理任务颗粒度。"],
        ),
    ]
    rows = []
    for code, name, text, usage in dimensions:
        chunk_text_value = f"{name}\n{text}\n应用提示：{'；'.join(usage)}"
        rows.append(
            {
                "id": f"mbti_dimension_{code.lower()}",
                "domain": "mbti",
                "source": {"title": "MBTI public reference synthesis", "urls": MBTI_SOURCES},
                "locator": {"kind": "dimension", "code": code},
                "tags": ["MBTI", "偏好维度", code],
                "text": chunk_text_value,
                "structured": {"code": code, "name": name, "usage": usage},
                "text_sha256": sha256_text(chunk_text_value),
                "safety": {
                    "mode": "personality_reflection",
                    "must_not": ["人格定论", "临床诊断", "就业/婚恋歧视性判断"],
                },
            }
        )
    return rows


def build_mbti():
    rows = mbti_dimension_rows()
    for code, data in sorted(MBTI_TYPES.items()):
        text = (
            f"{code}\n"
            f"核心画像：{data['profile']}\n"
            f"压力反应：{data['stress']}\n"
            f"关系互动：{data['relationship']}\n"
            f"成长建议：{data['growth']}"
        )
        rows.append(
            {
                "id": f"mbti_type_{code.lower()}",
                "domain": "mbti",
                "source": {"title": "MBTI public reference synthesis", "urls": MBTI_SOURCES},
                "locator": {"kind": "type", "code": code},
                "tags": ["MBTI", "16型人格", code] + data["preferences"],
                "text": text,
                "structured": data,
                "text_sha256": sha256_text(text),
                "safety": {
                    "mode": "personality_reflection",
                    "must_not": ["人格定论", "临床诊断", "就业/婚恋歧视性判断"],
                },
            }
        )

    ref = [
        "# MBTI Knowledge Notes",
        "",
        "This local KB is a compact MBTI-style synthesis built from public descriptions of the four preference pairs and 16 types.",
        "It is intended for reflection, interaction design, and low-stakes personalization, not clinical diagnosis or psychometric assessment.",
        "",
        "## Sources",
    ]
    for source in MBTI_SOURCES:
        ref.append(f"- {source['title']}: {source['url']}")
    ref.append("")
    ref.append("## Product Boundary")
    ref.append("- Use language such as 倾向, 偏好, 画像, 可能.")
    ref.append("- Do not claim the system has officially administered the MBTI assessment.")
    ref.append("- Do not use type labels to make high-stakes decisions.")
    ref_path = OUTPUT / "raw_clean" / "mbti_reference.md"
    ref_path.write_text("\n".join(ref), encoding="utf-8")

    chunks_path = OUTPUT / "chunks" / "mbti.jsonl"
    write_jsonl(chunks_path, rows)
    return {"rows": rows, "reference_path": ref_path, "chunks_path": chunks_path}


def load_xuanxue_ocr():
    ocr_path = OUTPUT / "raw_clean" / "xuanxue_ocr.clean.txt"
    if not ocr_path.exists():
        return None
    text = normalize_text(ocr_path.read_text(encoding="utf-8"))
    return text if text else None


def classify_xuanxue(text):
    tags = []
    patterns = {
        "四柱": r"四柱|年柱|月柱|日柱|时柱|干支",
        "五行": r"五行|金|木|水|火|土|相生|相克",
        "十神": r"十神|比肩|劫财|食神|伤官|正财|偏财|正官|七杀|正印|偏印",
        "大运": r"大运|流年|岁运",
        "刑冲合会": r"三合|三会|六合|刑|冲|害|会|合",
        "格局": r"格局|用神|喜忌",
    }
    for tag, pattern in patterns.items():
        if re.search(pattern, text):
            tags.append(tag)
    return tags or ["子平基础"]


def build_xuanxue():
    text = load_xuanxue_ocr()
    if not text:
        return {"rows": [], "chunks_path": None, "status": "missing_ocr"}

    rows = []
    page_splits = re.split(r"\n?--- page (\d+) ---\n", text)
    if len(page_splits) > 1:
        pages = []
        leading = page_splits[0].strip()
        for i in range(1, len(page_splits), 2):
            page_no = int(page_splits[i])
            page_text = page_splits[i + 1].strip()
            pages.append((page_no, page_text))
        if leading:
            pages.insert(0, (0, leading))
    else:
        pages = [(0, text)]

    for page_no, page_text in pages:
        for idx, chunk in enumerate(chunk_text(page_text, max_chars=1000, overlap=120), start=1):
            chunk_id = f"xuanxue_p{page_no:03d}_{idx:03d}"
            rows.append(
                {
                    "id": chunk_id,
                    "domain": "xuanxue",
                    "source": {
                        "title": "梁湘润-子平基础概要",
                        "path": repo_path(XUANXUE_SOURCE),
                        "clean_path": repo_path(OUTPUT / "raw_clean" / "xuanxue_ocr.clean.txt"),
                        "source_sha256": sha256_file(XUANXUE_SOURCE),
                    },
                    "locator": {"page": page_no, "chunk_index": idx},
                    "tags": classify_xuanxue(chunk),
                    "text": chunk,
                    "text_sha256": sha256_text(chunk),
                    "safety": {
                        "mode": "cultural_and_reflective_reference",
                        "must_not": ["命运定论", "恐吓式断语", "替代现实决策"],
                    },
                }
            )

    chunks_path = OUTPUT / "chunks" / "xuanxue.jsonl"
    write_jsonl(chunks_path, rows)
    return {"rows": rows, "chunks_path": chunks_path, "status": "ok"}


def build_sqlite(all_rows):
    db_path = OUTPUT / "index" / "kb.sqlite"
    if db_path.exists():
        db_path.unlink()
    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        CREATE TABLE chunks (
            id TEXT PRIMARY KEY,
            domain TEXT NOT NULL,
            locator_json TEXT NOT NULL,
            tags_json TEXT NOT NULL,
            source_json TEXT NOT NULL,
            text TEXT NOT NULL,
            metadata_json TEXT NOT NULL
        )
        """
    )
    try:
        conn.execute("CREATE VIRTUAL TABLE chunks_fts USING fts5(id, domain, tags, text)")
        has_fts = True
    except sqlite3.OperationalError:
        has_fts = False

    for row in all_rows:
        metadata = {k: v for k, v in row.items() if k not in {"id", "domain", "locator", "tags", "source", "text"}}
        conn.execute(
            "INSERT INTO chunks VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                row["id"],
                row["domain"],
                json.dumps(row.get("locator", {}), ensure_ascii=False),
                json.dumps(row.get("tags", []), ensure_ascii=False),
                json.dumps(row.get("source", {}), ensure_ascii=False),
                row["text"],
                json.dumps(metadata, ensure_ascii=False),
            ),
        )
        if has_fts:
            conn.execute(
                "INSERT INTO chunks_fts (id, domain, tags, text) VALUES (?, ?, ?, ?)",
                (row["id"], row["domain"], " ".join(row.get("tags", [])), row["text"]),
            )
    conn.commit()
    conn.close()
    return db_path, has_fts


def write_schema():
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "KnowledgeBaseChunk",
        "type": "object",
        "required": ["id", "domain", "source", "locator", "tags", "text", "text_sha256", "safety"],
        "properties": {
            "id": {"type": "string"},
            "domain": {"enum": ["tcm", "psychology", "xuanxue", "mbti"]},
            "source": {"type": "object"},
            "locator": {"type": "object"},
            "tags": {"type": "array", "items": {"type": "string"}},
            "text": {"type": "string"},
            "structured": {"type": "object"},
            "text_sha256": {"type": "string"},
            "safety": {"type": "object"},
        },
    }
    schema_path = OUTPUT / "schemas" / "chunk.schema.json"
    schema_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return schema_path


def write_manifest(results, db_path, has_fts):
    all_rows = []
    for result in results.values():
        all_rows.extend(result.get("rows", []))
    counts = {}
    for row in all_rows:
        counts[row["domain"]] = counts.get(row["domain"], 0) + 1

    manifest = {
        "name": "four-dimensional-profile-kb",
        "built_at": datetime.now(timezone.utc).isoformat(),
        "domains": counts,
        "total_chunks": len(all_rows),
        "files": {
            "tcm_chunks": repo_path(OUTPUT / "chunks" / "tcm.jsonl"),
            "psychology_chunks": repo_path(OUTPUT / "chunks" / "psychology.jsonl"),
            "xuanxue_chunks": repo_path(OUTPUT / "chunks" / "xuanxue.jsonl"),
            "mbti_chunks": repo_path(OUTPUT / "chunks" / "mbti.jsonl"),
            "sqlite_index": repo_path(db_path),
            "retrieval_policy": repo_path(OUTPUT / "index" / "retrieval_policy.json"),
            "schema": repo_path(OUTPUT / "schemas" / "chunk.schema.json"),
        },
        "sqlite_fts5": has_fts,
        "safety_defaults": {
            "tcm": "仅作为中医基础理论与调理参考，不输出医学诊断、处方或疗效承诺。",
            "psychology": "仅作为心理模式与自我理解参考，不输出临床诊断、人格定论或创伤定论。",
            "xuanxue": "仅作为文化解释和反思框架，不输出命运定论或恐吓式断语。",
            "mbti": "仅作为人格偏好反思，不作为正式 MBTI 测评或高风险决策依据。",
        },
    }
    path = OUTPUT / "index" / "kb_manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return path, manifest


def write_readme(manifest):
    readme = f"""# Four-Dimensional Profile Knowledge Base

Built at: {manifest["built_at"]}

This directory contains the first local KB for the product idea:

- `tcm`: 中医基础理论，用于身体/情志/体质/调理倾向参考。
- `psychology`: 阿德勒个体心理学摘要，用于心理动力、生活风格、关系模式和 grill-me 追问。
- `xuanxue`: 梁湘润《子平基础概要》OCR 后的子平/四柱文化解释参考。
- `mbti`: MBTI-style 偏好维度与 16 类型画像，用于人格和关系互动。

## Files

- `chunks/tcm.jsonl`
- `chunks/psychology.jsonl`
- `chunks/xuanxue.jsonl`
- `chunks/mbti.jsonl`
- `index/kb.sqlite`
- `index/kb_manifest.json`
- `schemas/chunk.schema.json`

## Retrieval

For simple keyword retrieval, use SQLite FTS when available:

```sql
SELECT id, domain, text
FROM chunks_fts
WHERE chunks_fts MATCH '阴阳 OR 体质'
LIMIT 5;
```

For application RAG, read the JSONL chunks, embed `text`, and keep `domain`, `tags`, `locator`, and `safety` as metadata filters.

## Product Boundary

Use these chunks to generate “倾向/画像/建议”, not medical diagnosis, clinical diagnosis, fortune determinism, or official psychometric assessment.
"""
    path = OUTPUT / "README.md"
    path.write_text(readme, encoding="utf-8")
    return path


def main():
    ensure_dirs()
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    results = {}
    if mode in {"all", "tcm"}:
        results["tcm"] = build_tcm()
    if mode in {"all", "psychology", "adler"}:
        results["psychology"] = build_psychology()
    if mode in {"all", "mbti"}:
        results["mbti"] = build_mbti()
    if mode in {"all", "xuanxue"}:
        results["xuanxue"] = build_xuanxue()

    if mode == "all":
        all_rows = []
        for result in results.values():
            all_rows.extend(result.get("rows", []))
        db_path, has_fts = build_sqlite(all_rows)
        write_schema()
        _, manifest = write_manifest(results, db_path, has_fts)
        write_readme(manifest)
        print(json.dumps(manifest, ensure_ascii=False, indent=2))
    else:
        print(json.dumps({k: len(v.get("rows", [])) for k, v in results.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
