SCRIPTS := scripts
PIP     := .venv/bin/pip
PY      := .venv/bin/python

# ──────────────────────────────────────────
# Phase 0: Environment
# ──────────────────────────────────────────

.PHONY: setup setup-training

setup:
	python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install datasets pyyaml jsonlines tqdm

setup-training: setup
	$(PIP) install mlx mlx-lm

# ──────────────────────────────────────────
# Phase 1: Dataset Preparation
# ──────────────────────────────────────────

.PHONY: download convert filter merge validate data

download:
	cd $(SCRIPTS) && ../$(PY) download_datasets.py

convert:
	cd $(SCRIPTS) && ../$(PY) convert_mentalchat16k.py
	cd $(SCRIPTS) && ../$(PY) convert_counsel_chat.py
	cd $(SCRIPTS) && ../$(PY) convert_amod_counseling.py

filter:
	cd $(SCRIPTS) && ../$(PY) filter_and_tag.py

merge:
	cd $(SCRIPTS) && ../$(PY) merge_and_weight.py

validate:
	cd $(SCRIPTS) && ../$(PY) validate_dataset.py

data: download convert filter merge validate

# ──────────────────────────────────────────
# Phase 2: QLoRA Fine-Tuning (MLX)
# ──────────────────────────────────────────

.PHONY: download-model train test-chat

download-model:
	$(PY) -m mlx_lm.convert \
		--hf-path meta-llama/Llama-3.1-8B-Instruct \
		--mlx-path models/llama-8b-mlx \
		-q

train:
	cd $(SCRIPTS) && ../$(PY) -m mlx_lm.lora --config ../configs/training.yaml

fuse:
	$(PY) -m mlx_lm.fuse \
		--model models/llama-8b-mlx \
		--adapter-path models/adapters \
		--save-path models/wellness-llama-merged \
		--dequantize

test-chat:
	cd $(SCRIPTS) && ../$(PY) test_model.py

# ──────────────────────────────────────────
# Phase 3: GGUF Export + Ollama
# ──────────────────────────────────────────

.PHONY: export-gguf ollama-create ollama-run

export-gguf:
	./scripts/export_gguf.sh

ollama-create:
	cd configs && ollama create wellness-chat -f Modelfile

ollama-run:
	ollama run wellness-chat

# ──────────────────────────────────────────
# Full Pipelines
# ──────────────────────────────────────────

.PHONY: all all-training clean

all: data
all-training: setup-training download-model train fuse export-gguf ollama-create

clean:
	rm -rf data/raw data/processed

clean-models:
	rm -rf models/adapters models/wellness-llama-merged models/*.gguf
