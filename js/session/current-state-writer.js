/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 110 — Current State Writer v2.0.1
STATE-001 Section Mapping Correction
File: js/session/current-state-writer.js

Purpose:
Generate a review-only STATE-001 replacement-document draft through the Generic
Document Writer Framework. Version 2.0.1 corrects the active STATE-001 section
mapping so Immediate Next Action is written to section 16 and Current State
Summary is written to section 17.

The writer consumes only the approved STATE-001 proposal payload and has no
dependency on downstream lifecycle, state, or workflow components. It never
writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.1";
    const DOCUMENT_ID = "STATE-001";
    const REQUIRED_ACTION = "Replace";

    let lastDraft = null;

    if (
        !window.TMSDocumentWriterFramework ||
        !window.TMSSessionContext
    ) {
        console.error(
            "Current State Writer could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function findSection(documentData, number) {
        return (
            documentData.sections || []
        ).find(function (section) {
            return (
                String(section.number) ===
                String(number)
            );
        }) || null;
    }

    function replaceSectionContent(
        section,
        paragraphs,
        items
    ) {
        if (!section) {
            return false;
        }

        section.paragraphs =
            paragraphs.slice();

        if (
            Array.isArray(items) &&
            items.length
        ) {
            section.items =
                items.slice();
        } else {
            delete section.items;
        }

        return true;
    }

    function normalizedPayload(payload) {
        return {
            currentVersion:
                payload.currentVersion ||
                "Unavailable",

            currentMilestone:
                payload.currentMilestone ||
                "Unavailable",

            currentModule:
                payload.currentModule ||
                "Unavailable",

            lastApprovedSession:
                String(
                    payload.lastApprovedSession ||
                    "Unavailable"
                ),

            sessionStatus:
                payload.sessionStatus ||
                "Unavailable",

            governanceMode:
                payload.governanceMode ||
                "Disabled",

            documentationMode:
                payload.documentationMode ||
                "Review Only",

            executionMode:
                payload.executionMode ||
                "Disabled",

            validationStatus:
                payload.validationStatus ||
                "Validation Status Unavailable",

            readyForReview:
                payload.readyForReview === true,

            failedTestCount:
                Number(
                    payload.failedTestCount
                ) || 0,

            reviewPackageType:
                payload.reviewPackageType ||
                "Unavailable",

            reviewGeneratedAt:
                payload.reviewGeneratedAt ||
                "Unavailable",

            governanceSource:
                payload.governanceSource ||
                "Approved Session Review Package",

            executionLockStatus:
                payload.executionLockStatus ||
                "Locked",

            permanentWriteStatus:
                payload.permanentWriteStatus ||
                "Not Executed",

            rollbackStatus:
                payload.rollbackStatus ||
                "Not Executed",

            restoreStatus:
                payload.restoreStatus ||
                "Not Executed"
        };
    }

    async function transform(context) {
        const rawPayload =
            context.helpers.clone(
                context.proposal.payload
            );

        const payload =
            normalizedPayload(rawPayload);

        const sessionNumber =
            payload.lastApprovedSession;

        const updatedSections = [];

        const currentSession =
            findSection(
                context.proposedDocument,
                "3"
            );

        if (
            replaceSectionContent(
                currentSession,
                [
                    "Current Work Session: WS-" +
                        sessionNumber,

                    "Current Version: " +
                        payload.currentVersion,

                    "Current Module: " +
                        payload.currentModule,

                    "Session Status: " +
                        payload.sessionStatus,

                    "Validation Status: " +
                        payload.validationStatus,

                    "Failed Test Count: " +
                        payload.failedTestCount,

                    "The current verified state reflects the approved Work Session " +
                        sessionNumber +
                        " Session Context and remains a review-only draft until a later controlled execution step is separately approved."
                ]
            )
        ) {
            updatedSections.push(
                "3 — Approved Current Work Session"
            );
        }

        const milestoneState =
            findSection(
                context.proposedDocument,
                "4"
            );

        if (
            replaceSectionContent(
                milestoneState,
                [
                    "Current Active Milestone: " +
                        payload.currentMilestone,

                    "Current Active Module: " +
                        payload.currentModule,

                    "Last Approved Work Session: WS-" +
                        sessionNumber,

                    "Governance Mode: " +
                        payload.governanceMode,

                    "Documentation Mode: " +
                        payload.documentationMode,

                    "Execution Mode: " +
                        payload.executionMode,

                    "The current-state draft records the approved session checkpoint without changing historical sections or executing a permanent write."
                ]
            )
        ) {
            updatedSections.push(
                "4 — Current Milestone State"
            );
        }

        const nextAction =
            findSection(
                context.proposedDocument,
                "16"
            );

        if (
            replaceSectionContent(
                nextAction,
                [
                    "Next Action: Continue the " +
                        payload.currentMilestone +
                        " milestone from the approved Work Session " +
                        sessionNumber +
                        " checkpoint.",

                    "The next implementation step should begin from the stable " +
                        payload.currentModule +
                        " state recorded by this proposed replacement document.",

                    "Execution Lock Status: " +
                        payload.executionLockStatus +
                        ". Any execution-enabled work requires a separate approved module."
                ]
            )
        ) {
            updatedSections.push(
                "16 — Immediate Next Action"
            );
        }

        const stateSummary =
            findSection(
                context.proposedDocument,
                "17"
            );

        if (
            replaceSectionContent(
                stateSummary,
                [
                    "TMS-OS is currently operating at version " +
                        payload.currentVersion +
                        ".",

                    "The active milestone is " +
                        payload.currentMilestone +
                        ".",

                    "The active module is " +
                        payload.currentModule +
                        ".",

                    "The latest approved work-session checkpoint is WS-" +
                        sessionNumber +
                        ".",

                    "Governance Source: " +
                        payload.governanceSource +
                        ".",

                    "Governance Mode: " +
                        payload.governanceMode +
                        ".",

                    "Documentation Mode: " +
                        payload.documentationMode +
                        ".",

                    "Execution Mode: " +
                        payload.executionMode +
                        ".",

                    "Permanent Write Status: " +
                        payload.permanentWriteStatus +
                        ".",

                    "Rollback Status: " +
                        payload.rollbackStatus +
                        ".",

                    "Restore Status: " +
                        payload.restoreStatus +
                        ".",

                    "This proposed STATE-001 replacement preserves unaffected historical and architectural content and performs no permanent file write."
                ]
            )
        ) {
            updatedSections.push(
                "17 — Current State Summary"
            );
        }

        context.proposedDocument.lastUpdated =
            "Work Session " +
            sessionNumber;

        context.helpers.appendRevisionHistory(
            context.proposedDocument,
            {
                version:
                    context.proposedDocument.version,

                date:
                    "Work Session " +
                    sessionNumber,

                summary:
                    "Proposed replacement of the current session, milestone, immediate-next-action, current-state-summary, and approved governance-safeguard snapshots for Work Session " +
                    sessionNumber +
                    ".",

                status:
                    "Proposed — Review Required"
            }
        );

        return {
            updateMode:
                "Replace",

            updatedSections:
                updatedSections,

            preservedSectionCount:
                context.sourceDocument.sections.length -
                updatedSections.length,

            governanceMetadataRetained:
                true,

            downstreamGovernanceDependency:
                false,

            sectionMappingValidated:
                updatedSections.length === 4,

            currentStateSnapshot: {
                version:
                    payload.currentVersion,

                milestone:
                    payload.currentMilestone,

                module:
                    payload.currentModule,

                lastApprovedSession:
                    sessionNumber,

                status:
                    payload.sessionStatus,

                governanceMode:
                    payload.governanceMode,

                documentationMode:
                    payload.documentationMode,

                executionMode:
                    payload.executionMode,

                validationStatus:
                    payload.validationStatus,

                readyForReview:
                    payload.readyForReview,

                failedTestCount:
                    payload.failedTestCount,

                executionLockStatus:
                    payload.executionLockStatus,

                permanentWriteStatus:
                    payload.permanentWriteStatus,

                rollbackStatus:
                    payload.rollbackStatus,

                restoreStatus:
                    payload.restoreStatus
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
            "TMS-OS CURRENT STATE DRAFT",
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
            "Updated Sections: " +
            currentDraft.updatedSections.join(" | ")
        );

        lines.push(
            "Preserved Sections: " +
            currentDraft.preservedSectionCount
        );

        lines.push(
            "Section Mapping Validated: " +
            (
                currentDraft.sectionMappingValidated
                    ? "YES"
                    : "NO"
            )
        );

        lines.push(
            "Governance Metadata Retained: " +
            (
                currentDraft.governanceMetadataRetained
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

    window.TMSCurrentStateWriter =
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
            "Current State Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId:
            "current-state-writer",

        documentId:
            DOCUMENT_ID,

        writerVersion:
            ENGINE_VERSION,

        updateMode:
            REQUIRED_ACTION,

        order:
            20,

        generateDraft:
            generateDraft,

        formatDraftText:
            formatDraftText,

        getLastDraft:
            getLastDraft
    });

    console.log(
        "Current State Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
