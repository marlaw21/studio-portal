const studioDocumentationData = {
    sessionLog: [
        { number: "027", title: "Shared Search Engine", phase: "Core Architecture", focus: "Move search behavior into a reusable shared search file.", status: "In Progress", version: "v0.27.0", date: "2026", completed: "Adding the shared search foundation." },
        { number: "026", title: "Studio Data Modularization", phase: "Core Architecture", focus: "Split Studio OS data into modular files without changing visible behavior.", status: "Complete", version: "v0.26.0", date: "2026", completed: "Added modular studio data architecture." },
        { number: "025", title: "Documentation Search Foundation", phase: "Documentation Engine", focus: "Add searchable documentation across build sessions, decisions, standards, procedures, and enhancements.", status: "Complete", version: "v1.7", date: "2026", completed: "Added the Documentation Search Foundation." },
        { number: "024", title: "Enhancement Backlog Engine", phase: "Documentation Engine", focus: "Create a structured enhancement backlog for future Studio OS improvements.", status: "Complete", version: "v1.6", date: "2026", completed: "Added the Enhancement Backlog Engine." }
    ],

    decisionLog: [
        { name: "Decision 001 — Use Shared Studio Data Architecture", description: "All reusable Studio OS information should live in studio-data files and be rendered by app.js.", status: "Approved", reason: "This prevents duplicate information across pages and makes future updates easier." },
        { name: "Decision 002 — Replace Full Files When Code Changes", description: "When a file changes, the full file should be replaced instead of using partial snippets.", status: "Approved", reason: "This reduces confusion, avoids missed code placement, and supports safer step-by-step work." },
        { name: "Decision 003 — Finish Foundation Before Enhancements", description: "Enhancement ideas should be captured but not built until the core Studio OS foundation is stable.", status: "Approved", reason: "This keeps development focused and prevents scope creep." },
        { name: "Decision 004 — Test Before Commit", description: "Every work session must be tested locally before committing and pushing to GitHub.", status: "Approved", reason: "This protects the main branch and keeps each checkpoint stable." },
        { name: "Decision 005 — Documentation Must Be Structured", description: "Build sessions, decisions, standards, procedures, and enhancements must be stored as structured records.", status: "Approved", reason: "This prepares the Studio OS for future search, filtering, and Google Drive publishing." }
    ],

    standardsLog: [
        { name: "Standard 001 — Code Change Standard", description: "When a code file changes, provide and replace the full file instead of using partial snippets.", status: "Active", category: "Development" },
        { name: "Standard 002 — Testing Standard", description: "Every changed page must be tested locally with Ctrl + Shift + R before committing.", status: "Active", category: "Development" },
        { name: "Standard 003 — GitHub Standard", description: "Only stable, tested work should be committed to main and pushed to origin.", status: "Active", category: "Development" },
        { name: "Standard 004 — Documentation Standard", description: "Build sessions, decisions, standards, procedures, and enhancements must be stored as structured records.", status: "Active", category: "Documentation" },
        { name: "Standard 005 — Data Architecture Standard", description: "Reusable studio data belongs in modular studio-data files, while app.js should focus on rendering.", status: "Active", category: "Architecture" },
        { name: "Standard 006 — Asset Naming Standard", description: "Studio assets should use clear names that identify category, purpose, and version when needed.", status: "Planned", category: "Assets" },
        { name: "Standard 007 — Unity Build Standard", description: "Unity project changes should be tested in the editor before being considered ready for commit.", status: "Planned", category: "Development" },
        { name: "Standard 008 — Publishing Standard", description: "Publishing work should follow a checklist before any build is submitted to a store or platform.", status: "Planned", category: "Publishing" },
        { name: "Standard 009 — Marketing Standard", description: "Marketing materials should clearly identify the game, target audience, platform, and release purpose.", status: "Planned", category: "Marketing" }
    ],

    proceduresLog: [
        { name: "Procedure 001 — Work Session Procedure", description: "Start each session with a clear goal, identify changed files, replace full files, test locally, then commit and push.", status: "Active", category: "Development" },
        { name: "Procedure 002 — Page Testing Procedure", description: "Open the affected page locally, press Ctrl + Shift + R, verify content loads, and confirm no loading placeholders remain.", status: "Active", category: "Testing" },
        { name: "Procedure 003 — GitHub Commit Procedure", description: "After a passed test, commit to main with a clear work session message and push to origin.", status: "Active", category: "GitHub" },
        { name: "Procedure 004 — Documentation Update Procedure", description: "When a work session creates a decision, standard, procedure, or enhancement, add it to the proper structured log.", status: "Active", category: "Documentation" },
        { name: "Procedure 005 — Enhancement Handling Procedure", description: "Capture useful future ideas in the enhancement log but do not build them until the planned enhancement phase.", status: "Active", category: "Planning" },
        { name: "Procedure 006 — Data Change Procedure", description: "When dashboard information changes, update studio-data files first and only update app.js when rendering behavior must change.", status: "Active", category: "Architecture" },
        { name: "Procedure 007 — Department Expansion Procedure", description: "New department features should use the existing shared data and rendering architecture whenever possible.", status: "Planned", category: "Architecture" }
    ],

    enhancementBacklog: [
        { name: "Enhancement 001 — Documentation Search", description: "Add search or filtering for build sessions, decisions, standards, procedures, and enhancement records.", status: "Active", category: "Documentation", priority: "Medium" },
        { name: "Enhancement 002 — Google Drive Publishing", description: "Publish structured documentation records into the future Google documentation hierarchy.", status: "Deferred", category: "Documentation", priority: "High" },
        { name: "Enhancement 003 — Interactive Documentation Forms", description: "Allow new documentation records to be added through the Studio OS interface.", status: "Deferred", category: "Documentation", priority: "Medium" },
        { name: "Enhancement 004 — Department Metrics", description: "Add dashboard metrics to Assets, Publishing, Marketing, and Business Operations.", status: "Deferred", category: "Dashboard", priority: "Medium" },
        { name: "Enhancement 005 — Quick Actions", description: "Add action buttons for future workflows such as adding assets, logging decisions, and creating tasks.", status: "Deferred", category: "Workflow", priority: "Low" },
        { name: "Enhancement 006 — Visual Progress Bars", description: "Replace plain percentage rows with visual progress bars across the Studio OS.", status: "Deferred", category: "Interface", priority: "Low" },
        { name: "Enhancement 007 — Local Storage Support", description: "Allow simple data changes to be saved locally before introducing a full database.", status: "Deferred", category: "Data", priority: "Medium" }
    ],

    documentationEngine: {
        buildSessions: [
            { name: "Work Session 027", description: "Created the Shared Search Engine foundation.", status: "In Progress" },
            { name: "Work Session 026", description: "Created the Studio Data Modularization foundation.", status: "Complete" },
            { name: "Work Session 025", description: "Created the Documentation Search Foundation.", status: "Complete" },
            { name: "Work Session 024", description: "Created the Enhancement Backlog Engine.", status: "Complete" }
        ],
        decisions: [], standards: [], procedures: [], enhancements: []
    },

    documentationRecords: [
        { name: "Build Session Log", description: "Tracks what was completed during each work session.", status: "Active" },
        { name: "Decision Log", description: "Records important studio decisions and why they were made.", status: "Active" },
        { name: "Standards Log", description: "Stores rules and standards that guide studio work.", status: "Active" },
        { name: "Procedures Log", description: "Stores repeatable studio operating procedures.", status: "Active" },
        { name: "Enhancement Backlog", description: "Stores future ideas without interrupting active development.", status: "Active" }
    ]
};

studioDocumentationData.documentationEngine.decisions = studioDocumentationData.decisionLog;
studioDocumentationData.documentationEngine.standards = studioDocumentationData.standardsLog;
studioDocumentationData.documentationEngine.procedures = studioDocumentationData.proceduresLog;
studioDocumentationData.documentationEngine.enhancements = studioDocumentationData.enhancementBacklog;
