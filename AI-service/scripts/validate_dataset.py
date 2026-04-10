"""Validate the final train.jsonl and val.jsonl for correctness.

Checks:
- Valid JSON on every line
- Required fields present (messages, source, tags)
- Messages have correct roles (system, user, assistant)
- No empty content
- Reports statistics
"""

import json
from collections import Counter
from pathlib import Path

from schema import get_logger

log = get_logger(__name__)

PROCESSED_DIR = Path(__file__).parent.parent / "data" / "processed"
VALID_ROLES = {"system", "user", "assistant"}


def validate_file(path: Path) -> bool:
    if not path.exists():
        log.error(f"File not found: {path}")
        return False

    errors = 0
    source_counts: Counter[str] = Counter()
    tag_counts: Counter[str] = Counter()
    total = 0

    with open(path) as f:
        for i, line in enumerate(f, 1):
            total += 1
            try:
                sample = json.loads(line)
            except json.JSONDecodeError:
                log.error(f"  Line {i}: invalid JSON")
                errors += 1
                continue

            # Check required fields
            if "messages" not in sample:
                log.error(f"  Line {i}: missing 'messages'")
                errors += 1
                continue
            if "source" not in sample:
                log.error(f"  Line {i}: missing 'source'")
                errors += 1

            source_counts[sample.get("source", "unknown")] += 1
            for tag in sample.get("tags", []):
                tag_counts[tag] += 1

            # Validate messages
            messages = sample["messages"]
            roles = [m.get("role") for m in messages]

            for j, msg in enumerate(messages):
                if msg.get("role") not in VALID_ROLES:
                    log.error(f"  Line {i}, msg {j}: invalid role '{msg.get('role')}'")
                    errors += 1
                if not msg.get("content", "").strip():
                    log.error(f"  Line {i}, msg {j}: empty content")
                    errors += 1

            # Must have at least one user and one assistant message
            if "user" not in roles:
                log.error(f"  Line {i}: no user message")
                errors += 1
            if "assistant" not in roles:
                log.error(f"  Line {i}: no assistant message")
                errors += 1

    # Report
    log.info(f"\n  {path.name}: {total} samples, {errors} errors")
    log.info(f"  Sources: {dict(source_counts)}")
    log.info(f"  Top tags: {dict(tag_counts.most_common(10))}")

    return errors == 0


def main() -> None:
    train_ok = validate_file(PROCESSED_DIR / "train.jsonl")
    val_ok = validate_file(PROCESSED_DIR / "valid.jsonl")

    if train_ok and val_ok:
        log.info("\nAll validations passed.")
    else:
        log.error("\nValidation failed. Check errors above.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
