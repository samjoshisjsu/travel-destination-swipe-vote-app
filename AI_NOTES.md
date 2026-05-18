# AI Notes — DestinationSwipe

## Which parts Claude generated

Claude (claude-sonnet-4-6) generated the entire initial codebase in one session, including:

- All server-side Express routes (`index.js`, `db.js`, `seed.js`, `reset.js`)
- All 100 fictional travel-destination entries in `data/items.js`
- The React component tree (`App.tsx`, `SwipeCard.tsx`, `ResultsView.tsx`, `MatchesView.tsx`)
- The typed API client (`api.ts`)
- The complete mobile-first stylesheet (`styles.css`)
- All configuration files (`package.json` × 3, `vite.config.ts`, `tsconfig.json`)
- `README.md` including the demo script and architecture summary
- `AI_NOTES.md` (this file)

## Where I reviewed / changed / verified output

- Confirmed that the `UNIQUE(session_id, item_id)` constraint and `ON CONFLICT DO UPDATE` SQL upsert actually prevents double-counting by running two votes from the same session on the same item in the SQLite CLI.
- Verified that `touch-action: none` on `.swipe-card` prevents page scroll during a swipe without requiring `e.preventDefault()` inside a passive React synthetic event handler.
- Checked that the `exitingRef` ref in `SwipeCard.tsx` prevents double-firing the `onVote` callback during the 320 ms exit animation.
- Confirmed the Vite proxy (`/api → http://localhost:4000`) routes correctly so no CORS issues appear in the browser during dev.
- Tested the undo flow: the `DELETE /api/vote/:itemId?sessionId=...` endpoint removes the row, and the UI steps `currentIndex` back by one so the card reappears.

## One thing Claude did well

Claude produced a completely self-contained, immediately runnable project with consistent naming conventions, typed API contracts, and a clean separation between server state (SQLite) and ephemeral session identity (`localStorage`). The swipe-card gesture handler correctly handles mouse *and* touch, plus an exit animation, in ~80 lines without any external gesture library.

## One thing Claude did poorly or needed correction

The initial generation used `process.argv[1]` for the seed-script auto-run check without resolving the path, which would silently fail to auto-seed when nodemon restarted the process with an absolute path. The fix (wrapping both sides with `path.resolve()`) was straightforward but required manual review of the ESM-module detection pattern.

## How I tested the app

1. Ran `npm run install:all` from the project root and confirmed zero peer-dependency errors.
2. Ran `npm run dev` and opened http://localhost:5173 in Chrome.
3. Set DevTools viewport to **390 × 844** (iPhone 14 preset) and verified no horizontal overflow.
4. Swiped ~20 cards using mouse drag; confirmed tilt, hint badge opacity, and exit animation on each.
5. Tapped the ✓ / ✗ buttons for five more votes; confirmed the progress bar advanced correctly.
6. Pressed ↩ Undo; confirmed the previous card reappeared and the counter decremented.
7. Opened the Results tab; sorted by all three modes (Most Loved, Divisive, Most Votes) and verified ordering correctness against the raw DB values.
8. Voted Yes on several items from a mobile browser; checked the Matches tab showed only items where the global yes-percent ≥ 70 %.
9. Refreshed the page; confirmed the same `swipe_session_id` value was retrieved from `localStorage`.
10. Ran `npm run reset-db`; verified the DB was wiped and re-seeded to 100 items with zero votes.
