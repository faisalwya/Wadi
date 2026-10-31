# Wadi Studio

Services site for Wadi Studio (placeholder name). Live at https://wadi-studio.netlify.app

- `site/index.html` is the live page. It is a single static file with no build step.
- `versions/` keeps every earlier version as a numbered file (`index_v1.html`, `index_v2.html`, ...). Copy the live page there before each change so any version can be restored.
- `netlify.toml` tells Netlify to publish the `site/` folder. Every push to `main` redeploys the site once the repo is linked to the Netlify project `wadi-studio`.
- Branch deploys are on: any pushed branch gets a preview at `https://<branch>--wadi-studio.netlify.app` (requires a Netlify team login). Review there, then merge to `main` to go live.
