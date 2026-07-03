/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049K — Modular Studio Chronicle Records
File: js/studio-data/records/studioChronicle.js
*/

window.studioRecordStudioChronicle = [
    {
        id: "CHRON-2026-0001",
        title: "Two Marshalls Studios Portal Foundation Created",
        status: "Recorded",
        department: "Studio History",
        summary: "The studio portal began as a headquarters dashboard for games, systems, publishing, and operations.",
        relatedProjects: ["PRJ-2026-0003"]
    },
    {
        id: "CHRON-2026-0002",
        title: "StudioDB Became the Shared Data Layer",
        status: "Recorded",
        department: "Studio History",
        summary: "TMS-OS shifted from page-specific data access to a centralized StudioDB architecture.",
        relatedMilestones: ["MILE-2026-0001"],
        relatedDecisions: ["DEC-2026-0004"]
    },
    {
        id: "CHRON-2026-0003",
        title: "All Departments Migrated to StudioDB",
        status: "Recorded",
        department: "Studio History",
        summary: "Every major department page began rendering from shared StudioDB records.",
        relatedMilestones: ["MILE-2026-0002"]
    },
    {
        id: "CHRON-2026-0004",
        title: "StudioDB Export Proved Portable Data",
        status: "Recorded",
        department: "Studio History",
        summary: "The database successfully exported as JSON with validation metadata, proving it could move beyond JavaScript-only storage.",
        relatedWorkSessions: ["WS-2026-0046"],
        relatedMilestones: ["MILE-2026-0004"]
    },
    {
        id: "CHRON-2026-0005",
        title: "Knowledge Engine Direction Approved",
        status: "Recorded",
        department: "Studio History",
        summary: "The studio adopted the goal that work sessions should automatically generate documentation and preserve institutional knowledge without manual form entry.",
        relatedWorkSessions: ["WS-2026-0047"],
        relatedRecordIds: ["KP-2026-0001"]
    }
];