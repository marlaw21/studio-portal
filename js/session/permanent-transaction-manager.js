/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 048 — Permanent Transaction Manager v1.0.0
File: js/session/permanent-transaction-manager.js

Purpose:
Validate the approved five-document draft package as one review-only transaction,
produce a deterministic transaction manifest and rollback metadata, and prevent any
permanent write from occurring until a later controlled execution layer is approved.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001"
    ]);
    let lastTransaction = null;

    if (!window.TMSSessionContext || !window.TMSDocumentWriterRegistry) {
        console.error("Permanent Transaction Manager could not initialize because its dependencies are unavailable.");
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

    function normalizePath(documentId) {
        return "pages/documents/" + documentId + ".json";
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }

    function validateDraftItem(item, seenDocumentIds) {
        const checks = [];
        const draft = item && item.draft;
        const proposedDocument = draft && draft.proposedDocument;
        const documentId = item && item.documentId;

        function check(name, passed, message) {
            checks.push({ name: name, passed: Boolean(passed), message: message });
        }

        check("Draft item exists", isPlainObject(item), "A registry draft item is required.");
        check("Document ID is expected", EXPECTED_DOCUMENTS.includes(documentId), "Target must be one of the five controlled permanent documents.");
        check("Target is unique", !seenDocumentIds.has(documentId), "A permanent transaction cannot contain duplicate target documents.");
        if (documentId) {
            seenDocumentIds.add(documentId);
        }
        check("Writer accepted draft", Boolean(item && item.accepted), "The registered writer must accept the draft.");
        check("Draft accepted", Boolean(draft && draft.accepted), "The underlying permanent-document draft must be accepted.");
        check("No permanent write executed", Boolean(draft) && draft.permanentWriteExecuted === false, "Draft generation must remain review-only.");
        check("Proposed document exists", isPlainObject(proposedDocument), "A complete proposed replacement document is required.");
        check("Proposed document ID matches target", Boolean(proposedDocument) && proposedDocument.id === documentId, "The proposed document ID must match the registry target.");
        check("Sections are valid", Boolean(proposedDocument) && Array.isArray(proposedDocument.sections), "The proposed document must contain a sections array.");
        check("Revision history is valid", Boolean(proposedDocument) && Array.isArray(proposedDocument.revisionHistory), "The proposed document must contain revision history.");

        let serializable = false;
        try {
            JSON.stringify(proposedDocument);
            serializable = Boolean(proposedDocument);
        } catch (error) {
            serializable = false;
        }
        check("JSON serializable", serializable, "The proposed document must serialize to valid JSON.");

        return {
            documentId: documentId || "Unknown",
            updateMode: item && item.updateMode ? item.updateMode : "Unknown",
            accepted: checks.every(function (entry) { return entry.passed; }),
            checks: checks,
            proposedDocument: proposedDocument ? clone(proposedDocument) : null,
            sourceSectionCount: draft && Number.isFinite(Number(draft.sourceSectionCount)) ? Number(draft.sourceSectionCount) : null,
            proposedSectionCount: draft && Number.isFinite(Number(draft.proposedSectionCount)) ? Number(draft.proposedSectionCount) : null
        };
    }

    function buildManifest(validations, sessionNumber) {
        return validations.map(function (validation, index) {
            const proposed = validation.proposedDocument || {};
            return {
                order: (index + 1) * 10,
                documentId: validation.documentId,
                updateMode: validation.updateMode,
                targetPath: normalizePath(validation.documentId),
                sourceVersion: proposed.version || "Unknown",
                proposedVersion: proposed.version || "Unknown",
                proposedLastUpdated: proposed.lastUpdated || ("Work Session " + sessionNumber),
                sourceSectionCount: validation.sourceSectionCount,
                proposedSectionCount: validation.proposedSectionCount,
                transactionAction: "Generate Complete Replacement File",
                writeAuthorized: false
            };
        });
    }

    function buildRollbackMetadata(validations) {
        return validations.map(function (validation) {
            const proposed = validation.proposedDocument || {};
            return {
                documentId: validation.documentId,
                targetPath: normalizePath(validation.documentId),
                rollbackRequiredBeforeWrite: true,
                rollbackSource: "Current live permanent JSON file",
                originalDocumentMustBeCopied: true,
                proposedDocumentId: proposed.id || null,
                writeAuthorized: false,
                recoveryStatus: "Not Needed — Review Only"
            };
        });
    }

    function rejectedTransaction(message, draftPackage, validations) {
        const snapshot = window.TMSSessionContext.getSnapshot();
        return deepFreeze({
            transactionType: "TMS-OS Permanent Documentation Transaction",
            managerVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            sessionNumber: snapshot.sessionNumber,
            accepted: false,
            message: message,
            draftPackageAccepted: Boolean(draftPackage && draftPackage.accepted),
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            validatedDocumentCount: validations ? validations.length : 0,
            validations: validations || [],
            manifest: [],
            rollbackMetadata: [],
            permanentWritesExecuted: false,
            writeAuthorized: false,
            transactionStatus: "Rejected",
            reviewRequired: true
        });
    }

    async function createTransaction() {
        const draftPackage = await window.TMSDocumentWriterRegistry.generateDraftPackage();
        const snapshot = window.TMSSessionContext.getSnapshot();

        if (!draftPackage || !draftPackage.accepted) {
            lastTransaction = rejectedTransaction(
                "An accepted five-document draft package is required before a permanent transaction can be created.",
                draftPackage,
                []
            );
            return lastTransaction;
        }

        const seenDocumentIds = new Set();
        const validations = (draftPackage.drafts || []).map(function (item) {
            return validateDraftItem(item, seenDocumentIds);
        });
        const validatedIds = validations.map(function (item) { return item.documentId; });
        const expectedSetMatches = EXPECTED_DOCUMENTS.every(function (documentId) {
            return validatedIds.includes(documentId);
        }) && validatedIds.length === EXPECTED_DOCUMENTS.length;
        const allValid = expectedSetMatches && validations.every(function (item) { return item.accepted; });

        if (!allValid) {
            lastTransaction = rejectedTransaction(
                "The draft package failed permanent transaction validation.",
                draftPackage,
                validations
            );
            return lastTransaction;
        }

        const manifest = buildManifest(validations, snapshot.sessionNumber);
        const rollbackMetadata = buildRollbackMetadata(validations);

        lastTransaction = deepFreeze({
            transactionType: "TMS-OS Permanent Documentation Transaction",
            managerVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            sessionNumber: snapshot.sessionNumber,
            accepted: true,
            message: "Five-document permanent transaction validated for review. No permanent files were changed.",
            draftPackageAccepted: true,
            expectedDocumentCount: EXPECTED_DOCUMENTS.length,
            validatedDocumentCount: validations.length,
            validations: validations,
            manifest: manifest,
            rollbackMetadata: rollbackMetadata,
            replacementDocuments: validations.map(function (validation) {
                return {
                    documentId: validation.documentId,
                    targetPath: normalizePath(validation.documentId),
                    proposedDocument: clone(validation.proposedDocument)
                };
            }),
            permanentWritesExecuted: false,
            writeAuthorized: false,
            transactionStatus: "Validated — Review Only",
            reviewRequired: true,
            reviewChoices: ["Approve Transaction Plan", "Revise Session", "Cancel Transaction Plan"]
        });

        return lastTransaction;
    }

    async function formatTransactionText(transaction) {
        const current = transaction || await createTransaction();
        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION TRANSACTION",
            "Accepted: " + (current.accepted ? "YES" : "NO"),
            "Work Session: " + current.sessionNumber,
            "Manager Version: " + ENGINE_VERSION,
            "Transaction Status: " + current.transactionStatus,
            "Permanent Writes Executed: NO",
            "Write Authorized: NO",
            "Expected Documents: " + current.expectedDocumentCount,
            "Validated Documents: " + current.validatedDocumentCount
        ];

        (current.manifest || []).forEach(function (item) {
            lines.push(item.order + " | " + item.documentId + " | " + item.updateMode + " | VALIDATED");
        });

        if (current.reviewChoices) {
            lines.push("Review Choices: " + current.reviewChoices.join(" | "));
        }
        return lines.join("\n");
    }

    function getLastTransaction() {
        return lastTransaction;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentTransactionManager = Object.freeze({
        managerVersion: ENGINE_VERSION,
        createTransaction: createTransaction,
        formatTransactionText: formatTransactionText,
        getLastTransaction: getLastTransaction,
        getExpectedDocuments: getExpectedDocuments
    });

    console.log(
        "Permanent Transaction Manager v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
