/*
=========================================================
TMS-OS Workspace Inventory Engine
---------------------------------------------------------
Document ID : WMS-ENGINE-003
Version     : 2.0.0
Status      : Foundation
Purpose     : Loads, validates, and prepares the governed
              workspace inventory document as the single
              authoritative runtime inventory model.

Operating Mode:
    Read-Only

Restrictions:
    - Does not scan the computer.
    - Does not modify the source JSON file.
    - Does not move, rename, archive, or delete files.
    - Does not perform cleanup actions.
=========================================================
*/

class TMSWorkspaceInventoryEngine {

    constructor() {

        this.engineName = "Workspace Inventory Engine";
        this.version = "2.0.0";

        this.inventoryDocumentPath =
            "governance/workspace/inventory/WORKSPACE-INVENTORY-001.json";

        this.initialized = false;

        this.workspaceConfiguration = null;
        this.repositoryConfiguration = null;

        this.governedInventoryDocument = null;

        /*
        -------------------------------------------------
        The governed inventory document is the runtime
        inventory model.

        No separate simplified inventory object is created.
        -------------------------------------------------
        */
        this.inventory = null;

        this.validationReport = null;

    }

    createEmptyInventory() {

        return {
            documentId: "WORKSPACE-INVENTORY-001",
            version: "1.1.0",
            status: "Foundation",

            inventoryType: "Workspace Inventory",

            generatedAt: null,
            generatedBy: "Workspace Inventory Engine",
            engineVersion: this.version,

            accepted: false,

            workspace: {
                rootPath: null,
                repositoryPath: null
            },

            summary: {
                folderCount: 0,
                fileCount: 0,
                classifiedItems: 0,
                unclassifiedItems: 0
            },

            folders: [],

            files: [],

            classification: {
                officialRepositories: [],
                officialGovernance: [],
                officialDocumentation: [],
                recoveryCopies: [],
                backups: [],
                archives: [],
                temporary: [],
                unknown: []
            },

            validation: {
                validated: false,
                accepted: false
            }
        };

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

        const inventoryDocumentLoaded =
            await this.loadGovernedInventoryDocument();

        if (!inventoryDocumentLoaded) {

            return false;

        }

        /*
        -------------------------------------------------
        Use the governed document as the runtime inventory.
        -------------------------------------------------
        */
        this.inventory =
            this.governedInventoryDocument;

        this.prepareInventoryStructure();

        this.populateApprovedPaths();

        this.validationReport =
            this.validateInventoryStructure();

        this.applyValidationResult();

        this.initialized =
            this.validationReport.accepted;

        if (!this.initialized) {

            console.error(
                "Workspace Inventory Engine validation failed.",
                this.validationReport
            );

            return false;

        }

        console.log(
            "Workspace Inventory Engine Initialized"
        );

        return true;

    }

