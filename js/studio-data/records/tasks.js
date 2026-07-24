/*
TMS-OS / Two Marshalls Studios Operating System
Work Session 087 — Operations Workspace Data Foundation
File: js/studio-data/records/tasks.js
*/

window.studioRecordTasks = [
    { id: "TASK-2026-0001", projectId: "PRJ-2026-0003", title: "Install Operations Workspace Data Foundation", description: "Install and verify the first governed data foundation for projects, tasks, assignments, and activity records.", department: "Core Architecture", workspace: "Studio Operations", status: "In Progress", priority: "Critical", owner: "Stephen Marshall", assignee: "Stephen Marshall", createdDate: "2026-07-21", startDate: "2026-07-21", dueDate: "", completedDate: "", estimatedHours: 1, actualHours: 0, progressPercent: 25, blocked: false, blockerReason: "", dependencyIds: [], milestoneId: "", summary: "WS087 foundation installation and verification." },
    { id: "TASK-2026-0002", projectId: "PRJ-2026-0003", title: "Verify StudioDB Operations Record Types", description: "Confirm that projects, tasks, assignments, and activity records load, validate, search, and export correctly.", department: "Core Architecture", workspace: "Studio Operations", status: "Planned", priority: "High", owner: "Stephen Marshall", assignee: "Stephen Marshall", createdDate: "2026-07-21", startDate: "", dueDate: "", completedDate: "", estimatedHours: 1, actualHours: 0, progressPercent: 0, blocked: false, blockerReason: "", dependencyIds: ["TASK-2026-0001"], milestoneId: "", summary: "StudioDB validation and search verification." }
];
