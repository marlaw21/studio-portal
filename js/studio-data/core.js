/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 041 — Core Data Cleanup
File: js/studio-data/core.js

Purpose:
- Store core studio identity and current studio state only.
- Record collections now live in js/studio-data/database.js.
*/

window.studioCoreData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v0.28.1",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Cross-Department Search",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Shared Search Engine completed",
        lastPush: "Pending after Work Session 028 testing",
        currentDepartment: "Core Architecture"
    }
};