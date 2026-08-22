import 'dotenv/config';
import fs from 'fs';
import { pool } from '../src/db/pool.js';
import { rankImagesForPost } from '../src/services/matching.js';
import { evaluateGuard } from '../src/services/mismatchGuard.js';

const labeledSet = JSON.parse(fs.readFileSync('eval/labeled_set.json', 'utf-8'));

async function run() {
  let correct = 0;
  const results = [];

  for (const item of labeledSet) {
    const postResult = await pool.query('SELECT * FROM posts WHERE id = $1', [item.post_id]);
    const post = postResult.rows[0];
    const imagesResult = await pool.query('SELECT * FROM images');
    const ranked = rankImagesForPost(post.embedding, imagesResult.rows);

    const approved = ranked
      .map(img => ({ ...img, guard: evaluateGuard(post, img) }))
      .filter(img => img.guard.status === 'APPROVED');

    const top = approved[0] || null;
    const predictedSpecies = top ? top.species : null;
    const isCorrect = predictedSpecies === item.expected_species;

    if (isCorrect) correct++;

    results.push({
      post: item.post_title,
      expected: item.expected_species,
      predicted: predictedSpecies,
      predictedFile: top ? top.filename : null,
      correct: isCorrect,
    });
  }

  const precision = correct / labeledSet.length;

  console.log('\n=== Top-1 Precision Report ===\n');
  for (const r of results) {
    console.log(`${r.correct ? '✔' : '✘'} ${r.post}`);
    console.log(`   expected: ${r.expected ?? '(no match)'}  |  predicted: ${r.predicted ?? '(no match)'} ${r.predictedFile ? `(${r.predictedFile})` : ''}`);
  }
  console.log(`\nTop-1 Precision: ${correct}/${labeledSet.length} = ${(precision * 100).toFixed(1)}%\n`);

  fs.writeFileSync('eval/results.json', JSON.stringify({ precision, correct, total: labeledSet.length, results }, null, 2));
  await pool.end();
}

run();
