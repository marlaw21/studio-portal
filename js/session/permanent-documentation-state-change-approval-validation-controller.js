/**
 * TMS-OS Permanent Documentation State Change Approval Validation Controller
 * Work Session 073
 * Version 1.0.0
 */
(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const VALIDATION_MODE = "Disabled";
    const REPORT_TYPE = "TMS-OS Permanent Documentation State Change Approval Validation Report";
    let lastValidationReport = null;

    const validationRequirements = Object.freeze([
        "State Change Approval Record exists",
        "State Change Approval Record type is valid",
        "State Change Approval Record engine version is present",
        "State Change Approval Record mode is Disabled",
        "State Change Approval Record is rejected",
        "State Change Approval Record session number is present",
        "State Change Approval Record source authorization is not accepted",
        "State-change approval prerequisites are not satisfied",
        "State-change approval review is not eligible",
        "Approval request is not recorded",
        "Approval record is not created",
        "Approval decision is not recorded",
        "State-change approval is not granted",
        "State change is not authorized",
        "State change is not approved",
        "State change is not executed",
        "Transition execution is not authorized",
        "Transition is not executed",
        "Transition is not applied",
        "Execution is not authorized",
        "Permanent write is not authorized",
        "Rollback is not authorized",
        "Restore is not authorized",
        "No state change attempted",
        "No state change applied",
        "No permanent writes executed",
        "No restore executed"
    ]);

    function getSessionSnapshot() {
        if (global.TMSSessionContext && typeof global.TMSSessionContext.getSnapshot === "function") {
            try {
                return global.TMSSessionContext.getSnapshot() || {};
            } catch (error) {
                console.warn("State Change Approval Validation Controller could not read the active session snapshot.", error);
            }
        }
        return {};
    }

    function getSessionNumber(snapshot) {
        const value = snapshot && snapshot.sessionNumber;
        return value === undefined || value === null || value === "" ? "UNKNOWN" : String(value);
    }

    function createTimestampId(date) {
        const pad = (value) => String(value).padStart(2, "0");
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate()),
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join("");
    }

    function yesNo(value) {
        return value === true ? "YES" : "NO";
    }

    function normalizeApprovalRecord(record) {
        const source = record && typeof record === "object" ? record : {};
        return {
            exists: Boolean(record && typeof record === "object"),
            reportType: source.reportType || "Unavailable",
            engineVersion: source.engineVersion || "Unavailable",
            approvalMode: source.approvalMode || "Unavailable",
            recordId: source.recordId || "Unavailable",
            sessionNumber: source.sessionNumber === undefined || source.sessionNumber === null || source.sessionNumber === "" ? "Unavailable" : String(source.sessionNumber),
            accepted: source.accepted === true,
            stateChangeApprovalStatus: source.stateChangeApprovalStatus || "Unavailable",
            sourceStateChangeAuthorizationAccepted: source.sourceStateChangeAuthorizationAccepted === true,
            stateChangeApprovalPrerequisitesSatisfied: source.stateChangeApprovalPrerequisitesSatisfied === true,
            stateChangeApprovalReviewEligible: source.stateChangeApprovalReviewEligible === true,
            approvalRequestRecorded: source.approvalRequestRecorded === true,
            approvalRecordCreated: source.approvalRecordCreated === true,
            approvalDecisionRecorded: source.approvalDecisionRecorded === true,
            stateChangeApprovalGranted: source.stateChangeApprovalGranted === true,
            stateChangeAuthorized: source.stateChangeAuthorized === true,
            stateChangeApproved: source.stateChangeApproved === true,
            stateChangeExecuted: source.stateChangeExecuted === true,
            transitionExecutionAuthorized: source.transitionExecutionAuthorized === true,
            transitionExecuted: source.transitionExecuted === true,
            transitionApproved: source.transitionApproved === true,
            transitionApplied: source.transitionApplied === true,
            approvalExecuted: source.approvalExecuted === true,
            approvalGranted: source.approvalGranted === true,
            humanApprovalGranted: source.humanApprovalGranted === true,
            authorizationGranted: source.authorizationGranted === true,
            executionAuthorized: source.executionAuthorized === true,
            writeAuthorized: source.writeAuthorized === true,
            rollbackAuthorized: source.rollbackAuthorized === true,
            restoreAuthorized: source.restoreAuthorized === true,
            actualApprovalRecordAttempted: source.actualApprovalRecordAttempted === true,
            actualApprovalRecordCreated: source.actualApprovalRecordCreated === true,
            actualApprovalDecisionAttempted: source.actualApprovalDecisionAttempted === true,
            actualApprovalDecisionRecorded: source.actualApprovalDecisionRecorded === true,
            actualStateChangeApprovalAttempted: source.actualStateChangeApprovalAttempted === true,
            actualStateChangeApprovalGranted: source.actualStateChangeApprovalGranted === true,
            actualStateChangeExecutionAttempted: source.actualStateChangeExecutionAttempted === true,
            actualStateChangeExecutionCompleted: source.actualStateChangeExecutionCompleted === true,
            actualStateChangeAttempted: source.actualStateChangeAttempted === true,
            actualStateChangeApplied: source.actualStateChangeApplied === true,
            actualWritesAttempted: source.actualWritesAttempted === true,
            actualRestoresAttempted: source.actualRestoresAttempted === true,
            permanentWritesExecuted: source.permanentWritesExecuted === true,
            restoreExecuted: source.restoreExecuted === true
        };
    }

    function buildValidationChecks(source) {
        return [
            { name: "Approval record exists", passed: source.exists },
            { name: "Approval record type is valid", passed: source.reportType === "TMS-OS Permanent Documentation State Change Approval Record" },
            { name: "Approval record engine version is present", passed: typeof source.engineVersion === "string" && source.engineVersion !== "Unavailable" },
            { name: "Approval record mode is Disabled", passed: source.approvalMode === "Disabled" },
            { name: "Approval record is rejected", passed: source.accepted === false },
            { name: "Approval record status is Rejected", passed: source.stateChangeApprovalStatus === "Rejected" },
            { name: "Approval record session number is present", passed: source.sessionNumber !== "Unavailable" },
            { name: "Source authorization is not accepted", passed: source.sourceStateChangeAuthorizationAccepted === false },
            { name: "Approval prerequisites are not satisfied", passed: source.stateChangeApprovalPrerequisitesSatisfied === false },
            { name: "Approval review is not eligible", passed: source.stateChangeApprovalReviewEligible === false },
            { name: "Approval request is not recorded", passed: source.approvalRequestRecorded === false },
            { name: "Approval record is not created", passed: source.approvalRecordCreated === false },
            { name: "Approval decision is not recorded", passed: source.approvalDecisionRecorded === false },
            { name: "State-change approval is not granted", passed: source.stateChangeApprovalGranted === false },
            { name: "State change is not authorized", passed: source.stateChangeAuthorized === false },
            { name: "State change is not approved", passed: source.stateChangeApproved === false },
            { name: "State change is not executed", passed: source.stateChangeExecuted === false },
            { name: "Transition execution is not authorized", passed: source.transitionExecutionAuthorized === false },
            { name: "Transition is not executed", passed: source.transitionExecuted === false },
            { name: "Transition is not approved", passed: source.transitionApproved === false },
            { name: "Transition is not applied", passed: source.transitionApplied === false },
            { name: "Approval is not executed", passed: source.approvalExecuted === false },
            { name: "Approval is not granted", passed: source.approvalGranted === false },
            { name: "Human approval is not granted", passed: source.humanApprovalGranted === false },
            { name: "Authorization is not granted", passed: source.authorizationGranted === false },
            { name: "Execution is not authorized", passed: source.executionAuthorized === false },
            { name: "Permanent write is not authorized", passed: source.writeAuthorized === false },
            { name: "Rollback is not authorized", passed: source.rollbackAuthorized === false },
            { name: "Restore is not authorized", passed: source.restoreAuthorized === false },
            { name: "No actual approval record was created", passed: source.actualApprovalRecordAttempted === false && source.actualApprovalRecordCreated === false },
            { name: "No actual approval decision was recorded", passed: source.actualApprovalDecisionAttempted === false && source.actualApprovalDecisionRecorded === false },
            { name: "No actual state-change approval was granted", passed: source.actualStateChangeApprovalAttempted === false && source.actualStateChangeApprovalGranted === false },
            { name: "No actual state-change execution completed", passed: source.actualStateChangeExecutionAttempted === false && source.actualStateChangeExecutionCompleted === false },
            { name: "No actual state change was attempted", passed: source.actualStateChangeAttempted === false && source.actualStateChangeApplied === false },
            { name: "No permanent writes were executed", passed: source.actualWritesAttempted === false && source.permanentWritesExecuted === false },
            { name: "No restore was executed", passed: source.actualRestoresAttempted === false && source.restoreExecuted === false }
        ];
    }

    async function generateStateChangeApprovalValidationReport(approvalRecord) {
        const snapshot = getSessionSnapshot();
        const sessionNumber = getSessionNumber(snapshot);
        const generatedAtDate = new Date();
        const source = normalizeApprovalRecord(approvalRecord);
        const checks = buildValidationChecks(source);
        const integritySatisfied = checks.every((check) => check.passed);

        const report = {
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            validationMode: VALIDATION_MODE,
            reportId: "TMS-STATE-CHANGE-APPROVAL-VALIDATION-" + sessionNumber + "-" + createTimestampId(generatedAtDate),
            generatedAt: generatedAtDate.toISOString(),
            sessionNumber,
            version: snapshot.version || "Unknown",
            milestone: snapshot.milestone || "Unknown",
            module: snapshot.module || "Unknown",
            accepted: false,
            stateChangeApprovalValidationStatus: integritySatisfied ? "Validated - Disabled" : "Rejected",
            sourceApprovalRecordExists: source.exists,
            sourceApprovalRecordId: source.recordId,
            sourceApprovalRecordAccepted: source.accepted,
            sourceApprovalRecordSessionNumber: source.sessionNumber,
            sourceStateChangeAuthorizationAccepted: source.sourceStateChangeAuthorizationAccepted,
            approvalRecordIntegritySatisfied: integritySatisfied,
            approvalValidationPrerequisitesSatisfied: false,
            approvalValidationReviewEligible: false,
            approvalValidationRecorded: false,
            approvalValidationGranted: false,
            approvalRecordApproved: false,
            approvalDecisionRecorded: false,
            stateChangeApprovalGranted: false,
            stateChangeAuthorized: false,
            stateChangeApproved: false,
            stateChangeExecuted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualApprovalValidationAttempted: false,
            actualApprovalValidationRecorded: false,
            actualApprovalDecisionAttempted: false,
            actualApprovalDecisionRecorded: false,
            actualStateChangeAttempted: false,
            actualStateChangeApplied: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            checks,
            requiredNextAction: integritySatisfied
                ? "Review the validated Disabled Mode approval record without recording approval or changing documentation state."
                : "Correct the failed approval-record integrity or validation prerequisite checks."
        };

        lastValidationReport = Object.freeze(report);
        return lastValidationReport;
    }

    function validateStateChangeApprovalValidationReport(report) {
        const candidate = report && typeof report === "object" ? report : {};
        const checks = [
            { name: "Validation report type is correct", passed: candidate.reportType === REPORT_TYPE },
            { name: "Engine version is correct", passed: candidate.engineVersion === ENGINE_VERSION },
            { name: "Validation mode is Disabled", passed: candidate.validationMode === VALIDATION_MODE },
            { name: "Validation report is not accepted", passed: candidate.accepted === false },
            { name: "Approval validation prerequisites are not satisfied", passed: candidate.approvalValidationPrerequisitesSatisfied === false },
            { name: "Approval validation review is not eligible", passed: candidate.approvalValidationReviewEligible === false },
            { name: "Approval validation is not recorded", passed: candidate.approvalValidationRecorded === false },
            { name: "Approval validation is not granted", passed: candidate.approvalValidationGranted === false },
            { name: "Approval record is not approved", passed: candidate.approvalRecordApproved === false },
            { name: "Approval decision is not recorded", passed: candidate.approvalDecisionRecorded === false },
            { name: "State-change approval is not granted", passed: candidate.stateChangeApprovalGranted === false },
            { name: "State change is not authorized", passed: candidate.stateChangeAuthorized === false },
            { name: "State change is not approved", passed: candidate.stateChangeApproved === false },
            { name: "State change is not executed", passed: candidate.stateChangeExecuted === false },
            { name: "Execution is not authorized", passed: candidate.executionAuthorized === false },
            { name: "Permanent write is not authorized", passed: candidate.writeAuthorized === false },
            { name: "Rollback is not authorized", passed: candidate.rollbackAuthorized === false },
            { name: "Restore is not authorized", passed: candidate.restoreAuthorized === false },
            { name: "No approval validation was recorded", passed: candidate.actualApprovalValidationAttempted === false && candidate.actualApprovalValidationRecorded === false },
            { name: "No approval decision was recorded", passed: candidate.actualApprovalDecisionAttempted === false && candidate.actualApprovalDecisionRecorded === false },
            { name: "No state change was attempted", passed: candidate.actualStateChangeAttempted === false && candidate.actualStateChangeApplied === false },
            { name: "No permanent writes were executed", passed: candidate.actualWritesAttempted === false && candidate.permanentWritesExecuted === false },
            { name: "No restore was executed", passed: candidate.actualRestoresAttempted === false && candidate.restoreExecuted === false }
        ];

        return {
            validatorVersion: ENGINE_VERSION,
            accepted: false,
            checks
        };
    }

    async function formatStateChangeApprovalValidationReport(report) {
        const candidate = report && typeof report === "object" ? report : lastValidationReport;
        if (!candidate) {
            return "No Permanent Documentation State Change Approval Validation Report is available.";
        }

        return [
            "TMS-OS PERMANENT DOCUMENTATION STATE CHANGE APPROVAL VALIDATION REPORT",
            "Report ID: " + candidate.reportId,
            "Accepted: " + yesNo(candidate.accepted),
            "Work Session: " + candidate.sessionNumber,
            "Engine Version: " + candidate.engineVersion,
            "Validation Mode: " + candidate.validationMode,
            "State Change Approval Validation Status: " + candidate.stateChangeApprovalValidationStatus,
            "Source Approval Record Exists: " + yesNo(candidate.sourceApprovalRecordExists),
            "Source Approval Record ID: " + candidate.sourceApprovalRecordId,
            "Source Approval Record Accepted: " + yesNo(candidate.sourceApprovalRecordAccepted),
            "Source Approval Record Session: " + candidate.sourceApprovalRecordSessionNumber,
            "Source State Change Authorization Accepted: " + yesNo(candidate.sourceStateChangeAuthorizationAccepted),
            "Approval Record Integrity Satisfied: " + yesNo(candidate.approvalRecordIntegritySatisfied),
            "Approval Validation Prerequisites Satisfied: " + yesNo(candidate.approvalValidationPrerequisitesSatisfied),
            "Approval Validation Review Eligible: " + yesNo(candidate.approvalValidationReviewEligible),
            "Approval Validation Recorded: " + yesNo(candidate.approvalValidationRecorded),
            "Approval Validation Granted: " + yesNo(candidate.approvalValidationGranted),
            "Approval Record Approved: " + yesNo(candidate.approvalRecordApproved),
            "Approval Decision Recorded: " + yesNo(candidate.approvalDecisionRecorded),
            "State Change Approval Granted: " + yesNo(candidate.stateChangeApprovalGranted),
            "State Change Authorized: " + yesNo(candidate.stateChangeAuthorized),
            "State Change Approved: " + yesNo(candidate.stateChangeApproved),
            "State Change Executed: " + yesNo(candidate.stateChangeExecuted),
            "Execution Authorized: " + yesNo(candidate.executionAuthorized),
            "Write Authorized: " + yesNo(candidate.writeAuthorized),
            "Rollback Authorized: " + yesNo(candidate.rollbackAuthorized),
            "Restore Authorized: " + yesNo(candidate.restoreAuthorized),
            "Actual Approval Validation Attempted: " + yesNo(candidate.actualApprovalValidationAttempted),
            "Actual Approval Validation Recorded: " + yesNo(candidate.actualApprovalValidationRecorded),
            "Actual Approval Decision Attempted: " + yesNo(candidate.actualApprovalDecisionAttempted),
            "Actual Approval Decision Recorded: " + yesNo(candidate.actualApprovalDecisionRecorded),
            "Actual State Change Attempted: " + yesNo(candidate.actualStateChangeAttempted),
            "Actual State Change Applied: " + yesNo(candidate.actualStateChangeApplied),
            "Actual Writes Attempted: " + yesNo(candidate.actualWritesAttempted),
            "Actual Restores Attempted: " + yesNo(candidate.actualRestoresAttempted),
            "Permanent Writes Executed: " + yesNo(candidate.permanentWritesExecuted),
            "Restore Executed: " + yesNo(candidate.restoreExecuted),
            "Validation Checks: " + (Array.isArray(candidate.checks) ? candidate.checks.length : 0),
            "Required Next Action: " + candidate.requiredNextAction
        ].join("\n");
    }

    function getLastStateChangeApprovalValidationReport() {
        return lastValidationReport;
    }

    function getStateChangeApprovalValidationRequirements() {
        return [...validationRequirements];
    }

    const api = Object.freeze({
        engineVersion: ENGINE_VERSION,
        validationMode: VALIDATION_MODE,
        generateStateChangeApprovalValidationReport,
        validateStateChangeApprovalValidationReport,
        formatStateChangeApprovalValidationReport,
        getLastStateChangeApprovalValidationReport,
        getStateChangeApprovalValidationRequirements
    });

    global.TMSPermanentDocumentationStateChangeApprovalValidationController = api;

    console.info(
        "Permanent Documentation State Change Approval Validation Controller v" +
            ENGINE_VERSION +
            " initialized in Disabled Mode for Work Session 073."
    );
})(window);
