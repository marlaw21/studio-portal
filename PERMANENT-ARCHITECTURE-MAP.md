# TMS-OS Permanent Documentation Architecture Map

**Current Version:** v0.28.1  
**Milestone:** Controlled Permanent Output Execution  
**Current Module:** Permanent Transaction Manifest Generator  
**Current Work Session:** WS077

---

## 1. Architectural Purpose

The permanent documentation subsystem provides a controlled, reviewable, auditable path from session evidence to future permanent-document output.

The subsystem is intentionally separated into small components so that planning, validation, approval, authorization, execution, rollback, verification, and documentation can be independently tested.

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
Future Permanent Transaction Integrity Analyzer
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

The manifest consolidates:

- Session metadata
- Latest transaction snapshot
- Expected permanent-document identifiers
- Registered writer snapshot
- Writer Registry validation
- Execution order and execution-plan snapshot
- Dependency graph and dependency-analysis snapshot
- Readiness state and readiness-report snapshot
- Validation summaries
- Future checksum placeholder
- Future digital-signature placeholder
- Safety state

The manifest is frozen after generation. It does not calculate a checksum, generate a digital signature, accept a transaction, authorize execution, or perform permanent writes.

---

## 9. Current Safety Boundary

The architecture remains in Disabled Mode.

Current components may:

- Generate plans
- Generate analyses
- Generate immutable manifests
- Validate structures
- Format review reports
- Record session evidence

Current components may not:

- Authorize permanent execution
- Execute permanent writes
- Apply state changes
- Perform rollback or restore
- Generate an execution signature
- Bypass human approval

---

## 10. Permanent Statement

The Controlled Permanent Output Execution architecture is a safety-first framework. A complete, valid manifest means the transaction has one internally organized canonical representation. It does not mean that execution is approved, authorized, or enabled.
