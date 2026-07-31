/*
=========================================================
TMS-OS Workspace Intake Engine
---------------------------------------------------------
Document ID : WMS-ENGINE-004
Version     : 1.0.0
Status      : Foundation
Purpose     : Loads and validates the governed workspace
              inventory intake document through a
              controlled, read-only browser interface.

Operating Mode:
    Read-Only

Restrictions:
    - Does not scan the computer.
    - Does not modify the source intake JSON file.
    - Does not move, rename, archive, or delete files.
    - Does not perform cleanup actions.
=========================================================
*/

class TMSWorkspaceIntakeEngine {

    constructor() {

        this.engineName =
            "Workspace Intake Engine";

        this.version =
            "1.0.0";

        this.intakeDocumentPath =
            "governance/workspace/intake/WORKSPACE-INVENTORY-INTAKE-001.json";

        this.initialized =
            false;

        this.workspaceConfiguration =
            null;

        this.repositoryConfiguration =
            null;

        this.governedIntakeDocument =
            null;

        this.intake =
            null;

        this.validationReport =
            null;

    }

    async initialize() {

        this.resetState();

        const workspaceEngine =
            window.TMSWorkspaceDiscoveryEngine;

        const repositoryEngine =
            window.TMSRepositoryDiscoveryEngine;

        if (!workspaceEngine || !repositoryEngine) {

            console.error(
                "Required discovery engines are unavailable."
            );

            return false;

        }

        const workspaceStatus =
            workspaceEngine.getStatus();

        const repositoryStatus =
            repositoryEngine.getStatus();

        if (!workspaceStatus.validationAccepted) {

            console.error(
                "Workspace Discovery Engine has not been validated."
            );

            return false;

        }

        if (!repositoryStatus.validationAccepted) {

            console.error(
                "Repository Discovery Engine has not been validated."
            );

            return false;

        }

        this.workspaceConfiguration =
            workspaceEngine.getConfiguration();

        this.repositoryConfiguration =
            repositoryEngine.getRepositoryConfiguration();

        const intakeLoaded =
            await this.loadGovernedIntakeDocument();

        if (!intakeLoaded) {

            return false;

        }

        this.intake =
            this.governedIntakeDocument;

        this.prepareIntakeStructure();

        this.populateApprovedPaths();

        this.validationReport =
            this.validateIntakeStructure();

        this.applyValidationResult();

        this.initialized =
            this.validationReport.accepted;

        if (!this.initialized) {

            console.error(
                "Workspace Intake Engine validation failed.",
                this.validationReport
            );

            return false;

        }

        console.log(
            "Workspace Intake Engine Initialized"
        );

        return true;

    }

