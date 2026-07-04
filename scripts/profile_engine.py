#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import json
import os
import re
import sqlite3
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KB_DB = ROOT / "knowledge-base" / "index" / "kb.sqlite"
POLICY_PATH = ROOT / "knowledge-base" / "index" / "retrieval_policy.json"
DEFAULT_INTAKE = ROOT / "examples" / "multimodal-intake.example.json"
DEFAULT_BASE_URL = "https://api.openai-next.com"
DEFAULT_MODEL = "claude-sonnet-5"
DEFAULT_ANTHROPIC_VERSION = "2023-06-01"

DIMENSION_ORDER = ["tcm_body", "psychology", "xuanxue_spirit", "mbti"]
DIMENSION_LABELS = {
    "tcm_body": "身体",
    "psychology": "心理",
    "xuanxue_spirit": "玄学",
    "mbti": "MBTI",
}

MIN_REQUIRED_CATEGORIES = 2
MAX_SKIPPED_CATEGORIES = 2
MAX_COLLECTION_QUESTIONS = 5

CATEGORY_ORDER = [
    {
        "category": "mbti",
        "dimension": "mbti",
        "label": "MBTI",
        "question": "你更像哪一种：已知 MBTI 类型、偏外向/内向、偏计划/弹性，还是暂时跳过？",
        "reason": "MBTI 放在第一步，用于快速确定互动偏好和后续问题颗粒度。",
    },
    {
        "category": "body",
        "dimension": "tcm_body",
        "label": "身体",
        "question": "身体这步可以文字、语音或图片：最近睡眠、消化、冷热、疲惫，或上传舌图/面部/手部照片，你选一种即可。",
        "reason": "身体放在第二步，用最短路径拿到体质和状态线索。",
    },
    {
        "category": "bazi",
        "dimension": "xuanxue_spirit",
        "label": "八字",
        "question": "八字这步需要出生年月日时；如果时辰不确定，可以先给年月日并标注不确定。",
        "reason": "八字放在第三步，用于玄学心灵维度的非决定论阶段反思。",
    },
    {
        "category": "psychology",
        "dimension": "psychology",
        "label": "心理",
        "question": "最近最反复出现的心理卡点是什么：拖延、讨好、控制、回避、内耗，还是其他？",
        "reason": "心理放在最后，用 3-5 个阿德勒问题读取反复模式和保护策略。",
    },
]

PSYCHOLOGY_COLLECTION_QUESTIONS = [
    {
        "question": "最近最反复出现的心理卡点是什么：拖延、讨好、控制、回避、内耗，还是其他？",
        "reason": "识别阿德勒心理维度的反复模式。",
    },
    {
        "question": "这个反应通常在什么场景出现？任务、关系、评价、冲突，还是独处时更明显？",
        "reason": "定位触发场景，区分行动压力和关系压力。",
    },
    {
        "question": "当这个反应出现时，它像是在保护你什么：不失败、不被讨厌、不失控，还是不暴露脆弱？",
        "reason": "读取保护策略和心理目的。",
    },
    {
        "question": "你更希望别人怎么看见你：可靠、有价值、自由、被需要，还是足够好？",
        "reason": "读取重要感、自尊保护和关系位置。",
    },
    {
        "question": "如果只做一个很小的改变，你愿意先试哪一步？",
        "reason": "把心理洞察落到低压力行动验证。",
    },
]

CONFIDENCE_RANK = {
    "unknown": 0,
    "low": 1,
    "medium": 2,
    "user_reported": 2,
    "high": 3,
}

DIMENSION_KEYWORDS = {
    "tcm_body": [
        "睡眠",
        "多梦",
        "疲惫",
        "舌",
        "白苔",
        "齿痕",
        "体质",
        "气血",
        "津液",
        "治则",
    ],
    "psychology": [
        "阿德勒",
        "自卑感",
        "补偿",
        "防御策略",
        "生活风格",
        "目标导向",
        "关系模式",
        "拖延",
    ],
    "xuanxue_spirit": [
        "四柱",
        "五行",
        "十神",
        "大运",
        "流年",
        "格局",
    ],
    "mbti": [
        "MBTI",
        "偏好维度",
        "16型人格",
        "能量",
        "决策",
        "互动",
    ],
}

QUESTION_BANK = {
    "tcm_body": {
        "question": "身体这步可以文字、语音或图片：最近睡眠、消化、冷热、疲惫，或上传舌图/面部/手部照片，你选一种即可。",
        "reason": "用于把身体信号路由到睡眠、气血津液、体质或调理方向。",
    },
    "psychology": {
        "question": "最近最反复出现的心理卡点是什么：拖延、讨好、控制、回避、内耗，还是其他？",
        "reason": "用于验证阿德勒心理维度里的自卑补偿、防御策略和关系评价压力。",
    },
    "xuanxue_spirit": {
        "question": "八字这步需要出生年月日时；如果时辰不确定，可以先给年月日并标注不确定。",
        "reason": "用于判断是否可以进入四柱/阶段叙事；不确定时只做低置信度反思。",
    },
    "mbti": {
        "question": "你更像哪一种：已知 MBTI 类型、偏外向/内向、偏计划/弹性，还是暂时跳过？",
        "reason": "用于补足 MBTI-style 决策偏好线索。",
    },
}


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def signal_text(signal):
    parts = [
        str(signal.get("value", "")),
        str(signal.get("raw_text", "")),
        str(signal.get("transcript", "")),
    ]
    for observation in signal.get("observations", []):
        parts.append(str(observation.get("type", "")))
        parts.append(str(observation.get("value", "")))
    return " ".join(part for part in parts if part)


