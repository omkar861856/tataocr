# Production Kubernetes Architecture: VLM & OCR Systems

This directory contains the production-grade Kubernetes deployment manifests, load balancing ingress rules, KEDA autoscaling policies, and Continuous Data Protection (CDP) specifications for scaling Vision Language Models (Qwen2-VL / LLaVA / Florence-2 / PaddleOCR) on GPU clusters.

---

## 📁 Kubernetes Manifest Structure

```
k8s/
├── gpu-vlm-worker.yaml            # Deployment with GPU tolerations, NVMe shared model mounts, vLLM engine
├── ingress-vlm-ocr.yaml           # NGINX Ingress with 100m body size, least_conn load balancing, 300s timeouts
├── keda-autoscaler.yaml           # KEDA ScaledObject triggering scale-up (1 -> 8 replicas) on Queue & GPU Duty Cycle
├── cdp-backup-architecture.md     # Continuous Data Protection (CDP) & 1-Click PITR Disaster Recovery Guide
└── README.md                      # Operator guide and step-by-step checklist
```

---

## 🚀 Step-by-Step Operator Deployment Checklist

- [x] **1. Provision GPU Node Pool**: `accelerator=nvidia-gpu` nodes (NVIDIA A10G / B200 / H100) with NVIDIA GPU Operator installed.
- [x] **2. Prepare Shared NVMe Volume**: Populated `/models` directory on `pvc-fast-nvme-vlm-models` PersistentVolume.
- [x] **3. Deploy VLM/OCR Worker Pods**:
  ```bash
  kubectl apply -f k8s/gpu-vlm-worker.yaml
  ```
- [x] **4. Configure High-Throughput Ingress**:
  ```bash
  kubectl apply -f k8s/ingress-vlm-ocr.yaml
  ```
- [x] **5. Enable KEDA Event-Driven Autoscaling**:
  ```bash
  kubectl apply -f k8s/keda-autoscaler.yaml
  ```
- [x] **6. Verify Continuous Data Protection (CDP)**: See [`cdp-backup-architecture.md`](file:///Users/omkarlolge/Desktop/tataocr/k8s/cdp-backup-architecture.md).
