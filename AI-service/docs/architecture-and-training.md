# AI Service — Architecture, Training & Design Decisions

## Architecture & Workflow

The pipeline has **3 phases**:

```
Raw Datasets (HuggingFace)
  -> Download -> Convert -> Filter/Tag -> Merge/Weight -> Deduplicate -> Split
    -> QLoRA Fine-tune (MLX) -> Fuse Adapters -> Export GGUF -> Deploy via Ollama on RunPod
```

**Phase 1 — Data Prep:** Downloads 3 HuggingFace datasets, normalizes them into a standard `{messages, source, tags}` format, applies safety filters, tags by wellness topic, resamples with weights (50/25/25), deduplicates by SHA256, and splits 95/5 train/val. Final output: ~2,200 training samples.

**Phase 2 — Fine-tuning:** Takes Llama-3.1-8B-Instruct, quantizes to 4-bit MLX format, trains LoRA adapters, fuses them into a merged model.

**Phase 3 — Export/Deploy:** Converts to GGUF, quantizes to Q4_K_M (~4.5GB), creates an Ollama model, deploys on RunPod (A5000 GPU, $0.27/hr).

---

## Tech Stack & Why

| Choice | Why |
|--------|-----|
| **Llama-3.1-8B-Instruct** | Best open-source instruction-tuned model at this size. 8B params is the sweet spot — large enough to be coherent on mental health topics, small enough to fine-tune on consumer hardware and serve cheaply. Already instruction-tuned so it understands conversation format out of the box. |
| **Apple MLX** | Developed on an M2 MacBook. MLX is Apple's native ML framework that uses unified memory (CPU+GPU share RAM). No need for an NVIDIA GPU during training — 16GB M2 can handle it. |
| **QLoRA (4-bit)** | Full fine-tuning Llama 8B needs ~60GB+ VRAM. QLoRA quantizes the base model to 4-bit and only trains tiny adapter matrices, dropping memory to fit in 16GB. Almost no quality loss. |
| **Ollama + GGUF** | Production serving. GGUF is the standard format for llama.cpp-based inference. Ollama wraps it with an OpenAI-compatible API, so the backend can call it like any chat API. |
| **RunPod** | Cheap on-demand GPU hosting. A5000 at $0.27/hr with persistent storage. No commitment. |

---

## Why QLoRA & Specific Settings

**QLoRA** = Quantized Low-Rank Adaptation. Instead of updating all 8 billion parameters:

1. Freeze the base model at 4-bit precision (saves ~75% memory)
2. Attach small trainable "adapter" matrices to attention layers
3. Only train those adapters (~0.1% of total params)

### Hyperparameter Choices

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| **rank: 16** | Rank of the low-rank decomposition. Higher = more expressive but more memory. 16 is the standard for domain adaptation — enough to learn wellness conversation patterns without overfitting on ~2K samples. |
| **alpha: 32** | Scaling factor. alpha/rank = 2.0 is the standard ratio. This controls how much the adapter updates influence the output. 2x scaling means the adapters have meaningful but not overwhelming impact. |
| **lora_layers: 16** | Only adapts 16 of 32 transformer layers (the later/upper ones). Earlier layers capture general language understanding that should not change. Later layers handle task-specific behavior — that's where wellness personality lives. |
| **dropout: 0.05** | Light regularization. With only ~2.2K samples, some dropout prevents memorizing specific phrases. 0.05 is conservative to avoid losing signal from the small dataset. |
| **batch_size: 1** | M2 16GB constraint. Cannot fit more than 1 sample at a time with a 4-bit 8B model + gradients in 16GB. |
| **max_seq_length: 1024** | Balances context (conversations can be long) vs memory. 1024 tokens is roughly 750 words, enough for a multi-turn exchange. Longer would OOM. |
| **learning_rate: 2e-5** | Standard for LoRA fine-tuning. Low enough not to catastrophically forget Llama's pre-training, high enough to learn in 1000 iterations. |
| **iters: 1000** | With ~2.2K samples and batch_size=1, this is roughly 0.45 epochs. For LoRA on a strong base model, many passes are not needed — the model already "knows" language, it just needs steering. |
| **grad_checkpoint: true** | Trades compute for memory. Recomputes activations during backward pass instead of storing them. Necessary to fit in 16GB. |

---

## Dataset Decisions & What Was Filtered Out

### Three Sources, Weighted

| Dataset | Source | Size | Content | Weight |
|---------|--------|------|---------|--------|
| **MentalChat16K** | ShenLab/MentalChat16K | 16.1K rows | 6K real clinical transcripts + 10K synthetic conversations covering 33 mental health topics | 50% |
| **CounselChat** | nbertagnolli/counsel-chat | 2.8K rows | Real licensed therapist responses with community upvotes and topic labels | 25% |
| **Amod Counseling** | Amod/mental_health_counseling_conversations | 3.5K rows | Real one-on-one counseling Q&A pairs | 25% |
| **Safety Exemplars** | Hand-written | 15 conversations | Boundary-setting, crisis referrals, refusal of harmful requests | Always included |