def contains_any(text, terms):
    return any(term in text for term in terms)


def signals_for_dimension(signals, dimension):
    return [signal for signal in signals if dimension in signal.get("dimension_hint", [])]


def categories_for_signal(signal):
    categories = set()
    hints = set(signal.get("dimension_hint", []))
    signal_type = signal.get("type")
    if "mbti" in hints or signal_type in {"mbti_known", "preference_clue"}:
        categories.add("mbti")
    if "tcm_body" in hints or signal_type in {
        "body_state",
        "sleep",
        "digestion",
        "temperature_sense",
        "tongue_observation",
        "face_observation",
    }:
        categories.add("body")
    if signal_type == "birth_info":
        categories.add("bazi")
    if "psychology" in hints or signal_type in {
        "goal",
        "emotion_state",
        "stress_state",
        "repeated_pattern",
        "self_evaluation",
        "relationship_pattern",
        "voice_delivery",
    }:
        categories.add("psychology")
    return categories


def build_intake_coverage(signals, explicit_skipped=None):
    submitted = set()
    for signal in signals:
        submitted.update(categories_for_signal(signal))
    explicit_skipped = set(explicit_skipped or []) - submitted

    stages = []
    skipped_so_far = 0
    current_missing_assigned = False
    for stage in CATEGORY_ORDER:
        category = stage["category"]
        if category in submitted:
            status = "submitted"
            required = False
        elif category in explicit_skipped:
            if skipped_so_far < MAX_SKIPPED_CATEGORIES:
                status = "skipped"
                required = False
                skipped_so_far += 1
            else:
                status = "required_missing"
                required = True
        else:
            required = skipped_so_far >= MAX_SKIPPED_CATEGORIES
            if required:
                status = "required_missing"
            elif not current_missing_assigned:
                status = "optional_missing"
                current_missing_assigned = True
            else:
                status = "not_reached"
        stages.append(
            {
                "category": category,
                "dimension": stage["dimension"],
                "label": stage["label"],
                "status": status,
                "required": required,
            }
        )

    missing = [stage for stage in stages if stage["status"] != "submitted"]
    required_missing = [stage for stage in stages if stage["status"] == "required_missing"]
    return {
        "order": [stage["category"] for stage in CATEGORY_ORDER],
        "minimum_required_categories": MIN_REQUIRED_CATEGORIES,
        "max_skipped_categories": MAX_SKIPPED_CATEGORIES,
        "submitted_count": len(submitted),
        "needed_categories_to_generate": max(0, MIN_REQUIRED_CATEGORIES - len(submitted)),
        "skipped_count": len([stage for stage in stages if stage["status"] == "skipped"]),
        "remaining_skip_count": max(0, MAX_SKIPPED_CATEGORIES - len([stage for stage in stages if stage["status"] == "skipped"])),
        "submitted_categories": [stage["category"] for stage in stages if stage["status"] == "submitted"],
        "skipped_categories": [stage["category"] for stage in stages if stage["status"] == "skipped"],
        "required_categories": [stage["category"] for stage in required_missing],
        "can_generate_profile": len(submitted) >= MIN_REQUIRED_CATEGORIES,
        "stages": stages,
    }


def stage_question(stage, priority="medium"):
    category = stage["category"]
    if category == "psychology":
        return [
            {
                "dimension": "psychology",
                "question": item["question"],
                "reason": item["reason"],
                "priority": priority,
            }
            for item in PSYCHOLOGY_COLLECTION_QUESTIONS[:3]
        ]
    source = next(item for item in CATEGORY_ORDER if item["category"] == category)
    return [
        {
            "dimension": source["dimension"],
            "question": source["question"],
            "reason": source["reason"],
            "priority": priority,
        }
    ]


def build_minimum_collection_questions(coverage):
    questions = []
    required_stages = [stage for stage in coverage["stages"] if stage["status"] == "required_missing"]
    optional_stages = [stage for stage in coverage["stages"] if stage["status"] == "optional_missing"]

    for stage in required_stages:
        questions.extend(stage_question(stage, priority="high"))
    for stage in optional_stages:
        if len(questions) >= MAX_COLLECTION_QUESTIONS:
            break
        questions.extend(stage_question(stage, priority="medium"))
        if coverage["submitted_count"] + len({q["dimension"] for q in questions}) >= MIN_REQUIRED_CATEGORIES:
            break

    return questions[:MAX_COLLECTION_QUESTIONS]


def seed_questions_from_coverage(coverage):
    questions = []
    required_stages = [stage for stage in coverage["stages"] if stage["status"] == "required_missing"]
    optional_stages = [stage for stage in coverage["stages"] if stage["status"] == "optional_missing"]
    for stage in required_stages:
        questions.extend(stage_question(stage, priority="high"))
    if not required_stages and optional_stages:
        questions.extend(stage_question(optional_stages[0], priority="medium"))
    return questions[:MAX_COLLECTION_QUESTIONS]


def merge_collection_questions(coverage, questions):
    seeded = seed_questions_from_coverage(coverage)
    if not coverage["can_generate_profile"]:
        return build_minimum_collection_questions(coverage)

    merged = []
    seen_dimensions = set()
    seen_text = set()
    for question in seeded:
        merged.append(question)
        seen_dimensions.add(question["dimension"])
        seen_text.add(question["question"])

    for question in questions:
        dimension = question["dimension"]
        if dimension in seen_dimensions or question["question"] in seen_text:
            continue
        merged.append(question)
        seen_dimensions.add(dimension)
        seen_text.add(question["question"])
        if len(merged) >= MAX_COLLECTION_QUESTIONS:
            break
    return merged[:MAX_COLLECTION_QUESTIONS]


