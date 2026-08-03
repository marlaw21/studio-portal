/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 113 — Decision Log Writer v2.0.0
File: js/session/decision-log-writer.js

Purpose:
Generate a review-only DEC-LOG-001 append draft through the Generic Document
Writer Framework. Version 2.0.0 consumes the enriched DEC-LOG-001 proposal,
uses the approved source-session identity carried by that proposal, retains
governance safeguards, and introduces no downstream governance dependency.

It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const DOCUMENT_ID = "DEC-LOG-001";
    const REQUIRED_ACTION = "Append";
    const DECISION_PREFIX = "DEC-2026-";
    let lastDraft = null;

    if (!window.TMSDocumentWriterFramework || !window.TMSSessionContext) {
        console.error(
            "Decision Log Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function findDecisionInsertIndex(documentData) {
        const sections = documentData.sections || [];
        const index = sections.findIndex(function (section) {
            return String(section.number) === "5";
        });
        return index >= 0 ? index : sections.length;
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
            description: String(
                entry.description ||
                entry.title ||
                entry.name ||
                "Approved session decision"
            ),
            rationale: String(
                entry.rationale ||
                entry.details ||
                "Recorded in the approved Session Context."
            )
        };
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
            executionLockStatus: envelope.executionLockStatus || "Locked",
            permanentWriteStatus:
                envelope.permanentWriteStatus || "Not Executed",
            rollbackStatus: envelope.rollbackStatus || "Not Executed",
            restoreStatus: envelope.restoreStatus || "Not Executed",
            downstreamGovernanceDependency:
                envelope.downstreamGovernanceDependency === true
        };
    }

    function decisionId(sequence) {
        return DECISION_PREFIX + String(sequence).padStart(4, "0");
    }

    function buildDecisionSection(
        decision,
        sectionSequence,
        decisionSequence,
        sourceSession,
        governanceEnvelope
    ) {
        const id = decisionId(decisionSequence);

        return {
            number: "4." + sectionSequence,
            title: id + " — " + decision.description,
            tables: [
                {
                    headers: [
                        "Decision Area",
                        "Work Session " + sourceSession.sessionNumber
                    ],
                    rows: [
                        ["Decision", decision.description],
                        ["Reason / Operating Effect", decision.rationale],
                        ["Source Work Session", "WS-" + sourceSession.sessionNumber],
                        ["Source Version", sourceSession.version],
                        ["Source Milestone", sourceSession.milestone],
                        ["Source Module", sourceSession.module],
                        ["Source Session Status", sourceSession.status],
                        ["Governance Mode", governanceEnvelope.governanceMode],
                        ["Documentation Mode", governanceEnvelope.documentationMode],
                        ["Execution Mode", governanceEnvelope.executionMode],
                        ["Validation Status", governanceEnvelope.validationStatus],
                        ["Execution Lock Status", governanceEnvelope.executionLockStatus],
                        ["Permanent Write Status", governanceEnvelope.permanentWriteStatus],
                        ["Rollback Status", governanceEnvelope.rollbackStatus],
                        ["Restore Status", governanceEnvelope.restoreStatus],
                        ["Current Status", "Approved — Review Draft"]
                    ]
                }
            ]
        };
    }

    async function transform(context) {
        const payload = context.helpers.clone(context.proposal.payload);
        const decisions = (payload.decisions || []).map(normalizeDecision);
        const sourceSession = normalizeSourceSession(payload.sourceSession || {});
        const governanceEnvelope =
            normalizeGovernanceEnvelope(payload.governanceEnvelope || {});

        let decisionSequence = nextDecisionSequence(context.sourceDocument);
        let sectionSequence = nextDecisionSectionNumber(context.sourceDocument);

        const appendedSections = decisions.map(function (decision) {
            const section = buildDecisionSection(
                decision,
                sectionSequence,
                decisionSequence,
                sourceSession,
                governanceEnvelope
            );
            sectionSequence += 1;
            decisionSequence += 1;
            return section;
        });

        const insertIndex = findDecisionInsertIndex(context.proposedDocument);
        context.proposedDocument.sections.splice.apply(
            context.proposedDocument.sections,
            [insertIndex, 0].concat(appendedSections)
        );

        context.proposedDocument.lastUpdated =
            "Work Session " + sourceSession.sessionNumber;

        context.helpers.appendRevisionHistory(context.proposedDocument, {
            version: context.proposedDocument.version,
            date: "Work Session " + sourceSession.sessionNumber,
            summary:
                "Proposed addition of " +
                appendedSections.length +
                " approved Work Session " +
                sourceSession.sessionNumber +
                " decision record(s) with approved governance safeguards.",
            status: "Proposed — Review Required"
        });

        return {
            updateMode: REQUIRED_ACTION,
            appendedSections: appendedSections,
            appendedDecisionCount: appendedSections.length,
            firstDecisionId:
                appendedSections.length
                    ? appendedSections[0].title.split(" — ")[0]
                    : null,
            lastDecisionId:
                appendedSections.length
                    ? appendedSections[
                        appendedSections.length - 1
                    ].title.split(" — ")[0]
                    : null,
            governanceEnvelopeRetained: true,
            downstreamGovernanceDependency: false,
            decisionLogSnapshot: {
                sourceSessionNumber: sourceSession.sessionNumber,
                sourceVersion: sourceSession.version,
                sourceMilestone: sourceSession.milestone,
                sourceModule: sourceSession.module,
                sourceStatus: sourceSession.status,
                appendedDecisionCount: appendedSections.length,
                governanceMode: governanceEnvelope.governanceMode,
                documentationMode: governanceEnvelope.documentationMode,
                executionMode: governanceEnvelope.executionMode,
                validationStatus: governanceEnvelope.validationStatus,
                failedTestCount: governanceEnvelope.failedTestCount,
                executionLockStatus: governanceEnvelope.executionLockStatus,
                permanentWriteStatus: governanceEnvelope.permanentWriteStatus,
                rollbackStatus: governanceEnvelope.rollbackStatus,
                restoreStatus: governanceEnvelope.restoreStatus
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
            "TMS-OS DECISION LOG DRAFT",
            "Accepted: " + (currentDraft.accepted ? "YES" : "NO"),
            "Document: " + DOCUMENT_ID,
            "Writer Version: " + ENGINE_VERSION,
            "Framework Version: " +
                (currentDraft.frameworkVersion || "Unavailable"),
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
        lines.push(
            "Decision Range: " +
            currentDraft.firstDecisionId +
            " through " +
            currentDraft.lastDecisionId
        );
        lines.push(
            "Governance Envelope Retained: " +
            (currentDraft.governanceEnvelopeRetained ? "YES" : "NO")
        );
        lines.push(
            "Downstream Governance Dependency: " +
            (currentDraft.downstreamGovernanceDependency ? "YES" : "NO")
        );
        lines.push(
            "Review Choices: " +
            currentDraft.reviewChoices.join(" | ")
        );

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
        console.error(
            "Decision Log Writer could not register because the Document Writer Registry is unavailable."
        );
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
        "Decision Log Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext.getSnapshot().sessionNumber +
        "."
    );
}());
