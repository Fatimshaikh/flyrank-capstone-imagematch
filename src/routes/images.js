import { Router } from 'express';
import { pool } from '../db/pool.js';
import { rankImagesForPost } from '../services/matching.js';
import { evaluateGuard } from '../services/mismatchGuard.js';

const router = Router();

router.get('/posts/:id/images', async (req, res) => {
  const { id } = req.params;

  const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  if (postResult.rows.length === 0) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const post = postResult.rows[0];

  const imagesResult = await pool.query('SELECT * FROM images');
  const ranked = rankImagesForPost(post.embedding, imagesResult.rows);

  const evaluated = ranked.map(img => ({
    filename: img.filename,
    species: img.species,
    subject: img.subject,
    confidence: img.confidence,
    similarity: Number(img.similarity.toFixed(4)),
    guard: evaluateGuard(post, img),
  }));

  const approved = evaluated.filter(e => e.guard.status === 'APPROVED');
  const topMatch = approved[0] || null;

  // Save the top suggestion (or rejection) for the review workflow
  const top = evaluated[0];
  await pool.query(
    `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_status, guard_reason)
     VALUES ($1, (SELECT id FROM images WHERE filename = $2), $3, $4, $5)`,
    [id, top.filename, top.similarity, topMatch ? 'APPROVED' : 'NO_MATCH', topMatch ? topMatch.guard.reason : 'No candidate passed the mismatch guard']
  );

  res.json({
    post: { id: post.id, title: post.title },
    topMatch: topMatch
      ? { filename: topMatch.filename, species: topMatch.species, similarity: topMatch.similarity, reason: topMatch.guard.reason }
      : { message: 'No confident match found.', reason: 'No candidate image passed the mismatch guard.' },
    allCandidates: evaluated.slice(0, 5),
  });
});

export default router;

router.get('/posts/:id/check/:filename', async (req, res) => {
  const { id, filename } = req.params;

  const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
  const imageResult = await pool.query('SELECT * FROM images WHERE filename = $1', [filename]);

  if (postResult.rows.length === 0 || imageResult.rows.length === 0) {
    return res.status(404).json({ error: 'Post or image not found' });
  }

  const post = postResult.rows[0];
  const image = imageResult.rows[0];
  const { rankImagesForPost } = await import('../services/matching.js');
  const [scored] = rankImagesForPost(post.embedding, [image]);
  const guard = evaluateGuard(post, scored);

  res.json({
    post: post.title,
    image: filename,
    species: image.species,
    similarity: Number(scored.similarity.toFixed(4)),
    guard,
  });
});
