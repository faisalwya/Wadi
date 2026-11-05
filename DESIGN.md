# Wadi Studio: design brief

How the site looks, why it looks that way, and how to keep working on it without drifting. Read this
before changing anything. It is the memory of the decisions made so far (as of v59, 5 Nov 2026).
The running list of open and parked items lives in the owner's "Wadi Studio: open and parked items" doc;
the README explains how the files are organised.

## The idea in one paragraph

A calm, single-column studio site, phone first, in English and Arabic. Its one signature is a **dash
language**: everything decorative is drawn from small dashes, like code turned into landscape. "Wadi"
means valley, so the recurring image is a range of mountains around a valley, drawn in dashes. The site
opens on a full-screen **cover** (the big name over a living dash landscape), then moves into a simple,
app-like layout: a fixed top bar, a list of tabs, and a menu at the bottom.

## Taste: what the owner likes and dislikes

These came from many rounds of feedback. Treat them as rules.

**Likes**
- Subtle, refined, high fidelity. "Impressive but simple." Small details that reward a second look.
- The dash/code style everywhere, made of identical pieces you can see individually.
- Motion with a purpose, triggered by what the visitor does (a tap, a tab switch), not constant motion.
- Uniformity: every tab follows the same pattern (big serif list, a "+", opens in place).
- One change at a time, previewed on the phone before going live.

