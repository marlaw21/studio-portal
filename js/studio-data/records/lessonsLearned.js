/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049G — Modular Lessons Learned Records
File: js/studio-data/records/lessonsLearned.js
*/

window.studioRecordLessonsLearned = [
    {
        id: "LESSON-2026-0001",
        title: "Schema-Aware Validation Is Better Than Generic Validation",
        status: "Active",
        department: "Core Architecture",
        summary: "A generic validator incorrectly flagged status, systemConfig, and progress records, leading to the decision to validate each record type by its own schema.",
        relatedWorkSessions: ["WS-2026-0045"],
        relatedFiles: ["js/studio-data/loader.js"]
    },
    {
        id: "LESSON-2026-0002",
        title: "Script Load Order Controls StudioDB Availability",
        status: "Active",
        department: "Development",
        summary: "Pages must load database.js before loader.js or StudioDB will not contain the expected records.",
        relatedWorkSessions: ["WS-2026-0044"],
        relatedFiles: [
            "pages/assets.html",
            "pages/development.html",
            "pages/publishing.html",
            "pages/marketing.html",
            "pages/business.html"
        ]
    },
    {
        id: "LESSON-2026-0003",
        title: "JSON Export Should Come Before Google Sync",
        status: "Active",
        department: "Core Architecture",
        summary: "Local JSON export gives TMS-OS a portable data format before introducing Google authentication, permissions, and synchronization complexity.",
        relatedWorkSessions: ["WS-2026-0046"],
        relatedRecommendations: ["REC-2026-0001"],
        relatedEnhancements: ["ENH-2026-0001"]
    },
    {
        id: "LESSON-2026-0004",
        title: "StudioDB Enables Cross-Department Search",
        status: "Active",
        department: "Core Architecture",
        summary: "Once department data moved into StudioDB, the shared search engine could search and navigate across the whole portal.",
        relatedWorkSessions: ["WS-2026-0042", "WS-2026-0043"],
        relatedFiles: [
            "js/search.js",
            "js/studio-data/database.js"
        ]
    },
    {
        id: "LESSON-2026-0005",
        title: "AI-Generated Documentation Needs Confidence and Review",
        status: "Active",
        department: "Documentation",
        summary: "Generated records should distinguish facts, recommendations, approved decisions, and reconstructed history so documentation remains trustworthy.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedRecordIds: ["REC-2026-0004"]
    }
];