# Mini ATS

A small applicant tracking system I built for the EarlyJobs internship assignment. You can add candidates, move them through hiring stages, search and filter them, and see a few numbers on a dashboard.

Live app: _add link_
Demo video: _add link_

The app is hosted on Render's free plan, so if nobody has opened it for a while, the first load can take up to a minute. Data also resets whenever it restarts, and the sample candidates come back automatically.

## What it does

- Add, edit and delete candidates. The form checks required fields and doesn't allow two candidates with the same email.
- Candidates move through Applied, Screening, Interview, Offer, Hired or Rejected. You can change the stage from the candidate's page or by dragging their card on the Pipeline board. Every move is saved, so each candidate has a history.
- Search by name, email, position or skill. You can also filter by stage, position and minimum experience, and sort the table by any column.
- Each candidate has a notes section for interview comments.
- The dashboard shows total candidates, how many are still active, hire and rejection rates, average experience, a count per stage, a simple funnel, positions, sources and recent activity.

## Tech

React with Vite on the frontend, Node and Express for the API, and SQLite for the database. I used SQLite because it needs no setup. It runs through Node's built-in `node:sqlite`, so there is nothing to compile when you install.

## Running it locally

You need Node 22.13 or newer. Check with `node -v`.

```bash
npm run install:all
npm run dev:server    # API on http://localhost:4000
npm run dev:client    # app on http://localhost:5173 (run this in a second terminal)
```

To run the production version on one port:

```bash
npm run build
npm start             # http://localhost:4000
```

Tests for the API:

```bash
npm test
```

The database file is created and filled with sample data the first time the server starts.

## API

```
GET    /api/candidates          search, filter and sort (q, stage, position, minExp, maxExp, sort, order)
GET    /api/candidates/:id      one candidate with notes and stage history
POST   /api/candidates          create
PUT    /api/candidates/:id      update
PATCH  /api/candidates/:id/stage  change stage
DELETE /api/candidates/:id      delete
POST   /api/candidates/:id/notes  add a note
DELETE /api/notes/:id           delete a note
GET    /api/dashboard           numbers for the dashboard
```

## Some choices I made

- Express also serves the built React app, so the whole thing runs as one service with one URL.
- I keep a separate stage history table. That is what the activity feed and the funnel use, so the funnel counts candidates who ever reached a stage, not just where they are today.
- Validation happens on the server, and errors show up next to the field that caused them.
- Dragging a card updates the screen straight away and then saves in the background.

## What I would add next

Logins for recruiters, resume uploads, pagination, and moving to PostgreSQL so the data survives restarts on the hosted version.

## Project layout

```
server/   index.js (routes), db.js (schema), seed.js (sample data), test.js
client/   src/App.jsx, src/api.js, src/components/
```

## Deploying

## Deploying

I used Render's free plan. Build command is `npm run build`, start command is `npm start`, and I set `NODE_VERSION=22`.

The free plan puts the app to sleep after about 15 minutes without visitors. The first request after that can take up to a minute while it starts again. The free plan also has no permanent disk, so the database is recreated with the sample candidates each time the app restarts or is redeployed. Anything added during a demo is lost after that. To keep data permanently, I would attach a Render disk and set `DB_FILE=/var/data/ats.db`, or move to a hosted database like PostgreSQL.