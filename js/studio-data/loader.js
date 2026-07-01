/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 045D — StudioDB Schema Validation Engine
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
        enhancements: ["id", "title", "status"]
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
        }
    };

    console.log("Studio data and StudioDB loaded successfully:", {
        studioData: window.studioData,
        StudioDB: window.StudioDB
    });
})();