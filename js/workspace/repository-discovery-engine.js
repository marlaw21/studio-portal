/*
=========================================================
TMS-OS Repository Discovery Engine
---------------------------------------------------------
Document ID : WMS-ENGINE-002
Version     : 1.2.0
Status      : Foundation
Purpose     : Reads and validates the approved repository
              configuration from the Workspace Discovery
              Engine.
=========================================================
*/

class TMSRepositoryDiscoveryEngine {

    constructor() {

        this.engineName = "Repository Discovery Engine";
        this.version = "1.2.0";
        this.initialized = false;
        this.repositoryConfiguration = null;
        this.validationReport = null;

    }

    initialize() {

        this.resetState();

        const workspaceEngine =
            window.TMSWorkspaceDiscoveryEngine;

        if (!workspaceEngine) {

            console.error(
                "Repository Discovery Engine could not find the Workspace Discovery Engine."
            );

            return false;

        }

        const workspaceStatus =
            workspaceEngine.getStatus();

        if (
            !workspaceStatus ||
            !workspaceStatus.initialized ||
            !workspaceStatus.validationAccepted
        ) {

            console.error(
                "Repository Discovery Engine requires an initialized and accepted Workspace Discovery Engine."
            );

            return false;

        }

        const workspaceConfiguration =
            workspaceEngine.getConfiguration();

        if (!workspaceConfiguration?.repository) {

            console.error(
                "Approved repository configuration was not found."
            );

            return false;

        }

        this.repositoryConfiguration = {
            name: workspaceConfiguration.repository.name,
            path: workspaceConfiguration.repository.path,
            branch: workspaceConfiguration.repository.branch,
            remote: workspaceConfiguration.repository.remote,
            status: workspaceConfiguration.repository.status
        };

        this.validationReport =
            this.validateRepositoryConfiguration();

        this.initialized =
            this.validationReport.accepted;

        if (!this.initialized) {

            console.error(
                "Repository Discovery Engine validation failed.",
                this.validationReport
            );

            return false;

        }

        console.log(
            "Repository Discovery Engine Initialized"
        );

        return true;

    }

    validateRepositoryConfiguration() {

        const checks = [];

        const addCheck = (
            checkId,
            description,
            passed,
            expected,
            actual
        ) => {

            checks.push({
                checkId,
                description,
                expected,
                actual,
                passed
            });

        };

        if (!this.repositoryConfiguration) {

            return {
                reportType:
                    "Repository Configuration Validation Report",
                engineVersion: this.version,
                accepted: false,
                totalChecks: 0,
                passedChecks: 0,
                failedChecks: 0,
                checks: [],
                failureReason:
                    "No repository configuration is loaded."
            };

        }

        const repository =
            this.repositoryConfiguration;

        addCheck(
            "WMS-REPOSITORY-001",
            "Repository name is present.",
            typeof repository.name === "string" &&
                repository.name.trim().length > 0,
            "Non-empty string",
            repository.name
        );

        addCheck(
            "WMS-REPOSITORY-002",
            "Repository path is present.",
            typeof repository.path === "string" &&
                repository.path.trim().length > 0,
            "Non-empty string",
            repository.path
        );

        addCheck(
            "WMS-REPOSITORY-003",
            "Repository branch is main.",
            repository.branch === "main",
            "main",
            repository.branch
        );

        addCheck(
            "WMS-REPOSITORY-004",
            "Repository remote is present.",
            typeof repository.remote === "string" &&
                repository.remote.trim().length > 0,
            "Non-empty string",
            repository.remote
        );

        addCheck(
            "WMS-REPOSITORY-005",
            "Repository remote uses HTTPS.",
            typeof repository.remote === "string" &&
                repository.remote.startsWith("https://"),
            "HTTPS remote",
            repository.remote
        );

        addCheck(
            "WMS-REPOSITORY-006",
            "Repository status identifies the official development repository.",
            repository.status ===
                "Official Development Repository",
            "Official Development Repository",
            repository.status
        );

        const passedChecks =
            checks.filter(check => check.passed).length;

        const failedChecks =
            checks.filter(check => !check.passed).length;

        return {
            reportType:
                "Repository Configuration Validation Report",
            engineVersion: this.version,
            repositoryName: repository.name,
            accepted: failedChecks === 0,
            totalChecks: checks.length,
            passedChecks,
            failedChecks,
            checks
        };

    }

    resetState() {

        this.initialized = false;
        this.repositoryConfiguration = null;
        this.validationReport = null;

    }

    clone(value) {

        if (value === null || value === undefined) {

            return value;

        }

        return JSON.parse(
            JSON.stringify(value)
        );

    }

    getConfiguration() {

        return this.repositoryConfiguration
            ? this.clone(this.repositoryConfiguration)
            : null;

    }

    getRepositoryConfiguration() {

        return this.getConfiguration();

    }

    getValidationReport() {

        return this.validationReport
            ? this.clone(this.validationReport)
            : null;

    }

    getStatus() {

        return {
            engine: this.engineName,
            version: this.version,
            initialized: this.initialized,
            repositoryConfigurationLoaded:
                this.repositoryConfiguration !== null,
            repositoryConfigurationValidated:
                this.validationReport !== null,
            validationAccepted:
                this.validationReport?.accepted ?? false
        };

    }

}

window.TMSRepositoryDiscoveryEngine =
    new TMSRepositoryDiscoveryEngine();

console.log("Repository Discovery Engine Loaded");