"""Interactive chat loop to test the fine-tuned model locally via MLX."""

import sys
from pathlib import Path

from schema import load_config, get_logger

log = get_logger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models"


def main() -> None:
    try:
        from mlx_lm import load, generate
    except ImportError:
        log.error("mlx-lm not installed. Run: make setup-training")
        sys.exit(1)

    cfg = load_config()
    system_prompt = cfg["system_prompt"].strip()

    # Use fused model if available, otherwise base + adapter
    fused_path = MODELS_DIR / "wellness-llama-merged"
    adapter_path = MODELS_DIR / "adapters"
    base_path = MODELS_DIR / "llama-8b-mlx"

    if fused_path.exists():
        log.info(f"Loading fused model from {fused_path}")
        model, tokenizer = load(str(fused_path))
    elif adapter_path.exists() and base_path.exists():
        log.info(f"Loading base model + adapter")
        model, tokenizer = load(str(base_path), adapter_path=str(adapter_path))
    else:
        log.error("No model found. Run training first (make train) or fuse (make fuse).")
        sys.exit(1)

    print("\nWellness Chat (type 'quit' to exit)")
    print("-" * 40)

    while True:
        try:
            user_input = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not user_input or user_input.lower() in ("quit", "exit"):
            break

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ]

        prompt = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        response = generate(
            model, tokenizer, prompt=prompt,
            max_tokens=512, temp=0.7, top_p=0.9,
        )

        print(f"\nAssistant: {response}")


if __name__ == "__main__":
    main()
