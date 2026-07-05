/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049R — Modular Migration Packages Records
File: js/studio-data/records/migrationPackages.js
*/

window.studioRecordMigrationPackages = [
    {
        id: "MIG-2026-0001",
        title: "Historical Knowledge Migration Framework",
        status: "Active",
        department: "Documentation",
        summary: "Initial migration package framework for bringing earlier TMS-OS project history into the Knowledge Engine with source tracking, confidence, review status, and documentation completeness.",
        migrationScope: "Historical Work Sessions",
        sourceTypes: [
            "Previous Chat",
            "Git History",
            "Code Review",
            "Current StudioDB",
            "User Context"
        ],
        reviewStatus: "Framework",
        confidence: "High",
        relatedWorkSessions: ["WS-2026-0048"],
        relatedProjects: ["PRJ-2026-0003"],
        relatedTechnicalDebt: ["DEBT-2026-0001"],
        relatedRecordIds: [
            "KP-2026-0001",
            "REC-2026-0006"
        ]
    }
];