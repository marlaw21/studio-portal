/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 046 — Document Update Plan Foundation v1.0
File: js/session/document-update-engine.js

Purpose:
Transform an approved Session Context into a read-only, reviewable Document
Update Plan. This foundation decides what permanent documents should change and
why. It does not write JSON files, modify StudioDB, create ZIP packages, perform
Git operations, create release tags, or finalize permanent documentation.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const REQUIRED_STATUS = "Closure Approved";

    if (!window.TMSSessionContext || !window.TMSSessionPreparer || !window.TMSSessionCloser) {
        console.error("Document Update Engine could not initialize because its session dependencies are unavailable.");
        return;
    }

    const context = window.TMSSessionContext;
    const preparer = window.TMSSessionPreparer;
    let lastPlan = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function deepFreeze(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
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

    function validateApproval() {
        const snapshot = context.getSnapshot();
        return deepFreeze({
            approved: snapshot.status === REQUIRED_STATUS,
            requiredStatus: REQUIRED_STATUS,
            currentStatus: snapshot.status,
            sessionNumber: snapshot.sessionNumber
        });
    }

    function generatePlan() {
        const approval = validateApproval();

        if (!approval.approved) {
            const rejected = {
                planType: "TMS-OS Document Update Plan",
                engineVersion: ENGINE_VERSION,
                generatedAt: new Date().toISOString(),
                accepted: false,
                message: "Document Update Plan generation requires Closure Approved status.",
                approval: approval,
                session: null,
                proposals: [],
                summary: {
                    append: 0,
                    replace: 0,
                    noChange: 0,
                    total: 0
                },
                permanentWritesExecuted: false
            };
            lastPlan = deepFreeze(rejected);
            return lastPlan;
        }

        const review = clone(preparer.generateReviewPackage());
        const sessionRecord = buildSessionRecord(review);
        const proposals = [
            proposal(
                "WS-HIST-001",
                "Append",
                "Every approved work session requires a permanent history entry.",
                { sessionRecord: sessionRecord },
                true
            ),
            proposal(
                "STATE-001",
                "Replace",
                "The current-state document must reflect the newly approved session state.",
                {
                    currentVersion: review.session.version,
                    currentMilestone: review.session.milestone,
                    currentModule: review.session.module,
                    lastApprovedSession: review.session.sessionNumber,
                    sessionStatus: review.session.status
                },
                true
            ),
            proposal(
                "DOC-STATE-001",
                "Replace",
                "Documentation state must record the latest approved session and any documentation activity.",
                {
                    lastApprovedSession: review.session.sessionNumber,
                    documentationUpdates: review.documentationUpdates,
                    permanentWriteStatus: "Proposal Only"
                },
                true
            ),
            proposal(
                "DEC-LOG-001",
                hasEntries(review.decisions) ? "Append" : "No Change",
                hasEntries(review.decisions)
                    ? "The approved session contains decisions requiring permanent history entries."
                    : "The approved session contains no recorded decisions.",
                hasEntries(review.decisions) ? { decisions: review.decisions } : null,
                hasEntries(review.decisions)
            ),
            proposal(
                "MILE-HIST-001",
                hasEntries(review.completedTasks) ? "Append" : "No Change",
                hasEntries(review.completedTasks)
                    ? "The approved session contains completed work that may advance the active milestone."
                    : "The approved session contains no completed work to evaluate for milestone history.",
                hasEntries(review.completedTasks)
                    ? {
                        milestone: review.session.milestone,
                        module: review.session.module,
                        sessionNumber: review.session.sessionNumber,
                        completedTasks: review.completedTasks
                    }
                    : null,
                hasEntries(review.completedTasks)
            )
        ];

        const summary = proposals.reduce(function (counts, item) {
            if (item.action === "Append") { counts.append += 1; }
            if (item.action === "Replace") { counts.replace += 1; }
            if (item.action === "No Change") { counts.noChange += 1; }
            counts.total += 1;
            return counts;
        }, { append: 0, replace: 0, noChange: 0, total: 0 });

        const plan = {
            planType: "TMS-OS Document Update Plan",
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            accepted: true,
            message: "Reviewable proposals generated. No permanent files were changed.",
            approval: approval,
            session: review.session,
            proposals: proposals,
            summary: summary,
            reviewRequired: true,
            reviewChoices: ["Approve Plan", "Revise Session", "Cancel Plan"],
            permanentWritesExecuted: false
        };

        lastPlan = deepFreeze(clone(plan));
        return lastPlan;
    }

    function formatPlanText(plan) {
        const currentPlan = plan || generatePlan();
        const lines = [
            "TMS-OS DOCUMENT UPDATE PLAN",
            "Accepted: " + (currentPlan.accepted ? "YES" : "NO"),
            "Work Session: " + (currentPlan.session ? currentPlan.session.sessionNumber : currentPlan.approval.sessionNumber),
            "Approval Status: " + currentPlan.approval.currentStatus,
            "Permanent Writes Executed: NO",
            ""
        ];

        currentPlan.proposals.forEach(function (item) {
            lines.push(item.documentId + " | " + item.action + " | " + item.reason);
        });

        if (currentPlan.accepted) {
            lines.push("");
            lines.push("Append: " + currentPlan.summary.append);
            lines.push("Replace: " + currentPlan.summary.replace);
            lines.push("No Change: " + currentPlan.summary.noChange);
            lines.push("Review Choices: " + currentPlan.reviewChoices.join(" | "));
        } else {
            lines.push(currentPlan.message);
        }

        return lines.join("\n");
    }

    function getLastPlan() {
        return lastPlan;
    }

    window.TMSDocumentUpdateEngine = Object.freeze({
        engineVersion: ENGINE_VERSION,
        validateApproval: validateApproval,
        generatePlan: generatePlan,
        formatPlanText: formatPlanText,
        getLastPlan: getLastPlan
    });

    console.log(
        "Document Update Engine v" + ENGINE_VERSION +
        " initialized for Work Session " + context.getSnapshot().sessionNumber + "."
    );
}());
