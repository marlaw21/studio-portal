/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 116 — Rollback Package Generator v2.0.0
File: js/session/rollback-package-generator.js

Purpose:
Generate a deterministic, review-only rollback package for an accepted
Permanent Transaction Manager transaction before any controlled permanent
output execution is allowed to begin.

This component does not read, write, replace, delete, or restore permanent
files. It prepares the required recovery package contract for the controlled
execution and rollback layer.

Version 1.2.0 supports the six-document permanent set and accepts governed
proposed-document identity from either id or documentId.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const PACKAGE_TYPE = "TMS-OS Permanent Documentation Rollback Package";
    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastRollbackPackage = null;

    if (!window.TMSSessionContext || !window.TMSPermanentTransactionManager) {
        console.error(
            "Rollback Package Generator could not initialize because its dependencies are unavailable."
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

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function createPackageId(sessionNumber, generatedAt) {
        const normalizedTimestamp = generatedAt
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);

        return [
            "TMS",
            "ROLLBACK",
            String(sessionNumber).padStart(3, "0"),
            normalizedTimestamp
        ].join("-");
    }

    function createBackupPath(sessionNumber, documentId) {
        return [
            "rollback",
            "work-session-" + String(sessionNumber).padStart(3, "0"),
            documentId + ".original.json"
        ].join("/");
    }

    function createReplacementPath(sessionNumber, documentId) {
        return [
            "rollback",
            "work-session-" + String(sessionNumber).padStart(3, "0"),
            documentId + ".proposed.json"
        ].join("/");
    }

    function buildValidationCheck(name, passed, message) {
        return {
            name: name,
            passed: Boolean(passed),
            message: message
        };
    }

    function validateTransaction(transaction) {
        const checks = [];
        const manifest = transaction && transaction.manifest;
        const replacementDocuments = transaction && transaction.replacementDocuments;
        const rollbackMetadata = transaction && transaction.rollbackMetadata;

        checks.push(buildValidationCheck(
            "Transaction exists",
            isPlainObject(transaction),
            "A Permanent Transaction Manager transaction is required."
        ));

        checks.push(buildValidationCheck(
            "Transaction accepted",
            Boolean(transaction && transaction.accepted),
            "The transaction must be accepted by the Permanent Transaction Manager."
        ));

        checks.push(buildValidationCheck(
            "Transaction remains review-only",
            Boolean(transaction) &&
                transaction.permanentWritesExecuted === false,
            "No permanent write may occur before rollback package generation."
        ));

        checks.push(buildValidationCheck(
            "Write remains unauthorized",
            Boolean(transaction) &&
                transaction.writeAuthorized === false,
            "Rollback package generation must occur before write authorization."
        ));

        checks.push(buildValidationCheck(
            "Manifest exists",
            Array.isArray(manifest),
            "The accepted transaction must contain a transaction manifest."
        ));

        checks.push(buildValidationCheck(
            "Replacement documents exist",
            Array.isArray(replacementDocuments),
            "The accepted transaction must contain replacement documents."
        ));

        checks.push(buildValidationCheck(
            "Rollback metadata exists",
            Array.isArray(rollbackMetadata),
            "The accepted transaction must contain rollback metadata."
        ));

        checks.push(buildValidationCheck(
            "Expected manifest count",
            Array.isArray(manifest) &&
                manifest.length === EXPECTED_DOCUMENTS.length,
            "The manifest must contain exactly six permanent documents."
        ));

        checks.push(buildValidationCheck(
            "Expected replacement count",
            Array.isArray(replacementDocuments) &&
                replacementDocuments.length === EXPECTED_DOCUMENTS.length,
            "Exactly six replacement documents are required."
        ));

        checks.push(buildValidationCheck(
            "Expected rollback metadata count",
            Array.isArray(rollbackMetadata) &&
                rollbackMetadata.length === EXPECTED_DOCUMENTS.length,
            "Exactly six rollback metadata records are required."
        ));

        const manifestIds = Array.isArray(manifest)
            ? manifest.map(function (item) {
                return item.documentId;
            })
            : [];

        const replacementIds = Array.isArray(replacementDocuments)
            ? replacementDocuments.map(function (item) {
                return item.documentId;
            })
            : [];

        const rollbackIds = Array.isArray(rollbackMetadata)
            ? rollbackMetadata.map(function (item) {
                return item.documentId;
            })
            : [];

        const expectedDocumentsPresent = EXPECTED_DOCUMENTS.every(function (documentId) {
            return manifestIds.includes(documentId) &&
                replacementIds.includes(documentId) &&
                rollbackIds.includes(documentId);
        });

        checks.push(buildValidationCheck(
            "Expected document set",
            expectedDocumentsPresent &&
                manifestIds.length === EXPECTED_DOCUMENTS.length &&
                replacementIds.length === EXPECTED_DOCUMENTS.length &&
                rollbackIds.length === EXPECTED_DOCUMENTS.length,
            "The transaction must contain the complete six-document permanent set."
        ));

        const manifestWriteLocksValid = Array.isArray(manifest) &&
            manifest.every(function (item) {
                return item.writeAuthorized === false;
            });

        checks.push(buildValidationCheck(
            "Manifest write locks",
            manifestWriteLocksValid,
            "Every manifest item must remain unauthorized for writing."
        ));

        const enrichedEvidenceValid =
            Array.isArray(manifest) &&
            manifest.length ===
                EXPECTED_DOCUMENTS.length &&
            manifest.every(function (item) {
                const baseValid =
                    typeof item.writerVersion ===
                        "string" &&
                    item.writerVersion.length > 0 &&
                    typeof item.proposalAction ===
                        "string" &&
                    item.proposalAction.length > 0 &&
                    isPlainObject(item.sourceSession) &&
                    isPlainObject(
                        item.governanceEnvelope
                    ) &&
                    item.governanceEnvelope
                        .governanceMode ===
                        "Disabled" &&
                    item.governanceEnvelope
                        .documentationMode ===
                        "Review Only" &&
                    item.governanceEnvelope
                        .executionMode ===
                        "Disabled" &&
                    item.governanceEnvelope
                        .executionLockStatus ===
                        "Locked" &&
                    item.downstreamGovernanceDependency ===
                        false;

                if (!baseValid) {
                    return false;
                }

                if (
                    item.documentId ===
                    "WORKSPACE-SNAPSHOT-HISTORY-001"
                ) {
                    return (
                        isPlainObject(
                            item.transactionMetadata
                        ) &&
                        item.transactionMetadata
                            .governedDocumentId ===
                            item.documentId &&
                        item.transactionMetadata
                            .collectionName ===
                            "snapshots" &&
                        item.transactionMetadata
                            .transactionCollectionName ===
                            "items"
                    );
                }

                return true;
            });

        checks.push(buildValidationCheck(
            "Enriched proposal evidence",
            enrichedEvidenceValid,
            "Every transaction manifest item must retain approved source-session identity, governance safeguards, and required transaction metadata."
        ));

        const rollbackRequirementsValid =
            Array.isArray(manifest) &&
            Array.isArray(rollbackMetadata) &&
            manifest.length === EXPECTED_DOCUMENTS.length &&
            rollbackMetadata.length === EXPECTED_DOCUMENTS.length &&
            EXPECTED_DOCUMENTS.every(function (documentId) {
                const manifestItem =
                    manifest.find(function (item) {
                        return item.documentId === documentId;
                    });

                const rollbackItem =
                    rollbackMetadata.find(function (item) {
                        return item.documentId === documentId;
                    });

                if (
                    !isPlainObject(manifestItem) ||
                    !isPlainObject(rollbackItem) ||
                    rollbackItem.writeAuthorized !== false
                ) {
                    return false;
                }

                if (manifestItem.permanentWriteRequired === true) {
                    return (
                        manifestItem.documentChanged === true &&
                        rollbackItem.rollbackRequiredBeforeWrite === true &&
                        rollbackItem.originalDocumentMustBeCopied === true
                    );
                }

                return (
                    manifestItem.documentChanged === false &&
                    manifestItem.permanentWriteRequired === false &&
                    rollbackItem.rollbackRequiredBeforeWrite === false &&
                    rollbackItem.originalDocumentMustBeCopied === false
                );
            });

        checks.push(buildValidationCheck(
            "Rollback requirements",
            rollbackRequirementsValid,
            "Each document must preserve its approved write decision and require original capture only when a permanent write is required."
        ));

        const replacementDocumentsValid = Array.isArray(replacementDocuments) &&
            replacementDocuments.every(function (item) {
                if (!isPlainObject(item.proposedDocument)) {
                    return false;
                }

                const proposedIdentity =
                    typeof item.proposedDocument.id === "string" &&
                    item.proposedDocument.id.trim().length > 0
                        ? item.proposedDocument.id.trim()
                        : (
                            typeof item.proposedDocument.documentId === "string" &&
                            item.proposedDocument.documentId.trim().length > 0
                                ? item.proposedDocument.documentId.trim()
                                : ""
                        );

                return proposedIdentity === item.documentId;
            });

        checks.push(buildValidationCheck(
            "Replacement document identities",
            replacementDocumentsValid,
            "Every proposed document ID must match its transaction target."
        ));

        return {
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        };
    }

    function buildDocumentRollbackEntry(
        documentId,
        transaction,
        sessionNumber
    ) {
        const manifestItem = transaction.manifest.find(function (item) {
            return item.documentId === documentId;
        });

        const replacementItem = transaction.replacementDocuments.find(function (item) {
            return item.documentId === documentId;
        });

        const rollbackItem = transaction.rollbackMetadata.find(function (item) {
            return item.documentId === documentId;
        });

        const permanentWriteRequired =
            manifestItem.permanentWriteRequired === true;

        const documentChanged =
            manifestItem.documentChanged === true;

        const rollbackRequiredBeforeWrite =
            rollbackItem.rollbackRequiredBeforeWrite === true;

        return {
            order: manifestItem.order,
            documentId: documentId,
            updateMode: manifestItem.updateMode,
            targetPath: manifestItem.targetPath,

            backupPath: createBackupPath(sessionNumber, documentId),
            proposedCopyPath: createReplacementPath(sessionNumber, documentId),

            documentChanged: documentChanged,
            permanentWriteRequired: permanentWriteRequired,
            rollbackRequiredBeforeWrite: rollbackRequiredBeforeWrite,

            originalDocumentCaptureRequired:
                rollbackRequiredBeforeWrite,
            originalDocumentCaptured: false,
            originalDocument: null,

            proposedDocumentCaptured: true,
            proposedDocument: clone(replacementItem.proposedDocument),

            sourceVersion: manifestItem.sourceVersion,
            proposedVersion: manifestItem.proposedVersion,
            proposedLastUpdated: manifestItem.proposedLastUpdated,

            sourceSectionCount: manifestItem.sourceSectionCount,
            proposedSectionCount: manifestItem.proposedSectionCount,

            sourceCollectionName:
                manifestItem.sourceCollectionName || null,
            proposedCollectionName:
                manifestItem.proposedCollectionName || null,
            sourceItemCount:
                Number.isInteger(manifestItem.sourceItemCount)
                    ? manifestItem.sourceItemCount
                    : manifestItem.sourceSectionCount,
            proposedItemCount:
                Number.isInteger(manifestItem.proposedItemCount)
                    ? manifestItem.proposedItemCount
                    : manifestItem.proposedSectionCount,

            writerId:
                manifestItem.writerId,

            writerVersion:
                manifestItem.writerVersion,

            proposalAction:
                manifestItem.proposalAction,

            reviewRequired:
                manifestItem.reviewRequired,

            reviewChoices:
                clone(
                    manifestItem.reviewChoices || []
                ),

            sourceSession:
                clone(
                    manifestItem.sourceSession
                ),

            governanceEnvelope:
                clone(
                    manifestItem.governanceEnvelope
                ),

            transactionMetadata:
                manifestItem.transactionMetadata
                    ? clone(
                        manifestItem.transactionMetadata
                    )
                    : null,

            governanceEnvelopeRetained:
                manifestItem.governanceEnvelopeRetained,

            sourceSessionIdentityRetained:
                manifestItem.sourceSessionIdentityRetained,

            transactionMetadataRetained:
                manifestItem.transactionMetadataRetained,

            downstreamGovernanceDependency:
                manifestItem.downstreamGovernanceDependency,

            checksumRequired: true,
            originalChecksum: null,
            proposedChecksum: null,

            rollbackSource: rollbackItem.rollbackSource,

            backupStatus:
                permanentWriteRequired
                    ? "Pending Original Document Capture"
                    : "Pending Verification — No Write Required",

            executionStatus:
                permanentWriteRequired
                    ? "Not Started"
                    : "No Write Required",

            restoreStatus: "Not Required",
            verificationStatus: "Pending",

            writeAuthorized: false,
            rollbackAuthorized: false,
            permanentWriteExecuted: false,
            restoreExecuted: false
        };
    }

    function rejectedPackage(message, transaction, validation) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        return deepFreeze({
            packageType: PACKAGE_TYPE,
            generatorVersion: ENGINE_VERSION,
            packageId: createPackageId(snapshot.sessionNumber, generatedAt),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: false,
            message: message,

            sourceTransactionAccepted: Boolean(transaction && transaction.accepted),
            sourceTransactionStatus: transaction
                ? transaction.transactionStatus
                : "Unavailable",

            validationAccepted: Boolean(validation && validation.accepted),
            validationChecks: validation ? validation.checks : [],

            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            rollbackDocumentCount: 0,
            writeRequiredDocumentCount: 0,
            noWriteRequiredDocumentCount: 0,
            documents: [],

            originalDocumentsCaptured: false,
            rollbackReady: false,
            rollbackAuthorized: false,
            writeAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            packageStatus: "Rejected",
            reviewRequired: true
        });
    }

    async function generateRollbackPackage(transaction) {
        const currentTransaction = transaction ||
            await window.TMSPermanentTransactionManager.createTransaction();

        const validation = validateTransaction(currentTransaction);

        if (!validation.accepted) {
            lastRollbackPackage = rejectedPackage(
                "The Permanent Transaction Manager transaction failed rollback package validation.",
                currentTransaction,
                validation
            );

            return lastRollbackPackage;
        }

        const snapshot = window.TMSSessionContext.getSnapshot();
        const generatedAt = new Date().toISOString();

        const documents = EXPECTED_DOCUMENTS.map(function (documentId) {
            return buildDocumentRollbackEntry(
                documentId,
                currentTransaction,
                snapshot.sessionNumber
            );
        });

        const writeRequiredDocumentCount =
            documents.filter(function (document) {
                return document.permanentWriteRequired === true;
            }).length;

        const noWriteRequiredDocumentCount =
            documents.length - writeRequiredDocumentCount;

        lastRollbackPackage = deepFreeze({
            packageType: PACKAGE_TYPE,
            generatorVersion: ENGINE_VERSION,
            packageId: createPackageId(
                snapshot.sessionNumber,
                generatedAt
            ),
            generatedAt: generatedAt,
            sessionNumber: snapshot.sessionNumber,

            accepted: true,
            message:
                "Six-document rollback package generated for review. " +
                "Original permanent documents have not yet been captured, " +
                "and no permanent files were changed.",

            sourceTransactionAccepted: true,
            sourceTransactionStatus: currentTransaction.transactionStatus,
            sourceTransactionManagerVersion: currentTransaction.managerVersion,
            sourceTransactionGeneratedAt: currentTransaction.generatedAt,

            validationAccepted: true,
            validationChecks: validation.checks,

            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            rollbackDocumentCount: documents.length,
            writeRequiredDocumentCount: writeRequiredDocumentCount,
            noWriteRequiredDocumentCount: noWriteRequiredDocumentCount,
            documents: documents,

            originalDocumentsCaptured: false,
            proposedDocumentsCaptured: true,

            governanceEvidenceRetained: true,
            sourceSessionIdentityRetained: true,
            transactionMetadataRetained:
                documents.some(function (
                    document
                ) {
                    return (
                        document.transactionMetadata !==
                        null
                    );
                }),
            downstreamGovernanceDependency: false,

            rollbackReady: false,
            rollbackAuthorized: false,
            writeAuthorized: false,

            permanentWritesExecuted: false,
            restoreExecuted: false,

            requiredNextAction:
                "Capture and verify all six current live permanent documents while preserving no-write exclusions.",

            packageStatus:
                "Generated — Awaiting Original Document Capture",

            reviewRequired: true,
            reviewChoices: [
                "Approve Rollback Package Structure",
                "Revise Session",
                "Cancel Rollback Package"
            ]
        });

        return lastRollbackPackage;
    }

    async function formatRollbackPackageText(rollbackPackage) {
        const current = rollbackPackage ||
            await generateRollbackPackage();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION ROLLBACK PACKAGE",
            "Package ID: " + current.packageId,
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Generator Version: " + current.generatorVersion,
            "Package Status: " + current.packageStatus,
            "Rollback Documents: " + current.rollbackDocumentCount,
            "Original Documents Captured: " +
                (current.originalDocumentsCaptured ? "YES" : "NO"),
            "Proposed Documents Captured: " +
                (current.proposedDocumentsCaptured ? "YES" : "NO"),
            "Rollback Ready: " +
                (current.rollbackReady ? "YES" : "NO"),
            "Rollback Authorized: NO",
            "Write Authorized: NO",
            "Permanent Writes Executed: NO",
            "Restore Executed: NO"
        ];

        (current.documents || []).forEach(function (document) {
            lines.push(
                document.order +
                " | " +
                document.documentId +
                " | " +
                document.backupStatus +
                " | WRITE LOCKED"
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

    function validateRollbackPackage(rollbackPackage) {
        const current = rollbackPackage || lastRollbackPackage;
        const checks = [];

        checks.push(buildValidationCheck(
            "Rollback package exists",
            isPlainObject(current),
            "A generated rollback package is required."
        ));

        checks.push(buildValidationCheck(
            "Rollback package accepted",
            Boolean(current && current.accepted),
            "The rollback package must be accepted."
        ));

        checks.push(buildValidationCheck(
            "Expected document count",
            Boolean(current) &&
                current.rollbackDocumentCount === EXPECTED_DOCUMENTS.length,
            "The rollback package must contain six document entries."
        ));

        checks.push(buildValidationCheck(
            "No original documents falsely captured",
            Boolean(current) &&
                current.originalDocumentsCaptured === false,
            "Version 1.0.0 must not claim original live files were captured."
        ));

        checks.push(buildValidationCheck(
            "Proposed documents captured",
            Boolean(current) &&
                current.proposedDocumentsCaptured === true,
            "The proposed replacement documents must be included."
        ));

        checks.push(buildValidationCheck(
            "Rollback not prematurely ready",
            Boolean(current) &&
                current.rollbackReady === false,
            "Rollback cannot be ready until original files are captured."
        ));

        checks.push(buildValidationCheck(
            "Rollback remains unauthorized",
            Boolean(current) &&
                current.rollbackAuthorized === false,
            "Rollback authorization must remain locked."
        ));

        checks.push(buildValidationCheck(
            "Write remains unauthorized",
            Boolean(current) &&
                current.writeAuthorized === false,
            "Permanent writing must remain locked."
        ));

        checks.push(buildValidationCheck(
            "No permanent writes executed",
            Boolean(current) &&
                current.permanentWritesExecuted === false,
            "No permanent file may be changed by this generator."
        ));

        const documentEntriesValid = Boolean(current) &&
            Array.isArray(current.documents) &&
            current.documents.length === EXPECTED_DOCUMENTS.length &&
            current.documents.every(function (document, index) {
                const commonValid =
                    document.order === index + 1 &&
                    document.documentId === EXPECTED_DOCUMENTS[index] &&
                    document.originalDocumentCaptured === false &&
                    document.originalDocument === null &&
                    document.proposedDocumentCaptured === true &&
                    isPlainObject(document.proposedDocument) &&
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
                    typeof document.documentChanged === "boolean" &&
                    typeof document.permanentWriteRequired === "boolean" &&
                    typeof document.rollbackRequiredBeforeWrite === "boolean" &&
                    document.writeAuthorized === false &&
                    document.rollbackAuthorized === false &&
                    document.permanentWriteExecuted === false &&
                    document.restoreExecuted === false;

                if (!commonValid) {
                    return false;
                }

                if (document.permanentWriteRequired === true) {
                    return (
                        document.documentChanged === true &&
                        document.rollbackRequiredBeforeWrite === true &&
                        document.originalDocumentCaptureRequired === true &&
                        document.executionStatus === "Not Started"
                    );
                }

                return (
                    document.documentChanged === false &&
                    document.rollbackRequiredBeforeWrite === false &&
                    document.originalDocumentCaptureRequired === false &&
                    document.executionStatus === "No Write Required"
                );
            });

        checks.push(buildValidationCheck(
            "Document recovery entries valid",
            documentEntriesValid,
            "Every recovery entry must preserve its approved write decision, contain a proposed document, and remain execution locked."
        ));

        const writeRequiredCount =
            Array.isArray(current && current.documents)
                ? current.documents.filter(function (document) {
                    return document.permanentWriteRequired === true;
                }).length
                : 0;

        const noWriteRequiredCount =
            Array.isArray(current && current.documents)
                ? current.documents.filter(function (document) {
                    return document.permanentWriteRequired === false;
                }).length
                : 0;

        checks.push(buildValidationCheck(
            "Rollback decision counts valid",
            Boolean(current) &&
                current.writeRequiredDocumentCount === writeRequiredCount &&
                current.noWriteRequiredDocumentCount === noWriteRequiredCount &&
                writeRequiredCount + noWriteRequiredCount ===
                    EXPECTED_DOCUMENTS.length,
            "The rollback package decision counts must match all six document entries."
        ));

        return deepFreeze({
            validatorVersion: ENGINE_VERSION,
            accepted: checks.every(function (check) {
                return check.passed;
            }),
            checks: checks
        });
    }

    function getLastRollbackPackage() {
        return lastRollbackPackage;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSRollbackPackageGenerator = Object.freeze({
        generatorVersion: ENGINE_VERSION,
        generateRollbackPackage: generateRollbackPackage,
        formatRollbackPackageText: formatRollbackPackageText,
        validateRollbackPackage: validateRollbackPackage,
        getLastRollbackPackage: getLastRollbackPackage,
        getExpectedDocuments: getExpectedDocuments
    });

    console.log(
        "Rollback Package Generator v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());