    async loadGovernedIntakeDocument() {

        try {

            const response =
                await fetch(
                    this.intakeDocumentPath,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Intake document request failed with status ${response.status}.`
                );

            }

            const document =
                await response.json();

            if (
                document === null ||
                typeof document !== "object" ||
                Array.isArray(document)
            ) {

                throw new Error(
                    "Intake document must contain a JSON object."
                );

            }

            this.governedIntakeDocument =
                document;

            console.log(
                "Governed workspace intake document loaded."
            );

            return true;

        } catch (error) {

            this.governedIntakeDocument =
                null;

            this.intake =
                null;

            console.error(
                "Unable to load governed workspace intake document.",
                error
            );

            return false;

        }

    }

    prepareIntakeStructure() {

        if (
            !this.intake.workspace ||
            typeof this.intake.workspace !== "object" ||
            Array.isArray(this.intake.workspace)
        ) {

            this.intake.workspace = {
                rootPath: null,
                repositoryPath: null
            };

        }

        if (
            !this.intake.source ||
            typeof this.intake.source !== "object" ||
            Array.isArray(this.intake.source)
        ) {

            this.intake.source = {
                captureMethod: null,
                capturedBy: null,
                operatingSystem: null
            };

        }

        if (
            !this.intake.summary ||
            typeof this.intake.summary !== "object" ||
            Array.isArray(this.intake.summary)
        ) {

            this.intake.summary = {
                folderCount: 0,
                fileCount: 0
            };

        }

        if (!Array.isArray(this.intake.folders)) {

            this.intake.folders = [];

        }

        if (!Array.isArray(this.intake.files)) {

            this.intake.files = [];

        }

        if (
            !this.intake.validation ||
            typeof this.intake.validation !== "object" ||
            Array.isArray(this.intake.validation)
        ) {

            this.intake.validation = {
                validated: false,
                accepted: false
            };

        }

        this.intake.summary.folderCount =
            this.getNonNegativeNumber(
                this.intake.summary.folderCount
            );

        this.intake.summary.fileCount =
            this.getNonNegativeNumber(
                this.intake.summary.fileCount
            );

    }

    populateApprovedPaths() {

        this.intake.workspace.rootPath =
            this.workspaceConfiguration?.workspace?.rootPath
            ?? null;

        this.intake.workspace.repositoryPath =
            this.repositoryConfiguration?.path
            ?? null;

    }

    getNonNegativeNumber(value) {

        if (
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value < 0
        ) {

            return 0;

        }

        return value;

    }

    validateIntakeStructure() {

        const checks = [];

        const addCheck = (
            id,
            description,
            passed,
            expected,
            actual
        ) => {

            checks.push({
                checkId: id,
                description,
                expected,
                actual,
                passed
            });

        };

        const document =
            this.intake;

        addCheck(
            "WMS-INTAKE-001",
            "Governed intake document is loaded.",
            document !== null,
            "Loaded intake document",
            document !== null
        );

        addCheck(
            "WMS-INTAKE-002",
            "Intake document identity is correct.",
            document?.documentId ===
                "WORKSPACE-INVENTORY-INTAKE-001",
            "WORKSPACE-INVENTORY-INTAKE-001",
            document?.documentId
        );

        addCheck(
            "WMS-INTAKE-003",
            "Intake document type is correct.",
            document?.intakeType ===
                "Workspace Inventory Intake",
            "Workspace Inventory Intake",
            document?.intakeType
        );

        addCheck(
            "WMS-INTAKE-004",
            "Intake document contains a folder collection.",
            Array.isArray(document?.folders),
            "Array",
            Array.isArray(document?.folders)
                ? "Array"
                : typeof document?.folders
        );

        addCheck(
            "WMS-INTAKE-005",
            "Intake document contains a file collection.",
            Array.isArray(document?.files),
            "Array",
            Array.isArray(document?.files)
                ? "Array"
                : typeof document?.files
        );

        addCheck(
            "WMS-INTAKE-006",
            "Workspace root is available from approved configuration.",
            typeof document?.workspace?.rootPath ===
                "string" &&
            document.workspace.rootPath.trim().length > 0,
            "Approved workspace root path",
            document?.workspace?.rootPath
        );

        addCheck(
            "WMS-INTAKE-007",
            "Repository root is available from approved configuration.",
            typeof document?.workspace?.repositoryPath ===
                "string" &&
            document.workspace.repositoryPath.trim().length > 0,
            "Approved repository root path",
            document?.workspace?.repositoryPath
        );

        addCheck(
            "WMS-INTAKE-008",
            "Intake source structure is present.",
            typeof document?.source === "object" &&
                document?.source !== null &&
                !Array.isArray(document?.source),
            "Source object",
            typeof document?.source
        );

        addCheck(
            "WMS-INTAKE-009",
            "Intake summary structure is present.",
            typeof document?.summary === "object" &&
                document?.summary !== null &&
                !Array.isArray(document?.summary),
            "Summary object",
            typeof document?.summary
        );

        const passedChecks =
            checks.filter(
                check => check.passed
            ).length;

        const failedChecks =
            checks.filter(
                check => !check.passed
            ).length;

        return {
            reportType:
                "Workspace Intake Validation Report",

            engineVersion:
                this.version,

            intakeDocumentId:
                document?.documentId ?? null,

            accepted:
                failedChecks === 0,

            totalChecks:
                checks.length,

            passedChecks,

            failedChecks,

            checks
        };

    }

    applyValidationResult() {

        if (!this.intake) {

            return;

        }

        this.intake.validation.validated =
            true;

        this.intake.validation.accepted =
            this.validationReport?.accepted
            ?? false;

    }

    resetState() {

        this.initialized =
            false;

        this.workspaceConfiguration =
            null;

        this.repositoryConfiguration =
            null;

        this.governedIntakeDocument =
            null;

        this.intake =
            null;

        this.validationReport =
            null;

    }

    getGovernedIntakeDocument() {

        return this.governedIntakeDocument;

    }

    getIntake() {

        return this.intake;

    }

    getValidationReport() {

        return this.validationReport;

    }

    getStatus() {

        return {
            engine:
                this.engineName,

            version:
                this.version,

            initialized:
                this.initialized,

            workspaceConfigurationLoaded:
                this.workspaceConfiguration !== null,

            repositoryConfigurationLoaded:
                this.repositoryConfiguration !== null,

            governedIntakeDocumentLoaded:
                this.governedIntakeDocument !== null,

            intakeInitialized:
                typeof this.intake?.workspace?.rootPath ===
                    "string" &&
                this.intake.workspace.rootPath.trim().length > 0,

            validationAccepted:
                this.validationReport?.accepted
                ?? false
        };

    }

}

window.TMSWorkspaceIntakeEngine =
    new TMSWorkspaceIntakeEngine();

console.log(
    "Workspace Intake Engine Loaded"
);