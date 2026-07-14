/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Documentation State Writer v1.0.0
File: js/session/documentation-state-writer.js

Purpose:
Generate a review-only DOC-STATE-001 replacement-document draft through the
Generic Document Writer Framework. This writer refreshes the documentation
system's current population, automation, priority, next-action, checklist, and
permanent-state sections while preserving all unaffected source content. It
never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const DOCUMENT_ID = "DOC-STATE-001";
    const REQUIRED_ACTION = "Replace";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error("Documentation State Writer could not initialize because its dependencies are unavailable.");
        return;
    }

    function findSection(documentData, number) {
        return (documentData.sections || []).find(function (section) {
            return String(section.number) === String(number);
        }) || null;
    }

    function replaceSectionContent(section, paragraphs, items) {
        if (!section) {
            return false;
        }

        section.paragraphs = Array.isArray(paragraphs) ? paragraphs.slice() : [];

        if (Array.isArray(items) && items.length) {
            section.items = items.slice();
        } else {
            delete section.items;
        }

        delete section.tables;
        delete section.records;
        return true;
    }

    async function transform(context) {
        const payload = context.helpers.clone(context.proposal.payload);
        const sessionNumber = String(payload.lastApprovedSession);
        const documentationUpdates = Array.isArray(payload.documentationUpdates)
            ? payload.documentationUpdates.slice()
            : [];
        const registeredWriters = window.TMSDocumentWriterRegistry
            ? window.TMSDocumentWriterRegistry.getRegisteredWriters()
            : [];
        const writerCountAfterRegistration = registeredWriters.length;
        const updatedSections = [];

        const populationStatus = findSection(context.proposedDocument, "6");
        if (replaceSectionContent(populationStatus, [
            "At the Work Session " + sessionNumber + " checkpoint, the structured Documentation Operating System remains stable and the End Session Automation foundation can generate review-only permanent-document drafts.",
            "This proposed documentation-state replacement records the current approved automation checkpoint without changing the live DOC-STATE-001.json file."
        ], [
            "Connected permanent documents: 20",
            "Documentation Catalog and Embedded Viewer: Stable",
            "Shared Document Template Engine: Stable",
            "Full-content Documentation Search: Operational",
            "Generic Document Writer Framework: Operational",
            "Registered permanent-document writers after this installation: " + writerCountAfterRegistration,
            "Registered draft targets: " + registeredWriters.map(function (writer) { return writer.documentId; }).join(", "),
            "Latest approved work session: WS-" + sessionNumber,
            "Permanent write status: " + payload.permanentWriteStatus,
            "Automatic live-document writing: Not yet active"
        ])) {
            updatedSections.push("6 — Current Population Status");
        }

        const currentPriority = findSection(context.proposedDocument, "11");
        if (replaceSectionContent(currentPriority, [
            "Continue End Session Automation by expanding the registered writer set while preserving the review-first Human Approval Gate.",
            "Every writer must generate a complete proposed replacement document, preserve unaffected source content, and keep permanent writes disabled until a later controlled execution layer is explicitly approved."
        ])) {
            updatedSections.push("11 — Current Priority");
        }

        const nextAction = findSection(context.proposedDocument, "12");
        if (replaceSectionContent(nextAction, [
            "Next controlled documentation action: validate the DOC-STATE-001 writer through the Document Writer Registry, confirm the combined draft package increases to three accepted drafts, and return Work Session " + sessionNumber + " to Active after testing.",
            "After this writer is proven, continue with the remaining approved permanent-document writers before implementing any live-file execution layer."
        ])) {
            updatedSections.push("12 — Next Controlled Documentation Action");
        }

        const completionChecklist = findSection(context.proposedDocument, "13");
        if (replaceSectionContent(completionChecklist, [], [
            "DOC-STATE-001 source document loaded and validated",
            "Document identity and unaffected sections preserved",
            "Replace-mode draft generated through the Generic Document Writer Framework",
            "Current population and automation state refreshed",
            "Registered writer count recorded",
            "Latest approved work session recorded",
            "Revision history proposal added",
            "Live DOC-STATE-001.json file unchanged",
            "Human Approval Gate preserved",
            "Combined Draft Package reviewed before permanent execution"
        ])) {
            updatedSections.push("13 — Completion Checklist");
        }

        const permanentStatement = findSection(context.proposedDocument, "14");
        if (replaceSectionContent(permanentStatement, [
            "The Two Marshalls Studios documentation system now supports controlled, review-only generation of permanent-document drafts from approved Session Context data.",
            "The Documentation State Writer preserves the existing permanent record, updates only designated current-state sections, and performs no live-file write. Human approval and a future controlled execution layer remain mandatory before proposed documentation becomes permanent."
        ])) {
            updatedSections.push("14 — Permanent Statement");
        }

        context.proposedDocument.lastUpdated = "Work Session " + sessionNumber;
        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + sessionNumber,
            summary: "Proposed replacement of documentation population, automation status, priority, next action, checklist, and permanent-state sections for Work Session " + sessionNumber + ".",
            status: "Proposed — Review Required"
        });

        return {
            updateMode: "Replace",
            updatedSections: updatedSections,
            preservedSectionCount: context.sourceDocument.sections.length - updatedSections.length,
            documentationStateSnapshot: {
                lastApprovedSession: sessionNumber,
                connectedPermanentDocuments: 20,
                registeredWriterCount: writerCountAfterRegistration,
                registeredDocuments: registeredWriters.map(function (writer) {
                    return writer.documentId;
                }),
                documentationUpdateCount: documentationUpdates.length,
                permanentWriteStatus: payload.permanentWriteStatus
            }
        };
    }

    async function generateDraft() {
        lastDraft = await window.TMSDocumentWriterFramework.createDraft({
            writerVersion: ENGINE_VERSION,
            documentId: DOCUMENT_ID,
            requiredAction: REQUIRED_ACTION,
            transform: transform
        });
        return lastDraft;
    }

    async function formatDraftText(draft) {
        const currentDraft = draft || await generateDraft();
        const lines = [
            "TMS-OS DOCUMENTATION STATE DRAFT",
            "Accepted: " + (currentDraft.accepted ? "YES" : "NO"),
            "Document: " + DOCUMENT_ID,
            "Framework Version: " + (currentDraft.frameworkVersion || "Unavailable"),
            "Permanent Write Executed: NO"
        ];

        if (!currentDraft.accepted) {
            lines.push("Message: " + currentDraft.message);
            return lines.join("\n");
        }

        lines.push("Update Mode: " + currentDraft.updateMode);
        lines.push("Source Sections: " + currentDraft.sourceSectionCount);
        lines.push("Proposed Sections: " + currentDraft.proposedSectionCount);
        lines.push("Updated Sections: " + currentDraft.updatedSections.join(" | "));
        lines.push("Preserved Sections: " + currentDraft.preservedSectionCount);
        lines.push("Registered Writers: " + currentDraft.documentationStateSnapshot.registeredWriterCount);
        lines.push("Connected Permanent Documents: " + currentDraft.documentationStateSnapshot.connectedPermanentDocuments);
        lines.push("Review Choices: " + currentDraft.reviewChoices.join(" | "));
        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSDocumentationStateWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error("Documentation State Writer could not register because the Document Writer Registry is unavailable.");
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "documentation-state-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 30,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Documentation State Writer v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
