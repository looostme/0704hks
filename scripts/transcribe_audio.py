#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import json
import mimetypes
import os
import re
import sys
import uuid
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_BASE_URL = "https://api.openai-next.com"
DEFAULT_ASR_MODELS = ["gpt-4o-transcribe", "whisper-1"]
DEFAULT_MAX_AUDIO_MB = 24
SUPPORTED_AUDIO_EXTENSIONS = {".aac", ".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".mpga", ".oga", ".ogg", ".wav", ".webm"}
SUPPORTED_AUDIO_MIME_PREFIXES = ("audio/",)
SUPPORTED_AUDIO_MIME_TYPES = {"video/mp4", "application/ogg"}
VALID_DIMENSIONS = {"tcm_body", "psychology", "xuanxue_spirit", "mbti"}
VALID_SIGNAL_TYPES = {
    "goal",
    "body_state",
    "sleep",
    "digestion",
    "temperature_sense",
    "emotion_state",
    "stress_state",
    "repeated_pattern",
    "self_evaluation",
    "relationship_pattern",
    "voice_delivery",
    "tongue_observation",
    "face_observation",
    "palm_observation",
    "birth_info",
    "mbti_known",
    "preference_clue",
    "safety_risk",
    "other",
}
CATEGORY_DIMENSIONS = {
    "mbti": ["mbti"],
    "body": ["tcm_body", "psychology"],
    "bazi": ["xuanxue_spirit"],
    "psychology": ["psychology"],
}
CATEGORY_SIGNAL_TYPE = {
    "mbti": "preference_clue",
    "body": "body_state",
    "bazi": "birth_info",
    "psychology": "stress_state",
}


class ASRError(RuntimeError):
    pass


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def split_csv(value):
    if not value:
        return []
    if isinstance(value, list):
        parts = []
        for item in value:
            parts.extend(split_csv(item))
        return parts
    return [part.strip() for part in str(value).split(",") if part.strip()]


def transcription_endpoint(base_url):
    base_url = base_url.rstrip("/")
    if base_url.endswith("/audio/transcriptions"):
        return base_url
    if base_url.endswith("/v1"):
        return base_url + "/audio/transcriptions"
    return base_url + "/v1/audio/transcriptions"


def audio_mime_type(audio_path):
    return mimetypes.guess_type(str(audio_path))[0] or "application/octet-stream"


def validate_audio_file(audio_path, max_audio_mb):
    suffix = audio_path.suffix.lower()
    mime_type = audio_mime_type(audio_path)
    if suffix not in SUPPORTED_AUDIO_EXTENSIONS and not (
        mime_type.startswith(SUPPORTED_AUDIO_MIME_PREFIXES) or mime_type in SUPPORTED_AUDIO_MIME_TYPES
    ):
        raise SystemExit(
            f"Unsupported audio format: {suffix or 'unknown'} ({mime_type}). "
            "Use m4a, mp3, wav, webm, ogg, flac, or another ASR-supported audio file."
        )

    max_bytes = int(max_audio_mb * 1024 * 1024)
    size = audio_path.stat().st_size
    if size <= 0:
        raise SystemExit(f"Audio file is empty: {audio_path}")
    if size > max_bytes:
        raise SystemExit(
            f"Audio file is too large: {size / 1024 / 1024:.1f} MB. "
            f"Limit is {max_audio_mb} MB; compress or trim it before upload."
        )


def sanitize_error(message, limit=700):
    message = re.sub(r"(Bearer|x-api-key)\s+[A-Za-z0-9._:-]+", r"\1 [redacted]", str(message))
    message = re.sub(r"sk-[A-Za-z0-9]+", "sk-[redacted]", message)
    message = re.sub(r"\s+", " ", message).strip()
    if len(message) > limit:
        return message[: limit - 1] + "..."
    return message


def encode_multipart(fields, file_field, boundary=None):
    boundary = boundary or f"----0704hks-{uuid.uuid4().hex}"
    lines = []
    for name, value in fields.items():
        if value is None:
            continue
        lines.extend(
            [
                f"--{boundary}".encode("utf-8"),
                f'Content-Disposition: form-data; name="{name}"'.encode("utf-8"),
                b"",
                str(value).encode("utf-8"),
            ]
        )

    field_name, filename, content_type, data = file_field
    lines.extend(
        [
            f"--{boundary}".encode("utf-8"),
            (
                f'Content-Disposition: form-data; name="{field_name}"; '
                f'filename="{filename}"'
            ).encode("utf-8"),
            f"Content-Type: {content_type}".encode("utf-8"),
            b"",
            data,
            f"--{boundary}--".encode("utf-8"),
            b"",
        ]
    )
    return b"\r\n".join(lines), f"multipart/form-data; boundary={boundary}"


def transcribe_once(audio_path, model, api_key, base_url, language=None, prompt=None, timeout=90):
    endpoint = transcription_endpoint(base_url)
    audio_data = Path(audio_path).read_bytes()
    mime_type = audio_mime_type(audio_path)
    fields = {
        "model": model,
        "response_format": "json",
        "language": language,
        "prompt": prompt,
    }
    data, content_type = encode_multipart(
        fields,
        ("file", Path(audio_path).name, mime_type, audio_data),
    )
    request = urllib.request.Request(
        endpoint,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": content_type,
            "User-Agent": "curl/8.7.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise ASRError(f"ASR API HTTP {exc.code}: {sanitize_error(body)}") from exc
    except urllib.error.URLError as exc:
        raise ASRError(f"ASR API request failed: {sanitize_error(exc.reason)}") from exc

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ASRError(f"ASR API returned non-JSON response: {body[:500]}") from exc

    if isinstance(parsed, dict) and parsed.get("error"):
        error = sanitize_error(json.dumps(parsed["error"], ensure_ascii=False))
        raise ASRError(f"ASR API error for {model}: {error}")
    return parsed


def transcribe_with_fallback(audio_path, models, api_key, base_url, language=None, prompt=None, timeout=90):
    errors = []
    for model in models:
        try:
            response = transcribe_once(
                audio_path,
                model,
                api_key,
                base_url,
                language=language,
                prompt=prompt,
                timeout=timeout,
            )
            return model, response, errors
        except ASRError as exc:
            errors.append({"model": model, "error": sanitize_error(exc)})
    raise ASRError(json.dumps({"message": "All ASR models failed.", "errors": errors}, ensure_ascii=False))


def extract_transcript(response):
    if isinstance(response, dict):
        text = response.get("text", "")
        if isinstance(text, str):
            return text.strip()
    return ""


def quality_for_transcript(transcript):
    if not transcript:
        return {
            "status": "unusable",
            "issues": ["incomplete"],
            "should_retry": True,
            "retry_prompt": "这段语音没有识别出有效内容，可以重新录一遍，或直接打字告诉我最困扰你的点。",
        }, "unknown"
    if len(transcript) < 4:
        return {
            "status": "low",
            "issues": ["incomplete"],
            "should_retry": True,
            "retry_prompt": "这段语音识别内容太短，可以重新录一遍，或直接打字补充完整。",
        }, "low"
    return {
        "status": "medium",
        "issues": [],
        "should_retry": False,
        "notes": "ASR 已识别出可用文本；未提供词级置信度，按中等置信度进入后续抽取。",
    }, "medium"


def compact_value(text, limit=80):
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "..."


def infer_signal_type(transcript, category):
    text = transcript.upper()
    if re.search(r"\b[IE][NS][FT][JP]\b", text):
        return "mbti_known"
    if re.search(r"\d{4}.*(年|/|-).*(\d{1,2}|[一二三四五六七八九十]{1,3}).*(月|/|-)", transcript):
        return "birth_info"

    keyword_rules = [
        ("sleep", ["睡", "多梦", "失眠", "醒", "困", "熬夜"]),
        ("digestion", ["胃", "消化", "腹", "便", "食欲", "胀", "反酸"]),
        ("temperature_sense", ["怕冷", "怕热", "手脚冷", "燥热", "出汗"]),
        ("emotion_state", ["焦虑", "烦", "难过", "低落", "生气", "麻木"]),
        ("repeated_pattern", ["拖延", "讨好", "控制", "回避", "反复", "总是"]),
        ("relationship_pattern", ["关系", "伴侣", "朋友", "同事", "家人", "冲突"]),
        ("stress_state", ["压力", "紧张", "内耗", "崩", "累"]),
    ]
    for signal_type, keywords in keyword_rules:
        if any(keyword in transcript for keyword in keywords):
            return signal_type
    if category in CATEGORY_SIGNAL_TYPE:
        return CATEGORY_SIGNAL_TYPE[category]
    return "other"


def infer_dimensions(signal_type, category):
    if signal_type in {"sleep", "digestion", "temperature_sense", "body_state"}:
        return ["tcm_body", "psychology"]
    if signal_type in {
        "emotion_state",
        "stress_state",
        "repeated_pattern",
        "self_evaluation",
        "relationship_pattern",
        "voice_delivery",
    }:
        return ["psychology"]
    if signal_type == "birth_info":
        return ["xuanxue_spirit"]
    if signal_type in {"mbti_known", "preference_clue"}:
        return ["mbti"]
    return CATEGORY_DIMENSIONS.get(category, [])


def default_source_uri(input_id, audio_path, include_local_uri=False):
    if include_local_uri:
        return str(audio_path.resolve())
    return f"voice://{input_id}/{audio_path.name}"


def build_raw_input(input_id, audio_path, quality, source_uri=None, include_local_uri=False):
    mime_type = audio_mime_type(audio_path)
    return {
        "id": input_id,
        "modality": "voice",
        "created_at": utc_now(),
        "source": {
            "kind": "voice_recording",
            "uri": source_uri or default_source_uri(input_id, audio_path, include_local_uri=include_local_uri),
            "mime_type": mime_type,
        },
        "quality": quality,
    }


def build_signal(signal_id, input_id, transcript, transcript_confidence, signal_type, dimensions):
    confidence = "low" if transcript_confidence in {"unknown", "low"} else "medium"
    return {
        "id": signal_id,
        "modality": "voice",
        "type": signal_type,
        "value": compact_value(transcript),
        "transcript": transcript,
        "transcript_confidence": transcript_confidence,
        "confidence": confidence,
        "dimension_hint": dimensions,
        "evidence": [
            {
                "kind": "raw_input",
                "id": input_id,
            }
        ],
        "safety": {
            "usage": "语音转文字后作为用户自述线索，进入后续文本信号抽取和四维画像。",
            "must_not": ["医学诊断", "心理诊断", "人格定论", "真实性判断"],
        },
    }


def resolve_models(args):
    models = split_csv(args.model)
    if models:
        return models
    env_models = split_csv(os.environ.get("OPENAI_NEXT_ASR_MODELS"))
    if env_models:
        return env_models
    env_model = split_csv(os.environ.get("OPENAI_NEXT_ASR_MODEL"))
    if env_model:
        return env_model
    return list(DEFAULT_ASR_MODELS)


def validate_dimensions(dimensions):
    invalid = [item for item in dimensions if item not in VALID_DIMENSIONS]
    if invalid:
        raise SystemExit(f"Invalid dimension_hint: {', '.join(invalid)}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Transcribe a voice recording through openai-next and emit a profile-ready voice signal."
    )
    parser.add_argument("audio", help="Path to an audio file, such as m4a, mp3, wav, or webm.")
    parser.add_argument("--input-id", default="input_voice_001", help="Raw input id used in the intake JSON.")
    parser.add_argument("--signal-id", default="sig_voice_001", help="Signal id used in the intake JSON.")
    parser.add_argument(
        "--category",
        choices=["auto", "mbti", "body", "bazi", "psychology"],
        default="auto",
        help="Collection category. Used only for fallback signal routing.",
    )
    parser.add_argument(
        "--dimension-hint",
        action="append",
        help="Override dimension hints. Can be repeated or comma-separated.",
    )
    parser.add_argument(
        "--signal-type",
        choices=sorted(VALID_SIGNAL_TYPES),
        help="Override inferred signal type.",
    )
    parser.add_argument(
        "--model",
        action="append",
        help="ASR model name. Can be repeated or comma-separated. Defaults to OPENAI_NEXT_ASR_MODELS or gpt-4o-transcribe,whisper-1.",
    )
    parser.add_argument("--language", default=os.environ.get("OPENAI_NEXT_ASR_LANGUAGE", "zh"))
    parser.add_argument("--prompt", help="Optional ASR prompt with domain words or expected language.")
    parser.add_argument(
        "--source-uri",
        help="Stable storage URI for the raw input, such as r2://bucket/key. Defaults to a non-local voice:// URI.",
    )
    parser.add_argument(
        "--include-local-path",
        action="store_true",
        help="Include the absolute local audio path in output. Avoid this for persisted or shared intake JSON.",
    )
    parser.add_argument(
        "--max-audio-mb",
        type=float,
        default=float(os.environ.get("OPENAI_NEXT_ASR_MAX_AUDIO_MB", DEFAULT_MAX_AUDIO_MB)),
        help="Reject audio files larger than this many MB before upload.",
    )
    parser.add_argument("--base-url", default=os.environ.get("OPENAI_NEXT_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument("--api-key-env", default="OPENAI_NEXT_API_KEY")
    parser.add_argument("--timeout", type=int, default=int(os.environ.get("OPENAI_NEXT_ASR_TIMEOUT", "90")))
    parser.add_argument("--output", help="Write JSON output to this file.")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON.")
    parser.add_argument("--include-raw-response", action="store_true", help="Include the raw ASR API response.")
    return parser.parse_args()


def main():
    args = parse_args()
    audio_path = Path(args.audio)
    if not audio_path.exists():
        raise SystemExit(f"Audio file not found: {audio_path}")
    if not audio_path.is_file():
        raise SystemExit(f"Audio path is not a file: {audio_path}")
    validate_audio_file(audio_path, args.max_audio_mb)

    api_key = os.environ.get(args.api_key_env)
    if not api_key:
        raise SystemExit(f"Missing {args.api_key_env}. Set it in the environment, not in source code.")

    models = resolve_models(args)
    model, response, fallbacks = transcribe_with_fallback(
        audio_path,
        models,
        api_key,
        args.base_url,
        language=args.language,
        prompt=args.prompt,
        timeout=args.timeout,
    )
    transcript = extract_transcript(response)
    quality, transcript_confidence = quality_for_transcript(transcript)
    category = None if args.category == "auto" else args.category
    signal_type = args.signal_type or infer_signal_type(transcript, category)
    dimensions = split_csv(args.dimension_hint) or infer_dimensions(signal_type, category)
    validate_dimensions(dimensions)

    raw_input = build_raw_input(
        args.input_id,
        audio_path,
        quality,
        source_uri=args.source_uri,
        include_local_uri=args.include_local_path,
    )
    signal = None
    if transcript:
        signal = build_signal(
            args.signal_id,
            args.input_id,
            transcript,
            transcript_confidence,
            signal_type,
            dimensions,
        )

    output = {
        "audio_file": audio_path.name,
        "input_id": args.input_id,
        "transcript": transcript,
        "language": args.language,
        "transcript_confidence": transcript_confidence,
        "quality": quality,
        "asr": {
            "provider": "openai-compatible",
            "base_url": args.base_url.rstrip("/"),
            "endpoint": transcription_endpoint(args.base_url),
            "model": model,
            "attempted_models": models,
            "fallback_errors": fallbacks,
        },
        "input": raw_input,
        "signal": signal,
        "next_step": "Append input to intake.inputs and signal to intake.signals, then run scripts/profile_engine.py.",
    }
    if args.include_raw_response:
        output["raw_response"] = response
    if args.include_local_path:
        output["audio_path"] = str(audio_path.resolve())

    text = json.dumps(output, ensure_ascii=False, indent=2 if args.pretty else None)
    if args.output:
        Path(args.output).write_text(text + "\n", encoding="utf-8")
    else:
        print(text)


if __name__ == "__main__":
    try:
        main()
    except ASRError as exc:
        print(f"transcribe_audio error: {exc}", file=sys.stderr)
        sys.exit(1)
