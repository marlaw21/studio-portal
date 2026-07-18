# TMS-OS Permanent Documentation Architecture Map

**Current Version:** v0.28.1  
**Milestone:** Controlled Permanent Output Execution  
**Current Module:** Permanent Transaction Checksum Generator  
**Current Work Session:** WS079

---

## 1. Architectural Purpose

The permanent documentation subsystem provides a controlled, reviewable, auditable path from session evidence to future permanent-document output.

The subsystem is intentionally separated into small components so planning, validation, approval, authorization, execution, rollback, verification, integrity analysis, checksum generation, and documentation can be independently tested.

No component may bypass the established human-approval boundary.

---

## 2. Permanent Documents

The current permanent-document transaction contains five documents:

1. `WS-HIST-001` — Work Session History
2. `STATE-001` — Current State
3. `DOC-STATE-001` — Documentation State
4. `DEC-LOG-001` — Decision Log
5. `MILE-HIST-001` — Milestone History

---

## 3. Registered Permanent Document Writers

| Permanent Document | Writer | Update Mode |
|---|---|---|
| WS-HIST-001 | Work Session History Writer | Append |
| STATE-001 | Current State Writer | Replace |
| DOC-STATE-001 | Documentation State Writer | Replace |
| DEC-LOG-001 | Decision Log Writer | Append |
| MILE-HIST-001 | Milestone History Writer | Append |

---

## 4. Controlled Permanent Output Flow

```text
Session Context and Session Manager
        │
        ▼
Document Update Plan
        │
        ▼
Permanent Document Writers
        │
        ▼
Document Writer Registry
        │
        ▼
Five-Document Draft Package
        │
        ▼
Permanent Transaction Manager
        │
        ▼
Rollback Package Generator
        │
        ▼
Original Document Capture
        │
        ▼
Human Approval and Approval Validation
        │
        ▼
Authorization and State-Change Controls
        │
        ▼
Permanent Transaction Execution Plan Generator
        │
        ▼
Permanent Transaction Dependency Analyzer
        │
        ▼
Permanent Transaction Readiness Analyzer
        │
        ▼
Permanent Transaction Manifest Generator
        │
        ▼
Permanent Transaction Integrity Analyzer
        │
        ▼
Permanent Transaction Checksum Generator
        │
        ▼
Future Digital Signature Boundary
        │
        ▼
Future Controlled Execution Boundary
```

---

## 5. Execution Plan Generator

The Permanent Transaction Execution Plan Generator creates a read-only, reviewable plan for the five expected permanent documents.

It identifies expected documents, registered writers, proposed execution order, validation checkpoints, rollback checkpoints, and safety state.

---

## 6. Dependency Analyzer

The Permanent Transaction Dependency Analyzer verifies that the proposed execution order is dependency-safe.

It detects missing, duplicate, self, circular, and order-violating dependencies.

---

## 7. Readiness Analyzer

The Permanent Transaction Readiness Analyzer consolidates the structural results of the preceding components into one read-only readiness report.

A structurally ready result does not constitute human approval, execution authorization, or permission to modify permanent documentation.

---

## 8. Manifest Generator

The Permanent Transaction Manifest Generator creates one canonical, immutable, read-only description of the complete transaction state.

The manifest consolidates session, transaction, Writer Registry, execution-plan, dependency-analysis, readiness, validation, placeholder, and safety snapshots.

---

## 9. Integrity Analyzer

The Permanent Transaction Integrity Analyzer treats the canonical manifest as its single source of truth.

It verifies schema metadata, permanent-document coverage, registered-writer references, execution-order references, dependency references, duplicates, orphaned references, upstream validity, placeholder presence, and Disabled Mode safety state.

---

## 10. Checksum Generator

The Permanent Transaction Checksum Generator creates a deterministic SHA-256 checksum from a normalized canonical representation of the immutable manifest.

Canonicalization:

- Sorts object keys.
- Preserves array order.
- Excludes volatile timestamp fields.
- Excludes checksum and digital-signature placeholder values to prevent self-reference.
- Does not mutate the manifest.

The checksum report verifies checksum format and deterministic repeatability. It creates a read-only placeholder-population proposal only.

The generator does not accept a transaction, authorize execution, modify the manifest, write permanent documents, roll back, restore, generate a digital signature, or apply state changes.

---

## 11. Current Safety Boundary

The architecture remains in Disabled Mode.

Current components may:

- Generate plans
- Generate analyses
- Generate immutable manifests
- Validate manifest integrity
- Generate deterministic checksum reports
- Format review reports
- Record session evidence

Current components may not:

- Authorize permanent execution
- Execute permanent writes
- Apply state changes
- Perform rollback or restore
- Mutate the immutable manifest
- Generate or verify an execution signature
- Bypass human approval

---

## 12. Permanent Statement

The Controlled Permanent Output Execution architecture is a safety-first framework. A valid checksum confirms that the normalized canonical manifest content produced a deterministic SHA-256 value under the current canonicalization rules. It does not mean the transaction is approved, authorized, signed, enabled, or executed.
