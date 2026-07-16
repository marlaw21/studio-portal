/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 060 — Permanent Documentation Workflow Manager v1.0.0
Disabled Foundation
File: js/session/permanent-documentation-workflow-manager.js
*/
(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const WORKFLOW_MODE = "Disabled";
    const WORKFLOW_TYPE = "TMS-OS Permanent Documentation Workflow Summary";

    const COMPONENTS = Object.freeze([
        ["Session Context Engine", "TMSSessionContext"],
        ["Document Update Engine", "TMSDocumentUpdateEngine"],
        ["Document Writer Registry", "TMSDocumentWriterRegistry"],
        ["Permanent Transaction Manager", "TMSPermanentTransactionManager"],
        ["Rollback Package Generator", "TMSRollbackPackageGenerator"],
        ["Original Document Capture Engine", "TMSOriginalDocumentCaptureEngine"],
        ["Controlled Execution Engine", "TMSControlledExecutionEngine"],
        ["Permanent File Writer", "TMSPermanentFileWriter"],
        ["Execution Verification Engine", "TMSExecutionVerificationEngine"],
        ["Execution Authorization Engine", "TMSExecutionAuthorizationEngine"],
        ["Permanent Write Execution Engine", "TMSPermanentWriteExecutionEngine"],
        ["Rollback Execution Engine", "TMSRollbackExecutionEngine"],
        ["Permanent Output Orchestrator", "TMSPermanentOutputOrchestrator"],
        ["Pipeline Review Package Generator", "TMSPipelineReviewPackageGenerator"],
        ["Final Human Approval Gateway", "TMSFinalHumanApprovalGateway"]
    ]);

    let lastWorkflowSummary = null;

    const missing = COMPONENTS.filter(function (item) {
        return !window[item[1]];
    });

    if (missing.length > 0) {
        console.error(
            "Permanent Documentation Workflow Manager could not initialize because dependencies are unavailable:",
            missing.map(function (item) { return item[0]; })
        );
        return;
    }

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

    function check(name, passed, message) {
        return { name: name, passed: Boolean(passed), message: message };
    }

    function workflowId(sessionNumber, generatedAt) {
        return "TMS-WORKFLOW-SUMMARY-" +
            String(sessionNumber).padStart(3, "0") + "-" +
            generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
    }

    function inventory() {
        return COMPONENTS.map(function (item, index) {
            return {
                sequence: index + 1,
                component: item[0],
                globalName: item[1],
                available: Boolean(window[item[1]])
            };
        });
    }

    function rejected(message, gateway, checks) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();
        const items = inventory();

        return deepFreeze({
            workflowType: WORKFLOW_TYPE,
            engineVersion: ENGINE_VERSION,
            workflowMode: WORKFLOW_MODE,
            workflowId: workflowId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourceGatewayAccepted: Boolean(gateway && gateway.accepted),
            sourceGatewayId: gateway ? gateway.gatewayId : null,
            validationChecks: checks || [],
            componentCount: items.length,
            availableComponentCount: items.filter(function (item) {
                return item.available;
            }).length,
            components: items,
            workflowReady: false,
            workflowCompleted: false,
            humanReviewEligible: false,
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
            workflowStatus: "Rejected",
            requiredNextAction: "Correct the failed gateway package or workflow prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateWorkflowSummary(gatewayPackage) {
        const gateway = gatewayPackage ||
            await window.TMSFinalHumanApprovalGateway.generateGatewayPackage();

        const gatewayValidation = gateway &&
            window.TMSFinalHumanApprovalGateway.validateGatewayPackage(gateway);
        const items = inventory();

        const checks = [
            check("Gateway package accepted", gateway && gateway.accepted === true,
                "The Final Human Approval Gateway package must be accepted."),
            check("Gateway validation accepted", gatewayValidation && gatewayValidation.accepted === true,
                "The Final Human Approval Gateway package must pass validation."),
            check("Gateway remains disabled", gateway && gateway.gatewayMode === "Disabled",
                "The gateway must remain in Disabled mode."),
            check("Human review eligible", gateway && gateway.humanReviewEligible === true,
                "The package must be eligible for human review."),
            check("Human approval remains ungranted", gateway && gateway.humanApprovalGranted === false,
                "Human approval must remain ungranted."),
            check("Write remains unauthorized", gateway && gateway.writeAuthorized === false,
                "Permanent writing must remain unauthorized."),
            check("Rollback remains unauthorized", gateway && gateway.rollbackAuthorized === false,
                "Rollback must remain unauthorized."),
            check("Restore remains unauthorized", gateway && gateway.restoreAuthorized === false,
                "Restore must remain unauthorized."),
            check("No permanent writes executed", gateway && gateway.permanentWritesExecuted === false,
                "No permanent file may be modified."),
            check("No restore executed", gateway && gateway.restoreExecuted === false,
                "No restore operation may occur."),
            check("All components available", items.every(function (item) { return item.available; }),
                "Every required workflow component must be available.")
        ];

        if (!checks.every(function (item) { return item.passed; })) {
            lastWorkflowSummary = rejected(
                "The Final Human Approval Gateway package failed Workflow Manager validation.",
                gateway,
                checks
            );
            return lastWorkflowSummary;
        }

        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        lastWorkflowSummary = deepFreeze({
            workflowType: WORKFLOW_TYPE,
            engineVersion: ENGINE_VERSION,
            workflowMode: WORKFLOW_MODE,
            workflowId: workflowId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: true,
            message: "The complete permanent documentation workflow is ready for human review in Disabled mode. No authority was granted and no permanent file operations occurred.",
            sourceGatewayAccepted: true,
            sourceGatewayId: gateway.gatewayId,
            validationChecks: checks,
            componentCount: items.length,
            availableComponentCount: items.length,
            components: items,
            workflowReady: true,
            workflowCompleted: true,
            humanReviewEligible: true,
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
            workflowStatus: "Ready for Human Review — Disabled",
            requiredNextAction: "Review the disabled workflow. Any future write-enabled or restore-enabled design requires a separate approved milestone.",
            reviewRequired: true,
            reviewChoices: [
                "Approve Workflow Manager Structure",
                "Revise Session",
                "Cancel Workflow Summary"
            ]
        });

        return lastWorkflowSummary;
    }

    function validateWorkflowSummary(summary) {
        const current = summary || lastWorkflowSummary;
        const checks = [
            check("Workflow summary exists", Boolean(current), "A workflow summary is required."),
            check("Workflow summary accepted", current && current.accepted === true, "The summary must be accepted."),
            check("Workflow mode disabled", current && current.workflowMode === WORKFLOW_MODE, "The workflow must remain disabled."),
            check("All components available", current && current.availableComponentCount === current.componentCount && current.componentCount === COMPONENTS.length, "Every component must be available."),
            check("Workflow ready", current && current.workflowReady === true, "The workflow must be ready."),
            check("Workflow completed", current && current.workflowCompleted === true, "The workflow must be complete."),
            check("Human approval remains ungranted", current && current.humanApprovalGranted === false, "Human approval must remain ungranted."),
            check("Execution remains unauthorized", current && current.executionAuthorized === false, "Execution must remain unauthorized."),
            check("Write remains unauthorized", current && current.writeAuthorized === false, "Writing must remain unauthorized."),
            check("Rollback remains unauthorized", current && current.rollbackAuthorized === false, "Rollback must remain unauthorized."),
            check("Restore remains unauthorized", current && current.restoreAuthorized === false, "Restore must remain unauthorized."),
            check("No permanent writes executed", current && current.permanentWritesExecuted === false, "No permanent file may be modified."),
            check("No restore executed", current && current.restoreExecuted === false, "No restore may occur.")
        ];

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (item) { return item.passed; }),
            checks: checks
        });
    }

    async function formatWorkflowSummary(summary) {
        const current = summary || await generateWorkflowSummary();
        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION WORKFLOW SUMMARY",
            "Workflow ID: " + current.workflowId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Workflow Mode: " + current.workflowMode,
            "Workflow Status: " + current.workflowStatus,
            "Components: " + current.componentCount,
            "Available Components: " + current.availableComponentCount,
            "Workflow Ready: " + (current.workflowReady ? "YES" : "NO"),
            "Workflow Completed: " + (current.workflowCompleted ? "YES" : "NO"),
            "Human Review Eligible: " + (current.humanReviewEligible ? "YES" : "NO"),
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

        (current.components || []).forEach(function (item) {
            lines.push(
                item.sequence + " | " + item.component + " | " +
                (item.available ? "AVAILABLE" : "MISSING")
            );
        });

        if (current.requiredNextAction) {
            lines.push("Required Next Action: " + current.requiredNextAction);
        }
        if (current.reviewChoices) {
            lines.push("Review Choices: " + current.reviewChoices.join(" | "));
        }
        return lines.join("\n");
    }

    function getLastWorkflowSummary() {
        return lastWorkflowSummary;
    }

    function getComponentInventory() {
        return clone(inventory());
    }

    window.TMSPermanentDocumentationWorkflowManager = Object.freeze({
        engineVersion: ENGINE_VERSION,
        workflowMode: WORKFLOW_MODE,
        generateWorkflowSummary: generateWorkflowSummary,
        validateWorkflowSummary: validateWorkflowSummary,
        formatWorkflowSummary: formatWorkflowSummary,
        getLastWorkflowSummary: getLastWorkflowSummary,
        getComponentInventory: getComponentInventory
    });

    console.log(
        "Permanent Documentation Workflow Manager v" +
        ENGINE_VERSION +
        " initialized in " +
        WORKFLOW_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
