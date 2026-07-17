/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 065 — Permanent Documentation State Transition Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-state-transition-controller.js

Purpose:
Define, inspect, and validate proposed movement between Permanent Documentation
System states without changing state.

Version 1.0.0 remains permanently locked in Disabled Mode. It evaluates
proposed transitions only. It never applies state changes, grants authority,
authorizes execution, writes files, restores files, or modifies permanent
documentation.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const TRANSITION_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation State Transition Report";

    const APPROVED_STATES = Object.freeze([
        "Session Start",
        "Preparation",
        "Validation",
        "Documentation Generation",
        "Review",
        "Approval",
        "Execution Authorization",
        "Permanent Write",
        "Verification",
        "Rollback Availability",
        "Historical Completion"
    ]);

    let lastTransitionReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationStateManager
    ) {
        console.error(
            "Permanent Documentation State Transition Controller could not initialize because its dependencies are unavailable."
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

    function createReportId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "STATE-TRANSITION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function normalizeTransitionRequest(request, snapshot) {
        const lifecycleState =
            snapshot &&
            snapshot.lifecycleState
                ? snapshot.lifecycleState
                : {};

        const currentState =
            lifecycleState.currentPhase ||
            "Unavailable";

        const requestedState =
            request &&
            typeof request.requestedState === "string"
                ? request.requestedState
                : null;

        return {
            currentState: currentState,
            requestedState: requestedState,
            reason:
                request &&
                typeof request.reason === "string"
                    ? request.reason
                    : "No reason supplied",
            requestedBy:
                request &&
                typeof request.requestedBy === "string"
                    ? request.requestedBy
                    : "Unspecified",
            requestedAt:
                new Date().toISOString()
        };
    }

    function evaluateTransitionPath(currentState, requestedState) {
        const currentIndex =
            APPROVED_STATES.indexOf(currentState);

        const requestedIndex =
            APPROVED_STATES.indexOf(requestedState);

        const currentKnown =
            currentIndex !== -1;

        const requestedKnown =
            requestedIndex !== -1;

        const nextSequentialState =
            currentKnown &&
            currentIndex + 1 < APPROVED_STATES.length
                ? APPROVED_STATES[currentIndex + 1]
                : null;

        const sequential =
            currentKnown &&
            requestedKnown &&
            requestedIndex === currentIndex + 1;

        const sameState =
            currentKnown &&
            requestedKnown &&
            requestedIndex === currentIndex;

        const backward =
            currentKnown &&
            requestedKnown &&
            requestedIndex < currentIndex;

        const skipped =
            currentKnown &&
            requestedKnown &&
            requestedIndex > currentIndex + 1;

        return {
            currentKnown: currentKnown,
            requestedKnown: requestedKnown,
            currentIndex: currentIndex,
            requestedIndex: requestedIndex,
            nextSequentialState: nextSequentialState,
            sequential: sequential,
            sameState: sameState,
            backward: backward,
            skipped: skipped
        };
    }

    function rejectedReport(
        message,
        stateSnapshot,
        transitionRequest,
        checks,
        pathEvaluation
    ) {
        const sessionSnapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            transitionMode: TRANSITION_MODE,

            reportId:
                createReportId(
                    sessionSnapshot.sessionNumber,
                    generatedAt
                ),

            generatedAt: generatedAt,
            sessionNumber:
                sessionSnapshot.sessionNumber,

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

            transitionRequest:
                transitionRequest,

            pathEvaluation:
                pathEvaluation,

            validationChecks:
                checks || [],

            transitionKnown: false,
            transitionSequential: false,
            transitionEligible: false,
            transitionApproved: false,
            transitionApplied: false,

            humanApprovalGranted: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,

            actualStateChangeAttempted: false,
            actualStateChangeApplied: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            transitionStatus: "Rejected",

            requiredNextAction:
                "Correct the failed state snapshot, transition request, or transition prerequisite checks.",

            reviewRequired: true
        });
    }

    async function evaluateTransition(request, stateSnapshot) {
        const sourceSnapshot =
            stateSnapshot ||
            await window
                .TMSPermanentDocumentationStateManager
                .generateStateSnapshot();

        const transitionRequest =
            normalizeTransitionRequest(
                request,
                sourceSnapshot
            );

        const pathEvaluation =
            evaluateTransitionPath(
                transitionRequest.currentState,
                transitionRequest.requestedState
            );

        const checks = [];

        let sourceValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(sourceSnapshot)) {
            sourceValidation =
                window
                    .TMSPermanentDocumentationStateManager
                    .validateStateSnapshot(sourceSnapshot);
        }

        checks.push(buildCheck(
            "State snapshot exists",
            isPlainObject(sourceSnapshot),
            "An authoritative State Manager snapshot is required."
        ));

        checks.push(buildCheck(
            "State snapshot accepted",
            Boolean(sourceSnapshot && sourceSnapshot.accepted),
            "The state snapshot must be accepted."
        ));

        checks.push(buildCheck(
            "State snapshot validation accepted",
            Boolean(sourceValidation.accepted),
            "The state snapshot must pass validation."
        ));

        checks.push(buildCheck(
            "State mode disabled",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.stateMode === "Disabled",
            "The State Manager must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Current state known",
            pathEvaluation.currentKnown,
            "The current lifecycle state must be recognized."
        ));

        checks.push(buildCheck(
            "Requested state supplied",
            Boolean(transitionRequest.requestedState),
            "A requested target state is required."
        ));

        checks.push(buildCheck(
            "Requested state known",
            pathEvaluation.requestedKnown,
            "The requested lifecycle state must be recognized."
        ));

        checks.push(buildCheck(
            "Transition is sequential",
            pathEvaluation.sequential,
            "The proposed transition must move to the next approved lifecycle state."
        ));

        checks.push(buildCheck(
            "Human approval remains locked",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.humanApprovalLocked === true,
            "Human approval must remain locked."
        ));

        checks.push(buildCheck(
            "Execution remains locked",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.executionLocked === true,
            "Execution must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains locked",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.writeLocked === true,
            "Permanent writes must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains locked",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.rollbackLocked === true,
            "Rollback execution must remain locked."
        ));

        checks.push(buildCheck(
            "Restore remains locked",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.restoreLocked === true,
            "Restore execution must remain locked."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.permanentWriteExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(sourceSnapshot) &&
                sourceSnapshot.safetyLocks &&
                sourceSnapshot.safetyLocks.restoreExecuted === false,
            "No restore operation may occur."
        ));

        const accepted =
            checks.every(function (check) {
                return check.passed;
            });

        if (!accepted) {
            lastTransitionReport =
                rejectedReport(
                    "The proposed state transition failed State Transition Controller validation.",
                    sourceSnapshot,
                    transitionRequest,
                    checks,
                    pathEvaluation
                );

            return lastTransitionReport;
        }

        const sessionSnapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        lastTransitionReport =
            deepFreeze({
                reportType: REPORT_TYPE,
                engineVersion: ENGINE_VERSION,
                transitionMode: TRANSITION_MODE,

                reportId:
                    createReportId(
                        sessionSnapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt: generatedAt,
                sessionNumber:
                    sessionSnapshot.sessionNumber,

                accepted: true,

                message:
                    "The proposed state transition is structurally valid for review. Version 1.0.0 does not approve or apply state changes.",

                sourceStateAccepted: true,
                sourceStateSnapshotId:
                    sourceSnapshot.snapshotId,
                sourceStateStatus:
                    sourceSnapshot.stateStatus,
                sourceStateGeneratedAt:
                    sourceSnapshot.generatedAt,

                transitionRequest:
                    transitionRequest,

                pathEvaluation:
                    pathEvaluation,

                validationChecks:
                    checks,

                transitionKnown: true,
                transitionSequential: true,
                transitionEligible: true,
                transitionApproved: false,
                transitionApplied: false,

                humanApprovalGranted: false,
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,
                restoreAuthorized: false,

                actualStateChangeAttempted: false,
                actualStateChangeApplied: false,
                actualWritesAttempted: false,
                actualRestoresAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                transitionStatus:
                    "Eligible for Human Review — Transition Locked",

                requiredNextAction:
                    "Review the proposed transition. Any future transition application requires a separate approved milestone.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Transition Controller Structure",
                    "Revise Transition Request",
                    "Cancel Transition Review"
                ]
            });

        return lastTransitionReport;
    }

    function validateTransitionReport(report) {
        const current =
            report || lastTransitionReport;

        const checks = [];

        checks.push(buildCheck(
            "Transition report exists",
            isPlainObject(current),
            "A State Transition Report is required."
        ));

        checks.push(buildCheck(
            "Transition report accepted",
            Boolean(current && current.accepted),
            "The transition report must be accepted."
        ));

        checks.push(buildCheck(
            "Transition mode disabled",
            Boolean(current) &&
                current.transitionMode === TRANSITION_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Transition known",
            Boolean(current) &&
                current.transitionKnown === true,
            "The proposed transition must use approved states."
        ));

        checks.push(buildCheck(
            "Transition sequential",
            Boolean(current) &&
                current.transitionSequential === true,
            "The proposed transition must be sequential."
        ));

        checks.push(buildCheck(
            "Transition eligible",
            Boolean(current) &&
                current.transitionEligible === true,
            "The proposed transition must be eligible for review."
        ));

        checks.push(buildCheck(
            "Transition remains unapproved",
            Boolean(current) &&
                current.transitionApproved === false,
            "Version 1.0.0 must not approve a real transition."
        ));

        checks.push(buildCheck(
            "Transition remains unapplied",
            Boolean(current) &&
                current.transitionApplied === false,
            "Version 1.0.0 must not apply a real transition."
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
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(current) &&
                current.restoreAuthorized === false,
            "Restore authorization must remain locked."
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

    async function formatTransitionReport(report) {
        const current =
            report ||
            await evaluateTransition({
                requestedState: null
            });

        const request =
            current.transitionRequest || {};

        const path =
            current.pathEvaluation || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION STATE TRANSITION REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Transition Mode: " +
                current.transitionMode,
            "Transition Status: " +
                current.transitionStatus,
            "Current State: " +
                (request.currentState || "Unavailable"),
            "Requested State: " +
                (request.requestedState || "Unavailable"),
            "Next Sequential State: " +
                (path.nextSequentialState || "Unavailable"),
            "Transition Known: " +
                (current.transitionKnown ? "YES" : "NO"),
            "Transition Sequential: " +
                (current.transitionSequential ? "YES" : "NO"),
            "Transition Eligible: " +
                (current.transitionEligible ? "YES" : "NO"),
            "Transition Approved: NO",
            "Transition Applied: NO",
            "Human Approval Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual State Change Attempted: NO",
            "Actual State Change Applied: NO",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

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

    function getLastTransitionReport() {
        return lastTransitionReport;
    }

    function getApprovedStates() {
        return APPROVED_STATES.slice();
    }

    function getNextState(currentState) {
        const index =
            APPROVED_STATES.indexOf(currentState);

        if (
            index === -1 ||
            index + 1 >= APPROVED_STATES.length
        ) {
            return null;
        }

        return APPROVED_STATES[index + 1];
    }

    window.TMSPermanentDocumentationStateTransitionController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            transitionMode:
                TRANSITION_MODE,

            evaluateTransition:
                evaluateTransition,

            validateTransitionReport:
                validateTransitionReport,

            formatTransitionReport:
                formatTransitionReport,

            getLastTransitionReport:
                getLastTransitionReport,

            getApprovedStates:
                getApprovedStates,

            getNextState:
                getNextState
        });

    console.log(
        "Permanent Documentation State Transition Controller v" +
        ENGINE_VERSION +
        " initialized in " +
        TRANSITION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
