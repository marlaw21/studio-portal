/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Permanent Write Execution Engine v2.1.0
Human-Controlled Authorization Integration
File: js/session/permanent-write-execution-engine-v2.js

Purpose:
Consume an accepted Human Controlled Execution Authorization Record and generate
a complete, ordered, review-only permanent-write execution manifest.

This version remains fully disabled. It does not write, replace, rename, move,
delete, restore, download, or otherwise modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.1.0";
    const EXECUTION_MODE = "Disabled";
    const MANIFEST_TYPE =
        "TMS-OS Permanent Documentation Write Execution Manifest";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastExecutionManifest = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSHumanControlledExecutionAuthorizationEngine
    ) {
        console.error(
            "Permanent Write Execution Engine v2.1.0 could not initialize because its dependencies are unavailable."
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

    function createManifestId(sessionNumber, generatedAt) {
        const timestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "WRITE-EXECUTION-MANIFEST",
            String(sessionNumber).padStart(3, "0"),
            timestamp
        ].join("-");
    }

    function getDocumentSets(authorization) {
        return {
            authorizedDocuments:
                authorization &&
                Array.isArray(authorization.authorizedDocuments)
                    ? authorization.authorizedDocuments
                    : [],

            excludedDocuments:
                authorization &&
                Array.isArray(authorization.excludedDocuments)
                    ? authorization.excludedDocuments
                    : []
        };
    }

    function validateAuthorizationPackage(authorization) {
        const checks = [];

        let authorizationValidation = {
            accepted: false,
            checks: []
        };

        if (isPlainObject(authorization)) {
            authorizationValidation =
                window.TMSHumanControlledExecutionAuthorizationEngine
                    .validateAuthorizationRecord(authorization);
        }

        const documentSets = getDocumentSets(authorization);
        const authorizedDocuments =
            documentSets.authorizedDocuments;
        const excludedDocuments =
            documentSets.excludedDocuments;

        const allDocuments =
            authorizedDocuments.concat(excludedDocuments);

        const documentIds = allDocuments.map(function (document) {
            return document.documentId;
        });

        const documentSetValid =
            allDocuments.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size === EXPECTED_DOCUMENTS.length;

        const authorizedDocumentsValid =
            authorizedDocuments.every(function (document) {
                return (
                    document.documentChanged === true &&
                    document.permanentWriteRequired === true &&
                    document.rollbackRequiredBeforeWrite === true &&
                    document.executionAction ===
                        "Replace complete permanent JSON file" &&
                    document.authorizationStatus ===
                        "Human Authorized — Awaiting Execution" &&
                    document.executionAuthorized === true &&
                    document.writeAuthorized === true &&
                    document.rollbackAuthorized === true &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false &&
                    typeof document.targetPath === "string" &&
                    document.targetPath.length > 0 &&
                    typeof document.backupPath === "string" &&
                    document.backupPath.length > 0 &&
                    typeof document.proposedCopyPath === "string" &&
                    document.proposedCopyPath.length > 0 &&
                    typeof document.originalChecksum === "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.proposedChecksum === "string" &&
                    document.proposedChecksum.length > 0
                );
            });

        const excludedDocumentsValid =
            excludedDocuments.every(function (document) {
                return (
                    document.documentChanged === false &&
                    document.permanentWriteRequired === false &&
                    document.rollbackRequiredBeforeWrite === false &&
                    document.executionAction ===
                        "No Write Required" &&
                    document.authorizationStatus ===
                        "Excluded — No Write Required" &&
                    document.executionAuthorized === false &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false &&
                    typeof document.targetPath === "string" &&
                    document.targetPath.length > 0 &&
                    typeof document.originalChecksum === "string" &&
                    document.originalChecksum.length > 0 &&
                    typeof document.proposedChecksum === "string" &&
                    document.proposedChecksum.length > 0
                );
            });

        const sequenceValid =
            allDocuments.length === EXPECTED_DOCUMENTS.length &&
            allDocuments
                .slice()
                .sort(function (first, second) {
                    return Number(first.sequence) -
                        Number(second.sequence);
                })
                .every(function (document, index) {
                    return (
                        document.sequence === index + 1 &&
                        document.documentId === EXPECTED_DOCUMENTS[index]
                    );
                });

        checks.push(buildCheck(
            "Authorization record exists",
            isPlainObject(authorization),
            "A Human Controlled Execution Authorization Record is required."
        ));

        checks.push(buildCheck(
            "Authorization record accepted",
            Boolean(authorization && authorization.accepted),
            "The Human Controlled Execution Authorization Record must be accepted."
        ));

        checks.push(buildCheck(
            "Authorization validation accepted",
            Boolean(
                authorizationValidation &&
                authorizationValidation.accepted
            ),
            "The Human Controlled Execution Authorization Record must pass validation."
        ));

        checks.push(buildCheck(
            "Explicit human approval satisfied",
            Boolean(
                authorization &&
                authorization.humanApprovalSatisfied === true &&
                authorization.humanDecision ===
                    "Approve Execution Authorization"
            ),
            "The exact human approval decision is required."
        ));

        checks.push(buildCheck(
            "Expected planned document count",
            Boolean(authorization) &&
                authorization.plannedDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Authorization counts valid",
            Boolean(authorization) &&
                authorization.authorizedDocumentCount ===
                    authorizedDocuments.length &&
                authorization.excludedDocumentCount ===
                    excludedDocuments.length &&
                authorization.plannedDocumentCount ===
                    authorizedDocuments.length +
                    excludedDocuments.length,
            "Authorized and excluded document counts must match the record."
        ));

        checks.push(buildCheck(
            "Expected authorization document set",
            documentSetValid,
            "The record must contain the unique six-document permanent set."
        ));

        checks.push(buildCheck(
            "Expected document order",
            sequenceValid,
            "The six permanent documents must retain their approved sequence."
        ));

        checks.push(buildCheck(
            "Authorized documents valid",
            authorizedDocumentsValid,
            "Every authorized document must be complete, checksum-backed, rollback-protected, and human-authorized."
        ));

        checks.push(buildCheck(
            "Excluded documents valid",
            excludedDocumentsValid,
            "Every no-write document must remain complete, excluded, and unauthorized."
        ));

        checks.push(buildCheck(
            "Execution authorization valid",
            Boolean(authorization) &&
                authorization.executionAuthorized === true,
            "The accepted human authorization record must authorize controlled execution."
        ));

        checks.push(buildCheck(
            "Write authorization valid",
            Boolean(authorization) &&
                authorization.writeAuthorized ===
                    (authorizedDocuments.length > 0),
            "Write authorization must match whether write-required documents exist."
        ));

        checks.push(buildCheck(
            "Rollback authorization valid",
            Boolean(authorization) &&
                authorization.rollbackAuthorized ===
                    (authorizedDocuments.length > 0),
            "Rollback authorization must accompany authorized writes."
        ));

        checks.push(buildCheck(
            "No permanent writes executed",
            Boolean(authorization) &&
                authorization.permanentWritesExecuted === false,
            "No permanent write may have occurred before manifest generation."
        ));

        checks.push(buildCheck(
            "No restore executed",
            Boolean(authorization) &&
                authorization.restoreExecuted === false,
            "No rollback restoration may have occurred before manifest generation."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks,
            authorizationValidation: authorizationValidation
        };
    }

    function buildAuthorizedExecutionEntry(document, index) {
        return {
            sequence: index + 1,
            sourceSequence: document.sequence,
            order: document.order,
            documentId: document.documentId,
            updateMode: document.updateMode,

            documentChanged: true,
            permanentWriteRequired: true,
            excludedFromExecution: false,

            targetPath: document.targetPath,
            backupPath: document.backupPath,
            proposedCopyPath: document.proposedCopyPath,

            originalChecksum: document.originalChecksum,
            proposedChecksum: document.proposedChecksum,

            prerequisiteChecks: [
                "Human authorization record accepted",
                "Explicit human approval verified",
                "Document identity verified",
                "Execution order verified",
                "Original checksum present",
                "Proposed checksum present",
                "Backup path present",
                "Rollback authorization verified",
                "Execution mode confirmed disabled"
            ],

            prerequisiteStatus: "Passed",

            intendedAction:
                "Replace complete permanent JSON file",

            executionMode: EXECUTION_MODE,
            executionStatus:
                "Disabled — Authorized Manifest Entry",
            executionDecision:
                "Authorized but Not Executed",

            sourceExecutionAuthorized: true,
            sourceWriteAuthorized: true,
            sourceRollbackAuthorized: true,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWriteAttempted: false,
            actualWriteExecuted: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function buildExcludedExecutionEntry(document, index) {
        return {
            sequence: index + 1,
            sourceSequence: document.sequence,
            order: document.order,
            documentId: document.documentId,
            updateMode: document.updateMode,

            documentChanged: false,
            permanentWriteRequired: false,
            excludedFromExecution: true,

            targetPath: document.targetPath,
            backupPath: null,
            proposedCopyPath: null,

            originalChecksum: document.originalChecksum,
            proposedChecksum: document.proposedChecksum,

            prerequisiteChecks: [
                "Human authorization record accepted",
                "Document identity verified",
                "Execution order verified",
                "No-write decision verified",
                "Execution mode confirmed disabled"
            ],

            prerequisiteStatus: "Passed",

            intendedAction: "No Write Required",

            executionMode: EXECUTION_MODE,
            executionStatus:
                "Excluded — No Write Required",
            executionDecision:
                "No Execution Required",

            sourceExecutionAuthorized: false,
            sourceWriteAuthorized: false,
            sourceRollbackAuthorized: false,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWriteAttempted: false,
            actualWriteExecuted: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedManifest(message, authorization, validation) {
        const snapshot =
            window.TMSSessionContext.getSnapshot();
        const generatedAt =
            new Date().toISOString();

        return deepFreeze({
            manifestType: MANIFEST_TYPE,
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,

            manifestId: createManifestId(
                snapshot.sessionNumber,
                generatedAt
            ),

            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceAuthorizationAccepted: Boolean(
                authorization &&
                authorization.accepted
            ),

            sourceAuthorizationId:
                authorization
                    ? authorization.authorizationId
                    : null,

            sourceAuthorizationStatus:
                authorization
                    ? authorization.authorizationStatus
                    : "Unavailable",

            validationAccepted: Boolean(
                validation &&
                validation.accepted
            ),

            validationChecks:
                validation ? validation.checks : [],

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            sourceAuthorizedDocumentCount:
                authorization
                    ? authorization.authorizedDocumentCount || 0
                    : 0,

            sourceExcludedDocumentCount:
                authorization
                    ? authorization.excludedDocumentCount || 0
                    : 0,

            executionDocumentCount: 0,
            writeRequiredDocumentCount: 0,
            excludedDocumentCount: 0,
            executionEntries: [],

            prerequisitesVerified: false,
            manifestReady: false,

            humanAuthorizationVerified: false,
            sourceExecutionAuthorized: false,
            sourceWriteAuthorized: false,
            sourceRollbackAuthorized: false,

            executionAuthorized: false,
            writeAuthorized: false,
            rollbackAuthorized: false,

            actualWritesAttempted: false,
            permanentWritesExecuted: false,
            restoreExecuted: false,

            manifestStatus: "Rejected",

            requiredNextAction:
                "Correct the failed human-authorization or execution-manifest prerequisite checks.",

            reviewRequired: true
        });
    }

    async function generateExecutionManifest(authorization) {
        const sourceAuthorization =
            authorization ||
            window
                .TMSHumanControlledExecutionAuthorizationEngine
                .getLastAuthorizationRecord();

        const validation =
            validateAuthorizationPackage(sourceAuthorization);

        if (!validation.accepted) {
            lastExecutionManifest =
                rejectedManifest(
                    "The Human Controlled Execution Authorization Record failed Permanent Write Execution manifest validation.",
                    sourceAuthorization,
                    validation
                );

            return lastExecutionManifest;
        }

        const documentSets =
            getDocumentSets(sourceAuthorization);

        const combinedDocuments =
            clone(
                documentSets.authorizedDocuments.map(function (document) {
                    return {
                        sourceType: "authorized",
                        document: document
                    };
                }).concat(
                    documentSets.excludedDocuments.map(function (document) {
                        return {
                            sourceType: "excluded",
                            document: document
                        };
                    })
                )
            ).sort(function (first, second) {
                return Number(first.document.sequence) -
                    Number(second.document.sequence);
            });

        const executionEntries =
            combinedDocuments.map(function (item, index) {
                if (item.sourceType === "authorized") {
                    return buildAuthorizedExecutionEntry(
                        item.document,
                        index
                    );
                }

                return buildExcludedExecutionEntry(
                    item.document,
                    index
                );
            });

        const allEntriesSafe =
            executionEntries.every(function (entry) {
                const disabledSafetyValid =
                    entry.prerequisiteStatus === "Passed" &&
                    entry.executionMode === EXECUTION_MODE &&
                    entry.executionAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.rollbackAuthorized === false &&
                    entry.actualWriteAttempted === false &&
                    entry.actualWriteExecuted === false &&
                    entry.permanentWriteExecuted === false &&
                    entry.restoreExecuted === false;

                if (entry.permanentWriteRequired === true) {
                    return (
                        disabledSafetyValid &&
                        entry.excludedFromExecution === false &&
                        entry.intendedAction ===
                            "Replace complete permanent JSON file" &&
                        entry.executionStatus ===
                            "Disabled — Authorized Manifest Entry" &&
                        entry.executionDecision ===
                            "Authorized but Not Executed" &&
                        entry.sourceExecutionAuthorized === true &&
                        entry.sourceWriteAuthorized === true &&
                        entry.sourceRollbackAuthorized === true
                    );
                }

                return (
                    disabledSafetyValid &&
                    entry.permanentWriteRequired === false &&
                    entry.excludedFromExecution === true &&
                    entry.intendedAction === "No Write Required" &&
                    entry.executionStatus ===
                        "Excluded — No Write Required" &&
                    entry.executionDecision ===
                        "No Execution Required" &&
                    entry.sourceExecutionAuthorized === false &&
                    entry.sourceWriteAuthorized === false &&
                    entry.sourceRollbackAuthorized === false
                );
            });

        if (!allEntriesSafe) {
            lastExecutionManifest =
                rejectedManifest(
                    "One or more permanent document execution entries failed disabled-mode safety validation.",
                    sourceAuthorization,
                    validation
                );

            return lastExecutionManifest;
        }

        const snapshot =
            window.TMSSessionContext.getSnapshot();
        const generatedAt =
            new Date().toISOString();

        const writeRequiredDocumentCount =
            executionEntries.filter(function (entry) {
                return entry.permanentWriteRequired === true;
            }).length;

        const excludedDocumentCount =
            executionEntries.filter(function (entry) {
                return entry.excludedFromExecution === true;
            }).length;

        lastExecutionManifest =
            deepFreeze({
                manifestType: MANIFEST_TYPE,
                engineVersion: ENGINE_VERSION,
                executionMode: EXECUTION_MODE,

                manifestId:
                    createManifestId(
                        snapshot.sessionNumber,
                        generatedAt
                    ),

                generatedAt: generatedAt,
                sessionNumber:
                    snapshot.sessionNumber,

                accepted: true,

                message:
                    "The " + EXPECTED_DOCUMENTS.length + "-document permanent write execution manifest was generated from an accepted Human Controlled Execution Authorization Record in Disabled mode. No files were changed.",

                sourceAuthorizationAccepted: true,
                sourceAuthorizationId:
                    sourceAuthorization.authorizationId,
                sourceAuthorizationStatus:
                    sourceAuthorization.authorizationStatus,
                sourceAuthorizationEngineVersion:
                    sourceAuthorization.engineVersion,
                sourceAuthorizationGeneratedAt:
                    sourceAuthorization.generatedAt,

                sourceExecutionPlanId:
                    sourceAuthorization.sourceExecutionPlanId,

                validationAccepted: true,
                validationChecks: validation.checks,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                sourceAuthorizedDocumentCount:
                    sourceAuthorization.authorizedDocumentCount,
                sourceExcludedDocumentCount:
                    sourceAuthorization.excludedDocumentCount,

                executionDocumentCount:
                    executionEntries.length,
                writeRequiredDocumentCount:
                    writeRequiredDocumentCount,
                excludedDocumentCount:
                    excludedDocumentCount,

                executionEntries:
                    executionEntries,

                prerequisitesVerified: true,
                manifestReady: true,

                humanAuthorizationVerified: true,

                sourceExecutionAuthorized:
                    sourceAuthorization.executionAuthorized,
                sourceWriteAuthorized:
                    sourceAuthorization.writeAuthorized,
                sourceRollbackAuthorized:
                    sourceAuthorization.rollbackAuthorized,

                executionAuthorized: false,
                writeAuthorized: false,
                rollbackAuthorized: false,

                actualWritesAttempted: false,
                permanentWritesExecuted: false,
                restoreExecuted: false,

                manifestStatus:
                    "Ready for Review — Human Authorized / Execution Disabled",

                requiredNextAction:
                    "Submit this disabled execution manifest for human review. No write-enabled implementation may proceed without a separately approved module.",

                reviewRequired: true,

                reviewChoices: [
                    "Approve Disabled Manifest Structure",
                    "Revise Session",
                    "Cancel Manifest"
                ]
            });

        return lastExecutionManifest;
    }

    function validateExecutionManifest(manifest) {
        const current =
            manifest || lastExecutionManifest;

        const checks = [];

        checks.push(buildCheck(
            "Execution manifest exists",
            isPlainObject(current),
            "A Permanent Write Execution Manifest is required."
        ));

        checks.push(buildCheck(
            "Execution manifest accepted",
            Boolean(current && current.accepted),
            "The execution manifest must be accepted."
        ));

        checks.push(buildCheck(
            "Execution mode is disabled",
            Boolean(current) &&
                current.executionMode === EXECUTION_MODE,
            "Version 2.1.0 must remain in Disabled mode."
        ));

        checks.push(buildCheck(
            "Human authorization verified",
            Boolean(current) &&
                current.humanAuthorizationVerified === true,
            "The manifest must verify an accepted human authorization record."
        ));

        checks.push(buildCheck(
            "Expected execution document count",
            Boolean(current) &&
                current.executionDocumentCount ===
                    EXPECTED_DOCUMENTS.length,
            "Exactly six permanent documents must be represented."
        ));

        checks.push(buildCheck(
            "Source document counts valid",
            Boolean(current) &&
                current.sourceAuthorizedDocumentCount +
                    current.sourceExcludedDocumentCount ===
                        EXPECTED_DOCUMENTS.length &&
                current.writeRequiredDocumentCount ===
                    current.sourceAuthorizedDocumentCount &&
                current.excludedDocumentCount ===
                    current.sourceExcludedDocumentCount,
            "Source authorization and manifest document counts must match."
        ));

        checks.push(buildCheck(
            "Prerequisites verified",
            Boolean(current) &&
                current.prerequisitesVerified === true,
            "All execution-manifest prerequisites must be verified."
        ));

        checks.push(buildCheck(
            "Manifest ready",
            Boolean(current) &&
                current.manifestReady === true,
            "The disabled execution manifest must be ready for review."
        ));

        checks.push(buildCheck(
            "Source execution authorization retained",
            Boolean(current) &&
                current.sourceExecutionAuthorized === true,
            "The source authorization must retain controlled execution approval."
        ));

        checks.push(buildCheck(
            "Manifest execution remains disabled",
            Boolean(current) &&
                current.executionAuthorized === false,
            "The manifest engine must not activate execution."
        ));

        checks.push(buildCheck(
            "Manifest write remains disabled",
            Boolean(current) &&
                current.writeAuthorized === false,
            "The manifest engine must not activate permanent writes."
        ));

        checks.push(buildCheck(
            "Manifest rollback remains disabled",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "The manifest engine must not execute rollback."
        ));

        checks.push(buildCheck(
            "No actual writes attempted",
            Boolean(current) &&
                current.actualWritesAttempted === false,
            "No actual permanent write may be attempted."
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
            "No rollback restoration may occur."
        ));

        const entries =
            current &&
            Array.isArray(current.executionEntries)
                ? current.executionEntries
                : [];

        const documentIds =
            entries.map(function (entry) {
                return entry.documentId;
            });

        const documentSetValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                return documentIds.includes(documentId);
            }) &&
            new Set(documentIds).size === EXPECTED_DOCUMENTS.length;

        checks.push(buildCheck(
            "Expected execution document set",
            documentSetValid,
            "The manifest must contain the unique six-document permanent set."
        ));

        const entriesValid =
            entries.length === EXPECTED_DOCUMENTS.length &&
            entries.every(function (entry, index) {
                const commonChecks =
                    entry.sequence === index + 1 &&
                    entry.documentId === EXPECTED_DOCUMENTS[index] &&
                    entry.prerequisiteStatus === "Passed" &&
                    entry.executionMode === EXECUTION_MODE &&
                    typeof entry.targetPath === "string" &&
                    entry.targetPath.length > 0 &&
                    typeof entry.originalChecksum === "string" &&
                    entry.originalChecksum.length > 0 &&
                    typeof entry.proposedChecksum === "string" &&
                    entry.proposedChecksum.length > 0 &&
                    entry.executionAuthorized === false &&
                    entry.writeAuthorized === false &&
                    entry.rollbackAuthorized === false &&
                    entry.actualWriteAttempted === false &&
                    entry.actualWriteExecuted === false &&
                    entry.permanentWriteExecuted === false &&
                    entry.restoreExecuted === false;

                if (entry.permanentWriteRequired === true) {
                    return (
                        commonChecks &&
                        entry.excludedFromExecution === false &&
                        entry.intendedAction ===
                            "Replace complete permanent JSON file" &&
                        entry.executionStatus ===
                            "Disabled — Authorized Manifest Entry" &&
                        entry.executionDecision ===
                            "Authorized but Not Executed" &&
                        entry.sourceExecutionAuthorized === true &&
                        entry.sourceWriteAuthorized === true &&
                        entry.sourceRollbackAuthorized === true &&
                        typeof entry.backupPath === "string" &&
                        entry.backupPath.length > 0 &&
                        typeof entry.proposedCopyPath === "string" &&
                        entry.proposedCopyPath.length > 0
                    );
                }

                return (
                    commonChecks &&
                    entry.permanentWriteRequired === false &&
                    entry.excludedFromExecution === true &&
                    entry.intendedAction === "No Write Required" &&
                    entry.executionStatus ===
                        "Excluded — No Write Required" &&
                    entry.executionDecision ===
                        "No Execution Required" &&
                    entry.sourceExecutionAuthorized === false &&
                    entry.sourceWriteAuthorized === false &&
                    entry.sourceRollbackAuthorized === false &&
                    entry.backupPath === null &&
                    entry.proposedCopyPath === null
                );
            });

        checks.push(buildCheck(
            "Execution entries valid",
            entriesValid,
            "Every manifest entry must be complete, ordered, checksum-backed, disabled, and non-destructive."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    async function formatExecutionManifest(manifest) {
        const current =
            manifest ||
            await generateExecutionManifest();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION WRITE EXECUTION MANIFEST",
            "Manifest ID: " + current.manifestId,
            "Accepted: " +
                (current.accepted ? "YES" : "NO"),
            "Work Session: " +
                current.sessionNumber,
            "Engine Version: " +
                current.engineVersion,
            "Execution Mode: " +
                current.executionMode,
            "Manifest Status: " +
                current.manifestStatus,
            "Execution Documents: " +
                current.executionDocumentCount,
            "Write-Required Documents: " +
                current.writeRequiredDocumentCount,
            "Excluded Documents: " +
                current.excludedDocumentCount,
            "Human Authorization Verified: " +
                (
                    current.humanAuthorizationVerified
                        ? "YES"
                        : "NO"
                ),
            "Prerequisites Verified: " +
                (
                    current.prerequisitesVerified
                        ? "YES"
                        : "NO"
                ),
            "Manifest Ready: " +
                (
                    current.manifestReady
                        ? "YES"
                        : "NO"
                ),
            "Manifest Execution Authorized: NO",
            "Manifest Write Authorized: NO",
            "Manifest Rollback Authorized: NO",
            "Actual Writes Attempted: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (
            current.executionEntries || []
        ).forEach(function (entry) {
            lines.push(
                entry.sequence +
                " | " +
                entry.documentId +
                " | " +
                entry.updateMode +
                " | " +
                entry.executionStatus +
                " | " +
                (
                    entry.permanentWriteRequired
                        ? "AUTHORIZED SOURCE / NO FILE CHANGE"
                        : "NO WRITE REQUIRED"
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

    function getLastExecutionManifest() {
        return lastExecutionManifest;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentWriteExecutionEngine =
        Object.freeze({
            engineVersion: ENGINE_VERSION,
            executionMode: EXECUTION_MODE,
            generateExecutionManifest:
                generateExecutionManifest,
            validateExecutionManifest:
                validateExecutionManifest,
            formatExecutionManifest:
                formatExecutionManifest,
            getLastExecutionManifest:
                getLastExecutionManifest,
            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Permanent Write Execution Engine v" +
        ENGINE_VERSION +
        " initialized in " +
        EXECUTION_MODE +
        " Mode for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
