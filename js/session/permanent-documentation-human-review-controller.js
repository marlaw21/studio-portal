/**
 * Two Marshalls Studios – TMS-OS
 * Permanent Documentation Human Review Controller
 *
 * File:
 * studio-portal/js/session/permanent-documentation-human-review-controller.js
 *
 * Work Session:
 * WS088
 *
 * Version:
 * v0.28.1
 *
 * Controller Version:
 * 1.0.0
 *
 * Purpose:
 * Creates controlled human-review artifacts from an accepted
 * Permanent Documentation State Change Approval Validation Report.
 *
 * Disabled Mode:
 * This controller may record and report human-review information only.
 * It must not authorize, execute, write, restore, roll back, or change
 * permanent documentation state.
 */

(function initializePermanentDocumentationHumanReviewController(global) {
    "use strict";

    const CONTROLLER_NAME =
        "TMSPermanentDocumentationHumanReviewController";

    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Human Review Report";

    const CONTROLLER_VERSION = "1.0.0";

    const VALIDATION_REPORT_TYPE =
        "TMS-OS Permanent Documentation State Change Approval Validation Report";

    const VALID_DECISIONS = Object.freeze([
        "Pending",
        "Approve",
        "Revise",
        "Cancel"
    ]);

    const COMPLETED_DECISIONS = Object.freeze([
        "Approve",
        "Revise",
        "Cancel"
    ]);

    /**
     * Creates an ISO timestamp.
     *
     * @returns {string}
     */
    function createTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Creates a compact timestamp for report identifiers.
     *
     * @param {string} isoTimestamp
     * @returns {string}
     */
    function createReportTimestamp(isoTimestamp) {
        return isoTimestamp
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}Z$/, "")
            .replace("T", "");
    }

    /**
     * Normalizes a value to a trimmed string.
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeString(value) {
        if (typeof value !== "string") {
            return "";
        }

        return value.trim();
    }

    /**
     * Normalizes a session number.
     *
     * @param {*} value
     * @returns {string}
     */
    function normalizeSessionNumber(value) {
        const normalizedValue = normalizeString(String(value ?? ""));

        if (!normalizedValue) {
            return "";
        }

        return normalizedValue.padStart(3, "0");
    }

    /**
     * Safely clones plain report data.
     *
     * @param {*} value
     * @returns {*}
     */
    function cloneValue(value) {
        if (value === undefined) {
            return undefined;
        }

        return JSON.parse(JSON.stringify(value));
    }

    /**
     * Determines whether a value is a plain object.
     *
     * @param {*} value
     * @returns {boolean}
     */
    function isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    /**
     * Returns a standard Disabled Mode status object.
     *
     * @returns {Object}
     */
    function createDisabledModeStatus() {
        return {
            validationMode: "Disabled",
            disabledModeEnforced: true,

            authorizationGranted: false,
            authorizationExecuted: false,

            executionAuthorized: false,
            executionPerformed: false,

            permanentWritesAuthorized: false,
            permanentWritesPerformed: false,

            rollbackAuthorized: false,
            rollbackPerformed: false,

            restoreAuthorized: false,
            restorePerformed: false,

            documentationStateChangeAuthorized: false,
            documentationStateChanged: false
        };
    }

    /**
     * Validates the source approval-validation report.
     *
     * @param {*} sourceReport
     * @returns {{
     *   accepted: boolean,
     *   checks: Array<Object>,
     *   failedChecks: Array<Object>
     * }}
     */
    function validateSourceReport(sourceReport) {
        const checks = [];

        function addCheck(name, satisfied, expected, actual) {
            checks.push({
                checkName: name,
                satisfied: Boolean(satisfied),
                expected,
                actual
            });
        }

        addCheck(
            "Source report is an object",
            isObject(sourceReport),
            "Object",
            sourceReport === null
                ? "null"
                : Array.isArray(sourceReport)
                    ? "Array"
                    : typeof sourceReport
        );

        addCheck(
            "Source report type is valid",
            sourceReport?.reportType === VALIDATION_REPORT_TYPE,
            VALIDATION_REPORT_TYPE,
            sourceReport?.reportType ?? null
        );

        addCheck(
            "Source report is accepted",
            sourceReport?.accepted === true,
            true,
            sourceReport?.accepted ?? null
        );

        addCheck(
            "Source validation remains disabled",
            sourceReport?.validationMode === "Disabled",
            "Disabled",
            sourceReport?.validationMode ?? null
        );

        addCheck(
            "Source report ID exists",
            normalizeString(sourceReport?.reportId).length > 0,
            "Non-empty reportId",
            sourceReport?.reportId ?? null
        );

        addCheck(
            "Source session number exists",
            normalizeSessionNumber(sourceReport?.sessionNumber).length > 0,
            "Non-empty sessionNumber",
            sourceReport?.sessionNumber ?? null
        );

        addCheck(
            "Current state exists",
            normalizeString(sourceReport?.currentState).length > 0,
            "Non-empty currentState",
            sourceReport?.currentState ?? null
        );

        addCheck(
            "Requested state exists",
            normalizeString(sourceReport?.requestedState).length > 0,
            "Non-empty requestedState",
            sourceReport?.requestedState ?? null
        );

        addCheck(
            "State identity is satisfied",
            sourceReport?.stateIdentitySatisfied === true,
            true,
            sourceReport?.stateIdentitySatisfied ?? null
        );

        const failedChecks = checks.filter(
            (check) => check.satisfied !== true
        );

        return {
            accepted: failedChecks.length === 0,
            checks,
            failedChecks
        };
    }

    /**
     * Validates reviewer information.
     *
     * Reviewer identity is required only when a completed decision is made.
     * A Pending report may be created without reviewer information.
     *
     * @param {Object} reviewer
     * @param {string} decision
     * @returns {{
     *   accepted: boolean,
     *   checks: Array<Object>,
     *   failedChecks: Array<Object>
     * }}
     */
    function validateReviewer(reviewer, decision) {
        const normalizedReviewerName =
            normalizeString(reviewer?.reviewerName);

        const normalizedReviewerId =
            normalizeString(reviewer?.reviewerId);

        const requiresReviewerIdentity =
            COMPLETED_DECISIONS.includes(decision);

        const checks = [
            {
                checkName: "Reviewer object is valid",
                satisfied: isObject(reviewer),
                expected: "Object",
                actual: reviewer === null
                    ? "null"
                    : Array.isArray(reviewer)
                        ? "Array"
                        : typeof reviewer
            },
            {
                checkName: "Reviewer name requirement satisfied",
                satisfied:
                    !requiresReviewerIdentity ||
                    normalizedReviewerName.length > 0,
                expected: requiresReviewerIdentity
                    ? "Non-empty reviewerName"
                    : "Optional while Pending",
                actual: normalizedReviewerName || null
            },
            {
                checkName: "Reviewer ID format is valid",
                satisfied:
                    normalizedReviewerId.length === 0 ||
                    normalizedReviewerId.length > 0,
                expected: "String or empty",
                actual: normalizedReviewerId || null
            }
        ];

        const failedChecks = checks.filter(
            (check) => check.satisfied !== true
        );

        return {
            accepted: failedChecks.length === 0,
            checks,
            failedChecks
        };
    }

    /**
     * Validates a review decision.
     *
     * @param {*} decision
     * @returns {{
     *   accepted: boolean,
     *   normalizedDecision: string,
     *   checks: Array<Object>,
     *   failedChecks: Array<Object>
     * }}
     */
    function validateDecision(decision) {
        const normalizedDecision =
            normalizeString(decision) || "Pending";

        const checks = [
            {
                checkName: "Review decision is supported",
                satisfied: VALID_DECISIONS.includes(normalizedDecision),
                expected: VALID_DECISIONS.slice(),
                actual: normalizedDecision
            }
        ];

        const failedChecks = checks.filter(
            (check) => check.satisfied !== true
        );

        return {
            accepted: failedChecks.length === 0,
            normalizedDecision,
            checks,
            failedChecks
        };
    }

    /**
     * Builds the report message.
     *
     * @param {boolean} accepted
     * @param {string} decision
     * @returns {string}
     */
    function createMessage(accepted, decision) {
        if (!accepted) {
            return (
                "The Permanent Documentation Human Review Controller " +
                "rejected the review request because one or more validation " +
                "requirements were not satisfied."
            );
        }

        if (decision === "Pending") {
            return (
                "The Permanent Documentation Human Review artifact was " +
                "created successfully and is pending a human review decision. " +
                "Disabled Mode remains enforced."
            );
        }

        return (
            `The Permanent Documentation Human Review decision ` +
            `"${decision}" was recorded successfully. ` +
            "The decision is a review artifact only. Disabled Mode remains " +
            "enforced, and no authorization or execution occurred."
        );
    }

    /**
     * Creates a Human Review report.
     *
     * @param {Object} options
     * @param {Object} options.sourceValidationReport
     * @param {string} [options.decision="Pending"]
     * @param {string} [options.comments=""]
     * @param {Object} [options.reviewer]
     * @param {string} [options.reviewer.reviewerName=""]
     * @param {string} [options.reviewer.reviewerId=""]
     * @returns {Object}
     */
    function createReview(options = {}) {
        const generatedAt = createTimestamp();

        const sourceValidationReport =
            options.sourceValidationReport;

        const decisionValidation =
            validateDecision(options.decision);

        const decision =
            decisionValidation.normalizedDecision;

        const reviewerInput = isObject(options.reviewer)
            ? options.reviewer
            : {};

        const reviewerValidation =
            validateReviewer(reviewerInput, decision);

        const sourceValidation =
            validateSourceReport(sourceValidationReport);

        const accepted =
            sourceValidation.accepted &&
            decisionValidation.accepted &&
            reviewerValidation.accepted;

        const sessionNumber = normalizeSessionNumber(
            sourceValidationReport?.sessionNumber
        );

        const reviewStartedAt =
            normalizeString(reviewerInput.reviewStartedAt) ||
            generatedAt;

        const reviewCompletedAt =
            decision === "Pending"
                ? ""
                : (
                    normalizeString(reviewerInput.reviewCompletedAt) ||
                    generatedAt
                );

        const reportId =
            `TMS-HUMAN-REVIEW-${sessionNumber || "UNKNOWN"}-` +
            createReportTimestamp(generatedAt);

        const allChecks = [
            ...sourceValidation.checks,
            ...decisionValidation.checks,
            ...reviewerValidation.checks
        ];

        const failedChecks = allChecks.filter(
            (check) => check.satisfied !== true
        );

        return {
            reportType: REPORT_TYPE,
            engineVersion: CONTROLLER_VERSION,
            controllerName: CONTROLLER_NAME,
            validationMode: "Disabled",

            reportId,
            generatedAt,

            sessionNumber,
            version: normalizeString(
                sourceValidationReport?.version
            ),
            milestone: normalizeString(
                sourceValidationReport?.milestone
            ),
            module:
                "Permanent Documentation Human Review Workflow",

            accepted,

            humanReviewStatus: accepted
                ? (
                    decision === "Pending"
                        ? "Pending Human Review — Disabled Mode"
                        : `${decision} Recorded — Disabled Mode`
                )
                : "Human Review Rejected — Disabled Mode",

            sourceValidationReportExists:
                isObject(sourceValidationReport),

            sourceValidationReportId:
                normalizeString(sourceValidationReport?.reportId),

            sourceValidationReportAccepted:
                sourceValidationReport?.accepted === true,

            sourceValidationReportSessionNumber:
                normalizeSessionNumber(
                    sourceValidationReport?.sessionNumber
                ),

            currentState:
                normalizeString(
                    sourceValidationReport?.currentState
                ),

            requestedState:
                normalizeString(
                    sourceValidationReport?.requestedState
                ),

            stateIdentitySatisfied:
                sourceValidationReport?.stateIdentitySatisfied === true,

            reviewer: {
                reviewerName:
                    normalizeString(reviewerInput.reviewerName),

                reviewerId:
                    normalizeString(reviewerInput.reviewerId),

                reviewStartedAt,

                reviewCompletedAt
            },

            review: {
                decision,
                comments: normalizeString(options.comments),

                decisionRecorded:
                    accepted && decision !== "Pending",

                reviewCompleted:
                    accepted && COMPLETED_DECISIONS.includes(decision),

                reviewArtifactOnly: true,

                authorizationEffect: "None",
                executionEffect: "None",
                permanentDocumentationEffect: "None"
            },

            disabledMode:
                createDisabledModeStatus(),

            validation: {
                accepted,
                totalCheckCount: allChecks.length,
                passedCheckCount:
                    allChecks.length - failedChecks.length,
                failedCheckCount: failedChecks.length,

                sourceValidationAccepted:
                    sourceValidation.accepted,

                decisionValidationAccepted:
                    decisionValidation.accepted,

                reviewerValidationAccepted:
                    reviewerValidation.accepted,

                checks: cloneValue(allChecks),
                failedChecks: cloneValue(failedChecks)
            },

            sourceValidationReportSnapshot:
                cloneValue(sourceValidationReport),

            message: createMessage(accepted, decision)
        };
    }

    /**
     * Creates a Pending Human Review artifact.
     *
     * @param {Object} sourceValidationReport
     * @returns {Object}
     */
    function createPendingReview(sourceValidationReport) {
        return createReview({
            sourceValidationReport,
            decision: "Pending",
            comments: "",
            reviewer: {
                reviewerName: "",
                reviewerId: ""
            }
        });
    }

    /**
     * Records an Approve review decision.
     *
     * This does not authorize or execute anything.
     *
     * @param {Object} sourceValidationReport
     * @param {Object} reviewer
     * @param {string} [comments=""]
     * @returns {Object}
     */
    function approve(
        sourceValidationReport,
        reviewer,
        comments = ""
    ) {
        return createReview({
            sourceValidationReport,
            decision: "Approve",
            reviewer,
            comments
        });
    }

    /**
     * Records a Revise review decision.
     *
     * This does not authorize or execute anything.
     *
     * @param {Object} sourceValidationReport
     * @param {Object} reviewer
     * @param {string} [comments=""]
     * @returns {Object}
     */
    function revise(
        sourceValidationReport,
        reviewer,
        comments = ""
    ) {
        return createReview({
            sourceValidationReport,
            decision: "Revise",
            reviewer,
            comments
        });
    }

    /**
     * Records a Cancel review decision.
     *
     * This does not authorize or execute anything.
     *
     * @param {Object} sourceValidationReport
     * @param {Object} reviewer
     * @param {string} [comments=""]
     * @returns {Object}
     */
    function cancel(
        sourceValidationReport,
        reviewer,
        comments = ""
    ) {
        return createReview({
            sourceValidationReport,
            decision: "Cancel",
            reviewer,
            comments
        });
    }

    /**
     * Returns controller metadata.
     *
     * @returns {Object}
     */
    function getControllerInfo() {
        return {
            controllerName: CONTROLLER_NAME,
            reportType: REPORT_TYPE,
            controllerVersion: CONTROLLER_VERSION,
            validationMode: "Disabled",
            validDecisions: VALID_DECISIONS.slice(),
            completedDecisions: COMPLETED_DECISIONS.slice(),
            permanentWritesPermitted: false,
            authorizationPermitted: false,
            executionPermitted: false,
            rollbackPermitted: false,
            restorePermitted: false,
            documentationStateChangePermitted: false
        };
    }

    const controllerApi = Object.freeze({
        controllerName: CONTROLLER_NAME,
        reportType: REPORT_TYPE,
        controllerVersion: CONTROLLER_VERSION,
        validationMode: "Disabled",

        VALID_DECISIONS: VALID_DECISIONS.slice(),

        createReview,
        createPendingReview,
        approve,
        revise,
        cancel,

        validateSourceReport,
        validateDecision,
        validateReviewer,

        getControllerInfo
    });

    global.TMSPermanentDocumentationHumanReviewController =
        controllerApi;

    console.log(
        `${CONTROLLER_NAME} v${CONTROLLER_VERSION} loaded in Disabled Mode.`
    );
})(window);