"""Merge filtered datasets with weighting, deduplicate, split train/val.

Reads *_filtered.jsonl from intermediate/, applies per-dataset weighting
via resampling, deduplicates by content hash, and outputs final
train.jsonl and val.jsonl.
"""

import json
import random
from pathlib import Path

from schema import Sample, read_jsonl, write_jsonl, sample_hash, load_config, get_logger

log = get_logger(__name__)

INTERMEDIATE_DIR = Path(__file__).parent.parent / "data" / "processed" / "intermediate"
PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"
SAFETY_PATH = Path(__file__).parent.parent / "configs" / "safety_exemplars.json"


def load_safety_exemplars(system_prompt: str) -> list[Sample]:
    with open(SAFETY_PATH) as f:
        raw = json.load(f)

    samples: list[Sample] = []
    for entry in raw:
        messages = [{"role": "system", "content": system_prompt}] + entry["messages"]
        samples.append({
            "messages": messages,
            "source": entry["source"],
            "tags": entry["tags"],
        })
    return samples


def resample(samples: list[Sample], target_count: int, seed: int) -> list[Sample]:
    """Resample to target count. Undersample if too many, oversample if too few."""
    if not samples:
        return []

    rng = random.Random(seed)
    if len(samples) >= target_count:
        return rng.sample(samples, target_count)

    result = list(samples)
    while len(result) < target_count:
        result.append(rng.choice(samples))
    return result


def main() -> None:
    cfg = load_config()
    seed = cfg["split"]["seed"]
    val_ratio = cfg["split"]["val_ratio"]
    dataset_weights = {name: info["weight"] for name, info in cfg["datasets"].items()}
    system_prompt = cfg["system_prompt"].strip()

    # Load filtered files
    all_by_source: dict[str, list[Sample]] = {}
    for path in INTERMEDIATE_DIR.glob("*_filtered.jsonl"):
        source_name = path.stem.replace("_filtered", "")
        samples = read_jsonl(path)
        all_by_source[source_name] = samples
        log.info(f"Loaded {len(samples)} filtered samples from {source_name}")

    if not all_by_source:
        log.warning("No filtered files found. Run filter_and_tag.py first.")
        return

    # Calculate total and per-dataset targets
    total_available = sum(len(s) for s in all_by_source.values())
    log.info(f"Total available samples: {total_available}")

    # Resample per weight
    merged: list[Sample] = []
    for name, samples in all_by_source.items():
        weight = dataset_weights.get(name, 0)
        if weight == 0:
            log.warning(f"No weight configured for {name}, skipping")
            continue

        target = int(total_available * weight)
        resampled = resample(samples, target, seed)
        log.info(f"  {name}: {len(samples)} -> {len(resampled)} (weight={weight})")
        merged.extend(resampled)

    # Add safety exemplars (always included, not weighted)
    safety = load_safety_exemplars(system_prompt)
    merged.extend(safety)
    log.info(f"Added {len(safety)} safety exemplars")

    # Deduplicate
    seen: set[str] = set()
    unique: list[Sample] = []
    for s in merged:
        h = sample_hash(s)
        if h not in seen:
            seen.add(h)
            unique.append(s)
    log.info(f"After dedup: {len(merged)} -> {len(unique)}")

    # Shuffle and split
    rng = random.Random(seed)
    rng.shuffle(unique)

    val_count = max(1, int(len(unique) * val_ratio))
    val_set = unique[:val_count]
    train_set = unique[val_count:]

    log.info(f"Split: {len(train_set)} train, {len(val_set)} val")

    write_jsonl(train_set, PROCESSED_DIR / "train.jsonl")
    write_jsonl(val_set, PROCESSED_DIR / "valid.jsonl")


if __name__ == "__main__":
    main()
