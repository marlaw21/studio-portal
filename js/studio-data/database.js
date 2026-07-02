/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 047E — First Knowledge Engine Records
File: js/studio-data/database.js
*/

const studioDatabaseData = {
    meta: {
        name: "Studio Database Foundation",
        version: "v0.47.1",
        status: "Foundation",
        description: "Database-ready record structure for Two Marshalls Studios Operating System with universal record IDs and first Knowledge Engine records."
    },

    records: {
        workSessions: [
            { id: "WS-2026-0047", number: "047", title: "Studio Knowledge Engine Foundation", department: "Core Architecture", status: "In Progress", version: "v0.47.1", year: "2026", summary: "Establish the Knowledge Engine record model so TMS-OS can preserve work sessions, decisions, recommendations, milestones, and generated documentation packages." },
            { id: "WS-2026-0043", number: "043", title: "Cross-Department Global Search", department: "Core Architecture", status: "Complete", version: "v0.43.0", year: "2026", summary: "Move department records into StudioDB so global search can search across all departments." },
            { id: "WS-2026-0042", number: "042", title: "Global Search Integration", department: "Core Architecture", status: "Complete", version: "v0.42.0", year: "2026", summary: "Updated search.js to use StudioDB.search()." },
            { id: "WS-2026-0041", number: "041", title: "Core Data Cleanup", department: "Core Architecture", status: "Complete", version: "v0.41.0", year: "2026", summary: "Cleaned core.js so it only stores studio identity and current state." },
            { id: "WS-2026-0040", number: "040", title: "Data Consolidation", department: "Core Architecture", status: "Complete", version: "v0.40.0", year: "2026", summary: "Moved Headquarters records into the Studio Database to reduce duplicate data." },
            { id: "WS-2026-0039", number: "039", title: "Headquarters Uses StudioDB", department: "Core Architecture", status: "Complete", version: "v0.39.0", year: "2026", summary: "Updated the Headquarters renderer to read records through StudioDB." },
            { id: "WS-2026-0038", number: "038", title: "Documentation Uses StudioDB", department: "Core Architecture", status: "Complete", version: "v0.38.0", year: "2026", summary: "Updated the Documentation renderer to read records through StudioDB." },
            { id: "WS-2026-0037", number: "037", title: "StudioDB v1", department: "Core Architecture", status: "Complete", version: "v0.37.0", year: "2026", summary: "Moved StudioDB into loader.js and confirmed database access works." },
            { id: "WS-2026-0036", number: "036", title: "Studio Database Engine", department: "Core Architecture", status: "Complete", version: "v0.36.0", year: "2026", summary: "Tested the database engine approach and moved toward a simpler loader-based StudioDB." },
            { id: "WS-2026-0035", number: "035", title: "Studio Database Foundation", department: "Core Architecture", status: "Complete", version: "v0.35.0", year: "2026", summary: "Created a database-ready record structure for future Studio OS data." }
        ],

        projects: [
            { id: "PRJ-2026-0001", name: "Dead Roads", title: "Dead Roads", description: "Third-person survival game.", department: "Development", status: "In Development", summary: "Primary survival game project for Two Marshalls Studios." },
            { id: "PRJ-2026-0002", name: "45s", title: "45s", description: "Fast, simple card-based game concept.", department: "Development", status: "Planned", summary: "Simple card game concept planned for future development." },
            { id: "PRJ-2026-0003", name: "Studio Operating System", title: "Studio Operating System", description: "Internal system for running Two Marshalls Studios.", department: "Core Architecture", status: "Active", summary: "The Studio Portal / TMS-OS foundation." }
        ],

        status: [
            { id: "STAT-2026-0001", label: "Studio Portal", name: "Studio Portal", value: "Online", status: "Online", department: "Core Architecture", summary: "The Studio Portal is running locally and rendering." },
            { id: "STAT-2026-0002", label: "GitHub", name: "GitHub", value: "Connected", status: "Connected", department: "Development", summary: "GitHub is connected for source control." },
            { id: "STAT-2026-0003", label: "GitHub Pages", name: "GitHub Pages", value: "Live", status: "Live", department: "Publishing", summary: "GitHub Pages is available for hosted portal access." },
            { id: "STAT-2026-0004", label: "Shared Search", name: "Shared Search", value: "Complete", status: "Complete", department: "Core Architecture", summary: "The shared search engine is complete." }
        ],

        notifications: [
            { id: "NOTIF-2026-0001", title: "Cross-Department Search Active", name: "Cross-Department Search Active", description: "Search can now support studio-wide knowledge discovery across departments.", department: "Core Architecture", status: "Active", summary: "Search foundation is active." },
            { id: "NOTIF-2026-0002", title: "Shared Search Engine Complete", name: "Shared Search Engine Complete", description: "Search behavior now lives in a reusable shared search file.", department: "Core Architecture", status: "Complete", summary: "Shared search engine completed." },
            { id: "NOTIF-2026-0003", title: "Main Milestone", name: "Main Milestone", description: "Prepare the next stable Studio OS foundation improvement.", department: "Planning", status: "Planned", summary: "Next milestone is planned." }
        ],

        studioCommands: [
            { id: "CMD-2026-0001", name: "Studio Portal", title: "Studio Portal", description: "Main Studio OS portal.", department: "Core Architecture", status: "Online", summary: "Studio Portal command is online." },
            { id: "CMD-2026-0002", name: "GitHub", title: "GitHub", description: "Source control and project repository.", department: "Development", status: "Connected", summary: "GitHub command is connected." },
            { id: "CMD-2026-0003", name: "GitHub Pages", title: "GitHub Pages", description: "Hosted Studio Portal access.", department: "Publishing", status: "Live", summary: "GitHub Pages command is live." },
            { id: "CMD-2026-0004", name: "Shared Search", title: "Shared Search", description: "Reusable search system.", department: "Core Architecture", status: "Complete", summary: "Shared search command is complete." }
        ],

        systemConfig: [
            { id: "CFG-2026-0001", label: "Operating Mode", name: "Operating Mode", value: "Foundation Build", department: "Core Architecture", status: "Active", summary: "The Studio OS is currently in foundation build mode." },
            { id: "CFG-2026-0002", label: "Data Source", name: "Data Source", value: "StudioDB records", department: "Core Architecture", status: "Active", summary: "The current data source is StudioDB records." },
            { id: "CFG-2026-0003", label: "Render Engine", name: "Render Engine", value: "app.js", department: "Core Architecture", status: "Active", summary: "The Headquarters render engine is app.js." },
            { id: "CFG-2026-0004", label: "Search Engine", name: "Search Engine", value: "search.js + StudioDB.search()", department: "Core Architecture", status: "Active", summary: "The shared search engine is powered by StudioDB.search()." },
            { id: "CFG-2026-0005", label: "Hosting", name: "Hosting", value: "GitHub Pages", department: "Publishing", status: "Active", summary: "The portal is planned for GitHub Pages hosting." }
        ],

        progress: [
            { id: "PROG-2026-0001", name: "Foundation", label: "Foundation", value: 100, department: "Core Architecture", status: "Complete", summary: "Foundation layer is complete." },
            { id: "PROG-2026-0002", name: "Navigation", label: "Navigation", value: 100, department: "Core Architecture", status: "Complete", summary: "Navigation layer is complete." },
            { id: "PROG-2026-0003", name: "Dynamic Engine", label: "Dynamic Engine", value: 100, department: "Core Architecture", status: "Complete", summary: "Dynamic rendering engine is complete." },
            { id: "PROG-2026-0004", name: "Studio OS Layer", label: "Studio OS Layer", value: 98, department: "Core Architecture", status: "In Progress", summary: "Studio OS layer is in progress." },
            { id: "PROG-2026-0005", name: "Shared Search Engine", label: "Shared Search Engine", value: 100, department: "Core Architecture", status: "Complete", summary: "Shared search engine is complete." }
        ],

        departments: [
            { id: "DEPT-2026-0001", name: "Documentation", title: "Documentation", icon: "📚", url: "pages/documentation.html", description: "Standards, guides, decisions, and studio knowledge.", department: "Documentation", status: "Active", summary: "Build sessions, decisions, standards, procedures, and enhancement tracking." },
            { id: "DEPT-2026-0002", name: "Development", title: "Development", icon: "🛠", url: "pages/development.html", description: "GitHub, Unity, builds, releases, and technical work.", department: "Development", status: "Active", summary: "Game development, code, GitHub, Unity, testing, and releases." },
            { id: "DEPT-2026-0003", name: "Assets", title: "Assets", icon: "🎨", url: "pages/assets.html", description: "Art, models, audio, icons, and reusable materials.", department: "Assets", status: "Planned", summary: "Art, models, audio, icons, and reusable game materials." },
            { id: "DEPT-2026-0004", name: "Publishing", title: "Publishing", icon: "🚀", url: "pages/publishing.html", description: "Store pages, checklists, launch plans, and releases.", department: "Publishing", status: "Planned", summary: "Store pages, checklists, launch plans, and release operations." },
            { id: "DEPT-2026-0005", name: "Marketing", title: "Marketing", icon: "📣", url: "pages/marketing.html", description: "Screenshots, trailers, campaigns, and brand assets.", department: "Marketing", status: "Planned", summary: "Screenshots, trailers, campaigns, and brand assets." },
            { id: "DEPT-2026-0006", name: "Business Operations", title: "Business Operations", icon: "🏢", url: "pages/business.html", description: "Planning, finance, scheduling, and studio management.", department: "Business Operations", status: "Active", summary: "Planning, finance, scheduling, management, and operating decisions." }
        ],

        assetCategories: [
            { id: "ASSETCAT-2026-0001", name: "3D Models", title: "3D Models", description: "Unity and Blender models.", department: "Assets", status: "Active", summary: "Unity and Blender 3D model assets." },
            { id: "ASSETCAT-2026-0002", name: "Textures & Materials", title: "Textures & Materials", description: "Surfaces, shaders, and reusable materials.", department: "Assets", status: "Active", summary: "Texture, surface, shader, and material assets." },
            { id: "ASSETCAT-2026-0003", name: "Audio Library", title: "Audio Library", description: "Music, ambience, sound effects, and voice.", department: "Assets", status: "Planned", summary: "Audio assets for music, ambience, sound effects, and voice." }
        ],

        assetGroups: [
            { id: "ASSETGRP-2026-0001", icon: "🪓", name: "Weapons", title: "Weapons", description: "Tools, melee, ranged weapons, and upgrades.", department: "Assets", status: "Planned", summary: "Weapon and tool assets." },
            { id: "ASSETGRP-2026-0002", icon: "🌲", name: "Environment", title: "Environment", description: "Trees, rocks, terrain, foliage, and props.", department: "Assets", status: "Planned", summary: "Environment assets." },
            { id: "ASSETGRP-2026-0003", icon: "🏠", name: "Buildings", title: "Buildings", description: "Structures, interiors, furniture, and modular kits.", department: "Assets", status: "Planned", summary: "Building and structure assets." },
            { id: "ASSETGRP-2026-0004", icon: "🎵", name: "Audio", title: "Audio", description: "Music, ambience, effects, and voice assets.", department: "Assets", status: "Planned", summary: "Audio asset group." },
            { id: "ASSETGRP-2026-0005", icon: "🖥️", name: "UI Assets", title: "UI Assets", description: "Icons, menus, HUD elements, and interface graphics.", department: "Assets", status: "Planned", summary: "User interface assets." },
            { id: "ASSETGRP-2026-0006", icon: "🎬", name: "Animations", title: "Animations", description: "Character, creature, and object animations.", department: "Assets", status: "Planned", summary: "Animation assets." }
        ],

        publishingChannels: [
            { id: "PUBCH-2026-0001", name: "Apple App Store", title: "Apple App Store", description: "iPhone and iPad publishing path.", department: "Publishing", status: "Planned", summary: "Apple App Store publishing channel." },
            { id: "PUBCH-2026-0002", name: "Google Play", title: "Google Play", description: "Android phone and tablet publishing path.", department: "Publishing", status: "Planned", summary: "Google Play publishing channel." },
            { id: "PUBCH-2026-0003", name: "Steam", title: "Steam", description: "PC publishing and distribution path.", department: "Publishing", status: "Planned", summary: "Steam publishing channel." }
        ],

        publishingPipeline: [
            { id: "PUBPIPE-2026-0001", icon: "✅", name: "Prepare", title: "Prepare", description: "Confirm game build, store assets, screenshots, descriptions, and requirements.", department: "Publishing", status: "Planned", summary: "Prepare publishing materials." },
            { id: "PUBPIPE-2026-0002", icon: "📦", name: "Package", title: "Package", description: "Create the correct release build for the target platform.", department: "Publishing", status: "Planned", summary: "Package release build." },
            { id: "PUBPIPE-2026-0003", icon: "🧪", name: "Review", title: "Review", description: "Test release candidates before submitting to any platform.", department: "Publishing", status: "Planned", summary: "Review release candidate." },
            { id: "PUBPIPE-2026-0004", icon: "🚀", name: "Submit", title: "Submit", description: "Upload the release package to the correct store or distribution channel.", department: "Publishing", status: "Planned", summary: "Submit release package." },
            { id: "PUBPIPE-2026-0005", icon: "📣", name: "Launch", title: "Launch", description: "Coordinate launch timing, marketing, announcements, and release notes.", department: "Publishing", status: "Planned", summary: "Launch release." },
            { id: "PUBPIPE-2026-0006", icon: "📊", name: "Track", title: "Track", description: "Monitor downloads, feedback, ratings, issues, and revenue after release.", department: "Publishing", status: "Planned", summary: "Track launch results." }
        ],

        marketingChannels: [
            { id: "MKTCH-2026-0001", name: "Game Store Assets", title: "Game Store Assets", description: "Screenshots, icons, descriptions, capsule art, and feature graphics.", department: "Marketing", status: "Planned", summary: "Store-facing game marketing assets." },
            { id: "MKTCH-2026-0002", name: "Trailers & Video", title: "Trailers & Video", description: "Gameplay trailers, teaser videos, development updates, and launch videos.", department: "Marketing", status: "Planned", summary: "Trailer and video marketing channel." },
            { id: "MKTCH-2026-0003", name: "Community Updates", title: "Community Updates", description: "Player-facing updates, development news, and release announcements.", department: "Marketing", status: "Planned", summary: "Community update marketing channel." }
        ],

        marketingPipeline: [
            { id: "MKTPIPE-2026-0001", icon: "🧠", name: "Message", title: "Message", description: "Define what the game is, who it is for, and why players should care.", department: "Marketing", status: "Planned", summary: "Define marketing message." },
            { id: "MKTPIPE-2026-0002", icon: "📸", name: "Capture", title: "Capture", description: "Create screenshots, clips, gameplay footage, and visual materials.", department: "Marketing", status: "Planned", summary: "Capture marketing materials." },
            { id: "MKTPIPE-2026-0003", icon: "🎬", name: "Produce", title: "Produce", description: "Build trailers, store graphics, announcements, and release content.", department: "Marketing", status: "Planned", summary: "Produce marketing assets." },
            { id: "MKTPIPE-2026-0004", icon: "📢", name: "Publish", title: "Publish", description: "Post updates, store materials, community announcements, and launch messages.", department: "Marketing", status: "Planned", summary: "Publish marketing messages." },
            { id: "MKTPIPE-2026-0005", icon: "👥", name: "Engage", title: "Engage", description: "Respond to feedback, track interest, and build trust with players.", department: "Marketing", status: "Planned", summary: "Engage with players." },
            { id: "MKTPIPE-2026-0006", icon: "📈", name: "Measure", title: "Measure", description: "Review traffic, wishlists, downloads, engagement, reviews, and conversion.", department: "Marketing", status: "Planned", summary: "Measure marketing results." }
        ],

        decisions: [
            { id: "DEC-2026-0001", title: "Use Modular Studio Data", name: "Decision 001 — Use Modular Studio Data", department: "Core Architecture", status: "Approved", summary: "Reusable Studio OS data belongs in structured data files." },
            { id: "DEC-2026-0002", title: "Use Full File Replacement", name: "Decision 002 — Use Full File Replacement", department: "Development", status: "Approved", summary: "When code changes, replace the full file instead of using partial snippets." },
            { id: "DEC-2026-0003", title: "Finish Foundation Before Enhancements", name: "Decision 003 — Finish Foundation Before Enhancements", department: "Planning", status: "Approved", summary: "Enhancement ideas are captured but not built until the foundation is stable." },
            { id: "DEC-2026-0004", title: "Separate Data From Renderers", name: "Decision 004 — Separate Data From Renderers", department: "Core Architecture", status: "Approved", summary: "Data files store records; renderer files display records." },
            { id: "DEC-2026-0005", title: "Use Shared Layout", name: "Decision 005 — Use Shared Layout", department: "Core Architecture", status: "Approved", summary: "Header, navigation, and footer should come from a shared layout engine." }
        ],

        standards: [
            { id: "STD-2026-0001", title: "Full File Replacement Standard", name: "Standard 001 — Full File Replacement", department: "Development", status: "Active", summary: "Always provide complete replacement files when code changes." },
            { id: "STD-2026-0002", title: "Local Testing Standard", name: "Standard 002 — Local Testing", department: "Testing", status: "Active", summary: "After each change, refresh locally with Ctrl + Shift + R and verify no errors." },
            { id: "STD-2026-0003", title: "Renderer Separation Standard", name: "Standard 003 — Renderer Separation", department: "Core Architecture", status: "Active", summary: "Each department page should use its own renderer." },
            { id: "STD-2026-0004", title: "Shared Layout Standard", name: "Standard 004 — Shared Layout", department: "Core Architecture", status: "Active", summary: "All pages should use the shared layout engine where possible." },
            { id: "STD-2026-0005", title: "Shared Components Standard", name: "Standard 005 — Shared Components", department: "Core Architecture", status: "Active", summary: "Reusable UI cards should come from shared component functions." }
        ],

        procedures: [
            { id: "PROC-2026-0001", title: "Work Session Procedure", name: "Procedure 001 — Work Session", department: "Development", status: "Active", summary: "Start with a clear goal, make focused changes, test, document, then move on." },
            { id: "PROC-2026-0002", title: "Bug Fix Procedure", name: "Procedure 002 — Bug Fix", department: "Testing", status: "Active", summary: "When a bug appears, stop new work, identify the source, fix it, and retest." },
            { id: "PROC-2026-0003", title: "Documentation Update Procedure", name: "Procedure 003 — Documentation Update", department: "Documentation", status: "Active", summary: "Each completed work session should be added to the structured documentation records." }
        ],

        enhancements: [
            { id: "ENH-2026-0001", title: "Google Drive Publishing", name: "Enhancement 001 — Google Drive Publishing", department: "Documentation", status: "Deferred", priority: "High", summary: "Publish structured documentation into the future Google Drive documentation hierarchy." },
            { id: "ENH-2026-0002", title: "Interactive Documentation Forms", name: "Enhancement 002 — Interactive Documentation Forms", department: "Documentation", status: "Deferred", priority: "Medium", summary: "Allow records to be added through the Studio Portal interface." },
            { id: "ENH-2026-0003", title: "Command Palette", name: "Enhancement 003 — Command Palette", department: "Core Architecture", status: "Deferred", priority: "Medium", summary: "Add a command palette for fast navigation and studio actions." }
        ],

        designPrinciples: [
            { id: "DP-2026-0001", title: "TMS-OS Is the Source of Truth", status: "Active", department: "Core Architecture", summary: "TMS-OS should become the permanent source of truth for studio knowledge, with Google Drive, GitHub, and ChatGPT treated as outputs or supporting tools.", relatedWorkSessions: ["WS-2026-0047"], relatedProjects: ["PRJ-2026-0003"], relatedRecordIds: ["KP-2026-0001"] },
            { id: "DP-2026-0002", title: "Documentation Is a Product of Development", status: "Active", department: "Documentation", summary: "Important knowledge should be generated from each work session rather than manually entered into forms after the fact.", relatedWorkSessions: ["WS-2026-0047"], relatedStandards: ["STD-2026-0001"], relatedProcedures: ["PROC-2026-0003"] },
            { id: "DP-2026-0003", title: "No Important Knowledge Exists Only in Chat", status: "Active", department: "Documentation", summary: "Decisions, recommendations, bugs, fixes, enhancements, lessons, and milestones should be captured into TMS-OS so they are not trapped in conversation history.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["CHRON-2026-0005"] },
            { id: "DP-2026-0004", title: "Foundation Before Enhancements", status: "Active", department: "Planning", summary: "Enhancement ideas should be captured and preserved, but not built until the agreed foundation is stable.", relatedDecisions: ["DEC-2026-0003"], relatedEnhancements: ["ENH-2026-0002", "ENH-2026-0003"] },
            { id: "DP-2026-0005", title: "Modular Architecture Over Monolithic Files", status: "Active", department: "Core Architecture", summary: "TMS-OS should favor modular data, shared renderers, reusable components, and focused files instead of large all-purpose scripts.", relatedDecisions: ["DEC-2026-0001", "DEC-2026-0004", "DEC-2026-0005"], relatedStandards: ["STD-2026-0003", "STD-2026-0004", "STD-2026-0005"] },
            { id: "DP-2026-0006", title: "Preserve Reasoning, Not Just Outcomes", status: "Active", department: "Documentation", summary: "TMS-OS documentation should capture why choices were made, not only what changed.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["REC-2026-0004"] },
            { id: "DP-2026-0007", title: "Complete Replacement Files for Code Changes", status: "Active", department: "Development", summary: "When code changes are needed, provide complete replacement files rather than partial snippets to reduce confusion and missed steps.", relatedDecisions: ["DEC-2026-0002"], relatedStandards: ["STD-2026-0001"] }
        ],
        lessonsLearned: [
            { id: "LESSON-2026-0001", title: "Schema-Aware Validation Is Better Than Generic Validation", status: "Active", department: "Core Architecture", summary: "A generic validator incorrectly flagged status, systemConfig, and progress records, leading to the decision to validate each record type by its own schema.", relatedWorkSessions: ["WS-2026-0045"], relatedFiles: ["js/studio-data/loader.js"] },
            { id: "LESSON-2026-0002", title: "Script Load Order Controls StudioDB Availability", status: "Active", department: "Development", summary: "Pages must load database.js before loader.js or StudioDB will not contain the expected records.", relatedWorkSessions: ["WS-2026-0044"], relatedFiles: ["pages/assets.html", "pages/development.html", "pages/publishing.html", "pages/marketing.html", "pages/business.html"] },
            { id: "LESSON-2026-0003", title: "JSON Export Should Come Before Google Sync", status: "Active", department: "Core Architecture", summary: "Local JSON export gives TMS-OS a portable data format before introducing Google authentication, permissions, and synchronization complexity.", relatedWorkSessions: ["WS-2026-0046"], relatedRecommendations: ["REC-2026-0001"], relatedEnhancements: ["ENH-2026-0001"] },
            { id: "LESSON-2026-0004", title: "StudioDB Enables Cross-Department Search", status: "Active", department: "Core Architecture", summary: "Once department data moved into StudioDB, the shared search engine could search and navigate across the whole portal.", relatedWorkSessions: ["WS-2026-0042", "WS-2026-0043"], relatedFiles: ["js/search.js", "js/studio-data/database.js"] },
            { id: "LESSON-2026-0005", title: "AI-Generated Documentation Needs Confidence and Review", status: "Active", department: "Documentation", summary: "Generated records should distinguish facts, recommendations, approved decisions, and reconstructed history so documentation remains trustworthy.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["REC-2026-0004"] }
        ],
        technicalDebt: [
            { id: "DEBT-2026-0001", title: "Backfill Work Sessions 001-034", status: "Open", department: "Documentation", priority: "High", summary: "Earlier TMS-OS work sessions need to be reconstructed from chat history, Git history, existing files, and user-provided context.", relatedWorkSessions: ["WS-2026-0047"], relatedMilestones: ["MILE-2026-0005"] },
            { id: "DEBT-2026-0002", title: "Create Google Documentation Center", status: "Open", department: "Documentation", priority: "High", summary: "The future Google Drive / Google Docs documentation area still needs to be created and connected after local knowledge packaging works.", relatedEnhancements: ["ENH-2026-0001"], relatedRecommendations: ["REC-2026-0001"] },
            { id: "DEBT-2026-0003", title: "Build Documentation Package Publisher", status: "Open", department: "Core Architecture", priority: "High", summary: "TMS-OS needs a way to turn knowledge packages into saved documentation files before cloud publishing.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["KP-2026-0001"] },
            { id: "DEBT-2026-0004", title: "Create StudioDB Import Path", status: "Open", department: "Core Architecture", priority: "Medium", summary: "StudioDB can export JSON, but a safe import path still needs to be created later.", relatedWorkSessions: ["WS-2026-0046"], relatedFiles: ["js/studio-data/loader.js"] },
            { id: "DEBT-2026-0005", title: "Design Widget Framework", status: "Open", department: "Core Architecture", priority: "Medium", summary: "Dashboard widgets should eventually become modular so Headquarters does not become a large all-purpose renderer.", relatedRecommendations: ["REC-2026-0002"], relatedFiles: ["js/app.js"] }
        ],
        milestones: [
            { id: "MILE-2026-0001", title: "StudioDB Shared Data Layer Established", status: "Complete", department: "Core Architecture", summary: "TMS-OS moved from scattered page data toward a centralized StudioDB data layer.", relatedWorkSessions: ["WS-2026-0035", "WS-2026-0036", "WS-2026-0037"] },
            { id: "MILE-2026-0002", title: "All Departments Migrated to StudioDB", status: "Complete", department: "Core Architecture", summary: "Headquarters, Documentation, Development, Assets, Publishing, Marketing, and Business all render through StudioDB-backed data.", relatedWorkSessions: ["WS-2026-0041", "WS-2026-0042", "WS-2026-0043", "WS-2026-0044"] },
            { id: "MILE-2026-0003", title: "Cross-Department Global Search Working", status: "Complete", department: "Core Architecture", summary: "Search can find and navigate to records across departments using StudioDB.search().", relatedWorkSessions: ["WS-2026-0042", "WS-2026-0043"], relatedFiles: ["js/search.js"] },
            { id: "MILE-2026-0004", title: "StudioDB Validation and Export Foundation Complete", status: "Complete", department: "Core Architecture", summary: "StudioDB can validate schemas, detect duplicate IDs, and export the database as JSON.", relatedWorkSessions: ["WS-2026-0045", "WS-2026-0046"], relatedFiles: ["js/studio-data/loader.js"] },
            { id: "MILE-2026-0005", title: "Knowledge Engine Foundation Started", status: "In Progress", department: "Documentation", summary: "TMS-OS began adding record types and relationship standards for generated documentation and institutional memory.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["KP-2026-0001"] }
        ],
        research: [
            { id: "RSRCH-2026-0001", title: "Google Drive Integration Deferred Until Local Export Works", status: "Active", department: "Documentation", summary: "Google Drive synchronization should follow local JSON export and documentation package generation to avoid premature complexity.", relatedWorkSessions: ["WS-2026-0046", "WS-2026-0047"], relatedRecommendations: ["REC-2026-0001"], relatedEnhancements: ["ENH-2026-0001"] }
        ],
        knowledgePackages: [
            { id: "KP-2026-0001", title: "Studio Knowledge Engine Foundation Package", status: "Draft", department: "Documentation", summary: "Initial knowledge package capturing the transition from portal architecture to institutional memory, including design principles, milestones, recommendations, lessons, and technical debt.", sessionNumber: "047", confidence: "High", relatedWorkSessions: ["WS-2026-0047"], relatedProjects: ["PRJ-2026-0003"], relatedMilestones: ["MILE-2026-0005"], relatedRecommendations: ["REC-2026-0001", "REC-2026-0002", "REC-2026-0003", "REC-2026-0004"], relatedEnhancements: ["ENH-2026-0001"], relatedFiles: ["js/studio-data/database.js", "js/studio-data/loader.js"] }
        ],
        studioChronicle: [
            { id: "CHRON-2026-0001", title: "Two Marshalls Studios Portal Foundation Created", status: "Recorded", department: "Studio History", summary: "The studio portal began as a headquarters dashboard for games, systems, publishing, and operations.", relatedProjects: ["PRJ-2026-0003"] },
            { id: "CHRON-2026-0002", title: "StudioDB Became the Shared Data Layer", status: "Recorded", department: "Studio History", summary: "TMS-OS shifted from page-specific data access to a centralized StudioDB architecture.", relatedMilestones: ["MILE-2026-0001"], relatedDecisions: ["DEC-2026-0004"] },
            { id: "CHRON-2026-0003", title: "All Departments Migrated to StudioDB", status: "Recorded", department: "Studio History", summary: "Every major department page began rendering from shared StudioDB records.", relatedMilestones: ["MILE-2026-0002"] },
            { id: "CHRON-2026-0004", title: "StudioDB Export Proved Portable Data", status: "Recorded", department: "Studio History", summary: "The database successfully exported as JSON with validation metadata, proving it could move beyond JavaScript-only storage.", relatedWorkSessions: ["WS-2026-0046"], relatedMilestones: ["MILE-2026-0004"] },
            { id: "CHRON-2026-0005", title: "Knowledge Engine Direction Approved", status: "Recorded", department: "Studio History", summary: "The studio adopted the goal that work sessions should automatically generate documentation and preserve institutional knowledge without manual form entry.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["KP-2026-0001"] }
        ],
        bugs: [
            { id: "BUG-2026-0001", title: "StudioDB Not Defined After Loader Replacement", status: "Fixed", department: "Core Architecture", summary: "A broken loader.js replacement caused StudioDB to be undefined until the full loader file was replaced correctly.", relatedWorkSessions: ["WS-2026-0045"], relatedFiles: ["js/studio-data/loader.js"] },
            { id: "BUG-2026-0002", title: "Department Pages Missing Database Script", status: "Fixed", department: "Core Architecture", summary: "Some department pages did not load database.js before loader.js, causing StudioDB-backed renderers to show empty content.", relatedWorkSessions: ["WS-2026-0044"], relatedFiles: ["pages/assets.html", "pages/development.html"] },
            { id: "BUG-2026-0003", title: "Documentation Data File Contained Renderer Logic", status: "Fixed", department: "Documentation", summary: "The studio-data documentation file contained page-rendering code and was replaced with a data-only compatibility placeholder.", relatedWorkSessions: ["WS-2026-0040"], relatedFiles: ["js/studio-data/documentation.js"] }
        ],
        recommendations: [
            { id: "REC-2026-0001", title: "Build JSON Export Before Google Drive Sync", status: "Accepted", department: "Core Architecture", summary: "Create a local exportable data format before adding Google authentication and synchronization.", relatedWorkSessions: ["WS-2026-0046"], relatedEnhancements: ["ENH-2026-0001"], relatedFiles: ["js/studio-data/loader.js"] },
            { id: "REC-2026-0002", title: "Introduce Modular Dashboard Widgets Later", status: "Deferred", department: "Core Architecture", summary: "Avoid turning app.js into a large all-purpose renderer by eventually introducing modular dashboard widgets.", relatedFiles: ["js/app.js"], relatedTechnicalDebt: ["DEBT-2026-0005"] },
            { id: "REC-2026-0003", title: "Create Knowledge Packages After Every Session", status: "Accepted", department: "Documentation", summary: "Every development session should produce a package of work completed, decisions, recommendations, enhancements, bugs, lessons, and next steps.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["KP-2026-0001"] },
            { id: "REC-2026-0004", title: "Separate Facts, Recommendations, and Approved Decisions", status: "Accepted", department: "Documentation", summary: "Generated documentation should distinguish factual work performed, AI recommendations, and user-approved decisions.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["LESSON-2026-0005"] },
            { id: "REC-2026-0005", title: "Use Universal IDs Across All Record Types", status: "Accepted", department: "Core Architecture", summary: "Use consistent TYPE-YEAR-NUMBER identifiers across StudioDB to make records easier to search, reference, export, and publish.", relatedWorkSessions: ["WS-2026-0047"], relatedFiles: ["js/studio-data/database.js"] },
            { id: "REC-2026-0006", title: "Backfill Earlier Project History Through Knowledge Migration", status: "Accepted", department: "Documentation", summary: "Reconstruct earlier TMS-OS history from prior chats, Git history, existing files, and user context so documentation reads from the beginning of the project.", relatedWorkSessions: ["WS-2026-0047"], relatedTechnicalDebt: ["DEBT-2026-0001"] }
        ],
        releases: [
            { id: "REL-2026-0001", title: "StudioDB Foundation Checkpoint", status: "Internal", department: "Core Architecture", summary: "Internal checkpoint after completing StudioDB migration, validation, and export foundations.", relatedWorkSessions: ["WS-2026-0041", "WS-2026-0042", "WS-2026-0043", "WS-2026-0044", "WS-2026-0045", "WS-2026-0046"] }
        ],
        risks: [
            { id: "RISK-2026-0001", title: "Relying on Chat History for Permanent Knowledge", status: "Mitigating", department: "Documentation", summary: "Important project knowledge could be lost if it remains only in chat history instead of being captured into StudioDB and published documentation.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["DP-2026-0003", "DEBT-2026-0001"] }
        ],
        meetingNotes: [
            { id: "MEET-2026-0001", title: "Knowledge Engine Direction Discussion", status: "Recorded", department: "Documentation", summary: "The user clarified that they do not want to manually fill out forms; they want the assistant and TMS-OS to generate documentation records after each session for later Google publication.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["REC-2026-0003", "DP-2026-0002"] }
        ],
        aiConversations: [
            { id: "AIC-2026-0001", title: "AI-Assisted Session Documentation Direction", status: "Recorded", department: "Documentation", summary: "The project established that AI should help identify and generate documentation-worthy records, including enhancements and recommendations, instead of requiring manual tracking forms.", relatedWorkSessions: ["WS-2026-0047"], relatedRecordIds: ["DP-2026-0002", "REC-2026-0003"] }
        ]
    }
};

window.studioDatabaseData = studioDatabaseData;