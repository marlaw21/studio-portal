# TMS-OS Permanent Architecture Map

**Document Status:** Active Architectural Reference  
**Current Version:** v0.28.1  
**Current Milestone:** Controlled Permanent Output Execution  
**Last Updated Through:** Work Session 074  

## 1. Purpose

This document is the authoritative architectural map for the TMS-OS Controlled Permanent Output Execution system.

It records:

- The permanent documentation components that have been created.
- The responsibility of each component.
- The order in which the components participate.
- The safety boundaries that prevent unauthorized permanent writes.
- The next verified architectural gap.

This document must be updated whenever a permanent-output component is added, removed, renamed, or assigned a different responsibility.

## 2. Permanent Documents

The Permanent Transaction Manager currently expects five permanent documents:

1. `WS-HIST-001` — Work Session History
2. `STATE-001` — Current State
3. `DOC-STATE-001` — Documentation State
4. `DEC-LOG-001` — Decision Log
5. `MILE-HIST-001` — Milestone History

## 3. Registered Permanent Document Writers

The Document Writer Registry currently contains five registered writers:

1. Work Session History Writer
2. Current State Writer
3. Documentation State Writer
4. Decision Log Writer
5. Milestone History Writer

Each writer creates a proposed permanent-document output. Writers do not independently authorize permanent writes.

## 4. Controlled Permanent Output Architecture

```text
Session Context and Session Manager
                ↓
Prepare Session and Approve & Close
                ↓
Document Update Plan
                ↓
Permanent Document Writers
                ↓
Document Writer Registry
                ↓
Draft Package Generation
                ↓
Permanent Transaction Manager
                ↓
Rollback Package Generator
                ↓
Original Document Capture
                ↓
Execution Verification and Authorization Layers
                ↓
Final Human Approval Gateway
                ↓
Permanent Documentation State and Transition Layers
                ↓
Permanent Transaction Execution Plan Generator
                ↓
Future Controlled Execution Capability
```

## 5. Current Safety Position

The system remains in **Disabled Mode**.

Current permanent-output safeguards require:

- Approved session closure.
- Valid permanent-document proposals.
- A complete five-document draft package.
- Registry validation.
- Transaction validation.
- Original-document capture.
- Rollback availability.
- Execution verification.
- Authorization review.
- Human approval.
- State-transition approval.
- State-change approval validation.
- A reviewable execution plan.

The current architecture does not authorize permanent writes.

## 6. Work Session 074 Addition

### Permanent Transaction Execution Plan Generator

**File:**

`js/session/permanent-transaction-execution-plan-generator.js`

**Public Object:**

`TMSPermanentTransactionExecutionPlanGenerator`

**Version:** `1.0.1`

**Mode:** `Disabled`

**Responsibility:**

- Read the active session context when available.
- Read the registered writer list.
- Read the expected permanent-document list.
- Read the latest draft package when available.
- Read the latest permanent transaction when available.
- Produce the planned document execution sequence.
- Define validation checkpoints.
- Define rollback checkpoints.
- Define step dependencies.
- Produce a human-readable execution plan.
- Validate the structure of the plan.
- Record the active session number and milestone in the generated plan.

**Explicitly prohibited:**

- Executing writers.
- Writing permanent documents.
- Authorizing execution.
- Changing permanent-document state.
- Performing rollback.
- Performing restore.

## 7. Architectural Decision from Work Session 074

The architecture review found that the system already contained numerous approval, authorization, execution, transition, lifecycle, and state controllers.

The next genuine gap was not another controller. The missing capability was a consolidated, reviewable execution plan showing what would happen if a future execution were authorized.

Therefore, Work Session 074 added the Permanent Transaction Execution Plan Generator instead of extending the controller chain.

## 8. Maintenance Rule

For every future permanent-output module:

1. Add the component to this map.
2. Record its file path.
3. Record its public object name.
4. Record its version and operating mode.
5. Define its responsibility.
6. Define what it is prohibited from doing.
7. Place it correctly in the architecture flow.
8. Record the work-session decision that justified it.

## 9. Current Next Architectural Question

After Work Session 074 is completed and validated, the next session must review the generated execution-plan output and determine whether the next missing capability is:

- Execution-plan approval,
- Execution-plan persistence,
- Execution-plan comparison,
- Or a different verified architectural need.

No new module should be selected solely by extending an existing naming sequence.
