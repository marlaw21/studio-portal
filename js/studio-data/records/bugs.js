/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 049L — Modular Bugs Records
File: js/studio-data/records/bugs.js
*/

window.studioRecordBugs = [
    {
        id: "BUG-2026-0001",
        title: "StudioDB Not Defined After Loader Replacement",
        status: "Fixed",
        department: "Core Architecture",
        summary: "A broken loader.js replacement caused StudioDB to be undefined until the full loader file was replaced correctly.",
        relatedWorkSessions: ["WS-2026-0045"],
        relatedFiles: ["js/studio-data/loader.js"]
    },
    {
        id: "BUG-2026-0002",
        title: "Department Pages Missing Database Script",
        status: "Fixed",
        department: "Core Architecture",
        summary: "Some department pages did not load database.js before loader.js, causing StudioDB-backed renderers to show empty content.",
        relatedWorkSessions: ["WS-2026-0044"],
        relatedFiles: ["pages/assets.html", "pages/development.html"]
    },
    {
        id: "BUG-2026-0003",
        title: "Documentation Data File Contained Renderer Logic",
        status: "Fixed",
        department: "Documentation",
        summary: "The studio-data documentation file contained page-rendering code and was replaced with a data-only compatibility placeholder.",
        relatedWorkSessions: ["WS-2026-0040"],
        relatedFiles: ["js/studio-data/documentation.js"]
    }
];