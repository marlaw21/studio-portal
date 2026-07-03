/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049F — Modular Design Principles Records
File: js/studio-data/records/designPrinciples.js
*/

window.studioRecordDesignPrinciples = [
    { id: "DP-2026-0001", title: "TMS-OS Is the Source of Truth", status: "Active", department: "Core Architecture", summary: "TMS-OS should become the permanent source of truth for studio knowledge, with Google Drive, GitHub, and ChatGPT treated as outputs or supporting tools.", relatedWorkSessions: ["WS-2026-0047"], relatedProjects: ["PRJ-2026-0003"], relatedRecordIds: ["KP-2026-0001"] },
    { id: "DP-2026-0002", title: "Documentation Is a Product of Development", status: "Active", department: "Documentation", summary: "Important knowledge should be generated from each work session rather than manually entered into forms after the fact.", relatedWorkSessions: ["WS-2026-0047"], relatedStandards: ["STD-2026-0001"], relatedProcedures: ["PROC-2026-0003"] },
    { id: "DP-2026-0003", title: "No Important Knowledge Exists Only in Chat", status: "Active", department: "Documentation", summary: "Decisions, recommendations, bugs, fixes, enhancements, lessons, and milestones should be captured into TMS-OS so they are not trapped in conversation history.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["CHRON-2026-0005"] },
    { id: "DP-2026-0004", title: "Foundation Before Enhancements", status: "Active", department: "Planning", summary: "Enhancement ideas should be captured and preserved, but not built until the agreed foundation is stable.", relatedDecisions: ["DEC-2026-0003"], relatedEnhancements: ["ENH-2026-0002", "ENH-2026-0003"] },
    { id: "DP-2026-0005", title: "Modular Architecture Over Monolithic Files", status: "Active", department: "Core Architecture", summary: "TMS-OS should favor modular data, shared renderers, reusable components, and focused files instead of large all-purpose scripts.", relatedDecisions: ["DEC-2026-0001", "DEC-2026-0004", "DEC-2026-0005"], relatedStandards: ["STD-2026-0003", "STD-2026-0004", "STD-2026-0005"] },
    { id: "DP-2026-0006", title: "Preserve Reasoning, Not Just Outcomes", status: "Active", department: "Documentation", summary: "TMS-OS documentation should capture why choices were made, not only what changed.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["REC-2026-0004"] },
    { id: "DP-2026-0007", title: "Complete Replacement Files for Code Changes", status: "Active", department: "Development", summary: "When code changes are needed, provide complete replacement files rather than partial snippets to reduce confusion and missed steps.", relatedDecisions: ["DEC-2026-0002"], relatedStandards: ["STD-2026-0001"] }
];