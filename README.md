# Penalties

**Ten kicks. Your rules.** A tiny browser football game with a Qwen-powered configuration panel, hosted on Cloudflare Workers.

Demo: https://dheerajshah.com/penalties

## What it does

- Ten attempts by default, with left / centre / right aim.
- Original Canvas football scene, animated ball and keeper, goal/save/miss results.
- Standard, chip, finesse, low driven, power and trivela trajectories. Standard is enabled initially.
- Chat changes colors, enabled shots, day/night pitch, keeper difficulty, attempt count, power-shot speed and a streak counter.
- Each browser tab has its own settings and request/change history in `sessionStorage`. It is not a shared multiplayer game or shared chat.
- Mobile layout stacks chat below the pitch. Reduced-motion preferences shorten the shot animation.
- If AI is not configured, the page explicitly says **Preview mode**. Suggested presets still work without an API call. Free-text chat is disabled, never simulated as AI.

This is an original arcade game, not a FIFA/EA FC simulation. Shot names are descriptive; artwork is original and contains no club/player trademarks.

## Architecture

`app.js` renders the UI and game; `game.js` owns settings validation and shot outcomes. The browser sends a bounded prompt and current settings to `/penalties/api/change`. The Worker asks Cerebras for JSON, validates every field against an allowlist, and returns a patch. The client validates again before applying it. The AI cannot execute code or rewrite files.

Only current game settings are sent as context, not the full chat history. This keeps token costs and data sharing small. Follow-up requests should name the setting to change.

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

1. Create a D1 database and run `schema.sql` against it.
2. Copy `wrangler.example.jsonc` to `wrangler.jsonc`, set your database ID and domain routes.
3. Run `npm run build`, `npm test`, and `python3 budget_test.py`.
4. Deploy with an authenticated Wrangler CLI, or upload `worker.js`, `game.js`, and generated `assets.js` as ES modules using the Workers API. Main module is `worker.js`. Bind D1 as `DB`.
5. In **Cloudflare → Workers & Pages → your Worker → Settings → Variables and Secrets**, add `CEREBRAS_API_KEY` as a **Secret**, not a plaintext variable. Never paste the key into GitHub, a chat, source code or browser code.
6. Verify the balance, active credits and current rates in your Cerebras dashboard. Then explicitly set plaintext variable `AI_ENABLED` to `true` to activate paid requests. Set it to `false` to stop AI calls without disabling the game.
7. Confirm `/penalties/api/status` reports `ready:true`, then make one short test request from the page. A status of ready only confirms configuration, not that the upstream account/key works.

The deployed first version intentionally has `AI_ENABLED=false` and no Cerebras key. Adding a key does not enable calls on its own.

Keep secrets on deployment updates. For REST uploads preserve secret bindings with `keep_bindings: ["secret_text"]`, or use the current deployment workflow that retains them. Do not replace unrelated Worker bindings or routes.

## Usage safeguards

One atomic D1 `INSERT ... SELECT ... WHERE ... RETURNING` reserves a request **before** calling Cerebras. Limits:

- 100 AI calls total for this deployment's budget table, not per day.
- 10 calls per UTC-day hashed visitor IP; people on a shared network share this limit.
- 4 calls per rolling minute globally.
- Prompt at most 400 characters; inbound body at most 4,096 bytes.
- Output at most 512 tokens; reasoning disabled.
- One upstream call, no automatic retries. Failed calls retain their reservation because billing/transport outcomes can be uncertain.

A daily HMAC of the IP is stored, not the raw address. D1 stores request IDs, timestamps and hashed quota identifiers, **not prompts or chat history**. The request table holds at most 100 rows. App logs do not contain prompts or keys.

This is a **request/token ceiling**, not a verified account-wide dollar cap. Other uses of the same Cerebras account/key, billing policies and provider prices are outside this app. Analytics may lag. Enabling a public endpoint means anyone may consume the small shared budget; Origin checks are not authentication or bot protection. Do not increase limits without reviewing costs. The game remains playable when AI is exhausted or offline.

## Verified provider contract

On 12 November 2026, official Cerebras documentation lists `qwen-3.8-27b`, `reasoning_effort: "none"`, JSON output, and `/v1/chat/completions`. The model page lists $0.99/M input and $1.49/M output tokens. Confirm current account rates before enabling calls.

- https://inference-docs.cerebras.ai/models/qwen-3.8-27b.md
- https://inference-docs.cerebras.ai/api-reference/chat-completions

No live model call was made during initial deployment because the key was not configured. Offline tests mock Cerebras responses and do not prove live API access.
