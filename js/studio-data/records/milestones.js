/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049E — Modular Milestones Records
File: js/studio-data/records/milestones.js
*/

window.studioRecordMilestones = [
    { id: "MILE-2026-0001", title: "StudioDB Shared Data Layer Established", status: "Complete", department: "Core Architecture", summary: "TMS-OS moved from scattered page data toward a centralized StudioDB data layer.", relatedWorkSessions: ["WS-2026-0035", "WS-2026-0036", "WS-2026-0037"] },
    { id: "MILE-2026-0002", title: "All Departments Migrated to StudioDB", status: "Complete", department: "Core Architecture", summary: "Headquarters, Documentation, Development, Assets, Publishing, Marketing, and Business all render through StudioDB-backed data.", relatedWorkSessions: ["WS-2026-0041", "WS-2026-0042", "WS-2026-0043", "WS-2026-0044"] },
    { id: "MILE-2026-0003", title: "Cross-Department Global Search Working", status: "Complete", department: "Core Architecture", summary: "Search can find and navigate to records across departments using StudioDB.search().", relatedWorkSessions: ["WS-2026-0042", "WS-2026-0043"], relatedFiles: ["js/search.js"] },
    { id: "MILE-2026-0004", title: "StudioDB Validation and Export Foundation Complete", status: "Complete", department: "Core Architecture", summary: "StudioDB can validate schemas, detect duplicate IDs, and export the database as JSON.", relatedWorkSessions: ["WS-2026-0045", "WS-2026-0046"], relatedFiles: ["js/studio-data/loader.js"] },
    { id: "MILE-2026-0005", title: "Knowledge Engine Foundation Started", status: "In Progress", department: "Documentation", summary: "TMS-OS began adding record types and relationship standards for generated documentation and institutional memory.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["KP-2026-0001"] }
];