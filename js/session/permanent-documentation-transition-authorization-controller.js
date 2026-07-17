/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 066 — Permanent Documentation Transition Authorization Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-transition-authorization-controller.js

Purpose:
Evaluate whether a proposed Permanent Documentation System state transition has
satisfied authorization prerequisites without granting actual authorization.

Version 1.0.0 remains locked in Disabled Mode. It does not approve transitions,
apply state changes, grant human approval, authorize execution, authorize
permanent writes, authorize rollback or restore, or modify permanent files.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const AUTHORIZATION_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Transition Authorization Report";

    let lastAuthorizationReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationStateTransitionController
    ) {
        console.error(
            "Permanent Documentation Transition Authorization Controller could not initialize because its dependencies are unavailable."
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
            "TRANSITION-AUTHORIZATION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    async function generateAuthorizationReport(transitionReport) {
        const sourceReport =
            transitionReport ||
            await window
                .TMSPermanentDocumentationStateTransitionController
                .evaluateTransition({
                    requestedState: null,
                    reason: "Authorization prerequisite evaluation",
                    requestedBy: "Transition Authorization Controller"
                });

        const sourceValidation =
            isPlainObject(sourceReport)
                ? window
                    .TMSPermanentDocumentationStateTransitionController
                    .validateTransitionReport(sourceReport)
                : {
                    accepted: false,
                    checks: []
                };

        const checks = [];

        checks.push(buildCheck(
            "Transition report exists",
            isPlainObject(sourceReport),
            "A State Transition Controller report is required."
        ));

        checks.push(buildCheck(
            "Transition report accepted",
            Boolean(sourceReport && sourceReport.accepted),
            "The source transition report must be accepted."
        ));

        checks.push(buildCheck(
            "Transition report validation accepted",
            Boolean(sourceValidation.accepted),
            "The source transition report must pass validation."
        ));

        checks.push(buildCheck(
            "Transition mode disabled",
            Boolean(sourceReport) &&
                sourceReport.transitionMode === "Disabled",
            "The State Transition Controller must remain in Disabled Mode."
        ));

        checks.push(buildCheck(
            "Transition known",
            Boolean(sourceReport) &&
                sourceReport.transitionKnown === true,
            "The transition must use known approved states."
        ));

        checks.push(buildCheck(
            "Transition sequential",
            Boolean(sourceReport) &&
                sourceReport.transitionSequential === true,
            "The transition must be sequential."
        ));

        checks.push(buildCheck(
            "Transition eligible",
            Boolean(sourceReport) &&
                sourceReport.transitionEligible === true,
            "The transition must be eligible for review."
        ));

        checks.push(buildCheck(
            "Transition remains unapproved",
            Boolean(sourceReport) &&
                sourceReport.transitionApproved === false,
            "The source controller must not grant actual transition approval."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(sourceReport) &&
                sourceReport.transitionApplied === false,
            "The source controller must not apply an actual state transition."
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
            "Human approval not granted",
            Boolean(sourceReport) &&
                sourceReport.humanApprovalGranted === false,
            "Human approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Execution not authorized",
            Boolean(sourceReport) &&
                sourceReport.executionAuthorized === false,
            "Execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Write not authorized",
            Boolean(sourceReport) &&
                sourceReport.writeAuthorized === false,
            "Permanent writes must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Rollback not authorized",
            Boolean(sourceReport) &&
                sourceReport.rollbackAuthorized === false,
            "Rollback must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Restore not authorized",
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

        lastAuthorizationReport =
            deepFreeze({
                reportType: REPORT_TYPE,
                engineVersion: ENGINE_VERSION,
                authorizationMode: AUTHORIZATION_MODE,

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

                authorizationStatus:
                    prerequisitesSatisfied
                        ? "Prerequisites Satisfied — Authorization Locked"
                        : "Rejected",

                sourceTransitionReportId:
                    sourceReport
                        ? sourceReport.reportId
                        : null,

                sourceTransitionAccepted:
                    Boolean(
                        sourceReport &&
                        sourceReport.accepted
                    ),

                sourceTransitionStatus:
                    sourceReport
                        ? sourceReport.transitionStatus
                        : "Unavailable",

                sourceTransitionRequest:
                    sourceReport
                        ? sourceReport.transitionRequest
                        : null,

                prerequisiteChecks:
                    checks,

                authorizationPrerequisitesSatisfied:
                    prerequisitesSatisfied,

                authorizationReviewEligible:
                    prerequisitesSatisfied,

                authorizationGranted:
                    false,

                humanApprovalGranted:
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
                        ? "Human review is required. Version 1.0.0 cannot grant transition authorization."
                        : "Correct the failed transition report or authorization prerequisite checks.",

                reviewRequired:
                    true,

                reviewChoices:
                    prerequisitesSatisfied
                        ? [
                            "Approve Authorization Controller Structure",
                            "Revise Authorization Prerequisites",
                            "Cancel Authorization Review"
                        ]
                        : []
            });

        return lastAuthorizationReport;
    }

    function validateAuthorizationReport(report) {
        const current =
            report || lastAuthorizationReport;

        const checks = [];

        checks.push(buildCheck(
            "Authorization report exists",
            isPlainObject(current),
            "A Transition Authorization Report is required."
        ));

        checks.push(buildCheck(
            "Authorization report accepted",
            Boolean(current && current.accepted),
            "The authorization report must be accepted."
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
                current.authorizationPrerequisitesSatisfied === true,
            "All authorization prerequisites must be satisfied."
        ));

        checks.push(buildCheck(
            "Authorization review eligible",
            Boolean(current) &&
                current.authorizationReviewEligible === true,
            "The report must be eligible for human review."
        ));

        checks.push(buildCheck(
            "Authorization remains ungranted",
            Boolean(current) &&
                current.authorizationGranted === false,
            "Version 1.0.0 must not grant actual authorization."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(current) &&
                current.humanApprovalGranted === false,
            "Human approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Transition remains unapproved",
            Boolean(current) &&
                current.transitionApproved === false,
            "No actual transition may be approved."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(current) &&
                current.transitionApplied === false,
            "No actual transition may be applied."
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

    async function formatAuthorizationReport(report) {
        const current =
            report ||
            await generateAuthorizationReport();

        const request =
            current.sourceTransitionRequest || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION TRANSITION AUTHORIZATION REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Authorization Mode: " +
                current.authorizationMode,
            "Authorization Status: " +
                current.authorizationStatus,
            "Current State: " +
                (request.currentState || "Unavailable"),
            "Requested State: " +
                (request.requestedState || "Unavailable"),
            "Source Transition Accepted: " +
                (current.sourceTransitionAccepted ? "YES" : "NO"),
            "Authorization Prerequisites Satisfied: " +
                (current.authorizationPrerequisitesSatisfied ? "YES" : "NO"),
            "Authorization Review Eligible: " +
                (current.authorizationReviewEligible ? "YES" : "NO"),
            "Authorization Granted: NO",
            "Human Approval Granted: NO",
            "Transition Approved: NO",
            "Transition Applied: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
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

    function getLastAuthorizationReport() {
        return lastAuthorizationReport;
    }

    function getAuthorizationRequirements() {
        return [
            "Accepted State Transition Controller report",
            "Accepted State Transition Controller validation",
            "Known approved transition states",
            "Sequential transition path",
            "Transition eligible for review",
            "Transition not approved",
            "Transition not applied",
            "Human approval not granted",
            "Execution not authorized",
            "Permanent write not authorized",
            "Rollback not authorized",
            "Restore not authorized",
            "No permanent writes executed",
            "No restore executed"
        ];
    }

    window.TMSPermanentDocumentationTransitionAuthorizationController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            authorizationMode:
                AUTHORIZATION_MODE,

            generateAuthorizationReport:
                generateAuthorizationReport,

            validateAuthorizationReport:
                validateAuthorizationReport,

            formatAuthorizationReport:
                formatAuthorizationReport,

            getLastAuthorizationReport:
                getLastAuthorizationReport,

            getAuthorizationRequirements:
                getAuthorizationRequirements
        });

    console.log(
        "Permanent Documentation Transition Authorization Controller v" +
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
