/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 116 — Controlled Execution Engine v2.0.1
File: js/session/controlled-execution-engine.js

Purpose:
Coordinate the approved permanent-document transaction, rollback package,
and original-document capture package into one deterministic, review-only
execution plan.

Version 1.1.1 preserves the document-change decision metadata produced by the
Original Document Capture Engine. Unchanged documents remain in the controlled
plan for traceability, but they are explicitly marked as requiring no permanent
write.

This engine validates execution prerequisites and prepares the ordered
permanent-output plan. It does not write, replace, delete, restore, download,
or otherwise modify any permanent file.

Write authorization and rollback authorization remain locked.

Version 1.3.0 accepts governed document identity from either id or documentId
when validating captured original and proposed documents.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.1";
    const PLAN_TYPE = "TMS-OS Controlled Permanent Output Execution Plan";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastExecutionPlan = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSOriginalDocumentCaptureEngine
    ) {
        console.error(
            "Controlled Execution Engine could not initialize because its dependencies are unavailable."
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

    function createPlanId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "EXECUTION",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function validateDocumentDecisionState(document) {
        if (
            typeof document.documentChanged !== "boolean" ||
            typeof document.permanentWriteRequired !== "boolean" ||
            typeof document.rollbackRequiredBeforeWrite !== "boolean"
        ) {
            return false;
        }

        const checksumsMatch =
            document.originalChecksum === document.proposedChecksum;

        if (checksumsMatch) {
            return (
                document.documentChanged === false &&
                document.permanentWriteRequired === false &&
                document.rollbackRequiredBeforeWrite === false &&
                document.executionStatus === "No Write Required"
            );
        }

        return (
            document.documentChanged === true &&
            document.permanentWriteRequired === true &&
            document.rollbackRequiredBeforeWrite === true &&
            (
                document.executionStatus === "Not Started" ||
                document.executionStatus === "Ready for Controlled Execution" ||
                document.executionStatus === "Write Required"
            )
        );
    }

    function validateCapturePackage(capturePackage) {
        const checks = [];

        let captureValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(capturePackage)) {
            captureValidation =
                window.TMSOriginalDocumentCaptureEngine
                    .validateCapture(capturePackage);
        }

        checks.push(buildCheck(
            "Capture package exists",
            isPlainObject(capturePackage),
            "A complete Original Document Capture package is required."
        ));

        checks.push(buildCheck(
            "Capture package accepted",
            Boolean(capturePackage && capturePackage.accepted),
            "The Original Document Capture package must be accepted."
        ));

        checks.push(buildCheck(
            "Capture validation accepted",
            Boolean(captureValidation && captureValidation.accepted),
            "The Original Document Capture package must pass validation."
        ));

        checks.push(buildCheck(
            "Expected captured document count",
            Boolean(capturePackage) &&
                capturePackage.capturedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six original permanent documents must be captured."
        ));

        checks.push(buildCheck(
            "Original documents captured",
            Boolean(capturePackage) &&
                capturePackage.originalDocumentsCaptured === true,
            "All current live permanent documents must be captured."
        ));

        checks.push(buildCheck(
            "Proposed documents captured",
            Boolean(capturePackage) &&
                capturePackage.proposedDocumentsCaptured === true,
            "All proposed replacement documents must be retained."
        ));

        checks.push(buildCheck(
            "Rollback is ready",
            Boolean(capturePackage) &&
                capturePackage.rollbackReady === true,
            "The capture package must be rollback-ready."
        ));

        checks.push(buildCheck(
            "Rollback remains unauthorized",
            Boolean(capturePackage) &&
                capturePackage.rollbackAuthorized === false,
            "Rollback execution must remain unauthorized."
        ));

        checks.push(buildCheck(
            "Write remains unauthorized",
            Boolean(capturePackage) &&
                capturePackage.writeAuthorized === false,
            "Permanent writing must remain unauthorized."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(capturePackage) &&
                capturePackage.permanentWritesExecuted === false,
            "No permanent files may be changed before controlled execution."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(capturePackage) &&
                capturePackage.restoreExecuted === false,
            "No rollback restore may have been executed."
        ));

        checks.push(buildCheck(
            "Governance evidence retained",
            Boolean(capturePackage) &&
                capturePackage.governanceEvidenceRetained ===
                    true &&
                capturePackage.sourceSessionIdentityRetained ===
                    true &&
                capturePackage.downstreamGovernanceDependency ===
                    false,
            "The capture package must retain the enriched six-document governance evidence."
        ));

        const documents =
            capturePackage && Array.isArray(capturePackage.documents)
                ? capturePackage.documents
                : [];

        const documentIds = documents.map(function (document) {
            return document.documentId;
        });

        const documentSetValid =
            documents.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size === EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected permanent document set",
            documentSetValid,
            "The capture package must contain the unique six-document permanent set."
        ));

        const documentSafetyValid =
            documents.length === EXPECTED_DOCUMENTS.length &&
            documents.every(function (document) {
                return (
                    EXPECTED_DOCUMENTS.includes(document.documentId) &&
                    document.originalDocumentCaptured === true &&
                    isPlainObject(document.originalDocument) &&
                    (
                        document.originalDocument.id ||
                        document.originalDocument.documentId
                    ) === document.documentId &&
                    document.proposedDocumentCaptured === true &&
                    isPlainObject(document.proposedDocument) &&
                    (
                        document.proposedDocument.id ||
                        document.proposedDocument.documentId
                    ) === document.documentId &&
                    typeof document.originalChecksum === "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.proposedChecksum === "string" &&
                    document.proposedChecksum.length > 0 &&
                    document.backupStatus === "Captured and Verified" &&
                    document.verificationStatus === "Passed" &&
                    validateDocumentDecisionState(document) &&
                    typeof document.writerVersion === "string" &&
                    document.writerVersion.length > 0 &&
                    typeof document.proposalAction === "string" &&
                    document.proposalAction.length > 0 &&
                    isPlainObject(document.sourceSession) &&
                    isPlainObject(document.governanceEnvelope) &&
                    document.governanceEnvelope.governanceMode === "Disabled" &&
                    document.governanceEnvelope.documentationMode === "Review Only" &&
                    document.governanceEnvelope.executionMode === "Disabled" &&
                    document.governanceEnvelope.executionLockStatus === "Locked" &&
                    document.downstreamGovernanceDependency === false &&
                    (
                        document.documentId !== "WORKSPACE-SNAPSHOT-HISTORY-001" ||
                        (
                            isPlainObject(document.transactionMetadata) &&
                            document.transactionMetadata.governedDocumentId ===
                                document.documentId
                        )
                    ) &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false
                );
            });

        checks.push(buildCheck(
            "Captured document safety state",
            documentSafetyValid,
            "Every permanent document must include verified copies, valid change metadata, and locked execution controls."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            captureValidation: captureValidation
        };
    }

    function buildExecutionStep(document, sequenceIndex) {
        const writeRequired =
            document.permanentWriteRequired === true;

        return {
            sequence: sequenceIndex + 1,
            order: document.order,
            documentId: document.documentId,
            updateMode: document.updateMode,

            targetPath: document.targetPath,
            backupPath: document.backupPath,
            proposedCopyPath: document.proposedCopyPath,

            originalDocumentCaptured:
                document.originalDocumentCaptured,
            proposedDocumentCaptured:
                document.proposedDocumentCaptured,

            originalChecksum:
                document.originalChecksum,
            proposedChecksum:
                document.proposedChecksum,

            documentChanged:
                document.documentChanged,
            permanentWriteRequired:
                document.permanentWriteRequired,
            rollbackRequiredBeforeWrite:
                document.rollbackRequiredBeforeWrite,

            sourceVersion:
                document.sourceVersion,
            proposedVersion:
                document.proposedVersion,

            sourceSectionCount:
                document.sourceSectionCount,
            proposedSectionCount:
                document.proposedSectionCount,

            sourceCollectionName:
                document.sourceCollectionName || null,
            proposedCollectionName:
                document.proposedCollectionName || null,
            sourceItemCount:
                Number.isInteger(document.sourceItemCount)
                    ? document.sourceItemCount
                    : document.sourceSectionCount,
            proposedItemCount:
                Number.isInteger(document.proposedItemCount)
                    ? document.proposedItemCount
                    : document.proposedSectionCount,

            writerId:
                document.writerId,

            writerVersion:
                document.writerVersion,

            proposalAction:
                document.proposalAction,

            reviewRequired:
                document.reviewRequired,

            reviewChoices:
                clone(
                    document.reviewChoices || []
                ),

            sourceSession:
                clone(
                    document.sourceSession
                ),

            governanceEnvelope:
                clone(
                    document.governanceEnvelope
                ),

            transactionMetadata:
                document.transactionMetadata
                    ? clone(
                        document.transactionMetadata
                    )
                    : null,

            governanceEnvelopeRetained:
                document.governanceEnvelopeRetained,

            sourceSessionIdentityRetained:
                document.sourceSessionIdentityRetained,

            transactionMetadataRetained:
                document.transactionMetadataRetained,

            downstreamGovernanceDependency:
                document.downstreamGovernanceDependency,

            prerequisites: writeRequired
                ? [
                    "Original permanent document captured",
                    "Original checksum verified",
                    "Proposed replacement document captured",
                    "Proposed checksum verified",
                    "Document change confirmed",
                    "Rollback package ready",
                    "Human execution authorization not yet granted"
                ]
                : [
                    "Original permanent document captured",
                    "Original checksum verified",
                    "Proposed replacement document captured",
                    "Proposed checksum verified",
                    "No document change detected",
                    "No permanent write required"
                ],

            prerequisiteStatus: "Passed",

            executionAction: writeRequired
                ? "Replace complete permanent JSON file"
                : "No Write Required",

            executionStatus: writeRequired
                ? "Planned — Not Authorized"
                : "No Write Required",

            verificationStatus: writeRequired
                ? "Pending Execution"
                : "Passed — No Write Required",

            writeAuthorized: false,
            rollbackAuthorized: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedExecutionPlan(
        message,
        capturePackage,
        validation
    ) {
        const sessionSnapshot =
            window.TMSSessionContext.getSnapshot();

        const sourceSessionNumber =
            capturePackage &&
            capturePackage.sessionNumber
                ? capturePackage.sessionNumber
                : sessionSnapshot.sessionNumber;

        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            planType: PLAN_TYPE,
            engineVersion: ENGINE_VERSION,
            planId: createPlanId(
                sourceSessionNumber,
                generatedAt
            ),
            generatedAt: generatedAt,
            sessionNumber: sourceSessionNumber,

            accepted: false,
            message: message,

            sourceCaptureAccepted:
                Boolean(
                    capturePackage &&
                    capturePackage.accepted
                ),
            sourceCaptureId:
                capturePackage
                    ? capturePackage.captureId
                    : null,
            sourceCaptureStatus:
                capturePackage
                    ? capturePackage.captureStatus
                    : "Unavailable",

            validationAccepted:
                Boolean(validation && validation.accepted),
            validationChecks:
                validation ? validation.checks : [],

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,
            plannedDocumentCount: 0,
            writeRequiredDocumentCount: 0,
            noWriteRequiredDocumentCount: 0,
            executionSteps: [],

            originalDocumentsCaptured: false,
            proposedDocumentsCaptured: false,
            rollbackReady: false,

            governanceEvidenceRetained: false,
            sourceSessionIdentityRetained:
                Boolean(sourceSessionNumber),
            transactionMetadataRetained: false,
            downstreamGovernanceDependency: false,

            executionReady: false,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            planStatus: "Rejected",
            requiredNextAction:
                "Correct the failed capture-package or execution prerequisite checks.",
            reviewRequired: true
        });
    }

    async function generateExecutionPlan(capturePackage) {
        const sourceCapture =
            capturePackage ||
            await window.TMSOriginalDocumentCaptureEngine
                .captureRollbackPackage();

        const validation =
            validateCapturePackage(sourceCapture);

        if (!validation.accepted) {
            lastExecutionPlan = rejectedExecutionPlan(
                "The Original Document Capture package failed controlled execution validation.",
                sourceCapture,
                validation
            );

            return lastExecutionPlan;
        }

        const orderedDocuments =
            clone(sourceCapture.documents)
                .sort(function (first, second) {
                    return Number(first.order) -
                        Number(second.order);
                });

        const executionSteps =
            orderedDocuments.map(function (
                document,
                index
            ) {
                return buildExecutionStep(
                    document,
                    index
                );
            });

        const writeRequiredDocumentCount =
            executionSteps.filter(function (step) {
                return step.permanentWriteRequired === true;
            }).length;

        const noWriteRequiredDocumentCount =
            executionSteps.length -
            writeRequiredDocumentCount;

        const sourceSessionNumber =
            sourceCapture.sessionNumber;

        const generatedAt =
            new Date().toISOString();

        lastExecutionPlan = deepFreeze({
            planType: PLAN_TYPE,
            engineVersion: ENGINE_VERSION,
            planId: createPlanId(
                sourceSessionNumber,
                generatedAt
            ),
            generatedAt: generatedAt,
            sessionNumber: sourceSessionNumber,

            accepted: true,
            message:
                "Controlled execution plan generated for review. " +
                "Document change decisions were preserved. " +
                "No permanent writes were authorized or executed.",

            sourceCaptureAccepted: true,
            sourceCaptureId:
                sourceCapture.captureId,
            sourceCaptureStatus:
                sourceCapture.captureStatus,
            sourceCaptureEngineVersion:
                sourceCapture.engineVersion,
            sourceCaptureGeneratedAt:
                sourceCapture.generatedAt,

            sourceRollbackPackageId:
                sourceCapture.sourceRollbackPackageId,

            validationAccepted: true,
            validationChecks:
                validation.checks,

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,
            plannedDocumentCount:
                executionSteps.length,
            writeRequiredDocumentCount:
                writeRequiredDocumentCount,
            noWriteRequiredDocumentCount:
                noWriteRequiredDocumentCount,
            executionSteps:
                executionSteps,

            originalDocumentsCaptured: true,
            proposedDocumentsCaptured: true,
            rollbackReady: true,

            governanceEvidenceRetained: true,
            sourceSessionIdentityRetained: true,
            transactionMetadataRetained:
                executionSteps.some(function (
                    step
                ) {
                    return (
                        step.transactionMetadata !==
                        null
                    );
                }),
            downstreamGovernanceDependency: false,

            executionReady: true,
            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            planStatus:
                writeRequiredDocumentCount > 0
                    ? "Validated — Awaiting Execution Authorization"
                    : "Validated — No Permanent Writes Required",

            requiredNextAction:
                writeRequiredDocumentCount > 0
                    ? "Submit only write-required steps to the future human-controlled execution authorization gate."
                    : "Record that all six permanent documents are unchanged; no execution authorization is required.",

            reviewRequired: true,
            reviewChoices: [
                "Approve Execution Plan Structure",
                "Revise Session",
                "Cancel Execution Plan"
            ]
        });

        return lastExecutionPlan;
    }

    function validateExecutionPlan(executionPlan) {
        const current =
            executionPlan || lastExecutionPlan;

        const checks = [];

        checks.push(buildCheck(
            "Execution plan exists",
            isPlainObject(current),
            "A Controlled Execution Plan is required."
        ));

        checks.push(buildCheck(
            "Execution plan accepted",
            Boolean(current && current.accepted),
            "The Controlled Execution Plan must be accepted."
        ));

        checks.push(buildCheck(
            "Expected planned document count",
            Boolean(current) &&
                current.plannedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "The execution plan must contain six permanent documents."
        ));

        checks.push(buildCheck(
            "Original documents captured",
            Boolean(current) &&
                current.originalDocumentsCaptured === true,
            "All original documents must remain captured."
        ));

        checks.push(buildCheck(
            "Proposed documents captured",
            Boolean(current) &&
                current.proposedDocumentsCaptured === true,
            "All proposed replacement documents must remain captured."
        ));

        checks.push(buildCheck(
            "Rollback ready",
            Boolean(current) &&
                current.rollbackReady === true,
            "Rollback readiness is required before execution planning."
        ));

        checks.push(buildCheck(
            "Execution prerequisites ready",
            Boolean(current) &&
                current.executionReady === true,
            "The execution plan must have passed prerequisite validation."
        ));

        checks.push(buildCheck(
            "Enriched governance evidence retained",
            Boolean(current) &&
                current.governanceEvidenceRetained ===
                    true &&
                current.sourceSessionIdentityRetained ===
                    true &&
                current.downstreamGovernanceDependency ===
                    false,
            "The execution plan must preserve the enriched six-document governance evidence."
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
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "The Controlled Execution Engine must not modify permanent files."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(current) &&
                current.restoreExecuted === false,
            "The Controlled Execution Engine must not perform restoration."
        ));

        const executionSteps =
            current && Array.isArray(current.executionSteps)
                ? current.executionSteps
                : [];

        const stepIds =
            executionSteps.map(function (step) {
                return step.documentId;
            });

        const stepSetValid =
            executionSteps.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return stepIds.includes(documentId);
            }) &&
            new Set(stepIds).size === EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected execution document set",
            stepSetValid,
            "The execution plan must contain the unique six-document permanent set."
        ));

        const executionStepsValid =
            executionSteps.length === EXPECTED_DOCUMENTS.length &&
            executionSteps.every(function (step, index) {
                const baseValid =
                    step.sequence === index + 1 &&
                    EXPECTED_DOCUMENTS.includes(step.documentId) &&
                    typeof step.targetPath === "string" &&
                    step.targetPath.length > 0 &&
                    typeof step.backupPath === "string" &&
                    step.backupPath.length > 0 &&
                    typeof step.originalChecksum === "string" &&
                    step.originalChecksum.length > 0 &&
                    typeof step.proposedChecksum === "string" &&
                    step.proposedChecksum.length > 0 &&
                    typeof step.documentChanged === "boolean" &&
                    typeof step.permanentWriteRequired === "boolean" &&
                    typeof step.rollbackRequiredBeforeWrite === "boolean" &&
                    step.originalDocumentCaptured === true &&
                    step.proposedDocumentCaptured === true &&
                    step.prerequisiteStatus === "Passed" &&
                    typeof step.writerVersion === "string" &&
                    step.writerVersion.length > 0 &&
                    typeof step.proposalAction === "string" &&
                    step.proposalAction.length > 0 &&
                    isPlainObject(step.sourceSession) &&
                    isPlainObject(step.governanceEnvelope) &&
                    step.governanceEnvelope.governanceMode === "Disabled" &&
                    step.governanceEnvelope.documentationMode === "Review Only" &&
                    step.governanceEnvelope.executionMode === "Disabled" &&
                    step.governanceEnvelope.executionLockStatus === "Locked" &&
                    step.downstreamGovernanceDependency === false &&
                    (
                        step.documentId !== "WORKSPACE-SNAPSHOT-HISTORY-001" ||
                        (
                            isPlainObject(step.transactionMetadata) &&
                            step.transactionMetadata.governedDocumentId ===
                                step.documentId
                        )
                    ) &&
                    step.writeAuthorized === false &&
                    step.rollbackAuthorized === false &&
                    step.permanentWriteExecuted === false &&
                    step.restoreExecuted === false;

                if (!baseValid) {
                    return false;
                }

                if (step.permanentWriteRequired === true) {
                    return (
                        step.documentChanged === true &&
                        step.rollbackRequiredBeforeWrite === true &&
                        step.executionAction ===
                            "Replace complete permanent JSON file" &&
                        step.executionStatus ===
                            "Planned — Not Authorized" &&
                        step.verificationStatus ===
                            "Pending Execution"
                    );
                }

                return (
                    step.documentChanged === false &&
                    step.rollbackRequiredBeforeWrite === false &&
                    step.executionAction ===
                        "No Write Required" &&
                    step.executionStatus ===
                        "No Write Required" &&
                    step.verificationStatus ===
                        "Passed — No Write Required"
                );
            });

        checks.push(buildCheck(
            "Execution steps valid",
            executionStepsValid,
            "Every execution step must preserve its verified write decision and remain authorization-locked."
        ));

        const writeRequiredCount =
            executionSteps.filter(function (step) {
                return step.permanentWriteRequired === true;
            }).length;

        const noWriteRequiredCount =
            executionSteps.filter(function (step) {
                return step.permanentWriteRequired === false;
            }).length;

        checks.push(buildCheck(
            "Execution decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount ===
                    writeRequiredCount &&
                current.noWriteRequiredDocumentCount ===
                    noWriteRequiredCount &&
                writeRequiredCount +
                    noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The plan-level write decision counts must match the execution steps."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatExecutionPlan(executionPlan) {
        const current =
            executionPlan ||
            await generateExecutionPlan();

        const lines = [
            "TMS-OS CONTROLLED PERMANENT OUTPUT EXECUTION PLAN",
            "Plan ID: " + current.planId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Engine Version: " + current.engineVersion,
            "Plan Status: " + current.planStatus,
            "Planned Documents: " +
                current.plannedDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.noWriteRequiredDocumentCount,
            "Original Documents Captured: " +
                (
                    current.originalDocumentsCaptured
                        ? "YES"
                        : "NO"
                ),
            "Proposed Documents Captured: " +
                (
                    current.proposedDocumentsCaptured
                        ? "YES"
                        : "NO"
                ),
            "Rollback Ready: " +
                (
                    current.rollbackReady
                        ? "YES"
                        : "NO"
                ),
            "Governance Evidence Retained: " +
                (
                    current.governanceEvidenceRetained
                        ? "YES"
                        : "NO"
                ),
            "Source Session Identity Retained: " +
                (
                    current.sourceSessionIdentityRetained
                        ? "YES"
                        : "NO"
                ),
            "Downstream Governance Dependency: " +
                (
                    current.downstreamGovernanceDependency
                        ? "YES"
                        : "NO"
                ),
            "Execution Ready: " +
                (
                    current.executionReady
                        ? "YES"
                        : "NO"
                ),
            "Execution Authorized: NO",
            "Write Authorized: NO",
            "Rollback Authorized: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.executionSteps || []).forEach(function (step) {
            lines.push(
                step.sequence +
                " | " +
                step.documentId +
                " | " +
                step.updateMode +
                " | " +
                step.executionStatus +
                " | " +
                (
                    step.permanentWriteRequired
                        ? "WRITE LOCKED"
                        : "NO WRITE"
                )
            );
        });

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

    function getLastExecutionPlan() {
        return lastExecutionPlan;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSControlledExecutionEngine =
        Object.freeze({
            engineVersion: ENGINE_VERSION,
            generateExecutionPlan:
                generateExecutionPlan,
            validateExecutionPlan:
                validateExecutionPlan,
            formatExecutionPlan:
                formatExecutionPlan,
            getLastExecutionPlan:
                getLastExecutionPlan,
            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Controlled Execution Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
