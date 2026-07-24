/**
 * TMS-OS Permanent Documentation State Change Approval Recorder
 * Work Session 087 | Version 1.0.2 | Disabled Mode
 */
(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.2";
    const APPROVAL_MODE = "Disabled";
    const RECORD_TYPE = "TMS-OS Permanent Documentation State Change Approval Record";
    let lastApprovalRecord = null;

    const requirements = Object.freeze([
        "Accepted State Change Authorization Controller report",
        "Accepted State Change Authorization Controller validation",
        "State-change authorization prerequisites satisfied",
        "State-change authorization review eligible",
        "Authorization request not recorded",
        "State-change authorization not granted",
        "State change not authorized",
        "State change not executed",
        "Transition execution not authorized",
        "Transition not executed",
        "Transition not applied",
        "Approval not recorded",
        "Approval not executed",
        "Approval not granted",
        "Human approval not granted",
        "Execution not authorized",
        "Permanent write not authorized",
        "Rollback not authorized",
        "Restore not authorized",
        "No state change attempted",
        "No state change applied",
        "No permanent writes executed",
        "No restore executed"
    ]);

    function getSnapshot() {
        try {
            return global.TMSSessionContext &&
                typeof global.TMSSessionContext.getSnapshot === "function"
                ? global.TMSSessionContext.getSnapshot() || {}
                : {};
        } catch (error) {
            console.warn("Approval Recorder could not read session context.", error);
            return {};
        }
    }

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function timestampId(date) {
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join("");
    }

    function normalizeRequest(request) {
        const source = request && typeof request === "object" ? request : {};
        return {
            action: source.action || "Record Documentation State Change Approval",
            reason: source.reason || "No approval-record reason supplied.",
            requestedBy: source.requestedBy || "Unknown requester",
            approver: source.approver || "Not assigned",
            decision: source.decision || "Pending"
        };
    }

    async function generateStateChangeApprovalRecord(sourceReport, approvalRequest) {
        const snapshot = getSnapshot();
        const source = sourceReport && typeof sourceReport === "object" ? sourceReport : {};
        const request = normalizeRequest(approvalRequest);
        const now = new Date();
        const sessionNumber = String(snapshot.sessionNumber || "UNKNOWN");

        const authorizationController =
            global.TMSPermanentDocumentationStateChangeAuthorizationController;

        const sourceValidation =
            authorizationController &&
            typeof authorizationController.validateStateChangeAuthorizationReport === "function"
                ? authorizationController.validateStateChangeAuthorizationReport(source)
                : {
                    validatorVersion: "Unavailable",
                    accepted: false,
                    checks: []
                };

        const sourceAccepted =
            source.accepted === true &&
            sourceValidation.accepted === true;

        const transitionRequest =
            source.sourceTransitionRequest &&
            typeof source.sourceTransitionRequest === "object"
                ? source.sourceTransitionRequest
                : {};

        const currentState =
            transitionRequest.currentState ||
            source.currentState ||
            "Session Start";

        const requestedState =
            transitionRequest.requestedState ||
            source.requestedState ||
            "Unavailable";

        const stateIdentitySatisfied =
            typeof currentState === "string" &&
            currentState.trim().length > 0 &&
            currentState !== "Unavailable" &&
            typeof requestedState === "string" &&
            requestedState.trim().length > 0 &&
            requestedState !== "Unavailable";

        const prerequisitesSatisfied =
            sourceAccepted &&
            source.authorizationMode === "Disabled" &&
            source.stateChangeAuthorizationPrerequisitesSatisfied === true &&
            source.stateChangeAuthorizationReviewEligible === true &&
            stateIdentitySatisfied &&
            source.authorizationRequestRecorded === false &&
            source.stateChangeAuthorizationGranted === false &&
            source.stateChangeAuthorized === false &&
            source.stateChangeExecuted === false &&
            source.transitionExecutionAuthorized === false &&
            source.transitionExecuted === false &&
            source.transitionApplied === false &&
            source.approvalExecuted === false &&
            source.approvalGranted === false &&
            source.humanApprovalGranted === false &&
            source.executionAuthorized === false &&
            source.writeAuthorized === false &&
            source.rollbackAuthorized === false &&
            source.restoreAuthorized === false &&
            source.actualStateChangeAuthorizationAttempted === false &&
            source.actualStateChangeAuthorizationGranted === false &&
            source.actualStateChangeExecutionAttempted === false &&
            source.actualStateChangeExecutionCompleted === false &&
            source.actualStateChangeAttempted === false &&
            source.actualStateChangeApplied === false &&
            source.actualWritesAttempted === false &&
            source.actualRestoresAttempted === false &&
            source.permanentWritesExecuted === false &&
            source.restoreExecuted === false;

        const record = {
            reportType: RECORD_TYPE,
            engineVersion: ENGINE_VERSION,
            approvalMode: APPROVAL_MODE,
            recordId: `TMS-STATE-CHANGE-APPROVAL-${sessionNumber}-${timestampId(now)}`,
            generatedAt: now.toISOString(),
            sessionNumber,
            version: snapshot.version || "Unknown",
            milestone: snapshot.milestone || "Unknown",
            module: snapshot.module || "Unknown",
            accepted: prerequisitesSatisfied,
            stateChangeApprovalStatus:
                prerequisitesSatisfied
                    ? "Eligible for State Change Approval Review — Approval Locked"
                    : "Rejected",
            currentState,
            requestedState,
            stateIdentitySatisfied,
            priorStateChangeAction:
                (source.authorizationRequest && source.authorizationRequest.action) ||
                source.requestedAuthorizationAction ||
                "Authorize Documentation State Change",
            sourceAuthorizationReportId: source.reportId || "Unavailable",
            sourceStateChangeAuthorizationAccepted: sourceAccepted,
            sourceStateChangeAuthorizationValidationAccepted:
                sourceValidation.accepted === true,
            sourceStateChangeAuthorizationValidatorVersion:
                sourceValidation.validatorVersion || "Unavailable",
            stateChangeApprovalPrerequisitesSatisfied: prerequisitesSatisfied,
            stateChangeApprovalReviewEligible: prerequisitesSatisfied,
            approvalRequest: request,
            requestedApprovalAction: request.action,
            approvalRequestRecorded: false,
            approvalRecordCreated: false,
            approvalDecisionRecorded: false,
            stateChangeApprovalGranted: false,
            stateChangeAuthorized: false,
            stateChangeApproved: false,
            stateChangeExecuted: false,
            transitionExecutionAuthorized: false,
            transitionExecuted: false,
            transitionApproved: false,
            transitionApplied: false,
            approvalExecuted: false,
            approvalGranted: false,
            humanApprovalGranted: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualApprovalRecordAttempted: false,
            actualApprovalRecordCreated: false,
            actualApprovalDecisionAttempted: false,
            actualApprovalDecisionRecorded: false,
            actualStateChangeApprovalAttempted: false,
            actualStateChangeApprovalGranted: false,
            actualStateChangeExecutionAttempted: false,
            actualStateChangeExecutionCompleted: false,
            actualStateChangeAttempted: false,
            actualStateChangeApplied: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            requiredNextAction:
                prerequisitesSatisfied
                    ? "Human review is required. Version 1.0.1 cannot record or grant a state-change approval decision."
                    : "Correct the failed state-change authorization report or approval prerequisite checks."
        };

        lastApprovalRecord = Object.freeze(record);
        return lastApprovalRecord;
    }

    function validateStateChangeApprovalRecord(record) {
        const value = record && typeof record === "object" ? record : {};
        const checks = [
            ["Record type is correct", value.reportType === RECORD_TYPE],
            ["Engine version is correct", value.engineVersion === ENGINE_VERSION],
            ["Approval mode is Disabled", value.approvalMode === APPROVAL_MODE],
            ["Record is accepted", value.accepted === true],
            [
                "Current state is present and valid",
                typeof value.currentState === "string" &&
                value.currentState.trim().length > 0 &&
                value.currentState !== "Unavailable"
            ],
            [
                "Requested state is present and valid",
                typeof value.requestedState === "string" &&
                value.requestedState.trim().length > 0 &&
                value.requestedState !== "Unavailable"
            ],
            [
                "State identity is satisfied",
                value.stateIdentitySatisfied === true
            ],
            [
                "Approval status is review-eligible and locked",
                value.stateChangeApprovalStatus ===
                    "Eligible for State Change Approval Review — Approval Locked"
            ],
            [
                "Source authorization is accepted",
                value.sourceStateChangeAuthorizationAccepted === true
            ],
            [
                "Source authorization validation is accepted",
                value.sourceStateChangeAuthorizationValidationAccepted === true
            ],
            [
                "Approval prerequisites are satisfied",
                value.stateChangeApprovalPrerequisitesSatisfied === true
            ],
            [
                "Approval review is eligible",
                value.stateChangeApprovalReviewEligible === true
            ],
            ["Approval request is not recorded", value.approvalRequestRecorded === false],
            ["Approval record is not created", value.approvalRecordCreated === false],
            ["Approval decision is not recorded", value.approvalDecisionRecorded === false],
            ["State-change approval is not granted", value.stateChangeApprovalGranted === false],
            ["State change is not authorized", value.stateChangeAuthorized === false],
            ["State change is not approved", value.stateChangeApproved === false],
            ["State change is not executed", value.stateChangeExecuted === false],
            ["Transition execution is not authorized", value.transitionExecutionAuthorized === false],
            ["Transition is not executed", value.transitionExecuted === false],
            ["Transition is not approved", value.transitionApproved === false],
            ["Transition is not applied", value.transitionApplied === false],
            ["Approval is not executed", value.approvalExecuted === false],
            ["Approval is not granted", value.approvalGranted === false],
            ["Human approval is not granted", value.humanApprovalGranted === false],
            ["Authorization is not granted", value.authorizationGranted === false],
            ["Execution is not authorized", value.executionAuthorized === false],
            ["Permanent write is not authorized", value.writeAuthorized === false],
            ["Rollback is not authorized", value.rollbackAuthorized === false],
            ["Restore is not authorized", value.restoreAuthorized === false],
            [
                "No actual approval record was created",
                value.actualApprovalRecordAttempted === false &&
                value.actualApprovalRecordCreated === false
            ],
            [
                "No actual approval decision was recorded",
                value.actualApprovalDecisionAttempted === false &&
                value.actualApprovalDecisionRecorded === false
            ],
            [
                "No actual state-change approval was granted",
                value.actualStateChangeApprovalAttempted === false &&
                value.actualStateChangeApprovalGranted === false
            ],
            [
                "No actual state-change execution occurred",
                value.actualStateChangeExecutionAttempted === false &&
                value.actualStateChangeExecutionCompleted === false
            ],
            [
                "No actual state change was applied",
                value.actualStateChangeAttempted === false &&
                value.actualStateChangeApplied === false
            ],
            [
                "No permanent writes were executed",
                value.actualWritesAttempted === false &&
                value.permanentWritesExecuted === false
            ],
            [
                "No restore was executed",
                value.actualRestoresAttempted === false &&
                value.restoreExecuted === false
            ]
        ].map(([name, passed]) => ({ name, passed }));

        return {
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every((check) => check.passed) && value.accepted === true,
            checks
        };
    }

    function yesNo(value) {
        return value === true ? "YES" : "NO";
    }

    async function formatStateChangeApprovalRecord(record) {
        const value = record || lastApprovalRecord;
        if (!value) {
            return "No Permanent Documentation State Change Approval Record is available.";
        }
        const request = value.approvalRequest || {};
        return [
            "TMS-OS PERMANENT DOCUMENTATION STATE CHANGE APPROVAL RECORD",
            `Record ID: ${value.recordId}`,
            `Accepted: ${yesNo(value.accepted)}`,
            `Work Session: ${value.sessionNumber}`,
            `Engine Version: ${value.engineVersion}`,
            `Approval Mode: ${value.approvalMode}`,
            `State Change Approval Status: ${value.stateChangeApprovalStatus}`,
            `Current State: ${value.currentState}`,
            `Requested State: ${value.requestedState}`,
            `State Identity Satisfied: ${yesNo(value.stateIdentitySatisfied)}`,
            `Prior State Change Action: ${value.priorStateChangeAction}`,
            `Requested Approval Action: ${value.requestedApprovalAction}`,
            `Requested By: ${request.requestedBy}`,
            `Approver: ${request.approver}`,
            `Requested Decision: ${request.decision}`,
            `Source State Change Authorization Accepted: ${yesNo(value.sourceStateChangeAuthorizationAccepted)}`,
            `Source State Change Authorization Validation Accepted: ${yesNo(value.sourceStateChangeAuthorizationValidationAccepted)}`,
            `Approval Prerequisites Satisfied: ${yesNo(value.stateChangeApprovalPrerequisitesSatisfied)}`,
            `Approval Review Eligible: ${yesNo(value.stateChangeApprovalReviewEligible)}`,
            `Approval Request Recorded: ${yesNo(value.approvalRequestRecorded)}`,
            `Approval Record Created: ${yesNo(value.approvalRecordCreated)}`,
            `Approval Decision Recorded: ${yesNo(value.approvalDecisionRecorded)}`,
            `State Change Approval Granted: ${yesNo(value.stateChangeApprovalGranted)}`,
            `State Change Authorized: ${yesNo(value.stateChangeAuthorized)}`,
            `State Change Approved: ${yesNo(value.stateChangeApproved)}`,
            `State Change Executed: ${yesNo(value.stateChangeExecuted)}`,
            `Transition Execution Authorized: ${yesNo(value.transitionExecutionAuthorized)}`,
            `Transition Executed: ${yesNo(value.transitionExecuted)}`,
            `Transition Approved: ${yesNo(value.transitionApproved)}`,
            `Transition Applied: ${yesNo(value.transitionApplied)}`,
            `Approval Executed: ${yesNo(value.approvalExecuted)}`,
            `Approval Granted: ${yesNo(value.approvalGranted)}`,
            `Human Approval Granted: ${yesNo(value.humanApprovalGranted)}`,
            `Authorization Granted: ${yesNo(value.authorizationGranted)}`,
            `Execution Authorized: ${yesNo(value.executionAuthorized)}`,
            `Write Authorized: ${yesNo(value.writeAuthorized)}`,
            `Rollback Authorized: ${yesNo(value.rollbackAuthorized)}`,
            `Restore Authorized: ${yesNo(value.restoreAuthorized)}`,
            `Actual Approval Record Attempted: ${yesNo(value.actualApprovalRecordAttempted)}`,
            `Actual Approval Record Created: ${yesNo(value.actualApprovalRecordCreated)}`,
            `Actual Approval Decision Attempted: ${yesNo(value.actualApprovalDecisionAttempted)}`,
            `Actual Approval Decision Recorded: ${yesNo(value.actualApprovalDecisionRecorded)}`,
            `Actual State Change Approval Attempted: ${yesNo(value.actualStateChangeApprovalAttempted)}`,
            `Actual State Change Approval Granted: ${yesNo(value.actualStateChangeApprovalGranted)}`,
            `Actual State Change Execution Attempted: ${yesNo(value.actualStateChangeExecutionAttempted)}`,
            `Actual State Change Execution Completed: ${yesNo(value.actualStateChangeExecutionCompleted)}`,
            `Actual State Change Attempted: ${yesNo(value.actualStateChangeAttempted)}`,
            `Actual State Change Applied: ${yesNo(value.actualStateChangeApplied)}`,
            `Actual Writes Attempted: ${yesNo(value.actualWritesAttempted)}`,
            `Actual Restores Attempted: ${yesNo(value.actualRestoresAttempted)}`,
            `Permanent Writes Executed: ${yesNo(value.permanentWritesExecuted)}`,
            `Restore Executed: ${yesNo(value.restoreExecuted)}`,
            `Required Next Action: ${value.requiredNextAction}`
        ].join("\n");
    }

    function getLastStateChangeApprovalRecord() {
        return lastApprovalRecord;
    }

    function getStateChangeApprovalRequirements() {
        return [...requirements];
    }

    global.TMSPermanentDocumentationStateChangeApprovalRecorder = Object.freeze({
        engineVersion: ENGINE_VERSION,
        approvalMode: APPROVAL_MODE,
        generateStateChangeApprovalRecord,
        validateStateChangeApprovalRecord,
        formatStateChangeApprovalRecord,
        getLastStateChangeApprovalRecord,
        getStateChangeApprovalRequirements
    });

    console.info(
        "Permanent Documentation State Change Approval Recorder v1.0.2 initialized in Disabled Mode for Work Session 087."
    );
})(window);
