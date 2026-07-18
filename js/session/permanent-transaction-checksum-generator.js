(function (global) {
    "use strict";

    const ENGINE_VERSION = "1.0.0";
    const CHECKSUM_MODE = "Disabled";
    const CHECKSUM_ALGORITHM = "SHA-256";
    const CANONICALIZATION_VERSION = "1.0.0";
    const REPORT_TYPE = "TMS-OS Permanent Transaction Checksum Report";
    const VALIDATION_TYPE = "TMS-OS Permanent Transaction Checksum Report Validation";

    const VOLATILE_KEYS = new Set([
        "generatedAt",
        "validatedAt",
        "recordedAt",
        "preparedAt",
        "closedAt",
        "acceptedAt",
        "authorizedAt",
        "executedAt",
        "capturedAt",
        "timestamp"
    ]);

    const SELF_REFERENTIAL_INTEGRITY_KEYS = new Set([
        "canonicalChecksumAlgorithm",
        "canonicalChecksum",
        "digitalSignatureAlgorithm",
        "digitalSignature"
    ]);

    let lastChecksumReport = null;

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
            console.warn("Checksum Generator could not clone a value.", error);
            return null;
        }
    }

    function safeCall(target, methodName, fallbackValue) {
        try {
            if (target && typeof target[methodName] === "function") {
                return target[methodName]();
            }
        } catch (error) {
            console.warn("Checksum Generator could not call " + methodName + ".", error);
        }
        return fallbackValue;
    }

    function makeCheck(name, passed) {
        return {
            name: name,
            passed: !!passed
        };
    }

    function rotateRight(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    function utf8Bytes(text) {
        const bytes = [];
        for (let index = 0; index < text.length; index += 1) {
            let codePoint = text.charCodeAt(index);

            if (codePoint >= 0xD800 && codePoint <= 0xDBFF && index + 1 < text.length) {
                const next = text.charCodeAt(index + 1);
                if (next >= 0xDC00 && next <= 0xDFFF) {
                    codePoint = 0x10000 + ((codePoint - 0xD800) << 10) + (next - 0xDC00);
                    index += 1;
                }
            }

            if (codePoint <= 0x7F) {
                bytes.push(codePoint);
            } else if (codePoint <= 0x7FF) {
                bytes.push(
                    0xC0 | (codePoint >>> 6),
                    0x80 | (codePoint & 0x3F)
                );
            } else if (codePoint <= 0xFFFF) {
                bytes.push(
                    0xE0 | (codePoint >>> 12),
                    0x80 | ((codePoint >>> 6) & 0x3F),
                    0x80 | (codePoint & 0x3F)
                );
            } else {
                bytes.push(
                    0xF0 | (codePoint >>> 18),
                    0x80 | ((codePoint >>> 12) & 0x3F),
                    0x80 | ((codePoint >>> 6) & 0x3F),
                    0x80 | (codePoint & 0x3F)
                );
            }
        }
        return bytes;
    }

    function sha256(text) {
        const constants = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
            0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
            0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
            0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
            0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
            0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
            0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ];

        const bytes = utf8Bytes(text);
        const bitLength = bytes.length * 8;
        bytes.push(0x80);

        while ((bytes.length % 64) !== 56) {
            bytes.push(0);
        }

        const high = Math.floor(bitLength / 0x100000000);
        const low = bitLength >>> 0;
        for (let shift = 24; shift >= 0; shift -= 8) {
            bytes.push((high >>> shift) & 0xFF);
        }
        for (let shift = 24; shift >= 0; shift -= 8) {
            bytes.push((low >>> shift) & 0xFF);
        }

        let h0 = 0x6a09e667;
        let h1 = 0xbb67ae85;
        let h2 = 0x3c6ef372;
        let h3 = 0xa54ff53a;
        let h4 = 0x510e527f;
        let h5 = 0x9b05688c;
        let h6 = 0x1f83d9ab;
        let h7 = 0x5be0cd19;

        const words = new Array(64);

        for (let offset = 0; offset < bytes.length; offset += 64) {
            for (let index = 0; index < 16; index += 1) {
                const position = offset + (index * 4);
                words[index] = (
                    (bytes[position] << 24) |
                    (bytes[position + 1] << 16) |
                    (bytes[position + 2] << 8) |
                    bytes[position + 3]
                ) >>> 0;
            }

            for (let index = 16; index < 64; index += 1) {
                const s0 = rotateRight(words[index - 15], 7) ^
                    rotateRight(words[index - 15], 18) ^
                    (words[index - 15] >>> 3);
                const s1 = rotateRight(words[index - 2], 17) ^
                    rotateRight(words[index - 2], 19) ^
                    (words[index - 2] >>> 10);
                words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
            }

            let a = h0;
            let b = h1;
            let c = h2;
            let d = h3;
            let e = h4;
            let f = h5;
            let g = h6;
            let h = h7;

            for (let index = 0; index < 64; index += 1) {
                const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
                const choice = (e & f) ^ ((~e) & g);
                const temp1 = (h + sum1 + choice + constants[index] + words[index]) >>> 0;
                const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
                const majority = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (sum0 + majority) >>> 0;

                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }

            h0 = (h0 + a) >>> 0;
            h1 = (h1 + b) >>> 0;
            h2 = (h2 + c) >>> 0;
            h3 = (h3 + d) >>> 0;
            h4 = (h4 + e) >>> 0;
            h5 = (h5 + f) >>> 0;
            h6 = (h6 + g) >>> 0;
            h7 = (h7 + h) >>> 0;
        }

        return [h0, h1, h2, h3, h4, h5, h6, h7].map(function (value) {
            return value.toString(16).padStart(8, "0");
        }).join("");
    }

    function normalizeValue(value, parentKey) {
        if (Array.isArray(value)) {
            return value.map(function (item) {
                return normalizeValue(item, parentKey);
            });
        }

        if (isObject(value)) {
            const normalized = {};
            Object.keys(value).sort().forEach(function (key) {
                if (VOLATILE_KEYS.has(key)) {
                    return;
                }
                if (parentKey === "integrityPlaceholders" && SELF_REFERENTIAL_INTEGRITY_KEYS.has(key)) {
                    return;
                }
                normalized[key] = normalizeValue(value[key], key);
            });
            return normalized;
        }

        if (typeof value === "number" && !Number.isFinite(value)) {
            return null;
        }

        return value;
    }

    function canonicalizeManifest(manifest) {
        return JSON.stringify(normalizeValue(manifest, "manifest"));
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
                console.warn("Checksum Generator could not generate a manifest.", error);
            }
        }

        let validation = null;
        if (artifact && typeof generator.validateManifest === "function") {
            try {
                validation = generator.validateManifest(artifact);
            } catch (error) {
                console.warn("Checksum Generator could not validate the manifest.", error);
            }
        }

        return {
            artifact: clone(artifact),
            validation: clone(validation),
            generated: generated
        };
    }

    function getOrGenerateIntegrityAnalysis(manifest) {
        const analyzer = global.TMSPermanentTransactionIntegrityAnalyzer;
        if (!analyzer) {
            return {
                artifact: null,
                validation: null,
                generated: false
            };
        }

        let artifact = safeCall(analyzer, "getLastIntegrityAnalysis", null);
        let generated = false;

        if (!artifact && typeof analyzer.generateIntegrityAnalysis === "function") {
            try {
                artifact = analyzer.generateIntegrityAnalysis(manifest);
                generated = true;
            } catch (error) {
                console.warn("Checksum Generator could not generate an integrity analysis.", error);
            }
        }

        let validation = null;
        if (artifact && typeof analyzer.validateIntegrityAnalysis === "function") {
            try {
                validation = analyzer.validateIntegrityAnalysis(artifact);
            } catch (error) {
                console.warn("Checksum Generator could not validate the integrity analysis.", error);
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
            checksumMode: CHECKSUM_MODE,
            executionAuthorized: false,
            executionAttempted: false,
            permanentWritesAttempted: false,
            permanentWritesExecuted: 0,
            rollbackPerformed: false,
            restorePerformed: false,
            stateChangeApplied: false,
            manifestMutationAttempted: false,
            manifestMutationApplied: false
        };
    }

    function generateChecksumReport(manifest) {
        let manifestArtifact = manifest || null;
        let manifestValidation = null;
        let manifestGenerated = false;

        if (!manifestArtifact) {
            const manifestStatus = getOrGenerateManifest();
            manifestArtifact = manifestStatus.artifact;
            manifestValidation = manifestStatus.validation;
            manifestGenerated = manifestStatus.generated;
        } else if (global.TMSPermanentTransactionManifestGenerator &&
                   typeof global.TMSPermanentTransactionManifestGenerator.validateManifest === "function") {
            try {
                manifestValidation = global.TMSPermanentTransactionManifestGenerator.validateManifest(manifestArtifact);
            } catch (error) {
                console.warn("Checksum Generator could not validate the supplied manifest.", error);
            }
        }

        const integrityStatus = getOrGenerateIntegrityAnalysis(manifestArtifact);
        const manifestSnapshot = clone(manifestArtifact);
        const canonicalPayload = manifestSnapshot ? canonicalizeManifest(manifestSnapshot) : "";
        const checksum = canonicalPayload ? sha256(canonicalPayload) : null;
        const repeatChecksum = canonicalPayload ? sha256(canonicalPayload) : null;
        const session = isObject(manifestSnapshot && manifestSnapshot.session) ? manifestSnapshot.session : {};

        const report = {
            reportType: REPORT_TYPE,
            engineVersion: ENGINE_VERSION,
            generatedAt: new Date().toISOString(),
            checksumMode: CHECKSUM_MODE,
            sessionNumber: session.sessionNumber || null,
            milestone: session.milestone || null,
            module: "Permanent Transaction Checksum Generator",
            algorithm: CHECKSUM_ALGORITHM,
            canonicalizationVersion: CANONICALIZATION_VERSION,
            canonicalizationRules: {
                objectKeysSorted: true,
                arrayOrderPreserved: true,
                volatileTimestampFieldsExcluded: Array.from(VOLATILE_KEYS),
                selfReferentialIntegrityFieldsExcluded: Array.from(SELF_REFERENTIAL_INTEGRITY_KEYS),
                manifestMutationRequired: false
            },
            manifest: {
                available: !!manifestSnapshot,
                generatedDuringChecksumReport: manifestGenerated,
                validation: clone(manifestValidation),
                snapshot: manifestSnapshot,
                immutable: !!(manifestSnapshot && manifestSnapshot.immutable === true),
                accepted: manifestSnapshot ? manifestSnapshot.accepted : null,
                authorized: manifestSnapshot ? manifestSnapshot.authorized : null
            },
            integrityAnalysis: {
                available: !!integrityStatus.artifact,
                generatedDuringChecksumReport: integrityStatus.generated,
                validation: clone(integrityStatus.validation),
                integrityVerified: !!(integrityStatus.artifact && integrityStatus.artifact.validationSummary && integrityStatus.artifact.validationSummary.integrityVerified === true)
            },
            checksum: {
                value: checksum,
                length: checksum ? checksum.length : 0,
                lowercaseHex: !!(checksum && /^[0-9a-f]{64}$/.test(checksum)),
                deterministicRepeatValue: repeatChecksum,
                deterministicRepeatMatch: !!checksum && checksum === repeatChecksum,
                canonicalPayloadLength: canonicalPayload.length
            },
            placeholderPopulation: {
                manifestPlaceholderPresent: !!(
                    manifestSnapshot &&
                    manifestSnapshot.integrityPlaceholders &&
                    Object.prototype.hasOwnProperty.call(manifestSnapshot.integrityPlaceholders, "canonicalChecksum")
                ),
                manifestPlaceholderMutated: false,
                proposedChecksumAlgorithm: CHECKSUM_ALGORITHM,
                proposedChecksum: checksum,
                populationMode: "Read-Only Proposal"
            },
            safetyState: buildSafetyState(),
            accepted: false,
            authorized: false,
            requiredNextAction:
                "Review the Disabled Mode checksum report. Do not mutate the manifest or authorize permanent documentation writes."
        };

        report.validationSummary = validateChecksumReport(report);
        lastChecksumReport = report;
        return report;
    }

    function validateChecksumReport(report) {
        const candidate = isObject(report) ? report : {};
        const manifest = isObject(candidate.manifest) ? candidate.manifest : {};
        const integrity = isObject(candidate.integrityAnalysis) ? candidate.integrityAnalysis : {};
        const checksum = isObject(candidate.checksum) ? candidate.checksum : {};
        const population = isObject(candidate.placeholderPopulation) ? candidate.placeholderPopulation : {};
        const safety = isObject(candidate.safetyState) ? candidate.safetyState : {};

        const checks = [
            makeCheck("Checksum Report Exists", isObject(report)),
            makeCheck("Checksum Report Type Correct", candidate.reportType === REPORT_TYPE),
            makeCheck("Checksum Engine Version Available", !!candidate.engineVersion),
            makeCheck("Checksum Mode Disabled", candidate.checksumMode === CHECKSUM_MODE),
            makeCheck("Session Number Available", !!candidate.sessionNumber),
            makeCheck("Milestone Available", !!candidate.milestone),
            makeCheck("Module Correct", candidate.module === "Permanent Transaction Checksum Generator"),
            makeCheck("Algorithm Is SHA-256", candidate.algorithm === CHECKSUM_ALGORITHM),
            makeCheck("Canonicalization Version Available", !!candidate.canonicalizationVersion),
            makeCheck("Manifest Available", manifest.available === true),
            makeCheck("Manifest Validation Available", isObject(manifest.validation)),
            makeCheck("Manifest Validation Valid", !!(manifest.validation && manifest.validation.validStructure === true)),
            makeCheck("Manifest Snapshot Available", isObject(manifest.snapshot)),
            makeCheck("Manifest Marked Immutable", manifest.immutable === true),
            makeCheck("Manifest Not Accepted", manifest.accepted === false),
            makeCheck("Manifest Not Authorized", manifest.authorized === false),
            makeCheck("Integrity Analysis Available", integrity.available === true),
            makeCheck("Integrity Validation Available", isObject(integrity.validation)),
            makeCheck("Integrity Validation Valid", !!(integrity.validation && integrity.validation.validStructure === true)),
            makeCheck("Integrity Verified", integrity.integrityVerified === true),
            makeCheck("Checksum Value Present", typeof checksum.value === "string" && checksum.value.length > 0),
            makeCheck("Checksum Is 64 Characters", checksum.length === 64),
            makeCheck("Checksum Is Lowercase Hex", checksum.lowercaseHex === true),
            makeCheck("Deterministic Repeat Value Present", typeof checksum.deterministicRepeatValue === "string"),
            makeCheck("Deterministic Repeat Matches", checksum.deterministicRepeatMatch === true),
            makeCheck("Canonical Payload Is Nonempty", checksum.canonicalPayloadLength > 0),
            makeCheck("Manifest Placeholder Present", population.manifestPlaceholderPresent === true),
            makeCheck("Manifest Placeholder Not Mutated", population.manifestPlaceholderMutated === false),
            makeCheck("Proposed Algorithm Matches", population.proposedChecksumAlgorithm === CHECKSUM_ALGORITHM),
            makeCheck("Proposed Checksum Matches", population.proposedChecksum === checksum.value),
            makeCheck("Population Mode Read-Only", population.populationMode === "Read-Only Proposal"),
            makeCheck("Execution Not Authorized", safety.executionAuthorized === false),
            makeCheck("Execution Not Attempted", safety.executionAttempted === false),
            makeCheck("Permanent Writes Not Attempted", safety.permanentWritesAttempted === false),
            makeCheck("Permanent Writes Executed Is Zero", safety.permanentWritesExecuted === 0),
            makeCheck("Rollback Not Performed", safety.rollbackPerformed === false),
            makeCheck("Restore Not Performed", safety.restorePerformed === false),
            makeCheck("State Change Not Applied", safety.stateChangeApplied === false),
            makeCheck("Manifest Mutation Not Attempted", safety.manifestMutationAttempted === false),
            makeCheck("Manifest Mutation Not Applied", safety.manifestMutationApplied === false),
            makeCheck("Checksum Report Not Accepted", candidate.accepted === false),
            makeCheck("Checksum Report Not Authorized", candidate.authorized === false)
        ];

        const passedChecks = checks.filter(function (check) {
            return check.passed;
        });
        const failedChecks = checks.filter(function (check) {
            return !check.passed;
        });

        return {
            validationType: VALIDATION_TYPE,
            engineVersion: ENGINE_VERSION,
            validatedAt: new Date().toISOString(),
            checksumMode: CHECKSUM_MODE,
            validStructure: failedChecks.length === 0,
            checksumGenerated: !!checksum.value,
            deterministic: checksum.deterministicRepeatMatch === true,
            passedCheckCount: passedChecks.length,
            failedCheckCount: failedChecks.length,
            checks: checks,
            accepted: false,
            authorized: false
        };
    }

    function formatBoolean(value) {
        return value ? "YES" : "NO";
    }

    function formatChecksumReport(report) {
        const candidate = isObject(report) ? report : {};
        const manifest = isObject(candidate.manifest) ? candidate.manifest : {};
        const integrity = isObject(candidate.integrityAnalysis) ? candidate.integrityAnalysis : {};
        const checksum = isObject(candidate.checksum) ? candidate.checksum : {};
        const population = isObject(candidate.placeholderPopulation) ? candidate.placeholderPopulation : {};
        const validation = isObject(candidate.validationSummary) ? candidate.validationSummary : validateChecksumReport(candidate);
        const safety = isObject(candidate.safetyState) ? candidate.safetyState : {};
        const lines = [];

        lines.push("TMS-OS PERMANENT TRANSACTION CHECKSUM REPORT");
        lines.push("====================================================");
        lines.push("");
        lines.push("Generated At: " + (candidate.generatedAt || "Unknown"));
        lines.push("Session Number: " + (candidate.sessionNumber || "Unknown"));
        lines.push("Milestone: " + (candidate.milestone || "Unknown"));
        lines.push("Module: " + (candidate.module || "Unknown"));
        lines.push("Engine Version: " + (candidate.engineVersion || "Unknown"));
        lines.push("Checksum Mode: " + (candidate.checksumMode || "Unknown"));
        lines.push("Algorithm: " + (candidate.algorithm || "Unknown"));
        lines.push("Canonicalization Version: " + (candidate.canonicalizationVersion || "Unknown"));
        lines.push("Checksum Generated: " + formatBoolean(validation.checksumGenerated));
        lines.push("Deterministic: " + formatBoolean(validation.deterministic));
        lines.push("Accepted: " + formatBoolean(candidate.accepted));
        lines.push("Authorized: " + formatBoolean(candidate.authorized));
        lines.push("");
        lines.push("MANIFEST AND INTEGRITY PREREQUISITES");
        lines.push("----------------------------------------");
        lines.push("Manifest Available: " + formatBoolean(manifest.available));
        lines.push("Manifest Validation Valid: " + formatBoolean(manifest.validation && manifest.validation.validStructure === true));
        lines.push("Manifest Immutable: " + formatBoolean(manifest.immutable));
        lines.push("Integrity Analysis Available: " + formatBoolean(integrity.available));
        lines.push("Integrity Validation Valid: " + formatBoolean(integrity.validation && integrity.validation.validStructure === true));
        lines.push("Integrity Verified: " + formatBoolean(integrity.integrityVerified));
        lines.push("");
        lines.push("CANONICAL CHECKSUM");
        lines.push("----------------------------------------");
        lines.push("Algorithm: " + (candidate.algorithm || "Unknown"));
        lines.push("Checksum: " + (checksum.value || "Not Generated"));
        lines.push("Checksum Length: " + (checksum.length || 0));
        lines.push("Lowercase Hex: " + formatBoolean(checksum.lowercaseHex));
        lines.push("Canonical Payload Length: " + (checksum.canonicalPayloadLength || 0));
        lines.push("Deterministic Repeat Match: " + formatBoolean(checksum.deterministicRepeatMatch));
        lines.push("");
        lines.push("PLACEHOLDER POPULATION PROPOSAL");
        lines.push("----------------------------------------");
        lines.push("Manifest Placeholder Present: " + formatBoolean(population.manifestPlaceholderPresent));
        lines.push("Manifest Placeholder Mutated: " + formatBoolean(population.manifestPlaceholderMutated));
        lines.push("Population Mode: " + (population.populationMode || "Unknown"));
        lines.push("Proposed Algorithm: " + (population.proposedChecksumAlgorithm || "Unknown"));
        lines.push("Proposed Checksum: " + (population.proposedChecksum || "Not Generated"));
        lines.push("");
        lines.push("VALIDATION SUMMARY");
        lines.push("----------------------------------------");
        lines.push("Valid Structure: " + formatBoolean(validation.validStructure));
        lines.push("Checksum Generated: " + formatBoolean(validation.checksumGenerated));
        lines.push("Deterministic: " + formatBoolean(validation.deterministic));
        lines.push("Passed Checks: " + (validation.passedCheckCount || 0));
        lines.push("Failed Checks: " + (validation.failedCheckCount || 0));

        (validation.checks || []).forEach(function (check) {
            lines.push("- " + check.name + ": " + formatBoolean(check.passed));
        });

        lines.push("");
        lines.push("SAFETY STATE");
        lines.push("----------------------------------------");
        lines.push("Execution Authorized: " + formatBoolean(safety.executionAuthorized));
        lines.push("Execution Attempted: " + formatBoolean(safety.executionAttempted));
        lines.push("Permanent Writes Attempted: " + formatBoolean(safety.permanentWritesAttempted));
        lines.push("Permanent Writes Executed: " + (safety.permanentWritesExecuted || 0));
        lines.push("Rollback Performed: " + formatBoolean(safety.rollbackPerformed));
        lines.push("Restore Performed: " + formatBoolean(safety.restorePerformed));
        lines.push("State Change Applied: " + formatBoolean(safety.stateChangeApplied));
        lines.push("Manifest Mutation Attempted: " + formatBoolean(safety.manifestMutationAttempted));
        lines.push("Manifest Mutation Applied: " + formatBoolean(safety.manifestMutationApplied));
        lines.push("");
        lines.push("REQUIRED NEXT ACTION");
        lines.push("----------------------------------------");
        lines.push(candidate.requiredNextAction || "Review the checksum report.");

        return lines.join("\n");
    }

    function getLastChecksumReport() {
        return clone(lastChecksumReport);
    }

    function getChecksumRequirements() {
        return [
            "Permanent Transaction Manifest Generator must be available.",
            "Permanent Transaction Integrity Analyzer must be available.",
            "A valid immutable canonical manifest must be available or generated in read-only mode.",
            "A valid integrity analysis must confirm that the manifest is internally consistent.",
            "The checksum algorithm must be SHA-256.",
            "Canonical serialization must sort object keys and preserve array order.",
            "Volatile timestamp fields must be excluded from the canonical payload.",
            "Checksum and digital-signature placeholder values must be excluded from their own checksum payload.",
            "Identical canonical manifest content must produce identical checksum values.",
            "The checksum must be a 64-character lowercase hexadecimal value.",
            "The checksum report may propose placeholder population but must not mutate the immutable manifest.",
            "Checksum Mode must remain Disabled.",
            "The checksum report must not be accepted or authorized.",
            "Execution and permanent writes must not be attempted.",
            "Rollback, restore, and permanent state changes must not occur."
        ];
    }

    global.TMSPermanentTransactionChecksumGenerator = Object.freeze({
        engineVersion: ENGINE_VERSION,
        checksumMode: CHECKSUM_MODE,
        algorithm: CHECKSUM_ALGORITHM,
        canonicalizationVersion: CANONICALIZATION_VERSION,
        generateChecksumReport: generateChecksumReport,
        validateChecksumReport: validateChecksumReport,
        formatChecksumReport: formatChecksumReport,
        getLastChecksumReport: getLastChecksumReport,
        getChecksumRequirements: getChecksumRequirements
    });
}(window));
