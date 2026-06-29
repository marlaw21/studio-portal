const studioData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v1.4",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    sessionLog: [
        {
            number: "022",
            title: "Studio Standards Engine",
            phase: "Documentation Engine",
            focus: "Create structured studio standards for development, documentation, assets, publishing, and operations.",
            status: "In Progress",
            version: "v1.4",
            date: "2026",
            completed: "Adding the Studio Standards Engine."
        },
        {
            number: "021",
            title: "Studio Decision Logging Engine",
            phase: "Documentation Engine",
            focus: "Create a structured decision log for important Studio OS decisions.",
            status: "Complete",
            version: "v1.3",
            date: "2026",
            completed: "Added structured decision records to the Documentation Engine."
        },
        {
            number: "020",
            title: "Studio Documentation Engine",
            phase: "Documentation Engine",
            focus: "Create structured documentation collections for the Studio OS.",
            status: "Complete",
            version: "v1.2",
            date: "2026",
            completed: "Added build sessions, decisions, standards, procedures, and enhancement ideas."
        },
        {
            number: "019",
            title: "Build Session Logging System",
            phase: "Studio OS Logging",
            focus: "Create one session log source that feeds the dashboard.",
            status: "Complete",
            version: "v1.1",
            date: "2026",
            completed: "Centralized build session logging added."
        },
        {
            number: "018",
            title: "Work Session Tracker Foundation",
            phase: "Studio OS Tracking",
            focus: "Added a work session tracker to Studio Headquarters.",
            status: "Complete",
            version: "v1.0",
            date: "2026",
            completed: "Work Session Tracker added."
        },
        {
            number: "017",
            title: "Studio OS Core Engine",
            phase: "Core Engine Foundation",
            focus: "Added commands, notifications, configuration, and version history.",
            status: "Complete",
            version: "v0.9",
            date: "2026",
            completed: "Studio OS Core Engine completed."
        },
        {
            number: "016",
            title: "Data Cleanup and Shared Department Data",
            phase: "Data Architecture Cleanup",
            focus: "Moved department-specific data into studio-data.js.",
            status: "Complete",
            version: "v0.8",
            date: "2026",
            completed: "Shared data cleanup completed."
        },
        {
            number: "015",
            title: "Studio Operating System Foundation",
            phase: "Studio OS Foundation",
            focus: "Added Studio State, Foundation Progress, and Activity Feed.",
            status: "Complete",
            version: "v0.7",
            date: "2026",
            completed: "Studio OS Foundation added."
        }
    ],

    decisionLog: [
        {
            name: "Decision 001 — Use Shared Studio Data Architecture",
            description: "All reusable Studio OS information should live in studio-data.js and be rendered by app.js.",
            status: "Approved",
            reason: "This prevents duplicate information across pages and makes future updates easier."
        },
        {
            name: "Decision 002 — Replace Full Files When Code Changes",
            description: "When a file changes, the full file should be replaced instead of using partial snippets.",
            status: "Approved",
            reason: "This reduces confusion, avoids missed code placement, and supports safer step-by-step work."
        },
        {
            name: "Decision 003 — Finish Foundation Before Enhancements",
            description: "Enhancement ideas should be captured but not built until the core Studio OS foundation is stable.",
            status: "Approved",
            reason: "This keeps development focused and prevents scope creep."
        },
        {
            name: "Decision 004 — Test Before Commit",
            description: "Every work session must be tested locally before committing and pushing to GitHub.",
            status: "Approved",
            reason: "This protects the main branch and keeps each checkpoint stable."
        },
        {
            name: "Decision 005 — Documentation Must Be Structured",
            description: "Build sessions, decisions, standards, procedures, and enhancements must be stored as structured records.",
            status: "Approved",
            reason: "This prepares the Studio OS for future search, filtering, and Google Drive publishing."
        }
    ],

    standardsLog: [
        {
            name: "Standard 001 — Code Change Standard",
            description: "When a code file changes, provide and replace the full file instead of using partial snippets.",
            status: "Active",
            category: "Development"
        },
        {
            name: "Standard 002 — Testing Standard",
            description: "Every changed page must be tested locally with Ctrl + Shift + R before committing.",
            status: "Active",
            category: "Development"
        },
        {
            name: "Standard 003 — GitHub Standard",
            description: "Only stable, tested work should be committed to main and pushed to origin.",
            status: "Active",
            category: "Development"
        },
        {
            name: "Standard 004 — Documentation Standard",
            description: "Build sessions, decisions, standards, procedures, and enhancements must be stored as structured records.",
            status: "Active",
            category: "Documentation"
        },
        {
            name: "Standard 005 — Data Architecture Standard",
            description: "Reusable studio data belongs in studio-data.js, while app.js should focus on rendering.",
            status: "Active",
            category: "Architecture"
        },
        {
            name: "Standard 006 — Asset Naming Standard",
            description: "Studio assets should use clear names that identify category, purpose, and version when needed.",
            status: "Planned",
            category: "Assets"
        },
        {
            name: "Standard 007 — Unity Build Standard",
            description: "Unity project changes should be tested in the editor before being considered ready for commit.",
            status: "Planned",
            category: "Development"
        },
        {
            name: "Standard 008 — Publishing Standard",
            description: "Publishing work should follow a checklist before any build is submitted to a store or platform.",
            status: "Planned",
            category: "Publishing"
        },
        {
            name: "Standard 009 — Marketing Standard",
            description: "Marketing materials should clearly identify the game, target audience, platform, and release purpose.",
            status: "Planned",
            category: "Marketing"
        }
    ],

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Studio Standards Engine",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Studio Decision Logging Engine completed",
        lastPush: "Completed after Work Session 021",
        currentDepartment: "Documentation"
    },

    systemConfig: [
        { label: "Operating Mode", value: "Foundation Build" },
        { label: "Data Source", value: "studio-data.js" },
        { label: "Render Engine", value: "app.js" },
        { label: "Hosting", value: "GitHub Pages" }
    ],

    studioCommands: [
        { name: "Review Current Work", description: "Check the current work session, milestone, and active project.", status: "Ready" },
        { name: "Check Studio Status", description: "Review system health, build progress, and active studio state.", status: "Ready" },
        { name: "Open Department", description: "Use navigation to move between Studio Headquarters departments.", status: "Ready" },
        { name: "Log Enhancement Idea", description: "Capture future improvements without interrupting current development.", status: "Planned" }
    ],

    notifications: [
        { title: "Standards Engine Started", description: "The Documentation Engine now includes structured studio standards.", status: "Active" },
        { title: "Decision Engine Complete", description: "Studio decisions are now stored and rendered from the decision log.", status: "Complete" },
        { title: "Next Milestone", description: "Prepare Studio Procedures Engine.", status: "Planned" }
    ],

    documentationEngine: {
        buildSessions: [
            { name: "Work Session 022", description: "Created the Studio Standards Engine.", status: "In Progress" },
            { name: "Work Session 021", description: "Created the Studio Decision Logging Engine.", status: "Complete" },
            { name: "Work Session 020", description: "Created the Studio Documentation Engine.", status: "Complete" },
            { name: "Work Session 019", description: "Created centralized build session logging.", status: "Complete" }
        ],

        decisions: [],

        standards: [],

        procedures: [
            { name: "Build Session Procedure", description: "Start with a focused goal, replace only changed files, test locally, then commit and push.", status: "Active" },
            { name: "Page Testing Procedure", description: "Open the local page, press Ctrl + Shift + R, and verify no loading placeholders remain.", status: "Active" },
            { name: "GitHub Procedure", description: "Commit a stable checkpoint to main and push to origin after each passed work session.", status: "Active" }
        ],

        enhancements: [
            { name: "Documentation Search", description: "Add search or filtering for build sessions, decisions, standards, and procedures.", status: "Deferred" },
            { name: "Google Drive Publishing", description: "Publish structured documentation records into the future Google documentation hierarchy.", status: "Deferred" },
            { name: "Interactive Documentation Forms", description: "Allow new documentation records to be added through the Studio OS interface.", status: "Deferred" }
        ]
    },

    progress: [
        { name: "Foundation", value: 100 },
        { name: "Navigation", value: 100 },
        { name: "Dynamic Engine", value: 100 },
        { name: "Studio OS Layer", value: 90 },
        { name: "Standards Engine", value: 35 }
    ],

    status: [
        { label: "Studio Portal", value: "Online", state: "green" },
        { label: "GitHub", value: "Connected", state: "green" },
        { label: "GitHub Pages", value: "Live", state: "green" },
        { label: "Standards Engine", value: "Started", state: "green" }
    ],

    projects: [
        { name: "Dead Roads", description: "Third-person survival game.", status: "In Development", type: "Game" },
        { name: "45s", description: "Fast, simple card-based game concept.", status: "Planned", type: "Game" },
        { name: "Studio Operating System", description: "Internal system for running Two Marshalls Studios.", status: "Active", type: "System" }
    ],

    departments: [
        { name: "Documentation", icon: "📚", description: "Standards, guides, decisions, and studio knowledge.", url: "pages/documentation.html" },
        { name: "Development", icon: "🛠️", description: "GitHub, Unity, builds, releases, and technical work.", url: "pages/development.html" },
        { name: "Assets", icon: "🎨", description: "Art, models, audio, icons, and reusable materials.", url: "pages/assets.html" },
        { name: "Publishing", icon: "🚀", description: "Store pages, checklists, launch plans, and releases.", url: "pages/publishing.html" },
        { name: "Marketing", icon: "📣", description: "Screenshots, trailers, campaigns, and brand assets.", url: "pages/marketing.html" },
        { name: "Business Operations", icon: "💼", description: "Planning, finance, time tracking, and studio management.", url: "pages/business.html" }
    ],

    documentationRecords: [
        { name: "Build Session Log", description: "Tracks what was completed during each work session.", status: "Active" },
        { name: "Decision Log", description: "Records important studio decisions and why they were made.", status: "Active" },
        { name: "Standards Log", description: "Stores rules and standards that guide studio work.", status: "Active" },
        { name: "Enhancement Ideas Log", description: "Stores future ideas without interrupting active development.", status: "Active" }
    ],

    assetCategories: [
        { name: "3D Models", description: "Unity and Blender models.", status: "Active" },
        { name: "Textures & Materials", description: "Surfaces, shaders, and reusable materials.", status: "Active" },
        { name: "Audio Library", description: "Music, ambience, sound effects, and voice.", status: "Planned" }
    ],

    assetGroups: [
        { icon: "🪓", name: "Weapons", description: "Tools, melee, ranged weapons, and upgrades." },
        { icon: "🌲", name: "Environment", description: "Trees, rocks, terrain, foliage, and props." },
        { icon: "🏠", name: "Buildings", description: "Structures, interiors, furniture, and modular kits." },
        { icon: "🎵", name: "Audio", description: "Music, ambience, effects, and voice assets." },
        { icon: "🖥️", name: "UI Assets", description: "Icons, menus, HUD elements, and interface graphics." },
        { icon: "🎬", name: "Animations", description: "Character, creature, and object animations." }
    ],

    publishingChannels: [
        { name: "Apple App Store", description: "iPhone and iPad publishing path.", status: "Planned" },
        { name: "Google Play", description: "Android phone and tablet publishing path.", status: "Planned" },
        { name: "Steam", description: "PC publishing and distribution path.", status: "Planned" }
    ],

    publishingPipeline: [
        { icon: "✅", name: "Prepare", description: "Confirm game build, store assets, screenshots, descriptions, and requirements." },
        { icon: "📦", name: "Package", description: "Create the correct release build for the target platform." },
        { icon: "🧪", name: "Review", description: "Test release candidates before submitting to any platform." },
        { icon: "🚀", name: "Submit", description: "Upload the release package to the correct store or distribution channel." },
        { icon: "📣", name: "Launch", description: "Coordinate launch timing, marketing, announcements, and release notes." },
        { icon: "📊", name: "Track", description: "Monitor downloads, feedback, ratings, issues, and revenue after release." }
    ],

    marketingChannels: [
        { name: "Game Store Assets", description: "Screenshots, icons, descriptions, capsule art, and feature graphics.", status: "Planned" },
        { name: "Trailers & Video", description: "Gameplay trailers, teaser videos, development updates, and launch videos.", status: "Planned" },
        { name: "Community Updates", description: "Player-facing updates, development news, and release announcements.", status: "Planned" }
    ],

    marketingPipeline: [
        { icon: "🧠", name: "Message", description: "Define what the game is, who it is for, and why players should care." },
        { icon: "📸", name: "Capture", description: "Create screenshots, clips, gameplay footage, and visual materials." },
        { icon: "🎬", name: "Produce", description: "Build trailers, store graphics, announcements, and release content." },
        { icon: "📢", name: "Publish", description: "Post updates, store materials, community announcements, and launch messages." },
        { icon: "👥", name: "Engage", description: "Respond to feedback, track interest, and build trust with players." },
        { icon: "📈", name: "Measure", description: "Review traffic, wishlists, downloads, engagement, reviews, and conversion." }
    ]
};

studioData.documentationEngine.decisions = studioData.decisionLog;
studioData.documentationEngine.standards = studioData.standardsLog;

console.log("Studio data loaded:", studioData);