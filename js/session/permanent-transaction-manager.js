/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Permanent Transaction Manager v1.3.0
File: js/session/permanent-transaction-manager.js

Purpose:
Validate the approved six-document draft package as one review-only transaction,
including both section-based and collection-based governed documents. Produce a
deterministic transaction manifest and rollback metadata, preserve document-change
decision metadata, and prevent any permanent write from occurring until a later
controlled execution layer is approved.

Version 1.3.0 aligns transaction validation with Generic Document Writer Framework
v1.2.0 by accepting id or documentId identity, sections/items/snapshots primary
collections, and approved No Change documents that retain their governed source
schema without transform-added revision history.

Version 1.3.0 also preserves the governed source location for
WORKSPACE-SNAPSHOT-HISTORY-001 instead of routing it through pages/documents.

This component does not write, replace, delete, restore, download, authorize,
or otherwise modify any permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.3.0";

    const EXPECTED_DOCUMENTS = Object.freeze([
        "WS-HIST-001",
        "STATE-001",
        "DOC-STATE-001",
        "DEC-LOG-001",
        "MILE-HIST-001",
        "WORKSPACE-SNAPSHOT-HISTORY-001"
    ]);

    let lastTransaction = null;

    if (
        !window.TMSSessionContext ||
        !window.TMSDocumentWriterRegistry
    ) {
        console.error(
            "Permanent Transaction Manager could not initialize because its dependencies are unavailable."
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

    function normalizePath(documentId) {
        if (
            documentId ===
            "WORKSPACE-SNAPSHOT-HISTORY-001"
        ) {
            return (
                "governance/workspace/snapshots/" +
                "WORKSPACE-SNAPSHOT-HISTORY-001.json"
            );
        }

        return (
            "pages/documents/" +
            documentId +
            ".json"
        );
    }

    function isPlainObject(value) {
        return Boolean(value) &&
            typeof value === "object" &&
            !Array.isArray(value);
    }

    function asFiniteNumber(value, fallback) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function getCollectionMetadata(draft, proposedDocument) {
        const proposedCollectionName =
            draft && typeof draft.proposedCollectionName === "string"
                ? draft.proposedCollectionName
                : (
                    proposedDocument &&
                    typeof proposedDocument.collectionName === "string"
                        ? proposedDocument.collectionName
                        : null
                );

        const sourceCollectionName =
            draft && typeof draft.sourceCollectionName === "string"
                ? draft.sourceCollectionName
                : null;

        const proposedItemCount =
            Number.isInteger(draft && draft.proposedItemCount)
                ? draft.proposedItemCount
                : (
                    proposedDocument &&
                    Array.isArray(proposedDocument.items)
                        ? proposedDocument.items.length
                        : null
                );

        const sourceItemCount =
            Number.isInteger(draft && draft.sourceItemCount)
                ? draft.sourceItemCount
                : null;

        return {
            sourceCollectionName: sourceCollectionName,
            proposedCollectionName: proposedCollectionName,
            sourceItemCount: sourceItemCount,
            proposedItemCount: proposedItemCount
        };
    }

    function deriveChangeDecision(draft) {
        const sourceChecksum =
            draft && typeof draft.sourceChecksum === "string"
                ? draft.sourceChecksum
                : null;

        const proposedChecksum =
            draft && typeof draft.proposedChecksum === "string"
                ? draft.proposedChecksum
                : null;

        const explicitDocumentChanged =
            draft &&
            typeof draft.documentChanged === "boolean"
                ? draft.documentChanged
                : null;

        let documentChanged = explicitDocumentChanged;

        if (
            documentChanged === null &&
            sourceChecksum &&
            proposedChecksum
        ) {
            documentChanged =
                sourceChecksum !== proposedChecksum;
        }

        if (documentChanged === null) {
            documentChanged = true;
        }

        const permanentWriteRequired =
            draft &&
            typeof draft.permanentWriteRequired === "boolean"
                ? draft.permanentWriteRequired
                : documentChanged;

        const rollbackRequiredBeforeWrite =
            draft &&
            typeof draft.rollbackRequiredBeforeWrite === "boolean"
                ? draft.rollbackRequiredBeforeWrite
                : permanentWriteRequired;

        return {
            documentChanged: documentChanged,
            permanentWriteRequired:
                permanentWriteRequired,
            rollbackRequiredBeforeWrite:
                rollbackRequiredBeforeWrite
        };
    }

    function validateDraftItem(
        item,
        seenDocumentIds
    ) {
        const checks = [];

        const draft =
            item && item.draft;

        const proposedDocument =
            draft && draft.proposedDocument;

        const documentId =
            item && item.documentId;

        function check(
            name,
            passed,
            message
        ) {
            checks.push({
                name: name,
                passed: Boolean(passed),
                message: message
            });
        }

        check(
            "Draft item exists",
            isPlainObject(item),
            "A registry draft item is required."
        );

        check(
            "Document ID is expected",
            EXPECTED_DOCUMENTS.includes(
                documentId
            ),
            "Target must be one of the six controlled permanent documents."
        );

        check(
            "Target is unique",
            !seenDocumentIds.has(documentId),
            "A permanent transaction cannot contain duplicate target documents."
        );

        if (documentId) {
            seenDocumentIds.add(documentId);
        }

        check(
            "Writer accepted draft",
            Boolean(item && item.accepted),
            "The registered writer must accept the draft."
        );

        check(
            "Draft accepted",
            Boolean(draft && draft.accepted),
            "The underlying permanent-document draft must be accepted."
        );

        check(
            "No permanent write executed",
            Boolean(draft) &&
                draft.permanentWriteExecuted ===
                    false,
            "Draft generation must remain review-only."
        );

        check(
            "Proposed document exists",
            isPlainObject(proposedDocument),
            "A complete proposed replacement document is required."
        );

        const proposedDocumentIdentity =
            proposedDocument &&
            typeof proposedDocument.id === "string" &&
            proposedDocument.id.trim().length > 0
                ? proposedDocument.id.trim()
                : (
                    proposedDocument &&
                    typeof proposedDocument.documentId === "string" &&
                    proposedDocument.documentId.trim().length > 0
                        ? proposedDocument.documentId.trim()
                        : ""
                );

        check(
            "Proposed document ID matches target",
            proposedDocumentIdentity ===
                documentId,
            "The proposed document id or documentId must match the registry target."
        );

        const supportedCollectionName =
            proposedDocument &&
            Array.isArray(proposedDocument.sections)
                ? "sections"
                : (
                    proposedDocument &&
                    Array.isArray(proposedDocument.items)
                        ? "items"
                        : (
                            proposedDocument &&
                            Array.isArray(proposedDocument.snapshots)
                                ? "snapshots"
                                : null
                        )
                );

        check(
            "Document content collection is valid",
            Boolean(supportedCollectionName),
            "The proposed document must contain a supported sections, items, or snapshots collection."
        );

        const noChangeDraft =
            draft &&
            (
                draft.proposalAction === "No Change" ||
                draft.updateMode === "No Change" ||
                draft.documentChanged === false
            );

        check(
            "Revision history is valid",
            Boolean(proposedDocument) &&
                (
                    Array.isArray(
                        proposedDocument.revisionHistory
                    ) ||
                    noChangeDraft
                ),
            "Changed documents must contain revision history; approved No Change documents may retain their governed source schema."
        );

        let serializable = false;

        try {
            JSON.stringify(proposedDocument);
            serializable =
                Boolean(proposedDocument);
        } catch (error) {
            serializable = false;
        }

        check(
            "JSON serializable",
            serializable,
            "The proposed document must serialize to valid JSON."
        );

        const changeDecision =
            deriveChangeDecision(draft);

        check(
            "Document change decision is valid",
            typeof changeDecision.documentChanged ===
                "boolean" &&
            typeof changeDecision.permanentWriteRequired ===
                "boolean" &&
            typeof changeDecision.rollbackRequiredBeforeWrite ===
                "boolean" &&
            (
                changeDecision.permanentWriteRequired
                    ? (
                        changeDecision.documentChanged === true &&
                        changeDecision.rollbackRequiredBeforeWrite === true
                    )
                    : (
                        changeDecision.documentChanged === false &&
                        changeDecision.rollbackRequiredBeforeWrite === false
                    )
            ),
            "The draft must preserve a valid document-change and rollback decision."
        );

        const collectionMetadata =
            getCollectionMetadata(
                draft,
                proposedDocument
            );

        return {
            documentId:
                documentId || "Unknown",

            updateMode:
                item && item.updateMode
                    ? item.updateMode
                    : "Unknown",

            accepted:
                checks.every(function (entry) {
                    return entry.passed;
                }),

            checks:
                checks,

            proposedDocument:
                proposedDocument
                    ? clone(proposedDocument)
                    : null,

            sourceSectionCount:
                draft &&
                Number.isFinite(
                    Number(
                        draft.sourceSectionCount
                    )
                )
                    ? Number(
                        draft.sourceSectionCount
                    )
                    : null,

            proposedSectionCount:
                draft &&
                Number.isFinite(
                    Number(
                        draft.proposedSectionCount
                    )
                )
                    ? Number(
                        draft.proposedSectionCount
                    )
                    : (
                        proposedDocument &&
                        Array.isArray(
                            proposedDocument.sections
                        )
                            ? proposedDocument.sections.length
                            : null
                    ),

            sourceCollectionName:
                collectionMetadata
                    .sourceCollectionName,

            proposedCollectionName:
                collectionMetadata
                    .proposedCollectionName ||
                supportedCollectionName,

            sourceItemCount:
                collectionMetadata
                    .sourceItemCount,

            proposedItemCount:
                collectionMetadata
                    .proposedItemCount,

            sourceChecksum:
                draft &&
                typeof draft.sourceChecksum ===
                    "string"
                    ? draft.sourceChecksum
                    : null,

            proposedChecksum:
                draft &&
                typeof draft.proposedChecksum ===
                    "string"
                    ? draft.proposedChecksum
                    : null,

            documentChanged:
                changeDecision.documentChanged,

            permanentWriteRequired:
                changeDecision
                    .permanentWriteRequired,

            rollbackRequiredBeforeWrite:
                changeDecision
                    .rollbackRequiredBeforeWrite
        };
    }

    function buildManifest(
        validations,
        sessionNumber
    ) {
        return validations.map(function (
            validation,
            index
        ) {
            const proposed =
                validation.proposedDocument || {};

            return {
                order: index + 1,

                documentId:
                    validation.documentId,

                updateMode:
                    validation.updateMode,

                targetPath:
                    normalizePath(
                        validation.documentId
                    ),

                sourceVersion:
                    proposed.version || "Unknown",

                proposedVersion:
                    proposed.version || "Unknown",

                proposedLastUpdated:
                    proposed.lastUpdated ||
                    (
                        "Work Session " +
                        sessionNumber
                    ),

                sourceSectionCount:
                    validation.sourceSectionCount,

                proposedSectionCount:
                    validation.proposedSectionCount,

                sourceCollectionName:
                    validation.sourceCollectionName,

                proposedCollectionName:
                    validation.proposedCollectionName,

                sourceItemCount:
                    validation.sourceItemCount,

                proposedItemCount:
                    validation.proposedItemCount,

                sourceChecksum:
                    validation.sourceChecksum,

                proposedChecksum:
                    validation.proposedChecksum,

                documentChanged:
                    validation.documentChanged,

                permanentWriteRequired:
                    validation
                        .permanentWriteRequired,

                rollbackRequiredBeforeWrite:
                    validation
                        .rollbackRequiredBeforeWrite,

                transactionAction:
                    validation.permanentWriteRequired
                        ? "Generate Complete Replacement File"
                        : "No Write Required",

                writeAuthorized:
                    false
            };
        });
    }

    function buildRollbackMetadata(
        validations
    ) {
        return validations.map(function (
            validation
        ) {
            const proposed =
                validation.proposedDocument || {};

            return {
                documentId:
                    validation.documentId,

                targetPath:
                    normalizePath(
                        validation.documentId
                    ),

                documentChanged:
                    validation.documentChanged,

                permanentWriteRequired:
                    validation
                        .permanentWriteRequired,

                rollbackRequiredBeforeWrite:
                    validation
                        .rollbackRequiredBeforeWrite,

                rollbackSource:
                    validation.permanentWriteRequired
                        ? "Current live permanent JSON file"
                        : "No rollback source required — no write required",

                originalDocumentMustBeCopied:
                    validation
                        .rollbackRequiredBeforeWrite,

                proposedDocumentId:
                    proposed.id || null,

                writeAuthorized:
                    false,

                recoveryStatus:
                    validation.permanentWriteRequired
                        ? "Not Needed — Review Only"
                        : "Not Required — No Write Required"
            };
        });
    }

    function rejectedTransaction(
        message,
        draftPackage,
        validations
    ) {
        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        return deepFreeze({
            transactionType:
                "TMS-OS Permanent Documentation Transaction",

            managerVersion:
                ENGINE_VERSION,

            generatedAt:
                new Date().toISOString(),

            sessionNumber:
                snapshot.sessionNumber,

            accepted:
                false,

            message:
                message,

            draftPackageAccepted:
                Boolean(
                    draftPackage &&
                    draftPackage.accepted
                ),

            expectedDocumentCount:
                EXPECTED_DOCUMENTS.length,

            validatedDocumentCount:
                validations
                    ? validations.length
                    : 0,

            writeRequiredDocumentCount:
                0,

            noWriteRequiredDocumentCount:
                0,

            validations:
                validations || [],

            manifest:
                [],

            rollbackMetadata:
                [],

            replacementDocuments:
                [],

            permanentWritesExecuted:
                false,

            writeAuthorized:
                false,

            transactionStatus:
                "Rejected",

            reviewRequired:
                true
        });
    }

    async function createTransaction() {
        const draftPackage =
            await window
                .TMSDocumentWriterRegistry
                .generateDraftPackage();

        const snapshot =
            window.TMSSessionContext
                .getSnapshot();

        if (
            !draftPackage ||
            !draftPackage.accepted
        ) {
            lastTransaction =
                rejectedTransaction(
                    "An accepted six-document draft package is required before a permanent transaction can be created.",
                    draftPackage,
                    []
                );

            return lastTransaction;
        }

        const seenDocumentIds =
            new Set();

        const validations =
            (
                draftPackage.drafts || []
            ).map(function (item) {
                return validateDraftItem(
                    item,
                    seenDocumentIds
                );
            });

        const validatedIds =
            validations.map(function (
                item
            ) {
                return item.documentId;
            });

        const expectedSetMatches =
            EXPECTED_DOCUMENTS.every(function (
                documentId
            ) {
                return validatedIds.includes(
                    documentId
                );
            }) &&
            validatedIds.length ===
                EXPECTED_DOCUMENTS.length &&
            new Set(validatedIds).size ===
                EXPECTED_DOCUMENTS.length;

        const allValid =
            expectedSetMatches &&
            validations.every(function (
                item
            ) {
                return item.accepted;
            });

        if (!allValid) {
            lastTransaction =
                rejectedTransaction(
                    "The six-document draft package failed permanent transaction validation.",
                    draftPackage,
                    validations
                );

            return lastTransaction;
        }

        const manifest =
            buildManifest(
                validations,
                snapshot.sessionNumber
            );

        const rollbackMetadata =
            buildRollbackMetadata(
                validations
            );

        const writeRequiredDocumentCount =
            validations.filter(function (
                validation
            ) {
                return (
                    validation
                        .permanentWriteRequired ===
                    true
                );
            }).length;

        const noWriteRequiredDocumentCount =
            validations.length -
            writeRequiredDocumentCount;

        lastTransaction =
            deepFreeze({
                transactionType:
                    "TMS-OS Permanent Documentation Transaction",

                managerVersion:
                    ENGINE_VERSION,

                generatedAt:
                    new Date().toISOString(),

                sessionNumber:
                    snapshot.sessionNumber,

                accepted:
                    true,

                message:
                    "Six-document permanent transaction validated for review. " +
                    writeRequiredDocumentCount +
                    " document(s) require a future controlled write and " +
                    noWriteRequiredDocumentCount +
                    " document(s) require no permanent write. " +
                    "No permanent files were changed.",

                draftPackageAccepted:
                    true,

                expectedDocumentCount:
                    EXPECTED_DOCUMENTS.length,

                validatedDocumentCount:
                    validations.length,

                writeRequiredDocumentCount:
                    writeRequiredDocumentCount,

                noWriteRequiredDocumentCount:
                    noWriteRequiredDocumentCount,

                validations:
                    validations,

                manifest:
                    manifest,

                rollbackMetadata:
                    rollbackMetadata,

                replacementDocuments:
                    validations.map(function (
                        validation
                    ) {
                        return {
                            documentId:
                                validation.documentId,

                            targetPath:
                                normalizePath(
                                    validation.documentId
                                ),

                            documentChanged:
                                validation.documentChanged,

                            permanentWriteRequired:
                                validation
                                    .permanentWriteRequired,

                            proposedDocument:
                                clone(
                                    validation
                                        .proposedDocument
                                )
                        };
                    }),

                permanentWritesExecuted:
                    false,

                writeAuthorized:
                    false,

                transactionStatus:
                    "Validated — Review Only",

                reviewRequired:
                    true,

                reviewChoices: [
                    "Approve Transaction Plan",
                    "Revise Session",
                    "Cancel Transaction Plan"
                ]
            });

        return lastTransaction;
    }

    async function formatTransactionText(
        transaction
    ) {
        const current =
            transaction ||
            await createTransaction();

        const lines = [
            "TMS-OS PERMANENT DOCUMENTATION TRANSACTION",
            "Accepted: " +
                (
                    current.accepted
                        ? "YES"
                        : "NO"
                ),
            "Work Session: " +
                current.sessionNumber,
            "Manager Version: " +
                ENGINE_VERSION,
            "Transaction Status: " +
                current.transactionStatus,
            "Permanent Writes Executed: NO",
            "Write Authorized: NO",
            "Expected Documents: " +
                current.expectedDocumentCount,
            "Validated Documents: " +
                current.validatedDocumentCount,
            "Write Required Documents: " +
                current.writeRequiredDocumentCount,
            "No Write Required Documents: " +
                current.noWriteRequiredDocumentCount
        ];

        (
            current.manifest || []
        ).forEach(function (item) {
            lines.push(
                item.order +
                " | " +
                item.documentId +
                " | " +
                item.updateMode +
                " | " +
                (
                    item.permanentWriteRequired
                        ? "WRITE REQUIRED — LOCKED"
                        : "NO WRITE REQUIRED"
                )
            );
        });

        if (current.reviewChoices) {
            lines.push(
                "Review Choices: " +
                current.reviewChoices.join(
                    " | "
                )
            );
        }

        return lines.join("\n");
    }

    function getLastTransaction() {
        return lastTransaction;
    }

    function getExpectedDocuments() {
        return EXPECTED_DOCUMENTS.slice();
    }

    window.TMSPermanentTransactionManager =
        Object.freeze({
            managerVersion:
                ENGINE_VERSION,

            createTransaction:
                createTransaction,

            formatTransactionText:
                formatTransactionText,

            getLastTransaction:
                getLastTransaction,

            getExpectedDocuments:
                getExpectedDocuments
        });

    console.log(
        "Permanent Transaction Manager v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
