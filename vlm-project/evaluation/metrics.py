#!/usr/bin/env python3
"""Evaluation Metrics Suite for Prescription Vision-Language Model.
Computes CER, WER, normalized Levenshtein similarity, and Field-Level Extraction F1.
"""

import re
import json
import argparse
from typing import Dict, List, Any


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def compute_cer(reference: str, hypothesis: str) -> float:
    """Character Error Rate = edit_distance / len(reference)."""
    ref = reference.strip()
    hyp = hypothesis.strip()
    if not ref:
        return 0.0 if not hyp else 1.0
    dist = levenshtein_distance(ref, hyp)
    return round(dist / max(1, len(ref)), 4)


def compute_wer(reference: str, hypothesis: str) -> float:
    """Word Error Rate = word_edit_distance / len(reference_words)."""
    ref_words = reference.strip().split()
    hyp_words = hypothesis.strip().split()
    if not ref_words:
        return 0.0 if not hyp_words else 1.0
    dist = levenshtein_distance(ref_words, hyp_words)
    return round(dist / max(1, len(ref_words)), 4)


def extract_json_from_markdown(text: str) -> Dict[str, Any]:
    """Extract and parse JSON object from markdown fenced blocks or raw braces."""
    if not text:
        return {}
    # Fenced json block
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            pass
    # Brace scanning fallback
    depth = 0
    start = -1
    for i, ch in enumerate(text):
        if ch == '{' and depth == 0:
            start = i
            depth = 1
        elif ch == '{' and depth > 0:
            depth += 1
        elif ch == '}' and depth > 0:
            depth -= 1
            if depth == 0 and start >= 0:
                try:
                    return json.loads(text[start : i + 1])
                except Exception:
                    pass
                start = -1
    return {}


def compute_field_f1(pred_obj: Dict[str, Any], gt_obj: Dict[str, Any]) -> Dict[str, float]:
    """Calculate field-level precision, recall, and F1 score."""
    def flatten_dict(d, parent_key='', sep='.'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            elif isinstance(v, list):
                for idx, item in enumerate(v):
                    if isinstance(item, dict):
                        items.extend(flatten_dict(item, f"{new_key}[{idx}]", sep=sep).items())
                    else:
                        items.append((f"{new_key}[{idx}]", str(item).strip().lower()))
            else:
                items.append((new_key, str(v).strip().lower()))
        return dict(items)

    p_flat = flatten_dict(pred_obj)
    g_flat = flatten_dict(gt_obj)

    true_positives = 0
    false_positives = 0
    false_negatives = 0

    for k, v in p_flat.items():
        if k in g_flat:
            if v == g_flat[k] or compute_cer(g_flat[k], v) < 0.2:
                true_positives += 1
            else:
                false_positives += 1
        else:
            false_positives += 1

    for k, v in g_flat.items():
        if k not in p_flat:
            false_negatives += 1

    precision = true_positives / max(1, true_positives + false_positives)
    recall = true_positives / max(1, true_positives + false_negatives)
    f1 = (2 * precision * recall) / max(1e-6, precision + recall)

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4)
    }


def evaluate_predictions_file(predictions_path: str) -> Dict[str, Any]:
    items = []
    with open(predictions_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))

    if not items:
        print("No predictions found in file.")
        return {}

    total_cer = 0.0
    total_wer = 0.0
    f1_scores = []
    exact_matches = 0

    for it in items:
        pred_raw = it.get("prediction", "")
        gt_raw = it.get("ground_truth", "")

        total_cer += compute_cer(gt_raw, pred_raw)
        total_wer += compute_wer(gt_raw, pred_raw)

        pred_json = extract_json_from_markdown(pred_raw)
        gt_json = extract_json_from_markdown(gt_raw)

        if pred_json and gt_json:
            f1_metric = compute_field_f1(pred_json, gt_json)
            f1_scores.append(f1_metric["f1"])
            if f1_metric["f1"] == 1.0:
                exact_matches += 1

    n = len(items)
    avg_cer = round(total_cer / n, 4)
    avg_wer = round(total_wer / n, 4)
    avg_f1 = round(sum(f1_scores) / max(1, len(f1_scores)), 4) if f1_scores else 0.0
    exact_match_rate = round(exact_matches / n, 4)

    results = {
        "total_samples": n,
        "mean_cer": avg_cer,
        "mean_wer": avg_wer,
        "mean_field_f1": avg_f1,
        "exact_match_rate": exact_match_rate
    }

    print("\n" + "=" * 50)
    print("📈 Model Performance Metrics Report")
    print("=" * 50)
    print(f"Total Evaluated Samples: {n}")
    print(f"Mean Character Error Rate (CER): {avg_cer * 100:.2f}%")
    print(f"Mean Word Error Rate (WER):      {avg_wer * 100:.2f}%")
    print(f"Mean Field-Level F1 Score:       {avg_f1 * 100:.2f}%")
    print(f"Exact Match (EM) Rate:           {exact_match_rate * 100:.2f}%")
    print("=" * 50 + "\n")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Compute evaluation metrics")
    parser.add_argument("--predictions", type=str, default="./evaluation/predictions.jsonl")
    args = parser.parse_args()

    evaluate_predictions_file(args.predictions)
