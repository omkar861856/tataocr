# Tata OCR Enterprise Studio 📄⚡

> **Intelligent Document OCR & Multimodal Intelligence Pipeline**  
> Powered by [Curiosity-Ai-BV/localOCR](https://github.com/Curiosity-Ai-BV/localOCR.git) architecture, **Google Gemma 4 Multimodal Vision**, and **NVIDIA GeForce RTX 5090 (32GB VRAM)**.

---

## 🌟 Overview

Tata OCR Studio is a full-stack document intelligence platform that transcribes scanned documents, invoices, receipts, and forms into **clean GitHub Flavored Markdown** and extracts **structured JSON key-value entities** with real pixel coordinate bounding boxes.

It integrates with local multimodal vision models via Ollama to ensure complete data privacy (no third-party cloud data leaks) with GPU acceleration.

---

## 🚀 Key Features

- **Multimodal Vision OCR**: Uses Google Gemma 4 Vision (`gemma4:latest`) for high-fidelity text transcription, complex layout analysis, and table reconstruction.
- **Structured Field Extraction**: Extracts key metadata (Invoice ID, Vendor, Issue Date, Due Date, Subtotal, Tax, Total Due, Line Items) into strictly formatted JSON.
- **Interactive Visual Canvas**: Maps sub-pixel word coordinates and multi-zone bounding boxes (Headers, Tables, Footers) with confidence scores.
- **AI Document Reasoning**:
  - 📋 **Executive Summaries**: High-level synthesis of financial or operational records.
  - 🏷️ **Entity Extraction**: JSON structured metadata with automated validation.
  - 📊 **Table & Line Items**: Arithmetic reconciliation, tax cross-checks, and discrepancy detection.
  - 🛡️ **Audit & Compliance**: Automated verification against standards (GAAP, ISO-19005).
- **Cluster Control Plane & Autoscaling Simulator**:
  - Live GPU telemetry (`nvidia-smi` memory and compute tracking).
  - KEDA / Kubernetes HPA autoscaling simulation with real-time replica pool scaling.
  - Interactive traffic generator with burst surge and RPS controls.

---

## 🛠️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Vite Studio UI                   │
│           (Upload Dropzone, Document Viewer, Canvas)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Reverse Proxy
┌──────────────────────────────▼──────────────────────────────┐
│                   Python Backend Server                     │
│                (/api/ocr/process, /api/llm/analyze)         │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Base64 Image                 │ Word Coordinates
┌──────────────▼─────────────┐ ┌──────────────▼───────────────┐
│     Ollama Vision Server   │ │   Tesseract Neural Coordinate│
│       (gemma4:latest)      │ │            Locator           │
└──────────────┬─────────────┘ └──────────────────────────────┘
               │ CUDA 13.0
┌──────────────▼──────────────────────────────────────────────┐
│           NVIDIA GeForce RTX 5090 (32GB VRAM)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com/) installed with vision models:
  ```bash
  ollama pull gemma4:latest
  ```

### 2. Install Frontend Dependencies
```bash
npm install
npm run build
```

### 3. Run Backend Server
```bash
python3 server.py
```

### 4. Run Frontend (Dev Mode)
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📜 License
MIT License.
