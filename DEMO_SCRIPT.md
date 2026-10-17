# Demo video script (target: 2.5 to 3 minutes)

Record with Loom, OBS, or Google Meet (screen share and record). Browser zoom ~110%, close other tabs.

**0:00 Intro (15s)**
"Hi, I'm Dharshan. This is my Mini ATS for EarlyJobs. It manages candidates, hiring stages, search and dashboard metrics. It's React, Express and SQLite, deployed as a single service."

**0:15 Dashboard (30s)**
Open the Dashboard. Point to total, active, hired, and rejected counts and the hire rate. Show candidates by stage, the conversion funnel ("candidates who ever reached each stage, built from the stage history table"), positions, sources, and recent activity.

**0:45 Add a candidate (30s)**
Click **+ Add candidate**. Submit empty to show inline validation. Fill in a real-looking candidate, save, and show the toast. Try the same email again to show duplicate protection.

**1:15 Pipeline (40s)**
Go to **Pipeline**. Drag the new candidate Applied → Screening → Interview. Use the stage dropdown on a card once. "Moves are optimistic and saved through a PATCH endpoint."

**1:55 Search and filter (30s)**
Go to **Candidates**. Search "react", then filter by stage and position, set min experience, sort by experience. Clear filters.

**2:25 Candidate detail (20s)**
Open a candidate. Add a note, show the stage history timeline, change the stage, return to the Dashboard and show the numbers and activity feed updated.

**2:45 Wrap-up (15s)**
"Backend has 11 automated API tests, the code is on GitHub, and I'd extend it with auth and resume upload next. Thanks for watching."
