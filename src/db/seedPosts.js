import 'dotenv/config';
import { pool } from '../db/pool.js';
import { embedText } from '../services/geminiClient.js';
import { logCost } from '../utils/costTracker.js';

const posts = [
  { title: 'The Secret Life of Red Foxes', content: 'Red foxes, or Vulpes vulpes, are cunning nocturnal hunters found across forests and even cities. Known for their bushy tails and sharp instincts, they adapt to nearly any environment.' },
  { title: 'Understanding Wolf Pack Behavior', content: 'Gray wolves live and hunt in tightly bonded packs, using complex vocal and body language to coordinate. Their social structure is one of the most studied in the animal kingdom.' },
  { title: 'Why Dogs Became Our Best Friends', content: 'Domestic dogs descended from wolves tens of thousands of years ago. Selective breeding shaped companions ranging from tiny lapdogs to powerful working breeds.' },
  { title: 'Grizzly and Polar Bears: Giants of the Wild', content: 'Bears are among the largest land predators, with polar bears adapted to Arctic ice hunting and grizzlies dominating North American forests.' },
  { title: 'The Graceful World of Deer', content: 'Deer are herbivorous mammals known for their antlers, agility, and role as prey animals shaping entire forest ecosystems.' },
  { title: 'Building a Backyard Vegetable Garden', content: 'Growing your own vegetables at home requires good soil, consistent watering, and enough sunlight. Tomatoes, peppers, and herbs are great starter crops for beginners.' },
];

async function run() {
  for (const post of posts) {
    const embedding = await embedText(post.content);
    await logCost('embedding', 'gemini-embedding-001');
    await pool.query(
      'INSERT INTO posts (title, content, embedding) VALUES ($1, $2, $3)',
      [post.title, post.content, embedding]
    );
    console.log(`Seeded: ${post.title}`);
  }
  await pool.end();
}

run();
