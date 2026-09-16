#!/usr/bin/env bash
# Download base Qwen2.5-VL-7B-Instruct weights from Hugging Face
set -e

MODEL_NAME="Qwen/Qwen2.5-VL-7B-Instruct"
TARGET_DIR="./models/base/qwen2.5-vl-7b"

echo "=========================================================="
echo "📥 Downloading Base Model: ${MODEL_NAME}"
echo "🎯 Destination: ${TARGET_DIR}"
echo "=========================================================="

mkdir -p "${TARGET_DIR}"

if command -v huggingface-cli &> /dev/null; then
    huggingface-cli download "${MODEL_NAME}" --local-dir "${TARGET_DIR}" --local-dir-use-symlinks False
else
    echo "huggingface-cli not found. Installing huggingface-hub..."
    pip install -q huggingface-hub
    python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='${MODEL_NAME}', local_dir='${TARGET_DIR}')
print('Download finished.')
"
fi

echo "✅ Base model downloaded successfully to ${TARGET_DIR}."