### What Was Removed and Why

1. **Self-harm instruction content** — Regex catches patterns like "kill yourself...how/steps/method", "suicide method", "how to die". The model must never learn to give these instructions.

2. **Diagnostic language** — Patterns like "you have depression", "you suffer from PTSD", "I diagnose you with...". The model is a wellness companion, NOT a therapist. Diagnosing is dangerous and potentially illegal for an AI.

3. **Prescriptive/medication advice** — "take this medication", "10mg daily", "you should stop taking...". The model must never play doctor.

4. **Too-short responses** (<20 chars) — Low quality, usually just "okay" or "thanks". No signal.

5. **Too-long responses** (>2000 chars) — Often rambling or copy-pasted clinical material. Also helps with the 1024 token limit.

6. **Too-short user messages** (<5 chars) — Not enough context to learn from.

7. **Duplicates** — SHA256 hash deduplication after merging. Prevents the model from memorizing repeated examples.

### What Was Added

**15 hand-written safety exemplars** — Always included regardless of weights. These teach critical boundary behaviors:
- Crisis referral (988 Suicide & Crisis Lifeline)
- Refusing to diagnose
- Refusing medication advice
- Refusing harmful requests
- Redirecting to campus counseling

These are the highest-value training samples in the entire dataset.

---

## Auto-Derived Wellness Tags

During filtering, conversations are automatically tagged based on content:

| Tag | Matches |
|-----|---------|
| stress | stress, overwhelm, burnout, pressure |
| anxiety | anxiety, worry, panic, nervous, fear |
| depression | depression, sad, hopeless, worthless, empty |
| sleep | sleep, insomnia, tired, fatigue, restless |
| relationships | relationship, partner, friend, family, lonely |
| academic | exam, study, grade, school, university, college |
| mindfulness | mindful, meditation, breathing, grounding, relax |
| coping | coping, self-care, routine, habit, exercise |

---

## Safety Mechanism — Three-Layer Defense

1. **Input Filtering**: Reject conversations with self-harm instructions, diagnostic requests during data preparation.
2. **Content Filtering**: Remove responses containing diagnostic language, prescriptive advice, or dangerous instructions.
3. **Training Data Safety**: 15 exemplars teach the model to set boundaries, refer to professionals, offer coping strategies instead of clinical advice, and handle refusals gracefully.

**System Prompt Enforcement:**
- Explicitly states: "You are NOT a therapist, counselor, or medical professional"
- Describes what NOT to do (diagnose, prescribe, replace professional support)
- Teaches when/how to refer (crisis lines, campus counseling, etc.)

---

## Key Tradeoffs

| Tradeoff | Decision | Cost |
|----------|----------|------|
| **Model size** | 8B (not 70B) | Less nuanced responses, but trainable on laptop and servable cheaply |
| **4-bit quantization** | QLoRA base model | Slight quality loss (~1-2% on benchmarks) but 4x memory savings |
| **Only 16/32 LoRA layers** | Skip early layers | Slightly less adaptation capacity, but early layers are general-purpose and should not change |
| **~2.2K training samples** | Aggressive filtering | Small dataset risks underfitting, but safety > volume. The base model already knows how to converse. |
| **1000 iterations (<1 epoch)** | Prevent overfitting | Model may not fully adapt to every edge case, but won't memorize and regurgitate training data |
| **Q4_K_M export** | Medium quantization | ~5% quality loss vs FP16, but model goes from ~16GB to ~4.5GB. Good inference speed. |
| **Wellness companion, not therapist** | Safety-first scope | Model cannot help with serious clinical cases, but also cannot cause harm by misdiagnosing |

---

## Base Model Specs

```
Model:                  meta-llama/Llama-3.1-8B-Instruct
Type:                   LlamaForCausalLM (causal language model)
Hidden size:            4096
Num layers:             32
Num attention heads:    32
KV heads:               8 (grouped query attention)
Intermediate size:      14336 (SwiGLU MLP)
Max position embeddings:131,072 (128K context)
Vocab size:             128,256
RoPE scaling:           8.0x (extended context support)
Quantization:           4-bit, group_size=64, mode=affine
```

---

## Deployment — RunPod

- **GPU:** NVIDIA RTX A5000 (24GB VRAM)
- **Container:** Ollama NVIDIA CUDA
- **Network volume:** 20GB persistent storage
- **Cost:** $0.27/hr on-demand + $1.40/mo storage
- **API Endpoint:** `https://<pod-id>-11434.proxy.runpod.net/v1/chat/completions`

---

## Core Philosophy

Start with a strong instruction-tuned model (Llama 3.1 8B Instruct) and **nudge it toward wellness conversations** rather than trying to teach it everything from scratch. QLoRA lets you do this nudge on consumer hardware with minimal data while keeping the model's core language abilities intact.
