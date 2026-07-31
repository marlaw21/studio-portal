/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 094 — Human Controlled Execution Authorization Engine v1.0.0
File: js/session/human-controlled-execution-authorization-engine.js

This engine validates a Controlled Execution Plan and creates an immutable
human authorization record. It performs no permanent writes or restores.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const RECORD_TYPE = "TMS-OS Human Controlled Execution Authorization Record";
    const APPROVE = "Approve Execution Authorization";
    const REVISE = "Revise Execution Plan";
    const CANCEL = "Cancel Execution Authorization";

    let lastAuthorizationRecord = null;
    const authorizedPlanIds = new Set();

    if (!window.TMSSessionContext || !window.TMSControlledExecutionEngine) {
        console.error(
            "Human Controlled Execution Authorization Engine could not initialize because its dependencies are unavailable."
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

    function isObject(value) {
        return Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function check(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function getSessionNumber() {
        return window.TMSSessionContext.getSnapshot().sessionNumber;
    }

    function createAuthorizationId(generatedAt) {
        const stamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "EXECUTION",
            "AUTHORIZATION",
            String(getSessionNumber()).padStart(3, "0"),
            stamp
        ].join("-");
    }

    function validateSourceExecutionPlan(executionPlan) {
        const checks = [];
        const sourceValidation = isObject(executionPlan)
            ? window.TMSControlledExecutionEngine
                .validateExecutionPlan(executionPlan)
            : { accepted: false, checks: [] };

        checks.push(check(
            "Execution plan exists",
            isObject(executionPlan),
            "A Controlled Execution Plan is required."
        ));

        checks.push(check(
            "Execution plan accepted",
            Boolean(executionPlan && executionPlan.accepted),
            "The source execution plan must be accepted."
        ));

        checks.push(check(
            "Execution plan validation accepted",
            Boolean(sourceValidation.accepted),
            "The source execution plan must pass validation."
        ));

        checks.push(check(
            "Execution plan ready",
            Boolean(executionPlan && executionPlan.executionReady === true),
            "The source execution plan must be ready."
        ));

        checks.push(check(
            "Execution remains unauthorized",
            Boolean(executionPlan && executionPlan.executionAuthorized === false),
            "The source plan must not already be execution-authorized."
        ));

        checks.push(check(
            "Write remains unauthorized",
            Boolean(executionPlan && executionPlan.writeAuthorized === false),
            "The source plan must not already be write-authorized."
        ));

        checks.push(check(
            "No permanent writes executed",
            Boolean(executionPlan && executionPlan.permanentWritesExecuted === false),
            "No permanent writes may have occurred."
        ));

        checks.push(check(
            "No restore executed",
            Boolean(executionPlan && executionPlan.restoreExecuted === false),
            "No restore may have occurred."
        ));

        const steps = executionPlan &&
            Array.isArray(executionPlan.executionSteps)
            ? executionPlan.executionSteps
            : [];

        const decisionsValid = steps.length > 0 &&
            steps.every(function (step) {
                if (step.permanentWriteRequired === true) {
                    return step.documentChanged === true &&
                        step.rollbackRequiredBeforeWrite === true &&
                        step.executionAction ===
                            "Replace complete permanent JSON file" &&
                        step.executionStatus ===
                            "Planned — Not Authorized" &&
                        step.writeAuthorized === false &&
                        step.permanentWriteExecuted === false;
                }

                return step.permanentWriteRequired === false &&
                    step.documentChanged === false &&
                    step.rollbackRequiredBeforeWrite === false &&
                    step.executionAction === "No Write Required" &&
                    step.executionStatus === "No Write Required" &&
                    step.writeAuthorized === false &&
                    step.permanentWriteExecuted === false;
            });

        checks.push(check(
            "Execution decisions valid",
            decisionsValid,
            "Every document must retain a valid write or no-write decision."
        ));

        checks.push(check(
            "Execution plan not previously authorized",
            Boolean(
                executionPlan &&
                typeof executionPlan.planId === "string" &&
                !authorizedPlanIds.has(executionPlan.planId)
            ),
            "Only one accepted authorization may be created per execution plan."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (item) {
                return item.passed;
            }),
            checks: checks,
            sourceValidation: sourceValidation
        });
    }

    function authorizedDocument(step) {
        return {
            sequence: step.sequence,
            order: step.order,
            documentId: step.documentId,
            updateMode: step.updateMode,
            targetPath: step.targetPath,
            backupPath: step.backupPath,
            proposedCopyPath: step.proposedCopyPath,
            originalChecksum: step.originalChecksum,
            proposedChecksum: step.proposedChecksum,

            documentChanged: true,
            permanentWriteRequired: true,
            rollbackRequiredBeforeWrite: true,

            executionAction: "Replace complete permanent JSON file",
            authorizationStatus: "Human Authorized — Awaiting Execution",

            executionAuthorized: true,
            writeAuthorized: true,
            rollbackAuthorized: true,

            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function excludedDocument(step) {
        return {
            sequence: step.sequence,
            order: step.order,
            documentId: step.documentId,
            updateMode: step.updateMode,
            targetPath: step.targetPath,
            originalChecksum: step.originalChecksum,
            proposedChecksum: step.proposedChecksum,

            documentChanged: false,
            permanentWriteRequired: false,
            rollbackRequiredBeforeWrite: false,

            executionAction: "No Write Required",
            authorizationStatus: "Excluded — No Write Required",

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedRecord(executionPlan, humanDecision, validation, status) {
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            recordType: RECORD_TYPE,
            engineVersion: ENGINE_VERSION,
            authorizationId: createAuthorizationId(generatedAt),
            generatedAt: generatedAt,
            sessionNumber: getSessionNumber(),

            accepted: false,
            message: "Explicit human execution authorization was not granted.",

            humanDecision: humanDecision || null,
            humanApprovalSatisfied: false,

            sourceExecutionPlanId:
                executionPlan ? executionPlan.planId : null,
            sourceExecutionPlanAccepted:
                Boolean(executionPlan && executionPlan.accepted),
            sourceValidationAccepted:
                Boolean(validation && validation.accepted),
            validationChecks:
                validation ? validation.checks : [],

            plannedDocumentCount:
                executionPlan ? executionPlan.plannedDocumentCount : 0,
            authorizedDocumentCount: 0,
            excludedDocumentCount: 0,

            authorizedDocuments: [],
            excludedDocuments: [],

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            authorizationStatus: status,
            immutableRecord: true
        });
    }

    function createAuthorization(executionPlan, humanDecision) {
        const validation =
            validateSourceExecutionPlan(executionPlan);

        if (!validation.accepted) {
            lastAuthorizationRecord = rejectedRecord(
                executionPlan,
                humanDecision,
                validation,
                "Rejected"
            );

            return lastAuthorizationRecord;
        }

        if (humanDecision !== APPROVE) {
            const status = humanDecision === REVISE
                ? "Revision Requested"
                : humanDecision === CANCEL
                    ? "Cancelled"
                    : "Awaiting Explicit Human Approval";

            lastAuthorizationRecord = rejectedRecord(
                executionPlan,
                humanDecision,
                validation,
                status
            );

            return lastAuthorizationRecord;
        }

        const generatedAt = new Date().toISOString();

        const authorizedDocuments =
            executionPlan.executionSteps
                .filter(function (step) {
                    return step.permanentWriteRequired === true;
                })
                .map(authorizedDocument);

        const excludedDocuments =
            executionPlan.executionSteps
                .filter(function (step) {
                    return step.permanentWriteRequired === false;
                })
                .map(excludedDocument);

        lastAuthorizationRecord = deepFreeze({
            recordType: RECORD_TYPE,
            engineVersion: ENGINE_VERSION,
            authorizationId: createAuthorizationId(generatedAt),
            generatedAt: generatedAt,
            sessionNumber: getSessionNumber(),

            accepted: true,
            message:
                "Human-controlled authorization granted for write-required documents only. No permanent writes were executed.",

            humanDecision: humanDecision,
            humanApprovalSatisfied: true,

            sourceExecutionPlanId: executionPlan.planId,
            sourceExecutionPlanAccepted: true,
            sourceExecutionPlanStatus: executionPlan.planStatus,
            sourceExecutionPlanEngineVersion: executionPlan.engineVersion,
            sourceExecutionPlanGeneratedAt: executionPlan.generatedAt,

            sourceValidationAccepted: true,
            validationChecks: validation.checks,

            plannedDocumentCount: executionPlan.plannedDocumentCount,
            authorizedDocumentCount: authorizedDocuments.length,
            excludedDocumentCount: excludedDocuments.length,

            authorizedDocuments: authorizedDocuments,
            excludedDocuments: excludedDocuments,

            executionAuthorized: true,
            writeAuthorized: authorizedDocuments.length > 0,
            rollbackAuthorized: authorizedDocuments.length > 0,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            authorizationStatus: authorizedDocuments.length > 0
                ? "Human Authorized — Awaiting Controlled Execution"
                : "Human Approved — No Permanent Writes Required",

            requiredNextAction: authorizedDocuments.length > 0
                ? "Submit this immutable record to the future Permanent Document Execution Engine."
                : "Record completion without permanent execution.",

            immutableRecord: true
        });

        authorizedPlanIds.add(executionPlan.planId);

        return lastAuthorizationRecord;
    }

    function validateAuthorizationRecord(record) {
        const current = record || lastAuthorizationRecord;
        const checks = [];

        checks.push(check(
            "Authorization record exists",
            isObject(current),
            "An authorization record is required."
        ));

        checks.push(check(
            "Authorization record accepted",
            Boolean(current && current.accepted),
            "The authorization record must be accepted."
        ));

        checks.push(check(
            "Explicit human approval satisfied",
            Boolean(
                current &&
                current.humanApprovalSatisfied === true &&
                current.humanDecision === APPROVE
            ),
            "The exact human approval decision is required."
        ));

        const authorizedDocuments = current &&
            Array.isArray(current.authorizedDocuments)
            ? current.authorizedDocuments
            : [];

        const excludedDocuments = current &&
            Array.isArray(current.excludedDocuments)
            ? current.excludedDocuments
            : [];

        checks.push(check(
            "Authorized documents valid",
            authorizedDocuments.every(function (document) {
                return document.documentChanged === true &&
                    document.permanentWriteRequired === true &&
                    document.rollbackRequiredBeforeWrite === true &&
                    document.executionAuthorized === true &&
                    document.writeAuthorized === true &&
                    document.rollbackAuthorized === true &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false;
            }),
            "Only write-required documents may be authorized."
        ));

        checks.push(check(
            "Excluded documents valid",
            excludedDocuments.every(function (document) {
                return document.documentChanged === false &&
                    document.permanentWriteRequired === false &&
                    document.rollbackRequiredBeforeWrite === false &&
                    document.executionAuthorized === false &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false;
            }),
            "No-write documents must remain excluded."
        ));

        checks.push(check(
            "Authorization counts valid",
            Boolean(current) &&
                current.authorizedDocumentCount ===
                    authorizedDocuments.length &&
                current.excludedDocumentCount ===
                    excludedDocuments.length &&
                current.plannedDocumentCount ===
                    authorizedDocuments.length +
                    excludedDocuments.length,
            "Authorization counts must match both document sets."
        ));

        checks.push(check(
            "Execution authorization valid",
            Boolean(current && current.executionAuthorized === true),
            "Accepted records must authorize controlled execution."
        ));

        checks.push(check(
            "Write authorization valid",
            Boolean(current) &&
                current.writeAuthorized ===
                    (authorizedDocuments.length > 0),
            "Write authorization is valid only when writes are required."
        ));

        checks.push(check(
            "Rollback authorization valid",
            Boolean(current) &&
                current.rollbackAuthorized ===
                    (authorizedDocuments.length > 0),
            "Rollback authorization must accompany authorized writes."
        ));

        checks.push(check(
            "No permanent writes executed",
            Boolean(current && current.permanentWritesExecuted === false),
            "This engine must not execute permanent writes."
        ));

        checks.push(check(
            "No restore executed",
            Boolean(current && current.restoreExecuted === false),
            "This engine must not execute restoration."
        ));

        checks.push(check(
            "Authorization record immutable",
            Boolean(
                current &&
                current.immutableRecord === true &&
                Object.isFrozen(current)
            ),
            "The accepted authorization record must be immutable."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (item) {
                return item.passed;
            }),
            checks: checks
        });
    }

    function formatAuthorizationRecord(record) {
        const current = record || lastAuthorizationRecord;

        if (!current) {
            return "No Human Controlled Execution Authorization Record is available.";
        }

        const lines = [
            "TMS-OS HUMAN CONTROLLED EXECUTION AUTHORIZATION RECORD",
            "Authorization ID: " + current.authorizationId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Authorization Status: " + current.authorizationStatus,
            "Human Decision: " + (current.humanDecision || "NONE"),
            "Source Execution Plan ID: " +
                (current.sourceExecutionPlanId || "NONE"),
            "Planned Documents: " + current.plannedDocumentCount,
            "Authorized Documents: " + current.authorizedDocumentCount,
            "Excluded Documents: " + current.excludedDocumentCount,
            "Execution Authorized: " +
                (current.executionAuthorized ? "YES" : "NO"),
            "Write Authorized: " +
                (current.writeAuthorized ? "YES" : "NO"),
            "Rollback Authorized: " +
                (current.rollbackAuthorized ? "YES" : "NO"),
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.authorizedDocuments || []).forEach(function (document) {
            lines.push(
                document.sequence + " | " +
                document.documentId +
                " | AUTHORIZED | WRITE PENDING"
            );
        });

        (current.excludedDocuments || []).forEach(function (document) {
            lines.push(
                document.sequence + " | " +
                document.documentId +
                " | EXCLUDED | NO WRITE REQUIRED"
            );
        });

        return lines.join("\n");
    }

    window.TMSHumanControlledExecutionAuthorizationEngine =
        Object.freeze({
            engineVersion: ENGINE_VERSION,
            createAuthorization: createAuthorization,
            validateSourceExecutionPlan: validateSourceExecutionPlan,
            validateAuthorizationRecord: validateAuthorizationRecord,
            formatAuthorizationRecord: formatAuthorizationRecord,
            getLastAuthorizationRecord: function () {
                return lastAuthorizationRecord;
            },
            getApprovalDecision: function () {
                return APPROVE;
            },
            getReviewChoices: function () {
                return [APPROVE, REVISE, CANCEL];
            }
        });

    console.log(
        "Human Controlled Execution Authorization Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        getSessionNumber() +
        "."
    );
}());
