/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Work Session History Writer v1.1.0
File: js/session/work-session-history-writer.js

Purpose:
Generate the review-only WS-HIST-001 replacement-document draft by using the
Generic Document Writer Framework. This writer supplies only WS-HIST-specific
transformation rules and never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.1.0";
    const DOCUMENT_ID = "WS-HIST-001";
    const REQUIRED_ACTION = "Append";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error("Work Session History Writer could not initialize because its dependencies are unavailable.");
        return;
    }

    function buildSessionSection(sessionRecord, sectionNumber, normalizedText) {
        const testItems = (sessionRecord.tests || []).map(function (test) {
            if (test && typeof test === "object") {
                return (test.name || test.description || "Recorded test") + ": " + (test.result || "Recorded");
            }
            return normalizedText(test);
        });

        const files = sessionRecord.files || {};
        const bugs = sessionRecord.bugs || {};
        const items = [
            "Session ID: WS-" + sessionRecord.sessionNumber + ".",
            "Version: " + sessionRecord.version + ".",
            "Milestone: " + sessionRecord.milestone + ".",
            "Module: " + sessionRecord.module + ".",
            "Approved session status: " + sessionRecord.status + ".",
            "Objectives: " + (sessionRecord.objectives || []).map(normalizedText).join(" | "),
            "Completed work: " + (sessionRecord.completedTasks || []).map(normalizedText).join(" | "),
            "Deferred work: " + ((sessionRecord.deferredTasks || []).length ? sessionRecord.deferredTasks.map(normalizedText).join(" | ") : "None recorded."),
            "Files added: " + ((files.added || []).length ? files.added.map(normalizedText).join(" | ") : "None recorded."),
            "Files modified: " + ((files.modified || []).length ? files.modified.map(normalizedText).join(" | ") : "None recorded."),
            "Files removed: " + ((files.removed || []).length ? files.removed.map(normalizedText).join(" | ") : "None recorded."),
            "Tests: " + (testItems.length ? testItems.join(" | ") : "None recorded."),
            "Bugs fixed: " + ((bugs.fixed || []).length ? bugs.fixed.map(normalizedText).join(" | ") : "None recorded."),
            "Known bugs: " + ((bugs.known || []).length ? bugs.known.map(normalizedText).join(" | ") : "None recorded."),
            "Decisions: " + ((sessionRecord.decisions || []).length ? sessionRecord.decisions.map(normalizedText).join(" | ") : "None recorded."),
            "Risks: " + ((sessionRecord.risks || []).length ? sessionRecord.risks.map(normalizedText).join(" | ") : "None recorded."),
            "Technical debt: " + ((sessionRecord.technicalDebt || []).length ? sessionRecord.technicalDebt.map(normalizedText).join(" | ") : "None recorded."),
            "Enhancement ideas: " + ((sessionRecord.enhancementIdeas || []).length ? sessionRecord.enhancementIdeas.map(normalizedText).join(" | ") : "None recorded."),
            "Documentation updates: " + ((sessionRecord.documentationUpdates || []).length ? sessionRecord.documentationUpdates.map(normalizedText).join(" | ") : "None recorded.")
        ];

        return {
            number: sectionNumber,
            title: "Verified Work Session " + sessionRecord.sessionNumber,
            paragraphs: [
                "This proposed section was generated from the approved Work Session " + sessionRecord.sessionNumber + " Session Context. It remains review-only until a later controlled writer-execution step is approved."
            ],
            items: items
        };
    }

    async function transform(context) {
        const sessionRecord = context.helpers.clone(context.proposal.payload.sessionRecord);
        const section = buildSessionSection(
            sessionRecord,
            context.helpers.nextSectionNumber(context.sourceDocument),
            context.helpers.normalizedText
        );

        context.proposedDocument.sections.push(section);
        context.proposedDocument.lastUpdated = "Work Session " + sessionRecord.sessionNumber;
        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + sessionRecord.sessionNumber,
            summary: "Proposed addition of the verified Work Session " + sessionRecord.sessionNumber + " history entry.",
            status: "Proposed — Review Required"
        });

        return {
            appendedSection: section
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
            "TMS-OS WORK SESSION HISTORY DRAFT",
            "Accepted: " + (currentDraft.accepted ? "YES" : "NO"),
            "Document: " + DOCUMENT_ID,
            "Framework Version: " + (currentDraft.frameworkVersion || "Unavailable"),
            "Permanent Write Executed: NO"
        ];

        if (!currentDraft.accepted) {
            lines.push("Message: " + currentDraft.message);
            return lines.join("\n");
        }

        lines.push("Source Sections: " + currentDraft.sourceSectionCount);
        lines.push("Proposed Sections: " + currentDraft.proposedSectionCount);
        lines.push("Appended Section: " + currentDraft.appendedSection.number + " — " + currentDraft.appendedSection.title);
        lines.push("Review Choices: " + currentDraft.reviewChoices.join(" | "));
        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSWorkSessionHistoryWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error("Work Session History Writer could not register because the Document Writer Registry is unavailable.");
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "work-session-history-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 10,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Work Session History Writer v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
