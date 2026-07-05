/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049T — Modular Standards Records
File: js/studio-data/records/standards.js
*/

window.studioRecordStandards = [
    {
        id: "STD-2026-0001",
        title: "Full File Replacement Standard",
        name: "Standard 001 — Full File Replacement",
        department: "Development",
        status: "Active",
        summary: "Always provide complete replacement files when code changes."
    },
    {
        id: "STD-2026-0002",
        title: "Local Testing Standard",
        name: "Standard 002 — Local Testing",
        department: "Testing",
        status: "Active",
        summary: "After each change, refresh locally with Ctrl + Shift + R and verify no errors."
    },
    {
        id: "STD-2026-0003",
        title: "Renderer Separation Standard",
        name: "Standard 003 — Renderer Separation",
        department: "Core Architecture",
        status: "Active",
        summary: "Each department page should use its own renderer."
    },
    {
        id: "STD-2026-0004",
        title: "Shared Layout Standard",
        name: "Standard 004 — Shared Layout",
        department: "Core Architecture",
        status: "Active",
        summary: "All pages should use the shared layout engine where possible."
    },
    {
        id: "STD-2026-0005",
        title: "Shared Components Standard",
        name: "Standard 005 — Shared Components",
        department: "Core Architecture",
        status: "Active",
        summary: "Reusable UI cards should come from shared component functions."
    }
];