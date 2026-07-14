/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Current State Writer v1.0.0
File: js/session/current-state-writer.js

Purpose:
Generate a review-only STATE-001 replacement-document draft through the Generic
Document Writer Framework. This writer replaces the current session, milestone,
next-action, and state-summary snapshots while preserving all unaffected source
content. It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const DOCUMENT_ID = "STATE-001";
    const REQUIRED_ACTION = "Replace";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error("Current State Writer could not initialize because its dependencies are unavailable.");
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

        section.paragraphs = paragraphs.slice();
        if (Array.isArray(items) && items.length) {
            section.items = items.slice();
        } else {
            delete section.items;
        }
        return true;
    }

    async function transform(context) {
        const payload = context.helpers.clone(context.proposal.payload);
        const sessionNumber = String(payload.lastApprovedSession);
        const updatedSections = [];

        const currentSession = findSection(context.proposedDocument, "3");
        if (replaceSectionContent(currentSession, [
            "Current Work Session: WS-" + sessionNumber,
            "Current Version: " + payload.currentVersion,
            "Current Module: " + payload.currentModule,
            "Session Status: " + payload.sessionStatus,
            "The current verified state reflects the approved Work Session " + sessionNumber + " Session Context and remains a review-only draft until a later controlled execution step is approved."
        ])) {
            updatedSections.push("3 — Current Work Session");
        }

        const milestoneState = findSection(context.proposedDocument, "4");
        if (replaceSectionContent(milestoneState, [
            "Current Active Milestone: " + payload.currentMilestone,
            "Current Active Module: " + payload.currentModule,
            "Last Approved Work Session: WS-" + sessionNumber,
            "The current-state draft records the approved session checkpoint without changing historical sections or executing a permanent write."
        ])) {
            updatedSections.push("4 — Current Milestone State");
        }

        const nextAction = findSection(context.proposedDocument, "17");
        if (replaceSectionContent(nextAction, [
            "Next Action: Continue the " + payload.currentMilestone + " milestone from the approved Work Session " + sessionNumber + " checkpoint.",
            "The next implementation step should begin from the stable " + payload.currentModule + " state recorded by this proposed replacement document."
        ])) {
            updatedSections.push("17 — Current Next Action");
        }

        const stateSummary = findSection(context.proposedDocument, "18");
        if (replaceSectionContent(stateSummary, [
            "TMS-OS is currently operating at version " + payload.currentVersion + ".",
            "The active milestone is " + payload.currentMilestone + ".",
            "The active module is " + payload.currentModule + ".",
            "The latest approved work-session checkpoint is WS-" + sessionNumber + ".",
            "This proposed STATE-001 replacement preserves unaffected historical and architectural content and performs no permanent file write."
        ])) {
            updatedSections.push("18 — Current State Summary");
        }

        context.proposedDocument.lastUpdated = "Work Session " + sessionNumber;
        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + sessionNumber,
            summary: "Proposed replacement of the current session, milestone, next-action, and state-summary snapshots for Work Session " + sessionNumber + ".",
            status: "Proposed — Review Required"
        });

        return {
            updateMode: "Replace",
            updatedSections: updatedSections,
            preservedSectionCount: context.sourceDocument.sections.length - updatedSections.length,
            currentStateSnapshot: {
                version: payload.currentVersion,
                milestone: payload.currentMilestone,
                module: payload.currentModule,
                lastApprovedSession: sessionNumber,
                status: payload.sessionStatus
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
            "TMS-OS CURRENT STATE DRAFT",
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
        lines.push("Review Choices: " + currentDraft.reviewChoices.join(" | "));
        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSCurrentStateWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error("Current State Writer could not register because the Document Writer Registry is unavailable.");
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "current-state-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 20,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Current State Writer v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
