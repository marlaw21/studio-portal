# TMS-OS Permanent Documentation Architecture Map

## Status

- Milestone: Controlled Permanent Output Execution
- Current Work Session: WS075
- Operating Mode: Disabled
- Permanent Writes: Not Authorized

## Controlled Flow

```text
Session Context and Session Manager
        ↓
Permanent Document Writers and Writer Registry
        ↓
Draft Package Generation and Validation
        ↓
Permanent Transaction Manager
        ↓
Rollback Package Generator
        ↓
Approval, Validation, and Authorization Layers
        ↓
Permanent Transaction Execution Plan Generator
        ↓
Permanent Transaction Dependency Analyzer
        ↓
Future Controlled Execution Boundary
```

## Permanent Documents

1. WS-HIST-001 — Work Session History
2. STATE-001 — Current State
3. DOC-STATE-001 — Documentation State
4. DEC-LOG-001 — Decision Log
5. MILE-HIST-001 — Milestone History

## Current Dependency Model

```text
WS-HIST-001
├── STATE-001
│   └── DOC-STATE-001
└── DEC-LOG-001
    └── MILE-HIST-001

DOC-STATE-001 also precedes MILE-HIST-001.
```

## WS075 Addition

### Permanent Transaction Dependency Analyzer

File:

```text
js/session/permanent-transaction-dependency-analyzer.js
```

Public API:

```text
TMSPermanentTransactionDependencyAnalyzer
```

Responsibilities:

- Read the permanent transaction execution plan.
- Analyze declared document dependencies.
- Detect missing, duplicate, self, and circular dependencies.
- Verify dependency-safe execution order.
- Produce a reviewable dependency analysis report.
- Maintain Disabled Mode.
- Perform no authorization, execution, permanent writes, rollback, restore, or state changes.

## Architecture Maintenance Rule

Update this map whenever a work session adds, removes, renames, or materially changes a permanent-documentation component or dependency.


### WS075 Compatibility Correction

Permanent Transaction Dependency Analyzer v1.0.1 reads the WS074 execution plan's `executionSteps` collection and derives the document execution order from each step's `documentId`.
