/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 111 — Documentation State Writer v2.0.0
File: js/session/documentation-state-writer.js

Purpose:
Generate a review-only DOC-STATE-001 replacement-document draft through the
Generic Document Writer Framework. Version 2.0.0 consumes only the enriched
DOC-STATE-001 proposal payload, removes legacy hard-coded documentation values,
and preserves the one-directional permanent-document governance architecture.

It never writes a permanent file.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "2.0.0";
    const DOCUMENT_ID = "DOC-STATE-001";
    const REQUIRED_ACTION = "Replace";

    let lastDraft = null;

    if (
        !window.TMSDocumentWriterFramework ||
        !window.TMSSessionContext
    ) {
        console.error(
            "Documentation State Writer could not initialize because its dependencies are unavailable."
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
            Array.isArray(paragraphs)
                ? paragraphs.slice()
                : [];

        if (
            Array.isArray(items) &&
            items.length
        ) {
            section.items =
                items.slice();
        } else {
            delete section.items;
        }

        delete section.tables;
        delete section.records;

        return true;
    }

    function normalizedPayload(payload) {
        return {
            lastApprovedSession:
                String(
                    payload.lastApprovedSession ||
                    "Unavailable"
                ),

            currentVersion:
                payload.currentVersion ||
                "Unavailable",

            currentMilestone:
                payload.currentMilestone ||
                "Unavailable",

            currentModule:
                payload.currentModule ||
                "Unavailable",

            sessionStatus:
                payload.sessionStatus ||
                "Unavailable",

            documentationUpdates:
                Array.isArray(
                    payload.documentationUpdates
                )
                    ? payload.documentationUpdates.slice()
                    : [],

            documentationUpdateCount:
                Number(
                    payload.documentationUpdateCount
                ) || 0,

            registeredWriterCount:
                Number(
                    payload.registeredWriterCount
                ) || 0,

            registeredDocuments:
                Array.isArray(
                    payload.registeredDocuments
                )
                    ? payload.registeredDocuments.slice()
                    : [],

            connectedPermanentDocuments:
                Number(
                    payload.connectedPermanentDocuments
                ) || 0,

            governanceMode:
                payload.governanceMode ||
                "Disabled",

            documentationMode:
                payload.documentationMode ||
                "Review Only",

            executionMode:
                payload.executionMode ||
                "Disabled",

            reviewStatus:
                payload.reviewStatus ||
                "Closure Approved",

            validationStatus:
                payload.validationStatus ||
                "Validation Status Unavailable",

            failedTestCount:
                Number(
                    payload.failedTestCount
                ) || 0,

            currentPriority:
                payload.currentPriority ||
                "Maintain review-only permanent-document proposals.",

            nextControlledAction:
                payload.nextControlledAction ||
                "Continue from the approved work-session checkpoint.",

            governanceSource:
                payload.governanceSource ||
                "Approved Session Review Package",

            permanentWriteStatus:
                payload.permanentWriteStatus ||
                "Not Executed",

            rollbackStatus:
                payload.rollbackStatus ||
                "Not Executed",

            restoreStatus:
                payload.restoreStatus ||
                "Not Executed",

            executionLockStatus:
                payload.executionLockStatus ||
                "Locked",

            humanApprovalGateStatus:
                payload.humanApprovalGateStatus ||
                "Preserved",

            downstreamGovernanceDependency:
                payload.downstreamGovernanceDependency === true
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

        const populationStatus =
            findSection(
                context.proposedDocument,
                "6"
            );

        if (
            replaceSectionContent(
                populationStatus,
                [
                    "At the Work Session " +
                        sessionNumber +
                        " checkpoint, the structured Documentation Operating System remains stable and can generate review-only permanent-document drafts through the approved proposal architecture.",

                    "This proposed documentation-state replacement records the current approved documentation population and governance safeguards without changing the live DOC-STATE-001.json file."
                ],
                [
                    "Connected permanent documents: " +
                        payload.connectedPermanentDocuments,

                    "Registered permanent-document writers: " +
                        payload.registeredWriterCount,

                    "Registered draft targets: " +
                        payload.registeredDocuments.join(", "),

                    "Latest approved work session: WS-" +
                        sessionNumber,

                    "Current version: " +
                        payload.currentVersion,

                    "Current milestone: " +
                        payload.currentMilestone,

                    "Current module: " +
                        payload.currentModule,

                    "Governance mode: " +
                        payload.governanceMode,

                    "Documentation mode: " +
                        payload.documentationMode,

                    "Execution mode: " +
                        payload.executionMode,

                    "Validation status: " +
                        payload.validationStatus,

                    "Failed test count: " +
                        payload.failedTestCount,

                    "Permanent write status: " +
                        payload.permanentWriteStatus,

                    "Rollback status: " +
                        payload.rollbackStatus,

                    "Restore status: " +
                        payload.restoreStatus
                ]
            )
        ) {
            updatedSections.push(
                "6 — Current Population Status"
            );
        }

        const currentPriority =
            findSection(
                context.proposedDocument,
                "11"
            );

        if (
            replaceSectionContent(
                currentPriority,
                [
                    payload.currentPriority,

                    "The documentation system must continue to preserve the approved one-directional flow from Session Review Package to Document Update Engine to registered document writers before any downstream execution, lifecycle, state, or workflow component is evaluated.",

                    "Every writer must preserve unaffected source content, remain review-only, and keep permanent writes disabled until a separate execution-enabled milestone is explicitly approved."
                ]
            )
        ) {
            updatedSections.push(
                "11 — Current Priority"
            );
        }

        const nextAction =
            findSection(
                context.proposedDocument,
                "12"
            );

        if (
            replaceSectionContent(
                nextAction,
                [
                    "Next controlled documentation action: " +
                        payload.nextControlledAction,

                    "The approved Work Session " +
                        sessionNumber +
                        " checkpoint must remain the source of truth for this proposal.",

                    "Execution Lock Status: " +
                        payload.executionLockStatus +
                        ". Human Approval Gate: " +
                        payload.humanApprovalGateStatus +
                        "."
                ]
            )
        ) {
            updatedSections.push(
                "12 — Next Controlled Documentation Action"
            );
        }

        const completionChecklist =
            findSection(
                context.proposedDocument,
                "13"
            );

        if (
            replaceSectionContent(
                completionChecklist,
                [],
                [
                    "DOC-STATE-001 source document loaded and validated",
                    "Document identity and unaffected sections preserved",
                    "Replace-mode draft generated through the Generic Document Writer Framework",
                    "Enriched DOC-STATE-001 proposal payload consumed",
                    "Current population and governance state refreshed",
                    "Registered writer count recorded from the approved proposal",
                    "Registered document targets recorded from the approved proposal",
                    "Latest approved work session recorded",
                    "Documentation update count recorded: " +
                        payload.documentationUpdateCount,
                    "Revision history proposal added",
                    "Live DOC-STATE-001.json file unchanged",
                    "Human Approval Gate preserved",
                    "No downstream governance dependency introduced",
                    "Permanent write, rollback, and restore remained unexecuted"
                ]
            )
        ) {
            updatedSections.push(
                "13 — Completion Checklist"
            );
        }

        const permanentStatement =
            findSection(
                context.proposedDocument,
                "14"
            );

        if (
            replaceSectionContent(
                permanentStatement,
                [
                    "The Two Marshalls Studios documentation system supports controlled, review-only generation of permanent-document drafts from approved Session Review Package data.",

                    "The Documentation State Writer preserves the existing permanent record, updates only designated current-state sections, and consumes no downstream lifecycle, state, or workflow artifact.",

                    "Governance Mode: " +
                        payload.governanceMode +
                        ". Documentation Mode: " +
                        payload.documentationMode +
                        ". Execution Mode: " +
                        payload.executionMode +
                        ".",

                    "Permanent writes, rollback, and restore remain unexecuted. Human approval and a separately approved execution-enabled architecture remain mandatory before any proposed documentation becomes permanent."
                ]
            )
        ) {
            updatedSections.push(
                "14 — Permanent Statement"
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
                    "Proposed replacement of documentation population, governance status, priority, next action, completion checklist, and permanent-state sections for Work Session " +
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

            documentationStateSnapshot: {
                lastApprovedSession:
                    sessionNumber,

                currentVersion:
                    payload.currentVersion,

                currentMilestone:
                    payload.currentMilestone,

                currentModule:
                    payload.currentModule,

                sessionStatus:
                    payload.sessionStatus,

                connectedPermanentDocuments:
                    payload.connectedPermanentDocuments,

                registeredWriterCount:
                    payload.registeredWriterCount,

                registeredDocuments:
                    payload.registeredDocuments,

                documentationUpdateCount:
                    payload.documentationUpdateCount,

                governanceMode:
                    payload.governanceMode,

                documentationMode:
                    payload.documentationMode,

                executionMode:
                    payload.executionMode,

                validationStatus:
                    payload.validationStatus,

                permanentWriteStatus:
                    payload.permanentWriteStatus,

                rollbackStatus:
                    payload.rollbackStatus,

                restoreStatus:
                    payload.restoreStatus,

                executionLockStatus:
                    payload.executionLockStatus,

                humanApprovalGateStatus:
                    payload.humanApprovalGateStatus
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
            "TMS-OS DOCUMENTATION STATE DRAFT",
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
            "Registered Writers: " +
            currentDraft.documentationStateSnapshot
                .registeredWriterCount
        );

        lines.push(
            "Connected Permanent Documents: " +
            currentDraft.documentationStateSnapshot
                .connectedPermanentDocuments
        );

        lines.push(
            "Documentation Updates: " +
            currentDraft.documentationStateSnapshot
                .documentationUpdateCount
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

    window.TMSDocumentationStateWriter =
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
            "Documentation State Writer could not register because the Document Writer Registry is unavailable."
        );
        return;
    }

    window.TMSDocumentWriterRegistry.register({
        writerId:
            "documentation-state-writer",

        documentId:
            DOCUMENT_ID,

        writerVersion:
            ENGINE_VERSION,

        updateMode:
            REQUIRED_ACTION,

        order:
            30,

        generateDraft:
            generateDraft,

        formatDraftText:
            formatDraftText,

        getLastDraft:
            getLastDraft
    });

    console.log(
        "Documentation State Writer v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
