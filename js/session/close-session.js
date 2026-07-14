/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 045 — Session Closure Gate Foundation v1.0
File: js/session/close-session.js

Purpose:
Enforce the human approval gate for the two-stage session-closing workflow.
This foundation records approval state and produces closure result objects.
It does not update permanent documents, create ZIP files, perform Git actions,
create release tags, or execute final irreversible session closure.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const ACTIVE_STATUS = "Active";
    const PREPARED_STATUS = "Prepared for Review";
    const APPROVED_STATUS = "Closure Approved";

    if (!window.TMSSessionContext || !window.TMSSessionManager || !window.TMSSessionPreparer) {
        console.error("Session Closure Gate could not initialize because its session dependencies are unavailable.");
        return;
    }

    const context = window.TMSSessionContext;
    const manager = window.TMSSessionManager;
    const preparer = window.TMSSessionPreparer;
    let lastResult = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
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

    function buildResult(action, accepted, message, previousStatus, currentStatus, reviewPackage) {
        const snapshot = context.getSnapshot();
        const result = {
            resultType: "TMS-OS Session Closure Gate Result",
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            action: action,
            accepted: accepted,
            message: message,
            sessionNumber: snapshot.sessionNumber,
            previousStatus: previousStatus,
            currentStatus: currentStatus,
            humanApprovalRecorded: action === "Approve & Close" && accepted,
            permanentActionsExecuted: false,
            permanentActionsPending: action === "Approve & Close" && accepted,
            reviewPackage: reviewPackage || null
        };

        lastResult = deepFreeze(clone(result));
        return lastResult;
    }

    function approveAndClose() {
        const before = context.getSnapshot();

        if (before.status !== PREPARED_STATUS) {
            return buildResult(
                "Approve & Close",
                false,
                "Approval was rejected because the session is not Prepared for Review.",
                before.status,
                before.status,
                null
            );
        }

        const validation = preparer.validate();
        if (!validation.readyForReview) {
            return buildResult(
                "Approve & Close",
                false,
                "Approval was rejected because the session readiness validation did not pass.",
                before.status,
                before.status,
                preparer.generateReviewPackage()
            );
        }

        manager.setSessionStatus(APPROVED_STATUS);
        const reviewPackage = preparer.generateReviewPackage();

        return buildResult(
            "Approve & Close",
            true,
            "Human approval was recorded. Permanent actions remain pending for a later automation layer.",
            before.status,
            APPROVED_STATUS,
            reviewPackage
        );
    }

    function revise() {
        const before = context.getSnapshot();

        if (before.status !== PREPARED_STATUS && before.status !== APPROVED_STATUS) {
            return buildResult(
                "Revise",
                false,
                "Revision was rejected because the session is already Active.",
                before.status,
                before.status,
                null
            );
        }

        manager.setSessionStatus(ACTIVE_STATUS);
        return buildResult(
            "Revise",
            true,
            "The session returned to Active work. No permanent actions were executed.",
            before.status,
            ACTIVE_STATUS,
            preparer.generateReviewPackage()
        );
    }

    function cancel() {
        const before = context.getSnapshot();

        if (before.status === APPROVED_STATUS) {
            return buildResult(
                "Cancel",
                false,
                "Cancellation was rejected because human approval has already been recorded. Use Revise to return to Active work.",
                before.status,
                before.status,
                null
            );
        }

        if (before.status === PREPARED_STATUS) {
            manager.setSessionStatus(ACTIVE_STATUS);
            return buildResult(
                "Cancel",
                true,
                "The closure review was cancelled and the session remains open as Active.",
                before.status,
                ACTIVE_STATUS,
                preparer.generateReviewPackage()
            );
        }

        return buildResult(
            "Cancel",
            true,
            "No closure review was active. The session remains open as Active.",
            before.status,
            before.status,
            null
        );
    }

    function getAvailableActions() {
        const status = context.getSnapshot().status;
        return deepFreeze({
            status: status,
            actions: status === PREPARED_STATUS
                ? ["Approve & Close", "Revise", "Cancel"]
                : status === APPROVED_STATUS
                    ? ["Revise"]
                    : ["Prepare Session"]
        });
    }

    function getLastResult() {
        return lastResult;
    }

    window.TMSSessionCloser = Object.freeze({
        engineVersion: ENGINE_VERSION,
        approveAndClose: approveAndClose,
        revise: revise,
        cancel: cancel,
        getAvailableActions: getAvailableActions,
        getLastResult: getLastResult
    });

    console.log("Session Closure Gate v" + ENGINE_VERSION + " initialized for Work Session " + context.getSnapshot().sessionNumber + ".");
}());
