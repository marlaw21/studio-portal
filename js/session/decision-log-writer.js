/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 047 — Decision Log Writer v1.0.0
File: js/session/decision-log-writer.js

Purpose:
Generate a review-only DEC-LOG-001 append draft through the Generic Document
Writer Framework. The writer converts approved Session Context decisions into
controlled permanent-decision records, preserves the existing decision history,
and never writes a live JSON file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const DOCUMENT_ID = "DEC-LOG-001";
    const REQUIRED_ACTION = "Append";
    const DECISION_PREFIX = "DEC-2026-";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error("Decision Log Writer could not initialize because its dependencies are unavailable.");
        return;
    }

    function findDecisionInsertIndex(documentData) {
        const sections = documentData.sections || [];
        const firstPostBaselineIndex = sections.findIndex(function (section) {
            return String(section.number) === "5";
        });
        return firstPostBaselineIndex >= 0 ? firstPostBaselineIndex : sections.length;
    }

    function nextDecisionSequence(documentData) {
        let highest = 0;
        (documentData.sections || []).forEach(function (section) {
            const match = String(section.title || "").match(/DEC-2026-(\d{4})/);
            if (match) {
                highest = Math.max(highest, parseInt(match[1], 10));
            }
        });
        return highest + 1;
    }

    function nextDecisionSectionNumber(documentData) {
        let highest = 0;
        (documentData.sections || []).forEach(function (section) {
            const match = String(section.number || "").match(/^4\.(\d+)$/);
            if (match) {
                highest = Math.max(highest, parseInt(match[1], 10));
            }
        });
        return highest + 1;
    }

    function normalizeDecision(entry) {
        if (typeof entry === "string") {
            return {
                description: entry,
                rationale: "Recorded in the approved Session Context."
            };
        }

        return {
            description: String(entry.description || entry.title || entry.name || "Approved session decision"),
            rationale: String(entry.rationale || entry.details || "Recorded in the approved Session Context.")
        };
    }

    function decisionId(sequence) {
        return DECISION_PREFIX + String(sequence).padStart(4, "0");
    }

    function buildDecisionSection(decision, sectionSequence, decisionSequence, sessionNumber) {
        const id = decisionId(decisionSequence);
        return {
            number: "4." + sectionSequence,
            title: id + " — " + decision.description,
            tables: [
                {
                    headers: ["Decision Area", "Work Session " + sessionNumber],
                    rows: [
                        ["Decision", decision.description],
                        ["Reason / Operating Effect", decision.rationale],
                        ["Source Work Session", "WS-" + sessionNumber],
                        ["Current Status", "Approved — Review Draft"]
                    ]
                }
            ]
        };
    }

    async function transform(context) {
        const decisions = context.helpers.clone(context.proposal.payload.decisions || []).map(normalizeDecision);
        const session = window.TMSSessionContext.getSnapshot();
        const sessionNumber = String(session.sessionNumber);
        let decisionSequence = nextDecisionSequence(context.sourceDocument);
        let sectionSequence = nextDecisionSectionNumber(context.sourceDocument);
        const appendedSections = decisions.map(function (decision) {
            const section = buildDecisionSection(decision, sectionSequence, decisionSequence, sessionNumber);
            sectionSequence += 1;
            decisionSequence += 1;
            return section;
        });

        const insertIndex = findDecisionInsertIndex(context.proposedDocument);
        context.proposedDocument.sections.splice.apply(
            context.proposedDocument.sections,
            [insertIndex, 0].concat(appendedSections)
        );
        context.proposedDocument.lastUpdated = "Work Session " + sessionNumber;
        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + sessionNumber,
            summary: "Proposed addition of " + appendedSections.length + " approved Work Session " + sessionNumber + " decision record(s).",
            status: "Proposed — Review Required"
        });

        return {
            updateMode: REQUIRED_ACTION,
            appendedSections: appendedSections,
            appendedDecisionCount: appendedSections.length,
            firstDecisionId: appendedSections.length ? appendedSections[0].title.split(" — ")[0] : null,
            lastDecisionId: appendedSections.length ? appendedSections[appendedSections.length - 1].title.split(" — ")[0] : null
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
            "TMS-OS DECISION LOG DRAFT",
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
        lines.push("Appended Decisions: " + currentDraft.appendedDecisionCount);
        lines.push("Decision Range: " + currentDraft.firstDecisionId + " through " + currentDraft.lastDecisionId);
        lines.push("Review Choices: " + currentDraft.reviewChoices.join(" | "));
        return lines.join("\n");
    }

    function getLastDraft() {
        return lastDraft;
    }

    window.TMSDecisionLogWriter = Object.freeze({
        engineVersion: ENGINE_VERSION,
        documentId: DOCUMENT_ID,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    if (!window.TMSDocumentWriterRegistry) {
        console.error("Decision Log Writer could not register because the Document Writer Registry is unavailable.");
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId: "decision-log-writer",
        documentId: DOCUMENT_ID,
        writerVersion: ENGINE_VERSION,
        updateMode: REQUIRED_ACTION,
        order: 40,
        generateDraft: generateDraft,
        formatDraftText: formatDraftText,
        getLastDraft: getLastDraft
    });

    console.log(
        "Decision Log Writer v" + ENGINE_VERSION +
        " initialized for Work Session " + window.TMSSessionContext.getSnapshot().sessionNumber + "."
    );
}());
