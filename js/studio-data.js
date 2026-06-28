const studioData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v0.9",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    currentWorkSession: {
        number: "017",
        title: "Studio OS Core Engine",
        phase: "Core Engine Foundation",
        focus: "Add the first Studio OS command, notification, version, and configuration systems.",
        status: "In Progress"
    },

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Core Engine Foundation",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Shared data cleanup completed",
        lastPush: "Completed after Work Session 016",
        currentDepartment: "Headquarters"
    },

    systemConfig: [
        {
            label: "Operating Mode",
            value: "Foundation Build"
        },
        {
            label: "Data Source",
            value: "studio-data.js"
        },
        {
            label: "Render Engine",
            value: "app.js"
        },
        {
            label: "Hosting",
            value: "GitHub Pages"
        }
    ],

    studioCommands: [
        {
            name: "Review Current Work",
            description: "Check the current work session, milestone, and active project.",
            status: "Ready"
        },
        {
            name: "Check Studio Status",
            description: "Review system health, build progress, and active studio state.",
            status: "Ready"
        },
        {
            name: "Open Department",
            description: "Use navigation to move between Studio Headquarters departments.",
            status: "Ready"
        },
        {
            name: "Log Enhancement Idea",
            description: "Capture future improvements without interrupting current development.",
            status: "Planned"
        }
    ],

    notifications: [
        {
            title: "Studio OS Core Engine Started",
            description: "The portal is now beginning to behave like an operating system.",
            status: "Active"
        },
        {
            title: "Shared Data Cleanup Complete",
            description: "Department data now lives in studio-data.js instead of app.js.",
            status: "Complete"
        },
        {
            title: "Next Milestone",
            description: "Begin preparing the portal for real work-session tracking.",
            status: "Planned"
        }
    ],

    versionHistory: [
        {
            name: "v0.9",
            description: "Studio OS Core Engine started.",
            status: "Current"
        },
        {
            name: "v0.8",
            description: "Department data moved into shared studio data file.",
            status: "Complete"
        },
        {
            name: "v0.7",
            description: "Studio State, Foundation Progress, and Activity Feed added.",
            status: "Complete"
        },
        {
            name: "v0.6",
            description: "Dynamic Dashboard Engine created.",
            status: "Complete"
        }
    ],

    progress: [
        {
            name: "Foundation",
            value: 100
        },
        {
            name: "Navigation",
            value: 100
        },
        {
            name: "Dynamic Engine",
            value: 100
        },
        {
            name: "Studio OS Layer",
            value: 55
        },
        {
            name: "Core Engine",
            value: 25
        }
    ],

    activityFeed: [
        {
            time: "Current",
            title: "Work Session 017 Started",
            description: "Building the first Studio OS Core Engine layer."
        },
        {
            time: "Previous",
            title: "Shared Data Cleanup Completed",
            description: "Department-specific data was moved out of app.js and into studio-data.js."
        },
        {
            time: "Previous",
            title: "Studio OS Foundation Added",
            description: "Studio State, Foundation Progress, and Activity Feed were added to Headquarters."
        }
    ],

    status: [
        {
            label: "Studio Portal",
            value: "Online",
            state: "green"
        },
        {
            label: "GitHub",
            value: "Connected",
            state: "green"
        },
        {
            label: "GitHub Pages",
            value: "Live",
            state: "green"
        },
        {
            label: "Core Engine",
            value: "Started",
            state: "green"
        }
    ],

    projects: [
        {
            name: "Dead Roads",
            description: "Third-person survival game.",
            status: "In Development",
            type: "Game"
        },
        {
            name: "45s",
            description: "Fast, simple card-based game concept.",
            status: "Planned",
            type: "Game"
        },
        {
            name: "Studio Operating System",
            description: "Internal system for running Two Marshalls Studios.",
            status: "Active",
            type: "System"
        }
    ],

    departments: [
        {
            name: "Documentation",
            icon: "📚",
            description: "Standards, guides, decisions, and studio knowledge.",
            url: "pages/documentation.html"
        },
        {
            name: "Development",
            icon: "🛠️",
            description: "GitHub, Unity, builds, releases, and technical work.",
            url: "pages/development.html"
        },
        {
            name: "Assets",
            icon: "🎨",
            description: "Art, models, audio, icons, and reusable materials.",
            url: "pages/assets.html"
        },
        {
            name: "Publishing",
            icon: "🚀",
            description: "Store pages, checklists, launch plans, and releases.",
            url: "pages/publishing.html"
        },
        {
            name: "Marketing",
            icon: "📣",
            description: "Screenshots, trailers, campaigns, and brand assets.",
            url: "pages/marketing.html"
        },
        {
            name: "Business Operations",
            icon: "💼",
            description: "Planning, finance, time tracking, and studio management.",
            url: "pages/business.html"
        }
    ],

    documentationRecords: [
        {
            name: "Build Session Log",
            description: "Tracks what was completed during each work session.",
            status: "Planned"
        },
        {
            name: "Decision Log",
            description: "Records important studio decisions and why they were made.",
            status: "Planned"
        },
        {
            name: "Enhancement Ideas Log",
            description: "Stores future ideas without interrupting active development.",
            status: "Planned"
        }
    ],

    assetCategories: [
        {
            name: "3D Models",
            description: "Unity and Blender models.",
            status: "Active"
        },
        {
            name: "Textures & Materials",
            description: "Surfaces, shaders, and reusable materials.",
            status: "Active"
        },
        {
            name: "Audio Library",
            description: "Music, ambience, sound effects, and voice.",
            status: "Planned"
        }
    ],

    assetGroups: [
        {
            icon: "🪓",
            name: "Weapons",
            description: "Tools, melee, ranged weapons, and upgrades."
        },
        {
            icon: "🌲",
            name: "Environment",
            description: "Trees, rocks, terrain, foliage, and props."
        },
        {
            icon: "🏠",
            name: "Buildings",
            description: "Structures, interiors, furniture, and modular kits."
        },
        {
            icon: "🎵",
            name: "Audio",
            description: "Music, ambience, effects, and voice assets."
        },
        {
            icon: "🖥️",
            name: "UI Assets",
            description: "Icons, menus, HUD elements, and interface graphics."
        },
        {
            icon: "🎬",
            name: "Animations",
            description: "Character, creature, and object animations."
        }
    ],

    publishingChannels: [
        {
            name: "Apple App Store",
            description: "iPhone and iPad publishing path.",
            status: "Planned"
        },
        {
            name: "Google Play",
            description: "Android phone and tablet publishing path.",
            status: "Planned"
        },
        {
            name: "Steam",
            description: "PC publishing and distribution path.",
            status: "Planned"
        }
    ],

    publishingPipeline: [
        {
            icon: "✅",
            name: "Prepare",
            description: "Confirm game build, store assets, screenshots, descriptions, and requirements."
        },
        {
            icon: "📦",
            name: "Package",
            description: "Create the correct release build for the target platform."
        },
        {
            icon: "🧪",
            name: "Review",
            description: "Test release candidates before submitting to any platform."
        },
        {
            icon: "🚀",
            name: "Submit",
            description: "Upload the release package to the correct store or distribution channel."
        },
        {
            icon: "📣",
            name: "Launch",
            description: "Coordinate launch timing, marketing, announcements, and release notes."
        },
        {
            icon: "📊",
            name: "Track",
            description: "Monitor downloads, feedback, ratings, issues, and revenue after release."
        }
    ],

    marketingChannels: [
        {
            name: "Game Store Assets",
            description: "Screenshots, icons, descriptions, capsule art, and feature graphics.",
            status: "Planned"
        },
        {
            name: "Trailers & Video",
            description: "Gameplay trailers, teaser videos, development updates, and launch videos.",
            status: "Planned"
        },
        {
            name: "Community Updates",
            description: "Player-facing updates, development news, and release announcements.",
            status: "Planned"
        }
    ],

    marketingPipeline: [
        {
            icon: "🧠",
            name: "Message",
            description: "Define what the game is, who it is for, and why players should care."
        },
        {
            icon: "📸",
            name: "Capture",
            description: "Create screenshots, clips, gameplay footage, and visual materials."
        },
        {
            icon: "🎬",
            name: "Produce",
            description: "Build trailers, store graphics, announcements, and release content."
        },
        {
            icon: "📢",
            name: "Publish",
            description: "Post updates, store materials, community announcements, and launch messages."
        },
        {
            icon: "👥",
            name: "Engage",
            description: "Respond to feedback, track interest, and build trust with players."
        },
        {
            icon: "📈",
            name: "Measure",
            description: "Review traffic, wishlists, downloads, engagement, reviews, and conversion."
        }
    ]
};

console.log("Studio data loaded:", studioData);