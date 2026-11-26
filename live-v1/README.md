# Public browser source (Cloudflare v291)

This directory is the recovered client bundle served by [Penalties](https://dheerajshah.com/penalties), as deployed November 25, 2026. The 29 files under `browser/` match the bytes embedded in the public game bundle. HTML, CSS and standalone JavaScript are included; `ui-react.js` is the built bundle, not the original React JSX project.

This is not a standalone deployment or a replacement for the repository's original game. Live API, separately hosted media/model assets, and Cloudflare configuration are not included. The private lab and review routes, server implementation, keys, and unpublished work are intentionally out of scope.

The React bundle includes third-party code. Its embedded license notices remain intact, including React's MIT notices and React Bits BorderGlow's MIT + Commons Clause notice. Those components retain their own terms rather than inheriting the repository license.
