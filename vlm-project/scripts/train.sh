#!/usr/bin/env bash
# Launch Fine-Tuning of Qwen2.5-VL-7B using LoRA / QLoRA
set -e

CONFIG_PATH=${1:-"./training/config/lora.yaml"}

echo "=========================================================="
echo "⚡ Launching VLM Prescription Fine-Tuning Pipeline"
echo "Config: ${CONFIG_PATH}"
echo "=========================================================="

export CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-0}
export PYTORCH_CUDA_ALLOC_CONF="expandable_segments:True"
export TOKENIZERS_PARALLELISM=false

if [ -f "./venv/bin/activate" ]; then
    source ./venv/bin/activate
fi

if command -v nvidia-smi &> /dev/null; then
    echo "Active GPU:"
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader
fi

# Run training
python3 training/train.py --config "${CONFIG_PATH}"

echo "=========================================================="
echo "🎉 Fine-Tuning finished! Saved to models/adapters/prescription-vlm"
echo "To merge weights, run: python3 training/merge_adapter.py"
echo "=========================================================="