**Dislikes (tried and removed)**
- Pills, containers and boxes around things (the menu's pill was removed for this reason).
- Section lines and dividers.
- Busy or "too dynamic" effects; anything that competes with the name.
- (Revisited in v58) Text under the name in the top bar stays out; the cover now carries one quiet line saying what
  the studio does, because a first-time client needs that answer on the first screen.
- Text characters used as visuals that look like symbols rather than an image (early ribbon versions).
- Big decorative extras: the sun as a thin dashed ring, wind lines, a trickle of falling dashes as a scroll
  cue, rain, a "light path" reflection on the water, a name that builds itself from flying dashes.
- An outlined "Enter" pill; buttons that look like buttons where a quiet symbol would do.
- A copy button and card on the email; extra sections on Contact (it was reverted to the plain list).
- Scroll-linked resizing (felt choppy on iPhone; replaced by the cover).

**How the owner likes to work**
- Options with a clear recommendation, in plain language. Visual choices as side-by-side mockups.
- Short explanations of *why*, without jargon.
- Changes on a branch with a preview link; "merge" means put it live.

## Visual system

- **Colours** are CSS tokens in `site/style.css` (`--bg`, `--fg`, `--muted`, `--soft`, `--line`, `--w1..--w5`),
  redefined for dark mode. Light: warm off-white `#EFEDE8`, ink `#16181A`. The site follows the phone's
  light/dark setting.
- **Type**: Fraunces (display serif) for the name and titles; Instrument Sans for text. Arabic: El Messiri
  for headings, IBM Plex Sans Arabic for text. Arabic never uses negative letter-spacing (it breaks joined letters).
- **Dashes are drawn on canvas as tiny lines, never as text characters**, so they look the same on every
  device and font (a lesson from iPhone Safari).
- Layout: one column, max 560px, 16px side gutters; nothing scrolls sideways.

## The pieces and the decisions behind them

**Cover** (`#cover` in both pages; controller in `site/app.js`)
- Shows once per browser session; skipped on links to a specific tab (`#contact`) and with reduce motion.
  `?cover=on` / `?cover=off` force it for testing.
- Big name; a fine dash landscape (`<wadi-pattern class="cover-land" cols="72" rows="11" reflect>`) zoomed
  1.6x and drawn sharp at that zoom; a rippling reflection below; a slow swell and ridge shimmer; a soft
  band of **light passing** over the peaks every ~9 s (kept faint on purpose).
- Sky (`<wadi-sky>`): five birds at different depths, in a band just above the name, each wing two dashes, flapping in short bursts (quick downstroke, slower upstroke) and gliding in between; a **sun by day / moon by
  night** (follows light/dark) drawn as a fine round grid of dashes with a dash glow; faint twinkling stars at night.
- Under the scene, one quiet line: "Websites, tools + interactive work · Jeddah". It fades in after the name.
- The name waits briefly for its font, so it never swaps typeface on screen.
- Entering (a tap anywhere, the dash-chevron pointer, swipe up, scroll, or a key) plays one pre-built move: the name and
  landscape glide into the top bar while the content and menu slide in, with a short crossfade at the end.
  Tapping the name in the top bar plays it in reverse. Nothing is tied to scroll position.
- The scene sits at the visual centre (~51% of the screen height).

**Top bar** (`.top`): fixed, holds the name (a button back to the cover, inside the `h1`) and the small
landscape (`<wadi-pattern>`, 40 x 6, drawn in full ink with slightly bolder dashes so its shape reads).

**Tab landscapes**: each tab has its own shape and the dashes spring into it on a switch, in a wave from
where reading starts: Work = sharp peaks around a central valley; Services = rolling dunes; About = one
broad mountain; Contact = two peaks facing each other (a conversation). The cover follows the current tab.

**Lists**: big serif titles with a "+"; each shows a one-line description under it while closed; opening
one dims the others. "Have a project in mind? Get in touch" closes each tab (not on Contact). On a phone it rests
at the bottom of the screen just above the menu (at least 64px after the list), so a short tab still reads as one
composed screen; on wide screens it follows the list. No footer.

**Content (v59, partly placeholder)**: Work has seven projects; four are made up (Dune Coffee, Clinic Queue, Lantern
Nights, Invoice Helper) and use `<wadi-plate>` stand-in images (a tinted card with its own dash range that rises into
place). Opened projects show a body, a row of facts (Role, Year, Built with) and a link. Services has four services
(each with an "includes" dash list and a typical timeline), then a second list, Questions, with smaller titles. About
adds numbered steps under Approach and a Principles list. Contact starts with "Start a project": choices are words that
gain a dashed underline (no boxes or pills), a short note, and Send opens an email with the brief filled in. Then
Email, WhatsApp, Book a call, Instagram, and opening hours. Placeholder copy, numbers and handles need replacing.
**The four tab sections in both pages are generated by `tools/content.py`**: edit the words there and run it, or
the next run will overwrite hand edits.

**Tabs**: swipe sideways on the page to move between tabs (ignored near the screen edges, on the scratch card, previews
and the form, and for slow or vertical moves). A tab slides in from the side you travelled towards; on load it rises.

**Menu** (`<wadi-horizon>`): order Work, Services, About, Contact (Work opens first, so it is also first). No container. Labels float over a faint line of dashes (a horizon) that lifts
into a small hill under the active tab and travels on a switch. The page fades out behind the menu.

**Services → Interactive + games**: a scratch-to-reveal card (`<wadi-scratch>`) as a campaign demo.

**Contact**: the plain list (Email, Book a call, Jeddah local time). "Book a call" opens an email titled "Book a call"
until a booking link exists.

**Sharing**: favicon and home-screen icon (a valley between two peaks, in dashes), a link-preview image (`og.png`,
the cover itself) with title and description for WhatsApp and social links, and a quiet 404 page.

**Arabic** (`site/ar/`): same structure, right-to-left, everything mirrored (waves and birds move from the
right). Project names are transliterated into Arabic script; the owner reviewed the Arabic copy.

## Motion rules

- Animate only while something is moving; stop loops when idle, hidden or off screen.
- Respect reduce motion: no cover, instant changes.
- Prefer time-based moves triggered by the visitor over scroll-linked effects.
- Measure layout once (or on resize), never every frame; when placing things relative to an element,
  use layout offsets, not on-screen rectangles (an element may be mid-animation).

## How to work on it

1. Branch from `main` for each change (`git checkout -B <name> origin/main`).
2. Edit. Shared look/behaviour go in `style.css` / `app.js` / `widgets/`; words in each language page.
   A structural change is made in **both** `site/index.html` and `site/ar/index.html`.
3. Check with screenshots at phone size (390-402px) in light and dark, English and Arabic, plus desktop
   (1440px). Chromium with Playwright is available; Safari is not, so iPhone-specific issues need the
   owner's phone.
4. Save a copy of the site in `versions/vNN/` (next number) and commit with a `vNN: ...` message.
5. Push the branch; the owner previews at `https://<branch>--wadi-studio.netlify.app` (needs a Netlify login).
6. On "merge": fast-forward `main` to the branch and push; Netlify publishes in under a minute. Confirm the
   deploy, then update the open-items doc.

**Lessons learned**
- When deleting a block of CSS, check its neighbours (removing the rain demo once deleted the landscape's styles).
- Check things visually, not just by values.
- Hidden or zoomed canvases need care: draw at the zoom you show them, and size them once.

## What's next (summary; the doc has the full list)

- Cover, one component at a time: the birds (more natural flight; one perching on a peak), the name (a slow
  glint), the pointer (breathing with the landscape), the background (a soft gradient of light).
- Matching still images for the three projects instead of live app previews.
- Type sizes: titles are larger than the name in the top bar; settle it.
- Desktop pass (the site is still a phone column on a laptop).
- Time of day by real Jeddah time (later); a real "Book a call" link; trust signals.
- A fresh screenshot of The Little Theory (the current one shows its "coming soon" page).
