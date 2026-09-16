# Medical Prescription Dataset Specification 🩺

This directory hosts clinical prescription images, OCR ground truth annotations, and split configurations for training vision-language models.

---

## 📂 Directory Structure

```
data/
├── raw/
│   ├── images/                 # Prescription image files (e.g. prescription_001.jpg)
│   └── annotations/
│       └── raw_annotations.jsonl # Complete ground truth metadata
│
└── processed/
    ├── train.jsonl             # 80% split in Qwen2.5-VL conversational format
    ├── validation.jsonl        # 10% validation split
    └── test.jsonl              # 10% test split for evaluation
```

---

## 🏷️ Annotation Schema

Each item in `raw_annotations.jsonl` contains:

```json
{
  "id": "prescription_001",
  "image": "path/to/prescription_001.jpg",
  "doctor_info": {
    "name": "Dr. Rajesh Sharma, MD",
    "qualification": "Consultant Physician & Cardiologist",
    "registration_no": "MCI-48291",
    "clinic_or_hospital": "Apollo Clinic & Diagnostics",
    "phone": "+91 98234 11200",
    "address": "Plot 42, Senapati Bapat Road, Pune"
  },
  "patient_info": {
    "name": "Rohan Deshpande",
    "age": "34 Yrs",
    "gender": "Male",
    "date": "2026-09-12",
    "vitals": {
      "bp": "124/82 mmHg",
      "pulse": "76 bpm",
      "weight": "68 kg",
      "temp": "98.4 F"
    }
  },
  "clinical_notes": {
    "diagnosis": "Acute Upper Respiratory Tract Infection",
    "symptoms": "Cough, sore throat, mild fever for 2 days"
  },
  "medications": [
    {
      "drug_name": "Tab. Augmentin",
      "strength": "625 mg",
      "form": "Tablet",
      "frequency": "1 - 0 - 1 (BD)",
      "duration": "5 Days",
      "instructions": "After meals"
    }
  ],
  "tests_advised": ["Complete Blood Count (CBC) & ESR"],
  "follow_up_date": "Review in 5 days",
  "doctor_signature_present": true
}
```

---

## ⚙️ Generating More Samples

To augment or generate fresh samples:
```bash
python3 training/prepare_dataset.py --samples 100 --data-dir ./data
```
