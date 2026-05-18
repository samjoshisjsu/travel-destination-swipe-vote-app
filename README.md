# DestinationSwipe — CMPE 285 Final exam project

> **Theme:** "Which travel destination would you visit?"  
> A mobile-first swipe-to-vote web app with 100 fictional travel destinations.

---

## Completed Core Requirements

- [x] 100 distinct fictional travel-destination voting items (stable IDs + picsum.photos images)
- [x] Mobile-first layout correct at 390 × 844 viewport
- [x] Swipe-card UI: right = yes, left = no
- [x] Yes / No buttons as fallback
- [x] Mouse drag works on desktop
- [x] Touch gestures work on mobile (`touch-action: none`)
- [x] Card tilt while dragging (CSS `rotate()`)
- [x] Green hint on right-swipe, red hint on left-swipe with opacity scaling
- [x] Smooth exit animation (300 ms CSS transition)
- [x] Backend source of truth — `GET /api/items`, `POST /api/vote`, `GET /api/results`
- [x] Dedup via SQLite `UNIQUE(session_id, item_id)` + `ON CONFLICT DO UPDATE`
- [x] Results view with sort by **Most Loved / Most Divisive / Most Votes**
- [x] End-of-deck state with "View Results" button
- [x] Anonymous session ID generated once and stored in `localStorage`

## Completed Stretch Goals

- [x] **Undo last swipe** — removes vote from DB, steps card index back
- [x] **Matches view** — destinations the user swiped Yes on with ≥ 70 % global yes-rate
- [x] **Basic analytics** — total votes, unique sessions, items voted on (shown in Results tab)

---

## Install & Run

```bash
# 1. Enter the project
cd swipe-vote-app

# 2. Install all dependencies (root + server + client)
npm run install:all

# 3. Start both server and client concurrently
npm run dev
```

- Backend  → http://localhost:4000  
- Frontend → http://localhost:5173  

Open http://localhost:5173 in a browser. For mobile fidelity, set the viewport to **390 × 844** in DevTools.

### Other useful commands

```bash
npm run seed       # manually seed the database (auto-runs on server start)
npm run reset-db   # wipe and re-seed the database

# From server/ directory
npm run dev        # nodemon dev server
npm run start      # plain node

# From client/ directory
npm run dev        # Vite dev server
npm run build      # production build
```

---

## Architecture

```
swipe-vote-app/
├── package.json          # root scripts (concurrently)
├── server/
│   ├── package.json
│   ├── data/app.db       # SQLite file (auto-created)
│   └── src/
│       ├── index.js      # Express API (port 4000)
│       ├── db.js         # better-sqlite3 setup + schema
│       ├── seed.js       # idempotent seeder (exports + CLI)
│       ├── reset.js      # delete DB + re-seed
│       └── data/items.js # 100 travel destinations
└── client/
    ├── index.html
    ├── vite.config.ts    # proxies /api → localhost:4000
    └── src/
        ├── App.tsx           # state, session, tab routing
        ├── api.ts            # fetch helpers (typed)
        ├── styles.css        # single stylesheet, mobile-first
        └── components/
            ├── SwipeCard.tsx   # drag/touch handler + animation
            ├── ResultsView.tsx # sortable leaderboard
            └── MatchesView.tsx # personal match grid
```

**Stack:** React 18 + Vite + TypeScript · Node.js + Express · SQLite (better-sqlite3) · plain CSS

---

## Persistence & Dedup

Votes are stored server-side in SQLite (`server/data/app.db`).  
The schema enforces `UNIQUE(session_id, item_id)`, so re-voting on the same card updates the existing row instead of inserting a duplicate:

```sql
INSERT INTO votes (session_id, item_id, choice)
VALUES (?, ?, ?)
ON CONFLICT(session_id, item_id)
DO UPDATE SET choice = excluded.choice, created_at = CURRENT_TIMESTAMP;
```

`sessionId` is a random string generated once in the browser and stored in `localStorage`. It identifies an anonymous user across page refreshes. The DB is the single source of truth — `localStorage` only holds the session identity.

---

## Known Issues

- `better-sqlite3` requires native compilation; node-gyp must be available (`xcode-select --install` on macOS).
- The undo operation issues a `DELETE` to the server; if the network fails the UI still steps back (optimistic update).
- picsum.photos images require an internet connection; the `onError` handler falls back to a different seed.

---

## Demo Script (YouTube)

1. **Start the app**  
   ```bash
   cd swipe-vote-app && npm run install:all && npm run dev
   ```
   Open http://localhost:5173. Open DevTools → set viewport to **390 × 844**.

2. **Swipe cards**  
   Drag a card right → shows green "YES ✓" badge → card flies out right.  
   Drag a card left → shows red "NO ✗" badge → card flies out left.  
   Show the card tilt angle increasing as you drag further.

3. **Use Yes / No buttons**  
   Tap the ✓ or ✗ circle buttons as an alternative to swiping.  
   Show that the progress counter increments each time.

4. **Undo**  
   After a vote, tap the ↩ button to undo.  
   Show the card that was just voted on reappear and the counter decrement.

5. **Results tab**  
   Tap "📊 Results". Show the leaderboard with yes-bars.  
   Tap **Most Loved** → sorted by highest yes-percent.  
   Tap **Divisive** → closest to 50/50 split rises to the top.  
   Tap **Most Votes** → highest total votes first.  
   Point out the analytics bar (total votes, sessions, items rated).

6. **Matches tab**  
   Tap "🎯 Matches". Show destinations the user said Yes to that also have ≥ 70 % global approval.

7. **Session persistence**  
   Refresh the page. The session ID in `localStorage` is the same, so the backend still knows all previous votes. Explain that `localStorage` stores only the identity key, not the votes.

8. **Backend dedup**  
   Open a second tab and vote on the same item differently. Refresh the Results tab — the count doesn't double because the DB upserts on `(session_id, item_id)`.
