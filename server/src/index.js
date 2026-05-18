import express from 'express';
import cors from 'cors';
import { all, one, run } from './db.js';
import { seed } from './seed.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Seed on startup when DB is empty
seed();

// ── GET /api/items ───────────────────────────────────────────────────────────
app.get('/api/items', (_req, res) => {
  const items = all(
    'SELECT id, name, description, image_url AS imageUrl FROM items ORDER BY id'
  );
  res.json(items);
});

// ── POST /api/vote ───────────────────────────────────────────────────────────
app.post('/api/vote', (req, res) => {
  const { itemId, choice, sessionId } = req.body ?? {};

  if (!itemId || !choice || !sessionId) {
    return res.status(400).json({ error: 'itemId, choice, and sessionId are required.' });
  }
  if (choice !== 'yes' && choice !== 'no') {
    return res.status(400).json({ error: 'choice must be "yes" or "no".' });
  }

  const item = one('SELECT id FROM items WHERE id = ?', [itemId]);
  if (!item) {
    return res.status(404).json({ error: `Item ${itemId} not found.` });
  }

  run(
    `INSERT INTO votes (session_id, item_id, choice)
     VALUES (?, ?, ?)
     ON CONFLICT(session_id, item_id)
     DO UPDATE SET choice = excluded.choice, created_at = CURRENT_TIMESTAMP`,
    [sessionId, itemId, choice]
  );

  res.json({ success: true });
});

// ── DELETE /api/vote/:itemId  (undo) ────────────────────────────────────────
app.delete('/api/vote/:itemId', (req, res) => {
  const { sessionId } = req.query;
  const itemId = parseInt(req.params.itemId, 10);

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query param is required.' });
  }
  if (isNaN(itemId)) {
    return res.status(400).json({ error: 'itemId must be a number.' });
  }

  run(
    'DELETE FROM votes WHERE session_id = ? AND item_id = ?',
    [sessionId, itemId]
  );
  res.json({ success: true });
});

// ── GET /api/results ─────────────────────────────────────────────────────────
app.get('/api/results', (_req, res) => {
  const results = all(`
    SELECT
      i.id,
      i.name,
      i.description,
      i.image_url                                               AS imageUrl,
      COUNT(CASE WHEN v.choice = 'yes' THEN 1 END)             AS yesCount,
      COUNT(CASE WHEN v.choice = 'no'  THEN 1 END)             AS noCount,
      COUNT(v.id)                                              AS totalVotes,
      ROUND(
        100.0 * COUNT(CASE WHEN v.choice = 'yes' THEN 1 END)
          / NULLIF(COUNT(v.id), 0),
        1
      )                                                         AS yesPercent
    FROM items i
    LEFT JOIN votes v ON i.id = v.item_id
    GROUP BY i.id
    ORDER BY i.id
  `);
  res.json(results);
});

// ── GET /api/votes  (restore session on page refresh) ────────────────────────
app.get('/api/votes', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query param is required.' });
  }
  const votes = all(
    'SELECT item_id AS itemId, choice FROM votes WHERE session_id = ? ORDER BY item_id',
    [sessionId]
  );
  res.json(votes);
});

// ── GET /api/analytics ───────────────────────────────────────────────────────
app.get('/api/analytics', (_req, res) => {
  const totalVotes      = Number(one('SELECT COUNT(*)           AS c FROM votes')?.c ?? 0);
  const totalSessions   = Number(one('SELECT COUNT(DISTINCT session_id) AS c FROM votes')?.c ?? 0);
  const totalItemsVoted = Number(one('SELECT COUNT(DISTINCT item_id)    AS c FROM votes')?.c ?? 0);
  res.json({ totalVotes, totalSessions, totalItemsVoted });
});

app.listen(PORT, () => {
  console.log(`✈  DestinationSwipe API  →  http://localhost:${PORT}`);
});
