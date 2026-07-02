/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 048D — Knowledge Engine Migration Package Support
File: js/studio-data/knowledge.js
*/

(function () {
    "use strict";

    const knowledgeTypes = [
        "designPrinciples",
        "lessonsLearned",
        "technicalDebt",
        "milestones",
        "research",
        "knowledgePackages",
        "studioChronicle",
        "bugs",
        "recommendations",
        "releases",
        "risks",
        "meetingNotes",
        "aiConversations",
        "migrationPackages"
    ];

    function getRecords(recordType) {
        if (window.StudioDB && typeof window.StudioDB.get === "function") {
            return window.StudioDB.get(recordType);
        }

        return [];
    }

    function getRecordById(recordId) {
        if (window.StudioDB && typeof window.StudioDB.record === "function") {
            return window.StudioDB.record(recordId);
        }

        return null;
    }

    function getAllKnowledgeRecords() {
        const records = [];

        knowledgeTypes.forEach(function (recordType) {
            getRecords(recordType).forEach(function (record) {
                records.push({
                    recordType: recordType,
                    record: record
                });
            });
        });

        return records;
    }

    function getKnowledgePackages() { return getRecords("knowledgePackages"); }
    function getChronicle() { return getRecords("studioChronicle"); }
    function getDesignPrinciples() { return getRecords("designPrinciples"); }
    function getLessons() { return getRecords("lessonsLearned"); }
    function getRecommendations() { return getRecords("recommendations"); }
    function getMilestones() { return getRecords("milestones"); }
    function getTechnicalDebt() { return getRecords("technicalDebt"); }
    function getBugs() { return getRecords("bugs"); }
    function getRisks() { return getRecords("risks"); }
    function getResearch() { return getRecords("research"); }
    function getMeetingNotes() { return getRecords("meetingNotes"); }
    function getAIConversations() { return getRecords("aiConversations"); }
    function getMigrationPackages() { return getRecords("migrationPackages"); }

    function searchKnowledge(query) {
        const cleanQuery = String(query || "").trim();

        if (!cleanQuery || !window.StudioDB || typeof window.StudioDB.search !== "function") {
            return [];
        }

        return window.StudioDB.search(cleanQuery).filter(function (result) {
            return knowledgeTypes.indexOf(result.recordType) !== -1;
        });
    }

    function getRelatedRecords(recordId) {
        const found = getRecordById(recordId);

        if (!found || !found.record) {
            return [];
        }

        const record = found.record;
        const relationshipFields = [
            "relatedWorkSessions",
            "relatedProjects",
            "relatedDecisions",
            "relatedStandards",
            "relatedProcedures",
            "relatedMilestones",
            "relatedBugs",
            "relatedRecommendations",
            "relatedEnhancements",
            "relatedFiles",
            "relatedRecordIds",
            "relatedTechnicalDebt"
        ];

        const relatedIds = [];

        relationshipFields.forEach(function (field) {
            if (Array.isArray(record[field])) {
                record[field].forEach(function (value) {
                    if (relatedIds.indexOf(value) === -1) {
                        relatedIds.push(value);
                    }
                });
            }
        });

        return relatedIds.map(function (id) {
            return {
                id: id,
                match: getRecordById(id)
            };
        });
    }

    function getTimeline() {
        const chronicle = getChronicle();
        const milestones = getMilestones();

        return chronicle.concat(milestones).sort(function (a, b) {
            return String(a.id || "").localeCompare(String(b.id || ""));
        });
    }

    function getKnowledgeSummary() {
        return {
            knowledgePackages: getKnowledgePackages().length,
            migrationPackages: getMigrationPackages().length,
            designPrinciples: getDesignPrinciples().length,
            lessonsLearned: getLessons().length,
            recommendations: getRecommendations().length,
            milestones: getMilestones().length,
            technicalDebt: getTechnicalDebt().length,
            bugs: getBugs().length,
            risks: getRisks().length,
            chronicleEntries: getChronicle().length
        };
    }

    function hasMigrationData(item) {
        return Boolean(item && item.record && item.record.migration);
    }

    function getMigratedRecords() {
        return getAllKnowledgeRecords().filter(hasMigrationData);
    }

    function getNeedsReview() {
        return getMigratedRecords().filter(function (item) {
            const reviewStatus = String(item.record.migration.reviewStatus || "").toLowerCase();
            return reviewStatus === "pending" || reviewStatus === "needs review" || reviewStatus === "";
        });
    }

    function getByConfidence(confidence) {
        const cleanConfidence = String(confidence || "").toLowerCase().trim();

        return getMigratedRecords().filter(function (item) {
            return String(item.record.migration.confidence || "").toLowerCase().trim() === cleanConfidence;
        });
    }

    function getMigrationSummary() {
        const allKnowledgeRecords = getAllKnowledgeRecords();
        const migratedRecords = getMigratedRecords();
        const needsReviewRecords = getNeedsReview();

        const confidenceCounts = {
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0
        };

        migratedRecords.forEach(function (item) {
            const confidence = String(item.record.migration.confidence || "").toLowerCase();

            if (confidenceCounts[confidence] !== undefined) {
                confidenceCounts[confidence] += 1;
            } else {
                confidenceCounts.unknown += 1;
            }
        });

        return {
            totalKnowledgeRecords: allKnowledgeRecords.length,
            migratedRecordCount: migratedRecords.length,
            liveRecordCount: allKnowledgeRecords.length - migratedRecords.length,
            needsReviewCount: needsReviewRecords.length,
            migrationPackageCount: getMigrationPackages().length,
            confidence: confidenceCounts
        };
    }

    window.TMSKnowledge = {
        packages: getKnowledgePackages,
        migrationPackages: getMigrationPackages,
        chronicle: getChronicle,
        designPrinciples: getDesignPrinciples,
        lessons: getLessons,
        recommendations: getRecommendations,
        milestones: getMilestones,
        technicalDebt: getTechnicalDebt,
        bugs: getBugs,
        risks: getRisks,
        research: getResearch,
        meetingNotes: getMeetingNotes,
        aiConversations: getAIConversations,
        related: getRelatedRecords,
        timeline: getTimeline,
        search: searchKnowledge,
        summary: getKnowledgeSummary,

        all: getAllKnowledgeRecords,
        migratedRecords: getMigratedRecords,
        needsReview: getNeedsReview,
        byConfidence: getByConfidence,
        migrationSummary: getMigrationSummary
    };

    console.log("TMS Knowledge Engine loaded successfully.");
})();
