import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool.js';
import { classifyImage, embedText } from '../services/geminiClient.js';
import { validateImageTag } from '../schemas/imageTag.schema.js';
import { logCost } from '../utils/costTracker.js';

const IMAGE_DIR = 'data/images';
const CONFIDENCE_THRESHOLD = 0.7;
const MAX_RETRIES = 2;

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function classifyWithRetry(base64, mimeType, filename) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await classifyImage(base64, mimeType);
      await logCost('vision', 'gemini-2.5-flash');
      const parsed = extractJson(raw);
      const validation = validateImageTag(parsed);
      if (validation.valid) {
        return validation.data;
      }
      lastError = validation.errors;
      console.warn(`[${filename}] Attempt ${attempt}: schema invalid`, validation.errors);
    } catch (err) {
      lastError = err.message || JSON.stringify(err);
      console.warn(`[${filename}] Attempt ${attempt}:`, err);
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} attempts: ${JSON.stringify(lastError)}`);
}

async function run() {
  const files = fs.readdirSync(IMAGE_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`Found ${files.length} images to classify.`);

  for (const filename of files) {
    await new Promise(r => setTimeout(r, 4000));
    const filePath = path.join(IMAGE_DIR, filename);
    const base64 = fs.readFileSync(filePath).toString('base64');

    try {
      const tag = await classifyWithRetry(base64, 'image/jpeg', filename);
      const needsReview = tag.confidence < CONFIDENCE_THRESHOLD;

      const embedding = await embedText(tag.caption);
      await logCost('embedding', 'gemini-embedding-001');

      await pool.query(
        `INSERT INTO images (filename, subject, category, attributes, caption, confidence, needs_review, embedding)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (filename) DO UPDATE SET
           subject=$2, category=$3, attributes=$4, caption=$5, confidence=$6, needs_review=$7, embedding=$8`,
        [filename, tag.subject, tag.category, tag.attributes, tag.caption, tag.confidence, needsReview, embedding]
      );

      console.log(`✔ ${filename} → ${tag.subject} (confidence ${tag.confidence})${needsReview ? ' [FLAGGED for review]' : ''}`);
    } catch (err) {
      console.error(`✘ ${filename} FAILED: ${err.message}`);
    }
  }

  console.log('Batch classification complete.');
  await pool.end();
}

run();
