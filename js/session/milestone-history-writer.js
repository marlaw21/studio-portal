/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 114 — Milestone History Writer v2.0.0
File: js/session/milestone-history-writer.js

Purpose:
Generate a review-only MILE-HIST-001 append draft through the Generic Document
Writer Framework. Version 2.0.0 consumes the enriched MILE-HIST-001 proposal,
uses proposal-carried source-session identity, retains governance safeguards,
preserves append behavior, and introduces no downstream governance dependency.

It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const DOCUMENT_ID = "MILE-HIST-001";
    const REQUIRED_ACTION = "Append";

    let lastDraft = null;

    if (
        !window.TMSDocumentWriterFramework ||
        !window.TMSSessionContext
    ) {
        console.error(
            "Milestone History Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function nextProgressSectionNumber(documentData) {
        let highest = 0;

        (documentData.sections || [])
            .forEach(function (section) {
                const match =
                    String(section.number || "")
                        .match(/^4\.(\d+)$/);

                if (match) {
                    highest = Math.max(
                        highest,
                        parseInt(match[1], 10)
                    );
                }
            });

        return "4." + (highest + 1);
    }

    function findInsertIndex(documentData) {
        const sections =
            documentData.sections || [];

        const index =
            sections.findIndex(function (section) {
                return String(section.number) === "5";
            });

        return index >= 0
            ? index
            : sections.length;
    }

    function normalizedText(value) {
        if (value === null || value === undefined) {
            return "";
        }

        if (typeof value === "string") {
            return value;
        }

        if (
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return String(value);
        }

        if (typeof value === "object") {
            return Object.keys(value)
                .map(function (key) {
                    return key + ": " + normalizedText(value[key]);
                })
                .join("; ");
        }

        return String(value);
    }

    function normalizeSourceSession(source) {
        return {
            sessionNumber:
                String(source.sessionNumber || "Unavailable"),

            version:
                source.version || "Unavailable",

            milestone:
                source.milestone || "Unavailable",

            module:
                source.module || "Unavailable",

            status:
                source.status || "Unavailable"
        };
    }

    function normalizeGovernanceEnvelope(envelope) {
        return {
            governanceMode:
                envelope.governanceMode || "Disabled",

            documentationMode:
                envelope.documentationMode || "Review Only",

            executionMode:
                envelope.executionMode || "Disabled",

            validationStatus:
                envelope.validationStatus ||
                "Validation Status Unavailable",

            failedTestCount:
                Number(envelope.failedTestCount) || 0,

            approvalStatus:
                envelope.approvalStatus || "Closure Approved",

            humanApprovalRecorded:
                envelope.humanApprovalRecorded === true,

            milestoneCompletionDeclared:
                envelope.milestoneCompletionDeclared === true,

            permanentWriteStatus:
                envelope.permanentWriteStatus || "Not Executed",

            rollbackStatus:
                envelope.rollbackStatus || "Not Executed",

            restoreStatus:
                envelope.restoreStatus || "Not Executed",

            executionLockStatus:
                envelope.executionLockStatus || "Locked",

            downstreamGovernanceDependency:
                envelope.downstreamGovernanceDependency === true
        };
    }

    function buildProgressSection(
        payload,
        sourceSession,
        governanceEnvelope,
        sectionNumber
    ) {
        const completedTasks =
            (payload.completedTasks || [])
                .map(normalizedText);

        const completedText =
            completedTasks.length
                ? completedTasks.join("; ")
                : "No completed tasks were recorded.";

        return {
            number:
                sectionNumber,

            title:
                "Milestone Progress — Work Session " +
                sourceSession.sessionNumber,

            tables: [
                {
                    headers: [
                        "Milestone Progress Field",
                        "Verified Value"
                    ],

                    rows: [
                        [
                            "Work Session",
                            "WS-" + sourceSession.sessionNumber
                        ],
                        [
                            "Version",
                            sourceSession.version
                        ],
                        [
                            "Milestone",
                            payload.milestone ||
                                sourceSession.milestone
                        ],
                        [
                            "Module",
                            payload.module ||
                                sourceSession.module
                        ],
                        [
                            "Session Status",
                            sourceSession.status
                        ],
                        [
                            "Completed Work",
                            completedText
                        ],
                        [
                            "Governance Mode",
                            governanceEnvelope.governanceMode
                        ],
                        [
                            "Documentation Mode",
                            governanceEnvelope.documentationMode
                        ],
                        [
                            "Execution Mode",
                            governanceEnvelope.executionMode
                        ],
                        [
                            "Validation Status",
                            governanceEnvelope.validationStatus
                        ],
                        [
                            "Execution Lock Status",
                            governanceEnvelope.executionLockStatus
                        ],
                        [
                            "Milestone Completion Declared",
                            governanceEnvelope.milestoneCompletionDeclared
                                ? "YES"
                                : "NO"
                        ],
                        [
                            "Permanent Write Status",
                            governanceEnvelope.permanentWriteStatus
                        ],
                        [
                            "Rollback Status",
                            governanceEnvelope.rollbackStatus
                        ],
                        [
                            "Restore Status",
                            governanceEnvelope.restoreStatus
                        ],
                        [
                            "Evidence",
                            "Approved Session Review Package and Document Update Plan"
                        ]
                    ]
                }
            ],

            paragraphs: [
                "This entry records verified milestone progress from the approved Work Session " +
                    sourceSession.sessionNumber +
                    " proposal.",

                "It does not declare the milestone complete unless completion is explicitly recorded. It remains review-only and performs no permanent write, rollback, or restore."
            ]
        };
    }

    async function transform(context) {
        const payload =
            context.helpers.clone(
                context.proposal.payload || {}
            );

        const sourceSession =
            normalizeSourceSession(
                payload.sourceSession || {}
            );

        const governanceEnvelope =
            normalizeGovernanceEnvelope(
                payload.governanceEnvelope || {}
            );

        const sectionNumber =
            nextProgressSectionNumber(
                context.sourceDocument
            );

        const appendedSection =
            buildProgressSection(
                payload,
                sourceSession,
                governanceEnvelope,
                sectionNumber
            );

        const insertIndex =
            findInsertIndex(
                context.proposedDocument
            );

        context.proposedDocument.sections
            .splice(
                insertIndex,
                0,
                appendedSection
            );

        context.proposedDocument.lastUpdated =
            "Work Session " +
            sourceSession.sessionNumber;

        context.helpers.appendRevisionHistory(
            context.proposedDocument,
            {
                version:
                    context.proposedDocument.version,

                date:
                    "Work Session " +
                    sourceSession.sessionNumber,

                summary:
                    "Proposed addition of verified Work Session " +
                    sourceSession.sessionNumber +
                    " milestone progress with approved governance safeguards.",

                status:
                    "Proposed — Review Required"
            }
        );

        return {
            updateMode:
                REQUIRED_ACTION,

            appendedSection:
                appendedSection,

            appendedMilestoneEntryCount:
                1,

            milestone:
                payload.milestone ||
                sourceSession.milestone,

            module:
                payload.module ||
                sourceSession.module,

            governanceEnvelopeRetained:
                true,

            downstreamGovernanceDependency:
                false,

            milestoneHistorySnapshot: {
                sourceSessionNumber:
                    sourceSession.sessionNumber,

                sourceVersion:
                    sourceSession.version,

                sourceMilestone:
                    sourceSession.milestone,

                sourceModule:
                    sourceSession.module,

                sourceStatus:
                    sourceSession.status,

                completedTaskCount:
                    Array.isArray(payload.completedTasks)
                        ? payload.completedTasks.length
                        : 0,

                governanceMode:
                    governanceEnvelope.governanceMode,

                documentationMode:
                    governanceEnvelope.documentationMode,

                executionMode:
                    governanceEnvelope.executionMode,

                validationStatus:
                    governanceEnvelope.validationStatus,

                failedTestCount:
                    governanceEnvelope.failedTestCount,

                milestoneCompletionDeclared:
                    governanceEnvelope.milestoneCompletionDeclared,

                executionLockStatus:
                    governanceEnvelope.executionLockStatus,

                permanentWriteStatus:
                    governanceEnvelope.permanentWriteStatus,

                rollbackStatus:
                    governanceEnvelope.rollbackStatus,

                restoreStatus:
                    governanceEnvelope.restoreStatus
            }
        };
    }

    async function generateDraft() {
        lastDraft =
            await window.TMSDocumentWriterFramework
                .createDraft({
                    writerVersion:
                        ENGINE_VERSION,

                    documentId:
                        DOCUMENT_ID,

                    requiredAction:
                        REQUIRED_ACTION,

                    transform:
                        transform
                });

        return lastDraft;
    }

    async function formatDraftText(draft) {
        const currentDraft =
            draft ||
            await generateDraft();

        const lines = [
            "TMS-OS MILESTONE HISTORY DRAFT",
            "Accepted: " +
                (
                    currentDraft.accepted
                        ? "YES"
                        : "NO"
                ),
            "Document: " +
                DOCUMENT_ID,
            "Writer Version: " +
                ENGINE_VERSION,
            "Framework Version: " +
                (
                    currentDraft.frameworkVersion ||
                    "Unavailable"
                ),
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
            "Source Sections: " +
            currentDraft.sourceSectionCount
        );

        lines.push(
            "Proposed Sections: " +
            currentDraft.proposedSectionCount
        );

        lines.push(
            "Appended Milestone Entries: " +
            currentDraft.appendedMilestoneEntryCount
        );

        lines.push(
            "Appended Section: " +
            currentDraft.appendedSection.number +
            " — " +
            currentDraft.appendedSection.title
        );

        lines.push(
            "Milestone: " +
            currentDraft.milestone
        );

        lines.push(
            "Module: " +
            currentDraft.module
        );

        lines.push(
            "Governance Envelope Retained: " +
            (
                currentDraft.governanceEnvelopeRetained
                    ? "YES"
                    : "NO"
            )
        );

        lines.push(
            "Downstream Governance Dependency: " +
            (
                currentDraft.downstreamGovernanceDependency
                    ? "YES"
                    : "NO"
            )
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

    window.TMSMilestoneHistoryWriter =
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
            "Milestone History Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId:
            "milestone-history-writer",

        documentId:
            DOCUMENT_ID,

        writerVersion:
            ENGINE_VERSION,

        updateMode:
            REQUIRED_ACTION,

        order:
            50,

        generateDraft:
            generateDraft,

        formatDraftText:
            formatDraftText,

        getLastDraft:
            getLastDraft
    });

    console.log(
        "Milestone History Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
