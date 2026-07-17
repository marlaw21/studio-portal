/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 067 — Permanent Documentation Transition Approval Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-transition-approval-controller.js

Purpose:
Define and validate the human approval decision layer that follows transition
authorization without granting actual approval.

Version 1.0.0 remains locked in Disabled Mode. It does not grant human approval,
approve transitions, apply state changes, authorize execution, authorize
permanent writes, authorize rollback or restore, or modify permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const APPROVAL_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Transition Approval Report";

    let lastApprovalReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationTransitionAuthorizationController
    ) {
        console.error(
            "Permanent Documentation Transition Approval Controller could not initialize because its dependencies are unavailable."
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
            "TRANSITION-APPROVAL",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function normalizeDecision(decision) {
        const normalized =
            decision && typeof decision === "object"
                ? decision
                : {};

        return {
            decision:
                typeof normalized.decision === "string"
                    ? normalized.decision
                    : "Not Recorded",

            reason:
                typeof normalized.reason === "string"
                    ? normalized.reason
                    : "No reason supplied",

            decidedBy:
                typeof normalized.decidedBy === "string"
                    ? normalized.decidedBy
                    : "Unspecified",

            decidedAt:
                new Date().toISOString()
        };
    }

    async function generateApprovalReport(
        authorizationReport,
        decision
    ) {
        const sourceReport =
            authorizationReport ||
            await window
                .TMSPermanentDocumentationTransitionAuthorizationController
                .generateAuthorizationReport();

        const normalizedDecision =
            normalizeDecision(decision);

        const sourceValidation =
            isPlainObject(sourceReport)
                ? window
                    .TMSPermanentDocumentationTransitionAuthorizationController
                    .validateAuthorizationReport(sourceReport)
                : {
                    accepted: false,
                    checks: []
                };

        const checks = [];

        checks.push(buildCheck(
            "Authorization report exists",
            isPlainObject(sourceReport),
            "A Transition Authorization Controller report is required."
        ));

        checks.push(buildCheck(
            "Authorization report accepted",
            Boolean(sourceReport && sourceReport.accepted),
            "The authorization report must be accepted."
        ));

        checks.push(buildCheck(
            "Authorization report validation accepted",
            Boolean(sourceValidation.accepted),
            "The authorization report must pass validation."
        ));

        checks.push(buildCheck(
            "Authorization mode disabled",
            Boolean(sourceReport) &&
                sourceReport.authorizationMode === "Disabled",
            "The Transition Authorization Controller must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Authorization prerequisites satisfied",
            Boolean(sourceReport) &&
                sourceReport.authorizationPrerequisitesSatisfied === true,
            "Authorization prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Authorization review eligible",
            Boolean(sourceReport) &&
                sourceReport.authorizationReviewEligible === true,
            "The authorization report must be eligible for review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(sourceReport) &&
                sourceReport.authorizationGranted === false,
            "Actual authorization must remain ungranted."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(sourceReport) &&
                sourceReport.humanApprovalGranted === false,
            "Human approval must remain ungranted."
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
            "No authorization attempted",
            Boolean(sourceReport) &&
                sourceReport.actualAuthorizationAttempted === false,
            "No actual authorization attempt may occur."
        ));

        checks.push(buildCheck(
            "No authorization granted",
            Boolean(sourceReport) &&
                sourceReport.actualAuthorizationGranted === false,
            "No actual authorization may be granted."
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

        lastApprovalReport =
            deepFreeze({
                reportType: REPORT_TYPE,
                engineVersion: ENGINE_VERSION,
                approvalMode: APPROVAL_MODE,

                reportId:
                    createReportId(
                        sessionSnapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt: generatedAt,
                sessionNumber:
                    sessionSnapshot.sessionNumber,

                accepted:
                    prerequisitesSatisfied,

                approvalStatus:
                    prerequisitesSatisfied
                        ? "Eligible for Human Approval Review — Approval Locked"
                        : "Rejected",

                sourceAuthorizationReportId:
                    sourceReport
                        ? sourceReport.reportId
                        : null,

                sourceAuthorizationAccepted:
                    Boolean(
                        sourceReport &&
                        sourceReport.accepted
                    ),

                sourceAuthorizationStatus:
                    sourceReport
                        ? sourceReport.authorizationStatus
                        : "Unavailable",

                sourceTransitionRequest:
                    sourceReport
                        ? sourceReport.sourceTransitionRequest
                        : null,

                approvalDecision:
                    normalizedDecision,

                prerequisiteChecks:
                    checks,

                approvalPrerequisitesSatisfied:
                    prerequisitesSatisfied,

                approvalReviewEligible:
                    prerequisitesSatisfied,

                approvalDecisionRecorded:
                    false,

                approvalGranted:
                    false,

                humanApprovalGranted:
                    false,

                authorizationGranted:
                    false,

                transitionApproved:
                    false,

                transitionApplied:
                    false,

                executionAuthorized:
                    false,

                writeAuthorized:
                    false,

                rollbackAuthorized:
                    false,

                restoreAuthorized:
                    false,

                actualApprovalAttempted:
                    false,

                actualApprovalGranted:
                    false,

                actualAuthorizationAttempted:
                    false,

                actualAuthorizationGranted:
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
                        ? "Human review is required. Version 1.0.0 cannot record or grant actual transition approval."
                        : "Correct the failed authorization report or approval prerequisite checks.",

                reviewRequired:
                    true,

                reviewChoices:
                    prerequisitesSatisfied
                        ? [
                            "Approve Approval Controller Structure",
                            "Revise Approval Prerequisites",
                            "Cancel Approval Review"
                        ]
                        : []
            });

        return lastApprovalReport;
    }

    function validateApprovalReport(report) {
        const current =
            report || lastApprovalReport;

        const checks = [];

        checks.push(buildCheck(
            "Approval report exists",
            isPlainObject(current),
            "A Transition Approval Report is required."
        ));

        checks.push(buildCheck(
            "Approval report accepted",
            Boolean(current && current.accepted),
            "The approval report must be accepted."
        ));

        checks.push(buildCheck(
            "Approval mode disabled",
            Boolean(current) &&
                current.approvalMode === APPROVAL_MODE,
            "Version 1.0.0 must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Approval prerequisites satisfied",
            Boolean(current) &&
                current.approvalPrerequisitesSatisfied === true,
            "All approval prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Approval review eligible",
            Boolean(current) &&
                current.approvalReviewEligible === true,
            "The approval report must be eligible for human review."
        ));

        checks.push(buildCheck(
            "Approval decision remains unrecorded",
            Boolean(current) &&
                current.approvalDecisionRecorded === false,
            "Version 1.0.0 must not record a real approval decision."
        ));

        checks.push(buildCheck(
            "Approval remains ungranted",
            Boolean(current) &&
                current.approvalGranted === false,
            "Version 1.0.0 must not grant approval."
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
            "No approval attempted",
            Boolean(current) &&
                current.actualApprovalAttempted === false,
            "No actual approval attempt may occur."
        ));

        checks.push(buildCheck(
            "No approval granted",
            Boolean(current) &&
                current.actualApprovalGranted === false,
            "No actual approval may be granted."
        ));

        checks.push(buildCheck(
            "No authorization attempted",
            Boolean(current) &&
                current.actualAuthorizationAttempted === false,
            "No actual authorization attempt may occur."
        ));

        checks.push(buildCheck(
            "No authorization granted",
            Boolean(current) &&
                current.actualAuthorizationGranted === false,
            "No actual authorization may be granted."
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

            checks: checks
        });
    }

    async function formatApprovalReport(report) {
        const current =
            report ||
            await generateApprovalReport();

        const request =
            current.sourceTransitionRequest || {};

        const decision =
            current.approvalDecision || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION TRANSITION APPROVAL REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Approval Mode: " +
                current.approvalMode,
            "Approval Status: " +
                current.approvalStatus,
            "Current State: " +
                (request.currentState || "Unavailable"),
            "Requested State: " +
                (request.requestedState || "Unavailable"),
            "Source Authorization Accepted: " +
                (current.sourceAuthorizationAccepted ? "YES" : "NO"),
            "Approval Prerequisites Satisfied: " +
                (current.approvalPrerequisitesSatisfied ? "YES" : "NO"),
            "Approval Review Eligible: " +
                (current.approvalReviewEligible ? "YES" : "NO"),
            "Decision Requested: " +
                (decision.decision || "Not Recorded"),
            "Approval Decision Recorded: NO",
            "Approval Granted: NO",
            "Human Approval Granted: NO",
            "Authorization Granted: NO",
            "Transition Approved: NO",
            "Transition Applied: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual Approval Attempted: NO",
            "Actual Approval Granted: NO",
            "Actual Authorization Attempted: NO",
            "Actual Authorization Granted: NO",
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

    function getLastApprovalReport() {
        return lastApprovalReport;
    }

    function getApprovalRequirements() {
        return [
            "Accepted Transition Authorization Controller report",
            "Accepted Transition Authorization Controller validation",
            "Authorization prerequisites satisfied",
            "Authorization review eligible",
            "Authorization not granted",
            "Human approval not granted",
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

    window.TMSPermanentDocumentationTransitionApprovalController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            approvalMode:
                APPROVAL_MODE,

            generateApprovalReport:
                generateApprovalReport,

            validateApprovalReport:
                validateApprovalReport,

            formatApprovalReport:
                formatApprovalReport,

            getLastApprovalReport:
                getLastApprovalReport,

            getApprovalRequirements:
                getApprovalRequirements
        });

    console.log(
        "Permanent Documentation Transition Approval Controller v" +
        ENGINE_VERSION +
        " initialized in " +
        APPROVAL_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
