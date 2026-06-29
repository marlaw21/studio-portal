const studioData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v1.6",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    sessionLog: [
        {
            number: "024",
            title: "Enhancement Backlog Engine",
            phase: "Documentation Engine",
            focus: "Create a structured enhancement backlog for future Studio OS improvements.",
            status: "In Progress",
            version: "v1.6",
            date: "2026",
            completed: "Adding the Enhancement Backlog Engine."
        },
        {
            number: "023",
            title: "Studio Procedures Engine",
            phase: "Documentation Engine",
            focus: "Create structured procedures for repeatable Studio OS work.",
            status: "Complete",
            version: "v1.5",
            date: "2026",
            completed: "Added the Studio Procedures Engine."
        },
        {
            number: "022",
            title: "Studio Standards Engine",
            phase: "Documentation Engine",
            focus: "Create structured studio standards for development, documentation, assets, publishing, and operations.",
            status: "Complete",
            version: "v1.4",
            date: "2026",
            completed: "Added the Studio Standards Engine."
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

    proceduresLog: [
        {
            name: "Procedure 001 — Work Session Procedure",
            description: "Start each session with a clear goal, identify changed files, replace full files, test locally, then commit and push.",
            status: "Active",
            category: "Development"
        },
        {
            name: "Procedure 002 — Page Testing Procedure",
            description: "Open the affected page locally, press Ctrl + Shift + R, verify content loads, and confirm no loading placeholders remain.",
            status: "Active",
            category: "Testing"
        },
        {
            name: "Procedure 003 — GitHub Commit Procedure",
            description: "After a passed test, commit to main with a clear work session message and push to origin.",
            status: "Active",
            category: "GitHub"
        },
        {
            name: "Procedure 004 — Documentation Update Procedure",
            description: "When a work session creates a decision, standard, procedure, or enhancement, add it to the proper structured log.",
            status: "Active",
            category: "Documentation"
        },
        {
            name: "Procedure 005 — Enhancement Handling Procedure",
            description: "Capture useful future ideas in the enhancement log but do not build them until the planned enhancement phase.",
            status: "Active",
            category: "Planning"
        },
        {
            name: "Procedure 006 — Data Change Procedure",
            description: "When dashboard information changes, update studio-data.js first and only update app.js when rendering behavior must change.",
            status: "Active",
            category: "Architecture"
        },
        {
            name: "Procedure 007 — Department Expansion Procedure",
            description: "New department features should use the existing shared data and rendering architecture whenever possible.",
            status: "Planned",
            category: "Architecture"
        }
    ],

    enhancementBacklog: [
        {
            name: "Enhancement 001 — Documentation Search",
            description: "Add search or filtering for build sessions, decisions, standards, procedures, and enhancement records.",
            status: "Deferred",
            category: "Documentation",
            priority: "Medium"
        },
        {
            name: "Enhancement 002 — Google Drive Publishing",
            description: "Publish structured documentation records into the future Google documentation hierarchy.",
            status: "Deferred",
            category: "Documentation",
            priority: "High"
        },
        {
            name: "Enhancement 003 — Interactive Documentation Forms",
            description: "Allow new documentation records to be added through the Studio OS interface.",
            status: "Deferred",
            category: "Documentation",
            priority: "Medium"
        },
        {
            name: "Enhancement 004 — Department Metrics",
            description: "Add dashboard metrics to Assets, Publishing, Marketing, and Business Operations.",
            status: "Deferred",
            category: "Dashboard",
            priority: "Medium"
        },
        {
            name: "Enhancement 005 — Quick Actions",
            description: "Add action buttons for future workflows such as adding assets, logging decisions, and creating tasks.",
            status: "Deferred",
            category: "Workflow",
            priority: "Low"
        },
        {
            name: "Enhancement 006 — Visual Progress Bars",
            description: "Replace plain percentage rows with visual progress bars across the Studio OS.",
            status: "Deferred",
            category: "Interface",
            priority: "Low"
        },
        {
            name: "Enhancement 007 — Local Storage Support",
            description: "Allow simple data changes to be saved locally before introducing a full database.",
            status: "Deferred",
            category: "Data",
            priority: "Medium"
        }
    ],

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Enhancement Backlog Engine",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Studio Procedures Engine completed",
        lastPush: "Completed after Work Session 023",
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
        { title: "Enhancement Backlog Started", description: "The Studio OS can now track future ideas without building them immediately.", status: "Active" },
        { title: "Procedures Engine Complete", description: "Studio procedures are now stored and rendered from the procedures log.", status: "Complete" },
        { title: "Next Milestone", description: "Prepare Documentation Search Foundation.", status: "Planned" }
    ],

    documentationEngine: {
        buildSessions: [
            { name: "Work Session 024", description: "Created the Enhancement Backlog Engine.", status: "In Progress" },
            { name: "Work Session 023", description: "Created the Studio Procedures Engine.", status: "Complete" },
            { name: "Work Session 022", description: "Created the Studio Standards Engine.", status: "Complete" },
            { name: "Work Session 021", description: "Created the Studio Decision Logging Engine.", status: "Complete" }
        ],

        decisions: [],

        standards: [],

        procedures: [],

        enhancements: []
    },

    progress: [
        { name: "Foundation", value: 100 },
        { name: "Navigation", value: 100 },
        { name: "Dynamic Engine", value: 100 },
        { name: "Studio OS Layer", value: 94 },
        { name: "Enhancement Backlog", value: 35 }
    ],

    status: [
        { label: "Studio Portal", value: "Online", state: "green" },
        { label: "GitHub", value: "Connected", state: "green" },
        { label: "GitHub Pages", value: "Live", state: "green" },
        { label: "Enhancement Backlog", value: "Started", state: "green" }
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
        { name: "Procedures Log", description: "Stores repeatable studio operating procedures.", status: "Active" },
        { name: "Enhancement Backlog", description: "Stores future ideas without interrupting active development.", status: "Active" }
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
studioData.documentationEngine.procedures = studioData.proceduresLog;
studioData.documentationEngine.enhancements = studioData.enhancementBacklog;

console.log("Studio data loaded:", studioData);