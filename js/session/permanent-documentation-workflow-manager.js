/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 109 — Permanent Documentation Workflow Manager v2.0.0
State Manager Integration
File: js/session/permanent-documentation-workflow-manager.js

Purpose:
Consume an accepted Permanent Documentation State Manager v2.0.0 snapshot and
produce one immutable, review-only workflow summary that represents the complete
validated permanent-documentation governance workflow.

Version 2.0.0 preserves the existing seven-member public API and component
inventory while replacing the legacy Final Human Approval Gateway source with
the authoritative read-only State Manager v2.0.0 source.

This version remains fully disabled and non-destructive. It grants no execution,
write, rollback, or restore authority and performs no permanent file operations.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const WORKFLOW_MODE = "Disabled";
    const WORKFLOW_TYPE =
        "TMS-OS Permanent Documentation Workflow Summary";

    const COMPONENTS = Object.freeze([
        ["Session Context Engine", "TMSSessionContext"],
        ["Document Update Engine", "TMSDocumentUpdateEngine"],
        ["Document Writer Registry", "TMSDocumentWriterRegistry"],
        ["Permanent Transaction Manager", "TMSPermanentTransactionManager"],
        ["Rollback Package Generator", "TMSRollbackPackageGenerator"],
        ["Original Document Capture Engine", "TMSOriginalDocumentCaptureEngine"],
        ["Controlled Execution Engine", "TMSControlledExecutionEngine"],
        ["Permanent File Writer", "TMSPermanentFileWriter"],
        ["Execution Verification Engine", "TMSExecutionVerificationEngine"],
        ["Execution Authorization Engine", "TMSExecutionAuthorizationEngine"],
        ["Permanent Write Execution Engine", "TMSPermanentWriteExecutionEngine"],
        ["Rollback Execution Engine", "TMSRollbackExecutionEngine"],
        ["Permanent Output Orchestrator", "TMSPermanentOutputOrchestrator"],
        ["Pipeline Review Package Generator", "TMSPipelineReviewPackageGenerator"],
        ["Final Human Approval Gateway", "TMSFinalHumanApprovalGateway"],
        ["Final Human Decision Package", "TMSFinalHumanDecisionPackage"],
        ["Permanent Documentation Execution Coordinator", "TMSPermanentDocumentationExecutionCoordinator"],
        ["Permanent Documentation Lifecycle Controller", "TMSPermanentDocumentationLifecycleController"],
        ["Permanent Documentation State Manager", "TMSPermanentDocumentationStateManager"]
    ]);

    let lastWorkflowSummary = null;

    const missing = COMPONENTS.filter(function (item) {
        return !window[item[1]];
    });

    if (missing.length > 0) {
        console.error(
            "Permanent Documentation Workflow Manager could not initialize because dependencies are unavailable:",
            missing.map(function (item) {
                return item[0];
            })
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

    function check(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function workflowId(sessionNumber, generatedAt) {
        return [
            "TMS",
            "WORKFLOW-SUMMARY",
            String(sessionNumber).padStart(3, "0"),
            generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)
        ].join("-");
    }

    function inventory() {
        return COMPONENTS.map(function (item, index) {
            return {
                sequence: index + 1,
                component: item[0],
                globalName: item[1],
                available: Boolean(window[item[1]])
            };
        });
    }

    function getStateEvidence(stateSnapshot) {
        const lifecycle =
            stateSnapshot &&
            isPlainObject(stateSnapshot.lifecycleState)
                ? stateSnapshot.lifecycleState
                : {};

        const governance =
            stateSnapshot &&
            isPlainObject(stateSnapshot.governanceState)
                ? stateSnapshot.governanceState
                : {};

        const health =
            stateSnapshot &&
            isPlainObject(stateSnapshot.healthState)
                ? stateSnapshot.healthState
                : {};

        return {
            lifecyclePhaseCount:
                Number(lifecycle.totalPhases) || 0,
            readyPhaseCount:
                Number(lifecycle.readyPhases) || 0,
            pipelineStageCount:
                Number(lifecycle.pipelineStageCount) || 0,
            completedStageCount:
                Number(lifecycle.completedStageCount) || 0,
            finalDecisionRecorded:
                governance.finalDecisionRecorded === true,
            finalDecision:
                governance.finalDecision || "Not Recorded",
            governanceApprovalVerified:
                governance.governanceApprovalVerified === true,
            lifecycleTraceabilityComplete:
                governance.lifecycleTraceabilityComplete === true,
            stateHealthStatus:
                health.healthStatus || "Unavailable",
            governanceEvidenceVerified:
                health.governanceEvidenceVerified === true,
            safetyLocksVerified:
                health.safetyLocksVerified === true
        };
    }

    function rejected(message, stateSnapshot, checks) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        const items =
            inventory();

        const evidence =
            getStateEvidence(stateSnapshot);

        return deepFreeze({
            workflowType: WORKFLOW_TYPE,
            engineVersion: ENGINE_VERSION,
            workflowMode: WORKFLOW_MODE,
            workflowId:
                workflowId(
                    snapshot.sessionNumber,
                    generatedAt
                ),
            generatedAt: generatedAt,
            sessionNumber:
                snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourceStateAccepted:
                Boolean(
                    stateSnapshot &&
                    stateSnapshot.accepted
                ),
            sourceStateSnapshotId:
                stateSnapshot
                    ? stateSnapshot.snapshotId
                    : null,
            sourceStateStatus:
                stateSnapshot
                    ? stateSnapshot.stateStatus
                    : "Unavailable",
            sourceStateEngineVersion:
                stateSnapshot
                    ? stateSnapshot.engineVersion
                    : null,
            validationAccepted: false,
            validationChecks:
                checks || [],
            componentCount:
                items.length,
            availableComponentCount:
                items.filter(function (item) {
                    return item.available;
                }).length,
            components:
                items,
            lifecyclePhaseCount:
                evidence.lifecyclePhaseCount,
            readyPhaseCount:
                evidence.readyPhaseCount,
            pipelineStageCount:
                evidence.pipelineStageCount,
            completedStageCount:
                evidence.completedStageCount,
            finalDecisionRecorded:
                evidence.finalDecisionRecorded,
            finalDecision:
                evidence.finalDecision,
            governanceApprovalVerified:
                evidence.governanceApprovalVerified,
            lifecycleTraceabilityComplete:
                evidence.lifecycleTraceabilityComplete,
            stateHealthStatus:
                evidence.stateHealthStatus,
            workflowReady: false,
            workflowCompleted: false,
            humanReviewEligible: false,
            humanApprovalGranted: false,
            executionApprovalGranted: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            workflowStatus: "Rejected",
            requiredNextAction:
                "Correct the failed State Manager v2.0.0 snapshot or workflow prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateWorkflowSummary(stateSnapshot) {
        const state =
            stateSnapshot ||
            window.TMSPermanentDocumentationStateManager
                .getLastStateSnapshot();

        const stateValidation =
            isPlainObject(state)
                ? window.TMSPermanentDocumentationStateManager
                    .validateStateSnapshot(state)
                : {
                    accepted: false,
                    checks: []
                };

        const items =
            inventory();

        const evidence =
            getStateEvidence(state);

        const checks = [
            check(
                "State snapshot exists",
                isPlainObject(state),
                "A Permanent Documentation State Snapshot is required."
            ),
            check(
                "State snapshot accepted",
                Boolean(state && state.accepted),
                "The State Manager snapshot must be accepted."
            ),
            check(
                "State snapshot validation accepted",
                Boolean(
                    stateValidation &&
                    stateValidation.accepted
                ),
                "The State Manager snapshot must pass validation."
            ),
            check(
                "State Manager v2.0.0 source",
                Boolean(state) &&
                    state.engineVersion === "2.0.0",
                "The workflow must consume State Manager v2.0.0."
            ),
            check(
                "State remains disabled",
                Boolean(state) &&
                    state.stateMode === "Disabled",
                "The State Manager must remain in Disabled mode."
            ),
            check(
                "State authoritative",
                Boolean(state) &&
                    state.stateAuthoritative === true,
                "The source state must be authoritative."
            ),
            check(
                "State current",
                Boolean(state) &&
                    state.stateCurrent === true,
                "The source state must be current."
            ),
            check(
                "State ready",
                Boolean(state) &&
                    state.stateReady === true,
                "The source state must be ready."
            ),
            check(
                "Eleven lifecycle phases retained",
                evidence.lifecyclePhaseCount === 11,
                "All eleven lifecycle phases must be retained."
            ),
            check(
                "Twelve-stage governance evidence retained",
                evidence.pipelineStageCount === 12 &&
                    evidence.completedStageCount === 12,
                "All twelve completed pipeline stages must be retained."
            ),
            check(
                "Final governance decision retained",
                evidence.finalDecisionRecorded === true &&
                    evidence.finalDecision ===
                        "Approve Governance Structure",
                "The approved final governance decision must be retained."
            ),
            check(
                "Governance approval verified",
                evidence.governanceApprovalVerified === true,
                "Governance approval must be verified."
            ),
            check(
                "Lifecycle traceability complete",
                evidence.lifecycleTraceabilityComplete === true,
                "Complete lifecycle traceability must be retained."
            ),
            check(
                "State health safe",
                evidence.stateHealthStatus ===
                    "Safe — Governance Verified / Execution Disabled" &&
                    evidence.governanceEvidenceVerified === true &&
                    evidence.safetyLocksVerified === true,
                "The authoritative state health must be safe and fully verified."
            ),
            check(
                "Execution approval remains ungranted",
                Boolean(
                    state &&
                    state.approvalState &&
                    state.approvalState
                        .executionApprovalGranted === false
                ),
                "Execution approval must remain locked."
            ),
            check(
                "Human approval remains ungranted",
                Boolean(
                    state &&
                    state.approvalState &&
                    state.approvalState
                        .humanApprovalGranted === false
                ),
                "Human execution approval must remain locked."
            ),
            check(
                "Execution remains unauthorized",
                Boolean(
                    state &&
                    state.executionState &&
                    state.executionState
                        .executionAuthorized === false
                ),
                "Execution must remain unauthorized."
            ),
            check(
                "Write remains unauthorized",
                Boolean(
                    state &&
                    state.executionState &&
                    state.executionState
                        .writeAuthorized === false
                ),
                "Writing must remain unauthorized."
            ),
            check(
                "Rollback remains unauthorized",
                Boolean(
                    state &&
                    state.recoveryState &&
                    state.recoveryState
                        .rollbackAuthorized === false
                ),
                "Rollback must remain unauthorized."
            ),
            check(
                "Restore remains unauthorized",
                Boolean(
                    state &&
                    state.recoveryState &&
                    state.recoveryState
                        .restoreAuthorized === false
                ),
                "Restore must remain unauthorized."
            ),
            check(
                "No permanent writes executed",
                Boolean(
                    state &&
                    state.safetyLocks &&
                    state.safetyLocks
                        .permanentWriteExecuted === false
                ),
                "No permanent file may be modified."
            ),
            check(
                "No restore executed",
                Boolean(
                    state &&
                    state.safetyLocks &&
                    state.safetyLocks
                        .restoreExecuted === false
                ),
                "No restore operation may occur."
            ),
            check(
                "All components available",
                items.every(function (item) {
                    return item.available;
                }),
                "Every required workflow component must be available."
            )
        ];

        if (!checks.every(function (item) {
            return item.passed;
        })) {
            lastWorkflowSummary =
                rejected(
                    "The Permanent Documentation State Manager v2.0.0 snapshot failed Workflow Manager validation.",
                    state,
                    checks
                );

            return lastWorkflowSummary;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastWorkflowSummary =
            deepFreeze({
                workflowType: WORKFLOW_TYPE,
                engineVersion: ENGINE_VERSION,
                workflowMode: WORKFLOW_MODE,
                workflowId:
                    workflowId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),
                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,
                sourceSessionNumber:
                    state.sourceSessionNumber,
                accepted: true,
                message:
                    "The complete permanent documentation workflow was normalized from the authoritative State Manager v2.0.0 snapshot in Disabled mode. Governance evidence was retained, execution remained locked, and no permanent file operations occurred.",
                sourceStateAccepted: true,
                sourceStateSnapshotId:
                    state.snapshotId,
                sourceStateStatus:
                    state.stateStatus,
                sourceStateEngineVersion:
                    state.engineVersion,
                sourceStateGeneratedAt:
                    state.generatedAt,
                sourceLifecycleReportId:
                    state.sourceLifecycleReportId,
                sourceCoordinationId:
                    state.sourceCoordinationId,
                sourceDecisionPackageId:
                    state.sourceDecisionPackageId,
                sourceGatewayId:
                    state.sourceGatewayId,
                sourceReviewPackageId:
                    state.sourceReviewPackageId,
                validationAccepted: true,
                validationChecks:
                    checks,
                componentCount:
                    items.length,
                availableComponentCount:
                    items.length,
                components:
                    items,
                lifecyclePhaseCount:
                    evidence.lifecyclePhaseCount,
                readyPhaseCount:
                    evidence.readyPhaseCount,
                pipelineStageCount:
                    evidence.pipelineStageCount,
                completedStageCount:
                    evidence.completedStageCount,
                finalDecisionRecorded: true,
                finalDecision:
                    evidence.finalDecision,
                governanceApprovalVerified: true,
                lifecycleTraceabilityComplete: true,
                stateHealthStatus:
                    evidence.stateHealthStatus,
                stateAuthoritative: true,
                workflowReady: true,
                workflowCompleted: true,
                humanReviewEligible: true,
                humanApprovalGranted: false,
                executionApprovalGranted: false,
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,
                restoreAuthorized: false,
                actualWritesAttempted: false,
                actualRestoresAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,
                workflowStatus:
                    "Ready for Human Review — Authoritative State Verified / Execution Disabled",
                requiredNextAction:
                    "Review the authoritative disabled workflow. Any future mutable or execution-enabled workflow requires a separate approved milestone.",
                reviewRequired: true,
                reviewChoices: [
                    "Approve Workflow Manager Structure",
                    "Revise Session",
                    "Cancel Workflow Summary"
                ]
            });

        return lastWorkflowSummary;
    }

    function validateWorkflowSummary(summary) {
        const current =
            summary ||
            lastWorkflowSummary;

        const checks = [
            check(
                "Workflow summary exists",
                isPlainObject(current),
                "A workflow summary is required."
            ),
            check(
                "Workflow summary accepted",
                Boolean(
                    current &&
                    current.accepted
                ),
                "The summary must be accepted."
            ),
            check(
                "Workflow mode disabled",
                Boolean(current) &&
                    current.workflowMode ===
                        WORKFLOW_MODE,
                "The workflow must remain disabled."
            ),
            check(
                "State Manager v2.0.0 source retained",
                Boolean(current) &&
                    current.sourceStateEngineVersion ===
                        "2.0.0",
                "The workflow must retain State Manager v2.0.0 as its source."
            ),
            check(
                "All components available",
                Boolean(current) &&
                    current.availableComponentCount ===
                        current.componentCount &&
                    current.componentCount ===
                        COMPONENTS.length,
                "Every required workflow component must be available."
            ),
            check(
                "Eleven lifecycle phases retained",
                Boolean(current) &&
                    current.lifecyclePhaseCount === 11,
                "All eleven lifecycle phases must be retained."
            ),
            check(
                "Twelve-stage governance evidence retained",
                Boolean(current) &&
                    current.pipelineStageCount === 12 &&
                    current.completedStageCount === 12,
                "All twelve completed pipeline stages must be retained."
            ),
            check(
                "Final governance decision retained",
                Boolean(current) &&
                    current.finalDecisionRecorded === true &&
                    current.finalDecision ===
                        "Approve Governance Structure",
                "The approved final governance decision must be retained."
            ),
            check(
                "Governance approval verified",
                Boolean(current) &&
                    current.governanceApprovalVerified === true,
                "Governance approval must be verified."
            ),
            check(
                "Lifecycle traceability complete",
                Boolean(current) &&
                    current.lifecycleTraceabilityComplete === true,
                "Lifecycle traceability must remain complete."
            ),
            check(
                "Authoritative state retained",
                Boolean(current) &&
                    current.stateAuthoritative === true,
                "The workflow must retain an authoritative source state."
            ),
            check(
                "State health safe",
                Boolean(current) &&
                    current.stateHealthStatus ===
                        "Safe — Governance Verified / Execution Disabled",
                "The authoritative state health must remain safe."
            ),
            check(
                "Workflow ready",
                Boolean(current) &&
                    current.workflowReady === true,
                "The workflow must be ready."
            ),
            check(
                "Workflow completed",
                Boolean(current) &&
                    current.workflowCompleted === true,
                "The workflow summary must be complete."
            ),
            check(
                "Human approval remains ungranted",
                Boolean(current) &&
                    current.humanApprovalGranted === false,
                "Human approval must remain ungranted."
            ),
            check(
                "Execution approval remains ungranted",
                Boolean(current) &&
                    current.executionApprovalGranted === false,
                "Execution approval must remain ungranted."
            ),
            check(
                "Authorization remains ungranted",
                Boolean(current) &&
                    current.authorizationGranted === false,
                "Authorization must remain ungranted."
            ),
            check(
                "Execution remains unauthorized",
                Boolean(current) &&
                    current.executionAuthorized === false,
                "Execution must remain unauthorized."
            ),
            check(
                "Write remains unauthorized",
                Boolean(current) &&
                    current.writeAuthorized === false,
                "Writing must remain unauthorized."
            ),
            check(
                "Rollback remains unauthorized",
                Boolean(current) &&
                    current.rollbackAuthorized === false,
                "Rollback must remain unauthorized."
            ),
            check(
                "Restore remains unauthorized",
                Boolean(current) &&
                    current.restoreAuthorized === false,
                "Restore must remain unauthorized."
            ),
            check(
                "No actual writes attempted",
                Boolean(current) &&
                    current.actualWritesAttempted === false,
                "No permanent write may be attempted."
            ),
            check(
                "No actual restores attempted",
                Boolean(current) &&
                    current.actualRestoresAttempted === false,
                "No restore may be attempted."
            ),
            check(
                "No permanent writes executed",
                Boolean(current) &&
                    current.permanentWritesExecuted === false,
                "No permanent file may be modified."
            ),
            check(
                "No restore executed",
                Boolean(current) &&
                    current.restoreExecuted === false,
                "No restore may occur."
            )
        ];

        return deepFreeze({
            validatorVersion:
                ENGINE_VERSION,
            accepted:
                checks.every(function (item) {
                    return item.passed;
                }),
            checks: checks
        });
    }

    async function formatWorkflowSummary(summary) {
        const current =
            summary ||
            await generateWorkflowSummary();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION WORKFLOW SUMMARY",
            "Workflow ID: " +
                current.workflowId,
            "Accepted: " +
                (current.accepted
                    ? "YES"
                    : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Source Work Session: " +
                (current.sourceSessionNumber ||
                    "Unavailable"),
            "Engine Version: " +
                current.engineVersion,
            "Workflow Mode: " +
                current.workflowMode,
            "Workflow Status: " +
                current.workflowStatus,
            "Components: " +
                current.componentCount,
            "Available Components: " +
                current.availableComponentCount,
            "Lifecycle Phases: " +
                current.lifecyclePhaseCount,
            "Ready Phases: " +
                current.readyPhaseCount,
            "Pipeline Stages: " +
                current.pipelineStageCount,
            "Completed Stages: " +
                current.completedStageCount,
            "Final Decision Recorded: " +
                (current.finalDecisionRecorded
                    ? "YES"
                    : "NO"),
            "Final Decision: " +
                current.finalDecision,
            "Governance Approval Verified: " +
                (current.governanceApprovalVerified
                    ? "YES"
                    : "NO"),
            "Lifecycle Traceability Complete: " +
                (current.lifecycleTraceabilityComplete
                    ? "YES"
                    : "NO"),
            "State Authoritative: " +
                (current.stateAuthoritative
                    ? "YES"
                    : "NO"),
            "State Health: " +
                current.stateHealthStatus,
            "Workflow Ready: " +
                (current.workflowReady
                    ? "YES"
                    : "NO"),
            "Workflow Completed: " +
                (current.workflowCompleted
                    ? "YES"
                    : "NO"),
            "Human Review Eligible: " +
                (current.humanReviewEligible
                    ? "YES"
                    : "NO"),
            "Human Approval Granted: NO",
            "Execution Approval Granted: NO",
            "Authorization Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.components || [])
            .forEach(function (item) {
                lines.push(
                    item.sequence +
                    " | " +
                    item.component +
                    " | " +
                    (
                        item.available
                            ? "AVAILABLE"
                            : "MISSING"
                    )
                );
            });

        if (current.requiredNextAction) {
            lines.push(
                "Required Next Action: " +
                current.requiredNextAction
            );
        }

        if (current.reviewChoices) {
            lines.push(
                "Review Choices: " +
                current.reviewChoices.join(" | ")
            );
        }

        return lines.join("\n");
    }

    function getLastWorkflowSummary() {
        return lastWorkflowSummary;
    }

    function getComponentInventory() {
        return clone(inventory());
    }

    window.TMSPermanentDocumentationWorkflowManager =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,
            workflowMode:
                WORKFLOW_MODE,
            generateWorkflowSummary:
                generateWorkflowSummary,
            validateWorkflowSummary:
                validateWorkflowSummary,
            formatWorkflowSummary:
                formatWorkflowSummary,
            getLastWorkflowSummary:
                getLastWorkflowSummary,
            getComponentInventory:
                getComponentInventory
        });

    console.log(
        "Permanent Documentation Workflow Manager v" +
        ENGINE_VERSION +
        " initialized in " +
        WORKFLOW_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
