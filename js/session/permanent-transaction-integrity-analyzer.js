(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const INTEGRITY_MODE = "Disabled";
    const REPORT_TYPE = "TMS-OS Permanent Transaction Integrity Analysis";
    const VALIDATION_TYPE = "TMS-OS Permanent Transaction Integrity Analysis Validation";

    let lastIntegrityAnalysis = null;

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
            console.warn("Integrity Analyzer could not clone a value.", error);
            return null;
        }
    }

    function safeCall(target, methodName, fallbackValue) {
        try {
            if (target && typeof target[methodName] === "function") {
                return target[methodName]();
            }
        } catch (error) {
            console.warn("Integrity Analyzer could not call " + methodName + ".", error);
        }
        return fallbackValue;
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

    function sameCoverage(left, right) {
        return left.length === right.length && left.every(function (value) {
            return right.indexOf(value) !== -1;
        });
    }

    function getOrGenerateManifest() {
        const generator = global.TMSPermanentTransactionManifestGenerator;
        if (!generator) {
            return {
                artifact: null,
                validation: null,
                generated: false
            };
        }

        let artifact = safeCall(generator, "getLastManifest", null);
        let generated = false;

        if (!artifact && typeof generator.generateManifest === "function") {
            try {
                artifact = generator.generateManifest();
                generated = true;
            } catch (error) {
                console.warn("Integrity Analyzer could not generate a manifest.", error);
            }
        }

        let validation = null;
        if (artifact && typeof generator.validateManifest === "function") {
            try {
                validation = generator.validateManifest(artifact);
            } catch (error) {
                console.warn("Integrity Analyzer could not validate the manifest.", error);
            }
        }

        return {
            artifact: clone(artifact),
            validation: clone(validation),
            generated: generated
        };
    }

    function buildSafetyState() {
        return {
            integrityMode: INTEGRITY_MODE,
            executionAuthorized: false,
            executionAttempted: false,
            permanentWritesAttempted: false,
            permanentWritesExecuted: 0,
            rollbackPerformed: false,
            restorePerformed: false,
            stateChangeApplied: false
        };
    }

    function analyzeManifest(manifest, manifestValidation, generatedDuringAnalysis) {
        const candidate = isObject(manifest) ? manifest : {};
        const session = isObject(candidate.session) ? candidate.session : {};
        const docs = isObject(candidate.permanentDocuments) ? candidate.permanentDocuments : {};
        const registry = isObject(candidate.registry) ? candidate.registry : {};
        const plan = isObject(candidate.executionPlan) ? candidate.executionPlan : {};
        const dependency = isObject(candidate.dependencyAnalysis) ? candidate.dependencyAnalysis : {};
        const readiness = isObject(candidate.readiness) ? candidate.readiness : {};
        const placeholders = isObject(candidate.integrityPlaceholders) ? candidate.integrityPlaceholders : {};
        const manifestSafety = isObject(candidate.safetyState) ? candidate.safetyState : {};

        const expectedIds = Array.isArray(docs.expectedDocumentIds) ? docs.expectedDocumentIds.slice() : [];
        const writers = Array.isArray(docs.registeredWriters) ? docs.registeredWriters.slice() : [];
        const writerIds = writers.map(function (writer) {
            return writer && writer.documentId;
        }).filter(Boolean);
        const executionOrder = Array.isArray(plan.executionOrder) ? plan.executionOrder.slice() : [];
        const graph = Array.isArray(dependency.dependencyGraph) ? dependency.dependencyGraph.slice() : [];
        const graphIds = graph.map(function (record) {
            return record && record.documentId;
        }).filter(Boolean);
        const allDependencyReferences = [];

        graph.forEach(function (record) {
            const dependencies = Array.isArray(record && record.dependencies) ? record.dependencies : [];
            dependencies.forEach(function (dependencyId) {
                allDependencyReferences.push(dependencyId);
            });
        });

        const orphanedDependencyReferences = unique(allDependencyReferences.filter(function (dependencyId) {
            return expectedIds.indexOf(dependencyId) === -1;
        }));

        const duplicateExpectedIds = expectedIds.filter(function (id, index) {
            return expectedIds.indexOf(id) !== index;
        });
        const duplicateWriterDocumentIds = writerIds.filter(function (id, index) {
            return writerIds.indexOf(id) !== index;
        });
        const duplicateExecutionIds = executionOrder.filter(function (id, index) {
            return executionOrder.indexOf(id) !== index;
        });
        const duplicateGraphIds = graphIds.filter(function (id, index) {
            return graphIds.indexOf(id) !== index;
        });

        const crossReferenceSummary = {
            expectedDocumentsMatchRegisteredWriters: sameCoverage(expectedIds, writerIds),
            expectedDocumentsMatchExecutionOrder: sameCoverage(expectedIds, executionOrder),
            expectedDocumentsMatchDependencyGraph: sameCoverage(expectedIds, graphIds),
            orphanedDependencyReferences: orphanedDependencyReferences,
            duplicateExpectedDocumentIds: unique(duplicateExpectedIds),
            duplicateWriterDocumentIds: unique(duplicateWriterDocumentIds),
            duplicateExecutionDocumentIds: unique(duplicateExecutionIds),
            duplicateDependencyGraphDocumentIds: unique(duplicateGraphIds)
        };

        const metadataSummary = {
            manifestTypeAvailable: !!candidate.manifestType,
            manifestVersionAvailable: !!candidate.manifestVersion,
            engineVersionAvailable: !!candidate.engineVersion,
            generatedAtAvailable: !!candidate.generatedAt,
            sessionNumberAvailable: !!session.sessionNumber,
            milestoneAvailable: !!session.milestone,
            moduleAvailable: !!session.module,
            manifestMarkedImmutable: candidate.immutable === true,
            manifestModeDisabled: candidate.manifestMode === INTEGRITY_MODE,
            manifestNotAccepted: candidate.accepted === false,
            manifestNotAuthorized: candidate.authorized === false
        };

        const prerequisiteSummary = {
            manifestAvailable: !!manifest,
            generatedDuringIntegrityAnalysis: !!generatedDuringAnalysis,
            manifestValidationAvailable: !!manifestValidation,
            manifestValidationValid: !!(manifestValidation && manifestValidation.validStructure === true),
            registryValidationAvailable: !!registry.validation,
            registryValidationValid: !!(registry.validation && (registry.validation.valid === true || registry.validation.validRegistry === true)),
            executionPlanAvailable: plan.available === true,
            executionPlanValid: !!(plan.validation && plan.validation.validStructure === true),
            dependencyAnalysisAvailable: dependency.available === true,
            dependencyAnalysisValid: !!(dependency.validation && dependency.validation.validStructure === true),
            readinessReportAvailable: readiness.available === true,
            readinessReportValid: !!(readiness.validation && readiness.validation.validStructure === true),
            structurallyReady: readiness.structurallyReady === true
        };

        const placeholderSummary = {
            checksumAlgorithmPlaceholderPresent: Object.prototype.hasOwnProperty.call(placeholders, "canonicalChecksumAlgorithm"),
            checksumPlaceholderPresent: Object.prototype.hasOwnProperty.call(placeholders, "canonicalChecksum"),
            signatureAlgorithmPlaceholderPresent: Object.prototype.hasOwnProperty.call(placeholders, "digitalSignatureAlgorithm"),
            signaturePlaceholderPresent: Object.prototype.hasOwnProperty.call(placeholders, "digitalSignature"),
            checksumNotImplemented: placeholders.canonicalChecksum === null,
            signatureNotImplemented: placeholders.digitalSignature === null
        };

        return {
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            integrityMode: INTEGRITY_MODE,
            sessionNumber: session.sessionNumber || null,
            milestone: session.milestone || null,
            module: "Permanent Transaction Integrity Analyzer",
            manifest: {
                available: !!manifest,
                generatedDuringIntegrityAnalysis: !!generatedDuringAnalysis,
                validation: clone(manifestValidation),
                snapshot: clone(manifest)
            },
            metadataSummary: metadataSummary,
            prerequisiteSummary: prerequisiteSummary,
            documentCoverage: {
                expectedDocumentIds: expectedIds,
                registeredWriterDocumentIds: writerIds,
                executionOrder: executionOrder,
                dependencyGraphDocumentIds: graphIds
            },
            crossReferenceSummary: crossReferenceSummary,
            placeholderSummary: placeholderSummary,
            manifestSafetyState: clone(manifestSafety),
            safetyState: buildSafetyState(),
            accepted: false,
            authorized: false,
            requiredNextAction:
                "Review the Disabled Mode integrity analysis. Do not authorize or execute permanent documentation writes."
        };
    }

    function generateIntegrityAnalysis(manifest) {
        let artifact = manifest || null;
        let validation = null;
        let generated = false;

        if (!artifact) {
            const status = getOrGenerateManifest();
            artifact = status.artifact;
            validation = status.validation;
            generated = status.generated;
        } else if (global.TMSPermanentTransactionManifestGenerator &&
                   typeof global.TMSPermanentTransactionManifestGenerator.validateManifest === "function") {
            try {
                validation = global.TMSPermanentTransactionManifestGenerator.validateManifest(artifact);
            } catch (error) {
                console.warn("Integrity Analyzer could not validate the supplied manifest.", error);
            }
        }

        const report = analyzeManifest(artifact, validation, generated);
        report.validationSummary = validateIntegrityAnalysis(report);
        lastIntegrityAnalysis = report;
        return report;
    }

    function validateIntegrityAnalysis(report) {
        const candidate = isObject(report) ? report : null;
        const metadata = candidate && isObject(candidate.metadataSummary) ? candidate.metadataSummary : {};
        const prerequisites = candidate && isObject(candidate.prerequisiteSummary) ? candidate.prerequisiteSummary : {};
        const coverage = candidate && isObject(candidate.documentCoverage) ? candidate.documentCoverage : {};
        const cross = candidate && isObject(candidate.crossReferenceSummary) ? candidate.crossReferenceSummary : {};
        const placeholders = candidate && isObject(candidate.placeholderSummary) ? candidate.placeholderSummary : {};
        const manifestSafety = candidate && isObject(candidate.manifestSafetyState) ? candidate.manifestSafetyState : {};
        const safety = candidate && isObject(candidate.safetyState) ? candidate.safetyState : {};

        const expected = Array.isArray(coverage.expectedDocumentIds) ? coverage.expectedDocumentIds : [];
        const writers = Array.isArray(coverage.registeredWriterDocumentIds) ? coverage.registeredWriterDocumentIds : [];
        const execution = Array.isArray(coverage.executionOrder) ? coverage.executionOrder : [];
        const graph = Array.isArray(coverage.dependencyGraphDocumentIds) ? coverage.dependencyGraphDocumentIds : [];

        const checks = [
            makeCheck("Integrity Analysis Exists", !!candidate),
            makeCheck("Integrity Report Type Correct", candidate && candidate.reportType === REPORT_TYPE),
            makeCheck("Integrity Mode Disabled", candidate && candidate.integrityMode === INTEGRITY_MODE),
            makeCheck("Manifest Available", prerequisites.manifestAvailable === true),
            makeCheck("Manifest Validation Available", prerequisites.manifestValidationAvailable === true),
            makeCheck("Manifest Validation Valid", prerequisites.manifestValidationValid === true),
            makeCheck("Manifest Type Available", metadata.manifestTypeAvailable === true),
            makeCheck("Manifest Version Available", metadata.manifestVersionAvailable === true),
            makeCheck("Manifest Engine Version Available", metadata.engineVersionAvailable === true),
            makeCheck("Manifest Generated Timestamp Available", metadata.generatedAtAvailable === true),
            makeCheck("Session Number Available", metadata.sessionNumberAvailable === true),
            makeCheck("Milestone Available", metadata.milestoneAvailable === true),
            makeCheck("Module Available", metadata.moduleAvailable === true),
            makeCheck("Manifest Marked Immutable", metadata.manifestMarkedImmutable === true),
            makeCheck("Manifest Mode Disabled", metadata.manifestModeDisabled === true),
            makeCheck("Manifest Not Accepted", metadata.manifestNotAccepted === true),
            makeCheck("Manifest Not Authorized", metadata.manifestNotAuthorized === true),
            makeCheck("Expected Documents Present", expected.length > 0),
            makeCheck("Registered Writer Documents Present", writers.length > 0),
            makeCheck("Execution Order Present", execution.length > 0),
            makeCheck("Dependency Graph Documents Present", graph.length > 0),
            makeCheck("Expected Documents Match Registered Writers", cross.expectedDocumentsMatchRegisteredWriters === true),
            makeCheck("Expected Documents Match Execution Order", cross.expectedDocumentsMatchExecutionOrder === true),
            makeCheck("Expected Documents Match Dependency Graph", cross.expectedDocumentsMatchDependencyGraph === true),
            makeCheck("No Orphaned Dependency References", Array.isArray(cross.orphanedDependencyReferences) && cross.orphanedDependencyReferences.length === 0),
            makeCheck("No Duplicate Expected Documents", Array.isArray(cross.duplicateExpectedDocumentIds) && cross.duplicateExpectedDocumentIds.length === 0),
            makeCheck("No Duplicate Writer Documents", Array.isArray(cross.duplicateWriterDocumentIds) && cross.duplicateWriterDocumentIds.length === 0),
            makeCheck("No Duplicate Execution Documents", Array.isArray(cross.duplicateExecutionDocumentIds) && cross.duplicateExecutionDocumentIds.length === 0),
            makeCheck("No Duplicate Dependency Graph Documents", Array.isArray(cross.duplicateDependencyGraphDocumentIds) && cross.duplicateDependencyGraphDocumentIds.length === 0),
            makeCheck("Registry Validation Valid", prerequisites.registryValidationValid === true),
            makeCheck("Execution Plan Available", prerequisites.executionPlanAvailable === true),
            makeCheck("Execution Plan Valid", prerequisites.executionPlanValid === true),
            makeCheck("Dependency Analysis Available", prerequisites.dependencyAnalysisAvailable === true),
            makeCheck("Dependency Analysis Valid", prerequisites.dependencyAnalysisValid === true),
            makeCheck("Readiness Report Available", prerequisites.readinessReportAvailable === true),
            makeCheck("Readiness Report Valid", prerequisites.readinessReportValid === true),
            makeCheck("Structurally Ready", prerequisites.structurallyReady === true),
            makeCheck("Checksum Algorithm Placeholder Present", placeholders.checksumAlgorithmPlaceholderPresent === true),
            makeCheck("Checksum Placeholder Present", placeholders.checksumPlaceholderPresent === true),
            makeCheck("Signature Algorithm Placeholder Present", placeholders.signatureAlgorithmPlaceholderPresent === true),
            makeCheck("Signature Placeholder Present", placeholders.signaturePlaceholderPresent === true),
            makeCheck("Checksum Remains Unimplemented", placeholders.checksumNotImplemented === true),
            makeCheck("Digital Signature Remains Unimplemented", placeholders.signatureNotImplemented === true),
            makeCheck("Manifest Execution Not Authorized", manifestSafety.executionAuthorized === false),
            makeCheck("Manifest Execution Not Attempted", manifestSafety.executionAttempted === false),
            makeCheck("Manifest Permanent Writes Not Attempted", manifestSafety.permanentWritesAttempted === false),
            makeCheck("Manifest Permanent Writes Executed Is Zero", manifestSafety.permanentWritesExecuted === 0),
            makeCheck("Execution Not Authorized", safety.executionAuthorized === false),
            makeCheck("Execution Not Attempted", safety.executionAttempted === false),
            makeCheck("Permanent Writes Not Attempted", safety.permanentWritesAttempted === false),
            makeCheck("Permanent Writes Executed Is Zero", safety.permanentWritesExecuted === 0),
            makeCheck("Rollback Not Performed", safety.rollbackPerformed === false),
            makeCheck("Restore Not Performed", safety.restorePerformed === false),
            makeCheck("State Change Not Applied", safety.stateChangeApplied === false),
            makeCheck("Integrity Analysis Not Accepted", candidate && candidate.accepted === false),
            makeCheck("Integrity Analysis Not Authorized", candidate && candidate.authorized === false)
        ];

        const passedChecks = checks.filter(function (check) { return check.passed; });
        const failedChecks = checks.filter(function (check) { return !check.passed; });

        return {
            validationType: VALIDATION_TYPE,
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            integrityMode: INTEGRITY_MODE,
            validStructure: failedChecks.length === 0,
            integrityVerified: failedChecks.length === 0,
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

    function listOrNone(values) {
        return Array.isArray(values) && values.length ? values.join(", ") : "None";
    }

    function formatIntegrityAnalysis(report) {
        const candidate = report || lastIntegrityAnalysis;
        if (!candidate) {
            return "No permanent transaction integrity analysis is available.";
        }

        const validation = validateIntegrityAnalysis(candidate);
        const coverage = candidate.documentCoverage || {};
        const cross = candidate.crossReferenceSummary || {};
        const prerequisites = candidate.prerequisiteSummary || {};
        const placeholders = candidate.placeholderSummary || {};
        const safety = candidate.safetyState || {};
        const lines = [];

        lines.push("TMS-OS PERMANENT TRANSACTION INTEGRITY ANALYSIS");
        lines.push("====================================================");
        lines.push("");
        lines.push("Generated At: " + candidate.generatedAt);
        lines.push("Session Number: " + (candidate.sessionNumber || "Not Available"));
        lines.push("Milestone: " + (candidate.milestone || "Not Available"));
        lines.push("Module: " + candidate.module);
        lines.push("Engine Version: " + candidate.engineVersion);
        lines.push("Integrity Mode: " + candidate.integrityMode);
        lines.push("Integrity Verified: " + yesNo(validation.integrityVerified));
        lines.push("Accepted: " + yesNo(candidate.accepted));
        lines.push("Authorized: " + yesNo(candidate.authorized));
        lines.push("");

        lines.push("MANIFEST PREREQUISITES");
        lines.push("----------------------------------------");
        lines.push("Manifest Available: " + yesNo(prerequisites.manifestAvailable));
        lines.push("Manifest Validation Valid: " + yesNo(prerequisites.manifestValidationValid));
        lines.push("Writer Registry Valid: " + yesNo(prerequisites.registryValidationValid));
        lines.push("Execution Plan Valid: " + yesNo(prerequisites.executionPlanValid));
        lines.push("Dependency Analysis Valid: " + yesNo(prerequisites.dependencyAnalysisValid));
        lines.push("Readiness Report Valid: " + yesNo(prerequisites.readinessReportValid));
        lines.push("Structurally Ready: " + yesNo(prerequisites.structurallyReady));
        lines.push("");

        lines.push("DOCUMENT CROSS-REFERENCE INTEGRITY");
        lines.push("----------------------------------------");
        lines.push("Expected Documents: " + listOrNone(coverage.expectedDocumentIds));
        lines.push("Registered Writer Documents: " + listOrNone(coverage.registeredWriterDocumentIds));
        lines.push("Execution Order: " + listOrNone(coverage.executionOrder));
        lines.push("Dependency Graph Documents: " + listOrNone(coverage.dependencyGraphDocumentIds));
        lines.push("Expected Match Registered Writers: " + yesNo(cross.expectedDocumentsMatchRegisteredWriters));
        lines.push("Expected Match Execution Order: " + yesNo(cross.expectedDocumentsMatchExecutionOrder));
        lines.push("Expected Match Dependency Graph: " + yesNo(cross.expectedDocumentsMatchDependencyGraph));
        lines.push("Orphaned Dependency References: " + listOrNone(cross.orphanedDependencyReferences));
        lines.push("Duplicate Expected Documents: " + listOrNone(cross.duplicateExpectedDocumentIds));
        lines.push("Duplicate Writer Documents: " + listOrNone(cross.duplicateWriterDocumentIds));
        lines.push("Duplicate Execution Documents: " + listOrNone(cross.duplicateExecutionDocumentIds));
        lines.push("Duplicate Dependency Graph Documents: " + listOrNone(cross.duplicateDependencyGraphDocumentIds));
        lines.push("");

        lines.push("INTEGRITY PLACEHOLDERS");
        lines.push("----------------------------------------");
        lines.push("Checksum Algorithm Placeholder: " + yesNo(placeholders.checksumAlgorithmPlaceholderPresent));
        lines.push("Checksum Placeholder: " + yesNo(placeholders.checksumPlaceholderPresent));
        lines.push("Digital Signature Algorithm Placeholder: " + yesNo(placeholders.signatureAlgorithmPlaceholderPresent));
        lines.push("Digital Signature Placeholder: " + yesNo(placeholders.signaturePlaceholderPresent));
        lines.push("Checksum Implemented: NO");
        lines.push("Digital Signature Implemented: NO");
        lines.push("");

        lines.push("VALIDATION SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Valid Structure: " + yesNo(validation.validStructure));
        lines.push("Integrity Verified: " + yesNo(validation.integrityVerified));
        lines.push("Accepted: NO");
        lines.push("Authorized: NO");
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

    function getLastIntegrityAnalysis() {
        return lastIntegrityAnalysis;
    }

    function getIntegrityRequirements() {
        return [
            "Permanent Transaction Manifest Generator must be available.",
            "A valid canonical manifest must be available or generated in read-only mode.",
            "Manifest schema metadata must be complete and internally consistent.",
            "The manifest must remain immutable, unaccepted, and unauthorized.",
            "Expected permanent document identifiers must be present and unique.",
            "Registered writer document identifiers must match expected documents exactly once.",
            "Execution order must match expected documents exactly once.",
            "Dependency graph document identifiers must match expected documents exactly once.",
            "Every dependency reference must resolve to an expected permanent document.",
            "Duplicate and orphaned cross-references are not permitted.",
            "Registry, execution-plan, dependency-analysis, and readiness validations must be valid.",
            "The readiness snapshot must indicate structural readiness.",
            "Checksum and digital-signature placeholders must be present but remain unimplemented.",
            "Integrity Mode must remain Disabled.",
            "The integrity analysis must not be accepted or authorized.",
            "Execution and permanent writes must not be attempted.",
            "Rollback, restore, and permanent state changes must not occur."
        ];
    }

    global.TMSPermanentTransactionIntegrityAnalyzer = Object.freeze({
        engineVersion: ENGINE_VERSION,
        integrityMode: INTEGRITY_MODE,
        generateIntegrityAnalysis: generateIntegrityAnalysis,
        validateIntegrityAnalysis: validateIntegrityAnalysis,
        formatIntegrityAnalysis: formatIntegrityAnalysis,
        getLastIntegrityAnalysis: getLastIntegrityAnalysis,
        getIntegrityRequirements: getIntegrityRequirements
    });
})(window);
