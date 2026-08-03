/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 108 — Permanent Documentation State Manager v2.0.0
Lifecycle Controller Integration
File: js/session/permanent-documentation-state-manager.js
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const STATE_MODE = "Disabled";
    const SNAPSHOT_TYPE =
        "TMS-OS Permanent Documentation State Snapshot";

    let lastStateSnapshot = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationLifecycleController
    ) {
        console.error(
            "Permanent Documentation State Manager could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== "object" ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.keys(value).forEach(function (key) {
            deepFreeze(value[key]);
        });

        return Object.freeze(value);
    }

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function buildCheck(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function createSnapshotId(sessionNumber, generatedAt) {
        return [
            "TMS",
            "STATE-SNAPSHOT",
            String(sessionNumber).padStart(3, "0"),
            generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)
        ].join("-");
    }

    function getLifecycleState(report) {
        const phases =
            report && Array.isArray(report.phases)
                ? report.phases
                : [];

        const active =
            phases.find(function (phase) {
                return phase.status === "Active";
            }) || null;

        return {
            totalPhases:
                Number(report && report.lifecyclePhaseCount) || 0,

            readyPhases:
                Number(report && report.completedPhaseCount) || 0,

            pipelineStageCount:
                Number(report && report.pipelineStageCount) || 0,

            completedStageCount:
                Number(report && report.completedStageCount) || 0,

            currentPhase:
                active ? active.phase : "Unavailable",

            currentPhaseStatus:
                active ? active.status : "Unavailable",

            finalDecisionRecorded:
                Boolean(
                    report &&
                    report.finalDecisionRecorded
                ),

            finalDecision:
                report && report.finalDecision
                    ? report.finalDecision
                    : "Not Recorded",

            governanceApprovalVerified:
                Boolean(
                    report &&
                    report.governanceApprovalVerified
                ),

            lifecycleTraceabilityComplete:
                Boolean(
                    report &&
                    report.lifecycleTraceabilityComplete
                ),

            lifecycleReady:
                Boolean(report && report.lifecycleReady),

            lifecycleModeled:
                Boolean(report && report.lifecycleModeled),

            lifecycleCompleted:
                Boolean(report && report.lifecycleCompleted),

            lifecycleReviewEligible:
                Boolean(report && report.lifecycleReviewEligible)
        };
    }

    function getSafetyLocks(report) {
        return {
            humanApprovalLocked:
                !(report && report.humanApprovalGranted === true),

            executionApprovalLocked:
                !(report && report.executionApprovalGranted === true),

            executionLocked:
                !(report && report.executionAuthorized === true),

            writeLocked:
                !(report && report.writeAuthorized === true),

            rollbackLocked:
                !(report && report.rollbackAuthorized === true),

            restoreLocked:
                !(report && report.restoreAuthorized === true),

            permanentWriteAttempted:
                Boolean(report && report.actualWritesAttempted),

            restoreAttempted:
                Boolean(report && report.actualRestoresAttempted),

            permanentWriteExecuted:
                Boolean(report && report.permanentWritesExecuted),

            restoreExecuted:
                Boolean(report && report.restoreExecuted)
        };
    }

    function getHealthState(
        report,
        lifecycleState,
        safetyLocks
    ) {
        const safe =
            safetyLocks.humanApprovalLocked &&
            safetyLocks.executionApprovalLocked &&
            safetyLocks.executionLocked &&
            safetyLocks.writeLocked &&
            safetyLocks.rollbackLocked &&
            safetyLocks.restoreLocked &&
            !safetyLocks.permanentWriteAttempted &&
            !safetyLocks.restoreAttempted &&
            !safetyLocks.permanentWriteExecuted &&
            !safetyLocks.restoreExecuted;

        const lifecycleValid =
            lifecycleState.totalPhases === 11 &&
            lifecycleState.lifecycleModeled === true;

        const governanceValid =
            lifecycleState.pipelineStageCount === 12 &&
            lifecycleState.completedStageCount === 12 &&
            lifecycleState.finalDecisionRecorded === true &&
            lifecycleState.finalDecision ===
                "Approve Governance Structure" &&
            lifecycleState.governanceApprovalVerified === true &&
            lifecycleState.lifecycleTraceabilityComplete === true;

        return {
            healthStatus:
                safe &&
                lifecycleValid &&
                governanceValid
                    ? "Safe — Governance Verified / Execution Disabled"
                    : "Review Required",

            safetyLocksVerified:
                safe,

            lifecycleModelAvailable:
                lifecycleValid,

            governanceEvidenceVerified:
                governanceValid,

            sourceAccepted:
                Boolean(report && report.accepted),

            reviewRequired:
                true
        };
    }

    function rejectedSnapshot(
        message,
        lifecycleReport,
        checks
    ) {
        const session =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        const lifecycleState =
            getLifecycleState(lifecycleReport);

        const safetyLocks =
            getSafetyLocks(lifecycleReport);

        return deepFreeze({
            snapshotType: SNAPSHOT_TYPE,
            engineVersion: ENGINE_VERSION,
            stateMode: STATE_MODE,
            snapshotId:
                createSnapshotId(
                    session.sessionNumber,
                    generatedAt
                ),
            generatedAt: generatedAt,
            sessionNumber:
                session.sessionNumber,
            accepted: false,
            message: message,
            sourceLifecycleAccepted:
                Boolean(
                    lifecycleReport &&
                    lifecycleReport.accepted
                ),
            sourceLifecycleReportId:
                lifecycleReport
                    ? lifecycleReport.reportId
                    : null,
            sourceLifecycleStatus:
                lifecycleReport
                    ? lifecycleReport.lifecycleStatus
                    : "Unavailable",
            sourceLifecycleEngineVersion:
                lifecycleReport
                    ? lifecycleReport.engineVersion
                    : null,
            sourceCoordinationId:
                lifecycleReport
                    ? lifecycleReport.sourceCoordinationId
                    : null,
            validationAccepted: false,
            validationChecks:
                checks || [],
            lifecycleState:
                lifecycleState,
            governanceState: {
                finalDecisionRecorded: false,
                finalDecision: "Not Recorded",
                governanceApprovalVerified: false,
                lifecycleTraceabilityComplete: false
            },
            approvalState: {
                humanApprovalGranted: false,
                executionApprovalGranted: false,
                approvalStatus: "Locked"
            },
            executionState: {
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false
            },
            recoveryState: {
                rollbackAuthorized: false,
                restoreAuthorized: false,
                rollbackAvailable:
                    lifecycleState.totalPhases > 0,
                restoreAvailable: false
            },
            safetyLocks:
                safetyLocks,
            healthState:
                getHealthState(
                    lifecycleReport,
                    lifecycleState,
                    safetyLocks
                ),
            stateReady: false,
            stateCurrent: true,
            stateAuthoritative: true,
            stateStatus: "Rejected",
            requiredNextAction:
                "Correct the failed Lifecycle Controller v2.0.0 report or State Manager prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateStateSnapshot(lifecycleReport) {
        const source =
            lifecycleReport ||
            window.TMSPermanentDocumentationLifecycleController
                .getLastLifecycleReport();

        const checks = [];

        let sourceValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(source)) {
            sourceValidation =
                window.TMSPermanentDocumentationLifecycleController
                    .validateLifecycleReport(source);
        }

        checks.push(buildCheck(
            "Lifecycle report exists",
            isPlainObject(source),
            "A lifecycle report is required."
        ));

        checks.push(buildCheck(
            "Lifecycle report accepted",
            Boolean(source && source.accepted),
            "The lifecycle report must be accepted."
        ));

        checks.push(buildCheck(
            "Lifecycle report validation accepted",
            Boolean(sourceValidation.accepted),
            "The lifecycle report must pass validation."
        ));

        checks.push(buildCheck(
            "Lifecycle Controller v2.0.0 source",
            Boolean(source) &&
                source.engineVersion === "2.0.0",
            "The snapshot must consume Lifecycle Controller v2.0.0."
        ));

        checks.push(buildCheck(
            "Lifecycle mode disabled",
            Boolean(source) &&
                source.lifecycleMode === "Disabled",
            "The lifecycle must remain disabled."
        ));

        checks.push(buildCheck(
            "Eleven lifecycle phases retained",
            Boolean(source) &&
                source.lifecyclePhaseCount === 11,
            "All eleven lifecycle phases must be retained."
        ));

        checks.push(buildCheck(
            "Twelve-stage governance evidence retained",
            Boolean(source) &&
                source.pipelineStageCount === 12 &&
                source.completedStageCount === 12,
            "All twelve completed pipeline stages must be retained."
        ));

        checks.push(buildCheck(
            "Final governance decision retained",
            Boolean(source) &&
                source.finalDecisionRecorded === true &&
                source.finalDecision ===
                    "Approve Governance Structure",
            "The approved final governance decision must be retained."
        ));

        checks.push(buildCheck(
            "Governance approval verified",
            Boolean(source) &&
                source.governanceApprovalVerified === true,
            "Governance approval must be verified."
        ));

        checks.push(buildCheck(
            "Lifecycle traceability complete",
            Boolean(source) &&
                source.lifecycleTraceabilityComplete === true,
            "Complete lifecycle traceability must be retained."
        ));

        checks.push(buildCheck(
            "Lifecycle modeled",
            Boolean(source) &&
                source.lifecycleModeled === true,
            "The lifecycle must be modeled."
        ));

        checks.push(buildCheck(
            "Lifecycle ready",
            Boolean(source) &&
                source.lifecycleReady === true,
            "The lifecycle must be ready."
        ));

        checks.push(buildCheck(
            "Execution approval remains ungranted",
            Boolean(source) &&
                source.executionApprovalGranted === false,
            "Execution approval must remain locked."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(source) &&
                source.humanApprovalGranted === false,
            "Human execution approval must remain locked."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(source) &&
                source.executionAuthorized === false,
            "Execution must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(source) &&
                source.writeAuthorized === false,
            "Writes must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(source) &&
                source.rollbackAuthorized === false,
            "Rollback must remain locked."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(source) &&
                source.restoreAuthorized === false,
            "Restore must remain locked."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(source) &&
                source.permanentWritesExecuted === false,
            "No permanent write may occur."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(source) &&
                source.restoreExecuted === false,
            "No restore may occur."
        ));

        if (!checks.every(function (check) {
            return check.passed;
        })) {
            lastStateSnapshot =
                rejectedSnapshot(
                    "The Permanent Documentation Lifecycle Report failed State Manager validation.",
                    source,
                    checks
                );

            return lastStateSnapshot;
        }

        const session =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        const lifecycleState =
            getLifecycleState(source);

        const safetyLocks =
            getSafetyLocks(source);

        lastStateSnapshot =
            deepFreeze({
                snapshotType: SNAPSHOT_TYPE,
                engineVersion: ENGINE_VERSION,
                stateMode: STATE_MODE,
                snapshotId:
                    createSnapshotId(
                        session.sessionNumber,
                        generatedAt
                    ),
                generatedAt: generatedAt,
                sessionNumber:
                    session.sessionNumber,
                sourceSessionNumber:
                    source.sourceSessionNumber,
                accepted: true,
                message:
                    "The current Permanent Documentation System state was normalized from Lifecycle Controller v2.0.0 into one authoritative read-only snapshot in Disabled mode.",
                sourceLifecycleAccepted: true,
                sourceLifecycleReportId:
                    source.reportId,
                sourceLifecycleStatus:
                    source.lifecycleStatus,
                sourceLifecycleEngineVersion:
                    source.engineVersion,
                sourceLifecycleGeneratedAt:
                    source.generatedAt,
                sourceCoordinationId:
                    source.sourceCoordinationId,
                sourceDecisionPackageId:
                    source.sourceDecisionPackageId,
                sourceGatewayId:
                    source.sourceGatewayId,
                sourceReviewPackageId:
                    source.sourceReviewPackageId,
                validationAccepted: true,
                validationChecks:
                    checks,
                lifecycleState:
                    lifecycleState,
                governanceState: {
                    finalDecisionRecorded:
                        source.finalDecisionRecorded === true,
                    finalDecision:
                        source.finalDecision,
                    governanceApprovalVerified:
                        source.governanceApprovalVerified === true,
                    lifecycleTraceabilityComplete:
                        source.lifecycleTraceabilityComplete === true
                },
                approvalState: {
                    humanApprovalGranted: false,
                    executionApprovalGranted: false,
                    approvalStatus:
                        "Governance Approved — Execution Locked"
                },
                executionState: {
                    authorizationGranted: false,
                    executionAuthorized: false,
                    writeAuthorized: false
                },
                recoveryState: {
                    rollbackAuthorized: false,
                    restoreAuthorized: false,
                    rollbackAvailable: true,
                    restoreAvailable: false
                },
                safetyLocks:
                    safetyLocks,
                healthState:
                    getHealthState(
                        source,
                        lifecycleState,
                        safetyLocks
                    ),
                stateReady: true,
                stateCurrent: true,
                stateAuthoritative: true,
                stateStatus:
                    "Authoritative Read-Only State — Governance Verified / Execution Disabled",
                requiredNextAction:
                    "Review the authoritative state snapshot. Any future mutable transition requires a separate approved milestone.",
                reviewRequired: true,
                reviewChoices: [
                    "Approve State Manager Structure",
                    "Revise Session",
                    "Cancel State Snapshot"
                ]
            });

        return lastStateSnapshot;
    }

    function validateStateSnapshot(snapshot) {
        const current =
            snapshot ||
            lastStateSnapshot;

        const checks = [];

        checks.push(buildCheck(
            "State snapshot exists",
            isPlainObject(current),
            "A state snapshot is required."
        ));

        checks.push(buildCheck(
            "State snapshot accepted",
            Boolean(current && current.accepted),
            "The snapshot must be accepted."
        ));

        checks.push(buildCheck(
            "State mode disabled",
            Boolean(current) &&
                current.stateMode === STATE_MODE,
            "State mode must remain disabled."
        ));

        checks.push(buildCheck(
            "Lifecycle Controller v2.0.0 source retained",
            Boolean(current) &&
                current.sourceLifecycleEngineVersion ===
                    "2.0.0",
            "The snapshot must retain Lifecycle Controller v2.0.0."
        ));

        checks.push(buildCheck(
            "State ready",
            Boolean(current) &&
                current.stateReady === true,
            "State must be ready."
        ));

        checks.push(buildCheck(
            "State current",
            Boolean(current) &&
                current.stateCurrent === true,
            "State must be current."
        ));

        checks.push(buildCheck(
            "State authoritative",
            Boolean(current) &&
                current.stateAuthoritative === true,
            "State must be authoritative."
        ));

        checks.push(buildCheck(
            "Eleven lifecycle phases retained",
            Boolean(current) &&
                current.lifecycleState &&
                current.lifecycleState.totalPhases === 11,
            "All eleven lifecycle phases must be retained."
        ));

        checks.push(buildCheck(
            "Twelve-stage governance evidence retained",
            Boolean(current) &&
                current.lifecycleState &&
                current.lifecycleState.pipelineStageCount === 12 &&
                current.lifecycleState.completedStageCount === 12,
            "All twelve completed pipeline stages must be retained."
        ));

        checks.push(buildCheck(
            "Final governance decision retained",
            Boolean(current) &&
                current.governanceState &&
                current.governanceState.finalDecisionRecorded === true &&
                current.governanceState.finalDecision ===
                    "Approve Governance Structure",
            "The approved final governance decision must be retained."
        ));

        checks.push(buildCheck(
            "Governance approval verified",
            Boolean(current) &&
                current.governanceState &&
                current.governanceState.governanceApprovalVerified ===
                    true,
            "Governance approval must be verified."
        ));

        checks.push(buildCheck(
            "Lifecycle traceability complete",
            Boolean(current) &&
                current.governanceState &&
                current.governanceState.lifecycleTraceabilityComplete ===
                    true,
            "Lifecycle traceability must remain complete."
        ));

        checks.push(buildCheck(
            "Human approval locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.humanApprovalLocked
            ),
            "Human approval must remain locked."
        ));

        checks.push(buildCheck(
            "Execution approval locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.executionApprovalLocked
            ),
            "Execution approval must remain locked."
        ));

        checks.push(buildCheck(
            "Execution locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.executionLocked
            ),
            "Execution must remain locked."
        ));

        checks.push(buildCheck(
            "Write locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.writeLocked
            ),
            "Writes must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.rollbackLocked
            ),
            "Rollback must remain locked."
        ));

        checks.push(buildCheck(
            "Restore locked",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.restoreLocked
            ),
            "Restore must remain locked."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.permanentWriteAttempted === false
            ),
            "No write may be attempted."
        ));

        checks.push(buildCheck(
            "No actual restores attempted",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.restoreAttempted === false
            ),
            "No restore may be attempted."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.permanentWriteExecuted === false
            ),
            "No write may execute."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(
                current &&
                current.safetyLocks &&
                current.safetyLocks.restoreExecuted === false
            ),
            "No restore may execute."
        ));

        checks.push(buildCheck(
            "Health state safe",
            Boolean(
                current &&
                current.healthState &&
                current.healthState.safetyLocksVerified === true &&
                current.healthState.lifecycleModelAvailable === true &&
                current.healthState.governanceEvidenceVerified === true
            ),
            "Safety locks, lifecycle state, and governance evidence must be verified."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),
            checks: checks
        });
    }

    async function formatStateSnapshot(snapshot) {
        const current =
            snapshot ||
            await generateStateSnapshot();

        const lifecycle =
            current.lifecycleState || {};

        const health =
            current.healthState || {};

        return [
            "TMS-OS PERMANENT DOCUMENTATION STATE SNAPSHOT",
            "Snapshot ID: " + current.snapshotId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Source Work Session: " +
                (current.sourceSessionNumber || "Unavailable"),
            "Engine Version: " +
                current.engineVersion,
            "State Mode: " +
                current.stateMode,
            "State Status: " +
                current.stateStatus,
            "Current Lifecycle Phase: " +
                (lifecycle.currentPhase || "Unavailable"),
            "Current Phase Status: " +
                (lifecycle.currentPhaseStatus || "Unavailable"),
            "Lifecycle Phases: " +
                (lifecycle.totalPhases || 0),
            "Ready Phases: " +
                (lifecycle.readyPhases || 0),
            "Pipeline Stages: " +
                (lifecycle.pipelineStageCount || 0),
            "Completed Stages: " +
                (lifecycle.completedStageCount || 0),
            "Final Decision Recorded: " +
                (lifecycle.finalDecisionRecorded ? "YES" : "NO"),
            "Final Decision: " +
                (lifecycle.finalDecision || "Not Recorded"),
            "Governance Approval Verified: " +
                (lifecycle.governanceApprovalVerified ? "YES" : "NO"),
            "Lifecycle Traceability Complete: " +
                (lifecycle.lifecycleTraceabilityComplete ? "YES" : "NO"),
            "State Ready: " +
                (current.stateReady ? "YES" : "NO"),
            "State Current: " +
                (current.stateCurrent ? "YES" : "NO"),
            "State Authoritative: " +
                (current.stateAuthoritative ? "YES" : "NO"),
            "System Health: " +
                (health.healthStatus || "Unavailable"),
            "Execution Approval Locked: YES",
            "Human Approval Locked: YES",
            "Execution Locked: YES",
            "Write Locked: YES",
            "Rollback Locked: YES",
            "Restore Locked: YES",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO",
            "Required Next Action: " +
                current.requiredNextAction
        ].join("\n");
    }

    function getLastStateSnapshot() {
        return lastStateSnapshot;
    }

    function getCurrentState(snapshot) {
        const current =
            snapshot ||
            lastStateSnapshot;

        return current
            ? clone({
                lifecycleState:
                    current.lifecycleState,

                governanceState:
                    current.governanceState,

                approvalState:
                    current.approvalState,

                executionState:
                    current.executionState,

                recoveryState:
                    current.recoveryState,

                safetyLocks:
                    current.safetyLocks,

                healthState:
                    current.healthState
            })
            : null;
    }

    window.TMSPermanentDocumentationStateManager =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,
            stateMode:
                STATE_MODE,
            generateStateSnapshot:
                generateStateSnapshot,
            validateStateSnapshot:
                validateStateSnapshot,
            formatStateSnapshot:
                formatStateSnapshot,
            getLastStateSnapshot:
                getLastStateSnapshot,
            getCurrentState:
                getCurrentState
        });

    console.log(
        "Permanent Documentation State Manager v" +
        ENGINE_VERSION +
        " initialized in " +
        STATE_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
