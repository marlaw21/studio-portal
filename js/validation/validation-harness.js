"use strict";

/*
=========================================================
 TMS-OS Controlled Permanent Output Validation Harness
 Version: 1.1.0
 Status: Foundation
 Mode: Disabled
=========================================================
*/

(function () {
    const HARNESS_VERSION = "1.1.0";
    const HARNESS_NAME =
        "Controlled Permanent Output Validation Harness";
    const HARNESS_MODE = "Disabled";

    function isModuleInstalled(globalName) {
        return Boolean(window[globalName]);
    }

    function getLastValidation() {
        const runner = window.TMSValidationPipelineRunner;

        if (
            !runner ||
            typeof runner.getLastValidation !== "function"
        ) {
            return null;
        }

        return runner.getLastValidation();
    }

    function getInformation() {
        return Object.freeze({
            harnessName: HARNESS_NAME,
            harnessVersion: HARNESS_VERSION,
            harnessMode: HARNESS_MODE,

            initialized: true,

            pipelineRunnerInstalled:
                isModuleInstalled("TMSValidationPipelineRunner"),

            stageMonitorInstalled:
                isModuleInstalled("TMSValidationStageMonitor"),

            artifactViewerInstalled:
                isModuleInstalled("TMSValidationArtifactViewer"),

            validationSummaryInstalled:
                isModuleInstalled("TMSValidationSummary"),

            reportGeneratorInstalled:
                isModuleInstalled(
                    "TMSValidationReportGenerator"
                ),

            lastValidation: getLastValidation()
        });
    }

    function initialize() {
        return Object.freeze({
            accepted: true,

            harnessName: HARNESS_NAME,
            harnessVersion: HARNESS_VERSION,
            harnessMode: HARNESS_MODE,

            initializationStatus:
                "Validation Harness Initialized",

            generatedAt:
                new Date().toISOString()
        });
    }

    window.TMSValidationHarness = Object.freeze({
        engineVersion: HARNESS_VERSION,

        initialize,
        getInformation
    });
})();