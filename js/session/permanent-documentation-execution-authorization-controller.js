"use strict";

/*
============================================================
TMS-OS Permanent Documentation Execution Authorization Controller
Version: 1.0.0
Validation Mode: Disabled
============================================================

Purpose:
- Accept an approved Permanent Documentation Human Review Report.
- Validate the complete human-review prerequisite.
- Generate an Execution Authorization Report artifact.
- Keep execution authorization disabled.
- Perform no execution, writes, rollback, restore, or state change.
============================================================
*/

const TMSPermanentDocumentationExecutionAuthorizationController = (() => {

    const CONTROLLER_NAME =
        "TMSPermanentDocumentationExecutionAuthorizationController";

    const ENGINE_VERSION = "1.0.0";

    const VALIDATION_MODE = "Disabled";

    const SOURCE_REPORT_TYPE =
        "TMS-OS Permanent Documentation Human Review Report";

    const OUTPUT_REPORT_TYPE =
        "TMS-OS Permanent Documentation Execution Authorization Report";

    const MODULE_NAME =
        "Permanent Documentation Execution Authorization Controller";

    /*
    ============================================================
    Utility Functions
    ============================================================
    */

    function isObject(value) {
        return (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
        );
    }

    function isNonEmptyString(value) {
        return (
            typeof value === "string" &&
            value.trim().length > 0
        );
    }

    function normalizeString(value) {
        return typeof value === "string"
            ? value.trim()
            : "";
    }

    function createTimestamp() {
        return new Date().toISOString();
    }

    function createCompactTimestamp(timestamp) {
        return timestamp
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);
    }

    function createReportId(sessionNumber, timestamp) {
        const normalizedSessionNumber =
            isNonEmptyString(sessionNumber)
                ? sessionNumber.trim()
                : "UNKNOWN";

        return (
            `TMS-EXECUTION-AUTHORIZATION-` +
            `${normalizedSessionNumber}-` +
            `${createCompactTimestamp(timestamp)}`
        );
    }

    function cloneObject(value) {
        if (!isObject(value)) {
            return null;
        }

        return JSON.parse(JSON.stringify(value));
    }

    function getControllerInfo() {
        return {
            controllerName: CONTROLLER_NAME,
            engineVersion: ENGINE_VERSION,
            validationMode: VALIDATION_MODE,
            sourceReportType: SOURCE_REPORT_TYPE,
            reportType: OUTPUT_REPORT_TYPE,
            module: MODULE_NAME
        };
    }

    /*
    ============================================================
    Source Validation
    ============================================================
    */

    function validateSourceReport(sourceReport) {

        const checks = [];

        function addCheck(
            checkName,
            satisfied,
            expected,
            actual
        ) {
            checks.push({
                checkName,
                satisfied: satisfied === true,
                expected,
                actual
            });
        }

        const sourceIsObject = isObject(sourceReport);

        addCheck(
            "Source report is an object",
            sourceIsObject,
            "Object",
            sourceIsObject
                ? "object"
                : typeof sourceReport
        );

        addCheck(
            "Source report type is valid",
            sourceReport?.reportType === SOURCE_REPORT_TYPE,
            SOURCE_REPORT_TYPE,
            sourceReport?.reportType ?? null
        );

        addCheck(
            "Source report is accepted",
            sourceReport?.accepted === true,
            true,
            sourceReport?.accepted ?? null
        );

        addCheck(
            "Source validation mode remains Disabled",
            sourceReport?.validationMode === VALIDATION_MODE,
            VALIDATION_MODE,
            sourceReport?.validationMode ?? null
        );

        addCheck(
            "Source report ID exists",
            isNonEmptyString(sourceReport?.reportId),
            "Non-empty reportId",
            sourceReport?.reportId ?? null
        );

        addCheck(
            "Source session number exists",
            isNonEmptyString(sourceReport?.sessionNumber),
            "Non-empty sessionNumber",
            sourceReport?.sessionNumber ?? null
        );

        addCheck(
            "Source version exists",
            isNonEmptyString(sourceReport?.version),
            "Non-empty version",
            sourceReport?.version ?? null
        );

        addCheck(
            "Source milestone exists",
            isNonEmptyString(sourceReport?.milestone),
            "Non-empty milestone",
            sourceReport?.milestone ?? null
        );

        addCheck(
            "Human review decision is Approve",
            sourceReport?.review?.decision === "Approve",
            "Approve",
            sourceReport?.review?.decision ?? null
        );

        addCheck(
            "Human review decision was recorded",
            sourceReport?.review?.decisionRecorded === true,
            true,
            sourceReport?.review?.decisionRecorded ?? null
        );

        addCheck(
            "Human review is complete",
            sourceReport?.review?.reviewCompleted === true,
            true,
            sourceReport?.review?.reviewCompleted ?? null
        );

        addCheck(
            "Human review remains an artifact only",
            sourceReport?.review?.reviewArtifactOnly === true,
            true,
            sourceReport?.review?.reviewArtifactOnly ?? null
        );

        addCheck(
            "Reviewer name exists",
            isNonEmptyString(
                sourceReport?.reviewer?.reviewerName
            ),
            "Non-empty reviewerName",
            sourceReport?.reviewer?.reviewerName ?? null
        );

        addCheck(
            "Current state exists",
            isNonEmptyString(sourceReport?.currentState),
            "Non-empty currentState",
            sourceReport?.currentState ?? null
        );

        addCheck(
            "Requested state exists",
            isNonEmptyString(sourceReport?.requestedState),
            "Non-empty requestedState",
            sourceReport?.requestedState ?? null
        );

        addCheck(
            "State identity is satisfied",
            sourceReport?.stateIdentitySatisfied === true,
            true,
            sourceReport?.stateIdentitySatisfied ?? null
        );

        addCheck(
            "Source Disabled Mode is enforced",
            sourceReport?.disabledMode
                ?.disabledModeEnforced === true,
            true,
            sourceReport?.disabledMode
                ?.disabledModeEnforced ?? null
        );

        addCheck(
            "Source granted no authorization",
            sourceReport?.disabledMode
                ?.authorizationGranted === false,
            false,
            sourceReport?.disabledMode
                ?.authorizationGranted ?? null
        );

        addCheck(
            "Source performed no execution",
            sourceReport?.disabledMode
                ?.executionPerformed === false,
            false,
            sourceReport?.disabledMode
                ?.executionPerformed ?? null
        );

        addCheck(
            "Source performed no permanent writes",
            sourceReport?.disabledMode
                ?.permanentWritesPerformed === false,
            false,
            sourceReport?.disabledMode
                ?.permanentWritesPerformed ?? null
        );

        addCheck(
            "Source performed no rollback",
            sourceReport?.disabledMode
                ?.rollbackPerformed === false,
            false,
            sourceReport?.disabledMode
                ?.rollbackPerformed ?? null
        );

        addCheck(
            "Source performed no restore",
            sourceReport?.disabledMode
                ?.restorePerformed === false,
            false,
            sourceReport?.disabledMode
                ?.restorePerformed ?? null
        );

        addCheck(
            "Source changed no documentation state",
            sourceReport?.disabledMode
                ?.documentationStateChanged === false,
            false,
            sourceReport?.disabledMode
                ?.documentationStateChanged ?? null
        );

        const failedChecks =
            checks.filter(check => !check.satisfied);

        return {
            accepted: failedChecks.length === 0,
            totalCheckCount: checks.length,
            passedCheckCount:
                checks.length - failedChecks.length,
            failedCheckCount: failedChecks.length,
            sourceReportAccepted:
                sourceReport?.accepted === true,
            humanReviewApproved:
                sourceReport?.review?.decision === "Approve",
            humanReviewCompleted:
                sourceReport?.review?.reviewCompleted === true,
            disabledModeAccepted:
                sourceReport?.validationMode ===
                    VALIDATION_MODE &&
                sourceReport?.disabledMode
                    ?.disabledModeEnforced === true,
            checks,
            failedChecks
        };
    }

    /*
    ============================================================
    Execution Authorization Report
    ============================================================
    */

    function createAuthorization(
        sourceHumanReviewReport,
        authorizationOfficer,
        comments = ""
    ) {
        const generatedAt = createTimestamp();

        const validation =
            validateSourceReport(
                sourceHumanReviewReport
            );

        const officerIsObject =
            isObject(authorizationOfficer);

        const authorizationOfficerName =
            normalizeString(
                authorizationOfficer
                    ?.authorizationOfficerName
            );

        const authorizationOfficerId =
            normalizeString(
                authorizationOfficer
                    ?.authorizationOfficerId
            );

        const authorizationChecks = [
            {
                checkName:
                    "Authorization officer object is valid",
                satisfied: officerIsObject,
                expected: "Object",
                actual: officerIsObject
                    ? "object"
                    : typeof authorizationOfficer
            },
            {
                checkName:
                    "Authorization officer name exists",
                satisfied:
                    isNonEmptyString(
                        authorizationOfficerName
                    ),
                expected:
                    "Non-empty authorizationOfficerName",
                actual:
                    authorizationOfficerName || null
            },
            {
                checkName:
                    "Authorization officer ID format is valid",
                satisfied:
                    typeof authorizationOfficerId ===
                    "string",
                expected: "String or empty",
                actual:
                    authorizationOfficerId || null
            }
        ];

        const failedAuthorizationChecks =
            authorizationChecks.filter(
                check => !check.satisfied
            );

        const sourceAccepted =
            validation.accepted === true;

        const officerAccepted =
            failedAuthorizationChecks.length === 0;

        const accepted =
            sourceAccepted &&
            officerAccepted;

        const combinedChecks = [
            ...validation.checks,
            ...authorizationChecks
        ];

        const combinedFailedChecks =
            combinedChecks.filter(
                check => !check.satisfied
            );

        const sessionNumber =
            normalizeString(
                sourceHumanReviewReport
                    ?.sessionNumber
            );

        const reportId =
            createReportId(
                sessionNumber,
                generatedAt
            );

        const authorizationStatus = accepted
            ? "Execution Authorization Recorded — Disabled Mode"
            : "Execution Authorization Rejected — Disabled Mode";

        return {
            reportType: OUTPUT_REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            controllerName: CONTROLLER_NAME,
            validationMode: VALIDATION_MODE,
            reportId,
            generatedAt,

            sessionNumber:
                sessionNumber || null,

            version:
                sourceHumanReviewReport
                    ?.version ?? null,

            milestone:
                sourceHumanReviewReport
                    ?.milestone ?? null,

            module: MODULE_NAME,

            accepted,

            executionAuthorizationStatus:
                authorizationStatus,

            sourceHumanReviewReportExists:
                isObject(sourceHumanReviewReport),

            sourceHumanReviewReportId:
                sourceHumanReviewReport
                    ?.reportId ?? null,

            sourceHumanReviewReportAccepted:
                sourceHumanReviewReport
                    ?.accepted === true,

            sourceHumanReviewReportSessionNumber:
                sourceHumanReviewReport
                    ?.sessionNumber ?? null,

            humanReviewDecision:
                sourceHumanReviewReport
                    ?.review?.decision ?? null,

            humanReviewCompleted:
                sourceHumanReviewReport
                    ?.review
                    ?.reviewCompleted === true,

            currentState:
                sourceHumanReviewReport
                    ?.currentState ?? null,

            requestedState:
                sourceHumanReviewReport
                    ?.requestedState ?? null,

            stateIdentitySatisfied:
                sourceHumanReviewReport
                    ?.stateIdentitySatisfied === true,

            authorizationOfficer: {
                authorizationOfficerName,
                authorizationOfficerId,
                authorizationReviewStartedAt:
                    generatedAt,
                authorizationReviewCompletedAt:
                    generatedAt
            },

            authorization: {
                authorizationDecision:
                    accepted
                        ? "Authorize"
                        : "Reject",

                authorizationRecorded:
                    accepted,

                authorizationArtifactOnly:
                    true,

                comments:
                    normalizeString(comments),

                executionAuthorizationEffect:
                    "None",

                permanentDocumentationEffect:
                    "None",

                stateChangeEffect:
                    "None"
            },

            disabledMode: {
                validationMode:
                    VALIDATION_MODE,

                disabledModeEnforced:
                    true,

                authorizationArtifactCreated:
                    accepted,

                authorizationGranted:
                    false,

                authorizationExecuted:
                    false,

                executionAuthorized:
                    false,

                executionPerformed:
                    false,

                permanentWritesAuthorized:
                    false,

                permanentWritesPerformed:
                    false,

                rollbackAuthorized:
                    false,

                rollbackPerformed:
                    false,

                restoreAuthorized:
                    false,

                restorePerformed:
                    false,

                documentationStateChangeAuthorized:
                    false,

                documentationStateChanged:
                    false
            },

            validation: {
                accepted:
                    combinedFailedChecks.length === 0,

                totalCheckCount:
                    combinedChecks.length,

                passedCheckCount:
                    combinedChecks.length -
                    combinedFailedChecks.length,

                failedCheckCount:
                    combinedFailedChecks.length,

                sourceValidationAccepted:
                    sourceAccepted,

                authorizationOfficerValidationAccepted:
                    officerAccepted,

                humanReviewApprovalAccepted:
                    sourceHumanReviewReport
                        ?.review?.decision ===
                    "Approve",

                checks:
                    combinedChecks,

                failedChecks:
                    combinedFailedChecks
            },

            sourceHumanReviewReportSnapshot:
                cloneObject(
                    sourceHumanReviewReport
                ),

            message: accepted
                ? (
                    "The Permanent Documentation Execution " +
                    "Authorization artifact was recorded " +
                    "successfully. Disabled Mode remains " +
                    "enforced. No authorization was granted, " +
                    "no execution occurred, and no permanent " +
                    "documentation state changed."
                )
                : (
                    "The Permanent Documentation Execution " +
                    "Authorization request was rejected because " +
                    "one or more required validation checks " +
                    "failed. Disabled Mode remains enforced, " +
                    "and no authorization or execution occurred."
                )
        };
    }

    return {
        getControllerInfo,
        validateSourceReport,
        createAuthorization
    };

})();

console.log(
    "TMSPermanentDocumentationExecutionAuthorizationController " +
    "v1.0.0 loaded in Disabled Mode."
);