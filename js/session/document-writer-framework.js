/*
TMS-OS / Two Marshalls Studios Operating System
Generic Document Writer Framework v1.2.0
File: js/session/document-writer-framework.js

Purpose:
Provide shared, review-only permanent-document draft services for document-specific
writers. This framework loads source documents, validates approved proposals,
preserves metadata, manages revision history, freezes returned drafts, and never
writes permanent files.

Version 1.2.0:
Adds backward-compatible support for both section-based governed documents and
collection-based governed documents. Existing writers continue to use sections[].
New writers may identify another primary collection, such as snapshots[], and may
provide a governed sourcePath outside pages/documents.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.2.0";
    const NO_CHANGE_ACTION = "No Change";
    const DEFAULT_COLLECTION_NAME = "sections";

    if (!window.TMSDocumentUpdateEngine || !window.TMSSessionContext) {
        console.error(
            "Generic Document Writer Framework could not initialize because its dependencies are unavailable."
        );
        return;
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (
            !value ||
            typeof value !== "object" ||
            Object.isFrozen(value)
        ) {
            return value;
        }

        Object.keys(value).forEach(function (key) {
            deepFreeze(value[key]);
        });

        return Object.freeze(value);
    }

    function getProjectRootUrl() {
        const path = window.location.pathname;
        const pageFolderIndex = path.lastIndexOf("/pages/");

        const projectRootPath =
            pageFolderIndex >= 0
                ? path.slice(0, pageFolderIndex + 1)
                : path.slice(0, path.lastIndexOf("/") + 1);

        return window.location.origin + projectRootPath;
    }

    function documentUrl(fileName) {
        return (
            getProjectRootUrl() +
            "pages/documents/" +
            fileName
        );
    }

    function sourceDocumentUrl(config) {
        if (
            config &&
            typeof config.sourcePath === "string" &&
            config.sourcePath.trim().length > 0
        ) {
            const normalizedPath =
                config.sourcePath
                    .trim()
                    .replace(/^\/+/, "");

            return (
                getProjectRootUrl() +
                normalizedPath
            );
        }

        return documentUrl(
            config.documentId + ".json"
        );
    }

    function normalizedText(entry) {
        if (typeof entry === "string") {
            return entry;
        }

        if (entry && typeof entry === "object") {
            return (
                entry.description ||
                entry.name ||
                entry.title ||
                entry.path ||
                JSON.stringify(entry)
            );
        }

        return String(entry);
    }

    function nextSectionNumber(documentData) {
        const numbers =
            (
                Array.isArray(documentData?.sections)
                    ? documentData.sections
                    : []
            ).map(function (section) {
                const parsed =
                    parseInt(section.number, 10);

                return Number.isFinite(parsed)
                    ? parsed
                    : 0;
            });

        return String(
            (
                numbers.length
                    ? Math.max.apply(null, numbers)
                    : 0
            ) + 1
        );
    }

    function getProposal(plan, documentId) {
        if (
            !plan ||
            !plan.accepted ||
            !Array.isArray(plan.proposals)
        ) {
            return null;
        }

        return (
            plan.proposals.find(
                function (item) {
                    return (
                        item.documentId ===
                        documentId
                    );
                }
            ) || null
        );
    }

    function getDocumentIdentity(sourceDocument) {
        if (
            sourceDocument &&
            typeof sourceDocument.id === "string" &&
            sourceDocument.id.trim().length > 0
        ) {
            return sourceDocument.id.trim();
        }

        if (
            sourceDocument &&
            typeof sourceDocument.documentId === "string" &&
            sourceDocument.documentId.trim().length > 0
        ) {
            return sourceDocument.documentId.trim();
        }

        return "";
    }

    function detectCollectionName(
        sourceDocument,
        configuredCollectionName
    ) {
        if (
            typeof configuredCollectionName === "string" &&
            configuredCollectionName.trim().length > 0
        ) {
            const requestedName =
                configuredCollectionName.trim();

            if (
                !Array.isArray(
                    sourceDocument?.[requestedName]
                )
            ) {
                throw new Error(
                    "The configured primary collection '" +
                    requestedName +
                    "' does not exist or is not an array."
                );
            }

            return requestedName;
        }

        if (
            Array.isArray(
                sourceDocument?.[DEFAULT_COLLECTION_NAME]
            )
        ) {
            return DEFAULT_COLLECTION_NAME;
        }

        if (
            Array.isArray(
                sourceDocument?.snapshots
            )
        ) {
            return "snapshots";
        }

        throw new Error(
            "The source document does not contain a supported primary collection."
        );
    }

    function getCollectionCount(
        documentData,
        collectionName
    ) {
        return Array.isArray(
            documentData?.[collectionName]
        )
            ? documentData[collectionName].length
            : 0;
    }

    function createDocumentMetrics(
        sourceDocument,
        proposedDocument,
        collectionName
    ) {
        const sourceItemCount =
            getCollectionCount(
                sourceDocument,
                collectionName
            );

        const proposedItemCount =
            getCollectionCount(
                proposedDocument,
                collectionName
            );

        return {
            sourceCollectionName:
                collectionName,

            proposedCollectionName:
                collectionName,

            sourceItemCount:
                sourceItemCount,

            proposedItemCount:
                proposedItemCount,

            sourceSectionCount:
                collectionName === "sections"
                    ? sourceItemCount
                    : 0,

            proposedSectionCount:
                collectionName === "sections"
                    ? proposedItemCount
                    : 0
        };
    }

    async function loadSourceDocument(config) {
        const response = await fetch(
            sourceDocumentUrl(config),
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "HTTP " +
                response.status +
                " while loading " +
                config.documentId +
                "."
            );
        }

        const sourceDocument =
            await response.json();

        const sourceDocumentId =
            getDocumentIdentity(
                sourceDocument
            );

        if (
            !sourceDocument ||
            sourceDocumentId !==
                config.documentId
        ) {
            throw new Error(
                "The source document identity does not match the expected governed document."
            );
        }

        const collectionName =
            detectCollectionName(
                sourceDocument,
                config.collectionName
            );

        return {
            sourceDocument:
                sourceDocument,

            collectionName:
                collectionName,

            sourceUrl:
                sourceDocumentUrl(config)
        };
    }

    function appendRevisionHistory(
        proposedDocument,
        revisionEntry
    ) {
        proposedDocument.revisionHistory =
            Array.isArray(
                proposedDocument.revisionHistory
            )
                ? proposedDocument.revisionHistory
                : [];

        proposedDocument.revisionHistory.push(
            clone(revisionEntry)
        );
    }

    function rejectedDraft(config, message) {
        return deepFreeze({
            draftType:
                "TMS-OS Permanent Document Draft",

            frameworkVersion:
                ENGINE_VERSION,

            writerVersion:
                config.writerVersion,

            documentId:
                config.documentId,

            generatedAt:
                new Date().toISOString(),

            accepted:
                false,

            message:
                message,

            sourceLoaded:
                false,

            sourceUrl:
                null,

            proposalAction:
                null,

            requiredAction:
                config.requiredAction,

            transformExecuted:
                false,

            documentChanged:
                false,

            permanentWriteRequired:
                false,

            sourceCollectionName:
                null,

            proposedCollectionName:
                null,

            sourceItemCount:
                0,

            proposedItemCount:
                0,

            sourceSectionCount:
                0,

            proposedSectionCount:
                0,

            reviewRequired:
                true,

            permanentWriteExecuted:
                false,

            proposedDocument:
                null
        });
    }

    function createNoChangeDraft(
        config,
        proposal,
        sourceDocument,
        collectionName,
        sourceUrl
    ) {
        const proposedDocument =
            clone(sourceDocument);

        const metrics =
            createDocumentMetrics(
                sourceDocument,
                proposedDocument,
                collectionName
            );

        return deepFreeze(
            Object.assign(
                {
                    draftType:
                        "TMS-OS Permanent Document Draft",

                    frameworkVersion:
                        ENGINE_VERSION,

                    writerVersion:
                        config.writerVersion,

                    documentId:
                        config.documentId,

                    generatedAt:
                        new Date().toISOString(),

                    accepted:
                        true,

                    message:
                        "Approved No Change proposal validated. " +
                        "The unchanged source document was retained as the reviewable proposed document.",

                    sourceLoaded:
                        true,

                    sourceUrl:
                        sourceUrl,

                    proposalAction:
                        NO_CHANGE_ACTION,

                    requiredAction:
                        config.requiredAction,

                    updateMode:
                        NO_CHANGE_ACTION,

                    transformExecuted:
                        false,

                    documentChanged:
                        false,

                    permanentWriteRequired:
                        false,

                    proposedDocument:
                        proposedDocument,

                    reviewRequired:
                        true,

                    reviewChoices: [
                        "Approve Draft",
                        "Revise Session",
                        "Cancel Draft"
                    ],

                    permanentWriteExecuted:
                        false
                },
                metrics
            )
        );
    }

    async function createDraft(config) {
        if (
            !config ||
            typeof config !== "object"
        ) {
            throw new Error(
                "A document writer configuration object is required."
            );
        }

        if (
            !config.documentId ||
            !config.requiredAction ||
            typeof config.transform !==
                "function"
        ) {
            throw new Error(
                "Document writer configuration requires documentId, requiredAction, and transform."
            );
        }

        const plan =
            window.TMSDocumentUpdateEngine
                .generatePlan();

        const proposal =
            getProposal(
                plan,
                config.documentId
            );

        if (!proposal) {
            return rejectedDraft(
                config,
                "An approved proposal for " +
                config.documentId +
                " is required before a draft can be generated."
            );
        }

        try {
            const sourceResult =
                await loadSourceDocument(
                    config
                );

            const sourceDocument =
                sourceResult.sourceDocument;

            const collectionName =
                sourceResult.collectionName;

            const sourceUrl =
                sourceResult.sourceUrl;

            if (
                proposal.action ===
                NO_CHANGE_ACTION
            ) {
                return createNoChangeDraft(
                    config,
                    proposal,
                    sourceDocument,
                    collectionName,
                    sourceUrl
                );
            }

            if (
                proposal.action !==
                    config.requiredAction ||
                !proposal.payload
            ) {
                return rejectedDraft(
                    config,
                    "An approved " +
                    config.documentId +
                    " " +
                    config.requiredAction +
                    " proposal is required before a draft can be generated."
                );
            }

            const proposedDocument =
                clone(sourceDocument);

            const transformResult =
                await config.transform({
                    proposal:
                        clone(proposal),

                    sourceDocument:
                        clone(sourceDocument),

                    proposedDocument:
                        proposedDocument,

                    collectionName:
                        collectionName,

                    helpers:
                        Object.freeze({
                            clone:
                                clone,

                            normalizedText:
                                normalizedText,

                            nextSectionNumber:
                                nextSectionNumber,

                            appendRevisionHistory:
                                appendRevisionHistory,

                            getCollectionCount:
                                getCollectionCount
                        })
                });

            const generatedAt =
                new Date().toISOString();

            const resultDetails =
                transformResult &&
                typeof transformResult ===
                    "object"
                    ? transformResult
                    : {};

            const metrics =
                createDocumentMetrics(
                    sourceDocument,
                    proposedDocument,
                    collectionName
                );

            const draft =
                Object.assign(
                    {
                        draftType:
                            "TMS-OS Permanent Document Draft",

                        frameworkVersion:
                            ENGINE_VERSION,

                        writerVersion:
                            config.writerVersion,

                        documentId:
                            config.documentId,

                        generatedAt:
                            generatedAt,

                        accepted:
                            true,

                        message:
                            "Reviewable replacement-document draft generated. " +
                            "No permanent file was changed.",

                        sourceLoaded:
                            true,

                        sourceUrl:
                            sourceUrl,

                        proposalAction:
                            proposal.action,

                        requiredAction:
                            config.requiredAction,

                        transformExecuted:
                            true,

                        documentChanged:
                            true,

                        permanentWriteRequired:
                            true,

                        proposedDocument:
                            proposedDocument,

                        reviewRequired:
                            true,

                        reviewChoices: [
                            "Approve Draft",
                            "Revise Session",
                            "Cancel Draft"
                        ],

                        permanentWriteExecuted:
                            false
                    },
                    metrics,
                    resultDetails
                );

            return deepFreeze(
                clone(draft)
            );
        } catch (error) {
            return rejectedDraft(
                config,
                error && error.message
                    ? error.message
                    : "Draft generation failed for an unknown reason."
            );
        }
    }

    window.TMSDocumentWriterFramework =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,

            createDraft:
                createDraft,

            clone:
                clone,

            deepFreeze:
                deepFreeze,

            normalizedText:
                normalizedText,

            nextSectionNumber:
                nextSectionNumber,

            getCollectionCount:
                getCollectionCount,

            detectCollectionName:
                detectCollectionName
        });

    console.log(
        "Generic Document Writer Framework v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        window.TMSSessionContext
            .getSnapshot()
            .sessionNumber +
        "."
    );
}());
