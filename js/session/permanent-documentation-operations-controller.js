/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 061 — Permanent Documentation Operations Controller v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-operations-controller.js

Purpose:
Provide the highest-level read-only operational supervision layer for the
Controlled Permanent Output architecture.

Version 1.0.0 remains permanently locked in Disabled Mode. It observes,
summarizes, validates, and reports operational state only. It never grants
execution, write, rollback, or restore authority and performs no permanent
file operations.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const CONTROLLER_MODE = "Disabled";
    const REPORT_TYPE =
        "TMS-OS Permanent Documentation Operations Report";

    let lastOperationsReport = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSPermanentDocumentationWorkflowManager
    ) {
        console.error(
            "Permanent Documentation Operations Controller could not initialize because its dependencies are unavailable."
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
            "OPERATIONS-REPORT",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function buildOperationalState(summary) {
        const components =
            summary && Array.isArray(summary.components)
                ? summary.components
                : [];

        return {
            totalComponents:
                Number(summary && summary.componentCount) || 0,

            availableComponents:
                Number(
                    summary &&
                    summary.availableComponentCount
                ) || 0,

            unavailableComponents:
                components.filter(function (item) {
                    return item.available !== true;
                }).map(function (item) {
                    return item.component;
                }),

            workflowReady:
                Boolean(summary && summary.workflowReady),

            workflowCompleted:
                Boolean(summary && summary.workflowCompleted),

            humanReviewEligible:
                Boolean(summary && summary.humanReviewEligible),

            humanApprovalGranted:
                Boolean(summary && summary.humanApprovalGranted),

            executionAuthorized:
                Boolean(summary && summary.executionAuthorized),

            writeAuthorized:
                Boolean(summary && summary.writeAuthorized),

            rollbackAuthorized:
                Boolean(summary && summary.rollbackAuthorized),

            restoreAuthorized:
                Boolean(summary && summary.restoreAuthorized),

            actualWritesAttempted:
                Boolean(summary && summary.actualWritesAttempted),

            actualRestoresAttempted:
                Boolean(summary && summary.actualRestoresAttempted),

            permanentWritesExecuted:
                Boolean(summary && summary.permanentWritesExecuted),

            restoreExecuted:
                Boolean(summary && summary.restoreExecuted)
        };
    }

    function rejectedReport(message, workflowSummary, checks) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        const operationalState =
            buildOperationalState(workflowSummary);

        return deepFreeze({
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            controllerMode: CONTROLLER_MODE,

            reportId:
                createReportId(
                    snapshot.sessionNumber,
                    generatedAt
                ),

            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceWorkflowAccepted:
                Boolean(
                    workflowSummary &&
                    workflowSummary.accepted
                ),

            sourceWorkflowId:
                workflowSummary
                    ? workflowSummary.workflowId
                    : null,

            sourceWorkflowStatus:
                workflowSummary
                    ? workflowSummary.workflowStatus
                    : "Unavailable",

            validationChecks: checks || [],

            operationalState:
                operationalState,

            operationsReady: false,
            operationsCompleted: false,
            supervisionActive: true,

            humanApprovalGranted: false,
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,

            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            operationsStatus: "Rejected",

            requiredNextAction:
                "Correct the failed workflow summary or operations-controller prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateOperationsReport(workflowSummary) {
        const sourceSummary =
            workflowSummary ||
            await window
                .TMSPermanentDocumentationWorkflowManager
                .generateWorkflowSummary();

        const checks = [];

        let sourceValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(sourceSummary)) {
            sourceValidation =
                window
                    .TMSPermanentDocumentationWorkflowManager
                    .validateWorkflowSummary(sourceSummary);
        }

        checks.push(buildCheck(
            "Workflow summary exists",
            isPlainObject(sourceSummary),
            "A Permanent Documentation Workflow Summary is required."
        ));

        checks.push(buildCheck(
            "Workflow summary accepted",
            Boolean(sourceSummary && sourceSummary.accepted),
            "The workflow summary must be accepted."
        ));

        checks.push(buildCheck(
            "Workflow summary validation accepted",
            Boolean(sourceValidation.accepted),
            "The workflow summary must pass validation."
        ));

        checks.push(buildCheck(
            "Workflow mode disabled",
            Boolean(sourceSummary) &&
                sourceSummary.workflowMode === "Disabled",
            "The workflow must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "All workflow components available",
            Boolean(sourceSummary) &&
                sourceSummary.componentCount ===
                    sourceSummary.availableComponentCount &&
                sourceSummary.componentCount > 0,
            "Every workflow component must be available."
        ));

        checks.push(buildCheck(
            "Workflow ready",
            Boolean(sourceSummary) &&
                sourceSummary.workflowReady === true,
            "The workflow must be ready."
        ));

        checks.push(buildCheck(
            "Workflow completed",
            Boolean(sourceSummary) &&
                sourceSummary.workflowCompleted === true,
            "The workflow must be completed."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(sourceSummary) &&
                sourceSummary.humanApprovalGranted === false,
            "Human approval must remain ungranted."
        ));

        checks.push(buildCheck(
            "Execution remains unauthorized",
            Boolean(sourceSummary) &&
                sourceSummary.executionAuthorized === false,
            "Execution authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(sourceSummary) &&
                sourceSummary.writeAuthorized === false,
            "Permanent write authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(sourceSummary) &&
                sourceSummary.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildCheck(
            "Restore remains unauthorized",
            Boolean(sourceSummary) &&
                sourceSummary.restoreAuthorized === false,
            "Restore authorization must remain locked."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(sourceSummary) &&
                sourceSummary.permanentWritesExecuted === false,
            "No permanent file may be modified."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(sourceSummary) &&
                sourceSummary.restoreExecuted === false,
            "No restore operation may occur."
        ));

        const accepted =
            checks.every(function (check) {
                return check.passed;
            });

        if (!accepted) {
            lastOperationsReport =
                rejectedReport(
                    "The Permanent Documentation Workflow Summary failed Operations Controller validation.",
                    sourceSummary,
                    checks
                );

            return lastOperationsReport;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();

        const generatedAt =
            new Date().toISOString();

        const operationalState =
            buildOperationalState(sourceSummary);

        lastOperationsReport =
            deepFreeze({
                reportType: REPORT_TYPE,
                engineVersion: ENGINE_VERSION,
                controllerMode: CONTROLLER_MODE,

                reportId:
                    createReportId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,

                accepted: true,

                message:
                    "The complete permanent documentation operation is available for supervised human review in Disabled mode. No authority was granted and no permanent file operations occurred.",

                sourceWorkflowAccepted: true,
                sourceWorkflowId:
                    sourceSummary.workflowId,
                sourceWorkflowStatus:
                    sourceSummary.workflowStatus,
                sourceWorkflowGeneratedAt:
                    sourceSummary.generatedAt,

                validationChecks: checks,

                operationalState:
                    operationalState,

                operationsReady: true,
                operationsCompleted: true,
                supervisionActive: true,

                humanApprovalGranted: false,
                authorizationGranted: false,
                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,
                restoreAuthorized: false,

                actualWritesAttempted: false,
                actualRestoresAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                operationsStatus:
                    "Ready for Supervised Human Review — Disabled",

                requiredNextAction:
                    "Review the complete disabled operational state. Any future write-enabled or restore-enabled design requires a separate approved milestone.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Operations Controller Structure",
                    "Revise Session",
                    "Cancel Operations Report"
                ]
            });

        return lastOperationsReport;
    }

    function validateOperationsReport(report) {
        const current =
            report || lastOperationsReport;

        const checks = [];

        checks.push(buildCheck(
            "Operations report exists",
            isPlainObject(current),
            "A Permanent Documentation Operations Report is required."
        ));

        checks.push(buildCheck(
            "Operations report accepted",
            Boolean(current && current.accepted),
            "The operations report must be accepted."
        ));

        checks.push(buildCheck(
            "Controller mode disabled",
            Boolean(current) &&
                current.controllerMode === CONTROLLER_MODE,
            "Version 1.0.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Operations ready",
            Boolean(current) &&
                current.operationsReady === true,
            "The operational state must be ready."
        ));

        checks.push(buildCheck(
            "Operations completed",
            Boolean(current) &&
                current.operationsCompleted === true,
            "The operational review must be completed."
        ));

        checks.push(buildCheck(
            "Supervision active",
            Boolean(current) &&
                current.supervisionActive === true,
            "Read-only operational supervision must be active."
        ));

        checks.push(buildCheck(
            "Human approval remains ungranted",
            Boolean(current) &&
                current.humanApprovalGranted === false,
            "Human approval must remain ungranted."
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
            "No actual writes attempted",
            Boolean(current) &&
                current.actualWritesAttempted === false,
            "No actual write may be attempted."
        ));

        checks.push(buildCheck(
            "No actual restores attempted",
            Boolean(current) &&
                current.actualRestoresAttempted === false,
            "No actual restore may be attempted."
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

    async function formatOperationsReport(report) {
        const current =
            report ||
            await generateOperationsReport();

        const state =
            current.operationalState || {};

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION OPERATIONS REPORT",
            "Report ID: " + current.reportId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Controller Mode: " +
                current.controllerMode,
            "Operations Status: " +
                current.operationsStatus,
            "Total Components: " +
                (state.totalComponents || 0),
            "Available Components: " +
                (state.availableComponents || 0),
            "Operations Ready: " +
                (current.operationsReady ? "YES" : "NO"),
            "Operations Completed: " +
                (current.operationsCompleted ? "YES" : "NO"),
            "Supervision Active: " +
                (current.supervisionActive ? "YES" : "NO"),
            "Human Approval Granted: NO",
            "Authorization Granted: NO",
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Restore Authorized: NO",
            "Actual Writes Attempted: NO",
            "Actual Restores Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        if (
            Array.isArray(state.unavailableComponents) &&
            state.unavailableComponents.length > 0
        ) {
            lines.push(
                "Unavailable Components: " +
                state.unavailableComponents.join(", ")
            );
        }

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

    function getLastOperationsReport() {
        return lastOperationsReport;
    }

    function getOperationalState(report) {
        const current =
            report || lastOperationsReport;

        return current
            ? clone(current.operationalState)
            : null;
    }

    window.TMSPermanentDocumentationOperationsController =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            controllerMode:
                CONTROLLER_MODE,

            generateOperationsReport:
                generateOperationsReport,

            validateOperationsReport:
                validateOperationsReport,

            formatOperationsReport:
                formatOperationsReport,

            getLastOperationsReport:
                getLastOperationsReport,

            getOperationalState:
                getOperationalState
        });

    console.log(
        "Permanent Documentation Operations Controller v" +
        ENGINE_VERSION +
        " initialized in " +
        CONTROLLER_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
