# Wadi Studio

Services site for Wadi Studio (placeholder name). Live at https://wadi-studio.netlify.app

- The site is static files with no build step, in two languages that share one look and one behaviour:
  - `site/index.html` is the English page (words only) and `site/ar/index.html` the Arabic page (words only, right-to-left).
  - `site/style.css` is the shared look and `site/app.js` the shared behaviour. Change them once and both languages update.
  - The pages have the same structure: a structural change (a new section, a new tab) is made in both.
- `versions/` keeps every earlier version. Up to v10 each is a single file (`index_v1.html` ... `index_v10.html`); from v11 each is a folder (`versions/v11/`) holding all the site's files. Save a copy there with each change so any version can be restored.
- `netlify.toml` tells Netlify to publish the `site/` folder. Every push to `main` redeploys the site once the repo is linked to the Netlify project `wadi-studio`.
- Branch deploys are on: any pushed branch gets a preview at `https://<branch>--wadi-studio.netlify.app` (requires a Netlify team login). Review there, then merge to `main` to go live.
