# AI-service: Wellness LLM Dataset Pipeline

Dataset preparation pipeline for fine-tuning a wellness chatbot LLM with QLoRA.

## What This Does

Downloads, normalizes, filters, and merges public mental health conversation datasets into a single `train.jsonl` + `val.jsonl` ready for fine-tuning.

**This chatbot is NOT a therapist.** It's a supportive companion that listens, shares general wellness tips, and directs users to real professionals when needed. The pipeline enforces this by filtering out diagnostic/prescriptive content and including safety exemplars.

## Datasets

| Dataset | Source | Size | What It Adds |
|---|---|---|---|
| [MentalChat16K](https://huggingface.co/datasets/ShenLab/MentalChat16K) | ShenLab | 16.1K rows | Broad coverage of 33 mental health topics, mix of real clinical transcripts and synthetic conversations |
| [CounselChat](https://huggingface.co/datasets/nbertagnolli/counsel-chat) | nbertagnolli | 2.8K rows | Real licensed therapist responses with topic labels and community upvotes |
| [Amod Counseling](https://huggingface.co/datasets/Amod/mental_health_counseling_conversations) | Amod | 3.5K rows | Real one-on-one counseling Q&A pairs |
| Safety Exemplars | Hand-written | 15 convos | Boundary-setting, crisis referrals, refusal of harmful requests |

## Quick Start

```bash
make setup      # create venv + install deps
make all        # run full pipeline (download -> convert -> filter -> merge -> validate)
```

Or step by step:

```bash
make download   # download datasets from HuggingFace
make convert    # normalize each dataset to standard format
make filter     # apply safety filters + tag samples
make merge      # weight, deduplicate, split train/val
make validate   # check output integrity
```

## Output

```
data/processed/
  train.jsonl    # training set (95%)
  val.jsonl      # validation set (5%)
```

Each line:

```json
{
  "messages": [
    {"role": "system", "content": "You are a friendly wellness chatbot..."},
    {"role": "user", "content": "I've been really stressed about exams..."},
    {"role": "assistant", "content": "That sounds tough. Let's talk about..."}
  ],
  "source": "mentalchat16k",
  "tags": ["stress", "academic", "coping"]
}
```

## Inspecting Samples

```bash
# view first 5 training samples
head -5 data/processed/train.jsonl | python3 -m json.tool

# count samples per source
cat data/processed/train.jsonl | python3 -c "
import sys, json, collections
c = collections.Counter(json.loads(l)['source'] for l in sys.stdin)
print(dict(c))
"
```

## Fine-Tuning & GGUF Export

Once you have the dataset prepared (`make all`), you can fine-tune Llama 3.1 8B and export a GGUF for serving.

### Prerequisites

- **Apple Silicon Mac with 16GB+ RAM** (training uses MLX — Apple's native ML framework)
- **HuggingFace access** to [meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct) (gated model — request access first, then `huggingface-cli login`)
- **CMake** (for building llama.cpp quantize tool): `brew install cmake`
- **Ollama** (for serving): [ollama.com](https://ollama.com)

### Full Training Pipeline

```bash
make setup-training   # install MLX dependencies
make download-model   # download Llama 3.1 8B, quantize to 4-bit MLX (~4.2GB)
make train            # QLoRA fine-tune — ~1000 iterations, ~2-3 hrs on M2
make fuse             # merge LoRA adapters into base model
make export-gguf      # convert to GGUF, quantize to Q4_K_M (~4.5GB)
```

Or run it all at once:

```bash
make all-training     # runs the full pipeline end to end
```

### Serve With Ollama

```bash
make ollama-create    # register model with Ollama
make ollama-run       # start chatting
```

The model is served with an OpenAI-compatible API at `http://localhost:11434/v1/chat/completions`.

### Training Config

Edit `configs/training.yaml` to adjust hyperparameters. Defaults are tuned for M2 16GB:

| Parameter | Default | Notes |
|-----------|---------|-------|
| batch_size | 1 | Limited by 16GB unified memory |
| max_seq_length | 1024 | ~750 words per conversation |
| lora_layers | 16 | Adapts upper 16 of 32 transformer layers |
| rank | 16 | LoRA rank — higher = more expressive |
| iters | 1000 | ~0.45 epochs over ~2.2K samples |
| learning_rate | 2e-5 | Standard for LoRA fine-tuning |

### Adapting for CUDA (non-Mac)

The dataset output is framework-agnostic. `train.jsonl` and `val.jsonl` use the standard chat messages format compatible with:
- **Hugging Face TRL** (SFTTrainer with chat template)
- **Axolotl** (sharegpt format)

You would skip `make download-model` / `make train` / `make fuse` and use your own training script with the data in `data/processed/`.

## Pipeline Config

Edit `configs/pipeline.yaml` to adjust:
- Dataset weights (how much of each dataset in the final mix)
- Train/val split ratio and seed
- Filter thresholds (min/max message lengths)
- System prompt

## Safety & Ethics

- All assistant responses are filtered for diagnostic language and prescriptive medical advice
- Content with explicit self-harm instructions or harassment is excluded
- 15 hand-written safety exemplars teach the model to set boundaries, refer to professionals, and handle crisis situations
- The system prompt explicitly states the chatbot is NOT a therapist
- This pipeline produces training data only — the fine-tuned model should still be reviewed before deployment

## Project Structure

```
AI-service/
├── configs/
│   ├── pipeline.yaml          # weights, splits, filters, system prompt
│   └── safety_exemplars.json  # hand-written boundary/crisis examples
├── scripts/
│   ├── schema.py              # shared types and utilities
│   ├── download_datasets.py   # download from HuggingFace
│   ├── convert_mentalchat16k.py
│   ├── convert_counsel_chat.py
│   ├── convert_amod_counseling.py
│   ├── filter_and_tag.py      # safety filtering + wellness tagging
│   ├── merge_and_weight.py    # weight, dedup, train/val split
│   └── validate_dataset.py    # output validation
├── data/                      # gitignored
│   ├── raw/                   # downloaded datasets
│   └── processed/
│       ├── intermediate/      # per-dataset converted + filtered files
│       ├── train.jsonl        # final training set
│       └── val.jsonl          # final validation set
├── Makefile
├── pyproject.toml
└── README.md
```
