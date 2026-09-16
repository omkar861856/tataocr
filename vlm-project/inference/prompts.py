"""Prompt templates and schemas for Medical Prescription Vision-Language Model.
"""

SYSTEM_PROMPT = """You are an expert clinical document AI and medical pharmacist assistant.
Your task is to examine the provided prescription document image, transcribe all text with high clinical accuracy, and extract structured medical entities into strict JSON format."""

PRESCRIPTION_EXTRACTION_PROMPT = """Carefully read this doctor's prescription image.
Extract the clinical and demographic information into a structured JSON object with the following fields:
- doctor_info: { name, qualification, registration_no, clinic_or_hospital, phone, address }
- patient_info: { name, age, gender, date, vitals: { bp, pulse, weight, temp } }
- clinical_notes: { diagnosis, symptoms, allergies }
- medications: list of items, each containing:
    - drug_name (brand or generic)
    - strength (e.g. 500mg, 10ml)
    - dosage_form (tablet, capsule, syrup, injection)
    - frequency (e.g. 1-0-1, OD, BD, TDS, PRN)
    - duration (e.g. 5 days, 1 month)
    - instructions (e.g. after food, before bedtime)
- tests_advised: list of lab or radiology investigations
- follow_up_date: string or null
- doctor_signature_present: boolean

Return STRICT JSON only, enclosed in ```json ... ``` without preamble."""

PRESCRIPTION_TRANSCRIPTION_PROMPT = """Transcribe all text from this prescription image into clean Markdown format.
Preserve hospital letterhead, patient header, Rx medication table, and doctor footer notes exactly as written."""

JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "doctor_info": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "qualification": {"type": "string"},
                "registration_no": {"type": "string"},
                "clinic_or_hospital": {"type": "string"},
                "phone": {"type": "string"},
                "address": {"type": "string"}
            }
        },
        "patient_info": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "string"},
                "gender": {"type": "string"},
                "date": {"type": "string"}
            }
        },
        "clinical_notes": {
            "type": "object",
            "properties": {
                "diagnosis": {"type": "string"},
                "symptoms": {"type": "string"}
            }
        },
        "medications": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "drug_name": {"type": "string"},
                    "strength": {"type": "string"},
                    "dosage_form": {"type": "string"},
                    "frequency": {"type": "string"},
                    "duration": {"type": "string"},
                    "instructions": {"type": "string"}
                },
                "required": ["drug_name"]
            }
        },
        "doctor_signature_present": {"type": "boolean"}
    },
    "required": ["doctor_info", "patient_info", "medications"]
}
