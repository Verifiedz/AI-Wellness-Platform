"""Download all datasets from HuggingFace to data/raw/."""

from pathlib import Path

from datasets import load_dataset

from schema import load_config, get_logger

log = get_logger(__name__)
RAW_DIR = Path(__file__).parent.parent / "data" / "raw"


def download(name: str, hf_path: str) -> None:
    dest = RAW_DIR / name
    if dest.exists() and any(dest.iterdir()):
        log.info(f"Skipping {name} (already downloaded)")
        return

    log.info(f"Downloading {hf_path} -> {dest}")
    ds = load_dataset(hf_path)
    ds.save_to_disk(str(dest))
    log.info(f"Saved {name}")


def main() -> None:
    cfg = load_config()
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    for name, info in cfg["datasets"].items():
        try:
            download(name, info["hf_path"])
        except Exception as e:
            log.warning(f"Failed to download {name}: {e}. Skipping.")


if __name__ == "__main__":
    main()
