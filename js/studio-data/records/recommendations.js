/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049M — Modular Recommendations Records
File: js/studio-data/records/recommendations.js
*/

window.studioRecordRecommendations = [
    {
        id: "REC-2026-0001",
        title: "Build JSON Export Before Google Drive Sync",
        status: "Accepted",
        department: "Core Architecture",
        summary: "Create a local exportable data format before adding Google authentication and synchronization.",
        relatedWorkSessions: ["WS-2026-0046"],
        relatedEnhancements: ["ENH-2026-0001"],
        relatedFiles: ["js/studio-data/loader.js"]
    },
    {
        id: "REC-2026-0002",
        title: "Introduce Modular Dashboard Widgets Later",
        status: "Deferred",
        department: "Core Architecture",
        summary: "Avoid turning app.js into a large all-purpose renderer by eventually introducing modular dashboard widgets.",
        relatedFiles: ["js/app.js"],
        relatedTechnicalDebt: ["DEBT-2026-0005"]
    },
    {
        id: "REC-2026-0003",
        title: "Create Knowledge Packages After Every Session",
        status: "Accepted",
        department: "Documentation",
        summary: "Every development session should produce a package of work completed, decisions, recommendations, enhancements, bugs, lessons, and next steps.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedRecordIds: ["KP-2026-0001"]
    },
    {
        id: "REC-2026-0004",
        title: "Separate Facts, Recommendations, and Approved Decisions",
        status: "Accepted",
        department: "Documentation",
        summary: "Generated documentation should distinguish factual work performed, AI recommendations, and user-approved decisions.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedRecordIds: ["LESSON-2026-0005"]
    },
    {
        id: "REC-2026-0005",
        title: "Use Universal IDs Across All Record Types",
        status: "Accepted",
        department: "Core Architecture",
        summary: "Use consistent TYPE-YEAR-NUMBER identifiers across StudioDB to make records easier to search, reference, export, and publish.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedFiles: ["js/studio-data/database.js"]
    },
    {
        id: "REC-2026-0006",
        title: "Backfill Earlier Project History Through Knowledge Migration",
        status: "Accepted",
        department: "Documentation",
        summary: "Reconstruct earlier TMS-OS history from prior chats, Git history, existing files, and user context so documentation reads from the beginning of the project.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedTechnicalDebt: ["DEBT-2026-0001"]
    }
];