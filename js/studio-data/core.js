const studioCoreData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v0.27.0",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Shared Search Engine",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Studio Data Modularization completed",
        lastPush: "Completed after Work Session 026",
        currentDepartment: "Core Architecture"
    },

    systemConfig: [
        { label: "Operating Mode", value: "Foundation Build" },
        { label: "Data Source", value: "Modular studio-data files" },
        { label: "Render Engine", value: "app.js" },
        { label: "Search Engine", value: "search.js" },
        { label: "Hosting", value: "GitHub Pages" }
    ],

    studioCommands: [
        { name: "Review Current Work", description: "Check the current work session, milestone, and active project.", status: "Ready" },
        { name: "Check Studio Status", description: "Review system health, build progress, and active studio state.", status: "Ready" },
        { name: "Open Department", description: "Use navigation to move between Studio Headquarters departments.", status: "Ready" },
        { name: "Search Studio Knowledge", description: "Use the shared search foundation to locate structured records.", status: "Ready" },
        { name: "Log Enhancement Idea", description: "Capture future improvements without interrupting current development.", status: "Planned" }
    ],

    notifications: [
        { title: "Shared Search Engine Started", description: "Search behavior is now moving into a reusable shared search file.", status: "Active" },
        { title: "Studio Data Modularization Complete", description: "Studio OS data now loads from modular files.", status: "Complete" },
        { title: "Next Milestone", description: "Prepare Cross-Department Search.", status: "Planned" }
    ],

    progress: [
        { name: "Foundation", value: 100 },
        { name: "Navigation", value: 100 },
        { name: "Dynamic Engine", value: 100 },
        { name: "Studio OS Layer", value: 98 },
        { name: "Shared Search Engine", value: 40 }
    ],

    status: [
        { label: "Studio Portal", value: "Online", state: "green" },
        { label: "GitHub", value: "Connected", state: "green" },
        { label: "GitHub Pages", value: "Live", state: "green" },
        { label: "Shared Search", value: "Started", state: "green" }
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
    ]
};
