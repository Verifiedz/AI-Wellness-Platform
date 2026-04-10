"""Shared types and utilities for the dataset pipeline."""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import TypedDict

import yaml


class Message(TypedDict):
    role: str
    content: str


class Sample(TypedDict):
    messages: list[Message]
    source: str
    tags: list[str]


def load_config(path: Path | None = None) -> dict:
    if path is None:
        path = Path(__file__).parent.parent / "configs" / "pipeline.yaml"
    with open(path) as f:
        return yaml.safe_load(f)


def sample_hash(sample: Sample) -> str:
    """Deterministic hash of a sample for deduplication."""
    content = "".join(m["content"] for m in sample["messages"] if m["role"] != "system")
    return hashlib.sha256(content.encode()).hexdigest()


def write_jsonl(samples: list[Sample], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for s in samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    logging.info(f"Wrote {len(samples)} samples to {path}")


def read_jsonl(path: Path) -> list[Sample]:
    samples: list[Sample] = []
    with open(path) as f:
        for line in f:
            if line.strip():
                samples.append(json.loads(line))
    return samples


def get_logger(name: str) -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    return logging.getLogger(name)
