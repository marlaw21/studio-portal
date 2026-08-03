/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 112 — Work Session History Writer v2.0.0
File: js/session/work-session-history-writer.js

Purpose:
Generate the review-only WS-HIST-001 replacement-document draft through the
Generic Document Writer Framework. Version 2.0.0 consumes the enriched
WS-HIST-001 proposal envelope, preserves append behavior, records governance
safeguards, and introduces no downstream lifecycle, state, or workflow
dependency.

It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const DOCUMENT_ID = "WS-HIST-001";
    const REQUIRED_ACTION = "Append";

    let lastDraft = null;

    if (
        !window.TMSDocumentWriterFramework ||
        !window.TMSSessionContext
    ) {
        console.error(
            "Work Session History Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function normalizedText(value) {
        if (value === null || value === undefined) {
            return "";
        }

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "number" || typeof value === "boolean") {
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

    function normalizedEnvelope(envelope) {
        return {
            governanceMode:
                envelope.governanceMode || "Disabled",

            documentationMode:
                envelope.documentationMode || "Review Only",

            executionMode:
                envelope.executionMode || "Disabled",

            reviewPackageType:
                envelope.reviewPackageType ||
                "TMS-OS Prepare Session Review Package",

            reviewGeneratedAt:
                envelope.reviewGeneratedAt || "Unavailable",

            validationStatus:
                envelope.validationStatus ||
                "Validation Status Unavailable",

            failedTestCount:
                Number(envelope.failedTestCount) || 0,

            approvalStatus:
                envelope.approvalStatus || "Closure Approved",

            humanApprovalRecorded:
                envelope.humanApprovalRecorded === true,

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

    function mapItems(values, normalizer) {
        return Array.isArray(values)
            ? values.map(normalizer)
            : [];
    }

    function buildSessionSection(
        sessionRecord,
        governanceEnvelope,
        sectionNumber
    ) {
        const tests =
            mapItems(
                sessionRecord.tests,
                function (test) {
                    if (
                        test &&
                        typeof test === "object"
                    ) {
                        return (
                            test.name ||
                            test.description ||
                            "Recorded test"
                        ) +
                        ": " +
                        (
                            test.result ||
                            "Recorded"
                        );
                    }

                    return normalizedText(test);
                }
            );

        const files =
            sessionRecord.files || {};

        const bugs =
            sessionRecord.bugs || {};

        const items = [
            "Session ID: WS-" +
                sessionRecord.sessionNumber +
                ".",

            "Version: " +
                sessionRecord.version +
                ".",

            "Milestone: " +
                sessionRecord.milestone +
                ".",

            "Module: " +
                sessionRecord.module +
                ".",

            "Approved session status: " +
                sessionRecord.status +
                ".",

            "Governance mode: " +
                governanceEnvelope.governanceMode +
                ".",

            "Documentation mode: " +
                governanceEnvelope.documentationMode +
                ".",

            "Execution mode: " +
                governanceEnvelope.executionMode +
                ".",

            "Validation status: " +
                governanceEnvelope.validationStatus +
                ".",

            "Failed test count: " +
                governanceEnvelope.failedTestCount +
                ".",

            "Execution lock status: " +
                governanceEnvelope.executionLockStatus +
                ".",

            "Permanent write status: " +
                governanceEnvelope.permanentWriteStatus +
                ".",

            "Rollback status: " +
                governanceEnvelope.rollbackStatus +
                ".",

            "Restore status: " +
                governanceEnvelope.restoreStatus +
                ".",

            "Objectives: " +
                (
                    mapItems(
                        sessionRecord.objectives,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Completed work: " +
                (
                    mapItems(
                        sessionRecord.completedTasks,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Deferred work: " +
                (
                    mapItems(
                        sessionRecord.deferredTasks,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Files added: " +
                (
                    mapItems(
                        files.added,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Files modified: " +
                (
                    mapItems(
                        files.modified,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Files removed: " +
                (
                    mapItems(
                        files.removed,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Tests: " +
                (
                    tests.join(" | ") ||
                    "None recorded."
                ),

            "Bugs fixed: " +
                (
                    mapItems(
                        bugs.fixed,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Known bugs: " +
                (
                    mapItems(
                        bugs.known,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Decisions: " +
                (
                    mapItems(
                        sessionRecord.decisions,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Risks: " +
                (
                    mapItems(
                        sessionRecord.risks,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Technical debt: " +
                (
                    mapItems(
                        sessionRecord.technicalDebt,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Enhancement ideas: " +
                (
                    mapItems(
                        sessionRecord.enhancementIdeas,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                ),

            "Documentation updates: " +
                (
                    mapItems(
                        sessionRecord.documentationUpdates,
                        normalizedText
                    ).join(" | ") ||
                    "None recorded."
                )
        ];

        return {
            number:
                sectionNumber,

            title:
                "Verified Work Session " +
                sessionRecord.sessionNumber,

            paragraphs: [
                "This proposed section was generated from the approved Work Session " +
                    sessionRecord.sessionNumber +
                    " Session Context and its approved governance envelope.",

                "It remains review-only. No permanent write, rollback, restore, or downstream governance dependency was introduced."
            ],

            items:
                items
        };
    }

    async function transform(context) {
        const payload =
            context.helpers.clone(
                context.proposal.payload
            );

        const sessionRecord =
            payload.sessionRecord || {};

        const governanceEnvelope =
            normalizedEnvelope(
                payload.governanceEnvelope || {}
            );

        const section =
            buildSessionSection(
                sessionRecord,
                governanceEnvelope,
                context.helpers.nextSectionNumber(
                    context.sourceDocument
                )
            );

        context.proposedDocument.sections.push(
            section
        );

        context.proposedDocument.lastUpdated =
            "Work Session " +
            sessionRecord.sessionNumber;

        context.helpers.appendRevisionHistory(
            context.proposedDocument,
            {
                version:
                    context.proposedDocument.version,

                date:
                    "Work Session " +
                    sessionRecord.sessionNumber,

                summary:
                    "Proposed addition of the verified Work Session " +
                    sessionRecord.sessionNumber +
                    " history entry with approved governance safeguards.",

                status:
                    "Proposed — Review Required"
            }
        );

        return {
            updateMode:
                "Append",

            appendedSection:
                section,

            governanceEnvelopeRetained:
                true,

            downstreamGovernanceDependency:
                false,

            workSessionHistorySnapshot: {
                sessionNumber:
                    String(
                        sessionRecord.sessionNumber
                    ),

                version:
                    sessionRecord.version,

                milestone:
                    sessionRecord.milestone,

                module:
                    sessionRecord.module,

                status:
                    sessionRecord.status,

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
            "TMS-OS WORK SESSION HISTORY DRAFT",
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
            "Appended Section: " +
            currentDraft.appendedSection.number +
            " — " +
            currentDraft.appendedSection.title
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

    window.TMSWorkSessionHistoryWriter =
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
            "Work Session History Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId:
            "work-session-history-writer",

        documentId:
            DOCUMENT_ID,

        writerVersion:
            ENGINE_VERSION,

        updateMode:
            REQUIRED_ACTION,

        order:
            10,

        generateDraft:
            generateDraft,

        formatDraftText:
            formatDraftText,

        getLastDraft:
            getLastDraft
    });

    console.log(
        "Work Session History Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
