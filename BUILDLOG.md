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
