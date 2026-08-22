# AI Image Understanding & Content Matching Engine

An AI system that looks at a library of images, understands what's actually in each one, and matches the right image to the right blog post — with a **mismatch guard** that refuses bad matches instead of guessing.

> A blog post about red foxes gets the red-fox photo. A wolf photo never sneaks in, even though it looks similar. If nothing fits, the system says so — honestly, with a reason.

## What it does

1. **Ingests images** through a vision AI (Gemini), producing structured tags: subject, species, attributes, caption, confidence.
2. **Embeds** both image captions and blog post text into a shared semantic space.
3. **Ranks** candidate images for each post by cosine similarity.
4. **Guards** every top candidate through three checks — species match, classification confidence, similarity threshold — before it's ever shown as a suggestion.
5. **Lets a human review** every suggestion: approve, reject, and see why the system decided what it decided.

## Architecture
Images ─(batch job)─► Gemini Vision ─► {species, tags, caption, confidence} ─► images table
└─► embed(caption) ──────────────────► images.embedding

Posts ────────────────────► embed(post text) ────────────────────► posts.embedding

GET /posts/:id/images
└─► rank by cosine similarity (images.embedding × post.embedding)
└─► Mismatch Guard: species check → confidence check → similarity check
├─► APPROVED: best match returned, with reason
└─► REJECTED (all candidates): "no confident match" + reasons
└─► logged to suggestions table
└─► Review API: POST /suggestions/:id/review (approve/reject) → reviews table


## Why the guard checks in this order

Species mismatch is checked **first**, before similarity — a wrong-species image (e.g. a wolf on a fox post) must never slip through just because it happened to score reasonably on semantic similarity. Confidence is checked next (don't trust a tag the AI itself wasn't sure about), and similarity last, as the final numeric bar. This ordering was a real bug we found and fixed — see BUILDLOG.md, Challenge 6.

## Result: Top-1 precision

**6/6 = 100%** on our labeled evaluation set (`eval/labeled_set.json`), including a deliberately unmatchable "gardening" post used as a negative control. See `eval/results.json` for the full report and BUILDLOG.md Challenge 7 for how the similarity threshold was tuned using real evidence, not guesswork.

## Setup (from a clean machine)

**Requirements:** Node.js 18+, Docker Desktop, a free Gemini API key ([aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).

```bash
git clone https://github.com/Fatimshaikh/flyrank-capstone-imagematch.git
cd flyrank-capstone-imagematch
npm install
cp .env.example .env
# edit .env and paste your real GEMINI_API_KEY

docker compose up -d
docker exec -i flyrank-capstone-imagematch-db-1 psql -U postgres -d imagematch < src/db/migrations/001_init.sql
docker exec -i flyrank-capstone-imagematch-db-1 psql -U postgres -d imagematch < src/db/migrations/002_add_species.sql

npm start
```

In a second terminal, seed demo data:
```bash
node src/jobs/classifyImages.js
node src/db/seedPosts.js
node src/jobs/normalizeSpecies.js
```

Run tests: `npm test`
Run the eval: `node eval/runEval.js`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Server + DB connectivity check |
| GET | `/posts/:id/images` | Ranked image suggestions for a post |
| GET | `/posts/:id/check/:filename` | Force-check one image against one post |
| GET | `/suggestions` | List all logged suggestions |
| POST | `/suggestions/:id/review` | Approve/reject a suggestion |
| GET | `/suggestions/:id/reviews` | Review trail for a suggestion |

## Limitations (honest notes)

- **Eval set is small (6 posts).** 100% precision reflects a well-tuned system for this labeled set, not a statistical guarantee at scale. Growing the eval set is the natural next step.
- **`species` is derived via keyword matching** on the AI's free-text `subject` field, not a constrained classification — see BUILDLOG.md Challenge 5. One image (`wolf_02.jpg`) was genuinely classified as "dog" by Gemini itself, a real vision-model limitation, not a bug in our code.
- **Similarity threshold (0.58) is corpus-specific.** It was tuned against this exact 50-image, 6-post dataset; a larger or different corpus would likely need retuning.
- **Free-tier AI models change quickly.** We hit three different model deprecations/rate limits while building this (BUILDLOG.md Challenge 4) — the model name in `src/services/geminiClient.js` may need updating again in the future.

## Stack

Node.js + Express · PostgreSQL (Docker) · Gemini 3.5 Flash Lite (vision) + Gemini Embedding (semantic search) · Zod (validation) · Vitest (testing)

## Full build log

See `BUILDLOG.md` for every bug encountered, why it happened, and how it was fixed — 7 documented challenges from project setup through threshold tuning.
