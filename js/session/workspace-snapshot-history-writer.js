/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 115 — Workspace Snapshot History Writer v2.0.0
File: js/session/workspace-snapshot-history-writer.js

Purpose:
Generate a review-only WORKSPACE-SNAPSHOT-HISTORY-001 append draft through the
Generic Document Writer Framework. Version 2.0.0 consumes the enriched proposal,
uses proposal-carried source-session identity, preserves compact validation,
duplicate detection, transaction compatibility, revision history, append
behavior, and complete Disabled Mode safeguards.

It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const DOCUMENT_ID = "WORKSPACE-SNAPSHOT-HISTORY-001";
    const REQUIRED_ACTION = "Append";
    const COLLECTION_NAME = "snapshots";
    const SOURCE_PATH =
        "governance/workspace/snapshots/WORKSPACE-SNAPSHOT-HISTORY-001.json";

    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error(
            "Workspace Snapshot History Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function isPlainObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function normalizeText(value) {
        return typeof value === "string" ? value.trim() : "";
    }

    function normalizeSourceSession(source) {
        return {
            sessionNumber: String(source.sessionNumber || "Unavailable"),
            version: source.version || "Unavailable",
            milestone: source.milestone || "Unavailable",
            module: source.module || "Unavailable",
            status: source.status || "Unavailable"
        };
    }

    function normalizeGovernanceEnvelope(envelope) {
        return {
            governanceMode: envelope.governanceMode || "Disabled",
            documentationMode: envelope.documentationMode || "Review Only",
            executionMode: envelope.executionMode || "Disabled",
            validationStatus:
                envelope.validationStatus || "Validation Status Unavailable",
            failedTestCount: Number(envelope.failedTestCount) || 0,
            approvalStatus: envelope.approvalStatus || "Closure Approved",
            humanApprovalRecorded: envelope.humanApprovalRecorded === true,
            permanentWriteStatus: envelope.permanentWriteStatus || "Not Executed",
            rollbackStatus: envelope.rollbackStatus || "Not Executed",
            restoreStatus: envelope.restoreStatus || "Not Executed",
            executionLockStatus: envelope.executionLockStatus || "Locked",
            sourceSnapshotEmbedded: envelope.sourceSnapshotEmbedded === true,
            duplicateDetected: envelope.duplicateDetected === true,
            downstreamGovernanceDependency:
                envelope.downstreamGovernanceDependency === true
        };
    }

    function normalizeTransactionMetadata(metadata) {
        return {
            governedDocumentId: metadata.governedDocumentId || DOCUMENT_ID,
            collectionName: metadata.collectionName || COLLECTION_NAME,
            transactionCollectionName:
                metadata.transactionCollectionName || "items",
            updateMode: metadata.updateMode || REQUIRED_ACTION,
            proposalSource:
                metadata.proposalSource || "Workspace Snapshot History Manager"
        };
    }

    function validateCompactRecord(record) {
        const requiredSummary = isPlainObject(record?.summary);

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
            !Object.prototype.hasOwnProperty.call(record, "sourceSnapshot") &&
            !Object.prototype.hasOwnProperty.call(record, "folders") &&
            !Object.prototype.hasOwnProperty.call(record, "files")
        );
    }

    function findDuplicate(snapshots, snapshotRecord) {
        return snapshots.find(function (record) {
            return (
                record?.snapshotId === snapshotRecord.snapshotId ||
                record?.documentId === snapshotRecord.documentId ||
                record?.snapshotNumber === snapshotRecord.snapshotNumber
            );
        }) || null;
    }

    function updateSummary(documentData) {
        const snapshots = Array.isArray(documentData.snapshots)
            ? documentData.snapshots
            : [];

        documentData.summary = isPlainObject(documentData.summary)
            ? documentData.summary
            : {};

        documentData.summary.totalSnapshots = snapshots.length;
        documentData.summary.latestSnapshot = snapshots.length > 0
            ? snapshots[snapshots.length - 1].snapshotId
            : null;
        documentData.summary.previousSnapshot = snapshots.length > 1
            ? snapshots[snapshots.length - 2].snapshotId
            : null;
    }

    function ensureTransactionContract(
        context,
        snapshotRecord,
        sourceSession,
        transactionMetadata
    ) {
        const proposedDocument = context.proposedDocument;

        proposedDocument.id = transactionMetadata.governedDocumentId;
        proposedDocument.documentId = transactionMetadata.governedDocumentId;
        proposedDocument.items = context.helpers.clone(proposedDocument.snapshots);

        if (!Array.isArray(proposedDocument.revisionHistory)) {
            proposedDocument.revisionHistory = [];
        }

        const revisionEntry = {
            version: proposedDocument.version || "Unversioned",
            date: "Work Session " + sourceSession.sessionNumber,
            summary:
                "Proposed addition of workspace snapshot " +
                snapshotRecord.snapshotId +
                " to the governed snapshot history from Work Session " +
                sourceSession.sessionNumber +
                ".",
            status: "Proposed — Review Required"
        };

        if (
            context.helpers &&
            typeof context.helpers.appendRevisionHistory === "function"
        ) {
            context.helpers.appendRevisionHistory(proposedDocument, revisionEntry);
        } else {
            proposedDocument.revisionHistory.push(revisionEntry);
        }
    }

    async function transform(context) {
        const payload = context.helpers.clone(context.proposal.payload || {});
        const snapshotRecord = context.helpers.clone(payload.snapshotRecord);
        const sourceSession = normalizeSourceSession(payload.sourceSession || {});
        const governanceEnvelope = normalizeGovernanceEnvelope(
            payload.governanceEnvelope || {}
        );
        const transactionMetadata = normalizeTransactionMetadata(
            payload.transactionMetadata || {}
        );

        if (context.collectionName !== COLLECTION_NAME) {
            throw new Error(
                "Workspace Snapshot History Writer requires the snapshots collection."
            );
        }

        if (transactionMetadata.collectionName !== COLLECTION_NAME) {
            throw new Error(
                "The proposal transaction metadata does not target the snapshots collection."
            );
        }

        if (transactionMetadata.governedDocumentId !== DOCUMENT_ID) {
            throw new Error(
                "The proposal transaction metadata does not target WORKSPACE-SNAPSHOT-HISTORY-001."
            );
        }

        if (governanceEnvelope.sourceSnapshotEmbedded) {
            throw new Error(
                "The proposal governance envelope indicates that the source snapshot is embedded."
            );
        }

        if (governanceEnvelope.duplicateDetected) {
            throw new Error(
                "The proposal governance envelope indicates a duplicate snapshot."
            );
        }

        if (!validateCompactRecord(snapshotRecord)) {
            throw new Error(
                "The proposed workspace snapshot history record is not a valid compact catalog entry."
            );
        }

        if (!Array.isArray(context.proposedDocument.snapshots)) {
            throw new Error(
                "The governed workspace snapshot history document does not contain a snapshots collection."
            );
        }

        const duplicate = findDuplicate(
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

        context.proposedDocument.snapshots.push(snapshotRecord);
        context.proposedDocument.generatedAt = new Date().toISOString();
        context.proposedDocument.generatedBy =
            "TMS Workspace Snapshot History Writer";
        context.proposedDocument.status = "Proposed — Review Required";

        updateSummary(context.proposedDocument);
        ensureTransactionContract(
            context,
            snapshotRecord,
            sourceSession,
            transactionMetadata
        );

        context.proposedDocument.validation = {
            validated: true,
            accepted: true,
            validationMode: "Draft Only — No Permanent Write",
            governanceMode: governanceEnvelope.governanceMode,
            documentationMode: governanceEnvelope.documentationMode,
            executionMode: governanceEnvelope.executionMode
        };

        return {
            updateMode: REQUIRED_ACTION,
            collectionName: COLLECTION_NAME,
            transactionCollectionName:
                transactionMetadata.transactionCollectionName,
            appendedSnapshotRecord: snapshotRecord,
            appendedSnapshotCount: 1,
            snapshotId: snapshotRecord.snapshotId,
            snapshotNumber: snapshotRecord.snapshotNumber,
            duplicateDetected: false,
            sourceSnapshotEmbedded: false,
            proposedDocumentId: context.proposedDocument.id,
            revisionHistoryCount:
                context.proposedDocument.revisionHistory.length,
            transactionItemCount: context.proposedDocument.items.length,
            governanceEnvelopeRetained: true,
            sourceSessionIdentityRetained: true,
            transactionMetadataRetained: true,
            downstreamGovernanceDependency: false,
            workspaceSnapshotHistorySnapshot: {
                sourceSessionNumber: sourceSession.sessionNumber,
                sourceVersion: sourceSession.version,
                sourceMilestone: sourceSession.milestone,
                sourceModule: sourceSession.module,
                sourceStatus: sourceSession.status,
                governanceMode: governanceEnvelope.governanceMode,
                documentationMode: governanceEnvelope.documentationMode,
                executionMode: governanceEnvelope.executionMode,
                validationStatus: governanceEnvelope.validationStatus,
                failedTestCount: governanceEnvelope.failedTestCount,
                executionLockStatus: governanceEnvelope.executionLockStatus,
                permanentWriteStatus: governanceEnvelope.permanentWriteStatus,
                rollbackStatus: governanceEnvelope.rollbackStatus,
                restoreStatus: governanceEnvelope.restoreStatus,
                sourceSnapshotEmbedded: false,
                duplicateDetected: false
            }
        };
    }

    async function generateDraft() {
        lastDraft = await window.TMSDocumentWriterFramework.createDraft({
            writerVersion: ENGINE_VERSION,
            documentId: DOCUMENT_ID,
            requiredAction: REQUIRED_ACTION,
            collectionName: COLLECTION_NAME,
            sourcePath: SOURCE_PATH,
            transform: transform
        });

        return lastDraft;
    }

    async function formatDraftText(draft) {
        const currentDraft = draft || await generateDraft();
        const lines = [
            "TMS-OS WORKSPACE SNAPSHOT HISTORY DRAFT",
            "Accepted: " + (currentDraft.accepted ? "YES" : "NO"),
            "Document: " + DOCUMENT_ID,
            "Framework Version: " +
                (currentDraft.frameworkVersion || "Unavailable"),
            "Writer Version: " + ENGINE_VERSION,
            "Permanent Write Executed: NO"
        ];

        if (!currentDraft.accepted) {
            lines.push("Message: " + currentDraft.message);
            return lines.join("\n");
        }

        lines.push("Update Mode: " + currentDraft.updateMode);
        lines.push("Collection: " + currentDraft.collectionName);
        lines.push("Source Records: " + currentDraft.sourceItemCount);
        lines.push("Proposed Records: " + currentDraft.proposedItemCount);
        lines.push(
            "Appended Snapshot Records: " + currentDraft.appendedSnapshotCount
        );
        lines.push("Snapshot ID: " + currentDraft.snapshotId);
        lines.push("Snapshot Number: " + currentDraft.snapshotNumber);
        lines.push("Proposed Document ID: " + currentDraft.proposedDocumentId);
        lines.push("Transaction Items: " + currentDraft.transactionItemCount);
        lines.push(
            "Revision History Entries: " + currentDraft.revisionHistoryCount
        );
        lines.push(
            "Source Snapshot Embedded: " +
            (currentDraft.sourceSnapshotEmbedded ? "YES" : "NO")
        );
        lines.push(
            "Governance Envelope Retained: " +
            (currentDraft.governanceEnvelopeRetained ? "YES" : "NO")
        );
        lines.push(
            "Source Session Identity Retained: " +
            (currentDraft.sourceSessionIdentityRetained ? "YES" : "NO")
        );
        lines.push(
            "Transaction Metadata Retained: " +
            (currentDraft.transactionMetadataRetained ? "YES" : "NO")
        );
        lines.push(
            "Downstream Governance Dependency: " +
            (currentDraft.downstreamGovernanceDependency ? "YES" : "NO")
        );
        lines.push(
            "Review Choices: " + currentDraft.reviewChoices.join(" | ")
        );

        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSWorkspaceSnapshotHistoryWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error(
            "Workspace Snapshot History Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "workspace-snapshot-history-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 60,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Workspace Snapshot History Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
