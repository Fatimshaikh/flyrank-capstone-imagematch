import 'dotenv/config';
import { pool } from '../db/pool.js';

const SPECIES_KEYWORDS = {
  fox: ['fox'],
  wolf: ['wolf', 'wolves'],
  dog: ['dog', 'puppy', 'retriever', 'beagle', 'samoyed', 'husky'],
  bear: ['bear'],
  deer: ['deer', 'stag', 'fawn', 'elk'],
};

function detectSpecies(subject, filename) {
  const text = subject.toLowerCase();
  for (const [species, keywords] of Object.entries(SPECIES_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return species;
  }
  // fallback: trust the filename prefix (our ground-truth naming from Step 34)
  const prefix = filename.split('_')[0];
  return SPECIES_KEYWORDS[prefix] ? prefix : 'unknown';
}

async function run() {
  const { rows } = await pool.query('SELECT id, filename, subject FROM images');
  for (const row of rows) {
    const species = detectSpecies(row.subject, row.filename);
    await pool.query('UPDATE images SET species = $1 WHERE id = $2', [species, row.id]);
    console.log(`${row.filename} → subject: "${row.subject}" → species: ${species}`);
  }
  console.log('Species normalization complete.');
  await pool.end();
}

run();
