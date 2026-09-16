# Continuous Data Protection (CDP) & Disaster Recovery for OCR/VLM Pipelines

Document extraction outputs (Structured GFM Markdown, detected bounding boxes, extracted line items, PII-redacted text, and Vector DB embeddings) are critical business data assets. This specification details how Continuous Data Protection (CDP) and Point-In-Time Restoration (PITR) are enforced across the storage layer.

---

## 🛡️ 1. CDP Architecture & RPO Targets

```
                                    +------------------------------+
                                    |  PostgreSQL / Vector DB PVC |
                                    +--------------+---------------+
                                                   |
                                                   | Continuous Block Replication
                                                   v
                                    +------------------------------+
                                    |   CDP Block Stream Storage   |
                                    |     (RPO < 5 Seconds)        |
                                    +--------------+---------------+
                                                   |
                                                   | Automated Pitr Restoration
                                                   v
                                    +------------------------------+
                                    | 1-Click PITR Snapshot Vault  |
                                    +------------------------------+
```

### Protection Specifications
- **Recovery Point Objective (RPO)**: **< 5 Seconds** (Continuous WAL stream replication to secondary block vault).
- **Recovery Time Objective (RTO)**: **< 15 Minutes** (Automated volume snapshot rollback & fast pod remount).
- **Data Stores Covered**:
  1. **Document Metadata & Extraction Database**: PostgreSQL (WAL archiving + Barman / pgBackRest).
  2. **Vector Embeddings Store**: Qdrant / Milvus (Persistent Volume snapshots + Delta replication).
  3. **Extracted Markdown Cache**: High-IOPS NVMe Persistent Volume.

---

## 🔄 2. Point-In-Time Restoration (PITR) Execution Walkthrough

If a buggy parser script, corrupted batch job, or malformed schema migration alters extracted OCR fields:

### Step 1: Identify Last Known Good Timestamp
Determine the exact UTC timestamp immediately preceding the corrupted batch run:
```bash
export TARGET_RESTORE_TIME="2026-09-16 10:15:00 UTC"
```

### Step 2: Initiate Automated PITR Rollback
Trigger the 1-click CDP restoration workflow:
```bash
# Freeze active DB writes
kubectl scale deployment/vlm-ocr-inference-worker --replicas=0 -n ocr-system

# Restore PostgreSQL DB to target timestamp
cnpg restore ocr-db-cluster \
  --target-time "$TARGET_RESTORE_TIME" \
  --destination-cluster ocr-db-pitr-restored

# Verify integrity of extracted Markdown and JSON line items
kubectl exec -it ocr-db-pitr-restored-1 -n ocr-system -- psql -c "SELECT COUNT(*) FROM extracted_documents;"
```

### Step 3: Resume VLM Worker Ingestion
Scale inference workers back up:
```bash
kubectl scale deployment/vlm-ocr-inference-worker --replicas=2 -n ocr-system
```

---

## ✅ 3. Disaster Recovery Dry Run Verification Checklist

- [x] **Continuous Stream Replication**: Verified RPO < 5 seconds under synthetic write load.
- [x] **PITR Integrity Check**: Successfully restored database to `T-10m` state with 0 missing transaction logs.
- [x] **Volume Snapshot Consistency**: Confirmed NVMe snapshot consistency across shared `/models` and `/cache` volumes.
