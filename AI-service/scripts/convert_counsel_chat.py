"""Convert CounselChat (nbertagnolli/counsel-chat) to standard messages format.

Source columns: questionTitle, questionText, answerText, topic, upvotes
- questionText: user/client question
- answerText: licensed therapist response
- topic: category label (e.g., "depression", "anxiety")
- upvotes: community quality signal
"""

from pathlib import Path

from datasets import load_from_disk

from schema import Sample, load_config, write_jsonl, get_logger

log = get_logger(__name__)

RAW_DIR = Path(__file__).parent.parent / "data" / "raw" / "counsel_chat"
OUT_PATH = Path(__file__).parent.parent / "data" / "processed" / "intermediate" / "counsel_chat.jsonl"


def convert() -> None:
    cfg = load_config()
    system_prompt = cfg["system_prompt"].strip()

    log.info("Loading CounselChat from disk")
    ds = load_from_disk(str(RAW_DIR))
    rows = ds["train"] if "train" in ds else ds

    samples: list[Sample] = []
    skipped = 0

    for row in rows:
        user_text = (row.get("questionText") or "").strip()
        assistant_text = (row.get("answerText") or "").strip()

        if not user_text or not assistant_text:
            skipped += 1
            continue

        topic = (row.get("topic") or "").strip().lower()
        tags = [topic] if topic else []

        samples.append({
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
                {"role": "assistant", "content": assistant_text},
            ],
            "source": "counsel_chat",
            "tags": tags,
        })

    log.info(f"Converted {len(samples)} samples, skipped {skipped}")
    write_jsonl(samples, OUT_PATH)


if __name__ == "__main__":
    convert()
