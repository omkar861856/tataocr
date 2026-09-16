#!/usr/bin/env python3
"""Dataset Preparation & Synthetic Prescription Generator for Qwen2.5-VL Fine-Tuning.

Generates realistic medical prescription samples, creates ground truth annotations,
and formats train/validation/test splits in Qwen2.5-VL multi-turn vision format.
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from PIL import Image, ImageDraw, ImageFont

# Sample Medical Entity Banks for realistic generation
DOCTORS = [
    {"name": "Dr. Rajesh Sharma, MD", "qual": "Consultant Physician & Cardiologist", "reg": "MCI-48291", "clinic": "Apollo Clinic & Diagnostics", "phone": "+91 98234 11200", "addr": "Plot 42, Senapati Bapat Road, Pune"},
    {"name": "Dr. Ananya Sengupta, MBBS, DNB", "qual": "General Practitioner & Pediatrician", "reg": "KMC-77124", "clinic": "CareWell Family Health Center", "phone": "+91 80 4122 8899", "addr": "12th Cross, Indiranagar, Bengaluru"},
    {"name": "Dr. Vikramaditya Mehta, MS, MCh", "qual": "Orthopedic Surgeon", "reg": "MMC-33419", "clinic": "Fortis Bone & Joint Institute", "phone": "+91 22 2654 3321", "addr": "Mulund Goregaon Link Rd, Mumbai"},
    {"name": "Dr. Priya Deshmukh, MD (Med)", "qual": "Internal Medicine Specialist", "reg": "GMC-90812", "clinic": "Max Healthcare Polyclinic", "phone": "+91 11 4055 7700", "addr": "Sector 19, Saket, New Delhi"},
    {"name": "Dr. Mohammed Tariq, MD", "qual": "Consultant Pulmonologist & Allergist", "reg": "TSMC-55102", "clinic": "BreatheEasy Chest Clinic", "phone": "+91 40 2331 4455", "addr": "Road No. 2, Banjara Hills, Hyderabad"}
]

PATIENTS = [
    {"name": "Rohan Deshpande", "age": "34 Yrs", "gender": "Male", "vitals": {"bp": "124/82 mmHg", "pulse": "76 bpm", "weight": "68 kg", "temp": "98.4 F"}},
    {"name": "Sunita Kulkarni", "age": "58 Yrs", "gender": "Female", "vitals": {"bp": "138/88 mmHg", "pulse": "82 bpm", "weight": "74 kg", "temp": "99.1 F"}},
    {"name": "Arjun Patel", "age": "9 Yrs", "gender": "Male", "vitals": {"bp": "105/68 mmHg", "pulse": "92 bpm", "weight": "28 kg", "temp": "101.2 F"}},
    {"name": "Meera Iyer", "age": "42 Yrs", "gender": "Female", "vitals": {"bp": "118/76 mmHg", "pulse": "72 bpm", "weight": "61 kg", "temp": "98.6 F"}},
    {"name": "Kavita Nair", "age": "27 Yrs", "gender": "Female", "vitals": {"bp": "112/70 mmHg", "pulse": "78 bpm", "weight": "54 kg", "temp": "98.2 F"}},
    {"name": "Amitabh Verma", "age": "65 Yrs", "gender": "Male", "vitals": {"bp": "144/92 mmHg", "pulse": "84 bpm", "weight": "82 kg", "temp": "98.8 F"}}
]

DRUGS = [
    {"drug_name": "Tab. Augmentin", "strength": "625 mg", "form": "Tablet", "frequency": "1 - 0 - 1 (BD)", "duration": "5 Days", "instructions": "After meals"},
    {"drug_name": "Tab. Paracetamol (Dolo)", "strength": "650 mg", "form": "Tablet", "frequency": "1 - 1 - 1 (TDS)", "duration": "3 Days", "instructions": "SOS for fever/pain"},
    {"drug_name": "Cap. Pantocid-DSR", "strength": "40/30 mg", "form": "Capsule", "frequency": "1 - 0 - 0 (OD)", "duration": "7 Days", "instructions": "Empty stomach in morning"},
    {"drug_name": "Tab. Montair-LC", "strength": "10/5 mg", "form": "Tablet", "frequency": "0 - 0 - 1 (HS)", "duration": "10 Days", "instructions": "At bedtime"},
    {"drug_name": "Syr. Ascoril-LS", "strength": "100 ml", "form": "Syrup", "frequency": "2 tsp TDS", "duration": "5 Days", "instructions": "After warm water"},
    {"drug_name": "Tab. Telma", "strength": "40 mg", "form": "Tablet", "frequency": "1 - 0 - 0 (OD)", "duration": "30 Days", "instructions": "Morning with breakfast"},
    {"drug_name": "Tab. Glycomet-GP", "strength": "1/500 mg", "form": "Tablet", "frequency": "1 - 0 - 1 (BD)", "duration": "30 Days", "instructions": "Before major meals"},
    {"drug_name": "Tab. Neurobion Forte", "strength": "500 mcg", "form": "Tablet", "frequency": "0 - 1 - 0 (OD)", "duration": "15 Days", "instructions": "After lunch"}
]

DIAGNOSES = [
    {"diagnosis": "Acute Upper Respiratory Tract Infection (URTI) with Low-grade Pyrexia", "symptoms": "Cough, sore throat, mild fever for 2 days"},
    {"diagnosis": "Essential Primary Hypertension - Stage 1", "symptoms": "Occasional occipital headache, fatigue"},
    {"diagnosis": "Acute Gastroenteritis with Mild Dehydration", "symptoms": "Abdominal cramps, loose motions x 4 episodes"},
    {"diagnosis": "Allergic Bronchitis with Bronchospasm", "symptoms": "Nocturnal dry cough, wheezing, sneezing"},
    {"diagnosis": "Type-2 Diabetes Mellitus with Peripheral Neuropathy", "symptoms": "Tingling in feet, polyuria, fatigue"}
]

TESTS = [
    "Complete Blood Count (CBC) & ESR",
    "Fasting Blood Sugar (FBS) & HbA1c",
    "Lipid Profile & Serum Creatinine",
    "Chest X-Ray PA View",
    "Urine Routine & Microscopy",
    "Serum Electrolytes (Na, K, Cl)"
]


def render_prescription_image(doc_data, out_path):
    """Draw a clean, realistic prescription document image with layout elements."""
    width, height = 900, 1200
    im = Image.new("RGB", (width, height), color=(252, 252, 253))
    draw = ImageDraw.Draw(im)

    # Decorative header bar
    draw.rectangle([0, 0, width, 14], fill=(24, 76, 120))
    draw.rectangle([0, 14, width, 18], fill=(68, 142, 196))

    # Doctor / Clinic Letterhead
    doc = doc_data["doctor_info"]
    draw.text((40, 35), doc["clinic"], fill=(20, 45, 75))
    draw.text((40, 60), doc["name"], fill=(15, 23, 42))
    draw.text((40, 85), f"{doc['qual']}  |  Reg No: {doc['reg']}", fill=(71, 85, 105))
    draw.text((40, 105), f"Address: {doc['addr']}  •  Tel: {doc['phone']}", fill=(100, 116, 139))

    # Divider line
    draw.line([(40, 135), (width - 40, 135)], fill=(203, 213, 225), width=2)

    # Patient Details Strip
    pat = doc_data["patient_info"]
    draw.rectangle([40, 150, width - 40, 205], fill=(241, 245, 249), outline=(226, 232, 240), width=1)
    draw.text((55, 160), f"Patient Name: {pat['name']}", fill=(15, 23, 42))
    draw.text((380, 160), f"Age / Sex: {pat['age']} / {pat['gender']}", fill=(15, 23, 42))
    draw.text((650, 160), f"Date: {pat['date']}", fill=(15, 23, 42))

    vitals_str = f"Vitals: BP: {pat['vitals']['bp']}  |  Pulse: {pat['vitals']['pulse']}  |  Wt: {pat['vitals']['weight']}  |  Temp: {pat['vitals']['temp']}"
    draw.text((55, 182), vitals_str, fill=(71, 85, 105))

    # Diagnosis Block
    cnotes = doc_data["clinical_notes"]
    draw.text((40, 225), f"Diagnosis / Impression: {cnotes['diagnosis']}", fill=(24, 76, 120))
    draw.text((40, 248), f"Chief Complaints: {cnotes['symptoms']}", fill=(100, 116, 139))

    # Rx Symbol
    draw.text((40, 290), "Rx", fill=(185, 28, 28))

    # Medications Table Header
    y_table = 340
    draw.rectangle([40, y_table, width - 40, y_table + 32], fill=(226, 232, 240))
    draw.text((55, y_table + 8), "#", fill=(15, 23, 42))
    draw.text((95, y_table + 8), "Medicine Name & Strength", fill=(15, 23, 42))
    draw.text((420, y_table + 8), "Dosage / Frequency", fill=(15, 23, 42))
    draw.text((630, y_table + 8), "Duration", fill=(15, 23, 42))
    draw.text((750, y_table + 8), "Instructions", fill=(15, 23, 42))

    # Medication Rows
    y = y_table + 38
    for idx, med in enumerate(doc_data["medications"], start=1):
        draw.text((55, y), f"{idx:02d}", fill=(51, 65, 85))
        draw.text((95, y), f"{med['drug_name']} ({med['strength']})", fill=(15, 23, 42))
        draw.text((420, y), med['frequency'], fill=(30, 41, 59))
        draw.text((630, y), med['duration'], fill=(30, 41, 59))
        draw.text((750, y), med['instructions'], fill=(71, 85, 105))
        draw.line([(40, y + 26), (width - 40, y + 26)], fill=(241, 245, 249), width=1)
        y += 34

    # Lab Tests Advised
    y += 20
    draw.text((40, y), "Investigations Advised:", fill=(24, 76, 120))
    y += 24
    for test in doc_data["tests_advised"]:
        draw.text((60, y), f"• {test}", fill=(51, 65, 85))
        y += 22

    # Follow up & Advice
    y += 15
    draw.text((40, y), f"Follow Up: {doc_data['follow_up_date'] or 'As needed / review after course'}", fill=(15, 23, 42))
    draw.text((40, y + 22), "General Advice: Drink plenty of fluids, complete antibiotic course, avoid cold foods.", fill=(100, 116, 139))

    # Signature / Stamp at bottom right
    draw.line([(width - 260, height - 120), (width - 60, height - 120)], fill=(71, 85, 105), width=1)
    draw.text((width - 240, height - 110), f"{doc['name']}", fill=(15, 23, 42))
    draw.text((width - 220, height - 90), f"Verified Signature & Stamp", fill=(100, 116, 139))

    # Footer note
    draw.rectangle([0, height - 28, width, height], fill=(241, 245, 249))
    draw.text((width // 2 - 160, height - 20), "Please bring this prescription for your next consultation", fill=(148, 163, 184))

    im.save(out_path, quality=92)


def generate_synthetic_dataset(num_samples=25, out_dir=Path("./data")):
    raw_images_dir = out_dir / "raw" / "images"
    raw_annos_dir = out_dir / "raw" / "annotations"
    processed_dir = out_dir / "processed"

    raw_images_dir.mkdir(parents=True, exist_ok=True)
    raw_annos_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    records = []
    print(f"Generating {num_samples} prescription samples...")

    for i in range(1, num_samples + 1):
        sample_id = f"prescription_{i:03d}"
        img_filename = f"{sample_id}.jpg"
        img_path = raw_images_dir / img_filename

        doc = random.choice(DOCTORS)
        pat = random.choice(PATIENTS).copy()
        pat["date"] = f"2026-09-{random.randint(1, 28):02d}"
        diag = random.choice(DIAGNOSES)

        selected_meds = random.sample(DRUGS, k=random.randint(2, 4))
        tests_selected = random.sample(TESTS, k=random.randint(1, 3))
        follow_up = f"Review in {random.choice(['3 days', '5 days', '1 week', '2 weeks'])}"

        prescription_data = {
            "id": sample_id,
            "image": str(img_path.resolve()),
            "doctor_info": doc,
            "patient_info": pat,
            "clinical_notes": diag,
            "medications": selected_meds,
            "tests_advised": tests_selected,
            "follow_up_date": follow_up,
            "doctor_signature_present": True
        }

        render_prescription_image(prescription_data, img_path)
        records.append(prescription_data)

    # Save raw annotations
    raw_anno_file = raw_annos_dir / "raw_annotations.jsonl"
    with open(raw_anno_file, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"Saved raw annotations to: {raw_anno_file}")

    # Create Train / Val / Test Splits (80% / 10% / 10%)
    random.seed(42)
    random.shuffle(records)
    n = len(records)
    n_train = max(1, int(n * 0.8))
    n_val = max(1, int(n * 0.1))

    splits = {
        "train": records[:n_train],
        "validation": records[n_train:n_train + n_val],
        "test": records[n_train + n_val:]
    }

    # Convert to Qwen2.5-VL Chat/SFT Multi-Turn format
    from inference.prompts import SYSTEM_PROMPT, PRESCRIPTION_EXTRACTION_PROMPT

    for split_name, split_records in splits.items():
        out_file = processed_dir / f"{split_name}.jsonl"
        with open(out_file, "w", encoding="utf-8") as f:
            for rec in split_records:
                # Clean answer json
                clean_target = {
                    "doctor_info": rec["doctor_info"],
                    "patient_info": rec["patient_info"],
                    "clinical_notes": rec["clinical_notes"],
                    "medications": rec["medications"],
                    "tests_advised": rec["tests_advised"],
                    "follow_up_date": rec["follow_up_date"],
                    "doctor_signature_present": rec["doctor_signature_present"]
                }
                answer_content = "```json\n" + json.dumps(clean_target, indent=2, ensure_ascii=False) + "\n```"

                conversation_item = {
                    "id": rec["id"],
                    "image": rec["image"],
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "image", "image": rec["image"]},
                                {"type": "text", "text": PRESCRIPTION_EXTRACTION_PROMPT}
                            ]
                        },
                        {"role": "assistant", "content": answer_content}
                    ]
                }
                f.write(json.dumps(conversation_item, ensure_ascii=False) + "\n")
        print(f"Created processed split: {out_file} ({len(split_records)} samples)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare dataset for VLM Prescription fine-tuning")
    parser.add_argument("--samples", type=int, default=25, help="Number of synthetic samples to generate")
    parser.add_argument("--data-dir", type=str, default="./data", help="Data root directory")
    args = parser.parse_args()

    generate_synthetic_dataset(num_samples=args.samples, out_dir=Path(args.data_dir))
