#!/usr/bin/env bash
# Generate prescription dataset, annotations, and train/val/test splits
set -e

SAMPLES=${1:-50}

echo "=========================================================="
echo "🩺 Generating Prescription Dataset (${SAMPLES} Samples)"
echo "=========================================================="

python3 training/prepare_dataset.py --samples "${SAMPLES}" --data-dir "./data"

echo "=========================================================="
echo "✅ Data Preparation Complete!"
echo "Train:       ./data/processed/train.jsonl"
echo "Validation:  ./data/processed/validation.jsonl"
echo "Test:        ./data/processed/test.jsonl"
echo "=========================================================="
