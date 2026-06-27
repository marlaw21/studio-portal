const studioData = {
    studio: {
        name: "Two Marshalls Studios",
        portalName: "Studio Portal",
        currentVersion: "v0.6",
        copyrightYear: "2026",
        mission: "Build games, systems, publishing workflows, and studio operations through one connected headquarters."
    },

    currentWorkSession: {
        number: "011",
        title: "Studio Data Architecture",
        phase: "Studio Data Layer",
        focus: "Create the first shared data file for the Studio Portal.",
        status: "In Progress"
    },

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
            label: "Studio Data Layer",
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