def aggregate_confidence(signals, has_evidence=True):
    if not signals:
        return "low"
    rank = max(CONFIDENCE_RANK.get(signal.get("confidence", "unknown"), 0) for signal in signals)
    if not has_evidence and rank > 2:
        rank = 2
    if rank >= 3:
        return "high"
    if rank == 2:
        return "medium"
    return "low"


def cap_confidence(confidence, cap):
    if not cap:
        return confidence
    confidence_rank = CONFIDENCE_RANK.get(confidence, 0)
    cap_rank = CONFIDENCE_RANK.get(cap, 0)
    capped_rank = min(confidence_rank, cap_rank)
    if capped_rank >= 3:
        return "high"
    if capped_rank == 2:
        return "medium"
    return "low"


def quote_fts_term(term):
    term = re.sub(r'["\s]+', " ", term).strip()
    if not term:
        return None
    return f'"{term}"'


def build_match_query(dimension, signals, policy):
    terms = []
    terms.extend(policy["dimensions"].get(dimension, {}).get("default_tags", [])[:6])
    terms.extend(DIMENSION_KEYWORDS.get(dimension, []))
    text = " ".join(signal_text(signal) for signal in signals)
    for keyword in DIMENSION_KEYWORDS.get(dimension, []):
        if keyword in text and keyword not in terms:
            terms.insert(0, keyword)
    quoted = []
    seen = set()
    for term in terms:
        quoted_term = quote_fts_term(term)
        if quoted_term and quoted_term not in seen:
            quoted.append(quoted_term)
            seen.add(quoted_term)
    return " OR ".join(quoted[:12])


def retrieve_chunks(dimension, signals, policy, limit=4):
    if not signals:
        return []
    dimension_policy = policy["dimensions"].get(dimension, {})
    domains = dimension_policy.get("domains", [])
    if not domains:
        return []
    match_query = build_match_query(dimension, signals, policy)
    if not match_query:
        return []

    placeholders = ", ".join("?" for _ in domains)
    sql = f"""
        SELECT
            c.id,
            c.domain,
            c.tags_json,
            c.locator_json,
            c.source_json,
            substr(c.text, 1, 180) AS excerpt,
            bm25(chunks_fts) AS score
        FROM chunks_fts
        JOIN chunks c ON c.id = chunks_fts.id
        WHERE chunks_fts MATCH ?
          AND c.domain IN ({placeholders})
        ORDER BY score
        LIMIT ?
    """
    try:
        with sqlite3.connect(KB_DB) as conn:
            rows = conn.execute(sql, [match_query, *domains, limit]).fetchall()
    except sqlite3.Error:
        return []

    chunks = []
    for row in rows:
        chunks.append(
            {
                "id": row[0],
                "domain": row[1],
                "tags": json.loads(row[2]),
                "locator": json.loads(row[3]),
                "source": json.loads(row[4]),
                "excerpt": row[5],
                "score": row[6],
            }
        )
    return chunks


def build_evidence_pack(intake, policy):
    signals = intake.get("signals", [])
    coverage = build_intake_coverage(signals, intake.get("skipped_categories", []))
    dimensions = []
    for dimension in DIMENSION_ORDER:
        dimension_signals = signals_for_dimension(signals, dimension)
        chunks = retrieve_chunks(dimension, dimension_signals, policy)
        dimensions.append(
            {
                "dimension": dimension,
                "name": DIMENSION_LABELS[dimension],
                "signals": [
                    {
                        "id": signal.get("id"),
                        "modality": signal.get("modality"),
                        "type": signal.get("type"),
                        "value": signal.get("value"),
                        "confidence": signal.get("confidence"),
                        "dimension_hint": signal.get("dimension_hint", []),
                        "observations": signal.get("observations", []),
                    }
                    for signal in dimension_signals
                ],
                "policy": policy["dimensions"].get(dimension, {}),
                "evidence_chunks": [
                    {
                        "id": chunk["id"],
                        "domain": chunk["domain"],
                        "tags": chunk["tags"],
                        "excerpt": chunk["excerpt"],
                    }
                    for chunk in chunks
                ],
            }
        )
    return {
        "goal": intake.get("goal", ""),
        "input_count": len(intake.get("inputs", [])),
        "known_signal_count": len(signals),
        "coverage": coverage,
        "dimensions": dimensions,
        "safety_events": intake.get("safety_events", []),
    }


def compact_output_for_prompt(output):
    compact = {
        "collection": output["collection"],
        "dimension_values": [],
        "current_state": output["current_state"],
        "safety": output["safety"],
    }
    for item in output["dimension_values"]:
        compact["dimension_values"].append(
            {
                "dimension": item["dimension"],
                "name": item["name"],
                "value": item["value"],
                "label": item["label"],
                "description": item["description"],
                "confidence": item["confidence"],
                "polarity": item["polarity"],
                "evidence_signal_ids": item["evidence_signal_ids"],
                "evidence_chunk_ids": item["evidence_chunk_ids"],
            }
        )
    return compact


