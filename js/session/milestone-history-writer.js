/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 047 — Milestone History Writer v1.0.0
File: js/session/milestone-history-writer.js

Purpose:
Generate a review-only MILE-HIST-001 append draft through the Generic Document
Writer Framework. The writer converts approved Session Context milestone progress
into a controlled history entry, preserves existing milestone records, and never
writes a live JSON file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const DOCUMENT_ID = "MILE-HIST-001";
    const REQUIRED_ACTION = "Append";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error("Milestone History Writer could not initialize because its dependencies are unavailable.");
        return;
    }

    function nextProgressSectionNumber(documentData) {
        let highest = 0;
        (documentData.sections || []).forEach(function (section) {
            const match = String(section.number || "").match(/^4\.(\d+)$/);
            if (match) {
                highest = Math.max(highest, parseInt(match[1], 10));
            }
        });
        return "4." + (highest + 1);
    }

    function findInsertIndex(documentData) {
        const sections = documentData.sections || [];
        const index = sections.findIndex(function (section) {
            return String(section.number) === "5";
        });
        return index >= 0 ? index : sections.length;
    }

    function textList(entries, helpers) {
        return (entries || []).map(function (entry) {
            return helpers.normalizedText(entry);
        });
    }

    function buildProgressSection(payload, session, helpers, sectionNumber) {
        const completedTasks = textList(payload.completedTasks, helpers);
        const completedText = completedTasks.length
            ? completedTasks.join("; ")
            : "No completed tasks were recorded.";

        return {
            number: sectionNumber,
            title: "Milestone Progress — Work Session " + session.sessionNumber,
            tables: [
                {
                    headers: ["Milestone Progress Field", "Verified Value"],
                    rows: [
                        ["Work Session", "WS-" + session.sessionNumber],
                        ["Milestone", payload.milestone || session.milestone],
                        ["Module", payload.module || session.module],
                        ["Session Status", session.status],
                        ["Completed Work", completedText],
                        ["Evidence", "Approved Session Context and Document Update Plan"]
                    ]
                }
            ],
            paragraphs: [
                "This entry records verified milestone progress from the approved Work Session " +
                session.sessionNumber + " Session Context. It does not declare the milestone complete unless completion is explicitly recorded."
            ]
        };
    }

    async function transform(context) {
        const session = window.TMSSessionContext.getSnapshot();
        const payload = context.helpers.clone(context.proposal.payload || {});
        const sectionNumber = nextProgressSectionNumber(context.sourceDocument);
        const appendedSection = buildProgressSection(
            payload,
            session,
            context.helpers,
            sectionNumber
        );

        const insertIndex = findInsertIndex(context.proposedDocument);
        context.proposedDocument.sections.splice(insertIndex, 0, appendedSection);
        context.proposedDocument.lastUpdated = "Work Session " + session.sessionNumber;
        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + session.sessionNumber,
            summary: "Proposed addition of verified Work Session " + session.sessionNumber + " milestone progress.",
            status: "Proposed — Review Required"
        });

        return {
            updateMode: REQUIRED_ACTION,
            appendedSection: appendedSection,
            appendedMilestoneEntryCount: 1,
            milestone: payload.milestone || session.milestone,
            module: payload.module || session.module
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
            "TMS-OS MILESTONE HISTORY DRAFT",
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
        lines.push("Appended Milestone Entries: " + currentDraft.appendedMilestoneEntryCount);
        lines.push("Appended Section: " + currentDraft.appendedSection.number + " — " + currentDraft.appendedSection.title);
        lines.push("Milestone: " + currentDraft.milestone);
        lines.push("Module: " + currentDraft.module);
        lines.push("Review Choices: " + currentDraft.reviewChoices.join(" | "));
        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSMilestoneHistoryWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error("Milestone History Writer could not register because the Document Writer Registry is unavailable.");
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "milestone-history-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 50,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Milestone History Writer v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
