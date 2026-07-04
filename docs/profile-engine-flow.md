# Profile Engine Flow

## Scope

This is the first implementation of the product logic. The preferred path is LLM-first:

1. grill-me combines user signals with the knowledge base to decide what it knows and what to ask next.
2. The engine retrieves supporting KB chunks for each dimension.
3. The LLM outputs four abstract dimension values: body, psychology, Xuanxue, and MBTI.
4. The LLM fuses the four values into one current-state value: `正`, `负`, or `平`, with a short explanation.

The implementation is `scripts/profile_engine.py`.

## Input

The engine reads `MultimodalIntakeSession` JSON from `schemas/profile-signal.schema.json`.

Default example:

```bash
python3 scripts/profile_engine.py examples/multimodal-intake.example.json --pretty
```

## API Configuration

The script calls an OpenAI-compatible chat completions API.

Set secrets through environment variables only:

```bash
export OPENAI_NEXT_API_KEY="your-api-key"
export OPENAI_NEXT_BASE_URL="https://api.openai-next.com"
export OPENAI_NEXT_MODEL="claude-sonnet-5"
export OPENAI_NEXT_ANTHROPIC_VERSION="2023-06-01"
export OPENAI_NEXT_MAX_TOKENS="4096"
export OPENAI_NEXT_TEMPERATURE="0"
export OPENAI_NEXT_THINKING="disabled"
```

Do not commit API keys.

See `.env.example` for placeholder variable names. Copy the values into your shell or local secret manager, not into source files.

Modes:

```bash
# Preferred: LLM combines input and KB evidence. Claude models use `/v1/messages`.
python3 scripts/profile_engine.py examples/multimodal-intake.example.json --mode llm --pretty

# Auto: use LLM when OPENAI_NEXT_API_KEY exists, otherwise deterministic fallback.
python3 scripts/profile_engine.py examples/multimodal-intake.example.json --mode auto --pretty

# Local smoke test without network or key.
python3 scripts/profile_engine.py examples/multimodal-intake.example.json --mode rules --pretty
```

## Step 1: grill-me With KB

The engine reads:

- structured signals from text, voice, and images
- `knowledge-base/index/retrieval_policy.json`
- `knowledge-base/index/kb.sqlite`

Before the LLM step, the engine applies the collection gate:

```text
Order: MBTI -> Body -> Ba Zi -> Psychology
Minimum: at least two categories submitted
Skip rule: at most two categories can be skipped; after two skips, later categories are required
Psychology: 3-5 short questions when reached
```

Only explicit user skip actions become `skipped_categories`. If Ba Zi is missing but the user did not skip it, the stage stays `optional_missing` or `required_missing`; it must not be silently treated as skipped just because psychology signals already exist.

For each dimension, the engine:

1. Collects signals routed to that dimension.
2. Retrieves supporting KB chunks using the dimension policy.
3. Packs signals, policy, and evidence chunks into an LLM prompt.
4. Asks the LLM to output follow-up questions that respect the collection order and skip rule.

The output field is:

```json
{
  "collection": {
    "mode": "grill_me_with_kb",
    "max_questions": 5,
    "coverage": {
      "submitted_categories": ["mbti", "body"],
      "needed_categories_to_generate": 0,
      "skipped_count": 0,
      "remaining_skip_count": 2,
      "required_categories": [],
      "can_generate_profile": true
    },
    "known_signal_count": 4,
    "input_count": 3,
    "next_questions": []
  }
}
```

## Step 2: Four Dimension Values

The LLM emits each dimension:

- `value`: abstract machine-readable value.
- `label`: short user-facing label.
- `description`: concrete short explanation.
- `confidence`: `high`, `medium`, or `low`.
- `polarity`: `positive`, `negative`, or `neutral`.
- `evidence_signal_ids`: source signals.
- `evidence_chunk_ids`: supporting KB chunks.

Example:

```json
{
  "dimension": "psychology",
  "name": "心理",
  "value": "protective_avoidance",
  "label": "保护性回避",
  "description": "重要任务前的拖延和评价担心，更像是在保护胜任感与自尊。",
  "confidence": "high",
  "polarity": "negative"
}
```

## Step 3: Current State

The LLM should infer current state from the four dimensions. The fallback rules use simple polarity fusion:

```text
positive dimension -> +1
negative dimension -> -1
neutral dimension  -> 0
```

Rules:

- Score `<= -2`: `负`
- Score `>= 2`: `正`
- Otherwise: `平`

The current-state output always includes a paragraph:

```json
{
  "value": "negative",
  "label": "负",
  "score": -2,
  "description": "当前更像处在消耗态：身体恢复压力和心理保护性策略同时出现，行动力容易被睡眠、评价压力和内耗拉低。"
}
```

## Safety

This engine outputs `画像判断` and `倾向评估`, not diagnosis. It should never claim:

- medical diagnosis
- clinical psychological diagnosis
- fate certainty
- official MBTI assessment
- high-stakes decision advice

## Next Iteration

The deterministic rules are intentionally small and now only serve as fallback. The next useful step is to add tests and tune the LLM prompt with real grill-me sessions while preserving `value`, `confidence`, and `evidence_chunk_ids`.
