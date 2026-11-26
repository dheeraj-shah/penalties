# Penalties live release history

This is a reconstruction from Cloudflare's rollout records, not a reconstruction of historic Git commits. The prior public GitHub baseline was `7676428`. The [public browser snapshot](../live-v1/README.md) is from v291, which was serving all traffic at the time of recovery.

| UTC date | Verified public release milestones |
| --- | --- |
| Nov 21–23, 2026 | Game Studio timing and prompt bar; hybrid/scoped generation; animation and generation feedback; manual generation cap removed. |
| Nov 23, 2026 | Atmosphere and full-field snow; keeper idle sway and targeted kicker caching; classic ball; compact Studio; bounded crowd variations; generation timer and attribution rail. |
| Nov 24, 2026 | Matchday crowd and reactions; ability to draft while generating; shot trails and aim refinements; fixed-size default and custom SVG balls; adaptive high-resolution rendering; separate scenery and protected stadium layout; stationary sponsor rail; scoped stand finish for full themes. |
| Nov 25, 2026 | Mixed SVG fan silhouettes and face details; Kimi-only production; public game entry without the demo password. The final rollout restored v291 after a short v292 rollout. |

The table summarizes public game changes. It omits protected preview releases, internal configuration changes and experimental work. Exact source for every historical release was not recovered into this public branch.

For future releases, land the change in Git before deploying and record the Git commit alongside the Cloudflare version.
