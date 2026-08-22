import { pool } from '../db/pool.js';

// Gemini Flash free tier rates (approx, per 1K units) — used only for visibility/logging,
// not real billing, since we stay inside the free tier.
const RATES = {
  'gemini-2.5-flash': 0.0, // free tier
  'gemini-embedding-001': 0.0, // free tier
};

export async function logCost(callType, model) {
  const cost = RATES[model] ?? 0;
  await pool.query(
    `INSERT INTO cost_log (call_type, model, cost_usd) VALUES ($1, $2, $3)`,
    [callType, model, cost]
  );
}
