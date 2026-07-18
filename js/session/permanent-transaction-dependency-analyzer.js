(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.1";
    const ANALYSIS_MODE = "Disabled";
    let lastDependencyAnalysis = null;

    const DEFAULT_DEPENDENCIES = Object.freeze({
        "WS-HIST-001": [],
        "STATE-001": ["WS-HIST-001"],
        "DOC-STATE-001": ["STATE-001"],
        "DEC-LOG-001": ["WS-HIST-001"],
        "MILE-HIST-001": ["DEC-LOG-001", "DOC-STATE-001"]
    });

    const REQUIREMENTS = Object.freeze([
        "Permanent Transaction Execution Plan Generator must be available.",
        "Permanent Transaction Manager must be available.",
        "An execution plan must be supplied or generated.",
        "Every expected permanent document must appear exactly once in execution order.",
        "Every declared dependency must reference an expected permanent document.",
        "A document must not depend on itself.",
        "Duplicate dependency declarations are not permitted.",
        "Circular dependencies are not permitted.",
        "Execution order must place every dependency before its dependent document.",
        "Analysis Mode must remain Disabled.",
        "Execution must not be authorized or attempted.",
        "Permanent writes, rollback, restore, and state changes must not occur."
    ]);

    function safeArray(value) {
        return Array.isArray(value) ? value.slice() : [];
    }

    function getSessionSnapshot() {
        try {
            if (global.TMSSessionContext && typeof global.TMSSessionContext.getSnapshot === "function") {
                return global.TMSSessionContext.getSnapshot() || {};
            }
        } catch (error) {
            console.warn("Dependency Analyzer could not read TMSSessionContext.", error);
        }
        return {};
    }

    function getExpectedDocuments() {
        if (!global.TMSPermanentTransactionManager ||
            typeof global.TMSPermanentTransactionManager.getExpectedDocuments !== "function") {
            return [];
        }
        return safeArray(global.TMSPermanentTransactionManager.getExpectedDocuments());
    }

    function generateOrUseExecutionPlan(plan) {
        if (plan) {
            return plan;
        }
        if (!global.TMSPermanentTransactionExecutionPlanGenerator ||
            typeof global.TMSPermanentTransactionExecutionPlanGenerator.generateExecutionPlan !== "function") {
            return null;
        }
        return global.TMSPermanentTransactionExecutionPlanGenerator.generateExecutionPlan();
    }

    function normalizeDependencies(expectedDocuments, customDependencies) {
        const source = customDependencies && typeof customDependencies === "object"
            ? customDependencies
            : DEFAULT_DEPENDENCIES;

        return expectedDocuments.reduce((result, documentId) => {
            result[documentId] = safeArray(source[documentId]);
            return result;
        }, {});
    }

    function detectCycle(dependencyMap) {
        const visiting = new Set();
        const visited = new Set();
        const path = [];
        let cyclePath = [];

        function visit(node) {
            if (visiting.has(node)) {
                const startIndex = path.indexOf(node);
                cyclePath = path.slice(startIndex).concat(node);
                return true;
            }
            if (visited.has(node)) {
                return false;
            }

            visiting.add(node);
            path.push(node);

            const dependencies = safeArray(dependencyMap[node]);
            for (const dependency of dependencies) {
                if (visit(dependency)) {
                    return true;
                }
            }

            path.pop();
            visiting.delete(node);
            visited.add(node);
            return false;
        }

        for (const node of Object.keys(dependencyMap)) {
            if (visit(node)) {
                return { hasCycle: true, cyclePath };
            }
        }

        return { hasCycle: false, cyclePath: [] };
    }

    function generateDependencyAnalysis(executionPlan, options) {
        const resolvedPlan = generateOrUseExecutionPlan(executionPlan);
        const expectedDocuments = getExpectedDocuments();
        const planSteps = resolvedPlan && Array.isArray(resolvedPlan.executionSteps)
            ? resolvedPlan.executionSteps
            : (resolvedPlan && Array.isArray(resolvedPlan.executionOrder)
                ? resolvedPlan.executionOrder
                : []);
        const executionOrder = planSteps
            .map((step) => typeof step === "string" ? step : step && step.documentId)
            .filter(Boolean);
        const dependencyMap = normalizeDependencies(
            expectedDocuments,
            options && options.dependencies
        );
        const session = getSessionSnapshot();
        const position = new Map(executionOrder.map((documentId, index) => [documentId, index]));

        const dependencyRecords = expectedDocuments.map((documentId) => {
            const dependencies = safeArray(dependencyMap[documentId]);
            const duplicateDependencies = dependencies.filter(
                (value, index) => dependencies.indexOf(value) !== index
            );
            const missingDependencies = dependencies.filter(
                (dependency) => !expectedDocuments.includes(dependency)
            );
            const selfDependency = dependencies.includes(documentId);
            const orderViolations = dependencies.filter((dependency) => {
                if (!position.has(documentId) || !position.has(dependency)) {
                    return true;
                }
                return position.get(dependency) >= position.get(documentId);
            });

            return {
                documentId,
                dependencies,
                duplicateDependencies: Array.from(new Set(duplicateDependencies)),
                missingDependencies,
                selfDependency,
                orderViolations,
                dependencyCount: dependencies.length,
                dependencySafe:
                    duplicateDependencies.length === 0 &&
                    missingDependencies.length === 0 &&
                    !selfDependency &&
                    orderViolations.length === 0
            };
        });

        const cycle = detectCycle(dependencyMap);

        const analysis = {
            reportType: "TMS-OS Permanent Transaction Dependency Analysis",
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            analysisMode: ANALYSIS_MODE,
            sessionNumber: session.sessionNumber || null,
            milestone: session.milestone || null,
            executionPlanAvailable: Boolean(resolvedPlan),
            executionPlanEngineVersion: resolvedPlan ? resolvedPlan.engineVersion || null : null,
            expectedDocuments,
            executionOrder,
            dependencyMap,
            dependencyRecords,
            circularDependencyDetected: cycle.hasCycle,
            circularDependencyPath: cycle.cyclePath,
            executionAuthorized: false,
            executionAttempted: false,
            permanentWritesAttempted: false,
            permanentWritesExecuted: 0,
            rollbackPerformed: false,
            restorePerformed: false,
            stateChangeApplied: false,
            requiredNextAction:
                "Review the Disabled Mode dependency analysis. Do not authorize or execute permanent documentation writes."
        };

        analysis.validation = validateDependencyAnalysis(analysis);
        analysis.accepted = false;
        lastDependencyAnalysis = analysis;
        return analysis;
    }

    function validateDependencyAnalysis(analysis) {
        const target = analysis || lastDependencyAnalysis;
        const expectedDocuments = target ? safeArray(target.expectedDocuments) : [];
        const executionOrder = target ? safeArray(target.executionOrder) : [];
        const records = target ? safeArray(target.dependencyRecords) : [];

        const uniqueExecutionOrder = new Set(executionOrder);
        const checks = [
            { name: "Analysis Exists", passed: Boolean(target) },
            { name: "Analysis Mode Disabled", passed: Boolean(target && target.analysisMode === ANALYSIS_MODE) },
            { name: "Execution Plan Available", passed: Boolean(target && target.executionPlanAvailable) },
            { name: "Expected Documents Present", passed: expectedDocuments.length > 0 },
            { name: "Execution Order Count Matches Expected Documents", passed: executionOrder.length === expectedDocuments.length },
            { name: "Execution Documents Are Unique", passed: uniqueExecutionOrder.size === executionOrder.length },
            { name: "Execution Order Covers Expected Documents", passed: expectedDocuments.every((id) => uniqueExecutionOrder.has(id)) },
            { name: "Dependency Records Cover Expected Documents", passed: records.length === expectedDocuments.length },
            { name: "No Missing Dependencies", passed: records.every((record) => record.missingDependencies.length === 0) },
            { name: "No Self Dependencies", passed: records.every((record) => !record.selfDependency) },
            { name: "No Duplicate Dependencies", passed: records.every((record) => record.duplicateDependencies.length === 0) },
            { name: "No Circular Dependencies", passed: Boolean(target && !target.circularDependencyDetected) },
            { name: "Execution Order Satisfies Dependencies", passed: records.every((record) => record.orderViolations.length === 0) },
            { name: "Execution Not Authorized", passed: Boolean(target && target.executionAuthorized === false) },
            { name: "Execution Not Attempted", passed: Boolean(target && target.executionAttempted === false) },
            { name: "Permanent Writes Not Attempted", passed: Boolean(target && target.permanentWritesAttempted === false) },
            { name: "Permanent Writes Executed Is Zero", passed: Boolean(target && target.permanentWritesExecuted === 0) },
            { name: "Rollback Not Performed", passed: Boolean(target && target.rollbackPerformed === false) },
            { name: "Restore Not Performed", passed: Boolean(target && target.restorePerformed === false) },
            { name: "State Change Not Applied", passed: Boolean(target && target.stateChangeApplied === false) }
        ];

        const passedChecks = checks.filter((check) => check.passed).length;
        const failedChecks = checks.length - passedChecks;

        return {
            reportType: "TMS-OS Permanent Transaction Dependency Analysis Validation",
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            analysisMode: ANALYSIS_MODE,
            validStructure: failedChecks === 0,
            accepted: false,
            authorized: false,
            passedChecks,
            failedChecks,
            checks
        };
    }

    function formatDependencyAnalysis(analysis) {
        const target = analysis || lastDependencyAnalysis;
        if (!target) {
            return "No dependency analysis is available.";
        }

        const validation = validateDependencyAnalysis(target);
        const lines = [
            "TMS-OS PERMANENT TRANSACTION DEPENDENCY ANALYSIS",
            "====================================================",
            "",
            `Generated At: ${target.generatedAt}`,
            `Session Number: ${target.sessionNumber || "Not Available"}`,
            `Milestone: ${target.milestone || "Not Available"}`,
            `Engine Version: ${target.engineVersion}`,
            `Analysis Mode: ${target.analysisMode}`,
            "Accepted: NO",
            "Authorized: NO",
            "",
            "EXECUTION ORDER",
            "----------------------------------------"
        ];

        target.executionOrder.forEach((documentId, index) => {
            lines.push(`${index + 1}. ${documentId}`);
        });

        lines.push("", "DEPENDENCY ANALYSIS", "----------------------------------------");

        target.dependencyRecords.forEach((record) => {
            lines.push(`${record.documentId}`);
            lines.push(`   Dependencies: ${record.dependencies.length ? record.dependencies.join(", ") : "None"}`);
            lines.push(`   Missing Dependencies: ${record.missingDependencies.length ? record.missingDependencies.join(", ") : "None"}`);
            lines.push(`   Duplicate Dependencies: ${record.duplicateDependencies.length ? record.duplicateDependencies.join(", ") : "None"}`);
            lines.push(`   Self Dependency: ${record.selfDependency ? "YES" : "NO"}`);
            lines.push(`   Order Violations: ${record.orderViolations.length ? record.orderViolations.join(", ") : "None"}`);
            lines.push(`   Dependency Safe: ${record.dependencySafe ? "YES" : "NO"}`);
        });

        lines.push(
            "",
            "CYCLE ANALYSIS",
            "----------------------------------------",
            `Circular Dependency Detected: ${target.circularDependencyDetected ? "YES" : "NO"}`,
            `Circular Dependency Path: ${target.circularDependencyPath.length ? target.circularDependencyPath.join(" -> ") : "None"}`,
            "",
            "VALIDATION SUMMARY",
            "----------------------------------------",
            `Valid Structure: ${validation.validStructure ? "YES" : "NO"}`,
            "Accepted: NO",
            "Authorized: NO",
            `Passed Checks: ${validation.passedChecks}`,
            `Failed Checks: ${validation.failedChecks}`
        );

        validation.checks.forEach((check) => {
            lines.push(`- ${check.name}: ${check.passed ? "YES" : "NO"}`);
        });

        lines.push(
            "",
            "SAFETY STATE",
            "----------------------------------------",
            "Execution Authorized: NO",
            "Execution Attempted: NO",
            "Permanent Writes Attempted: NO",
            "Permanent Writes Executed: 0",
            "Rollback Performed: NO",
            "Restore Performed: NO",
            "State Change Applied: NO",
            "",
            "REQUIRED NEXT ACTION",
            "----------------------------------------",
            target.requiredNextAction
        );

        return lines.join("\n");
    }

    function getLastDependencyAnalysis() {
        return lastDependencyAnalysis;
    }

    function getDependencyRequirements() {
        return REQUIREMENTS.slice();
    }

    global.TMSPermanentTransactionDependencyAnalyzer = Object.freeze({
        engineVersion: ENGINE_VERSION,
        analysisMode: ANALYSIS_MODE,
        generateDependencyAnalysis,
        validateDependencyAnalysis,
        formatDependencyAnalysis,
        getLastDependencyAnalysis,
        getDependencyRequirements
    });
})(window);