def llm_system_prompt():
    return """你是 0704hks 的四维画像引擎。你的任务是结合 grill-me 多模态输入信号和本地知识库证据，直接产出结构化 JSON。

四维：
- tcm_body：中医身体。读取睡眠、疲劳、消化、冷热、舌象等，只输出体质/状态倾向和调理方向，不做医学诊断。
- psychology：阿德勒心理。读取反复模式、自我评价、保护策略、关系动作、生活风格，只输出心理动力假设，不做临床诊断或创伤定论。
- xuanxue_spirit：玄学心灵。读取出生信息、手相或用户想问的人生主题，只做文化/象意/阶段反思，不做命运定论。
- mbti：MBTI-style 偏好。读取能量、信息、决策、节奏偏好或已知类型，不声称官方测评。

采集顺序和硬规则：
- 固定顺序：MBTI -> 身体 -> 八字 -> 心理。
- 身体可以通过问题、语音或图片提交。
- 八字指出生年月日时；时辰不确定必须标注不确定。
- 心理放最后，用 3-5 个短问题读取阿德勒心理模式。
- 最少需要提交两类信息才允许生成完整画像。
- 用户最多只能跳过两类；如果前面已经跳过两类，后面的类别都必填。
- 只有 collection.coverage 里 status=skipped 的类别才算用户已跳过；缺失八字不能自动当作已跳过。
- next_questions 必须遵守这个顺序和必填规则，不要把八字问题提前到 MBTI 或身体之前。

你必须：
1. 只输出 JSON 对象，不要输出解释性前后缀，不要使用 Markdown 代码块。
2. 必须输出 collection、dimension_values、current_state、safety。
3. dimension_values 必须恰好包含 tcm_body、psychology、xuanxue_spirit、mbti 四项。
4. 每个维度必须包含 value、label、description、confidence、polarity、evidence_signal_ids、evidence_chunk_ids；不要输出 evidence_chunks。
5. value 用简短 snake_case 抽象值；label 用 2-6 个中文字符；description 用一句具体短描述，80 个中文字符以内。
6. current_state 只能是 positive/negative/neutral，对应 label 只能是 正/负/平，并给一段 120 个中文字符以内的具体描述。
7. next_questions 最多 5 个，按采集顺序提问；心理段需要时给 3-5 个短问题。
8. 结论必须绑定输入信号和知识块证据；没有证据时要降低置信度或标记待补采。
9. 禁止医学诊断、临床心理诊断、命运定论、官方 MBTI 测评和高风险建议。
"""


def llm_user_prompt(intake, evidence_pack, fallback_output):
    required_shape = {
        "collection": {
            "mode": "grill_me_with_kb",
            "max_questions": MAX_COLLECTION_QUESTIONS,
            "known_signal_count": evidence_pack["known_signal_count"],
            "input_count": evidence_pack["input_count"],
            "next_questions": [
                {
                    "dimension": "psychology",
                    "question": "string",
                    "reason": "string",
                    "priority": "high|medium|low",
                }
            ],
        },
        "dimension_values": [
            {
                "dimension": "tcm_body|psychology|xuanxue_spirit|mbti",
                "name": "身体|心理|玄学|MBTI",
                "value": "snake_case",
                "label": "简短中文标签",
                "description": "一句简短具体描述",
                "confidence": "high|medium|low",
                "polarity": "positive|negative|neutral",
                "evidence_signal_ids": ["signal id"],
                "evidence_chunk_ids": ["chunk id"],
            }
        ],
        "current_state": {
            "value": "positive|negative|neutral",
            "label": "正|负|平",
            "score": 0,
            "description": "一段具体描述",
            "positive_dimensions": ["dimension"],
            "negative_dimensions": ["dimension"],
            "neutral_dimensions": ["dimension"],
        },
        "safety": {
            "language": "输出为画像判断/倾向评估，不是医学诊断、临床心理诊断、命运定论或官方 MBTI 测评。",
            "events": [],
        },
    }
    return json.dumps(
        {
            "task": "根据输入信号和知识库证据生成四维值与当前状态。请结合 evidence_pack 自行判断。",
            "required_shape": required_shape,
            "evidence_pack": evidence_pack,
            "fallback_reference": {
                "dimension_values": [
                    {
                        "dimension": item["dimension"],
                        "value": item["value"],
                        "label": item["label"],
                        "confidence": item["confidence"],
                    }
                    for item in fallback_output["dimension_values"]
                ],
                "current_state": fallback_output["current_state"],
            },
        },
        ensure_ascii=False,
    )


def chat_completions(payload, api_key, base_url):
    base_url = base_url.rstrip("/")
    if base_url.endswith("/chat/completions"):
        endpoint = base_url
    elif base_url.endswith("/v1"):
        endpoint = base_url + "/chat/completions"
    else:
        endpoint = base_url + "/v1/chat/completions"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM API HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"LLM API request failed: {exc.reason}") from exc


def anthropic_messages(system_prompt, user_prompt, api_key, base_url, model, max_tokens, temperature):
    base_url = base_url.rstrip("/")
    if base_url.endswith("/messages"):
        endpoint = base_url
    elif base_url.endswith("/v1"):
        endpoint = base_url + "/messages"
    else:
        endpoint = base_url + "/v1/messages"
    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "thinking": {
            "type": os.environ.get("OPENAI_NEXT_THINKING", "disabled"),
        },
        "system": system_prompt,
        "messages": [
            {"role": "user", "content": user_prompt},
        ],
    }
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "x-api-key": api_key,
            "anthropic-version": os.environ.get("OPENAI_NEXT_ANTHROPIC_VERSION", DEFAULT_ANTHROPIC_VERSION),
            "Content-Type": "application/json",
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM API HTTP {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"LLM API request failed: {exc.reason}") from exc


