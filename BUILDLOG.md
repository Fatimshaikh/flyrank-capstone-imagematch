## Challenge 1: CRLF/LF warning on first commit
**What happened:** Git warned that files would be converted from LF to CRLF line endings on Windows.
**Why:** Windows and Linux use different line-ending characters; without a rule, Git could store files inconsistently, causing messy diffs later.
**Fix:** Added .gitattributes with '* text=auto eol=lf' to force consistent LF line endings across all environments.
**Approach used:** Standard cross-platform git config, applied once at project start so it doesn't compound later.

