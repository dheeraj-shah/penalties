# Penalties

**Ten kicks. Your rules.** A tiny browser football game with a Qwen-powered game studio, hosted on Cloudflare Workers.

Demo: https://dheerajshah.com/penalties

## What it does

- Ten attempts by default, with left / centre / right aim.
- Original Canvas football scene, animated ball and keeper, goal/save/miss results. Power shots have a visible wind-up and fast speed trails; reduced-motion mode suppresses the trails.
- Standard, chip, finesse, low driven, power and trivela trajectories. Standard is enabled initially. Newly unlocked shots are highlighted and selected automatically.
- Scored shots finish safely inside shared goal geometry. Intentional misses are labeled wide or over the bar; saves visibly rebound forward. Geometry tests cover every shot/direction at desktop and mobile scales.
- Chat changes colors, enabled shots, day/night pitch, keeper difficulty, attempt count, power-shot speed and a streak counter.
- The chat visibly streams actual Qwen-generated settings JSON as it arrives. No dropdown and no simulated typing. Only a complete validated response is applied. Local presets show their actual applied JSON immediately, labeled separately. Known settings use validated patches; novel creative prompts can generate new canvas drawing code. The generated source is visible, not simulated.
- UI changes support dark/light/neon theme, lime/pink/blue/gold accent, sans/monospace font, rounded/square corners and left/right desktop chat position.
- Each browser tab has its own settings and request/change history in `sessionStorage`. It is not a shared multiplayer game or shared chat.
- Mobile layout stacks chat below the pitch. Reduced-motion preferences shorten the shot animation.
- If AI is not configured, the page explicitly says **Preview mode**. Suggested presets still work without an API call. Free-text chat is disabled, never simulated as AI.

This is an original arcade game, not a FIFA/EA FC simulation. Shot names are descriptive; artwork is original and contains no club/player trademarks.

## Architecture

`app.js` renders the UI and game; `game.js` owns settings validation and shot outcomes. The browser sends a bounded prompt and current settings to `/penalties/api/change`. The Worker asks Cerebras for JSON, validates every field against an allowlist, and returns a patch. The client validates again before applying it. Generated code runs only in a dedicated browser Worker inside an opaque-origin sandboxed iframe. It never runs in the main page or the server and cannot rewrite project files. It draws an overlay and may return a bounded shot outcome to customize arcade rules. The original game controls remain available.

Current game settings and the previous generated drawing body are sent as context, not full chat history. This keeps token costs and data sharing small. Follow-up requests should name the setting to change.

## Local development and tests

Requires Node 20+ and Python 3 for the SQLite concurrency check. No npm dependencies.

```sh
npm run build
npm test
python3 budget_test.py
node dev.mjs
# Open http://localhost:8787/penalties
```

The local server deliberately runs preview mode; it never reads your key. Build regenerates ignored `assets.js` from the frontend files. Run build before tests after changing frontend assets.

## Cloudflare deployment

Use your own Cloudflare account and D1 database. The live demo uses a dedicated Worker with exact `/penalties` and `/penalties/*` routes, leaving the rest of the site untouched.

1. Create a D1 database and run `schema.sql` and the `AUTH_SCHEMA` exported by `auth.js` against it.
2. Copy `wrangler.example.jsonc` to `wrangler.jsonc`, set your database ID and domain routes.
3. Run `npm run build`, `npm test`, and `python3 budget_test.py`.
4. Deploy with an authenticated Wrangler CLI, or upload `worker.js`, `game.js`, `auth.js`, `sandbox-policy.js`, and generated `assets.js` as ES modules using the Workers API. Main module is `worker.js`. Bind D1 as `DB`.
5. In **Cloudflare → Workers & Pages → your Worker → Settings → Variables and Secrets**, add `CEREBRAS_API_KEY` as a **Secret**, not a plaintext variable. Never paste the key into GitHub, a chat, source code or browser code.
6. Verify the balance, active credits and current rates in your Cerebras dashboard. Then explicitly set plaintext variable `AI_ENABLED` to `true` to activate paid requests. Set it to `false` to stop AI calls without disabling the game.
7. Configure `DEMO_PASSWORD_HASH` (PBKDF2-SHA256 verifier, see `derivePasswordHash` in auth.js) and a random `DEMO_SESSION_SECRET` as Worker secrets. Never put the shared password in source, frontend, logs or a plaintext variable. Login is required for pages, assets and APIs.
8. Confirm `/penalties/api/status` reports `ready:true`, then make one short test request from the page. A status of ready only confirms configuration, not that the upstream account/key works.

