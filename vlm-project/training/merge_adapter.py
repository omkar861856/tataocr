#!/usr/bin/env python3
"""Merge fine-tuned LoRA adapter weights with the base vision-language model.
Produces a unified, standalone model ready for high-throughput serving (vLLM, Ollama, Hugging Face).
"""

import os
import sys
import torch
import argparse
from transformers import AutoProcessor
from peft import PeftModel

try:
    from transformers import Qwen2_5_VLForConditionalGeneration
except ImportError:
    from transformers import AutoModelForVision2Seq as Qwen2_5_VLForConditionalGeneration


def merge_and_save(base_model_path: str, adapter_path: str, output_path: str):
    print(f"Loading base model from: {base_model_path}")
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        base_model_path,
        torch_dtype=torch_dtype,
        device_map=device_map,
        low_cpu_mem_usage=True
    )
    processor = AutoProcessor.from_pretrained(base_model_path)

    print(f"Attaching LoRA adapter from: {adapter_path}")
    model = PeftModel.from_pretrained(base_model, adapter_path)

    print("Merging adapter weights into base model layers...")
    merged_model = model.merge_and_unload()

    print(f"Saving merged standalone model to: {output_path}")
    os.makedirs(output_path, exist_ok=True)
    merged_model.save_pretrained(output_path, safe_serialization=True)
    processor.save_pretrained(output_path)
    print("✅ Model merge complete and saved successfully!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Merge LoRA adapter into base VLM")
    parser.add_argument("--base-model", type=str, default="Qwen/Qwen2.5-VL-7B-Instruct")
    parser.add_argument("--adapter-path", type=str, default="./models/adapters/prescription-vlm")
    parser.add_argument("--output-path", type=str, default="./models/merged/prescription-vlm")
    args = parser.parse_args()

    merge_and_save(args.base_model, args.adapter_path, args.output_path)
