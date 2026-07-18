(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const READINESS_MODE = "Disabled";
    const REPORT_TYPE = "TMS-OS Permanent Transaction Readiness Report";
    const VALIDATION_TYPE = "TMS-OS Permanent Transaction Readiness Validation";

    let lastReadinessReport = null;

    function isObject(value) {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    function safeCall(target, methodName, fallbackValue) {
        try {
            if (target && typeof target[methodName] === "function") {
                return target[methodName]();
            }
        } catch (error) {
            console.warn(
                "TMS Permanent Transaction Readiness Analyzer could not call " + methodName + ".",
                error
            );
        }
        return fallbackValue;
    }

    function getSessionSnapshot() {
        return safeCall(global.TMSSessionContext, "getSnapshot", {}) || {};
    }

    function getRegistryValidation() {
        return safeCall(global.TMSDocumentWriterRegistry, "validateRegistry", null);
    }

    function getRegisteredWriters() {
        const writers = safeCall(global.TMSDocumentWriterRegistry, "getRegisteredWriters", []);
        return Array.isArray(writers) ? writers : [];
    }

    function getExpectedDocuments() {
        const documents = safeCall(global.TMSPermanentTransactionManager, "getExpectedDocuments", []);
        return Array.isArray(documents) ? documents.slice() : [];
    }

    function generateOrReadExecutionPlan() {
        const generator = global.TMSPermanentTransactionExecutionPlanGenerator;
        if (!generator) {
            return {
                plan: null,
                validation: null,
                generatedDuringReadinessCheck: false
            };
        }

        let plan = safeCall(generator, "getLastExecutionPlan", null);
        let generatedDuringReadinessCheck = false;

        if (!plan && typeof generator.generateExecutionPlan === "function") {
            try {
                plan = generator.generateExecutionPlan();
                generatedDuringReadinessCheck = true;
            } catch (error) {
                console.warn("Readiness Analyzer could not generate an execution plan.", error);
            }
        }

        let validation = null;
        if (plan && typeof generator.validateExecutionPlan === "function") {
            try {
                validation = generator.validateExecutionPlan(plan);
            } catch (error) {
                console.warn("Readiness Analyzer could not validate the execution plan.", error);
            }
        }

        return {
            plan: plan || null,
            validation: validation || null,
            generatedDuringReadinessCheck: generatedDuringReadinessCheck
        };
    }

    function generateOrReadDependencyAnalysis() {
        const analyzer = global.TMSPermanentTransactionDependencyAnalyzer;
        if (!analyzer) {
            return {
                analysis: null,
                validation: null,
                generatedDuringReadinessCheck: false
            };
        }

        let analysis = safeCall(analyzer, "getLastDependencyAnalysis", null);
        let generatedDuringReadinessCheck = false;

        if (!analysis && typeof analyzer.generateDependencyAnalysis === "function") {
            try {
                analysis = analyzer.generateDependencyAnalysis();
                generatedDuringReadinessCheck = true;
            } catch (error) {
                console.warn("Readiness Analyzer could not generate a dependency analysis.", error);
            }
        }

        let validation = null;
        if (analysis && typeof analyzer.validateDependencyAnalysis === "function") {
            try {
                validation = analyzer.validateDependencyAnalysis(analysis);
            } catch (error) {
                console.warn("Readiness Analyzer could not validate dependency analysis.", error);
            }
        }

        return {
            analysis: analysis || null,
            validation: validation || null,
            generatedDuringReadinessCheck: generatedDuringReadinessCheck
        };
    }

    function buildModuleStatus() {
        return {
            sessionContextAvailable: !!global.TMSSessionContext,
            writerRegistryAvailable: !!global.TMSDocumentWriterRegistry,
            transactionManagerAvailable: !!global.TMSPermanentTransactionManager,
            executionPlanGeneratorAvailable: !!global.TMSPermanentTransactionExecutionPlanGenerator,
            dependencyAnalyzerAvailable: !!global.TMSPermanentTransactionDependencyAnalyzer
        };
    }

    function buildSafetyState() {
        return {
            readinessMode: READINESS_MODE,
            executionAuthorized: false,
            executionAttempted: false,
            permanentWritesAttempted: false,
            permanentWritesExecuted: 0,
            rollbackPerformed: false,
            restorePerformed: false,
            stateChangeApplied: false
        };
    }

    function generateReadinessReport() {
        const snapshot = getSessionSnapshot();
        const moduleStatus = buildModuleStatus();
        const registryValidation = getRegistryValidation();
        const registeredWriters = getRegisteredWriters();
        const expectedDocuments = getExpectedDocuments();
        const executionPlanStatus = generateOrReadExecutionPlan();
        const dependencyStatus = generateOrReadDependencyAnalysis();
        const safetyState = buildSafetyState();

        const writerDocumentIds = registeredWriters
            .map(function (writer) {
                return writer && (writer.documentId || writer.permanentDocumentId || writer.id);
            })
            .filter(Boolean);

        lastReadinessReport = {
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            readinessMode: READINESS_MODE,
            sessionNumber: snapshot.sessionNumber || null,
            version: snapshot.version || null,
            milestone: snapshot.milestone || null,
            module: snapshot.module || null,
            moduleStatus: moduleStatus,
            registry: {
                validation: registryValidation,
                registeredWriterCount: registeredWriters.length,
                registeredDocumentIds: writerDocumentIds
            },
            transactionManager: {
                expectedDocumentCount: expectedDocuments.length,
                expectedDocuments: expectedDocuments
            },
            executionPlan: {
                available: !!executionPlanStatus.plan,
                generatedDuringReadinessCheck: executionPlanStatus.generatedDuringReadinessCheck,
                plan: executionPlanStatus.plan,
                validation: executionPlanStatus.validation
            },
            dependencyAnalysis: {
                available: !!dependencyStatus.analysis,
                generatedDuringReadinessCheck: dependencyStatus.generatedDuringReadinessCheck,
                analysis: dependencyStatus.analysis,
                validation: dependencyStatus.validation
            },
            safetyState: safetyState,
            structurallyReady: false,
            accepted: false,
            authorized: false,
            requiredNextAction:
                "Review the Disabled Mode readiness report. Do not authorize or execute permanent documentation writes."
        };

        const validation = validateReadinessReport(lastReadinessReport);
        lastReadinessReport.structurallyReady = validation.validStructure;
        lastReadinessReport.validationSummary = validation;

        return lastReadinessReport;
    }

    function makeCheck(name, passed) {
        return {
            name: name,
            passed: !!passed
        };
    }

    function validateReadinessReport(report) {
        const candidate = isObject(report) ? report : null;
        const moduleStatus = candidate && candidate.moduleStatus ? candidate.moduleStatus : {};
        const registry = candidate && candidate.registry ? candidate.registry : {};
        const transactionManager = candidate && candidate.transactionManager ? candidate.transactionManager : {};
        const executionPlan = candidate && candidate.executionPlan ? candidate.executionPlan : {};
        const dependencyAnalysis = candidate && candidate.dependencyAnalysis ? candidate.dependencyAnalysis : {};
        const safetyState = candidate && candidate.safetyState ? candidate.safetyState : {};
        const registryValidation = registry.validation || {};
        const executionValidation = executionPlan.validation || {};
        const dependencyValidation = dependencyAnalysis.validation || {};

        const expectedDocuments = Array.isArray(transactionManager.expectedDocuments)
            ? transactionManager.expectedDocuments
            : [];
        const registeredDocumentIds = Array.isArray(registry.registeredDocumentIds)
            ? registry.registeredDocumentIds
            : [];

        const expectedUnique = new Set(expectedDocuments).size === expectedDocuments.length;
        const registeredUnique = new Set(registeredDocumentIds).size === registeredDocumentIds.length;
        const registryCoversExpected = expectedDocuments.every(function (documentId) {
            return registeredDocumentIds.indexOf(documentId) !== -1;
        });

        const checks = [
            makeCheck("Readiness Report Exists", !!candidate),
            makeCheck("Readiness Mode Disabled", candidate && candidate.readinessMode === READINESS_MODE),
            makeCheck("Session Context Available", moduleStatus.sessionContextAvailable),
            makeCheck("Writer Registry Available", moduleStatus.writerRegistryAvailable),
            makeCheck("Transaction Manager Available", moduleStatus.transactionManagerAvailable),
            makeCheck("Execution Plan Generator Available", moduleStatus.executionPlanGeneratorAvailable),
            makeCheck("Dependency Analyzer Available", moduleStatus.dependencyAnalyzerAvailable),
            makeCheck("Session Number Available", candidate && !!candidate.sessionNumber),
            makeCheck("Expected Documents Present", expectedDocuments.length > 0),
            makeCheck("Expected Documents Unique", expectedUnique),
            makeCheck("Registered Writers Present", Number(registry.registeredWriterCount) > 0),
            makeCheck("Registered Documents Unique", registeredUnique),
            makeCheck("Registered Writers Cover Expected Documents", registryCoversExpected),
            makeCheck(
                "Writer Registry Valid",
                registryValidation.valid === true || registryValidation.validRegistry === true
            ),
            makeCheck("Execution Plan Available", executionPlan.available === true),
            makeCheck("Execution Plan Valid", executionValidation.validStructure === true),
            makeCheck("Dependency Analysis Available", dependencyAnalysis.available === true),
            makeCheck("Dependency Analysis Valid", dependencyValidation.validStructure === true),
            makeCheck("Execution Not Authorized", safetyState.executionAuthorized === false),
            makeCheck("Execution Not Attempted", safetyState.executionAttempted === false),
            makeCheck("Permanent Writes Not Attempted", safetyState.permanentWritesAttempted === false),
            makeCheck("Permanent Writes Executed Is Zero", safetyState.permanentWritesExecuted === 0),
            makeCheck("Rollback Not Performed", safetyState.rollbackPerformed === false),
            makeCheck("Restore Not Performed", safetyState.restorePerformed === false),
            makeCheck("State Change Not Applied", safetyState.stateChangeApplied === false),
            makeCheck("Readiness Not Accepted", candidate && candidate.accepted === false),
            makeCheck("Readiness Not Authorized", candidate && candidate.authorized === false)
        ];

        const failedChecks = checks.filter(function (check) {
            return !check.passed;
        });

        return {
            reportType: VALIDATION_TYPE,
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            readinessMode: READINESS_MODE,
            validStructure: failedChecks.length === 0,
            accepted: false,
            authorized: false,
            passedCheckCount: checks.length - failedChecks.length,
            failedCheckCount: failedChecks.length,
            checks: checks,
            failedChecks: failedChecks,
            safetyState: buildSafetyState()
        };
    }

    function yesNo(value) {
        return value ? "YES" : "NO";
    }

    function formatChecks(checks) {
        return checks
            .map(function (check) {
                return "- " + check.name + ": " + yesNo(check.passed);
            })
            .join("\n");
    }

    function formatReadinessReport(report) {
        const candidate = isObject(report) ? report : lastReadinessReport;
        if (!candidate) {
            return "No readiness report is available.";
        }

        const validation = candidate.validationSummary || validateReadinessReport(candidate);
        const modules = candidate.moduleStatus || {};
        const registry = candidate.registry || {};
        const transactionManager = candidate.transactionManager || {};
        const executionPlan = candidate.executionPlan || {};
        const dependencyAnalysis = candidate.dependencyAnalysis || {};
        const safety = candidate.safetyState || {};

        const expectedDocuments = Array.isArray(transactionManager.expectedDocuments)
            ? transactionManager.expectedDocuments
            : [];
        const registeredDocuments = Array.isArray(registry.registeredDocumentIds)
            ? registry.registeredDocumentIds
            : [];

        return [
            "TMS-OS PERMANENT TRANSACTION READINESS REPORT",
            "====================================================",
            "",
            "Generated At: " + candidate.generatedAt,
            "Session Number: " + (candidate.sessionNumber || "Unknown"),
            "Milestone: " + (candidate.milestone || "Unknown"),
            "Module: " + (candidate.module || "Unknown"),
            "Engine Version: " + candidate.engineVersion,
            "Readiness Mode: " + candidate.readinessMode,
            "Structurally Ready: " + yesNo(candidate.structurallyReady),
            "Accepted: " + yesNo(candidate.accepted),
            "Authorized: " + yesNo(candidate.authorized),
            "",
            "MODULE AVAILABILITY",
            "----------------------------------------",
            "Session Context: " + yesNo(modules.sessionContextAvailable),
            "Writer Registry: " + yesNo(modules.writerRegistryAvailable),
            "Transaction Manager: " + yesNo(modules.transactionManagerAvailable),
            "Execution Plan Generator: " + yesNo(modules.executionPlanGeneratorAvailable),
            "Dependency Analyzer: " + yesNo(modules.dependencyAnalyzerAvailable),
            "",
            "PERMANENT DOCUMENT COVERAGE",
            "----------------------------------------",
            "Expected Documents (" + expectedDocuments.length + "): " +
                (expectedDocuments.length ? expectedDocuments.join(", ") : "None"),
            "Registered Documents (" + registeredDocuments.length + "): " +
                (registeredDocuments.length ? registeredDocuments.join(", ") : "None"),
            "",
            "PREREQUISITE VALIDATION",
            "----------------------------------------",
            "Writer Registry Valid: " + yesNo(
                !!registry.validation &&
                (registry.validation.valid === true || registry.validation.validRegistry === true)
            ),
            "Execution Plan Available: " + yesNo(executionPlan.available),
            "Execution Plan Valid: " + yesNo(
                !!executionPlan.validation && executionPlan.validation.validStructure === true
            ),
            "Dependency Analysis Available: " + yesNo(dependencyAnalysis.available),
            "Dependency Analysis Valid: " + yesNo(
                !!dependencyAnalysis.validation &&
                dependencyAnalysis.validation.validStructure === true
            ),
            "",
            "VALIDATION SUMMARY",
            "----------------------------------------",
            "Valid Structure: " + yesNo(validation.validStructure),
            "Accepted: " + yesNo(validation.accepted),
            "Authorized: " + yesNo(validation.authorized),
            "Passed Checks: " + validation.passedCheckCount,
            "Failed Checks: " + validation.failedCheckCount,
            formatChecks(validation.checks || []),
            "",
            "SAFETY STATE",
            "----------------------------------------",
            "Execution Authorized: " + yesNo(safety.executionAuthorized),
            "Execution Attempted: " + yesNo(safety.executionAttempted),
            "Permanent Writes Attempted: " + yesNo(safety.permanentWritesAttempted),
            "Permanent Writes Executed: " + (safety.permanentWritesExecuted || 0),
            "Rollback Performed: " + yesNo(safety.rollbackPerformed),
            "Restore Performed: " + yesNo(safety.restorePerformed),
            "State Change Applied: " + yesNo(safety.stateChangeApplied),
            "",
            "REQUIRED NEXT ACTION",
            "----------------------------------------",
            candidate.requiredNextAction
        ].join("\n");
    }

    function getReadinessRequirements() {
        return [
            "Session Context must be available.",
            "Document Writer Registry must be available and valid.",
            "All expected permanent document writers must be registered exactly once.",
            "Permanent Transaction Manager must be available.",
            "Expected permanent document identifiers must be available and unique.",
            "Permanent Transaction Execution Plan Generator must be available.",
            "A valid execution plan must be available or generated in read-only mode.",
            "Permanent Transaction Dependency Analyzer must be available.",
            "A valid dependency analysis must be available or generated in read-only mode.",
            "Readiness Mode must remain Disabled.",
            "Readiness must not authorize execution.",
            "Execution must not be attempted.",
            "Permanent writes must not be attempted or executed.",
            "Rollback and restore must not be performed.",
            "Permanent documentation state changes must not be applied."
        ];
    }

    global.TMSPermanentTransactionReadinessAnalyzer = Object.freeze({
        engineVersion: ENGINE_VERSION,
        readinessMode: READINESS_MODE,
        generateReadinessReport: generateReadinessReport,
        validateReadinessReport: validateReadinessReport,
        formatReadinessReport: formatReadinessReport,
        getLastReadinessReport: function () {
            return lastReadinessReport;
        },
        getReadinessRequirements: getReadinessRequirements
    });
})(window);
