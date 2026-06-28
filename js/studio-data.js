const studioData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v0.7",
        copyrightYear: "2026",
        mission: "Command Center for games, systems, publishing, and studio operations."
    },

    currentWorkSession: {
        number: "015",
        title: "Studio Operating System Foundation",
        phase: "Studio OS Foundation",
        focus: "Add the first operating system layer to the Studio Headquarters dashboard.",
        status: "In Progress"
    },

    studioState: {
        activeProject: "Studio Operating System",
        currentMilestone: "Dynamic Studio Foundation",
        buildStatus: "Stable",
        currentSprint: "Foundation Sprint",
        lastCommit: "Dynamic department engine completed",
        lastPush: "Pending after Work Session 015",
        currentDepartment: "Headquarters"
    },

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
            value: 25
        }
    ],

    activityFeed: [
        {
            time: "Current",
            title: "Work Session 015 Started",
            description: "Beginning Studio Operating System Foundation."
        },
        {
            time: "Previous",
            title: "Dynamic Department Engine Completed",
            description: "All department pages now use the shared rendering architecture."
        },
        {
            time: "Previous",
            title: "Shared Data Layer Added",
            description: "Studio Portal began reading from centralized studio data."
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
            label: "Studio OS Layer",
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
    ]
};

console.log("Studio data loaded:", studioData);