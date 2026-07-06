/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049B — Modular Projects Record Support
File: js/studio-data/loader.js
*/

(function () {
    "use strict";

    window.studioData = {
        ...(window.studioCoreData || {}),
        ...(window.studioDocumentationData || {}),
        ...(window.studioDepartmentData || {})
    };

    if (window.studioDatabaseData && window.studioDatabaseData.records) {
        window.studioData.database = window.studioDatabaseData;
        window.studioData.records = window.studioDatabaseData.records;
    }

    if (!window.studioData.records) {
        window.studioData.records = {};
    }

    if (Array.isArray(window.studioRecordProjects)) {
        window.studioData.records.projects = window.studioRecordProjects;
    }

    if (Array.isArray(window.studioRecordWorkSessions)) {
    window.studioData.records.workSessions = window.studioRecordWorkSessions;
    }

    if (Array.isArray(window.studioRecordMilestones)) {
    window.studioData.records.milestones = window.studioRecordMilestones;
    }

    if (Array.isArray(window.studioRecordDesignPrinciples)) {
    window.studioData.records.designPrinciples = window.studioRecordDesignPrinciples;
    }

    if (Array.isArray(window.studioRecordLessonsLearned)) {
    window.studioData.records.lessonsLearned = window.studioRecordLessonsLearned;
    }

    if (Array.isArray(window.studioRecordTechnicalDebt)) {
    window.studioData.records.technicalDebt = window.studioRecordTechnicalDebt;
    }

    if (Array.isArray(window.studioRecordResearch)) {
    window.studioData.records.research = window.studioRecordResearch;
    }

    if (Array.isArray(window.studioRecordKnowledgePackages)) {
    window.studioData.records.knowledgePackages = window.studioRecordKnowledgePackages;
    }

    if (Array.isArray(window.studioRecordStudioChronicle)) {
    window.studioData.records.studioChronicle = window.studioRecordStudioChronicle;
    }

    if (Array.isArray(window.studioRecordBugs)) {
    window.studioData.records.bugs = window.studioRecordBugs;
    }

    if (Array.isArray(window.studioRecordRecommendations)) {
    window.studioData.records.recommendations = window.studioRecordRecommendations;
    }

    if (Array.isArray(window.studioRecordReleases)) {
    window.studioData.records.releases = window.studioRecordReleases;
    }

    if (Array.isArray(window.studioRecordRisks)) {
    window.studioData.records.risks = window.studioRecordRisks;
    }

    if (Array.isArray(window.studioRecordMeetingNotes)) {
    window.studioData.records.meetingNotes = window.studioRecordMeetingNotes;
    }

    if (Array.isArray(window.studioRecordAIConversations)) {
    window.studioData.records.aiConversations = window.studioRecordAIConversations;
    }

    if (Array.isArray(window.studioRecordMigrationPackages)) {
    window.studioData.records.migrationPackages = window.studioRecordMigrationPackages;
    }

    if (Array.isArray(window.studioRecordDecisions)) {
    window.studioData.records.decisions = window.studioRecordDecisions;
    }

    if (Array.isArray(window.studioRecordStandards)) {
    window.studioData.records.standards = window.studioRecordStandards;
    }

    if (Array.isArray(window.studioRecordProcedures)) {
    window.studioData.records.procedures = window.studioRecordProcedures;
    }

    if (Array.isArray(window.studioRecordEnhancements)) {
    window.studioData.records.enhancements = window.studioRecordEnhancements;
    }

    if (Array.isArray(window.studioRecordStatus)) {
    window.studioData.records.status = window.studioRecordStatus;
    }
    
    if (Array.isArray(window.studioRecordNotifications)) {
    window.studioData.records.notifications = window.studioRecordNotifications;
    }

    if (Array.isArray(window.studioRecordStudioCommands)) {
    window.studioData.records.studioCommands = window.studioRecordStudioCommands;
    }

    if (Array.isArray(window.studioRecordSystemConfig)) {
    window.studioData.records.systemConfig = window.studioRecordSystemConfig;
    }

    if (Array.isArray(window.studioRecordProgress)) {
    window.studioData.records.progress = window.studioRecordProgress;
    }

    if (Array.isArray(window.studioRecordDepartments)) {
    window.studioData.records.departments = window.studioRecordDepartments;
    }

    if (Array.isArray(window.studioRecordAssetCategories)) {
    window.studioData.records.assetCategories = window.studioRecordAssetCategories;
    }

    if (Array.isArray(window.studioRecordAssetGroups)) {
    window.studioData.records.assetGroups = window.studioRecordAssetGroups;
    }

    if (Array.isArray(window.studioRecordPublishingChannels)) {
    window.studioData.records.publishingChannels = window.studioRecordPublishingChannels;
    }

    if (Array.isArray(window.studioRecordPublishingPipeline)) {
    window.studioData.records.publishingPipeline = window.studioRecordPublishingPipeline;
    }

    if (Array.isArray(window.studioRecordMarketingChannels)) {
    window.studioData.records.marketingChannels = window.studioRecordMarketingChannels;
    }

    if (Array.isArray(window.studioRecordMarketingPipeline)) {
    window.studioData.records.marketingPipeline = window.studioRecordMarketingPipeline;
    }

    window.studio = window.studioData;

    const recordSchemas = {
        workSessions: ["id", "title", "status", "version"],
        projects: ["id", "title", "status"],
        status: ["id", "name", "value"],
        notifications: ["id", "title", "status"],
        studioCommands: ["id", "title", "status"],
        systemConfig: ["id", "name", "value"],
        progress: ["id", "name", "value"],
        departments: ["id", "title", "url"],
        assetCategories: ["id", "title", "status"],
        assetGroups: ["id", "title", "description"],
        publishingChannels: ["id", "title", "status"],
        publishingPipeline: ["id", "title", "description"],
        marketingChannels: ["id", "title", "status"],
        marketingPipeline: ["id", "title", "description"],
        decisions: ["id", "title", "status"],
        standards: ["id", "title", "status"],
        procedures: ["id", "title", "status"],
        enhancements: ["id", "title", "status"],
        designPrinciples: ["id", "title", "status"],
        lessonsLearned: ["id", "title", "status"],
        technicalDebt: ["id", "title", "status"],
        milestones: ["id", "title", "status"],
        research: ["id", "title", "status"],
        knowledgePackages: ["id", "title", "status"],
        studioChronicle: ["id", "title", "status"],
        bugs: ["id", "title", "status"],
        recommendations: ["id", "title", "status"],
        releases: ["id", "title", "status"],
        risks: ["id", "title", "status"],
        meetingNotes: ["id", "title", "status"],
        aiConversations: ["id", "title", "status"],
        migrationPackages: ["id", "title", "status"]
    };

    function getRecords(recordType) {
        if (
            window.studioData &&
            window.studioData.records &&
            Array.isArray(window.studioData.records[recordType])
        ) {
            return window.studioData.records[recordType];
        }

        return [];
    }

    function getAllRecordTypes() {
        if (
            window.studioData &&
            window.studioData.records &&
            typeof window.studioData.records === "object"
        ) {
            return Object.keys(window.studioData.records);
        }

        return [];
    }

    function getAllRecords() {
        const allRecords = [];

        getAllRecordTypes().forEach(function (recordType) {
            getRecords(recordType).forEach(function (record) {
                allRecords.push({
                    recordType: recordType,
                    record: record
                });
            });
        });

        return allRecords;
    }

    function getMeta() {
        if (window.studioData && window.studioData.database && window.studioData.database.meta) {
            return window.studioData.database.meta;
        }

        return {};
    }

    function getDepartmentRecords() {
        return getRecords("departments");
    }

    function getSchema(recordType) {
        return recordSchemas[recordType] || ["id", "title"];
    }

    function validateOneRecord(record, recordType) {
        const requiredFields = getSchema(recordType);

        const missingFields = requiredFields.filter(function (field) {
            return !record || record[field] === undefined || record[field] === null || record[field] === "";
        });

        return {
            isValid: missingFields.length === 0,
            missingFields: missingFields,
            schema: requiredFields
        };
    }

    function buildValidationReport() {
        const allRecords = getAllRecords();
        const seenIds = {};
        const duplicateIds = [];
        const invalidRecords = [];

        allRecords.forEach(function (item) {
            const record = item.record || {};
            const validation = validateOneRecord(record, item.recordType);
            const id = record.id || "";

            if (!validation.isValid) {
                invalidRecords.push({
                    recordType: item.recordType,
                    id: id || "Missing ID",
                    title: record.title || record.name || record.label || "Untitled",
                    missingFields: validation.missingFields,
                    schema: validation.schema
                });
            }

            if (id) {
                if (seenIds[id]) {
                    duplicateIds.push(id);
                } else {
                    seenIds[id] = true;
                }
            }
        });

        return {
            totalRecords: allRecords.length,
            totalRecordTypes: getAllRecordTypes().length,
            invalidRecords: invalidRecords,
            invalidRecordCount: invalidRecords.length,
            duplicateIds: duplicateIds,
            duplicateIdCount: duplicateIds.length,
            isValid: invalidRecords.length === 0 && duplicateIds.length === 0
        };
    }

    function exportData() {
        return {
            meta: {
                ...getMeta(),
                exportedAt: new Date().toISOString(),
                exportedBy: "StudioDB.exportData",
                validation: buildValidationReport()
            },
            records: JSON.parse(JSON.stringify(window.studioData.records || {})),
            schemas: JSON.parse(JSON.stringify(recordSchemas))
        };
    }

    function exportJSON() {
        return JSON.stringify(exportData(), null, 2);
    }

    function downloadJSON() {
        const json = exportJSON();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const today = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = "studio-db-export-" + today + ".json";
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return {
            fileName: link.download,
            recordCount: getAllRecords().length,
            exportedAt: new Date().toISOString()
        };
    }

    window.StudioDB = {
        get: function (recordType) {
            return getRecords(recordType).slice();
        },

        find: function (recordType, id) {
            return getRecords(recordType).find(function (record) {
                return record.id === id;
            }) || null;
        },

        filter: function (recordType, fieldName, value) {
            return getRecords(recordType).filter(function (record) {
                return String(record[fieldName] || "").toLowerCase() === String(value || "").toLowerCase();
            });
        },

        count: function (recordType) {
            return getRecords(recordType).length;
        },

        latest: function (recordType, limit) {
            const max = limit || 5;
            return getRecords(recordType).slice(0, max);
        },

        search: function (query) {
            const cleanQuery = String(query || "").toLowerCase().trim();
            const results = [];

            if (!cleanQuery) return results;

            getAllRecordTypes().forEach(function (recordType) {
                getRecords(recordType).forEach(function (record) {
                    const text = Object.keys(record).map(function (key) {
                        return String(record[key] || "");
                    }).join(" ").toLowerCase();

                    if (text.includes(cleanQuery)) {
                        results.push({
                            recordType: recordType,
                            record: record
                        });
                    }
                });
            });

            return results;
        },

        types: function () {
            return getAllRecordTypes();
        },

        all: function () {
            return getAllRecords();
        },

        recordCount: function () {
            return getAllRecords().length;
        },

        getById: function (id) {
            const cleanId = String(id || "").trim();

            if (!cleanId) return null;

            return getAllRecords().find(function (item) {
                return item.record && item.record.id === cleanId;
            }) || null;
        },

        record: function (id) {
            return this.getById(id);
        },

        exists: function (recordType) {
            return getAllRecordTypes().indexOf(recordType) !== -1;
        },

        meta: function () {
            return { ...getMeta() };
        },

        version: function () {
            return getMeta().version || "Unknown";
        },

        departments: function () {
            return getDepartmentRecords().slice();
        },

        schema: function (recordType) {
            return getSchema(recordType).slice();
        },

        schemas: function () {
            return { ...recordSchemas };
        },

        validateRecord: function (record, recordType) {
            return validateOneRecord(record, recordType);
        },

        validationReport: function () {
            return buildValidationReport();
        },

        exportData: function () {
            return exportData();
        },

        exportJSON: function () {
            return exportJSON();
        },

        downloadJSON: function () {
            return downloadJSON();
        }
    };

    console.log("Studio data and StudioDB loaded successfully:", {
        studioData: window.studioData,
        StudioDB: window.StudioDB
    });
})();