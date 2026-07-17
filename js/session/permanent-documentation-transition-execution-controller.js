/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 069 — Permanent Documentation Transition Execution Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-transition-execution-controller.js

Purpose:
Define and validate the final controlled transition-execution boundary without
applying a state transition.

Version 1.0.0 remains locked in Disabled Mode. It does not execute a transition,
change system state, grant approval or authorization, authorize permanent
writes, authorize rollback or restore, or modify permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const EXECUTION_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Transition Execution Report";

    let lastTransitionExecutionReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationTransitionApprovalExecutionController
    ) {
        console.error(
            "Permanent Documentation Transition Execution Controller could not initialize because its dependencies are unavailable."
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
            "TRANSITION-EXECUTION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function normalizeTransitionExecutionRequest(request) {
        const normalized =
            request &&
            typeof request === "object"
                ? request
                : {};

        return {
            action:
                typeof normalized.action === "string"
                    ? normalized.action
                    : "Apply Approved Transition",

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

    async function generateTransitionExecutionReport(
        approvalExecutionReport,
        transitionExecutionRequest
    ) {
        const sourceReport =
            approvalExecutionReport ||
            await window
                .TMSPermanentDocumentationTransitionApprovalExecutionController
                .generateExecutionBoundaryReport();

        const normalizedRequest =
            normalizeTransitionExecutionRequest(
                transitionExecutionRequest
            );

        const sourceValidation =
            isPlainObject(sourceReport)
                ? window
                    .TMSPermanentDocumentationTransitionApprovalExecutionController
                    .validateExecutionBoundaryReport(sourceReport)
                : {
                    accepted: false,
                    checks: []
                };

        const checks = [];

        checks.push(buildCheck(
            "Approval execution report exists",
            isPlainObject(sourceReport),
            "A Transition Approval Execution Controller report is required."
        ));

        checks.push(buildCheck(
            "Approval execution report accepted",
            Boolean(sourceReport && sourceReport.accepted),
            "The approval execution report must be accepted."
        ));

        checks.push(buildCheck(
            "Approval execution report validation accepted",
            Boolean(sourceValidation.accepted),
            "The approval execution report must pass validation."
        ));

        checks.push(buildCheck(
            "Approval execution mode disabled",
            Boolean(sourceReport) &&
                sourceReport.executionMode === "Disabled",
            "The Transition Approval Execution Controller must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Execution prerequisites satisfied",
            Boolean(sourceReport) &&
                sourceReport.executionPrerequisitesSatisfied === true,
            "Execution-boundary prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Execution boundary review eligible",
            Boolean(sourceReport) &&
                sourceReport.executionBoundaryReviewEligible === true,
            "The source report must be eligible for review."
        ));

        checks.push(buildCheck(
            "Execution request remains unrecorded",
            Boolean(sourceReport) &&
                sourceReport.executionRequestRecorded === false,
            "A real execution request must remain unrecorded."
        ));

        checks.push(buildCheck(
            "Approval execution remains unauthorized",
            Boolean(sourceReport) &&
                sourceReport.approvalExecutionAuthorized === false,
            "Approval execution must remain unauthorized."
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
            "Transition remains unapproved",
            Boolean(sourceReport) &&
                sourceReport.transitionApproved === false,
            "The transition must remain unapproved."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(sourceReport) &&
                sourceReport.transitionApplied === false,
            "The transition must remain unapplied."
        ));

        checks.push(buildCheck(
            "No approval execution attempted",
            Boolean(sourceReport) &&
                sourceReport.actualApprovalExecutionAttempted === false,
            "No actual approval execution attempt may occur."
        ));

        checks.push(buildCheck(
            "No approval execution completed",
            Boolean(sourceReport) &&
                sourceReport.actualApprovalExecutionCompleted === false,
            "No actual approval execution may complete."
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

        lastTransitionExecutionReport =
            deepFreeze({
                reportType:
                    REPORT_TYPE,

                engineVersion:
                    ENGINE_VERSION,

                executionMode:
                    EXECUTION_MODE,

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

                transitionExecutionStatus:
                    prerequisitesSatisfied
                        ? "Eligible for Transition Execution Review — Execution Locked"
                        : "Rejected",

                sourceApprovalExecutionReportId:
                    sourceReport
                        ? sourceReport.reportId
                        : null,

                sourceApprovalExecutionAccepted:
                    Boolean(
                        sourceReport &&
                        sourceReport.accepted
                    ),

                sourceApprovalExecutionStatus:
                    sourceReport
                        ? sourceReport.executionBoundaryStatus
                        : "Unavailable",

                sourceTransitionRequest:
                    sourceReport
                        ? sourceReport.sourceTransitionRequest
                        : null,

                sourceApprovalDecision:
                    sourceReport
                        ? sourceReport.sourceApprovalDecision
                        : null,

                sourceExecutionRequest:
                    sourceReport
                        ? sourceReport.executionRequest
                        : null,

                transitionExecutionRequest:
                    normalizedRequest,

                prerequisiteChecks:
                    checks,

                transitionExecutionPrerequisitesSatisfied:
                    prerequisitesSatisfied,

                transitionExecutionReviewEligible:
                    prerequisitesSatisfied,

                transitionExecutionRequestRecorded:
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

                actualTransitionExecutionAttempted:
                    false,

                actualTransitionExecutionCompleted:
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
                        ? "Human review is required. Version 1.0.0 cannot authorize or execute a state transition."
                        : "Correct the failed approval-execution report or transition-execution prerequisite checks.",

                reviewRequired:
                    true,

                reviewChoices:
                    prerequisitesSatisfied
                        ? [
                            "Approve Transition Execution Controller Structure",
                            "Revise Transition Execution Prerequisites",
                            "Cancel Transition Execution Review"
                        ]
                        : []
            });

        return lastTransitionExecutionReport;
    }

    function validateTransitionExecutionReport(report) {
        const current =
            report || lastTransitionExecutionReport;

        const checks = [];

        checks.push(buildCheck(
            "Transition execution report exists",
            isPlainObject(current),
            "A Transition Execution Report is required."
        ));

        checks.push(buildCheck(
            "Transition execution report accepted",
            Boolean(current && current.accepted),
            "The transition execution report must be accepted."
        ));

        checks.push(buildCheck(
            "Execution mode disabled",
            Boolean(current) &&
                current.executionMode === EXECUTION_MODE,
            "Version 1.0.0 must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Transition execution prerequisites satisfied",
            Boolean(current) &&
                current.transitionExecutionPrerequisitesSatisfied === true,
            "All transition-execution prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Transition execution review eligible",
            Boolean(current) &&
                current.transitionExecutionReviewEligible === true,
            "The report must be eligible for human review."
        ));

        checks.push(buildCheck(
            "Transition execution request remains unrecorded",
            Boolean(current) &&
                current.transitionExecutionRequestRecorded === false,
            "Version 1.0.0 must not record a real transition-execution request."
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
            "The transition must remain unexecuted."
        ));

        checks.push(buildCheck(
            "Transition remains unapproved",
            Boolean(current) &&
                current.transitionApproved === false,
            "No transition may be approved."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(current) &&
                current.transitionApplied === false,
            "No transition may be applied."
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
            "No transition execution attempted",
            Boolean(current) &&
                current.actualTransitionExecutionAttempted === false,
            "No actual transition execution attempt may occur."
        ));

        checks.push(buildCheck(
            "No transition execution completed",
            Boolean(current) &&
                current.actualTransitionExecutionCompleted === false,
            "No actual transition execution may complete."
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

    async function formatTransitionExecutionReport(report) {
        const current =
            report ||
            await generateTransitionExecutionReport();

        const transitionRequest =
            current.sourceTransitionRequest || {};

        const approvalDecision =
            current.sourceApprovalDecision || {};

        const sourceExecutionRequest =
            current.sourceExecutionRequest || {};

        const transitionExecutionRequest =
            current.transitionExecutionRequest || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION TRANSITION EXECUTION REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Execution Mode: " +
                current.executionMode,
            "Transition Execution Status: " +
                current.transitionExecutionStatus,
            "Current State: " +
                (transitionRequest.currentState || "Unavailable"),
            "Requested State: " +
                (transitionRequest.requestedState || "Unavailable"),
            "Requested Approval Decision: " +
                (approvalDecision.decision || "Not Recorded"),
            "Prior Execution Action: " +
                (sourceExecutionRequest.action || "Unavailable"),
            "Requested Transition Execution Action: " +
                (transitionExecutionRequest.action || "Unavailable"),
            "Source Approval Execution Accepted: " +
                (current.sourceApprovalExecutionAccepted ? "YES" : "NO"),
            "Transition Execution Prerequisites Satisfied: " +
                (current.transitionExecutionPrerequisitesSatisfied ? "YES" : "NO"),
            "Transition Execution Review Eligible: " +
                (current.transitionExecutionReviewEligible ? "YES" : "NO"),
            "Transition Execution Request Recorded: NO",
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
            "Actual Transition Execution Attempted: NO",
            "Actual Transition Execution Completed: NO",
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

    function getLastTransitionExecutionReport() {
        return lastTransitionExecutionReport;
    }

    function getTransitionExecutionRequirements() {
        return [
            "Accepted Transition Approval Execution Controller report",
            "Accepted Transition Approval Execution Controller validation",
            "Execution-boundary prerequisites satisfied",
            "Execution-boundary review eligible",
            "Execution request not recorded",
            "Approval execution not authorized",
            "Approval not executed",
            "Approval not granted",
            "Human approval not granted",
            "Authorization not granted",
            "Transition not approved",
            "Transition not applied",
            "Execution not authorized",
            "Permanent write not authorized",
            "Rollback not authorized",
            "Restore not authorized",
            "No permanent writes executed",
            "No restore executed"
        ];
    }

    window.TMSPermanentDocumentationTransitionExecutionController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            executionMode:
                EXECUTION_MODE,

            generateTransitionExecutionReport:
                generateTransitionExecutionReport,

            validateTransitionExecutionReport:
                validateTransitionExecutionReport,

            formatTransitionExecutionReport:
                formatTransitionExecutionReport,

            getLastTransitionExecutionReport:
                getLastTransitionExecutionReport,

            getTransitionExecutionRequirements:
                getTransitionExecutionRequirements
        });

    console.log(
        "Permanent Documentation Transition Execution Controller v" +
        ENGINE_VERSION +
        " initialized in " +
        EXECUTION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
