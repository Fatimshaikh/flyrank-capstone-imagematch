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
