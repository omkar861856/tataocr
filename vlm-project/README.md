# Prescription VLM: Vision-Language Model Fine-Tuning 🩺✨

> **End-to-End Fine-Tuning & Serving Pipeline for Medical Prescription OCR & Entity Extraction**  
> Built for **Qwen2.5-VL-7B-Instruct** with **PEFT / LoRA / QLoRA** on the **NVIDIA GeForce RTX 5090 (32GB VRAM)**.

---

## 📁 Repository Structure

```
vlm-project/
│
├── data/
│   ├── raw/
│   │   ├── images/                 # Prescription images (.jpg)
│   │   └── annotations/
│   │       └── raw_annotations.jsonl
│   │
│   ├── processed/
│   │   ├── train.jsonl             # Multi-modal conversation training split
│   │   ├── validation.jsonl        # Validation split
│   │   └── test.jsonl              # Held-out test set
│   │
│   └── README.md
│
├── models/
│   ├── base/
│   │   └── qwen2.5-vl-7b/          # Base Qwen2.5-VL weights
│   │
│   ├── adapters/
│   │   └── prescription-vlm/       # Saved LoRA checkpoints
│   │
│   └── merged/
│       └── prescription-vlm/       # Fused standalone model weights
│
├── training/
│   ├── config/
│   │   └── lora.yaml               # Hyperparameters (Rank, Alpha, Learning Rate)
│   │
│   ├── prepare_dataset.py          # Synthetic prescription generator & processor
│   ├── train.py                    # LoRA fine-tuning training loop
│   ├── evaluate.py                 # Evaluation against test dataset
│   └── merge_adapter.py            # Model weight fusion utility
│
├── inference/
│   ├── predict.py                  # CLI single/batch inference tool
│   ├── prompts.py                  # Clinical system prompts & JSON schemas
│   └── api.py                      # FastAPI serving microservice
│
├── evaluation/
│   ├── predictions.jsonl           # Model predictions vs ground truth
│   ├── metrics.py                  # CER, WER, normalized Levenshtein & Field F1
│   └── samples/                    # Diagnostic visual artifacts
│
├── scripts/
│   ├── download_model.sh           # Hugging Face snapshot downloader
│   ├── prepare_data.sh             # Dataset preparation runner
│   └── train.sh                    # Fine-tuning launch script
│
├── requirements.txt                # Pinned dependencies
├── .env                            # Environment configurations
├── .gitignore                      # Git exclusion rules
└── README.md                       # Project documentation
```

---

## ⚡ Quick Start Workflow

### 1. Environment Setup
```bash
cd vlm-project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Generate Dataset
Generate realistic prescription samples and create `train.jsonl`, `validation.jsonl`, and `test.jsonl`:
```bash
./scripts/prepare_data.sh 30
```

### 3. Download Base Model (Optional if using Hugging Face cache)
```bash
./scripts/download_model.sh
```

### 4. Fine-Tune with LoRA
Run the fine-tuning pipeline on the RTX 5090:
```bash
./scripts/train.sh
```

### 5. Evaluate Accuracy
Calculate Character Error Rate (CER), Word Error Rate (WER), and Field-Level F1-scores:
```bash
python3 training/evaluate.py --model-path Qwen/Qwen2.5-VL-7B-Instruct --adapter-path models/adapters/prescription-vlm
python3 evaluation/metrics.py --predictions evaluation/predictions.jsonl
```

### 6. Merge Adapter Weights
Fuse the LoRA adapter with the base model for standalone production deployment:
```bash
python3 training/merge_adapter.py --base-model Qwen/Qwen2.5-VL-7B-Instruct --adapter-path models/adapters/prescription-vlm --output-path models/merged/prescription-vlm
```

### 7. Run CLI Inference
```bash
python3 inference/predict.py --image data/raw/images/prescription_001.jpg --output-json result.json
```

### 8. Start FastAPI Microservice
```bash
uvicorn inference.api:app --host 0.0.0.0 --port 8080
```
- API Docs: `http://localhost:8080/docs`
- Prescription Extraction Endpoint: `POST /v1/prescription/extract`

---

## 🎯 Clinical Entity Coverage
The model extracts:
- **Doctor Information**: Name, Qualification, License / Registration Number, Clinic, Address, Phone.
- **Patient Demographics**: Name, Age, Gender, Date of Visit, Vital Signs (BP, Pulse, Weight, Temperature).
- **Clinical Impression**: Diagnosis and Chief Complaints.
- **Medication Schedule**: Drug Name, Strength, Dosage Form, Frequency (e.g. `1-0-1 BD`), Duration, and Administration Instructions.
- **Diagnostics**: Recommended laboratory / radiology investigations.
- **Validation**: Signature and clinic seal detection.