    async loadGovernedInventoryDocument() {

        try {

            const response =
                await fetch(
                    this.inventoryDocumentPath,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {

                throw new Error(
                    `Inventory document request failed with status ${response.status}.`
                );

            }

            const inventoryDocument =
                await response.json();

            if (
                inventoryDocument === null ||
                typeof inventoryDocument !== "object" ||
                Array.isArray(inventoryDocument)
            ) {

                throw new Error(
                    "Inventory document must contain a JSON object."
                );

            }

            this.governedInventoryDocument =
                inventoryDocument;

            console.log(
                "Governed workspace inventory document loaded."
            );

            return true;

        } catch (error) {

            this.governedInventoryDocument = null;
            this.inventory = null;

            console.error(
                "Unable to load governed workspace inventory document.",
                error
            );

            return false;

        }

    }

    prepareInventoryStructure() {

        if (
            !this.inventory ||
            typeof this.inventory !== "object"
        ) {

            this.inventory =
                this.createEmptyInventory();

            this.governedInventoryDocument =
                this.inventory;

            return;

        }

        if (
            !this.inventory.workspace ||
            typeof this.inventory.workspace !== "object" ||
            Array.isArray(this.inventory.workspace)
        ) {

            this.inventory.workspace = {
                rootPath: null,
                repositoryPath: null
            };

        }

        if (!Array.isArray(this.inventory.folders)) {

            this.inventory.folders = [];

        }

        if (!Array.isArray(this.inventory.files)) {

            this.inventory.files = [];

        }

        if (
            !this.inventory.summary ||
            typeof this.inventory.summary !== "object" ||
            Array.isArray(this.inventory.summary)
        ) {

            this.inventory.summary = {};

        }

        this.inventory.summary.folderCount =
            this.getNonNegativeNumber(
                this.inventory.summary.folderCount
            );

        this.inventory.summary.fileCount =
            this.getNonNegativeNumber(
                this.inventory.summary.fileCount
            );

        this.inventory.summary.classifiedItems =
            this.getNonNegativeNumber(
                this.inventory.summary.classifiedItems
            );

        this.inventory.summary.unclassifiedItems =
            this.getNonNegativeNumber(
                this.inventory.summary.unclassifiedItems
            );

        if (
            !this.inventory.classification ||
            typeof this.inventory.classification !== "object" ||
            Array.isArray(this.inventory.classification)
        ) {

            this.inventory.classification = {};

        }

        const classificationCollections = [
            "officialRepositories",
            "officialGovernance",
            "officialDocumentation",
            "recoveryCopies",
            "backups",
            "archives",
            "temporary",
            "unknown"
        ];

        classificationCollections.forEach(
            collectionName => {

                if (
                    !Array.isArray(
                        this.inventory.classification[
                            collectionName
                        ]
                    )
                ) {

                    this.inventory.classification[
                        collectionName
                    ] = [];

                }

            }
        );

        if (
            !this.inventory.validation ||
            typeof this.inventory.validation !== "object" ||
            Array.isArray(this.inventory.validation)
        ) {

            this.inventory.validation = {
                validated: false,
                accepted: false
            };

        }

        this.inventory.engineVersion =
            this.version;

    }

    populateApprovedPaths() {

        const workspaceRoot =
            this.workspaceConfiguration?.workspace?.rootPath
            ?? null;

        const repositoryRoot =
            this.repositoryConfiguration?.path
            ?? null;

        this.inventory.workspace.rootPath =
            workspaceRoot;

        this.inventory.workspace.repositoryPath =
            repositoryRoot;

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

    validateInventoryStructure() {

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
            this.inventory;

        addCheck(
            "WMS-INVENTORY-001",
            "Governed inventory document is loaded.",
            document !== null,
            "Loaded inventory document",
            document !== null
        );

        addCheck(
            "WMS-INVENTORY-002",
            "Inventory document identity is correct.",
            document?.documentId ===
                "WORKSPACE-INVENTORY-001",
            "WORKSPACE-INVENTORY-001",
            document?.documentId
        );

        addCheck(
            "WMS-INVENTORY-003",
            "Inventory document type is correct.",
            document?.inventoryType ===
                "Workspace Inventory",
            "Workspace Inventory",
            document?.inventoryType
        );

        addCheck(
            "WMS-INVENTORY-004",
            "Inventory document contains a folder collection.",
            Array.isArray(document?.folders),
            "Array",
            Array.isArray(document?.folders)
                ? "Array"
                : typeof document?.folders
        );

        addCheck(
            "WMS-INVENTORY-005",
            "Inventory document contains a file collection.",
            Array.isArray(document?.files),
            "Array",
            Array.isArray(document?.files)
                ? "Array"
                : typeof document?.files
        );

        addCheck(
            "WMS-INVENTORY-006",
            "Workspace root is available from approved configuration.",
            typeof document?.workspace?.rootPath ===
                "string" &&
            document.workspace.rootPath.trim().length > 0,
            "Approved workspace root path",
            document?.workspace?.rootPath
        );

        addCheck(
            "WMS-INVENTORY-007",
            "Repository root is available from approved configuration.",
            typeof document?.workspace?.repositoryPath ===
                "string" &&
            document.workspace.repositoryPath.trim().length > 0,
            "Approved repository root path",
            document?.workspace?.repositoryPath
        );

        addCheck(
            "WMS-INVENTORY-008",
            "Inventory summary is present.",
            typeof document?.summary === "object" &&
                document?.summary !== null &&
                !Array.isArray(document?.summary),
            "Summary object",
            typeof document?.summary
        );

        addCheck(
            "WMS-INVENTORY-009",
            "Inventory summary contains classified item count.",
            typeof document?.summary?.classifiedItems ===
                "number",
            "Number",
            typeof document?.summary?.classifiedItems
        );

        addCheck(
            "WMS-INVENTORY-010",
            "Inventory summary contains unclassified item count.",
            typeof document?.summary?.unclassifiedItems ===
                "number",
            "Number",
            typeof document?.summary?.unclassifiedItems
        );

        addCheck(
            "WMS-INVENTORY-011",
            "Inventory classification structure is present.",
            typeof document?.classification ===
                "object" &&
            document?.classification !== null &&
            !Array.isArray(document?.classification),
            "Classification object",
            typeof document?.classification
        );

        const requiredClassificationCollections = [
            "officialRepositories",
            "officialGovernance",
            "officialDocumentation",
            "recoveryCopies",
            "backups",
            "archives",
            "temporary",
            "unknown"
        ];

        requiredClassificationCollections.forEach(
            (
                collectionName,
                index
            ) => {

                addCheck(
                    `WMS-INVENTORY-${String(
                        index + 12
                    ).padStart(3, "0")}`,
                    `Classification collection ${collectionName} is present.`,
                    Array.isArray(
                        document?.classification?.[
                            collectionName
                        ]
                    ),
                    "Array",
                    Array.isArray(
                        document?.classification?.[
                            collectionName
                        ]
                    )
                        ? "Array"
                        : typeof document?.classification?.[
                            collectionName
                        ]
                );

            }
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
                "Workspace Inventory Validation Report",

            engineVersion:
                this.version,

            inventoryDocumentId:
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

        if (!this.inventory) {

            return;

        }

        if (
            !this.inventory.validation ||
            typeof this.inventory.validation !== "object"
        ) {

            this.inventory.validation = {};

        }

        this.inventory.validation.validated = true;

        this.inventory.validation.accepted =
            this.validationReport?.accepted ?? false;

        /*
        -------------------------------------------------
        accepted represents the current runtime validation
        result only. This does not write back to the source
        JSON file.
        -------------------------------------------------
        */
        this.inventory.accepted =
            this.validationReport?.accepted ?? false;

    }

    resetState() {

        this.initialized = false;

        this.workspaceConfiguration = null;
        this.repositoryConfiguration = null;

        this.governedInventoryDocument = null;
        this.inventory = null;

        this.validationReport = null;

    }

    getGovernedInventoryDocument() {

        return this.governedInventoryDocument;

    }

    getInventory() {

        return this.inventory;

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

            governedInventoryDocumentLoaded:
                this.governedInventoryDocument !== null,

            inventoryInitialized:
                typeof this.inventory?.workspace?.rootPath ===
                    "string" &&
                this.inventory.workspace.rootPath.trim().length > 0,

            validationAccepted:
                this.validationReport?.accepted ?? false
        };

    }

}

window.TMSWorkspaceInventoryEngine =
    new TMSWorkspaceInventoryEngine();

console.log(
    "Workspace Inventory Engine Loaded"
);