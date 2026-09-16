#!/usr/bin/env python3
"""Evaluate fine-tuned VLM on test/validation set and save predictions.
"""

import os
import sys
import json
import torch
import argparse
from tqdm import tqdm
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from PIL import Image
from transformers import AutoProcessor
from peft import PeftModel

try:
    from transformers import Qwen2_5_VLForConditionalGeneration
except ImportError:
    from transformers import AutoModelForVision2Seq as Qwen2_5_VLForConditionalGeneration

from inference.prompts import SYSTEM_PROMPT, PRESCRIPTION_EXTRACTION_PROMPT


def run_evaluation(model_path: str, adapter_path: str, test_file: str, output_file: str):
    print("=" * 60)
    print("📊 Evaluating VLM Prescription Model")
    print(f"Base Model: {model_path}")
    print(f"Adapter: {adapter_path or 'None (Base model evaluation)'}")
    print(f"Test Data: {test_file}")
    print("=" * 60)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    processor = AutoProcessor.from_pretrained(adapter_path or model_path)
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        model_path,
        torch_dtype=torch_dtype,
        device_map="auto" if torch.cuda.is_available() else None
    )

    if adapter_path and os.path.exists(adapter_path):
        model = PeftModel.from_pretrained(model, adapter_path)

    model.eval()

    test_items = []
    with open(test_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                test_items.append(json.loads(line))

    predictions = []
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    print(f"Running inference on {len(test_items)} test samples...")
    for item in tqdm(test_items):
        img_path = item.get("image")
        if not img_path or not os.path.exists(img_path):
            continue

        image = Image.open(img_path).convert("RGB")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": img_path},
                    {"type": "text", "text": PRESCRIPTION_EXTRACTION_PROMPT}
                ]
            }
        ]

        text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = processor(text=[text], images=[image], return_tensors="pt").to(device)

        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=1024,
                temperature=0.1,
                top_p=0.9
            )

        # Trim prompt tokens
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]

        # Extract ground truth target from messages
        ground_truth = ""
        for m in item["messages"]:
            if m["role"] == "assistant":
                ground_truth = m["content"]
                break

        predictions.append({
            "id": item.get("id"),
            "image": img_path,
            "prediction": output_text,
            "ground_truth": ground_truth
        })

    with open(output_file, "w", encoding="utf-8") as f:
        for p in predictions:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    print(f"✅ Saved {len(predictions)} evaluation predictions to {output_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate VLM on test data")
    parser.add_argument("--model-path", type=str, default="Qwen/Qwen2.5-VL-7B-Instruct")
    parser.add_argument("--adapter-path", type=str, default="./models/adapters/prescription-vlm")
    parser.add_argument("--test-file", type=str, default="./data/processed/test.jsonl")
    parser.add_argument("--output-file", type=str, default="./evaluation/predictions.jsonl")
    args = parser.parse_args()

    run_evaluation(args.model_path, args.adapter_path, args.test_file, args.output_file)
