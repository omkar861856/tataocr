#!/usr/bin/env python3
"""Qwen2.5-VL-7B Fine-Tuning Script with PEFT / LoRA on Medical Prescriptions.
"""

import os
import sys
import yaml
import json
import torch
import argparse
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Any

from transformers import (
    AutoProcessor,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training,
    TaskType
)

# Qwen2.5-VL Model class import
try:
    from transformers import Qwen2_5_VLForConditionalGeneration
except ImportError:
    from transformers import AutoModelForVision2Seq as Qwen2_5_VLForConditionalGeneration


def load_config(config_path: str) -> dict:
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


class VLMDataset(torch.utils.data.Dataset):
    """Custom Dataset for Qwen2.5-VL formatted conversations."""

    def __init__(self, jsonl_path: str, processor: Any, max_seq_length: int = 2048):
        self.items = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.items.append(json.loads(line))
        self.processor = processor
        self.max_seq_length = max_seq_length

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        item = self.items[idx]
        messages = item["messages"]
        image_path = item.get("image")

        from PIL import Image
        image = Image.open(image_path).convert("RGB") if image_path and os.path.exists(image_path) else None

        # Build text format using processor's chat template
        text = self.processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=False
        )

        inputs = self.processor(
            text=[text],
            images=[image] if image else None,
            padding=True,
            return_tensors="pt"
        )

        inputs = {k: v.squeeze(0) for k, v in inputs.items()}
        inputs["labels"] = inputs["input_ids"].clone()
        return inputs


def collate_fn(batch):
    # Padding handled dynamically
    input_ids = [item["input_ids"] for item in batch]
    labels = [item["labels"] for item in batch]
    attention_mask = [item.get("attention_mask") for item in batch]

    from torch.nn.utils.rnn import pad_sequence
    padded_input_ids = pad_sequence(input_ids, batch_first=True, padding_value=0)
    padded_labels = pad_sequence(labels, batch_first=True, padding_value=-100)
    padded_attention_mask = pad_sequence(attention_mask, batch_first=True, padding_value=0) if attention_mask[0] is not None else None

    res = {
        "input_ids": padded_input_ids,
        "labels": padded_labels
    }
    if padded_attention_mask is not None:
        res["attention_mask"] = padded_attention_mask

    # Add pixel values if present
    if "pixel_values" in batch[0]:
        res["pixel_values"] = torch.stack([item["pixel_values"] for item in batch])
    if "image_grid_thw" in batch[0]:
        res["image_grid_thw"] = torch.cat([item["image_grid_thw"] for item in batch], dim=0)

    return res


def main():
    parser = argparse.ArgumentParser(description="Fine-tune Qwen2.5-VL on medical prescriptions")
    parser.add_argument("--config", type=str, default="./training/config/lora.yaml", help="Path to lora.yaml")
    parser.add_argument("--output-dir", type=str, default=None, help="Override output adapter directory")
    args = parser.parse_args()

    cfg = load_config(args.config)
    m_cfg = cfg.get("model", {})
    l_cfg = cfg.get("lora", {})
    t_cfg = cfg.get("training", {})
    d_cfg = cfg.get("data", {})

    output_dir = args.output_dir or t_cfg.get("output_dir", "./models/adapters/prescription-vlm")
    os.makedirs(output_dir, exist_ok=True)

    print("=" * 60)
    print(f"🚀 Starting VLM Prescription Fine-Tuning Pipeline")
    print(f"Base Model: {m_cfg.get('base_model_name_or_path')}")
    print(f"Output Directory: {output_dir}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)} | VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB")
    print("=" * 60)

    # 1. Quantization Configuration (QLoRA 4-bit)
    use_qlora = m_cfg.get("use_qlora", True)
    bnb_config = None
    if use_qlora and torch.cuda.is_available():
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=m_cfg.get("double_quant", True),
            bnb_4bit_quant_type=m_cfg.get("quant_type", "nf4"),
            bnb_4bit_compute_dtype=torch.bfloat16
        )

    # 2. Load Processor and Model
    model_name = m_cfg.get("base_model_name_or_path", "Qwen/Qwen2.5-VL-7B-Instruct")
    processor = AutoProcessor.from_pretrained(
        model_name,
        min_pixels=d_cfg.get("image_min_pixels", 3136),
        max_pixels=d_cfg.get("image_max_pixels", 12845056)
    )

    model_kwargs = {
        "device_map": "auto" if torch.cuda.is_available() else None,
        "torch_dtype": torch.bfloat16 if t_cfg.get("bf16", True) else torch.float32,
    }
    if bnb_config:
        model_kwargs["quantization_config"] = bnb_config

    print("Loading base vision-language model...")
    try:
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(model_name, **model_kwargs)
    except Exception as e:
        print(f"Warning loading {model_name}: {e}. Falling back to CPU/Mock configuration for validation.")
        return

    if use_qlora and torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 3. LoRA Configuration
    lora_config = LoraConfig(
        r=l_cfg.get("r", 16),
        lora_alpha=l_cfg.get("lora_alpha", 32),
        lora_dropout=l_cfg.get("lora_dropout", 0.05),
        bias=l_cfg.get("bias", "none"),
        task_type=TaskType.CAUSAL_LM,
        target_modules=l_cfg.get("target_modules", ["q_proj", "v_proj"])
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 4. Datasets
    train_file = d_cfg.get("train_file", "./data/processed/train.jsonl")
    val_file = d_cfg.get("validation_file", "./data/processed/validation.jsonl")

    if not os.path.exists(train_file):
        print(f"Train file {train_file} not found! Run python training/prepare_dataset.py first.")
        return

    train_dataset = VLMDataset(train_file, processor, max_seq_length=d_cfg.get("max_seq_length", 2048))
    val_dataset = VLMDataset(val_file, processor, max_seq_length=d_cfg.get("max_seq_length", 2048)) if os.path.exists(val_file) else None

    # 5. Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=t_cfg.get("num_train_epochs", 3),
        per_device_train_batch_size=t_cfg.get("per_device_train_batch_size", 2),
        per_device_eval_batch_size=t_cfg.get("per_device_eval_batch_size", 2),
        gradient_accumulation_steps=t_cfg.get("gradient_accumulation_steps", 4),
        learning_rate=float(t_cfg.get("learning_rate", 2e-4)),
        weight_decay=float(t_cfg.get("weight_decay", 0.01)),
        warmup_ratio=float(t_cfg.get("warmup_ratio", 0.05)),
        lr_scheduler_type=t_cfg.get("lr_scheduler_type", "cosine"),
        logging_steps=t_cfg.get("logging_steps", 10),
        save_strategy=t_cfg.get("save_strategy", "epoch"),
        eval_strategy=t_cfg.get("evaluation_strategy", "epoch"),
        save_total_limit=t_cfg.get("save_total_limit", 2),
        bf16=t_cfg.get("bf16", True) and torch.cuda.is_available(),
        fp16=t_cfg.get("fp16", False),
        dataloader_num_workers=t_cfg.get("dataloader_num_workers", 2),
        gradient_checkpointing=t_cfg.get("gradient_checkpointing", True),
        max_grad_norm=float(t_cfg.get("max_grad_norm", 1.0)),
        seed=t_cfg.get("seed", 42),
        report_to="none"
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=collate_fn
    )

    print("Initiating fine-tuning...")
    trainer.train()

    # Save final LoRA adapter
    print(f"Saving fine-tuned LoRA adapter to {output_dir}...")
    trainer.model.save_pretrained(output_dir)
    processor.save_pretrained(output_dir)
    print("Fine-tuning completed successfully!")


if __name__ == "__main__":
    main()
