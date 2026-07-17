(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.1";
    const PLANNING_MODE = "Disabled";

    let lastExecutionPlan = null;

    const DEFAULT_REQUIREMENTS = Object.freeze([
        "Document Writer Registry must be available.",
        "Permanent Transaction Manager must be available.",
        "Registered writers must be readable.",
        "Expected permanent document identifiers must be readable.",
        "Execution order must include every expected permanent document exactly once.",
        "Every execution step must identify a document and writer.",
        "Every execution step must include a validation checkpoint.",
        "Every execution step must include a rollback checkpoint.",
        "Planning Mode must remain Disabled.",
        "Execution must not be authorized.",
        "Permanent writes must not be attempted.",
        "Rollback must not be performed.",
        "Restore must not be performed."
    ]);

    function nowIso() {
        return new Date().toISOString();
    }

    function clone(value) {
        return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    }

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }


    function readActiveSessionContext() {
        const context = global.TMSSessionContext;

        if (!context || typeof context.getSnapshot !== "function") {
            return {
                available: false,
                snapshot: null,
                message: "TMSSessionContext.getSnapshot() is unavailable."
            };
        }

        try {
            const snapshot = context.getSnapshot();
            return {
                available: true,
                snapshot: isObject(snapshot) ? clone(snapshot) : null,
                message: "Active session context captured."
            };
        } catch (error) {
            return {
                available: true,
                snapshot: null,
                message: error && error.message ? error.message : String(error)
            };
        }
    }

    function readRegistry() {
        const registry = global.TMSDocumentWriterRegistry;

        if (!registry || typeof registry.getRegisteredWriters !== "function") {
            return {
                available: false,
                writers: [],
                validation: null,
                message: "TMSDocumentWriterRegistry.getRegisteredWriters() is unavailable."
            };
        }

        let writers = [];
        let validation = null;

        try {
            const result = registry.getRegisteredWriters();
            writers = Array.isArray(result) ? result : [];
        } catch (error) {
            return {
                available: true,
                writers: [],
                validation: null,
                message: error && error.message ? error.message : String(error)
            };
        }

        if (typeof registry.validateRegistry === "function") {
            try {
                validation = registry.validateRegistry();
            } catch (error) {
                validation = {
                    valid: false,
                    error: error && error.message ? error.message : String(error)
                };
            }
        }

        return {
            available: true,
            writers: clone(writers),
            validation: clone(validation),
            message: "Registry information captured."
        };
    }

    function readTransactionManager() {
        const manager = global.TMSPermanentTransactionManager;

        if (!manager || typeof manager.getExpectedDocuments !== "function") {
            return {
                available: false,
                expectedDocuments: [],
                lastTransaction: null,
                message: "TMSPermanentTransactionManager.getExpectedDocuments() is unavailable."
            };
        }

        let expectedDocuments = [];
        let lastTransaction = null;

        try {
            const result = manager.getExpectedDocuments();
            expectedDocuments = Array.isArray(result) ? result : [];
        } catch (error) {
            return {
                available: true,
                expectedDocuments: [],
                lastTransaction: null,
                message: error && error.message ? error.message : String(error)
            };
        }

        if (typeof manager.getLastTransaction === "function") {
            try {
                lastTransaction = manager.getLastTransaction();
            } catch (error) {
                lastTransaction = {
                    error: error && error.message ? error.message : String(error)
                };
            }
        }

        return {
            available: true,
            expectedDocuments: clone(expectedDocuments),
            lastTransaction: clone(lastTransaction),
            message: "Permanent transaction information captured."
        };
    }

    function readDraftPackage(input) {
        if (isObject(input) && isObject(input.draftPackage)) {
            return clone(input.draftPackage);
        }

        const registry = global.TMSDocumentWriterRegistry;
        if (registry && typeof registry.getLastPackage === "function") {
            try {
                return clone(registry.getLastPackage());
            } catch (error) {
                return {
                    error: error && error.message ? error.message : String(error)
                };
            }
        }

        return null;
    }

    function resolveDocumentId(writer) {
        if (!isObject(writer)) {
            return null;
        }

        return writer.documentId ||
            writer.documentID ||
            writer.document ||
            writer.id ||
            writer.permanentDocumentId ||
            writer.targetDocumentId ||
            null;
    }

    function resolveWriterName(writer) {
        if (!isObject(writer)) {
            return "Unknown Writer";
        }

        return writer.writerName ||
            writer.name ||
            writer.writerId ||
            writer.id ||
            writer.title ||
            "Unknown Writer";
    }

    function resolveWriterVersion(writer) {
        if (!isObject(writer)) {
            return "Unknown";
        }

        return writer.writerVersion || writer.version || writer.engineVersion || "Unknown";
    }

    function buildWriterLookup(writers) {
        const lookup = new Map();

        writers.forEach(function (writer) {
            const documentId = resolveDocumentId(writer);
            if (documentId && !lookup.has(documentId)) {
                lookup.set(documentId, writer);
            }
        });

        return lookup;
    }

    function buildExecutionSteps(expectedDocuments, writers) {
        const writerLookup = buildWriterLookup(writers);

        return expectedDocuments.map(function (documentId, index) {
            const writer = writerLookup.get(documentId) || null;
            const stepNumber = index + 1;

            return {
                stepNumber: stepNumber,
                documentId: documentId,
                writerFound: Boolean(writer),
                writerName: resolveWriterName(writer),
                writerVersion: resolveWriterVersion(writer),
                validationCheckpoint: {
                    checkpointId: "VALIDATE-BEFORE-" + documentId,
                    required: true,
                    satisfied: false,
                    status: "Not Executed"
                },
                rollbackCheckpoint: {
                    checkpointId: "ROLLBACK-BEFORE-" + documentId,
                    required: true,
                    captured: false,
                    status: "Not Captured"
                },
                execution: {
                    authorized: false,
                    attempted: false,
                    completed: false,
                    permanentWritePerformed: false
                }
            };
        });
    }

    function buildDependencySummary(steps) {
        return steps.map(function (step, index) {
            return {
                documentId: step.documentId,
                dependsOn: index === 0 ? [] : [steps[index - 1].documentId],
                dependencyStatus: "Not Evaluated"
            };
        });
    }

    function generateExecutionPlan(options) {
        const input = isObject(options) ? options : {};
        const sessionContext = readActiveSessionContext();
        const registry = readRegistry();
        const transactionManager = readTransactionManager();
        const draftPackage = readDraftPackage(input);
        const steps = buildExecutionSteps(
            transactionManager.expectedDocuments,
            registry.writers
        );

        const plan = {
            planType: "TMS-OS Permanent Transaction Execution Plan",
            engineVersion: ENGINE_VERSION,
            generatedAt: nowIso(),
            planningMode: PLANNING_MODE,
            sessionNumber: input.sessionNumber ||
                (sessionContext.snapshot && sessionContext.snapshot.sessionNumber) ||
                null,
            milestone: input.milestone ||
                (sessionContext.snapshot && sessionContext.snapshot.milestone) ||
                "Controlled Permanent Output Execution",
            module: "Permanent Transaction Execution Plan Generator",
            accepted: false,
            authorized: false,
            executionStatus: "Not Authorized - Disabled Mode",
            sourceStatus: {
                sessionContextAvailable: sessionContext.available,
                sessionContextCaptured: Boolean(sessionContext.snapshot),
                registryAvailable: registry.available,
                transactionManagerAvailable: transactionManager.available,
                draftPackageAvailable: Boolean(draftPackage),
                registryValidation: registry.validation,
                lastTransactionAvailable: Boolean(transactionManager.lastTransaction)
            },
            expectedDocuments: clone(transactionManager.expectedDocuments),
            registeredWriterCount: registry.writers.length,
            expectedDocumentCount: transactionManager.expectedDocuments.length,
            draftPackage: draftPackage,
            lastTransaction: transactionManager.lastTransaction,
            executionSteps: steps,
            dependencies: buildDependencySummary(steps),
            validationCheckpoints: steps.map(function (step) {
                return clone(step.validationCheckpoint);
            }),
            rollbackCheckpoints: steps.map(function (step) {
                return clone(step.rollbackCheckpoint);
            }),
            safetyState: {
                executionAuthorized: false,
                executionAttempted: false,
                permanentWritesAttempted: false,
                permanentWritesExecuted: 0,
                rollbackAttempted: false,
                rollbackPerformed: false,
                restoreAttempted: false,
                restorePerformed: false,
                stateChangeAttempted: false,
                stateChangeApplied: false
            },
            requirements: clone(DEFAULT_REQUIREMENTS),
            validation: null,
            requiredNextAction: "Review the Disabled Mode execution plan. Do not authorize or execute permanent documentation writes."
        };

        plan.validation = validateExecutionPlan(plan);
        lastExecutionPlan = clone(plan);
        return clone(plan);
    }

    function validateExecutionPlan(plan) {
        const candidate = isObject(plan) ? plan : {};
        const expectedDocuments = Array.isArray(candidate.expectedDocuments)
            ? candidate.expectedDocuments
            : [];
        const steps = Array.isArray(candidate.executionSteps)
            ? candidate.executionSteps
            : [];

        const stepDocumentIds = steps.map(function (step) {
            return step && step.documentId;
        });

        const uniqueStepDocumentIds = Array.from(new Set(stepDocumentIds.filter(Boolean)));
        const checks = [
            {
                name: "Plan Exists",
                passed: isObject(plan)
            },
            {
                name: "Planning Mode Disabled",
                passed: candidate.planningMode === PLANNING_MODE
            },
            {
                name: "Registry Available",
                passed: Boolean(candidate.sourceStatus && candidate.sourceStatus.registryAvailable)
            },
            {
                name: "Transaction Manager Available",
                passed: Boolean(candidate.sourceStatus && candidate.sourceStatus.transactionManagerAvailable)
            },
            {
                name: "Expected Documents Present",
                passed: expectedDocuments.length > 0
            },
            {
                name: "Execution Step Count Matches Expected Documents",
                passed: steps.length === expectedDocuments.length && expectedDocuments.length > 0
            },
            {
                name: "Execution Document Sequence Matches Expected Documents",
                passed: JSON.stringify(stepDocumentIds) === JSON.stringify(expectedDocuments)
            },
            {
                name: "Execution Documents Are Unique",
                passed: uniqueStepDocumentIds.length === expectedDocuments.length
            },
            {
                name: "All Writers Resolved",
                passed: steps.length > 0 && steps.every(function (step) {
                    return Boolean(step && step.writerFound);
                })
            },
            {
                name: "All Validation Checkpoints Defined",
                passed: steps.length > 0 && steps.every(function (step) {
                    return Boolean(step && step.validationCheckpoint && step.validationCheckpoint.required === true);
                })
            },
            {
                name: "All Rollback Checkpoints Defined",
                passed: steps.length > 0 && steps.every(function (step) {
                    return Boolean(step && step.rollbackCheckpoint && step.rollbackCheckpoint.required === true);
                })
            },
            {
                name: "Execution Not Authorized",
                passed: candidate.authorized === false
            },
            {
                name: "Execution Not Attempted",
                passed: Boolean(candidate.safetyState && candidate.safetyState.executionAttempted === false)
            },
            {
                name: "Permanent Writes Not Attempted",
                passed: Boolean(candidate.safetyState && candidate.safetyState.permanentWritesAttempted === false)
            },
            {
                name: "Permanent Writes Executed Is Zero",
                passed: Boolean(candidate.safetyState && candidate.safetyState.permanentWritesExecuted === 0)
            },
            {
                name: "Rollback Not Performed",
                passed: Boolean(candidate.safetyState && candidate.safetyState.rollbackPerformed === false)
            },
            {
                name: "Restore Not Performed",
                passed: Boolean(candidate.safetyState && candidate.safetyState.restorePerformed === false)
            },
            {
                name: "State Change Not Applied",
                passed: Boolean(candidate.safetyState && candidate.safetyState.stateChangeApplied === false)
            }
        ];

        const structuralChecksPassed = checks
            .filter(function (check) {
                return ![
                    "Execution Not Authorized",
                    "Execution Not Attempted",
                    "Permanent Writes Not Attempted",
                    "Permanent Writes Executed Is Zero",
                    "Rollback Not Performed",
                    "Restore Not Performed",
                    "State Change Not Applied"
                ].includes(check.name);
            })
            .every(function (check) {
                return check.passed;
            });

        return {
            reportType: "TMS-OS Permanent Transaction Execution Plan Validation",
            engineVersion: ENGINE_VERSION,
            validatedAt: nowIso(),
            planningMode: PLANNING_MODE,
            validStructure: structuralChecksPassed,
            accepted: false,
            authorized: false,
            checkCount: checks.length,
            passedCheckCount: checks.filter(function (check) {
                return check.passed;
            }).length,
            failedCheckCount: checks.filter(function (check) {
                return !check.passed;
            }).length,
            checks: checks,
            message: structuralChecksPassed
                ? "Execution plan structure is valid, but execution remains disabled and unauthorized."
                : "Execution plan structure is incomplete. Execution remains disabled and unauthorized."
        };
    }

    function formatExecutionPlan(plan) {
        const candidate = isObject(plan) ? plan : lastExecutionPlan;

        if (!candidate) {
            return "No Permanent Transaction Execution Plan has been generated.";
        }

        const lines = [];
        const validation = candidate.validation || validateExecutionPlan(candidate);
        const steps = Array.isArray(candidate.executionSteps) ? candidate.executionSteps : [];

        lines.push("TMS-OS PERMANENT TRANSACTION EXECUTION PLAN");
        lines.push("==================================================");
        lines.push("");
        lines.push("Generated At: " + candidate.generatedAt);
        lines.push("Session Number: " + (candidate.sessionNumber || "Not Available"));
        lines.push("Milestone: " + (candidate.milestone || "Not Available"));
        lines.push("Engine Version: " + candidate.engineVersion);
        lines.push("Planning Mode: " + candidate.planningMode);
        lines.push("Accepted: NO");
        lines.push("Authorized: NO");
        lines.push("Execution Status: " + candidate.executionStatus);
        lines.push("");
        lines.push("EXPECTED PERMANENT DOCUMENTS");
        lines.push("----------------------------------------");

        (candidate.expectedDocuments || []).forEach(function (documentId, index) {
            lines.push((index + 1) + ". " + documentId);
        });

        lines.push("");
        lines.push("EXECUTION ORDER");
        lines.push("----------------------------------------");

        steps.forEach(function (step) {
            lines.push(
                step.stepNumber + ". " + step.documentId +
                " | Writer: " + step.writerName +
                " | Writer Found: " + (step.writerFound ? "YES" : "NO")
            );
            lines.push("   Validation: " + step.validationCheckpoint.checkpointId);
            lines.push("   Rollback: " + step.rollbackCheckpoint.checkpointId);
            lines.push("   Execution Attempted: NO");
            lines.push("   Permanent Write Performed: NO");
        });

        lines.push("");
        lines.push("VALIDATION SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Valid Structure: " + (validation.validStructure ? "YES" : "NO"));
        lines.push("Accepted: NO");
        lines.push("Authorized: NO");
        lines.push("Passed Checks: " + validation.passedCheckCount);
        lines.push("Failed Checks: " + validation.failedCheckCount);

        validation.checks.forEach(function (check) {
            lines.push("- " + check.name + ": " + (check.passed ? "YES" : "NO"));
        });

        lines.push("");
        lines.push("SAFETY STATE");
        lines.push("----------------------------------------");
        lines.push("Execution Authorized: NO");
        lines.push("Execution Attempted: NO");
        lines.push("Permanent Writes Attempted: NO");
        lines.push("Permanent Writes Executed: 0");
        lines.push("Rollback Performed: NO");
        lines.push("Restore Performed: NO");
        lines.push("State Change Applied: NO");
        lines.push("");
        lines.push("REQUIRED NEXT ACTION");
        lines.push("----------------------------------------");
        lines.push(candidate.requiredNextAction);

        return lines.join("\n");
    }

    function getLastExecutionPlan() {
        return clone(lastExecutionPlan);
    }

    function getExecutionPlanRequirements() {
        return clone(DEFAULT_REQUIREMENTS);
    }

    global.TMSPermanentTransactionExecutionPlanGenerator = Object.freeze({
        engineVersion: ENGINE_VERSION,
        planningMode: PLANNING_MODE,
        generateExecutionPlan: generateExecutionPlan,
        validateExecutionPlan: validateExecutionPlan,
        formatExecutionPlan: formatExecutionPlan,
        getLastExecutionPlan: getLastExecutionPlan,
        getExecutionPlanRequirements: getExecutionPlanRequirements
    });
})(window);
