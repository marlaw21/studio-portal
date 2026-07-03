/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049H — Modular Technical Debt Records
File: js/studio-data/records/technicalDebt.js
*/

window.studioRecordTechnicalDebt = [
    {
        id: "DEBT-2026-0001",
        title: "Backfill Work Sessions 001-034",
        status: "Open",
        department: "Documentation",
        priority: "High",
        summary: "Earlier TMS-OS work sessions need to be reconstructed from chat history, Git history, existing files, and user-provided context.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedMilestones: ["MILE-2026-0005"]
    },
    {
        id: "DEBT-2026-0002",
        title: "Create Google Documentation Center",
        status: "Open",
        department: "Documentation",
        priority: "High",
        summary: "The future Google Drive / Google Docs documentation area still needs to be created and connected after local knowledge packaging works.",
        relatedEnhancements: ["ENH-2026-0001"],
        relatedRecommendations: ["REC-2026-0001"]
    },
    {
        id: "DEBT-2026-0003",
        title: "Build Documentation Package Publisher",
        status: "Open",
        department: "Core Architecture",
        priority: "High",
        summary: "TMS-OS needs a way to turn knowledge packages into saved documentation files before cloud publishing.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedRecordIds: ["KP-2026-0001"]
    },
    {
        id: "DEBT-2026-0004",
        title: "Create StudioDB Import Path",
        status: "Open",
        department: "Core Architecture",
        priority: "Medium",
        summary: "StudioDB can export JSON, but a safe import path still needs to be created later.",
        relatedWorkSessions: ["WS-2026-0046"],
        relatedFiles: ["js/studio-data/loader.js"]
    },
    {
        id: "DEBT-2026-0005",
        title: "Design Widget Framework",
        status: "Open",
        department: "Core Architecture",
        priority: "Medium",
        summary: "Dashboard widgets should eventually become modular so Headquarters does not become a large all-purpose renderer.",
        relatedRecommendations: ["REC-2026-0002"],
        relatedFiles: ["js/app.js"]
    }
];