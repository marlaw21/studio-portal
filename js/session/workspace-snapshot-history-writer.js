/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 101 — Workspace Snapshot History Writer v1.1.0
File: js/session/workspace-snapshot-history-writer.js

Purpose:
Generate a review-only WORKSPACE-SNAPSHOT-HISTORY-001 append draft through the
Generic Document Writer Framework.

This version preserves the governed snapshots collection while also enforcing
the permanent-document transaction contract required by the six-document
pipeline:

- proposedDocument.id matches WORKSPACE-SNAPSHOT-HISTORY-001
- proposedDocument.items is a transaction-compatible copy of snapshots
- proposedDocument.revisionHistory is present and updated

The writer rejects duplicate snapshot identities and never writes a live JSON
file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.1.0";
    const DOCUMENT_ID = "WORKSPACE-SNAPSHOT-HISTORY-001";
    const REQUIRED_ACTION = "Append";
    const COLLECTION_NAME = "snapshots";

    const SOURCE_PATH =
        "governance/workspace/snapshots/WORKSPACE-SNAPSHOT-HISTORY-001.json";

    let lastDraft = null;

    if (
        !window.TMSDocumentWriterFramework ||
        !window.TMSSessionContext
    ) {
        console.error(
            "Workspace Snapshot History Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function isPlainObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function normalizeText(value) {
        return typeof value === "string"
            ? value.trim()
            : "";
    }

    function validateCompactRecord(record) {
        const requiredSummary =
            isPlainObject(record?.summary);

        return (
            isPlainObject(record) &&
            normalizeText(record.snapshotId).length > 0 &&
            normalizeText(record.documentId).length > 0 &&
            Number.isInteger(record.snapshotNumber) &&
            record.snapshotNumber > 0 &&
            normalizeText(record.snapshotPath).length > 0 &&
            requiredSummary &&
            Number.isInteger(record.summary.folderCount) &&
            Number.isInteger(record.summary.fileCount) &&
            Number.isInteger(record.summary.totalItemCount) &&
            record.sourceSnapshotEmbedded === false &&
            !Object.prototype.hasOwnProperty.call(
                record,
                "sourceSnapshot"
            ) &&
            !Object.prototype.hasOwnProperty.call(
                record,
                "folders"
            ) &&
            !Object.prototype.hasOwnProperty.call(
                record,
                "files"
            )
        );
    }

    function findDuplicate(
        snapshots,
        snapshotRecord
    ) {
        return snapshots.find(function (record) {
            return (
                record?.snapshotId ===
                    snapshotRecord.snapshotId ||
                record?.documentId ===
                    snapshotRecord.documentId ||
                record?.snapshotNumber ===
                    snapshotRecord.snapshotNumber
            );
        }) || null;
    }

    function updateSummary(documentData) {
        const snapshots =
            Array.isArray(documentData.snapshots)
                ? documentData.snapshots
                : [];

        documentData.summary =
            isPlainObject(documentData.summary)
                ? documentData.summary
                : {};

        documentData.summary.totalSnapshots =
            snapshots.length;

        documentData.summary.latestSnapshot =
            snapshots.length > 0
                ? snapshots[
                    snapshots.length - 1
                ].snapshotId
                : null;

        documentData.summary.previousSnapshot =
            snapshots.length > 1
                ? snapshots[
                    snapshots.length - 2
                ].snapshotId
                : null;
    }

    function ensureTransactionContract(
        context,
        snapshotRecord
    ) {
        const proposedDocument =
            context.proposedDocument;

        proposedDocument.id =
            DOCUMENT_ID;

        proposedDocument.documentId =
            DOCUMENT_ID;

        proposedDocument.items =
            context.helpers.clone(
                proposedDocument.snapshots
            );

        if (
            !Array.isArray(
                proposedDocument.revisionHistory
            )
        ) {
            proposedDocument.revisionHistory = [];
        }

        const sessionNumber =
            window.TMSSessionContext
                .getSnapshot()
                .sessionNumber;

        const revisionEntry = {
            version:
                proposedDocument.version ||
                "Unversioned",

            date:
                "Work Session " +
                sessionNumber,

            summary:
                "Proposed addition of workspace snapshot " +
                snapshotRecord.snapshotId +
                " to the governed snapshot history.",

            status:
                "Proposed — Review Required"
        };

        if (
            context.helpers &&
            typeof context.helpers
                .appendRevisionHistory ===
                "function"
        ) {
            context.helpers
                .appendRevisionHistory(
                    proposedDocument,
                    revisionEntry
                );
        } else {
            proposedDocument
                .revisionHistory
                .push(revisionEntry);
        }
    }

    async function transform(context) {
        const payload =
            context.helpers.clone(
                context.proposal.payload || {}
            );

        const snapshotRecord =
            context.helpers.clone(
                payload.snapshotRecord
            );

        if (
            context.collectionName !==
                COLLECTION_NAME
        ) {
            throw new Error(
                "Workspace Snapshot History Writer requires the snapshots collection."
            );
        }

        if (
            !validateCompactRecord(
                snapshotRecord
            )
        ) {
            throw new Error(
                "The proposed workspace snapshot history record is not a valid compact catalog entry."
            );
        }

        if (
            !Array.isArray(
                context.proposedDocument.snapshots
            )
        ) {
            throw new Error(
                "The governed workspace snapshot history document does not contain a snapshots collection."
            );
        }

        const duplicate =
            findDuplicate(
                context.proposedDocument.snapshots,
                snapshotRecord
            );

        if (duplicate) {
            throw new Error(
                "Snapshot " +
                snapshotRecord.snapshotId +
                " is already present in the governed workspace snapshot history."
            );
        }

        context.proposedDocument.snapshots.push(
            snapshotRecord
        );

        context.proposedDocument.generatedAt =
            new Date().toISOString();

        context.proposedDocument.generatedBy =
            "TMS Workspace Snapshot History Writer";

        context.proposedDocument.status =
            "Proposed — Review Required";

        updateSummary(
            context.proposedDocument
        );

        ensureTransactionContract(
            context,
            snapshotRecord
        );

        context.proposedDocument.validation = {
            validated: true,
            accepted: true,
            validationMode:
                "Draft Only — No Permanent Write"
        };

        return {
            updateMode:
                REQUIRED_ACTION,

            collectionName:
                COLLECTION_NAME,

            transactionCollectionName:
                "items",

            appendedSnapshotRecord:
                snapshotRecord,

            appendedSnapshotCount:
                1,

            snapshotId:
                snapshotRecord.snapshotId,

            snapshotNumber:
                snapshotRecord.snapshotNumber,

            duplicateDetected:
                false,

            sourceSnapshotEmbedded:
                false,

            proposedDocumentId:
                context.proposedDocument.id,

            revisionHistoryCount:
                context.proposedDocument
                    .revisionHistory.length,

            transactionItemCount:
                context.proposedDocument
                    .items.length
        };
    }

    async function generateDraft() {
        lastDraft =
            await window
                .TMSDocumentWriterFramework
                .createDraft({
                    writerVersion:
                        ENGINE_VERSION,

                    documentId:
                        DOCUMENT_ID,

                    requiredAction:
                        REQUIRED_ACTION,

                    collectionName:
                        COLLECTION_NAME,

                    sourcePath:
                        SOURCE_PATH,

                    transform:
                        transform
                });

        return lastDraft;
    }

    async function formatDraftText(draft) {
        const currentDraft =
            draft || await generateDraft();

        const lines = [
            "TMS-OS WORKSPACE SNAPSHOT HISTORY DRAFT",
            "Accepted: " +
                (
                    currentDraft.accepted
                        ? "YES"
                        : "NO"
                ),
            "Document: " +
                DOCUMENT_ID,
            "Framework Version: " +
                (
                    currentDraft.frameworkVersion ||
                    "Unavailable"
                ),
            "Writer Version: " +
                ENGINE_VERSION,
            "Permanent Write Executed: NO"
        ];

        if (!currentDraft.accepted) {
            lines.push(
                "Message: " +
                currentDraft.message
            );

            return lines.join("\n");
        }

        lines.push(
            "Update Mode: " +
                currentDraft.updateMode
        );

        lines.push(
            "Collection: " +
                currentDraft.collectionName
        );

        lines.push(
            "Source Records: " +
                currentDraft.sourceItemCount
        );

        lines.push(
            "Proposed Records: " +
                currentDraft.proposedItemCount
        );

        lines.push(
            "Appended Snapshot Records: " +
                currentDraft.appendedSnapshotCount
        );

        lines.push(
            "Snapshot ID: " +
                currentDraft.snapshotId
        );

        lines.push(
            "Snapshot Number: " +
                currentDraft.snapshotNumber
        );

        lines.push(
            "Proposed Document ID: " +
                currentDraft.proposedDocumentId
        );

        lines.push(
            "Transaction Items: " +
                currentDraft.transactionItemCount
        );

        lines.push(
            "Revision History Entries: " +
                currentDraft.revisionHistoryCount
        );

        lines.push(
            "Source Snapshot Embedded: " +
                (
                    currentDraft.sourceSnapshotEmbedded
                        ? "YES"
                        : "NO"
                )
        );

        lines.push(
            "Review Choices: " +
                currentDraft.reviewChoices.join(
                    " | "
                )
        );

        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSWorkspaceSnapshotHistoryWriter =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            documentId:
                DOCUMENT_ID,

            generateDraft:
                generateDraft,

            formatDraftText:
                formatDraftText,

            getLastDraft:
                getLastDraft
        });

    if (!window.TMSDocumentWriterRegistry) {
        console.error(
            "Workspace Snapshot History Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId:
            "workspace-snapshot-history-writer",

        documentId:
            DOCUMENT_ID,

        writerVersion:
            ENGINE_VERSION,

        updateMode:
            REQUIRED_ACTION,

        order:
            60,

        generateDraft:
            generateDraft,

        formatDraftText:
            formatDraftText,

        getLastDraft:
            getLastDraft
    });

    console.log(
        "Workspace Snapshot History Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
