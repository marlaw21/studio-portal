/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 059 — Final Human Approval Gateway v1.0.0
Disabled Foundation
File: js/session/final-human-approval-gateway.js
*/
(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const GATEWAY_MODE = "Disabled";
    const GATEWAY_TYPE = "TMS-OS Final Human Approval Gateway Package";
    let lastGatewayPackage = null;

    if (!window.TMSSessionContext || !window.TMSPipelineReviewPackageGenerator) {
        console.error("Final Human Approval Gateway could not initialize because its dependencies are unavailable.");
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

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function buildCheck(name, passed, message) {
        return { name: name, passed: Boolean(passed), message: message };
    }

    function createGatewayId(sessionNumber, generatedAt) {
        const timestamp = generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
        return ["TMS", "FINAL-HUMAN-APPROVAL", String(sessionNumber).padStart(3, "0"), timestamp].join("-");
    }

    function validateReviewPackage(reviewPackage) {
        const checks = [];
        let packageValidation = { accepted: false, checks: [] };

        if (isPlainObject(reviewPackage)) {
            packageValidation = window.TMSPipelineReviewPackageGenerator.validateReviewPackage(reviewPackage);
        }

        checks.push(buildCheck("Review package exists", isPlainObject(reviewPackage), "A consolidated pipeline review package is required."));
        checks.push(buildCheck("Review package accepted", Boolean(reviewPackage && reviewPackage.accepted), "The consolidated review package must be accepted."));
        checks.push(buildCheck("Review package validation accepted", Boolean(packageValidation && packageValidation.accepted), "The consolidated review package must pass validation."));
        checks.push(buildCheck("Package mode disabled", Boolean(reviewPackage) && reviewPackage.packageMode === "Disabled", "The source package must remain in Disabled mode."));
        checks.push(buildCheck("Pipeline ready", Boolean(reviewPackage) && reviewPackage.pipelineReady === true, "The pipeline must be ready."));
        checks.push(buildCheck("Pipeline completed", Boolean(reviewPackage) && reviewPackage.pipelineCompleted === true, "The pipeline must be completed."));
        checks.push(buildCheck("Package ready", Boolean(reviewPackage) && reviewPackage.packageReady === true, "The review package must be ready."));
        checks.push(buildCheck("Authorization locked", Boolean(reviewPackage) && reviewPackage.authorizationGranted === false, "Authorization must remain locked."));
        checks.push(buildCheck("Execution locked", Boolean(reviewPackage) && reviewPackage.executionAuthorized === false, "Execution must remain locked."));
        checks.push(buildCheck("Write locked", Boolean(reviewPackage) && reviewPackage.writeAuthorized === false, "Writing must remain locked."));
        checks.push(buildCheck("Rollback locked", Boolean(reviewPackage) && reviewPackage.rollbackAuthorized === false, "Rollback must remain locked."));
        checks.push(buildCheck("Restore locked", Boolean(reviewPackage) && reviewPackage.restoreAuthorized === false, "Restore must remain locked."));
        checks.push(buildCheck("No writes attempted", Boolean(reviewPackage) && reviewPackage.actualWritesAttempted === false, "No write may be attempted."));
        checks.push(buildCheck("No restores attempted", Boolean(reviewPackage) && reviewPackage.actualRestoresAttempted === false, "No restore may be attempted."));
        checks.push(buildCheck("No permanent writes", Boolean(reviewPackage) && reviewPackage.permanentWritesExecuted === false, "No permanent write may occur."));
        checks.push(buildCheck("No restore executed", Boolean(reviewPackage) && reviewPackage.restoreExecuted === false, "No restore may occur."));

        return {
            accepted: checks.every(function (check) { return check.passed; }),
            checks: checks,
            packageValidation: packageValidation
        };
    }

    function rejectedGateway(message, reviewPackage, validation) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            gatewayType: GATEWAY_TYPE,
            engineVersion: ENGINE_VERSION,
            gatewayMode: GATEWAY_MODE,
            gatewayId: createGatewayId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            sourcePackageAccepted: Boolean(reviewPackage && reviewPackage.accepted),
            sourcePackageId: reviewPackage ? reviewPackage.packageId : null,
            validationAccepted: Boolean(validation && validation.accepted),
            validationChecks: validation ? validation.checks : [],
            humanReviewEligible: false,
            humanDecisionRecorded: false,
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
            gatewayStatus: "Rejected",
            requiredNextAction: "Correct the failed consolidated review package or gateway prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateGatewayPackage(reviewPackage) {
        const sourcePackage = reviewPackage || await window.TMSPipelineReviewPackageGenerator.generateReviewPackage();
        const validation = validateReviewPackage(sourcePackage);

        if (!validation.accepted) {
            lastGatewayPackage = rejectedGateway(
                "The consolidated Pipeline Review Package failed Final Human Approval Gateway validation.",
                sourcePackage,
                validation
            );
            return lastGatewayPackage;
        }

        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        lastGatewayPackage = deepFreeze({
            gatewayType: GATEWAY_TYPE,
            engineVersion: ENGINE_VERSION,
            gatewayMode: GATEWAY_MODE,
            gatewayId: createGatewayId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,
            accepted: true,
            message: "The consolidated pipeline review is eligible for final human review. Version 1.0.0 grants no execution authority.",
            sourcePackageAccepted: true,
            sourcePackageId: sourcePackage.packageId,
            sourcePackageStatus: sourcePackage.packageStatus,
            validationAccepted: true,
            validationChecks: validation.checks,
            pipelineStageCount: sourcePackage.pipelineStageCount,
            completedStageCount: sourcePackage.completedStageCount,
            humanReviewEligible: true,
            humanDecisionRecorded: false,
            humanApprovalGranted: false,
            approvalDecision: "Not Granted",
            approvalStatus: "Locked — Awaiting Separate Human Decision",
            authorizationGranted: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,
            restoreAuthorized: false,
            actualWritesAttempted: false,
            actualRestoresAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,
            gatewayStatus: "Eligible for Human Review — Approval Locked",
            requiredNextAction: "Present this package for human review. Version 1.0.0 must remain non-executing.",
            reviewRequired: true,
            reviewChoices: ["Approve Gateway Structure", "Revise Session", "Cancel Gateway Package"]
        });

        return lastGatewayPackage;
    }

    function validateGatewayPackage(gatewayPackage) {
        const current = gatewayPackage || lastGatewayPackage;
        const checks = [];

        checks.push(buildCheck("Gateway package exists", isPlainObject(current), "A gateway package is required."));
        checks.push(buildCheck("Gateway package accepted", Boolean(current && current.accepted), "The gateway package must be accepted."));
        checks.push(buildCheck("Gateway mode disabled", Boolean(current) && current.gatewayMode === GATEWAY_MODE, "The gateway must remain disabled."));
        checks.push(buildCheck("Human review eligible", Boolean(current) && current.humanReviewEligible === true, "The package must be eligible for human review."));
        checks.push(buildCheck("Human decision unrecorded", Boolean(current) && current.humanDecisionRecorded === false, "No real execution decision may be recorded."));
        checks.push(buildCheck("Human approval ungranted", Boolean(current) && current.humanApprovalGranted === false, "No real execution approval may be granted."));
        checks.push(buildCheck("Authorization locked", Boolean(current) && current.authorizationGranted === false, "Authorization must remain locked."));
        checks.push(buildCheck("Execution locked", Boolean(current) && current.executionAuthorized === false, "Execution must remain locked."));
        checks.push(buildCheck("Write locked", Boolean(current) && current.writeAuthorized === false, "Writing must remain locked."));
        checks.push(buildCheck("Rollback locked", Boolean(current) && current.rollbackAuthorized === false, "Rollback must remain locked."));
        checks.push(buildCheck("Restore locked", Boolean(current) && current.restoreAuthorized === false, "Restore must remain locked."));
        checks.push(buildCheck("No writes attempted", Boolean(current) && current.actualWritesAttempted === false, "No write may be attempted."));
        checks.push(buildCheck("No restores attempted", Boolean(current) && current.actualRestoresAttempted === false, "No restore may be attempted."));
        checks.push(buildCheck("No permanent writes", Boolean(current) && current.permanentWritesExecuted === false, "No permanent write may occur."));
        checks.push(buildCheck("No restore executed", Boolean(current) && current.restoreExecuted === false, "No restore may occur."));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) { return check.passed; }),
            checks: checks
        });
    }

    async function formatGatewayReport(gatewayPackage) {
        const current = gatewayPackage || await generateGatewayPackage();
        const lines = [
            "TMS-OS FINAL HUMAN APPROVAL GATEWAY",
            "Gateway ID: " + current.gatewayId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Gateway Mode: " + current.gatewayMode,
            "Gateway Status: " + current.gatewayStatus,
            "Human Review Eligible: " + (current.humanReviewEligible ? "YES" : "NO"),
            "Human Decision Recorded: NO",
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

        if (current.requiredNextAction) {
            lines.push("Required Next Action: " + current.requiredNextAction);
        }
        if (current.reviewChoices) {
            lines.push("Review Choices: " + current.reviewChoices.join(" | "));
        }
        return lines.join("\n");
    }

    function getLastGatewayPackage() {
        return lastGatewayPackage;
    }

    window.TMSFinalHumanApprovalGateway = Object.freeze({
        engineVersion: ENGINE_VERSION,
        gatewayMode: GATEWAY_MODE,
        generateGatewayPackage: generateGatewayPackage,
        validateGatewayPackage: validateGatewayPackage,
        formatGatewayReport: formatGatewayReport,
        getLastGatewayPackage: getLastGatewayPackage
    });

    console.log(
        "Final Human Approval Gateway v" +
        ENGINE_VERSION +
        " initialized in " +
        GATEWAY_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
