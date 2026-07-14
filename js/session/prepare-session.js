/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 045 — Prepare Session Engine Foundation v1.0
File: js/session/prepare-session.js

Purpose:
Read the active Session Context and generate a standardized review package for
the Prepare Session phase. This module does not update permanent documents,
create ZIP files, perform Git operations, or formally close a work session.
*/

(function () {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const PREPARED_STATUS = "Prepared for Review";
    const ACTIVE_STATUS = "Active";

    if (!window.TMSSessionContext || !window.TMSSessionManager) {
        console.error("Prepare Session Engine could not initialize because its session dependencies are unavailable.");
        return;
    }

    const context = window.TMSSessionContext;
    const manager = window.TMSSessionManager;

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

    function collectionHasEntries(snapshot, name) {
        return Array.isArray(snapshot[name]) && snapshot[name].length > 0;
    }

    function buildValidation(snapshot) {
        const tests = Array.isArray(snapshot.tests) ? snapshot.tests : [];
        const failedTests = tests.filter(function (test) {
            return test && typeof test === "object" && String(test.result || "").toUpperCase() === "FAIL";
        });

        const checks = [
            {
                id: "session-identity",
                label: "Session identity is complete",
                passed: Boolean(snapshot.sessionNumber && snapshot.version && snapshot.milestone && snapshot.module)
            },
            {
                id: "objectives-recorded",
                label: "At least one objective is recorded",
                passed: collectionHasEntries(snapshot, "objectives")
            },
            {
                id: "completed-work-recorded",
                label: "Completed work is recorded",
                passed: collectionHasEntries(snapshot, "completedTasks")
            },
            {
                id: "tests-recorded",
                label: "At least one test is recorded",
                passed: tests.length > 0
            },
            {
                id: "tests-passing",
                label: "No recorded tests are failing",
                passed: failedTests.length === 0
            }
        ];

        return {
            readyForReview: checks.every(function (check) { return check.passed; }),
            checks: checks,
            failedTestCount: failedTests.length
        };
    }

    function generateReviewPackage() {
        const snapshot = clone(context.getSnapshot());
        const validation = buildValidation(snapshot);

        return deepFreeze({
            packageType: "TMS-OS Prepare Session Review Package",
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            session: {
                sessionNumber: snapshot.sessionNumber,
                version: snapshot.version,
                milestone: snapshot.milestone,
                module: snapshot.module,
                status: snapshot.status,
                startedAt: snapshot.startedAt,
                updatedAt: snapshot.updatedAt
            },
            objectives: snapshot.objectives,
            completedTasks: snapshot.completedTasks,
            deferredTasks: snapshot.deferredTasks,
            files: {
                added: snapshot.filesAdded,
                modified: snapshot.filesModified,
                removed: snapshot.filesRemoved
            },
            tests: snapshot.tests,
            bugs: {
                fixed: snapshot.bugsFixed,
                known: snapshot.knownBugs
            },
            decisions: snapshot.decisions,
            risks: snapshot.risks,
            technicalDebt: snapshot.technicalDebt,
            enhancementIdeas: snapshot.enhancementIdeas,
            documentationUpdates: snapshot.documentationUpdates,
            validation: validation,
            reviewChoices: ["Approve & Close", "Revise", "Cancel"]
        });
    }

    function prepareSession() {
        manager.setSessionStatus(PREPARED_STATUS);
        return generateReviewPackage();
    }

    function returnToActive() {
        manager.setSessionStatus(ACTIVE_STATUS);
        return generateReviewPackage();
    }

    function formatReviewText(reviewPackage) {
        const review = reviewPackage || generateReviewPackage();
        const lines = [
            "TMS-OS PREPARE SESSION REVIEW",
            "Work Session: " + review.session.sessionNumber,
            "Version: " + review.session.version,
            "Milestone: " + review.session.milestone,
            "Module: " + review.session.module,
            "Status: " + review.session.status,
            "",
            "Objectives: " + review.objectives.length,
            "Completed Tasks: " + review.completedTasks.length,
            "Deferred Tasks: " + review.deferredTasks.length,
            "Files Added: " + review.files.added.length,
            "Files Modified: " + review.files.modified.length,
            "Files Removed: " + review.files.removed.length,
            "Tests: " + review.tests.length,
            "Bugs Fixed: " + review.bugs.fixed.length,
            "Known Bugs: " + review.bugs.known.length,
            "Decisions: " + review.decisions.length,
            "Risks: " + review.risks.length,
            "Technical Debt: " + review.technicalDebt.length,
            "Enhancement Ideas: " + review.enhancementIdeas.length,
            "Documentation Updates: " + review.documentationUpdates.length,
            "",
            "Ready for Review: " + (review.validation.readyForReview ? "YES" : "NO"),
            "Review Choices: " + review.reviewChoices.join(" | ")
        ];

        return lines.join("\n");
    }

    window.TMSSessionPreparer = Object.freeze({
        engineVersion: ENGINE_VERSION,
        generateReviewPackage: generateReviewPackage,
        prepareSession: prepareSession,
        returnToActive: returnToActive,
        validate: function () {
            return deepFreeze(buildValidation(clone(context.getSnapshot())));
        },
        formatReviewText: formatReviewText
    });

    console.log("Prepare Session Engine v" + ENGINE_VERSION + " initialized for Work Session " + context.getSnapshot().sessionNumber + ".");
}());
