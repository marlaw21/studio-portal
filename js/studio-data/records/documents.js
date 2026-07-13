/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 041 — Documentation Catalog Engine
Step 1 — Permanent Document Records
File: js/studio-data/records/documents.js

Purpose:
- Registers permanent Studio Headquarters documents as a first-class StudioDB record type.
- Supplies the Documentation Catalog Engine with verified document metadata.
- Does not contain rendering code.
- Does not edit or duplicate Google Docs.
*/

window.studioRecordDocuments = [
    {
        id: "STATE-001",
        title: "Current System State",
        name: "STATE-001 — Current System State",
        department: "Studio Governance",
        category: "Current System State",
        status: "Verified",
        summary: "Records the current verified operating state and checkpoint of TMS-OS.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/STATE-001.json"
    },
    {
        id: "DOC-STATE-001",
        title: "Documentation State",
        name: "DOC-STATE-001 — Documentation State",
        department: "Studio Governance",
        category: "Documentation State",
        status: "Verified",
        summary: "Records the verified state, control rules, and remaining recovery work for permanent studio documentation.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/DOC-STATE-001.json"
    },
    {
        id: "DOC-INDEX-001",
        title: "Documentation Index",
        name: "DOC-INDEX-001 — Documentation Index",
        department: "Studio Governance",
        category: "Documentation Index",
        status: "Verified",
        summary: "Provides the permanent master index of verified human-readable studio documents.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/DOC-INDEX-001.json"
    },
    {
        id: "PROC-001",
        title: "Work Session Procedure",
        name: "PROC-001 — Work Session Procedure",
        department: "Studio Operations",
        category: "Procedures",
        status: "Verified",
        summary: "Defines the controlled process for starting, executing, verifying, documenting, and closing studio work sessions.",
        googleFolder: "02 - Studio Operations",
        sourceType: "Google Doc",
        documentDataFile: "documents/PROC-001.json"
    },
    {
        id: "PROC-002",
        title: "Bug Fix Procedure",
        name: "PROC-002 — Bug Fix Procedure",
        department: "Studio Operations",
        category: "Procedures",
        status: "Verified",
        summary: "Defines the controlled process for investigating, correcting, testing, and closing verified bugs.",
        googleFolder: "02 - Studio Operations",
        sourceType: "Google Doc",
        documentDataFile: "documents/PROC-002.json"
    },
    {
        id: "PROC-003",
        title: "Documentation Update Procedure",
        name: "PROC-003 — Documentation Update Procedure",
        department: "Studio Operations",
        category: "Procedures",
        status: "Verified",
        summary: "Defines how completed studio work becomes permanent structured and human-readable documentation.",
        googleFolder: "02 - Studio Operations",
        sourceType: "Google Doc",
        documentDataFile: "documents/PROC-003.json"
    },
    {
        id: "ENH-LOG-001",
        title: "Enhancement Ideas Log",
        name: "ENH-LOG-001 — Enhancement Ideas Log",
        department: "Knowledge Base",
        category: "Enhancement Ideas",
        status: "Verified",
        summary: "Preserves deferred enhancement ideas from the beginning of the project without interrupting approved work.",
        googleFolder: "09 - Knowledge Base",
        sourceType: "Google Doc",
        documentDataFile: "documents/ENH-LOG-001.json"
    },
    {
        id: "ROADMAP-001",
        title: "Studio Roadmap",
        name: "ROADMAP-001 — Studio Roadmap",
        department: "Studio Governance",
        category: "Roadmap",
        status: "Verified",
        summary: "Records the verified completed path, active milestone, and controlled future direction of TMS-OS.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/ROADMAP-001.json"
    },
    {
        id: "HIST-001",
        title: "Studio Historical Timeline",
        name: "HIST-001 — Studio Historical Timeline",
        department: "Studio Governance",
        category: "Historical Timeline",
        status: "Verified",
        summary: "Preserves the verified development sequence of Two Marshalls Studios and TMS-OS.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/HIST-001.json"
    },
    {
        id: "ARCH-001",
        title: "Current Studio Architecture",
        name: "ARCH-001 — Current Studio Architecture",
        department: "Core Architecture",
        category: "Architecture",
        status: "Verified",
        summary: "Defines the verified current Fully Modular StudioDB architecture and its operating layers.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/ARCH-001.json"
    },
    {
        id: "ARCH-EVO-001",
        title: "Studio Architecture Evolution",
        name: "ARCH-EVO-001 — Studio Architecture Evolution",
        department: "Core Architecture",
        category: "Architecture Evolution",
        status: "Verified",
        summary: "Preserves the verified architectural evolution from the portal-centered foundation to Fully Modular StudioDB.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/ARCH-EVO-001.json"
    },
    {
        id: "DEC-LOG-001",
        title: "Studio Decision Log",
        name: "DEC-LOG-001 — Studio Decision Log",
        department: "Studio Governance",
        category: "Decisions",
        status: "Verified",
        summary: "Preserves major verified studio decisions and their operating effects.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/DEC-LOG-001.json"
    },
    {
        id: "STD-001",
        title: "Studio Standards",
        name: "STD-001 — Studio Standards",
        department: "Studio Governance",
        category: "Standards",
        status: "Verified",
        summary: "Defines the permanent studio-wide standards governing focused, repeatable, verified work.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/STD-001.json"
    },
    {
        id: "WS-HIST-001",
        title: "Studio Work Session History",
        name: "WS-HIST-001 — Studio Work Session History",
        department: "Studio Governance",
        category: "Work Sessions",
        status: "Verified",
        summary: "Preserves the verified historical work-session sequence and major session outcomes.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/WS-HIST-001.json"
    },
    {
        id: "MILE-HIST-001",
        title: "Studio Milestone History",
        name: "MILE-HIST-001 — Studio Milestone History",
        department: "Studio Governance",
        category: "Milestones",
        status: "Verified",
        summary: "Preserves verified completed and active studio milestones without inventing missing history.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/MILE-HIST-001.json"
    },
    {
        id: "LESSON-001",
        title: "Studio Lessons Learned",
        name: "LESSON-001 — Studio Lessons Learned",
        department: "Studio Governance",
        category: "Lessons Learned",
        status: "Verified",
        summary: "Provides the permanent structure for verified lessons learned from completed studio work.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/LESSON-001.json"
    },
    {
        id: "TECH-DEBT-001",
        title: "Studio Technical Debt Register",
        name: "TECH-DEBT-001 — Studio Technical Debt Register",
        department: "Studio Governance",
        category: "Technical Debt",
        status: "Verified",
        summary: "Provides the permanent register for verified unresolved technical limitations and corrective obligations.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/TECH-DEBT-001.json"
    },
    {
        id: "BUG-HIST-001",
        title: "Studio Bug and Fix History",
        name: "BUG-HIST-001 — Studio Bug and Fix History",
        department: "Studio Governance",
        category: "Bugs and Fixes",
        status: "Verified",
        summary: "Provides the permanent history structure for verified bugs and completed fixes.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/BUG-HIST-001.json"
    },
    {
        id: "RISK-001",
        title: "Studio Risk Register",
        name: "RISK-001 — Studio Risk Register",
        department: "Studio Governance",
        category: "Risks",
        status: "Verified",
        summary: "Records verified studio risks, current controls, priorities, and next controlled actions.",
        googleFolder: "01 - Studio Governance",
        sourceType: "Google Doc",
        documentDataFile: "documents/RISK-001.json"
    }
];
