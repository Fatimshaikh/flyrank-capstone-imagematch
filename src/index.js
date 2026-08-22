import 'dotenv/config';
import express from 'express';
import { pool } from './db/pool.js';
import imagesRouter from './routes/images.js';
import reviewsRouter from './routes/reviews.js';

const app = express();
app.use(express.json());
app.use('/', imagesRouter);
app.use('/', reviewsRouter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
