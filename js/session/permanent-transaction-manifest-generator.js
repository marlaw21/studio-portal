(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const MANIFEST_VERSION = "1.0.0";
    const MANIFEST_MODE = "Disabled";
    const MANIFEST_TYPE = "TMS-OS Permanent Transaction Manifest";
    const VALIDATION_TYPE = "TMS-OS Permanent Transaction Manifest Validation";

    let lastManifest = null;

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function clone(value) {
        if (value === undefined) {
            return null;
        }
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (error) {
            console.warn("Manifest Generator could not clone a value.", error);
            return null;
        }
    }

    function safeCall(target, methodName, fallbackValue) {
        try {
            if (target && typeof target[methodName] === "function") {
                return target[methodName]();
            }
        } catch (error) {
            console.warn("Manifest Generator could not call " + methodName + ".", error);
        }
        return fallbackValue;
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

    function makeCheck(name, passed) {
        return {
            name: name,
            passed: !!passed
        };
    }

    function unique(values) {
        return Array.from(new Set(values));
    }

    function getSessionSnapshot() {
        return clone(safeCall(global.TMSSessionContext, "getSnapshot", {})) || {};
    }

    function getExpectedDocuments() {
        const result = safeCall(global.TMSPermanentTransactionManager, "getExpectedDocuments", []);
        return Array.isArray(result) ? result.slice() : [];
    }

    function getRegisteredWriters() {
        const result = safeCall(global.TMSDocumentWriterRegistry, "getRegisteredWriters", []);
        return Array.isArray(result) ? clone(result) || [] : [];
    }

    function getRegistryValidation() {
        return clone(safeCall(global.TMSDocumentWriterRegistry, "validateRegistry", null));
    }

    function getLatestTransaction() {
        return clone(safeCall(global.TMSPermanentTransactionManager, "getLastTransaction", null));
    }

    function getOrGenerateExecutionPlan() {
        const generator = global.TMSPermanentTransactionExecutionPlanGenerator;
        if (!generator) {
            return { artifact: null, validation: null, generated: false };
        }

        let artifact = safeCall(generator, "getLastExecutionPlan", null);
        let generated = false;

        if (!artifact && typeof generator.generateExecutionPlan === "function") {
            try {
                artifact = generator.generateExecutionPlan();
                generated = true;
            } catch (error) {
                console.warn("Manifest Generator could not generate an execution plan.", error);
            }
        }

        let validation = null;
        if (artifact && typeof generator.validateExecutionPlan === "function") {
            try {
                validation = generator.validateExecutionPlan(artifact);
            } catch (error) {
                console.warn("Manifest Generator could not validate the execution plan.", error);
            }
        }

        return {
            artifact: clone(artifact),
            validation: clone(validation),
            generated: generated
        };
    }

    function getOrGenerateDependencyAnalysis() {
        const analyzer = global.TMSPermanentTransactionDependencyAnalyzer;
        if (!analyzer) {
            return { artifact: null, validation: null, generated: false };
        }

        let artifact = safeCall(analyzer, "getLastDependencyAnalysis", null);
        let generated = false;

        if (!artifact && typeof analyzer.generateDependencyAnalysis === "function") {
            try {
                artifact = analyzer.generateDependencyAnalysis();
                generated = true;
            } catch (error) {
                console.warn("Manifest Generator could not generate dependency analysis.", error);
            }
        }

        let validation = null;
        if (artifact && typeof analyzer.validateDependencyAnalysis === "function") {
            try {
                validation = analyzer.validateDependencyAnalysis(artifact);
            } catch (error) {
                console.warn("Manifest Generator could not validate dependency analysis.", error);
            }
        }

        return {
            artifact: clone(artifact),
            validation: clone(validation),
            generated: generated
        };
    }

    function getOrGenerateReadinessReport() {
        const analyzer = global.TMSPermanentTransactionReadinessAnalyzer;
        if (!analyzer) {
            return { artifact: null, validation: null, generated: false };
        }

        let artifact = safeCall(analyzer, "getLastReadinessReport", null);
        let generated = false;

        if (!artifact && typeof analyzer.generateReadinessReport === "function") {
            try {
                artifact = analyzer.generateReadinessReport();
                generated = true;
            } catch (error) {
                console.warn("Manifest Generator could not generate readiness report.", error);
            }
        }

        let validation = null;
        if (artifact && typeof analyzer.validateReadinessReport === "function") {
            try {
                validation = analyzer.validateReadinessReport(artifact);
            } catch (error) {
                console.warn("Manifest Generator could not validate readiness report.", error);
            }
        }

        return {
            artifact: clone(artifact),
            validation: clone(validation),
            generated: generated
        };
    }

    function extractExecutionOrder(plan) {
        if (!plan) {
            return [];
        }

        if (Array.isArray(plan.executionOrder)) {
            return plan.executionOrder.map(function (item) {
                return typeof item === "string" ? item : item && (item.documentId || item.permanentDocumentId || item.id);
            }).filter(Boolean);
        }

        if (Array.isArray(plan.executionSteps)) {
            return plan.executionSteps.map(function (step) {
                return step && (step.documentId || step.permanentDocumentId || step.id);
            }).filter(Boolean);
        }

        return [];
    }

    function extractDependencyGraph(analysis) {
        if (!analysis) {
            return [];
        }

        const records = Array.isArray(analysis.dependencyAnalysis)
            ? analysis.dependencyAnalysis
            : Array.isArray(analysis.dependencies)
                ? analysis.dependencies
                : Array.isArray(analysis.dependencyRecords)
                    ? analysis.dependencyRecords
                    : [];

        return records.map(function (record) {
            return {
                documentId: record && (record.documentId || record.permanentDocumentId || record.id) || null,
                dependencies: Array.isArray(record && record.dependencies) ? record.dependencies.slice() : [],
                dependencySafe: record && record.dependencySafe === true
            };
        });
    }

    function buildSafetyState() {
        return {
            manifestMode: MANIFEST_MODE,
            executionAuthorized: false,
            executionAttempted: false,
            permanentWritesAttempted: false,
            permanentWritesExecuted: 0,
            rollbackPerformed: false,
            restorePerformed: false,
            stateChangeApplied: false
        };
    }

    function generateManifest() {
        const session = getSessionSnapshot();
        const expectedDocuments = getExpectedDocuments();
        const writers = getRegisteredWriters();
        const registryValidation = getRegistryValidation();
        const transaction = getLatestTransaction();
        const executionPlanStatus = getOrGenerateExecutionPlan();
        const dependencyStatus = getOrGenerateDependencyAnalysis();
        const readinessStatus = getOrGenerateReadinessReport();

        const registeredWriterRecords = writers.map(function (writer) {
            return {
                writerId: writer && (writer.writerId || writer.id || writer.name) || null,
                documentId: writer && (writer.documentId || writer.permanentDocumentId || writer.id) || null,
                updateMode: writer && (writer.updateMode || writer.mode || writer.writeMode) || null,
                writerVersion: writer && (writer.writerVersion || writer.version || null)
            };
        });

        const executionOrder = extractExecutionOrder(executionPlanStatus.artifact);
        const dependencyGraph = extractDependencyGraph(dependencyStatus.artifact);

        const manifest = {
            manifestType: MANIFEST_TYPE,
            manifestVersion: MANIFEST_VERSION,
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            manifestMode: MANIFEST_MODE,
            immutable: true,
            session: {
                sessionNumber: session.sessionNumber || null,
                version: session.version || null,
                milestone: session.milestone || null,
                module: session.module || null,
                status: session.status || null
            },
            transaction: {
                available: !!transaction,
                snapshot: transaction
            },
            permanentDocuments: {
                expectedCount: expectedDocuments.length,
                expectedDocumentIds: expectedDocuments,
                registeredWriterCount: registeredWriterRecords.length,
                registeredWriters: registeredWriterRecords
            },
            registry: {
                validation: registryValidation
            },
            executionPlan: {
                available: !!executionPlanStatus.artifact,
                generatedDuringManifestCreation: executionPlanStatus.generated,
                validation: executionPlanStatus.validation,
                executionOrder: executionOrder,
                snapshot: executionPlanStatus.artifact
            },
            dependencyAnalysis: {
                available: !!dependencyStatus.artifact,
                generatedDuringManifestCreation: dependencyStatus.generated,
                validation: dependencyStatus.validation,
                dependencyGraph: dependencyGraph,
                snapshot: dependencyStatus.artifact
            },
            readiness: {
                available: !!readinessStatus.artifact,
                generatedDuringManifestCreation: readinessStatus.generated,
                validation: readinessStatus.validation,
                structurallyReady: !!(readinessStatus.artifact && readinessStatus.artifact.structurallyReady),
                snapshot: readinessStatus.artifact
            },
            integrityPlaceholders: {
                canonicalChecksumAlgorithm: "Not Implemented",
                canonicalChecksum: null,
                digitalSignatureAlgorithm: "Not Implemented",
                digitalSignature: null
            },
            safetyState: buildSafetyState(),
            accepted: false,
            authorized: false,
            requiredNextAction:
                "Review the immutable Disabled Mode manifest. Do not authorize or execute permanent documentation writes."
        };

        const validation = validateManifest(manifest);
        manifest.validationSummary = validation;
        lastManifest = deepFreeze(manifest);
        return lastManifest;
    }

    function validateManifest(manifest) {
        const candidate = isObject(manifest) ? manifest : null;
        const session = candidate && candidate.session ? candidate.session : {};
        const docs = candidate && candidate.permanentDocuments ? candidate.permanentDocuments : {};
        const registry = candidate && candidate.registry ? candidate.registry : {};
        const plan = candidate && candidate.executionPlan ? candidate.executionPlan : {};
        const dependency = candidate && candidate.dependencyAnalysis ? candidate.dependencyAnalysis : {};
        const readiness = candidate && candidate.readiness ? candidate.readiness : {};
        const safety = candidate && candidate.safetyState ? candidate.safetyState : {};

        const expected = Array.isArray(docs.expectedDocumentIds) ? docs.expectedDocumentIds : [];
        const writers = Array.isArray(docs.registeredWriters) ? docs.registeredWriters : [];
        const registeredIds = writers.map(function (writer) { return writer && writer.documentId; }).filter(Boolean);
        const executionOrder = Array.isArray(plan.executionOrder) ? plan.executionOrder : [];
        const dependencyGraph = Array.isArray(dependency.dependencyGraph) ? dependency.dependencyGraph : [];
        const dependencyIds = dependencyGraph.map(function (item) { return item && item.documentId; }).filter(Boolean);

        const registryValidation = registry.validation || {};
        const planValidation = plan.validation || {};
        const dependencyValidation = dependency.validation || {};
        const readinessValidation = readiness.validation || {};

        const expectedUnique = unique(expected).length === expected.length;
        const registeredUnique = unique(registeredIds).length === registeredIds.length;
        const executionUnique = unique(executionOrder).length === executionOrder.length;
        const dependencyUnique = unique(dependencyIds).length === dependencyIds.length;

        function sameCoverage(left, right) {
            return left.length === right.length && left.every(function (id) {
                return right.indexOf(id) !== -1;
            });
        }

        const checks = [
            makeCheck("Manifest Exists", !!candidate),
            makeCheck("Manifest Type Correct", candidate && candidate.manifestType === MANIFEST_TYPE),
            makeCheck("Manifest Version Available", candidate && !!candidate.manifestVersion),
            makeCheck("Manifest Mode Disabled", candidate && candidate.manifestMode === MANIFEST_MODE),
            makeCheck("Manifest Marked Immutable", candidate && candidate.immutable === true),
            makeCheck("Session Number Available", !!session.sessionNumber),
            makeCheck("Milestone Available", !!session.milestone),
            makeCheck("Expected Documents Present", expected.length > 0),
            makeCheck("Expected Documents Unique", expectedUnique),
            makeCheck("Registered Writers Present", writers.length > 0),
            makeCheck("Registered Document IDs Unique", registeredUnique),
            makeCheck("Registered Writers Cover Expected Documents", sameCoverage(expected, registeredIds)),
            makeCheck("Writer Registry Valid", registryValidation.valid === true || registryValidation.validRegistry === true),
            makeCheck("Execution Plan Available", plan.available === true),
            makeCheck("Execution Plan Valid", planValidation.validStructure === true),
            makeCheck("Execution Order Unique", executionUnique),
            makeCheck("Execution Order Covers Expected Documents", sameCoverage(expected, executionOrder)),
            makeCheck("Dependency Analysis Available", dependency.available === true),
            makeCheck("Dependency Analysis Valid", dependencyValidation.validStructure === true),
            makeCheck("Dependency Graph Unique", dependencyUnique),
            makeCheck("Dependency Graph Covers Expected Documents", sameCoverage(expected, dependencyIds)),
            makeCheck("Readiness Report Available", readiness.available === true),
            makeCheck("Readiness Report Valid", readinessValidation.validStructure === true),
            makeCheck("Structurally Ready", readiness.structurallyReady === true),
            makeCheck("Checksum Placeholder Present", candidate && candidate.integrityPlaceholders && Object.prototype.hasOwnProperty.call(candidate.integrityPlaceholders, "canonicalChecksum")),
            makeCheck("Signature Placeholder Present", candidate && candidate.integrityPlaceholders && Object.prototype.hasOwnProperty.call(candidate.integrityPlaceholders, "digitalSignature")),
            makeCheck("Manifest Not Accepted", candidate && candidate.accepted === false),
            makeCheck("Manifest Not Authorized", candidate && candidate.authorized === false),
            makeCheck("Execution Not Authorized", safety.executionAuthorized === false),
            makeCheck("Execution Not Attempted", safety.executionAttempted === false),
            makeCheck("Permanent Writes Not Attempted", safety.permanentWritesAttempted === false),
            makeCheck("Permanent Writes Executed Is Zero", safety.permanentWritesExecuted === 0),
            makeCheck("Rollback Not Performed", safety.rollbackPerformed === false),
            makeCheck("Restore Not Performed", safety.restorePerformed === false),
            makeCheck("State Change Not Applied", safety.stateChangeApplied === false)
        ];

        const failedChecks = checks.filter(function (check) { return !check.passed; });
        const passedChecks = checks.filter(function (check) { return check.passed; });

        return {
            validationType: VALIDATION_TYPE,
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            manifestMode: MANIFEST_MODE,
            validStructure: failedChecks.length === 0,
            accepted: false,
            authorized: false,
            passedCheckCount: passedChecks.length,
            failedCheckCount: failedChecks.length,
            passedChecks: passedChecks,
            failedChecks: failedChecks,
            checks: checks
        };
    }

    function yesNo(value) {
        return value ? "YES" : "NO";
    }

    function formatManifest(manifest) {
        const candidate = manifest || lastManifest;
        if (!candidate) {
            return "No permanent transaction manifest is available.";
        }

        const validation = validateManifest(candidate);
        const docs = candidate.permanentDocuments || {};
        const plan = candidate.executionPlan || {};
        const dependency = candidate.dependencyAnalysis || {};
        const readiness = candidate.readiness || {};
        const safety = candidate.safetyState || {};
        const lines = [];

        lines.push("TMS-OS PERMANENT TRANSACTION MANIFEST");
        lines.push("====================================================");
        lines.push("");
        lines.push("Generated At: " + candidate.generatedAt);
        lines.push("Manifest Version: " + candidate.manifestVersion);
        lines.push("Engine Version: " + candidate.engineVersion);
        lines.push("Manifest Mode: " + candidate.manifestMode);
        lines.push("Immutable: " + yesNo(candidate.immutable));
        lines.push("Session Number: " + (candidate.session.sessionNumber || "None"));
        lines.push("Milestone: " + (candidate.session.milestone || "None"));
        lines.push("Module: " + (candidate.session.module || "None"));
        lines.push("Accepted: " + yesNo(candidate.accepted));
        lines.push("Authorized: " + yesNo(candidate.authorized));
        lines.push("");

        lines.push("PERMANENT DOCUMENT COVERAGE");
        lines.push("----------------------------------------");
        lines.push("Expected Documents (" + (docs.expectedDocumentIds || []).length + "): " + ((docs.expectedDocumentIds || []).join(", ") || "None"));
        lines.push("Registered Writers (" + (docs.registeredWriters || []).length + "):");
        (docs.registeredWriters || []).forEach(function (writer) {
            lines.push("- " + writer.documentId + " | " + (writer.writerId || "Unknown Writer") + " | " + (writer.updateMode || "Unknown Mode"));
        });
        lines.push("");

        lines.push("EXECUTION ORDER");
        lines.push("----------------------------------------");
        (plan.executionOrder || []).forEach(function (documentId, index) {
            lines.push((index + 1) + ". " + documentId);
        });
        if (!(plan.executionOrder || []).length) {
            lines.push("None");
        }
        lines.push("");

        lines.push("DEPENDENCY GRAPH");
        lines.push("----------------------------------------");
        (dependency.dependencyGraph || []).forEach(function (record) {
            lines.push(record.documentId + " -> " + ((record.dependencies || []).join(", ") || "None"));
        });
        if (!(dependency.dependencyGraph || []).length) {
            lines.push("None");
        }
        lines.push("");

        lines.push("READINESS SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Readiness Available: " + yesNo(readiness.available));
        lines.push("Readiness Valid: " + yesNo(readiness.validation && readiness.validation.validStructure));
        lines.push("Structurally Ready: " + yesNo(readiness.structurallyReady));
        lines.push("");

        lines.push("INTEGRITY PLACEHOLDERS");
        lines.push("----------------------------------------");
        lines.push("Checksum Algorithm: " + candidate.integrityPlaceholders.canonicalChecksumAlgorithm);
        lines.push("Checksum: " + (candidate.integrityPlaceholders.canonicalChecksum || "Not Generated"));
        lines.push("Signature Algorithm: " + candidate.integrityPlaceholders.digitalSignatureAlgorithm);
        lines.push("Digital Signature: " + (candidate.integrityPlaceholders.digitalSignature || "Not Generated"));
        lines.push("");

        lines.push("VALIDATION SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Valid Structure: " + yesNo(validation.validStructure));
        lines.push("Passed Checks: " + validation.passedCheckCount);
        lines.push("Failed Checks: " + validation.failedCheckCount);
        validation.checks.forEach(function (check) {
            lines.push("- " + check.name + ": " + yesNo(check.passed));
        });
        lines.push("");

        lines.push("SAFETY STATE");
        lines.push("----------------------------------------");
        lines.push("Execution Authorized: " + yesNo(safety.executionAuthorized));
        lines.push("Execution Attempted: " + yesNo(safety.executionAttempted));
        lines.push("Permanent Writes Attempted: " + yesNo(safety.permanentWritesAttempted));
        lines.push("Permanent Writes Executed: " + safety.permanentWritesExecuted);
        lines.push("Rollback Performed: " + yesNo(safety.rollbackPerformed));
        lines.push("Restore Performed: " + yesNo(safety.restorePerformed));
        lines.push("State Change Applied: " + yesNo(safety.stateChangeApplied));
        lines.push("");

        lines.push("REQUIRED NEXT ACTION");
        lines.push("----------------------------------------");
        lines.push(candidate.requiredNextAction);

        return lines.join("\n");
    }

    function getLastManifest() {
        return lastManifest;
    }

    function getManifestRequirements() {
        return [
            "Session Context must be available.",
            "Document Writer Registry must be available and valid.",
            "All expected permanent document writers must be registered exactly once.",
            "Permanent Transaction Manager must be available.",
            "Expected permanent document identifiers must be available and unique.",
            "A valid execution plan must be available or generated in read-only mode.",
            "Execution order must cover every expected permanent document exactly once.",
            "A valid dependency analysis must be available or generated in read-only mode.",
            "Dependency graph must cover every expected permanent document exactly once.",
            "A valid readiness report must be available or generated in read-only mode.",
            "The readiness report must indicate structural readiness.",
            "The manifest must consolidate canonical session, transaction, registry, plan, dependency, and readiness snapshots.",
            "The manifest must be immutable after generation.",
            "Checksum and digital-signature placeholders must be present but not implemented.",
            "Manifest Mode must remain Disabled.",
            "The manifest must not be accepted or authorized.",
            "Execution and permanent writes must not be attempted.",
            "Rollback, restore, and permanent state changes must not occur."
        ];
    }

    global.TMSPermanentTransactionManifestGenerator = Object.freeze({
        engineVersion: ENGINE_VERSION,
        manifestVersion: MANIFEST_VERSION,
        manifestMode: MANIFEST_MODE,
        generateManifest: generateManifest,
        validateManifest: validateManifest,
        formatManifest: formatManifest,
        getLastManifest: getLastManifest,
        getManifestRequirements: getManifestRequirements
    });
})(window);
