#!/usr/bin/env python3
"""CLI Inference tool for fine-tuned Prescription Vision-Language Model.
"""

import os
import sys
import json
import torch
import argparse
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


class PrescriptionVLM:
    def __init__(self, model_path: str = "Qwen/Qwen2.5-VL-7B-Instruct", adapter_path: str = None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

        print(f"Loading processor and model from {model_path} on {self.device}...")
        self.processor = AutoProcessor.from_pretrained(adapter_path or model_path)
        self.model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            model_path,
            torch_dtype=self.torch_dtype,
            device_map="auto" if torch.cuda.is_available() else None
        )

        if adapter_path and os.path.exists(adapter_path):
            print(f"Applying LoRA adapter weights from {adapter_path}...")
            self.model = PeftModel.from_pretrained(self.model, adapter_path)

        self.model.eval()

    def predict(self, image_path: str, prompt: str = PRESCRIPTION_EXTRACTION_PROMPT) -> str:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        image = Image.open(image_path).convert("RGB")
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_path},
                    {"type": "text", "text": prompt}
                ]
            }
        ]

        text = self.processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.processor(text=[text], images=[image], return_tensors="pt").to(self.device)

        with torch.no_grad():
            generated_ids = self.model.generate(
                **inputs,
                max_new_tokens=1024,
                temperature=0.1,
                top_p=0.9
            )

        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = self.processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]

        return output_text


def main():
    parser = argparse.ArgumentParser(description="Extract clinical entities from prescription image")
    parser.add_argument("--image", type=str, required=True, help="Path to prescription image")
    parser.add_argument("--model-path", type=str, default="Qwen/Qwen2.5-VL-7B-Instruct")
    parser.add_argument("--adapter-path", type=str, default="./models/adapters/prescription-vlm")
    parser.add_argument("--output-json", type=str, default=None, help="Optional output JSON file")
    args = parser.parse_args()

    vlm = PrescriptionVLM(model_path=args.model_path, adapter_path=args.adapter_path)
    result = vlm.predict(args.image)

    print("\n--- Model Output ---")
    print(result)

    if args.output_json:
        # Extract json content
        from evaluation.metrics import extract_json_from_markdown
        parsed = extract_json_from_markdown(result)
        with open(args.output_json, "w", encoding="utf-8") as f:
            json.dump(parsed or {"raw_output": result}, f, indent=2)
        print(f"\nSaved structured output to: {args.output_json}")


if __name__ == "__main__":
    main()