The deployment template intentionally defaults to `AI_ENABLED=false` and no Cerebras key. Adding a key does not enable calls on its own. The owner enabled the live demo after configuring its secret.

Keep secrets on deployment updates. For REST uploads preserve secret bindings with `keep_bindings: ["secret_text"]`, or use the current deployment workflow that retains them. Do not replace unrelated Worker bindings or routes.

## Usage safeguards

One atomic D1 `INSERT ... SELECT ... WHERE ... RETURNING` reserves a request **before** calling Cerebras. Limits:

- 10 calls per rolling minute globally. No daily or lifetime AI-call quota.
- Prompt at most 400 characters; inbound body at most 18,000 bytes, including prior generated code.
- Output at most 512 tokens; reasoning disabled.
- One upstream call, no automatic retries. Failed calls retain their reservation because billing/transport outcomes can be uncertain.

A daily HMAC of the IP is stored, not the raw address. D1 stores request IDs, timestamps and hashed quota identifiers, **not prompts or chat history**. The request table is not lifetime-capped. App logs do not contain prompts or keys.

This is a **request/token ceiling**, not a verified account-wide dollar cap. Other uses of the same Cerebras account/key, billing policies and provider prices are outside this app. Analytics may lag. The live endpoint requires the shared demo password. A weak/shared password is not strong protection or individual identity; anyone with access may consume credits. Origin checks alone are not authentication. Do not increase limits without reviewing costs. The game remains playable when AI is exhausted or offline.

## Verified provider contract

On 12 November 2026, official Cerebras documentation lists `qwen-3.8-27b`, `reasoning_effort: "none"`, JSON output, and `/v1/chat/completions`. The model page lists $0.99/M input and $1.49/M output tokens. Confirm current account rates before enabling calls.

- https://inference-docs.cerebras.ai/models/qwen-3.8-27b.md
- https://inference-docs.cerebras.ai/api-reference/chat-completions

Initial deployment used preview mode until the owner configured the secret. A subsequent live Cerebras request verified a ball-color patch. Offline tests additionally cover streaming, interrupted responses and validation; these are not live account balance checks.

The `playerCharacter` setting supports `human` or `dinosaur`. The original canvas dinosaur shares the same kick/wind-up timing and does not alter scoring or difficulty. Request “Replace the penalty taker with a dinosaur” or “Bring back the human player”.

Scenery can use `backdrop`: stadium, mountains, london (stylized skyline), space; and `crowd`: true/false. These are real bounded canvas options, not arbitrary generated graphics or code.

## Browser code isolation and limitations

Novel prompts produce original Canvas JavaScript, not prebuilt scene blocks. The isolated renderer has no DOM, parent-page access, credentials or network. CSP blocks network/imports/eval; nested workers are disabled before code begins. Each render has a500ms independent watchdog and the worker is terminated after output. Returned state is limited to4,000 characters, fixed1000×610 bitmap dimensions, and generated source10,000 bytes. Unknown/unsupported browsers fail closed. Undo keeps up to8 in-memory revisions; reset removes generated artwork. Refresh does not persist executable code.

Browser memory is **not hard-capped**. The renderer is not a general HTML/app runtime; arbitrary DOM edits, external assets/libraries and network APIs are unavailable. Drawings refresh on changes/shots rather than continuous generated animation. Generation remains512 tokens, so complex code can truncate and be rejected. Failed generation/rendering retains the prior game.

Pages return `X-Robots-Tag: noindex, nofollow`; login/game include robots meta. This requests exclusion, not instant deletion from search results. Shared-password sessions use HttpOnly, Secure, SameSite Strict cookies and expire after8 hours. Login attempts are durably throttled separately from AI calls.
