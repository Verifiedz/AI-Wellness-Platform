#!/bin/bash
# Convert the fused MLX model to GGUF format for Ollama.
# Usage: ./scripts/export_gguf.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$BASE_DIR/models"
MERGED_DIR="$MODELS_DIR/wellness-llama-merged"
LLAMA_CPP_DIR="$MODELS_DIR/llama.cpp"
OUTPUT_GGUF="$MODELS_DIR/wellness-llama-8b.gguf"
OUTPUT_QUANTIZED="$MODELS_DIR/wellness-llama-8b-Q4_K_M.gguf"

# Check merged model exists
if [ ! -d "$MERGED_DIR" ]; then
    echo "ERROR: Merged model not found at $MERGED_DIR"
    echo "Run 'make fuse' first."
    exit 1
fi

# Clone llama.cpp if not present
if [ ! -d "$LLAMA_CPP_DIR" ]; then
    echo "Cloning llama.cpp..."
    git clone --depth 1 https://github.com/ggerganov/llama.cpp "$LLAMA_CPP_DIR"
fi

# Install llama.cpp Python dependencies
echo "Installing conversion dependencies..."
PIP="$BASE_DIR/.venv/bin/pip"
PYTHON="$BASE_DIR/.venv/bin/python"

$PIP install -r "$LLAMA_CPP_DIR/requirements.txt" 2>/dev/null || \
    $PIP install numpy sentencepiece transformers gguf

# Convert to GGUF
echo "Converting to GGUF..."
$PYTHON "$LLAMA_CPP_DIR/convert_hf_to_gguf.py" "$MERGED_DIR" \
    --outfile "$OUTPUT_GGUF"

# Build quantize tool if needed
if [ ! -f "$LLAMA_CPP_DIR/build/bin/llama-quantize" ]; then
    echo "Building llama.cpp quantize tool..."
    cd "$LLAMA_CPP_DIR"
    cmake -B build
    cmake --build build --target llama-quantize -j$(sysctl -n hw.ncpu)
    cd "$BASE_DIR"
fi

# Quantize to Q4_K_M
echo "Quantizing to Q4_K_M..."
"$LLAMA_CPP_DIR/build/bin/llama-quantize" "$OUTPUT_GGUF" "$OUTPUT_QUANTIZED" Q4_K_M

# Clean up full-size GGUF
rm -f "$OUTPUT_GGUF"

echo ""
echo "Done! Quantized model: $OUTPUT_QUANTIZED"
echo "Next: make ollama-create"
