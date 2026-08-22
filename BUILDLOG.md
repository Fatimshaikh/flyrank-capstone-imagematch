## Challenge 1: CRLF/LF warning on first commit
**What happened:** Git warned that files would be converted from LF to CRLF line endings on Windows.
**Why:** Windows and Linux use different line-ending characters; without a rule, Git could store files inconsistently, causing messy diffs later.
**Fix:** Added .gitattributes with '* text=auto eol=lf' to force consistent LF line endings across all environments.
**Approach used:** Standard cross-platform git config, applied once at project start so it doesn't compound later.


## Challenge 2: "API key not valid" error on first Gemini call
**What happened:** First test call to Gemini's embedContent API failed with `ApiError 400: API key not valid`.
**Why:** The .env file still had the placeholder value `your_key_here` from .env.example — it was never replaced with a real key before the first test run.
**Fix:** Generated a real key at aistudio.google.com/app/apikey and replaced the placeholder in .env using nano.
**Approach used:** Kept a disposable test script (src/utils/testGemini.js) to isolate and confirm API connectivity separately from the rest of the app, then deleted it once confirmed — avoids leaving throwaway debug code in the final repo.
**Lesson:** Always verify .env values are real before assuming code bugs — check credentials first when an external API call fails.

## Challenge 3: Image corpus too large for GitHub (154MB)
**What happened:** 50 raw Unsplash photos totaled 154MB — far above the brief's "a few MB" limit for committed datasets.
**Why:** Unsplash serves high-resolution originals (multi-MB each) by default; vision AI classification doesn't need that resolution.
**Fix:** Wrote a one-time Node script using the `sharp` library to resize every image to max 800px width at 75% JPEG quality, then deleted the script after running it once.
**Approach used:** Kept the fix as a disposable utility rather than permanent app code, since resizing is a one-time data-prep step, not something the running service needs to do repeatedly.

## Challenge 4: Model deprecation cascade + rate limits during batch classification
**What happened:** Batch job initially failed on every image with a 404 "model no longer available" error for gemini-2.5-flash. Switched to gemini-3.6-flash — that worked but hit a 20-requests/day quota wall almost immediately. Switched to gemini-2.5-flash-lite — also 404'd as deprecated. Finally landed on gemini-3.5-flash-lite, which worked, but still hit a 15-requests/minute rate limit once during the 50-image run.
**Why:** Google deprecates preview/free-tier model versions faster than documentation updates; different model tiers (flash vs flash-lite vs preview) carry very different free-tier quotas (20/day vs 1000+/day).
**Fix:** 
1. Iteratively tested model names using a disposable single-image test script instead of burning quota on full 50-image runs.
2. Queried Google's own /v1beta/models endpoint to confirm a model name was live for our key before trusting it.
3. Added a 4-second delay between each image in the batch loop to stay under per-minute rate limits.
4. Relied on the existing retry logic (already built for schema validation failures) to also absorb transient 429 rate-limit errors — it worked without needing new code, since retries + a short pause were enough to recover automatically (as seen on deer_10.jpg).
**Approach used:** Cheap, incremental testing (1 image) before expensive testing (50 images) to avoid wasting free-tier quota while debugging. Chose to trust the API's own model list over guessing/hardcoding names from memory or docs, since these change faster than documentation.
**Lesson:** For any free-tier AI integration, always verify current model availability and quotas live via the provider's own endpoints rather than trusting a model name from a tutorial — free-tier offerings change frequently.
**Interesting data point:** wolf_02.jpg was classified as "dog" by the vision model — flagged as a case to examine when building the labeled eval set in Phase 4 (either a genuinely dog-like wolf photo, or a real misclassification worth understanding).

## Challenge 5: Gemini's free-text "category" field was too inconsistent to use for the guard
**What happened:** After classifying all 50 images, querying GROUP BY category returned 16 different values (e.g. "mammal", "Animal", "wildlife photography", "horror and thriller") for only 5 real animal types — unusable for a reliable comparison in the mismatch guard.
**Why:** Gemini's category field is free text, not a constrained enum, so wording varies call to call even for the same animal type.
**Fix:** Added a new `species` column, populated by a normalization job that keyword-matches the AI's `subject` field against our 5 known categories (fox/wolf/dog/bear/deer), with a fallback to the filename prefix (our own ground-truth labels from corpus collection) if no keyword matches.
**Approach used:** Kept the AI's raw output (subject, category) untouched in its original columns for transparency/debugging, and added species as a separate derived field — never overwrite raw AI output, always derive cleaned fields alongside it.
**Interesting finding:** wolf_02.jpg's subject was genuinely classified as "dog" by Gemini itself (not a normalization bug) — a real vision-model limitation worth acknowledging honestly at demo time, showing the mismatch guard's value even against imperfect upstream classification.
