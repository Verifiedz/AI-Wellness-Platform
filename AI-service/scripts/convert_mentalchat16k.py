"""Convert MentalChat16K (ShenLab/MentalChat16K) to standard messages format.

Source columns: instruction, input, output
- instruction: system-level prompt (varies per row, we replace with ours)
- input: user/patient message
- output: assistant/counselor response
"""

from pathlib import Path

from datasets import load_from_disk

from schema import Sample, load_config, write_jsonl, get_logger

log = get_logger(__name__)

RAW_DIR = Path(__file__).parent.parent / "data" / "raw" / "mentalchat16k"
OUT_PATH = Path(__file__).parent.parent / "data" / "processed" / "intermediate" / "mentalchat16k.jsonl"


def convert() -> None:
    cfg = load_config()
    system_prompt = cfg["system_prompt"].strip()

    log.info("Loading MentalChat16K from disk")
    ds = load_from_disk(str(RAW_DIR))
    rows = ds["train"] if "train" in ds else ds

    samples: list[Sample] = []
    skipped = 0

    for row in rows:
        user_text = (row.get("input") or "").strip()
        assistant_text = (row.get("output") or "").strip()

        if not user_text or not assistant_text:
            skipped += 1
            continue

        samples.append({
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
                {"role": "assistant", "content": assistant_text},
            ],
            "source": "mentalchat16k",
            "tags": [],
        })

    log.info(f"Converted {len(samples)} samples, skipped {skipped}")
    write_jsonl(samples, OUT_PATH)


if __name__ == "__main__":
    convert()
