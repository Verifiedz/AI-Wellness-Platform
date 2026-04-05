"""Filter unsafe content and tag samples with wellness categories.

Reads intermediate JSONL files, applies safety filters, adds tags,
writes filtered output back to intermediate/.
"""

import re
from pathlib import Path

from schema import Sample, read_jsonl, write_jsonl, load_config, get_logger

log = get_logger(__name__)

INTERMEDIATE_DIR = Path(__file__).parent.parent / "data" / "processed" / "intermediate"

# Patterns that indicate the assistant is diagnosing or prescribing
UNSAFE_PATTERNS = [
    r"\byou (?:have|suffer from|are diagnosed with)\b",
    r"\bi (?:diagnose|prescribe)\b",
    r"\btake (?:this|these) (?:medication|pills|drugs)\b",
    r"\bmg (?:daily|twice|once)\b",
    r"\byou should (?:stop|start) (?:taking|using) (?:your |the )?(?:medication|meds)\b",
]

# Content that should be excluded entirely
EXCLUDE_PATTERNS = [
    r"\b(?:kill|hurt) (?:yourself|himself|herself|themselves)\b.*(?:how|steps|method)",
    r"\b(?:self[- ]?harm) (?:instructions|tutorial|guide)\b",
    r"\b(?:suicide method|how to die)\b",
]

# Tag detection patterns
TAG_PATTERNS = {
    "stress": r"\b(?:stress|overwhelm|burnout|pressure)\b",
    "anxiety": r"\b(?:anxi|worry|panic|nervous|fear)\b",
    "depression": r"\b(?:depress|sad|hopeless|worthless|empty)\b",
    "sleep": r"\b(?:sleep|insomnia|tired|fatigue|restless)\b",
    "relationships": r"\b(?:relationship|partner|friend|family|lonel)\b",
    "academic": r"\b(?:exam|study|grade|school|university|college|assignment)\b",
    "mindfulness": r"\b(?:mindful|meditat|breath|grounding|relax)\b",
    "coping": r"\b(?:coping|self[- ]?care|routine|habit|exercise)\b",
}


def is_unsafe(text: str) -> bool:
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in EXCLUDE_PATTERNS)


def has_diagnostic_language(text: str) -> bool:
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in UNSAFE_PATTERNS)


def derive_tags(sample: Sample) -> list[str]:
    full_text = " ".join(m["content"] for m in sample["messages"]).lower()
    tags = set(sample.get("tags") or [])
    for tag, pattern in TAG_PATTERNS.items():
        if re.search(pattern, full_text):
            tags.add(tag)
    return sorted(tags)


def filter_sample(sample: Sample, cfg: dict) -> bool:
    """Return True if sample should be kept."""
    filters = cfg["filters"]
    assistant_msgs = [m for m in sample["messages"] if m["role"] == "assistant"]
    user_msgs = [m for m in sample["messages"] if m["role"] == "user"]

    if not assistant_msgs or not user_msgs:
        return False

    for msg in assistant_msgs:
        if len(msg["content"]) < filters["min_assistant_length"]:
            return False
        if len(msg["content"]) > filters["max_assistant_length"]:
            return False
        if is_unsafe(msg["content"]):
            return False
        if has_diagnostic_language(msg["content"]):
            return False

    for msg in user_msgs:
        if len(msg["content"]) < filters["min_user_length"]:
            return False
        if is_unsafe(msg["content"]):
            return False

    return True


def main() -> None:
    cfg = load_config()
    files = list(INTERMEDIATE_DIR.glob("*.jsonl"))

    if not files:
        log.warning("No intermediate files found. Run conversion scripts first.")
        return

    for path in files:
        if path.stem.endswith("_filtered"):
            continue

        log.info(f"Filtering {path.name}")
        samples = read_jsonl(path)
        original_count = len(samples)

        kept: list[Sample] = []
        for s in samples:
            if filter_sample(s, cfg):
                s["tags"] = derive_tags(s)
                kept.append(s)

        removed = original_count - len(kept)
        log.info(f"  {path.name}: {original_count} -> {len(kept)} (removed {removed})")

        out_path = path.with_stem(path.stem + "_filtered")
        write_jsonl(kept, out_path)


if __name__ == "__main__":
    main()
