/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 045 — Session Manager Foundation v1.0
File: js/session/session-manager.js

Purpose:
Provide controlled, intention-based commands for recording work-session activity.
This module writes through TMSSessionContext and does not render UI, update
permanent documents, perform Git operations, or close a work session.
*/

(function () {
    "use strict";

    const MANAGER_VERSION = "1.0.0";

    if (!window.TMSSessionContext) {
        console.error("Session Manager could not initialize because TMSSessionContext is unavailable.");
        return;
    }

    const context = window.TMSSessionContext;

    function requireText(value, label) {
        const text = String(value == null ? "" : value).trim();
        if (!text) {
            throw new TypeError(label + " cannot be empty.");
        }
        return text;
    }

    function optionalText(value) {
        const text = String(value == null ? "" : value).trim();
        return text || undefined;
    }

    function normalizeResult(value) {
        if (typeof value === "boolean") {
            return value ? "PASS" : "FAIL";
        }

        const result = requireText(value, "Test result").toUpperCase();
        const aliases = {
            PASSED: "PASS",
            SUCCESS: "PASS",
            SUCCESSFUL: "PASS",
            FAILED: "FAIL",
            FAILURE: "FAIL"
        };

        return aliases[result] || result;
    }

    function recordObjective(description) {
        return context.addObjective(requireText(description, "Objective"));
    }

    function completeTask(description, details) {
        const entry = {
            description: requireText(description, "Completed task"),
            completedAt: new Date().toISOString()
        };
        const normalizedDetails = optionalText(details);
        if (normalizedDetails) {
            entry.details = normalizedDetails;
        }
        return context.addCompletedTask(entry);
    }

    function deferTask(description, reason) {
        const entry = {
            description: requireText(description, "Deferred task"),
            deferredAt: new Date().toISOString()
        };
        const normalizedReason = optionalText(reason);
        if (normalizedReason) {
            entry.reason = normalizedReason;
        }
        return context.addDeferredTask(entry);
    }

    function recordFileChange(changeType, filePath, details) {
        const normalizedType = requireText(changeType, "File change type").toLowerCase();
        const collectionByType = {
            added: "filesAdded",
            add: "filesAdded",
            modified: "filesModified",
            modify: "filesModified",
            changed: "filesModified",
            removed: "filesRemoved",
            remove: "filesRemoved",
            deleted: "filesRemoved",
            delete: "filesRemoved"
        };
        const collectionName = collectionByType[normalizedType];

        if (!collectionName) {
            throw new RangeError("File change type must be added, modified, or removed.");
        }

        const entry = {
            path: requireText(filePath, "File path"),
            recordedAt: new Date().toISOString()
        };
        const normalizedDetails = optionalText(details);
        if (normalizedDetails) {
            entry.details = normalizedDetails;
        }

        return context.add(collectionName, entry);
    }

    function recordTest(name, result, details) {
        const entry = {
            name: requireText(name, "Test name"),
            result: normalizeResult(result),
            testedAt: new Date().toISOString()
        };
        const normalizedDetails = optionalText(details);
        if (normalizedDetails) {
            entry.details = normalizedDetails;
        }
        return context.addTest(entry);
    }

    function recordBugFix(description, details) {
        const entry = {
            description: requireText(description, "Bug fix"),
            fixedAt: new Date().toISOString()
        };
        const normalizedDetails = optionalText(details);
        if (normalizedDetails) {
            entry.details = normalizedDetails;
        }
        return context.addBugFixed(entry);
    }

    function recordKnownBug(description, severity) {
        const entry = {
            description: requireText(description, "Known bug"),
            recordedAt: new Date().toISOString()
        };
        const normalizedSeverity = optionalText(severity);
        if (normalizedSeverity) {
            entry.severity = normalizedSeverity;
        }
        return context.addKnownBug(entry);
    }

    function recordDecision(description, rationale) {
        const entry = {
            description: requireText(description, "Decision"),
            decidedAt: new Date().toISOString()
        };
        const normalizedRationale = optionalText(rationale);
        if (normalizedRationale) {
            entry.rationale = normalizedRationale;
        }
        return context.addDecision(entry);
    }

    function recordRisk(description, level) {
        const entry = {
            description: requireText(description, "Risk"),
            recordedAt: new Date().toISOString()
        };
        const normalizedLevel = optionalText(level);
        if (normalizedLevel) {
            entry.level = normalizedLevel;
        }
        return context.addRisk(entry);
    }

    function recordTechnicalDebt(description, priority) {
        const entry = {
            description: requireText(description, "Technical debt"),
            recordedAt: new Date().toISOString()
        };
        const normalizedPriority = optionalText(priority);
        if (normalizedPriority) {
            entry.priority = normalizedPriority;
        }
        return context.addTechnicalDebtItem(entry);
    }

    function recordEnhancementIdea(description, status) {
        const entry = {
            description: requireText(description, "Enhancement idea"),
            recordedAt: new Date().toISOString(),
            status: optionalText(status) || "Deferred"
        };
        return context.addEnhancementIdea(entry);
    }

    function recordDocumentationUpdate(documentId, description) {
        const entry = {
            documentId: requireText(documentId, "Document ID"),
            description: requireText(description, "Documentation update"),
            recordedAt: new Date().toISOString()
        };
        return context.addDocumentationUpdate(entry);
    }

    function setSessionStatus(status) {
        return context.setStatus(requireText(status, "Session status"));
    }

    function getSessionSummary() {
        const snapshot = context.getSnapshot();
        return Object.freeze({
            sessionNumber: snapshot.sessionNumber,
            version: snapshot.version,
            milestone: snapshot.milestone,
            module: snapshot.module,
            status: snapshot.status,
            counts: Object.freeze({
                objectives: snapshot.objectives.length,
                completedTasks: snapshot.completedTasks.length,
                deferredTasks: snapshot.deferredTasks.length,
                filesAdded: snapshot.filesAdded.length,
                filesModified: snapshot.filesModified.length,
                filesRemoved: snapshot.filesRemoved.length,
                tests: snapshot.tests.length,
                bugsFixed: snapshot.bugsFixed.length,
                knownBugs: snapshot.knownBugs.length,
                decisions: snapshot.decisions.length,
                technicalDebt: snapshot.technicalDebt.length,
                enhancementIdeas: snapshot.enhancementIdeas.length,
                documentationUpdates: snapshot.documentationUpdates.length,
                risks: snapshot.risks.length
            }),
            updatedAt: snapshot.updatedAt
        });
    }

    window.TMSSessionManager = Object.freeze({
        managerVersion: MANAGER_VERSION,
        recordObjective: recordObjective,
        completeTask: completeTask,
        deferTask: deferTask,
        recordFileChange: recordFileChange,
        recordTest: recordTest,
        recordBugFix: recordBugFix,
        recordKnownBug: recordKnownBug,
        recordDecision: recordDecision,
        recordRisk: recordRisk,
        recordTechnicalDebt: recordTechnicalDebt,
        recordEnhancementIdea: recordEnhancementIdea,
        recordDocumentationUpdate: recordDocumentationUpdate,
        setSessionStatus: setSessionStatus,
        getSessionSummary: getSessionSummary
    });

    console.log("Session Manager v" + MANAGER_VERSION + " initialized for Work Session " + context.getSnapshot().sessionNumber + ".");
}());
