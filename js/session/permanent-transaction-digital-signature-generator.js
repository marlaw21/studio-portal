(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const SIGNATURE_MODE = "Disabled";
    const SIGNATURE_STATUS = "Proposal Only";
    const PROPOSAL_VERSION = "1.0.0";
    const SIGNATURE_ALGORITHM = "PKI-NOT-IMPLEMENTED";
    const PROPOSAL_ALGORITHM = "TMS-SHA256-CHECKSUM-BOUND-PROPOSAL-V1";

    let lastDigitalSignatureReport = null;

    const REQUIREMENTS = Object.freeze([
        "Permanent Transaction Checksum Generator must be available.",
        "A valid deterministic SHA-256 checksum report must be available or generated in read-only mode.",
        "The checksum must be a 64-character lowercase hexadecimal value.",
        "The checksum report must confirm manifest integrity and immutability prerequisites.",
        "The signature proposal must bind deterministically to the verified checksum.",
        "The proposal must define signature metadata without using a private key.",
        "The proposal must explicitly state that PKI signing is not implemented.",
        "The proposal must explicitly state that certificate and trust-chain validation are not implemented.",
        "The proposal may propose digital-signature placeholder population but must not mutate the immutable manifest.",
        "Identical verified checksum content must produce identical proposal values.",
        "Signature Mode must remain Disabled.",
        "The signature report must not be accepted or authorized.",
        "Execution and permanent writes must not be attempted.",
        "Rollback, restore, and permanent state changes must not occur.",
        "Private-key access, certificate issuance, certificate validation, and external signing services must not be invoked."
    ]);

    function clone(value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    function freezeDeep(value) {
        if (!value || typeof value !== "object" || Object.isFrozen(value)) {
            return value;
        }
        Object.freeze(value);
        Object.keys(value).forEach(function (key) {
            freezeDeep(value[key]);
        });
        return value;
    }

    function getSessionSnapshot() {
        try {
            if (
                global.TMSSessionContext &&
                typeof global.TMSSessionContext.getSnapshot === "function"
            ) {
                return global.TMSSessionContext.getSnapshot() || {};
            }
        } catch (error) {
            return {};
        }
        return {};
    }

    function getChecksumReport() {
        if (
            !global.TMSPermanentTransactionChecksumGenerator ||
            typeof global.TMSPermanentTransactionChecksumGenerator.generateChecksumReport !== "function"
        ) {
            throw new Error("Permanent Transaction Checksum Generator is unavailable.");
        }

        if (
            typeof global.TMSPermanentTransactionChecksumGenerator.getLastChecksumReport === "function"
        ) {
            const existing = global.TMSPermanentTransactionChecksumGenerator.getLastChecksumReport();
            if (existing) return existing;
        }

        return global.TMSPermanentTransactionChecksumGenerator.generateChecksumReport();
    }

    function getChecksumValidation(report) {
        if (
            !global.TMSPermanentTransactionChecksumGenerator ||
            typeof global.TMSPermanentTransactionChecksumGenerator.validateChecksumReport !== "function"
        ) {
            throw new Error("Checksum report validator is unavailable.");
        }
        return global.TMSPermanentTransactionChecksumGenerator.validateChecksumReport(report);
    }

    function isLowercaseSha256(value) {
        return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
    }

    function findChecksum(value, seen) {
        if (!value || typeof value !== "object") return null;
        seen = seen || new Set();
        if (seen.has(value)) return null;
        seen.add(value);

        const preferredKeys = [
            "checksum",
            "checksumValue",
            "generatedChecksum",
            "proposedChecksum",
            "sha256"
        ];

        for (const key of preferredKeys) {
            if (isLowercaseSha256(value[key])) return value[key];
        }

        for (const key of Object.keys(value)) {
            const item = value[key];
            if (isLowercaseSha256(item)) return item;
            if (item && typeof item === "object") {
                const nested = findChecksum(item, seen);
                if (nested) return nested;
            }
        }
        return null;
    }

    function stableProposalFromChecksum(checksum) {
        return [
            "TMS-SIGNATURE-PROPOSAL",
            "v1",
            "sha256",
            checksum
        ].join(".");
    }

    function buildChecks(report) {
        const checksumReport = report && report.prerequisites
            ? report.prerequisites.checksumReport
            : null;
        const checksumValidation = report && report.prerequisites
            ? report.prerequisites.checksumValidation
            : null;
        const proposal = report ? report.signatureProposal : null;
        const safety = report ? report.safetyState : null;

        const checks = [
            ["Digital Signature Report Exists", !!report],
            ["Digital Signature Report Type Correct", report && report.reportType === "TMS-OS Permanent Transaction Digital Signature Report"],
            ["Signature Engine Version Available", !!(report && report.engineVersion)],
            ["Signature Mode Disabled", report && report.signatureMode === SIGNATURE_MODE],
            ["Signature Status Proposal Only", report && report.signatureStatus === SIGNATURE_STATUS],
            ["Session Number Available", !!(report && report.sessionNumber)],
            ["Milestone Available", !!(report && report.milestone)],
            ["Module Correct", report && report.module === "Permanent Transaction Digital Signature Generator"],
            ["Checksum Report Available", !!checksumReport],
            ["Checksum Validation Available", !!checksumValidation],
            ["Checksum Validation Valid", !!(checksumValidation && checksumValidation.validStructure === true)],
            ["Checksum Is SHA-256", !!(report && report.checksum && report.checksum.algorithm === "SHA-256")],
            ["Checksum Value Present", !!(report && report.checksum && report.checksum.value)],
            ["Checksum Is 64 Characters", !!(report && report.checksum && typeof report.checksum.value === "string" && report.checksum.value.length === 64)],
            ["Checksum Is Lowercase Hex", !!(report && report.checksum && isLowercaseSha256(report.checksum.value))],
            ["Proposal Available", !!proposal],
            ["Proposal Version Available", !!(proposal && proposal.proposalVersion)],
            ["Proposal Algorithm Available", !!(proposal && proposal.proposalAlgorithm)],
            ["Proposal Binds To Checksum", !!(proposal && report.checksum && proposal.boundChecksum === report.checksum.value)],
            ["Proposal Value Present", !!(proposal && proposal.proposalValue)],
            ["Proposal Value Matches Deterministic Construction", !!(
                proposal &&
                report.checksum &&
                proposal.proposalValue === stableProposalFromChecksum(report.checksum.value)
            )],
            ["Deterministic Repeat Value Present", !!(proposal && proposal.deterministicRepeatValue)],
            ["Deterministic Repeat Matches", !!(
                proposal &&
                proposal.deterministicRepeatValue === proposal.proposalValue
            )],
            ["PKI Not Implemented", !!(proposal && proposal.pkiImplemented === false)],
            ["Private Key Not Used", !!(proposal && proposal.privateKeyUsed === false)],
            ["Certificate Not Used", !!(proposal && proposal.certificateUsed === false)],
            ["Trust Chain Not Validated", !!(proposal && proposal.trustChainValidated === false)],
            ["External Signing Service Not Invoked", !!(proposal && proposal.externalSigningServiceInvoked === false)],
            ["Placeholder Proposal Present", !!(report && report.placeholderPopulationProposal)],
            ["Placeholder Not Mutated", !!(
                report &&
                report.placeholderPopulationProposal &&
                report.placeholderPopulationProposal.manifestPlaceholderMutated === false
            )],
            ["Population Mode Read-Only", !!(
                report &&
                report.placeholderPopulationProposal &&
                report.placeholderPopulationProposal.populationMode === "Read-Only Proposal"
            )],
            ["Execution Not Authorized", !!(safety && safety.executionAuthorized === false)],
            ["Execution Not Attempted", !!(safety && safety.executionAttempted === false)],
            ["Permanent Writes Not Attempted", !!(safety && safety.permanentWritesAttempted === false)],
            ["Permanent Writes Executed Is Zero", !!(safety && safety.permanentWritesExecuted === 0)],
            ["Rollback Not Performed", !!(safety && safety.rollbackPerformed === false)],
            ["Restore Not Performed", !!(safety && safety.restorePerformed === false)],
            ["State Change Not Applied", !!(safety && safety.stateChangeApplied === false)],
            ["Manifest Mutation Not Attempted", !!(safety && safety.manifestMutationAttempted === false)],
            ["Manifest Mutation Not Applied", !!(safety && safety.manifestMutationApplied === false)],
            ["Private Key Access Not Attempted", !!(safety && safety.privateKeyAccessAttempted === false)],
            ["Certificate Validation Not Attempted", !!(safety && safety.certificateValidationAttempted === false)],
            ["Digital Signature Report Not Accepted", report && report.accepted === false],
            ["Digital Signature Report Not Authorized", report && report.authorized === false]
        ];

        return checks.map(function (entry) {
            return {
                name: entry[0],
                passed: entry[1] === true
            };
        });
    }

    function validateDigitalSignatureReport(report) {
        const checks = buildChecks(report);
        const passedChecks = checks.filter(function (check) {
            return check.passed;
        }).length;
        const failedChecks = checks.length - passedChecks;

        return freezeDeep({
            validationType: "TMS-OS Permanent Transaction Digital Signature Report Validation",
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            signatureMode: SIGNATURE_MODE,
            validStructure: failedChecks === 0,
            signatureProposalValid: failedChecks === 0,
            accepted: false,
            authorized: false,
            passedChecks: passedChecks,
            failedChecks: failedChecks,
            checks: checks
        });
    }

    function generateDigitalSignatureReport() {
        const session = getSessionSnapshot();
        const checksumReport = getChecksumReport();
        const checksumValidation = getChecksumValidation(checksumReport);
        const checksum = findChecksum(checksumReport);

        if (!checksum) {
            throw new Error("A valid 64-character lowercase SHA-256 checksum could not be located.");
        }

        const proposalValue = stableProposalFromChecksum(checksum);

        const report = {
            reportType: "TMS-OS Permanent Transaction Digital Signature Report",
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            signatureMode: SIGNATURE_MODE,
            signatureStatus: SIGNATURE_STATUS,
            sessionNumber: session.sessionNumber || "Unknown",
            milestone: session.milestone || "Unknown",
            module: "Permanent Transaction Digital Signature Generator",
            proposalVersion: PROPOSAL_VERSION,
            accepted: false,
            authorized: false,

            prerequisites: {
                checksumReportAvailable: true,
                checksumValidationAvailable: true,
                checksumValidationValid: checksumValidation.validStructure === true,
                checksumReport: clone(checksumReport),
                checksumValidation: clone(checksumValidation)
            },

            checksum: {
                algorithm: "SHA-256",
                value: checksum,
                length: checksum.length,
                lowercaseHex: isLowercaseSha256(checksum)
            },

            signatureProposal: {
                proposalVersion: PROPOSAL_VERSION,
                proposalAlgorithm: PROPOSAL_ALGORITHM,
                signatureAlgorithm: SIGNATURE_ALGORITHM,
                signatureEncoding: "Proposal Token",
                boundChecksumAlgorithm: "SHA-256",
                boundChecksum: checksum,
                proposalValue: proposalValue,
                deterministicRepeatValue: stableProposalFromChecksum(checksum),
                deterministic: true,
                pkiImplemented: false,
                privateKeyUsed: false,
                certificateUsed: false,
                trustChainValidated: false,
                externalSigningServiceInvoked: false,
                legalSignatureStatus: "Not a digital signature",
                implementationStatus: "Metadata and deterministic proposal only"
            },

            placeholderPopulationProposal: {
                manifestPlaceholderPresent: true,
                manifestPlaceholderMutated: false,
                populationMode: "Read-Only Proposal",
                proposedSignatureAlgorithm: SIGNATURE_ALGORITHM,
                proposedSignatureValue: proposalValue,
                proposedBoundChecksum: checksum
            },

            safetyState: {
                executionAuthorized: false,
                executionAttempted: false,
                permanentWritesAttempted: false,
                permanentWritesExecuted: 0,
                rollbackPerformed: false,
                restorePerformed: false,
                stateChangeApplied: false,
                manifestMutationAttempted: false,
                manifestMutationApplied: false,
                privateKeyAccessAttempted: false,
                certificateValidationAttempted: false,
                externalSigningServiceInvoked: false
            },

            requiredNextAction:
                "Review the Disabled Mode digital signature proposal. Do not treat it as a real PKI signature, mutate the manifest, or authorize permanent documentation writes."
        };

        const validation = validateDigitalSignatureReport(report);
        report.validationSummary = {
            validStructure: validation.validStructure,
            signatureProposalValid: validation.signatureProposalValid,
            passedChecks: validation.passedChecks,
            failedChecks: validation.failedChecks,
            checks: clone(validation.checks)
        };

        lastDigitalSignatureReport = freezeDeep(report);
        return lastDigitalSignatureReport;
    }

    function formatYesNo(value) {
        return value === true ? "YES" : "NO";
    }

    function formatDigitalSignatureReport(report) {
        report = report || lastDigitalSignatureReport;
        if (!report) {
            throw new Error("A digital signature report is required.");
        }

        const validation = validateDigitalSignatureReport(report);
        const proposal = report.signatureProposal || {};
        const checksum = report.checksum || {};
        const safety = report.safetyState || {};
        const placeholder = report.placeholderPopulationProposal || {};
        const lines = [];

        lines.push("TMS-OS PERMANENT TRANSACTION DIGITAL SIGNATURE REPORT");
        lines.push("====================================================");
        lines.push("");
        lines.push("Generated At: " + report.generatedAt);
        lines.push("Session Number: " + report.sessionNumber);
        lines.push("Milestone: " + report.milestone);
        lines.push("Module: " + report.module);
        lines.push("Engine Version: " + report.engineVersion);
        lines.push("Signature Mode: " + report.signatureMode);
        lines.push("Signature Status: " + report.signatureStatus);
        lines.push("Proposal Version: " + report.proposalVersion);
        lines.push("Accepted: " + formatYesNo(report.accepted));
        lines.push("Authorized: " + formatYesNo(report.authorized));
        lines.push("");

        lines.push("CHECKSUM PREREQUISITES");
        lines.push("----------------------------------------");
        lines.push("Checksum Report Available: " + formatYesNo(report.prerequisites && report.prerequisites.checksumReportAvailable));
        lines.push("Checksum Validation Available: " + formatYesNo(report.prerequisites && report.prerequisites.checksumValidationAvailable));
        lines.push("Checksum Validation Valid: " + formatYesNo(report.prerequisites && report.prerequisites.checksumValidationValid));
        lines.push("Checksum Algorithm: " + checksum.algorithm);
        lines.push("Checksum: " + checksum.value);
        lines.push("Checksum Length: " + checksum.length);
        lines.push("Lowercase Hex: " + formatYesNo(checksum.lowercaseHex));
        lines.push("");

        lines.push("DIGITAL SIGNATURE PROPOSAL");
        lines.push("----------------------------------------");
        lines.push("Proposal Algorithm: " + proposal.proposalAlgorithm);
        lines.push("Signature Algorithm: " + proposal.signatureAlgorithm);
        lines.push("Signature Encoding: " + proposal.signatureEncoding);
        lines.push("Bound Checksum Algorithm: " + proposal.boundChecksumAlgorithm);
        lines.push("Bound Checksum: " + proposal.boundChecksum);
        lines.push("Proposal Value: " + proposal.proposalValue);
        lines.push("Deterministic: " + formatYesNo(proposal.deterministic));
        lines.push("Deterministic Repeat Match: " + formatYesNo(proposal.deterministicRepeatValue === proposal.proposalValue));
        lines.push("PKI Implemented: " + formatYesNo(proposal.pkiImplemented));
        lines.push("Private Key Used: " + formatYesNo(proposal.privateKeyUsed));
        lines.push("Certificate Used: " + formatYesNo(proposal.certificateUsed));
        lines.push("Trust Chain Validated: " + formatYesNo(proposal.trustChainValidated));
        lines.push("External Signing Service Invoked: " + formatYesNo(proposal.externalSigningServiceInvoked));
        lines.push("Legal Signature Status: " + proposal.legalSignatureStatus);
        lines.push("Implementation Status: " + proposal.implementationStatus);
        lines.push("");

        lines.push("PLACEHOLDER POPULATION PROPOSAL");
        lines.push("----------------------------------------");
        lines.push("Manifest Placeholder Present: " + formatYesNo(placeholder.manifestPlaceholderPresent));
        lines.push("Manifest Placeholder Mutated: " + formatYesNo(placeholder.manifestPlaceholderMutated));
        lines.push("Population Mode: " + placeholder.populationMode);
        lines.push("Proposed Signature Algorithm: " + placeholder.proposedSignatureAlgorithm);
        lines.push("Proposed Signature Value: " + placeholder.proposedSignatureValue);
        lines.push("Proposed Bound Checksum: " + placeholder.proposedBoundChecksum);
        lines.push("");

        lines.push("VALIDATION SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Valid Structure: " + formatYesNo(validation.validStructure));
        lines.push("Signature Proposal Valid: " + formatYesNo(validation.signatureProposalValid));
        lines.push("Passed Checks: " + validation.passedChecks);
        lines.push("Failed Checks: " + validation.failedChecks);
        validation.checks.forEach(function (check) {
            lines.push("- " + check.name + ": " + formatYesNo(check.passed));
        });
        lines.push("");

        lines.push("SAFETY STATE");
        lines.push("----------------------------------------");
        lines.push("Execution Authorized: " + formatYesNo(safety.executionAuthorized));
        lines.push("Execution Attempted: " + formatYesNo(safety.executionAttempted));
        lines.push("Permanent Writes Attempted: " + formatYesNo(safety.permanentWritesAttempted));
        lines.push("Permanent Writes Executed: " + safety.permanentWritesExecuted);
        lines.push("Rollback Performed: " + formatYesNo(safety.rollbackPerformed));
        lines.push("Restore Performed: " + formatYesNo(safety.restorePerformed));
        lines.push("State Change Applied: " + formatYesNo(safety.stateChangeApplied));
        lines.push("Manifest Mutation Attempted: " + formatYesNo(safety.manifestMutationAttempted));
        lines.push("Manifest Mutation Applied: " + formatYesNo(safety.manifestMutationApplied));
        lines.push("Private Key Access Attempted: " + formatYesNo(safety.privateKeyAccessAttempted));
        lines.push("Certificate Validation Attempted: " + formatYesNo(safety.certificateValidationAttempted));
        lines.push("External Signing Service Invoked: " + formatYesNo(safety.externalSigningServiceInvoked));
        lines.push("");

        lines.push("REQUIRED NEXT ACTION");
        lines.push("----------------------------------------");
        lines.push(report.requiredNextAction);

        return lines.join("\n");
    }

    function getLastDigitalSignatureReport() {
        return lastDigitalSignatureReport;
    }

    function getDigitalSignatureRequirements() {
        return REQUIREMENTS.slice();
    }

    global.TMSPermanentTransactionDigitalSignatureGenerator = Object.freeze({
        engineVersion: ENGINE_VERSION,
        signatureMode: SIGNATURE_MODE,
        signatureStatus: SIGNATURE_STATUS,
        proposalVersion: PROPOSAL_VERSION,
        signatureAlgorithm: SIGNATURE_ALGORITHM,
        proposalAlgorithm: PROPOSAL_ALGORITHM,
        pkiImplemented: false,
        generateDigitalSignatureReport: generateDigitalSignatureReport,
        validateDigitalSignatureReport: validateDigitalSignatureReport,
        formatDigitalSignatureReport: formatDigitalSignatureReport,
        getLastDigitalSignatureReport: getLastDigitalSignatureReport,
        getDigitalSignatureRequirements: getDigitalSignatureRequirements
    });
})(window);
