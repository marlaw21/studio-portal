/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 043 — Cross-Department Global Search
File: js/studio-data/database.js
*/

const studioDatabaseData = {
    meta: {
        name: "Studio Database Foundation",
        version: "v0.43.0",
        status: "Foundation",
        description: "Database-ready record structure for Two Marshalls Studios Operating System."
    },

    records: {
        workSessions: [
            { id: "work-session-043", number: "043", title: "Cross-Department Global Search", department: "Core Architecture", status: "In Progress", version: "v0.43.0", year: "2026", summary: "Move department records into StudioDB so global search can search across all departments." },
            { id: "work-session-042", number: "042", title: "Global Search Integration", department: "Core Architecture", status: "Complete", version: "v0.42.0", year: "2026", summary: "Updated search.js to use StudioDB.search()." },
            { id: "work-session-041", number: "041", title: "Core Data Cleanup", department: "Core Architecture", status: "Complete", version: "v0.41.0", year: "2026", summary: "Cleaned core.js so it only stores studio identity and current state." },
            { id: "work-session-040", number: "040", title: "Data Consolidation", department: "Core Architecture", status: "Complete", version: "v0.40.0", year: "2026", summary: "Moved Headquarters records into the Studio Database to reduce duplicate data." },
            { id: "work-session-039", number: "039", title: "Headquarters Uses StudioDB", department: "Core Architecture", status: "Complete", version: "v0.39.0", year: "2026", summary: "Updated the Headquarters renderer to read records through StudioDB." },
            { id: "work-session-038", number: "038", title: "Documentation Uses StudioDB", department: "Core Architecture", status: "Complete", version: "v0.38.0", year: "2026", summary: "Updated the Documentation renderer to read records through StudioDB." },
            { id: "work-session-037", number: "037", title: "StudioDB v1", department: "Core Architecture", status: "Complete", version: "v0.37.0", year: "2026", summary: "Moved StudioDB into loader.js and confirmed database access works." },
            { id: "work-session-036", number: "036", title: "Studio Database Engine", department: "Core Architecture", status: "Complete", version: "v0.36.0", year: "2026", summary: "Tested the database engine approach and moved toward a simpler loader-based StudioDB." },
            { id: "work-session-035", number: "035", title: "Studio Database Foundation", department: "Core Architecture", status: "Complete", version: "v0.35.0", year: "2026", summary: "Created a database-ready record structure for future Studio OS data." }
        ],

        projects: [
            { id: "project-dead-roads", name: "Dead Roads", title: "Dead Roads", description: "Third-person survival game.", department: "Development", status: "In Development", summary: "Primary survival game project for Two Marshalls Studios." },
            { id: "project-45s", name: "45s", title: "45s", description: "Fast, simple card-based game concept.", department: "Development", status: "Planned", summary: "Simple card game concept planned for future development." },
            { id: "project-studio-operating-system", name: "Studio Operating System", title: "Studio Operating System", description: "Internal system for running Two Marshalls Studios.", department: "Core Architecture", status: "Active", summary: "The Studio Portal / TMS-OS foundation." }
        ],

        status: [
            { id: "status-studio-portal", label: "Studio Portal", name: "Studio Portal", value: "Online", status: "Online", department: "Core Architecture", summary: "The Studio Portal is running locally and rendering." },
            { id: "status-github", label: "GitHub", name: "GitHub", value: "Connected", status: "Connected", department: "Development", summary: "GitHub is connected for source control." },
            { id: "status-github-pages", label: "GitHub Pages", name: "GitHub Pages", value: "Live", status: "Live", department: "Publishing", summary: "GitHub Pages is available for hosted portal access." },
            { id: "status-shared-search", label: "Shared Search", name: "Shared Search", value: "Complete", status: "Complete", department: "Core Architecture", summary: "The shared search engine is complete." }
        ],

        notifications: [
            { id: "notification-cross-department-search", title: "Cross-Department Search Active", name: "Cross-Department Search Active", description: "Search can now support studio-wide knowledge discovery across departments.", department: "Core Architecture", status: "Active", summary: "Search foundation is active." },
            { id: "notification-shared-search-complete", title: "Shared Search Engine Complete", name: "Shared Search Engine Complete", description: "Search behavior now lives in a reusable shared search file.", department: "Core Architecture", status: "Complete", summary: "Shared search engine completed." },
            { id: "notification-main-milestone", title: "Main Milestone", name: "Main Milestone", description: "Prepare the next stable Studio OS foundation improvement.", department: "Planning", status: "Planned", summary: "Next milestone is planned." }
        ],

        studioCommands: [
            { id: "command-studio-portal", name: "Studio Portal", title: "Studio Portal", description: "Main Studio OS portal.", department: "Core Architecture", status: "Online", summary: "Studio Portal command is online." },
            { id: "command-github", name: "GitHub", title: "GitHub", description: "Source control and project repository.", department: "Development", status: "Connected", summary: "GitHub command is connected." },
            { id: "command-github-pages", name: "GitHub Pages", title: "GitHub Pages", description: "Hosted Studio Portal access.", department: "Publishing", status: "Live", summary: "GitHub Pages command is live." },
            { id: "command-shared-search", name: "Shared Search", title: "Shared Search", description: "Reusable search system.", department: "Core Architecture", status: "Complete", summary: "Shared search command is complete." }
        ],

        systemConfig: [
            { id: "config-operating-mode", label: "Operating Mode", name: "Operating Mode", value: "Foundation Build", department: "Core Architecture", status: "Active", summary: "The Studio OS is currently in foundation build mode." },
            { id: "config-data-source", label: "Data Source", name: "Data Source", value: "StudioDB records", department: "Core Architecture", status: "Active", summary: "The current data source is StudioDB records." },
            { id: "config-render-engine", label: "Render Engine", name: "Render Engine", value: "app.js", department: "Core Architecture", status: "Active", summary: "The Headquarters render engine is app.js." },
            { id: "config-search-engine", label: "Search Engine", name: "Search Engine", value: "search.js + StudioDB.search()", department: "Core Architecture", status: "Active", summary: "The shared search engine is powered by StudioDB.search()." },
            { id: "config-hosting", label: "Hosting", name: "Hosting", value: "GitHub Pages", department: "Publishing", status: "Active", summary: "The portal is planned for GitHub Pages hosting." }
        ],

        progress: [
            { id: "progress-foundation", name: "Foundation", label: "Foundation", value: 100, department: "Core Architecture", status: "Complete", summary: "Foundation layer is complete." },
            { id: "progress-navigation", name: "Navigation", label: "Navigation", value: 100, department: "Core Architecture", status: "Complete", summary: "Navigation layer is complete." },
            { id: "progress-dynamic-engine", name: "Dynamic Engine", label: "Dynamic Engine", value: 100, department: "Core Architecture", status: "Complete", summary: "Dynamic rendering engine is complete." },
            { id: "progress-studio-os-layer", name: "Studio OS Layer", label: "Studio OS Layer", value: 98, department: "Core Architecture", status: "In Progress", summary: "Studio OS layer is in progress." },
            { id: "progress-shared-search-engine", name: "Shared Search Engine", label: "Shared Search Engine", value: 100, department: "Core Architecture", status: "Complete", summary: "Shared search engine is complete." }
        ],

        departments: [
            { id: "documentation", name: "Documentation", title: "Documentation", icon: "📚", url: "pages/documentation.html", description: "Standards, guides, decisions, and studio knowledge.", department: "Documentation", status: "Active", summary: "Build sessions, decisions, standards, procedures, and enhancement tracking." },
            { id: "development", name: "Development", title: "Development", icon: "🛠", url: "pages/development.html", description: "GitHub, Unity, builds, releases, and technical work.", department: "Development", status: "Active", summary: "Game development, code, GitHub, Unity, testing, and releases." },
            { id: "assets", name: "Assets", title: "Assets", icon: "🎨", url: "pages/assets.html", description: "Art, models, audio, icons, and reusable materials.", department: "Assets", status: "Planned", summary: "Art, models, audio, icons, and reusable game materials." },
            { id: "publishing", name: "Publishing", title: "Publishing", icon: "🚀", url: "pages/publishing.html", description: "Store pages, checklists, launch plans, and releases.", department: "Publishing", status: "Planned", summary: "Store pages, checklists, launch plans, and release operations." },
            { id: "marketing", name: "Marketing", title: "Marketing", icon: "📣", url: "pages/marketing.html", description: "Screenshots, trailers, campaigns, and brand assets.", department: "Marketing", status: "Planned", summary: "Screenshots, trailers, campaigns, and brand assets." },
            { id: "business", name: "Business Operations", title: "Business Operations", icon: "🏢", url: "pages/business.html", description: "Planning, finance, scheduling, and studio management.", department: "Business Operations", status: "Active", summary: "Planning, finance, scheduling, management, and operating decisions." }
        ],

        assetCategories: [
            { id: "asset-category-3d-models", name: "3D Models", title: "3D Models", description: "Unity and Blender models.", department: "Assets", status: "Active", summary: "Unity and Blender 3D model assets." },
            { id: "asset-category-textures-materials", name: "Textures & Materials", title: "Textures & Materials", description: "Surfaces, shaders, and reusable materials.", department: "Assets", status: "Active", summary: "Texture, surface, shader, and material assets." },
            { id: "asset-category-audio-library", name: "Audio Library", title: "Audio Library", description: "Music, ambience, sound effects, and voice.", department: "Assets", status: "Planned", summary: "Audio assets for music, ambience, sound effects, and voice." }
        ],

        assetGroups: [
            { id: "asset-group-weapons", icon: "🪓", name: "Weapons", title: "Weapons", description: "Tools, melee, ranged weapons, and upgrades.", department: "Assets", status: "Planned", summary: "Weapon and tool assets." },
            { id: "asset-group-environment", icon: "🌲", name: "Environment", title: "Environment", description: "Trees, rocks, terrain, foliage, and props.", department: "Assets", status: "Planned", summary: "Environment assets." },
            { id: "asset-group-buildings", icon: "🏠", name: "Buildings", title: "Buildings", description: "Structures, interiors, furniture, and modular kits.", department: "Assets", status: "Planned", summary: "Building and structure assets." },
            { id: "asset-group-audio", icon: "🎵", name: "Audio", title: "Audio", description: "Music, ambience, effects, and voice assets.", department: "Assets", status: "Planned", summary: "Audio asset group." },
            { id: "asset-group-ui-assets", icon: "🖥️", name: "UI Assets", title: "UI Assets", description: "Icons, menus, HUD elements, and interface graphics.", department: "Assets", status: "Planned", summary: "User interface assets." },
            { id: "asset-group-animations", icon: "🎬", name: "Animations", title: "Animations", description: "Character, creature, and object animations.", department: "Assets", status: "Planned", summary: "Animation assets." }
        ],

        publishingChannels: [
            { id: "publishing-channel-apple-app-store", name: "Apple App Store", title: "Apple App Store", description: "iPhone and iPad publishing path.", department: "Publishing", status: "Planned", summary: "Apple App Store publishing channel." },
            { id: "publishing-channel-google-play", name: "Google Play", title: "Google Play", description: "Android phone and tablet publishing path.", department: "Publishing", status: "Planned", summary: "Google Play publishing channel." },
            { id: "publishing-channel-steam", name: "Steam", title: "Steam", description: "PC publishing and distribution path.", department: "Publishing", status: "Planned", summary: "Steam publishing channel." }
        ],

        publishingPipeline: [
            { id: "publishing-pipeline-prepare", icon: "✅", name: "Prepare", title: "Prepare", description: "Confirm game build, store assets, screenshots, descriptions, and requirements.", department: "Publishing", status: "Planned", summary: "Prepare publishing materials." },
            { id: "publishing-pipeline-package", icon: "📦", name: "Package", title: "Package", description: "Create the correct release build for the target platform.", department: "Publishing", status: "Planned", summary: "Package release build." },
            { id: "publishing-pipeline-review", icon: "🧪", name: "Review", title: "Review", description: "Test release candidates before submitting to any platform.", department: "Publishing", status: "Planned", summary: "Review release candidate." },
            { id: "publishing-pipeline-submit", icon: "🚀", name: "Submit", title: "Submit", description: "Upload the release package to the correct store or distribution channel.", department: "Publishing", status: "Planned", summary: "Submit release package." },
            { id: "publishing-pipeline-launch", icon: "📣", name: "Launch", title: "Launch", description: "Coordinate launch timing, marketing, announcements, and release notes.", department: "Publishing", status: "Planned", summary: "Launch release." },
            { id: "publishing-pipeline-track", icon: "📊", name: "Track", title: "Track", description: "Monitor downloads, feedback, ratings, issues, and revenue after release.", department: "Publishing", status: "Planned", summary: "Track launch results." }
        ],

        marketingChannels: [
            { id: "marketing-channel-game-store-assets", name: "Game Store Assets", title: "Game Store Assets", description: "Screenshots, icons, descriptions, capsule art, and feature graphics.", department: "Marketing", status: "Planned", summary: "Store-facing game marketing assets." },
            { id: "marketing-channel-trailers-video", name: "Trailers & Video", title: "Trailers & Video", description: "Gameplay trailers, teaser videos, development updates, and launch videos.", department: "Marketing", status: "Planned", summary: "Trailer and video marketing channel." },
            { id: "marketing-channel-community-updates", name: "Community Updates", title: "Community Updates", description: "Player-facing updates, development news, and release announcements.", department: "Marketing", status: "Planned", summary: "Community update marketing channel." }
        ],

        marketingPipeline: [
            { id: "marketing-pipeline-message", icon: "🧠", name: "Message", title: "Message", description: "Define what the game is, who it is for, and why players should care.", department: "Marketing", status: "Planned", summary: "Define marketing message." },
            { id: "marketing-pipeline-capture", icon: "📸", name: "Capture", title: "Capture", description: "Create screenshots, clips, gameplay footage, and visual materials.", department: "Marketing", status: "Planned", summary: "Capture marketing materials." },
            { id: "marketing-pipeline-produce", icon: "🎬", name: "Produce", title: "Produce", description: "Build trailers, store graphics, announcements, and release content.", department: "Marketing", status: "Planned", summary: "Produce marketing assets." },
            { id: "marketing-pipeline-publish", icon: "📢", name: "Publish", title: "Publish", description: "Post updates, store materials, community announcements, and launch messages.", department: "Marketing", status: "Planned", summary: "Publish marketing messages." },
            { id: "marketing-pipeline-engage", icon: "👥", name: "Engage", title: "Engage", description: "Respond to feedback, track interest, and build trust with players.", department: "Marketing", status: "Planned", summary: "Engage with players." },
            { id: "marketing-pipeline-measure", icon: "📈", name: "Measure", title: "Measure", description: "Review traffic, wishlists, downloads, engagement, reviews, and conversion.", department: "Marketing", status: "Planned", summary: "Measure marketing results." }
        ],

        decisions: [
            { id: "decision-001", title: "Use Modular Studio Data", name: "Decision 001 — Use Modular Studio Data", department: "Core Architecture", status: "Approved", summary: "Reusable Studio OS data belongs in structured data files." },
            { id: "decision-002", title: "Use Full File Replacement", name: "Decision 002 — Use Full File Replacement", department: "Development", status: "Approved", summary: "When code changes, replace the full file instead of using partial snippets." },
            { id: "decision-003", title: "Finish Foundation Before Enhancements", name: "Decision 003 — Finish Foundation Before Enhancements", department: "Planning", status: "Approved", summary: "Enhancement ideas are captured but not built until the foundation is stable." },
            { id: "decision-004", title: "Separate Data From Renderers", name: "Decision 004 — Separate Data From Renderers", department: "Core Architecture", status: "Approved", summary: "Data files store records; renderer files display records." },
            { id: "decision-005", title: "Use Shared Layout", name: "Decision 005 — Use Shared Layout", department: "Core Architecture", status: "Approved", summary: "Header, navigation, and footer should come from a shared layout engine." }
        ],

        standards: [
            { id: "standard-001", title: "Full File Replacement Standard", name: "Standard 001 — Full File Replacement", department: "Development", status: "Active", summary: "Always provide complete replacement files when code changes." },
            { id: "standard-002", title: "Local Testing Standard", name: "Standard 002 — Local Testing", department: "Testing", status: "Active", summary: "After each change, refresh locally with Ctrl + Shift + R and verify no errors." },
            { id: "standard-003", title: "Renderer Separation Standard", name: "Standard 003 — Renderer Separation", department: "Core Architecture", status: "Active", summary: "Each department page should use its own renderer." },
            { id: "standard-004", title: "Shared Layout Standard", name: "Standard 004 — Shared Layout", department: "Core Architecture", status: "Active", summary: "All pages should use the shared layout engine where possible." },
            { id: "standard-005", title: "Shared Components Standard", name: "Standard 005 — Shared Components", department: "Core Architecture", status: "Active", summary: "Reusable UI cards should come from shared component functions." }
        ],

        procedures: [
            { id: "procedure-001", title: "Work Session Procedure", name: "Procedure 001 — Work Session", department: "Development", status: "Active", summary: "Start with a clear goal, make focused changes, test, document, then move on." },
            { id: "procedure-002", title: "Bug Fix Procedure", name: "Procedure 002 — Bug Fix", department: "Testing", status: "Active", summary: "When a bug appears, stop new work, identify the source, fix it, and retest." },
            { id: "procedure-003", title: "Documentation Update Procedure", name: "Procedure 003 — Documentation Update", department: "Documentation", status: "Active", summary: "Each completed work session should be added to the structured documentation records." }
        ],

        enhancements: [
            { id: "enhancement-001", title: "Google Drive Publishing", name: "Enhancement 001 — Google Drive Publishing", department: "Documentation", status: "Deferred", priority: "High", summary: "Publish structured documentation into the future Google Drive documentation hierarchy." },
            { id: "enhancement-002", title: "Interactive Documentation Forms", name: "Enhancement 002 — Interactive Documentation Forms", department: "Documentation", status: "Deferred", priority: "Medium", summary: "Allow records to be added through the Studio Portal interface." },
            { id: "enhancement-003", title: "Command Palette", name: "Enhancement 003 — Command Palette", department: "Core Architecture", status: "Deferred", priority: "Medium", summary: "Add a command palette for fast navigation and studio actions." }
        ]
    }
};

window.studioDatabaseData = studioDatabaseData;