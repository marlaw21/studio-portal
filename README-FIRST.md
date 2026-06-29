# README FIRST — Work Session 027

## Work Session
027 — Shared Search Engine

## Objective
Move search behavior into a reusable shared search file so TMS-OS can later support search across all departments.

## Version After Install
v0.27.0

## Files Included
- js/search.js
- js/app.js
- js/studio-data/core.js
- js/studio-data/documentation.js
- pages/documentation.html
- docs/work-sessions/WS-027.md
- docs/changelog/CHANGELOG.md
- docs/roadmap/ROADMAP.md
- VERSION.md

## Step-by-Step Installation
1. Download this ZIP.
2. Right-click the ZIP and choose Extract All.
3. Open the extracted folder.
4. Copy everything inside the extracted folder.
5. Paste it into your studio-portal project folder.
6. Choose Replace the files in the destination.
7. Confirm js/search.js exists.
8. Confirm pages/documentation.html loads ../js/search.js before ../js/app.js.

## Testing Checklist
- Open Documentation.
- Press Ctrl + Shift + R.
- Search Decision.
- Search Procedure.
- Search Unity.
- Clear the search box.
- Confirm no red Console errors.

## Git Commit Message
Work Session 027 - Shared Search Engine
