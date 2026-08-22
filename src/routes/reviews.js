import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

function isValidId(id) {
  return /^[0-9]+$/.test(id);
}

router.get('/suggestions', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.id, p.title AS post_title, i.filename, i.species,
           s.similarity_score, s.guard_status, s.guard_reason, s.created_at
    FROM suggestions s
    JOIN posts p ON p.id = s.post_id
    LEFT JOIN images i ON i.id = s.image_id
    ORDER BY s.created_at DESC
  `);
  res.json(rows);
});

router.post('/suggestions/:id/review', async (req, res) => {
  const { id } = req.params;
  const { decision, note } = req.body;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'id must be a numeric suggestion ID' });
  }
  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be "approve" or "reject"' });
  }

  const suggestion = await pool.query('SELECT * FROM suggestions WHERE id = $1', [id]);
  if (suggestion.rows.length === 0) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }

  const result = await pool.query(
    'INSERT INTO reviews (suggestion_id, decision, reviewer_note) VALUES ($1, $2, $3) RETURNING *',
    [id, decision, note || null]
  );

  res.json({ message: `Suggestion ${decision}d`, review: result.rows[0] });
});

router.get('/suggestions/:id/reviews', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'id must be a numeric suggestion ID' });
  }
  const { rows } = await pool.query('SELECT * FROM reviews WHERE suggestion_id = $1 ORDER BY created_at', [id]);
  res.json(rows);
});

export default router;