def response_content(response):
    if "content" in response and isinstance(response["content"], list):
        parts = []
        for item in response["content"]:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)

    message = response.get("choices", [{}])[0].get("message", {})
    content = message.get("content", "")
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and item.get("type") in {"text", "output_text"}:
                parts.append(item.get("text", ""))
            elif isinstance(item, str):
                parts.append(item)
        content = "\n".join(parts)
    return content


def parse_json_object(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(text[start : end + 1])


def repair_json_prompt(raw_text, evidence_pack, fallback_output):
    return json.dumps(
        {
            "task": "上一轮模型输出不是合法 JSON。请根据 evidence_pack 和 fallback_reference 重新生成一个合法 JSON 对象。只输出 JSON，不要 Markdown。",
            "hard_rules": [
                "必须包含 collection, dimension_values, current_state, safety",
                "dimension_values 恰好 4 项，维度为 tcm_body, psychology, xuanxue_spirit, mbti",
                "collection.coverage 必须保留采集顺序、至少两类信息、跳过两类后后续必填的规则",
                "只有 collection.coverage 中 status=skipped 的类别才算跳过，缺失八字不能自动当作跳过",
                "不要输出 evidence_chunks，只输出 evidence_signal_ids 和 evidence_chunk_ids",
                "description 保持简短",
                "current_state.value 只能是 positive, negative, neutral",
                "current_state.label 只能是 正, 负, 平",
            ],
            "bad_output": raw_text[:6000],
            "evidence_pack": evidence_pack,
            "fallback_reference": compact_output_for_prompt(fallback_output),
        },
        ensure_ascii=False,
    )


def normalize_llm_output(output, fallback_output, evidence_pack):
    output = dict(output)
    output.setdefault("session_id", fallback_output["session_id"])
    output.setdefault("generated_at", datetime.now(timezone.utc).isoformat())
    output.setdefault("goal", fallback_output["goal"])

    evidence_by_dimension = {
        item["dimension"]: item for item in evidence_pack["dimensions"]
    }
    fallback_by_dimension = {
        item["dimension"]: item for item in fallback_output["dimension_values"]
    }
    normalized_dimensions = []
    provided = {
        item.get("dimension"): item for item in output.get("dimension_values", []) if isinstance(item, dict)
    }
    for dimension in DIMENSION_ORDER:
        item = dict(provided.get(dimension) or fallback_by_dimension[dimension])
        item["dimension"] = dimension
        item["name"] = DIMENSION_LABELS[dimension]
        item.setdefault("value", fallback_by_dimension[dimension]["value"])
        item.setdefault("label", fallback_by_dimension[dimension]["label"])
        item.setdefault("description", fallback_by_dimension[dimension]["description"])
        item["confidence"] = item.get("confidence") if item.get("confidence") in {"high", "medium", "low"} else fallback_by_dimension[dimension]["confidence"]
        item["polarity"] = item.get("polarity") if item.get("polarity") in {"positive", "negative", "neutral"} else fallback_by_dimension[dimension]["polarity"]
        valid_signal_ids = {signal["id"] for signal in evidence_by_dimension[dimension]["signals"] if signal.get("id")}
        valid_chunk_ids = {chunk["id"] for chunk in evidence_by_dimension[dimension]["evidence_chunks"]}
        item["evidence_signal_ids"] = [
            signal_id for signal_id in item.get("evidence_signal_ids", []) if signal_id in valid_signal_ids
        ]
        item["evidence_chunk_ids"] = [
            chunk_id for chunk_id in item.get("evidence_chunk_ids", []) if chunk_id in valid_chunk_ids
        ]
        if not item["evidence_signal_ids"] and fallback_by_dimension[dimension]["evidence_signal_ids"]:
            item["evidence_signal_ids"] = fallback_by_dimension[dimension]["evidence_signal_ids"]
        if not item["evidence_chunk_ids"] and fallback_by_dimension[dimension]["evidence_chunk_ids"]:
            item["evidence_chunk_ids"] = fallback_by_dimension[dimension]["evidence_chunk_ids"]
        chunks_by_id = {
            chunk["id"]: chunk for chunk in evidence_by_dimension[dimension]["evidence_chunks"]
        }
        item["evidence_chunks"] = [
            chunks_by_id[chunk_id] for chunk_id in item["evidence_chunk_ids"] if chunk_id in chunks_by_id
        ]
        normalized_dimensions.append(item)
    output["dimension_values"] = normalized_dimensions

    collection = output.get("collection") if isinstance(output.get("collection"), dict) else {}
    collection["mode"] = "grill_me_with_kb"
    collection["max_questions"] = MAX_COLLECTION_QUESTIONS
    collection["known_signal_count"] = evidence_pack["known_signal_count"]
    collection["input_count"] = evidence_pack["input_count"]
    collection["coverage"] = evidence_pack["coverage"]
    questions = []
    for question in collection.get("next_questions", []):
        if not isinstance(question, dict) or question.get("dimension") not in DIMENSION_ORDER:
            continue
        bank = QUESTION_BANK[question["dimension"]]
        questions.append(
            {
                "dimension": question["dimension"],
                "question": str(question.get("question") or bank["question"]),
                "reason": str(question.get("reason") or bank["reason"]),
                "priority": question.get("priority") if question.get("priority") in {"high", "medium", "low"} else "medium",
            }
        )
    collection["next_questions"] = merge_collection_questions(evidence_pack["coverage"], questions)
    output["collection"] = collection

    current_state = output.get("current_state") if isinstance(output.get("current_state"), dict) else {}
    if current_state.get("value") not in {"positive", "negative", "neutral"}:
        current_state = fallback_output["current_state"]
    current_state["label"] = {"positive": "正", "negative": "负", "neutral": "平"}[current_state["value"]]
    current_state.setdefault("score", fallback_output["current_state"]["score"])
    current_state.setdefault("description", fallback_output["current_state"]["description"])
    for key in ["positive_dimensions", "negative_dimensions", "neutral_dimensions"]:
        current_state[key] = [
            dimension
            for dimension in current_state.get(key, [])
            if dimension in DIMENSION_ORDER
        ]
    output["current_state"] = current_state

    safety = output.get("safety") if isinstance(output.get("safety"), dict) else {}
    safety["language"] = "输出为画像判断/倾向评估，不是医学诊断、临床心理诊断、命运定论或官方 MBTI 测评。"
    safety["events"] = evidence_pack.get("safety_events", [])
    output["safety"] = safety
    return output


def build_profile_llm(intake, fallback_on_error=False):
    api_key = os.environ.get("OPENAI_NEXT_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_NEXT_API_KEY. Set it in the environment, not in source code.")

    policy = load_json(POLICY_PATH)
    evidence_pack = build_evidence_pack(intake, policy)
    if not evidence_pack["coverage"]["can_generate_profile"]:
        return build_insufficient_profile(intake, evidence_pack["coverage"])
    fallback_output = build_profile_rules(intake)
    model = os.environ.get("OPENAI_NEXT_MODEL", DEFAULT_MODEL)
    base_url = os.environ.get("OPENAI_NEXT_BASE_URL", DEFAULT_BASE_URL)
    max_tokens = int(os.environ.get("OPENAI_NEXT_MAX_TOKENS", "4096"))
    temperature = float(os.environ.get("OPENAI_NEXT_TEMPERATURE", "0"))
    system_prompt = llm_system_prompt()
    user_prompt = llm_user_prompt(intake, evidence_pack, fallback_output)
    try:
        if model.startswith("claude"):
            response = anthropic_messages(system_prompt, user_prompt, api_key, base_url, model, max_tokens, temperature)
        else:
            payload = {
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            }
            response = chat_completions(payload, api_key, base_url)
        content = response_content(response)
        try:
            parsed = parse_json_object(content)
        except Exception:
            repair_system = "你是 JSON 修复器。你只输出一个合法 JSON 对象，不要 Markdown，不要解释。"
            repair_user = repair_json_prompt(content, evidence_pack, fallback_output)
            if model.startswith("claude"):
                repair_response = anthropic_messages(repair_system, repair_user, api_key, base_url, model, max_tokens, temperature)
            else:
                repair_payload = {
                    "model": model,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "messages": [
                        {"role": "system", "content": repair_system},
                        {"role": "user", "content": repair_user},
                    ],
                }
                repair_response = chat_completions(repair_payload, api_key, base_url)
            parsed = parse_json_object(response_content(repair_response))
        return normalize_llm_output(parsed, fallback_output, evidence_pack)
    except Exception:
        if fallback_on_error:
            fallback_output["engine"] = {
                "mode": "rules_fallback",
                "reason": "LLM request failed; returned deterministic fallback.",
            }
            return fallback_output
        raise


def classify_body(signals):
    if not signals:
        return {
            "value": "body_pending",
            "label": "待补采",
            "description": "身体维度暂缺足够线索，需要补充睡眠、疲劳、消化、冷热或舌图信息。",
            "polarity": "neutral",
        }
    text = " ".join(signal_text(signal) for signal in signals)
    has_sleep = contains_any(text, ["睡不好", "多梦", "易醒", "失眠", "疲惫", "疲劳"])
    has_tongue_load = contains_any(text, ["白苔", "偏厚", "齿痕", "偏淡", "舌"])
    if has_sleep and has_tongue_load:
        return {
            "value": "body_recovery_load",
            "label": "恢复承压",
            "description": "睡眠困扰和舌象观察同时出现，身体层面更像处在恢复与运化压力中。",
            "polarity": "negative",
        }
    if has_sleep:
        return {
            "value": "sleep_recovery_load",
            "label": "睡眠承压",
            "description": "睡眠质量和疲惫线索较突出，当前身体值偏向恢复不足。",
            "polarity": "negative",
        }
    if has_tongue_load:
        return {
            "value": "body_digestive_load",
            "label": "运化负荷",
            "description": "舌图观察提示身体调理可先关注消化、湿润度和日常节律。",
            "polarity": "neutral",
        }
    return {
        "value": "body_observed",
        "label": "身体可观",
        "description": "已有身体线索，但还需要补充强弱、持续时间和生活背景。",
        "polarity": "neutral",
    }


def classify_psychology(signals):
    if not signals:
        return {
            "value": "psychology_pending",
            "label": "待补采",
            "description": "心理维度暂缺反复模式、关系动作或自我评价线索。",
            "polarity": "neutral",
        }
    text = " ".join(signal_text(signal) for signal in signals)
    if contains_any(text, ["拖延", "怕做不好", "看低", "不够好", "失败"]):
        return {
            "value": "protective_avoidance",
            "label": "保护性回避",
            "description": "重要任务前的拖延和评价担心，更像是在保护胜任感与自尊。",
            "polarity": "negative",
        }
    if contains_any(text, ["讨好", "冷处理", "边界", "争执", "被抛下"]):
        return {
            "value": "relationship_safety_seeking",
            "label": "关系求稳",
            "description": "心理线索集中在关系安全感和位置感，需要看清背后的保护策略。",
            "polarity": "negative",
        }
    if contains_any(text, ["焦虑", "烦", "压力", "紧张", "内耗"]):
        return {
            "value": "psychological_tension",
            "label": "心理绷紧",
            "description": "情绪和压力信号偏强，当前心理值呈现绷紧和内耗倾向。",
            "polarity": "negative",
        }
    return {
        "value": "psychology_observed",
        "label": "模式可读",
        "description": "已有心理线索，可以继续通过 grill-me 追问验证反复模式。",
        "polarity": "neutral",
    }


def classify_xuanxue(signals):
    if not signals:
        return {
            "value": "spirit_pending",
            "label": "待补采",
            "description": "玄学维度暂缺出生信息或手相等反思材料，只能先保留为空白。",
            "polarity": "neutral",
        }
    text = " ".join(signal_text(signal) for signal in signals)
    if contains_any(text, ["出生", "年月日", "时辰", "八字"]):
        return {
            "value": "birth_reflection_ready",
            "label": "可起盘",
            "description": "已有出生信息时，可以进入四柱和阶段主题的非决定论反思。",
            "polarity": "neutral",
        }
    if contains_any(text, ["手相", "掌", "掌纹"]):
        return {
            "value": "symbolic_reflection",
            "label": "象意反思",
            "description": "手相材料适合做象意和人生主题反思，不用于命运定论。",
            "polarity": "neutral",
        }
    return {
        "value": "spirit_observed",
        "label": "心灵可读",
        "description": "已有玄学相关线索，但还需要确认资料完整度和用户想问的主题。",
        "polarity": "neutral",
    }


def classify_mbti(signals):
    if not signals:
        return {
            "value": "mbti_pending",
            "label": "待补采",
            "description": "MBTI 维度暂缺已知类型或偏好线索，需要补充能量、信息、决策或节奏偏好。",
            "polarity": "neutral",
        }
    text = " ".join(signal_text(signal) for signal in signals)
    type_match = re.search(r"\b[IE][NS][TF][JP]\b", text.upper())
    if type_match:
        mbti_type = type_match.group(0)
        return {
            "value": f"mbti_{mbti_type.lower()}",
            "label": mbti_type,
            "description": f"用户自报或文本中出现 {mbti_type}，可作为互动偏好的中等置信度参考。",
            "polarity": "neutral",
            "confidence_cap": "medium",
        }
    if contains_any(text, ["拖延", "开放", "边走边调", "灵感", "不想被催"]):
        return {
            "value": "open_flexible_pace",
            "label": "弹性节奏",
            "description": "互动偏好更像需要弹性空间和低压力启动，适合用小闭环推进。",
            "polarity": "neutral",
            "confidence_cap": "medium",
        }
    if contains_any(text, ["逻辑", "事实", "规则", "计划"]):
        return {
            "value": "structured_decision",
            "label": "结构决策",
            "description": "互动偏好更像重视事实、规则或明确计划。",
            "polarity": "neutral",
            "confidence_cap": "medium",
        }
    if contains_any(text, ["感受", "关系", "评价", "被理解"]):
        return {
            "value": "relational_decision",
            "label": "关系决策",
            "description": "互动偏好更像重视关系影响和被理解的感受。",
            "polarity": "neutral",
            "confidence_cap": "medium",
        }
    return {
        "value": "mbti_observed",
        "label": "偏好可读",
        "description": "已有互动偏好线索，但还需要通过一两个选择题明确维度。",
        "polarity": "neutral",
    }


CLASSIFIERS = {
    "tcm_body": classify_body,
    "psychology": classify_psychology,
    "xuanxue_spirit": classify_xuanxue,
    "mbti": classify_mbti,
}


def build_dimension_value(dimension, all_signals, policy):
    dimension_signals = signals_for_dimension(all_signals, dimension)
    chunks = retrieve_chunks(dimension, dimension_signals, policy)
    result = CLASSIFIERS[dimension](dimension_signals)
    confidence = aggregate_confidence(dimension_signals, has_evidence=bool(chunks))
    confidence = cap_confidence(confidence, result.get("confidence_cap"))
    if result["value"].endswith("_pending"):
        confidence = "low"
    return {
        "dimension": dimension,
        "name": DIMENSION_LABELS[dimension],
        "value": result["value"],
        "label": result["label"],
        "description": result["description"],
        "confidence": confidence,
        "polarity": result["polarity"],
        "evidence_signal_ids": [signal["id"] for signal in dimension_signals],
        "evidence_chunk_ids": [chunk["id"] for chunk in chunks],
        "evidence_chunks": chunks,
    }


def build_collection_plan(dimension_values, coverage):
    questions = []
    if not coverage["can_generate_profile"]:
        questions = build_minimum_collection_questions(coverage)
    else:
        dimension_by_category = {stage["dimension"]: stage["category"] for stage in CATEGORY_ORDER}
        category_order = {stage["category"]: idx for idx, stage in enumerate(CATEGORY_ORDER)}
        for item in dimension_values:
            dimension = item["dimension"]
            needs_followup = item["confidence"] == "low" or item["value"].endswith("_pending")
            if dimension == "psychology" and item["value"] in {"protective_avoidance", "relationship_safety_seeking"}:
                needs_followup = True
            if not needs_followup:
                continue
            bank = QUESTION_BANK[dimension]
            priority = "high" if dimension in {"psychology", "tcm_body"} else "medium"
            if item["value"].endswith("_pending") and dimension == "xuanxue_spirit":
                priority = "low"
            questions.append(
                {
                    "dimension": dimension,
                    "question": bank["question"],
                    "reason": bank["reason"],
                    "priority": priority,
                }
            )
        priority_order = {"high": 0, "medium": 1, "low": 2}
        questions.sort(
            key=lambda q: (
                category_order.get(dimension_by_category.get(q["dimension"], ""), 99),
                priority_order[q["priority"]],
            )
        )
        questions = merge_collection_questions(coverage, questions)
    return {
        "mode": "grill_me_with_kb",
        "max_questions": MAX_COLLECTION_QUESTIONS,
        "coverage": coverage,
        "next_questions": questions[:MAX_COLLECTION_QUESTIONS],
    }


def build_current_state(dimension_values):
    score = 0
    positive = []
    negative = []
    neutral = []
    for item in dimension_values:
        if item["polarity"] == "positive":
            score += 1
            positive.append(item)
        elif item["polarity"] == "negative":
            score -= 1
            negative.append(item)
        else:
            neutral.append(item)

    if score <= -2:
        state = "negative"
        label = "负"
        description = "当前更像处在消耗态：身体恢复压力和心理保护性策略同时出现，行动力容易被睡眠、评价压力和内耗拉低。"
    elif score >= 2:
        state = "positive"
        label = "正"
        description = "当前更像处在上升态：多个维度显示资源感和行动感较强，可以把重点放在巩固节律和扩展目标。"
    else:
        state = "neutral"
        label = "平"
        description = "当前更像处在可调平衡态：有一些压力或缺失信息，但还没有形成明显单向判断，需要通过 grill-me 继续补采。"

    return {
        "value": state,
        "label": label,
        "score": score,
        "description": description,
        "positive_dimensions": [item["dimension"] for item in positive],
        "negative_dimensions": [item["dimension"] for item in negative],
        "neutral_dimensions": [item["dimension"] for item in neutral],
    }


def pending_dimension_value(dimension):
    return {
        "dimension": dimension,
        "name": DIMENSION_LABELS[dimension],
        "value": f"{dimension}_pending",
        "label": "待补采",
        "description": "当前提交的信息类别不足两类，暂不生成该维度画像。",
        "confidence": "low",
        "polarity": "neutral",
        "evidence_signal_ids": [],
        "evidence_chunk_ids": [],
        "evidence_chunks": [],
    }


def build_insufficient_profile(intake, coverage):
    dimension_values = [pending_dimension_value(dimension) for dimension in DIMENSION_ORDER]
    collection = build_collection_plan(dimension_values, coverage)
    return {
        "session_id": intake.get("session_id", ""),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "goal": intake.get("goal", ""),
        "collection": {
            **collection,
            "known_signal_count": len(intake.get("signals", [])),
            "input_count": len(intake.get("inputs", [])),
        },
        "dimension_values": dimension_values,
        "current_state": {
            "value": "neutral",
            "label": "平",
            "score": 0,
            "description": "当前提交的信息不足两类，先不生成完整四维画像；请按顺序继续补充必填项。",
            "positive_dimensions": [],
            "negative_dimensions": [],
            "neutral_dimensions": DIMENSION_ORDER,
        },
        "safety": {
            "language": "输出为画像判断/倾向评估，不是医学诊断、临床心理诊断、命运定论或官方 MBTI 测评。",
            "events": intake.get("safety_events", []),
        },
        "engine": {
            "mode": "collection_gate",
            "reason": "At least two information categories are required before generating a full profile.",
        },
    }


def build_profile_rules(intake):
    policy = load_json(POLICY_PATH)
    signals = intake.get("signals", [])
    coverage = build_intake_coverage(signals, intake.get("skipped_categories", []))
    if not coverage["can_generate_profile"]:
        return build_insufficient_profile(intake, coverage)
    dimension_values = [build_dimension_value(dimension, signals, policy) for dimension in DIMENSION_ORDER]
    current_state = build_current_state(dimension_values)
    collection = build_collection_plan(dimension_values, coverage)
    return {
        "session_id": intake.get("session_id", ""),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "goal": intake.get("goal", ""),
        "collection": {
            **collection,
            "known_signal_count": len(signals),
            "input_count": len(intake.get("inputs", [])),
        },
        "dimension_values": dimension_values,
        "current_state": current_state,
        "safety": {
            "language": "输出为画像判断/倾向评估，不是医学诊断、临床心理诊断、命运定论或官方 MBTI 测评。",
            "events": intake.get("safety_events", []),
        },
    }


def build_profile(intake, mode="auto", fallback_on_error=False):
    if mode == "rules":
        return build_profile_rules(intake)
    if mode == "llm":
        return build_profile_llm(intake, fallback_on_error=fallback_on_error)
    if os.environ.get("OPENAI_NEXT_API_KEY"):
        return build_profile_llm(intake, fallback_on_error=fallback_on_error)
    output = build_profile_rules(intake)
    output["engine"] = {
        "mode": "rules_fallback",
        "reason": "OPENAI_NEXT_API_KEY is not set.",
    }
    return output


def main():
    parser = argparse.ArgumentParser(description="Build a first-pass four-dimensional profile from multimodal intake JSON.")
    parser.add_argument("intake", nargs="?", default=str(DEFAULT_INTAKE), help="Path to multimodal intake JSON.")
    parser.add_argument("--mode", choices=["auto", "llm", "rules"], default="auto", help="Use LLM, rules fallback, or auto.")
    parser.add_argument("--fallback-on-error", action="store_true", help="Return rules fallback if the LLM request fails.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output.")
    args = parser.parse_args()

    intake = load_json(args.intake)
    try:
        output = build_profile(intake, mode=args.mode, fallback_on_error=args.fallback_on_error)
    except Exception as exc:
        print(f"profile_engine error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    if args.pretty:
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(output, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()
