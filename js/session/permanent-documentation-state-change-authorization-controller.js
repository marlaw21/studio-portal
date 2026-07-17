/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 071 — Permanent Documentation State Change Authorization Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-state-change-authorization-controller.js

Purpose:
Define and validate the authorization boundary for a proposed Permanent
Documentation System state change without granting actual authorization.

Version 1.0.0 remains locked in Disabled Mode. It does not authorize or execute
a state change, execute a transition, grant approval, authorize permanent
writes, authorize rollback or restore, or modify permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const AUTHORIZATION_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation State Change Authorization Report";

    let lastStateChangeAuthorizationReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationStateChangeExecutionController
    ) {
        console.error(
            "Permanent Documentation State Change Authorization Controller could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
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

    function createReportId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "STATE-CHANGE-AUTHORIZATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function normalizeAuthorizationRequest(request) {
        const normalized =
            request && typeof request === "object"
                ? request
                : {};

        return {
            action:
                typeof normalized.action === "string"
                    ? normalized.action
                    : "Authorize Documentation State Change",

            reason:
                typeof normalized.reason === "string"
                    ? normalized.reason
                    : "No reason supplied",

            requestedBy:
                typeof normalized.requestedBy === "string"
                    ? normalized.requestedBy
                    : "Unspecified",

            requestedAt:
                new Date().toISOString()
        };
    }

    async function generateStateChangeAuthorizationReport(
        stateChangeExecutionReport,
        authorizationRequest
    ) {
        const sourceReport =
            stateChangeExecutionReport ||
            await window
                .TMSPermanentDocumentationStateChangeExecutionController
                .generateStateChangeExecutionReport();

        const normalizedRequest =
            normalizeAuthorizationRequest(authorizationRequest);

        const sourceValidation =
            isPlainObject(sourceReport)
                ? window
                    .TMSPermanentDocumentationStateChangeExecutionController
                    .validateStateChangeExecutionReport(sourceReport)
                : {
                    accepted: false,
                    checks: []
                };

        const checks = [];

        checks.push(buildCheck(
            "State change execution report exists",
            isPlainObject(sourceReport),
            "A State Change Execution Controller report is required."
        ));

        checks.push(buildCheck(
            "State change execution report accepted",
            Boolean(sourceReport && sourceReport.accepted),
            "The state-change execution report must be accepted."
        ));

        checks.push(buildCheck(
            "State change execution validation accepted",
            Boolean(sourceValidation.accepted),
            "The state-change execution report must pass validation."
        ));

        checks.push(buildCheck(
            "State change execution mode disabled",
            Boolean(sourceReport) &&
                sourceReport.stateChangeMode === "Disabled",
            "The State Change Execution Controller must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "State change prerequisites satisfied",
            Boolean(sourceReport) &&
                sourceReport.stateChangePrerequisitesSatisfied === true,
            "State-change prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "State change review eligible",
            Boolean(sourceReport) &&
                sourceReport.stateChangeReviewEligible === true,
            "The state-change execution report must be eligible for review."
        ));

        checks.push(buildCheck(
            "State change request remains unrecorded",
            Boolean(sourceReport) &&
                sourceReport.stateChangeRequestRecorded === false,
            "A real state-change request must remain unrecorded."
        ));

        checks.push(buildCheck(
            "State change remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.stateChangeAuthorized === false,
            "State change must remain unauthorized."
        ));

        checks.push(buildCheck(
            "State change remains unexecuted",
            Boolean(sourceReport) &&
                sourceReport.stateChangeExecuted === false,
            "State change must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Transition execution remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.transitionExecutionAuthorized === false,
            "Transition execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Transition remains unexecuted",
            Boolean(sourceReport) &&
                sourceReport.transitionExecuted === false,
            "Transition must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(sourceReport) &&
                sourceReport.transitionApplied === false,
            "Transition must remain unapplied."
        ));

        checks.push(buildCheck(
            "Approval remains unexecuted",
            Boolean(sourceReport) &&
                sourceReport.approvalExecuted === false,
            "Approval must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Approval remains ungranted",
            Boolean(sourceReport) &&
                sourceReport.approvalGranted === false,
            "Approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(sourceReport) &&
                sourceReport.humanApprovalGranted === false,
            "Human approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(sourceReport) &&
                sourceReport.authorizationGranted === false,
            "Authorization must remain ungranted."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.executionAuthorized === false,
            "Execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.writeAuthorized === false,
            "Permanent writes must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.rollbackAuthorized === false,
            "Rollback must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.restoreAuthorized === false,
            "Restore must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No state change execution attempted",
            Boolean(sourceReport) &&
                sourceReport.actualStateChangeExecutionAttempted === false,
            "No actual state-change execution attempt may occur."
        ));

        checks.push(buildCheck(
            "No state change execution completed",
            Boolean(sourceReport) &&
                sourceReport.actualStateChangeExecutionCompleted === false,
            "No actual state-change execution may complete."
        ));

        checks.push(buildCheck(
            "No state change attempted",
            Boolean(sourceReport) &&
                sourceReport.actualStateChangeAttempted === false,
            "No actual state change may be attempted."
        ));

        checks.push(buildCheck(
            "No state change applied",
            Boolean(sourceReport) &&
                sourceReport.actualStateChangeApplied === false,
            "No actual state change may be applied."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(sourceReport) &&
                sourceReport.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(sourceReport) &&
                sourceReport.restoreExecuted === false,
            "No restore operation may occur."
        ));

        const prerequisitesSatisfied =
            checks.every(function (check) {
                return check.passed;
            });

        const sessionSnapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastStateChangeAuthorizationReport =
            deepFreeze({
                reportType:
                    REPORT_TYPE,

                engineVersion:
                    ENGINE_VERSION,

                authorizationMode:
                    AUTHORIZATION_MODE,

                reportId:
                    createReportId(
                        sessionSnapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt:
                    generatedAt,

                sessionNumber:
                    sessionSnapshot.sessionNumber,

                accepted:
                    prerequisitesSatisfied,

                stateChangeAuthorizationStatus:
                    prerequisitesSatisfied
                        ? "Eligible for State Change Authorization Review — Authorization Locked"
                        : "Rejected",

                sourceStateChangeExecutionReportId:
                    sourceReport
                        ? sourceReport.reportId
                        : null,

                sourceStateChangeExecutionAccepted:
                    Boolean(
                        sourceReport &&
                        sourceReport.accepted
                    ),

                sourceStateChangeExecutionStatus:
                    sourceReport
                        ? sourceReport.stateChangeExecutionStatus
                        : "Unavailable",

                sourceTransitionRequest:
                    sourceReport
                        ? sourceReport.sourceTransitionRequest
                        : null,

                sourceStateChangeRequest:
                    sourceReport
                        ? sourceReport.stateChangeRequest
                        : null,

                authorizationRequest:
                    normalizedRequest,

                prerequisiteChecks:
                    checks,

                stateChangeAuthorizationPrerequisitesSatisfied:
                    prerequisitesSatisfied,

                stateChangeAuthorizationReviewEligible:
                    prerequisitesSatisfied,

                authorizationRequestRecorded:
                    false,

                stateChangeAuthorizationGranted:
                    false,

                stateChangeAuthorized:
                    false,

                stateChangeExecuted:
                    false,

                transitionExecutionAuthorized:
                    false,

                transitionExecuted:
                    false,

                transitionApproved:
                    false,

                transitionApplied:
                    false,

                approvalExecuted:
                    false,

                approvalGranted:
                    false,

                humanApprovalGranted:
                    false,

                authorizationGranted:
                    false,

                executionAuthorized:
                    false,

                writeAuthorized:
                    false,

                rollbackAuthorized:
                    false,

                restoreAuthorized:
                    false,

                actualStateChangeAuthorizationAttempted:
                    false,

                actualStateChangeAuthorizationGranted:
                    false,

                actualStateChangeExecutionAttempted:
                    false,

                actualStateChangeExecutionCompleted:
                    false,

                actualStateChangeAttempted:
                    false,

                actualStateChangeApplied:
                    false,

                actualWritesAttempted:
                    false,

                actualRestoresAttempted:
                    false,

                permanentWritesExecuted:
                    false,

                restoreExecuted:
                    false,

                requiredNextAction:
                    prerequisitesSatisfied
                        ? "Human review is required. Version 1.0.0 cannot grant state-change authorization."
                        : "Correct the failed state-change execution report or authorization prerequisite checks.",

                reviewRequired:
                    true,

                reviewChoices:
                    prerequisitesSatisfied
                        ? [
                            "Approve State Change Authorization Controller Structure",
                            "Revise State Change Authorization Prerequisites",
                            "Cancel State Change Authorization Review"
                        ]
                        : []
            });

        return lastStateChangeAuthorizationReport;
    }

    function validateStateChangeAuthorizationReport(report) {
        const current =
            report || lastStateChangeAuthorizationReport;

        const checks = [];

        checks.push(buildCheck(
            "State change authorization report exists",
            isPlainObject(current),
            "A State Change Authorization Report is required."
        ));

        checks.push(buildCheck(
            "State change authorization report accepted",
            Boolean(current && current.accepted),
            "The state-change authorization report must be accepted."
        ));

        checks.push(buildCheck(
            "Authorization mode disabled",
            Boolean(current) &&
                current.authorizationMode === AUTHORIZATION_MODE,
            "Version 1.0.0 must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Authorization prerequisites satisfied",
            Boolean(current) &&
                current.stateChangeAuthorizationPrerequisitesSatisfied === true,
            "All state-change authorization prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Authorization review eligible",
            Boolean(current) &&
                current.stateChangeAuthorizationReviewEligible === true,
            "The report must be eligible for human review."
        ));

        checks.push(buildCheck(
            "Authorization request remains unrecorded",
            Boolean(current) &&
                current.authorizationRequestRecorded === false,
            "Version 1.0.0 must not record a real authorization request."
        ));

        checks.push(buildCheck(
            "State change authorization remains ungranted",
            Boolean(current) &&
                current.stateChangeAuthorizationGranted === false,
            "State-change authorization must remain ungranted."
        ));

        checks.push(buildCheck(
            "State change remains unauthorized",
            Boolean(current) &&
                current.stateChangeAuthorized === false,
            "State change must remain unauthorized."
        ));

        checks.push(buildCheck(
            "State change remains unexecuted",
            Boolean(current) &&
                current.stateChangeExecuted === false,
            "State change must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Transition execution remains unauthorized",
            Boolean(current) &&
                current.transitionExecutionAuthorized === false,
            "Transition execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Transition remains unexecuted",
            Boolean(current) &&
                current.transitionExecuted === false,
            "Transition must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(current) &&
                current.transitionApplied === false,
            "Transition must remain unapplied."
        ));

        checks.push(buildCheck(
            "Approval remains unexecuted",
            Boolean(current) &&
                current.approvalExecuted === false,
            "Approval must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Approval remains ungranted",
            Boolean(current) &&
                current.approvalGranted === false,
            "Approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(current) &&
                current.humanApprovalGranted === false,
            "Human approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(current) &&
                current.authorizationGranted === false,
            "Authorization must remain ungranted."
        ));

        checks.push(buildCheck(
            "No state change authorization attempted",
            Boolean(current) &&
                current.actualStateChangeAuthorizationAttempted === false,
            "No actual state-change authorization attempt may occur."
        ));

        checks.push(buildCheck(
            "No state change authorization granted",
            Boolean(current) &&
                current.actualStateChangeAuthorizationGranted === false,
            "No actual state-change authorization may be granted."
        ));

        checks.push(buildCheck(
            "No state change execution attempted",
            Boolean(current) &&
                current.actualStateChangeExecutionAttempted === false,
            "No actual state-change execution attempt may occur."
        ));

        checks.push(buildCheck(
            "No state change execution completed",
            Boolean(current) &&
                current.actualStateChangeExecutionCompleted === false,
            "No actual state-change execution may complete."
        ));

        checks.push(buildCheck(
            "No state change attempted",
            Boolean(current) &&
                current.actualStateChangeAttempted === false,
            "No actual state change may be attempted."
        ));

        checks.push(buildCheck(
            "No state change applied",
            Boolean(current) &&
                current.actualStateChangeApplied === false,
            "No actual state change may be applied."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(current) &&
                current.executionAuthorized === false,
            "Execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized === false,
            "Permanent writes must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "Rollback must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(current) &&
                current.restoreAuthorized === false,
            "Restore must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted === false,
            "No restore operation may occur."
        ));

        return deepFreeze({
            validatorVersion:
                ENGINE_VERSION,

            accepted:
                checks.every(function (check) {
                    return check.passed;
                }),

            checks:
                checks
        });
    }

    async function formatStateChangeAuthorizationReport(report) {
        const current =
            report ||
            await generateStateChangeAuthorizationReport();

        const transitionRequest =
            current.sourceTransitionRequest || {};

        const stateChangeRequest =
            current.sourceStateChangeRequest || {};

        const authorizationRequest =
            current.authorizationRequest || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION STATE CHANGE AUTHORIZATION REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Authorization Mode: " +
                current.authorizationMode,
            "State Change Authorization Status: " +
                current.stateChangeAuthorizationStatus,
            "Current State: " +
                (transitionRequest.currentState || "Unavailable"),
            "Requested State: " +
                (transitionRequest.requestedState || "Unavailable"),
            "Prior State Change Action: " +
                (stateChangeRequest.action || "Unavailable"),
            "Requested Authorization Action: " +
                (authorizationRequest.action || "Unavailable"),
            "Source State Change Execution Accepted: " +
                (current.sourceStateChangeExecutionAccepted ? "YES" : "NO"),
            "Authorization Prerequisites Satisfied: " +
                (current.stateChangeAuthorizationPrerequisitesSatisfied ? "YES" : "NO"),
            "Authorization Review Eligible: " +
                (current.stateChangeAuthorizationReviewEligible ? "YES" : "NO"),
            "Authorization Request Recorded: NO",
            "State Change Authorization Granted: NO",
            "State Change Authorized: NO",
            "State Change Executed: NO",
            "Transition Execution Authorized: NO",
            "Transition Executed: NO",
            "Transition Approved: NO",
            "Transition Applied: NO",
            "Approval Executed: NO",
            "Approval Granted: NO",
            "Human Approval Granted: NO",
            "Authorization Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual State Change Authorization Attempted: NO",
            "Actual State Change Authorization Granted: NO",
            "Actual State Change Execution Attempted: NO",
            "Actual State Change Execution Completed: NO",
            "Actual State Change Attempted: NO",
            "Actual State Change Applied: NO",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO",
            "Required Next Action: " +
                current.requiredNextAction
        ];

        if (
            current.reviewChoices &&
            current.reviewChoices.length
        ) {
            lines.push(
                "Review Choices: " +
                current.reviewChoices.join(" | ")
            );
        }

        return lines.join("\n");
    }

    function getLastStateChangeAuthorizationReport() {
        return lastStateChangeAuthorizationReport;
    }

    function getStateChangeAuthorizationRequirements() {
        return [
            "Accepted State Change Execution Controller report",
            "Accepted State Change Execution Controller validation",
            "State-change prerequisites satisfied",
            "State-change review eligible",
            "State-change request not recorded",
            "State change not authorized",
            "State change not executed",
            "Transition execution not authorized",
            "Transition not executed",
            "Transition not applied",
            "Approval not executed",
            "Approval not granted",
            "Human approval not granted",
            "Authorization not granted",
            "Execution not authorized",
            "Permanent write not authorized",
            "Rollback not authorized",
            "Restore not authorized",
            "No state change attempted",
            "No state change applied",
            "No permanent writes executed",
            "No restore executed"
        ];
    }

    window.TMSPermanentDocumentationStateChangeAuthorizationController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            authorizationMode:
                AUTHORIZATION_MODE,

            generateStateChangeAuthorizationReport:
                generateStateChangeAuthorizationReport,

            validateStateChangeAuthorizationReport:
                validateStateChangeAuthorizationReport,

            formatStateChangeAuthorizationReport:
                formatStateChangeAuthorizationReport,

            getLastStateChangeAuthorizationReport:
                getLastStateChangeAuthorizationReport,

            getStateChangeAuthorizationRequirements:
                getStateChangeAuthorizationRequirements
        });

    console.log(
        "Permanent Documentation State Change Authorization Controller v" +
        ENGINE_VERSION +
        " initialized in " +
        AUTHORIZATION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
