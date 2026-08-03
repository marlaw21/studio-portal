/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 114 — Enriched MILE-HIST-001 Proposal Contract
File: js/session/document-update-engine.js

Purpose:
Transform an approved Session Context into a read-only, reviewable Document
Update Plan for six governed documents. Version 1.6.0 preserves the enriched WS-HIST-001, STATE-001, DOC-STATE-001,
and DEC-LOG-001 proposal contracts and adds an enriched MILE-HIST-001 proposal
envelope based only on the approved session review package.

No downstream lifecycle, state, or workflow component is consumed.
No permanent files are written.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.6.0";
    const REQUIRED_STATUS = "Closure Approved";
    const SNAPSHOT_HISTORY_DOCUMENT_ID =
        "WORKSPACE-SNAPSHOT-HISTORY-001";

    if (
        !window.TMSSessionContext ||
        !window.TMSSessionPreparer ||
        !window.TMSSessionCloser
    ) {
        console.error(
            "Document Update Engine could not initialize because its session dependencies are unavailable."
        );
        return;
    }

    const context = window.TMSSessionContext;
    const preparer = window.TMSSessionPreparer;
    let lastPlan = null;

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

    function hasEntries(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function proposal(documentId, action, reason, payload, required) {
        return {
            documentId: documentId,
            action: action,
            reason: reason,
            required: required !== false,
            payload: payload || null,
            writerStatus: "Not Implemented",
            permanentWriteExecuted: false
        };
    }

    function buildSessionRecord(review) {
        return {
            sessionNumber: review.session.sessionNumber,
            version: review.session.version,
            milestone: review.session.milestone,
            module: review.session.module,
            status: review.session.status,
            startedAt: review.session.startedAt,
            updatedAt: review.session.updatedAt,
            objectives: review.objectives,
            completedTasks: review.completedTasks,
            deferredTasks: review.deferredTasks,
            files: review.files,
            tests: review.tests,
            bugs: review.bugs,
            decisions: review.decisions,
            risks: review.risks,
            technicalDebt: review.technicalDebt,
            enhancementIdeas: review.enhancementIdeas,
            documentationUpdates: review.documentationUpdates
        };
    }

    function buildWorkSessionHistoryPayload(review) {
        const validation =
            review && review.validation
                ? review.validation
                : {};

        const failedTestCount =
            Number(validation.failedTestCount) || 0;

        return {
            sessionRecord:
                buildSessionRecord(review),

            governanceEnvelope: {
                governanceMode:
                    "Disabled",

                documentationMode:
                    "Review Only",

                executionMode:
                    "Disabled",

                reviewPackageType:
                    review.packageType ||
                    "TMS-OS Prepare Session Review Package",

                reviewGeneratedAt:
                    review.generatedAt || null,

                validationStatus:
                    validation.readyForReview === true &&
                    failedTestCount === 0
                        ? "Validated — No Failed Tests"
                        : "Validation Review Required",

                failedTestCount:
                    failedTestCount,

                approvalStatus:
                    review.session.status,

                humanApprovalRecorded:
                    true,

                permanentWriteStatus:
                    "Not Executed",

                rollbackStatus:
                    "Not Executed",

                restoreStatus:
                    "Not Executed",

                executionLockStatus:
                    "Locked",

                downstreamGovernanceDependency:
                    false
            }
        };
    }

    function buildDecisionLogPayload(review) {
        const validation = review && review.validation ? review.validation : {};
        const failedTestCount = Number(validation.failedTestCount) || 0;

        return {
            decisions: Array.isArray(review.decisions) ? review.decisions : [],
            sourceSession: {
                sessionNumber: review.session.sessionNumber,
                version: review.session.version,
                milestone: review.session.milestone,
                module: review.session.module,
                status: review.session.status
            },
            governanceEnvelope: {
                governanceMode: "Disabled",
                documentationMode: "Review Only",
                executionMode: "Disabled",
                reviewPackageType: review.packageType || "TMS-OS Prepare Session Review Package",
                reviewGeneratedAt: review.generatedAt || null,
                validationStatus:
                    validation.readyForReview === true && failedTestCount === 0
                        ? "Validated — No Failed Tests"
                        : "Validation Review Required",
                failedTestCount: failedTestCount,
                approvalStatus: review.session.status,
                humanApprovalRecorded: true,
                permanentWriteStatus: "Not Executed",
                rollbackStatus: "Not Executed",
                restoreStatus: "Not Executed",
                executionLockStatus: "Locked",
                downstreamGovernanceDependency: false
            }
        };
    }

    function buildMilestoneHistoryPayload(review) {
        const validation =
            review && review.validation
                ? review.validation
                : {};

        const failedTestCount =
            Number(validation.failedTestCount) || 0;

        return {
            milestone:
                review.session.milestone,

            module:
                review.session.module,

            sessionNumber:
                review.session.sessionNumber,

            completedTasks:
                Array.isArray(review.completedTasks)
                    ? review.completedTasks
                    : [],

            sourceSession: {
                sessionNumber:
                    review.session.sessionNumber,

                version:
                    review.session.version,

                milestone:
                    review.session.milestone,

                module:
                    review.session.module,

                status:
                    review.session.status
            },

            governanceEnvelope: {
                governanceMode:
                    "Disabled",

                documentationMode:
                    "Review Only",

                executionMode:
                    "Disabled",

                reviewPackageType:
                    review.packageType ||
                    "TMS-OS Prepare Session Review Package",

                reviewGeneratedAt:
                    review.generatedAt || null,

                validationStatus:
                    validation.readyForReview === true &&
                    failedTestCount === 0
                        ? "Validated — No Failed Tests"
                        : "Validation Review Required",

                failedTestCount:
                    failedTestCount,

                approvalStatus:
                    review.session.status,

                humanApprovalRecorded:
                    true,

                milestoneCompletionDeclared:
                    false,

                permanentWriteStatus:
                    "Not Executed",

                rollbackStatus:
                    "Not Executed",

                restoreStatus:
                    "Not Executed",

                executionLockStatus:
                    "Locked",

                downstreamGovernanceDependency:
                    false
            }
        };
    }

    function buildCurrentStatePayload(review) {
        const validation =
            review && review.validation
                ? review.validation
                : {};

        const failedTestCount =
            Number(validation.failedTestCount) || 0;

        const readyForReview =
            validation.readyForReview === true;

        return {
            currentVersion:
                review.session.version,

            currentMilestone:
                review.session.milestone,

            currentModule:
                review.session.module,

            lastApprovedSession:
                review.session.sessionNumber,

            sessionStatus:
                review.session.status,

            governanceMode:
                "Disabled",

            documentationMode:
                "Review Only",

            executionMode:
                "Disabled",

            validationStatus:
                readyForReview &&
                failedTestCount === 0
                    ? "Validated — No Failed Tests"
                    : "Validation Review Required",

            readyForReview:
                readyForReview,

            failedTestCount:
                failedTestCount,

            reviewPackageType:
                review.packageType ||
                "TMS-OS Prepare Session Review Package",

            reviewGeneratedAt:
                review.generatedAt || null,

            governanceSource:
                "Approved Session Review Package",

            executionLockStatus:
                "Locked",

            permanentWriteStatus:
                "Not Executed",

            rollbackStatus:
                "Not Executed",

            restoreStatus:
                "Not Executed"
        };
    }

    function buildDocumentationStatePayload(review) {
        const validation =
            review && review.validation
                ? review.validation
                : {};

        const failedTestCount =
            Number(validation.failedTestCount) || 0;

        const documentationUpdates =
            Array.isArray(review.documentationUpdates)
                ? review.documentationUpdates
                : [];

        const registeredWriters =
            window.TMSDocumentWriterRegistry &&
            typeof window.TMSDocumentWriterRegistry
                .getRegisteredWriters === "function"
                ? window.TMSDocumentWriterRegistry
                    .getRegisteredWriters()
                : [];

        const registeredDocuments =
            registeredWriters.map(function (writer) {
                return writer.documentId;
            });

        return {
            lastApprovedSession:
                review.session.sessionNumber,

            currentVersion:
                review.session.version,

            currentMilestone:
                review.session.milestone,

            currentModule:
                review.session.module,

            sessionStatus:
                review.session.status,

            documentationUpdates:
                documentationUpdates,

            documentationUpdateCount:
                documentationUpdates.length,

            registeredWriterCount:
                registeredWriters.length,

            registeredDocuments:
                registeredDocuments,

            connectedPermanentDocuments:
                registeredDocuments.length,

            governanceMode:
                "Disabled",

            documentationMode:
                "Review Only",

            executionMode:
                "Disabled",

            reviewStatus:
                "Closure Approved",

            validationStatus:
                validation.readyForReview === true &&
                failedTestCount === 0
                    ? "Validated — No Failed Tests"
                    : "Validation Review Required",

            failedTestCount:
                failedTestCount,

            currentPriority:
                "Maintain complete, review-only permanent-document proposals through the approved one-directional governance pipeline.",

            nextControlledAction:
                "Continue the Workspace Management System milestone from the approved Work Session " +
                review.session.sessionNumber +
                " checkpoint without enabling permanent file execution.",

            governanceSource:
                "Approved Session Review Package",

            permanentWriteStatus:
                "Not Executed",

            rollbackStatus:
                "Not Executed",

            restoreStatus:
                "Not Executed",

            executionLockStatus:
                "Locked",

            humanApprovalGateStatus:
                "Preserved",

            downstreamGovernanceDependency:
                false
        };
    }

    function getSnapshotHistoryProposal() {
        const manager =
            window.TMSWorkspaceSnapshotHistoryManager;

        if (
            !manager ||
            typeof manager.getLatestSnapshotRecord !==
                "function" ||
            typeof manager.getGovernedHistoryDocument !==
                "function"
        ) {
            return proposal(
                SNAPSHOT_HISTORY_DOCUMENT_ID,
                "No Change",
                "Workspace Snapshot History Manager is unavailable, so no governed snapshot-history proposal can be generated.",
                null,
                false
            );
        }

        const latestRecord =
            manager.getLatestSnapshotRecord();

        if (!latestRecord) {
            return proposal(
                SNAPSHOT_HISTORY_DOCUMENT_ID,
                "No Change",
                "No runtime workspace snapshot record is available for permanent history evaluation.",
                null,
                false
            );
        }

        const governedHistory =
            manager.getGovernedHistoryDocument();

        const governedRecords =
            Array.isArray(governedHistory?.snapshots)
                ? governedHistory.snapshots
                : [];

        const duplicateExists =
            governedRecords.some(function (record) {
                return (
                    record?.snapshotId ===
                        latestRecord.snapshotId ||
                    record?.documentId ===
                        latestRecord.documentId
                );
            });

        if (duplicateExists) {
            return proposal(
                SNAPSHOT_HISTORY_DOCUMENT_ID,
                "No Change",
                "The latest runtime workspace snapshot is already present in the governed snapshot history.",
                null,
                false
            );
        }

        if (
            latestRecord.sourceSnapshot ||
            latestRecord.sourceSnapshotEmbedded !==
                false
        ) {
            return proposal(
                SNAPSHOT_HISTORY_DOCUMENT_ID,
                "No Change",
                "The latest runtime workspace snapshot record is not a validated compact catalog entry.",
                null,
                false
            );
        }

        return proposal(
            SNAPSHOT_HISTORY_DOCUMENT_ID,
            "Append",
            "The latest validated compact workspace snapshot record is not yet present in the governed snapshot history.",
            {
                snapshotRecord:
                    clone(latestRecord)
            },
            true
        );
    }

    function validateApproval() {
        const snapshot =
            context.getSnapshot();

        return deepFreeze({
            approved:
                snapshot.status ===
                    REQUIRED_STATUS,
            requiredStatus:
                REQUIRED_STATUS,
            currentStatus:
                snapshot.status,
            sessionNumber:
                snapshot.sessionNumber
        });
    }

    function generatePlan() {
        const approval =
            validateApproval();

        if (!approval.approved) {
            const rejected = {
                planType:
                    "TMS-OS Document Update Plan",
                engineVersion:
                    ENGINE_VERSION,
                generatedAt:
                    new Date().toISOString(),
                accepted:
                    false,
                message:
                    "Document Update Plan generation requires Closure Approved status.",
                approval:
                    approval,
                session:
                    null,
                proposals:
                    [],
                summary: {
                    append: 0,
                    replace: 0,
                    noChange: 0,
                    total: 0
                },
                permanentWritesExecuted:
                    false
            };

            lastPlan =
                deepFreeze(rejected);

            return lastPlan;
        }

        const review =
            clone(
                preparer.generateReviewPackage()
            );

        const sessionRecord =
            buildSessionRecord(review);

        const proposals = [
            proposal(
                "WS-HIST-001",
                "Append",
                "Every approved work session requires a permanent history entry.",
                buildWorkSessionHistoryPayload(review),
                true
            ),
            proposal(
                "STATE-001",
                "Replace",
                "The current-state document must reflect the newly approved session state and its approved governance safeguards.",
                buildCurrentStatePayload(review),
                true
            ),
            proposal(
                "DOC-STATE-001",
                "Replace",
                "Documentation state must record the latest approved session, registered writer population, governance safeguards, and documentation activity.",
                buildDocumentationStatePayload(review),
                true
            ),
            proposal(
                "DEC-LOG-001",
                hasEntries(review.decisions)
                    ? "Append"
                    : "No Change",
                hasEntries(review.decisions)
                    ? "The approved session contains decisions requiring permanent history entries."
                    : "The approved session contains no recorded decisions.",
                hasEntries(review.decisions)
                    ? buildDecisionLogPayload(review)
                    : null,
                hasEntries(review.decisions)
            ),
            proposal(
                "MILE-HIST-001",
                hasEntries(review.completedTasks)
                    ? "Append"
                    : "No Change",
                hasEntries(review.completedTasks)
                    ? "The approved session contains completed work that may advance the active milestone."
                    : "The approved session contains no completed work to evaluate for milestone history.",
                hasEntries(review.completedTasks)
                    ? buildMilestoneHistoryPayload(review)
                    : null,
                hasEntries(review.completedTasks)
            ),
            getSnapshotHistoryProposal()
        ];

        const summary =
            proposals.reduce(
                function (counts, item) {
                    if (item.action === "Append") {
                        counts.append += 1;
                    }

                    if (item.action === "Replace") {
                        counts.replace += 1;
                    }

                    if (item.action === "No Change") {
                        counts.noChange += 1;
                    }

                    counts.total += 1;
                    return counts;
                },
                {
                    append: 0,
                    replace: 0,
                    noChange: 0,
                    total: 0
                }
            );

        const plan = {
            planType:
                "TMS-OS Document Update Plan",
            engineVersion:
                ENGINE_VERSION,
            generatedAt:
                new Date().toISOString(),
            accepted:
                true,
            message:
                "Reviewable proposals generated for six governed documents. WS-HIST-001, STATE-001, DOC-STATE-001, DEC-LOG-001, and MILE-HIST-001 include approved session-governance metadata. No permanent files were changed.",
            approval:
                approval,
            session:
                review.session,
            proposals:
                proposals,
            summary:
                summary,
            reviewRequired:
                true,
            reviewChoices: [
                "Approve Plan",
                "Revise Session",
                "Cancel Plan"
            ],
            permanentWritesExecuted:
                false
        };

        lastPlan =
            deepFreeze(
                clone(plan)
            );

        return lastPlan;
    }

    function formatPlanText(plan) {
        const currentPlan =
            plan ||
            generatePlan();

        const lines = [
            "TMS-OS DOCUMENT UPDATE PLAN",
            "Accepted: " +
                (
                    currentPlan.accepted
                        ? "YES"
                        : "NO"
                ),
            "Work Session: " +
                (
                    currentPlan.session
                        ? currentPlan.session.sessionNumber
                        : currentPlan.approval.sessionNumber
                ),
            "Approval Status: " +
                currentPlan.approval.currentStatus,
            "Permanent Writes Executed: NO",
            ""
        ];

        currentPlan.proposals.forEach(
            function (item) {
                lines.push(
                    item.documentId +
                    " | " +
                    item.action +
                    " | " +
                    item.reason
                );
            }
        );

        if (currentPlan.accepted) {
            lines.push("");
            lines.push(
                "Append: " +
                currentPlan.summary.append
            );
            lines.push(
                "Replace: " +
                currentPlan.summary.replace
            );
            lines.push(
                "No Change: " +
                currentPlan.summary.noChange
            );
            lines.push(
                "Total Proposals: " +
                currentPlan.summary.total
            );
            lines.push(
                "Review Choices: " +
                currentPlan.reviewChoices.join(" | ")
            );
        } else {
            lines.push(
                currentPlan.message
            );
        }

        return lines.join("\n");
    }

    function getLastPlan() {
        return lastPlan;
    }

    window.TMSDocumentUpdateEngine =
        Object.freeze({
            engineVersion:
                ENGINE_VERSION,
            validateApproval:
                validateApproval,
            generatePlan:
                generatePlan,
            formatPlanText:
                formatPlanText,
            getLastPlan:
                getLastPlan
        });

    console.log(
        "Document Update Engine v" +
        ENGINE_VERSION +
        " initialized for Work Session " +
        context.getSnapshot().sessionNumber +
        "."
    );
}());
