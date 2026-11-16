# Wadi Studio: design brief

How the site looks, why it looks that way, and how to keep working on it without drifting. Read this
before changing anything. It is the memory of the decisions made so far (as of v69, 16 Nov 2026).
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
- Uniformity. Until v68 this meant every tab followed one pattern (a serif list with a "+" that opens in place). Since v69
  the uniformity is in the materials (type, dashes, spacing, calm), and **each tab has the shape its job needs**; see
  "Tabs by job" below. The owner agreed to this change.
- One change at a time, previewed on the phone before going live.

**Dislikes (tried and removed)**
- Pills, containers and boxes around things (the menu's pill was removed for this reason).
- Section lines and dividers.
- Busy or "too dynamic" effects; anything that competes with the name.
- (Revisited in v58) Text under the name in the top bar stays out; the cover now carries one quiet line saying what
  the studio does, because a first-time client needs that answer on the first screen.
- Text characters used as visuals that look like symbols rather than an image (early ribbon versions).
- Big decorative extras: the sun as a thin dashed ring, wind lines, a trickle of falling dashes as a scroll
  cue, rain, a "light path" reflection on the water, a name that builds itself from flying dashes (revisited in v68: the
  name now rises in dashes *in place* and settles; nothing flies, the letters never move).
- An outlined "Enter" pill; buttons that look like buttons where a quiet symbol would do.
- A copy button and card on the email; extra sections on Contact (it was reverted to the plain list).
- Scroll-linked resizing (felt choppy on iPhone; replaced by the cover).
- (Tested in mockups and dropped, v65) Two-tone dash landscapes (a dark ridge line over a lighter body: spotty, like a bar
  chart with caps); bird wings drawn as separate flat dashes (at phone size they stop reading as birds).

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
- Layout: one column, max 560px, 16px side gutters; the lists sit a little further in (28px from the screen edge on a
  phone, v63); nothing scrolls sideways.

## The pieces and the decisions behind them

**Cover** (`#cover` in both pages; controller in `site/app.js`)
- Shows once per browser session; skipped on links to a specific tab (`#contact`) and with reduce motion.
  `?cover=on` / `?cover=off` force it for testing.
- **Composed as one scene (v66)**, using the whole screen: the name and its line in the upper third; the range large
  near the bottom, running off both edges of a phone, with its reflection below; the sun and birds in the sky between.
  Before v66 the name, range and line sat as one small cluster in the middle with the lower 40% of the screen empty.
- The range is a fine dash landscape (`<wadi-pattern class="cover-land" cols="96" rows="26" h="60" reflect>`), enlarged
  by `--zoom` (set in `style.css`: 2 on a phone, less on short screens, 3 on tablets and laptops) and drawn sharp at that
  size. The Work shape has a flat-floored valley, so it reads as two mountains with a valley between them (the wadi).
  It keeps a soft fade down each column, which gives the mountains depth at this size; the reflection mirrors the whole
  range, flattened and fading with depth; a slow swell and ridge shimmer; a soft band of **light passing** over the peaks
  every ~9 s (kept faint on purpose). It follows the current tab's shape.
- Sky (`<wadi-sky>`): three birds at different depths (five felt busy, v65), in a band of sky just above the peaks, each wing two dashes, flapping in short bursts (quick downstroke, slower upstroke) and gliding in between; a **sun by day / moon by
  night** (follows light/dark) drawn as a fine round grid of dashes with a dash glow; faint twinkling stars at night, kept clear of the name and its line.
- Under the name, one quiet line: "Websites, tools + interactive work" (the city was dropped in v67; it stays on
  Contact). It fades in after the name.
- The language switch is on the cover too (v62), in exactly the spot the top bar's occupies, so it does not move on
  entering. Switching language from the cover opens the other language's cover. A tap on it does not enter the site.
- The name waits briefly for its font, so it never swaps typeface on screen.
- **The name's entrance (v68)**: when the cover opens, the name first appears drawn in dashes, in the range's own language.
  Columns of dashes grow up from below in a wave from where reading starts, as the mountains do; while it is in dashes a
  slow ripple runs through it and the dashes shimmer faintly; then the dashes join into lines and the lines thicken until
  they are the letters (about 2.3 s in all; the line under the name fades in as it settles). The dashes are drawn on a
  canvas and cut to the real letterforms by a copy of the name laid over it (a blend mode, see `style.css`), so the last
  dashed frame and the plain name are pixel-identical and nothing swaps or jumps. It plays once, on opening, not on
  returning to the cover; a tap, a rotation or a late font ends it at once; where the browser cannot do it the name simply
  fades up. `?name=off` shows the cover without it. Two other entrances were tried and set aside: the name going solid
  behind a passing band of light (read as a progress bar) and dashes appearing in random order (too busy).
- Entering (a tap anywhere, the dash-chevron pointer, swipe up, scroll, or a key) plays one pre-built move: the name and
  landscape glide into the top bar while the content and menu slide in, with a short crossfade at the end (the range rises
  from the bottom of the screen, shrinking and settling to the top bar's height as it arrives; the content waits until it
  has passed over).
  Tapping the name in the top bar plays it in reverse. Nothing is tied to scroll position.

**Top bar** (`.top`): fixed, holds the name (a button back to the cover, inside the `h1`) and the small
landscape (`<wadi-pattern>`, 40 x 6, drawn in full ink with slightly bolder dashes so its shape reads). Since v65 every
dash in it is the same ink and whole (its columns rest on whole rows; only the ends fade out): the old fade down each
column looked patchy at this size.

**Tab landscapes**: each tab has its own shape and the dashes spring into it on a switch, in a wave from
where reading starts: Work = sharp peaks either side of a flat-floored valley; Services = rolling dunes; About = one
broad mountain; Contact = two peaks facing each other (a conversation). The cover follows the current tab.

**Tabs by job (v69)**: one expanding list was doing five different jobs, so each tab now has its own shape.
- **Work is browsed: a stage.** One project is always showing at the top (title, line, image, text, facts, link). Under
  it, in the thumb's reach, the project names; a dash marks the one on the stage and tapping a name changes the stage in
  place (arrow keys too). Nothing opens or closes, so nothing moves, and work is visible the moment the tab opens. All
  panels share one place, so the stage is as tall as the longest text: keep descriptions to about four lines. On a
  screen at least 560px tall the tab is one fitted screen and only the names scroll; shorter, the page scrolls.
  Tried and dropped: one project per screen (bigger images, but no overview of what the studio does).
- **About is read: a page.** Small labels and always-open text, top to bottom; the story opens it in the display face.
- **Contact is for acting: the brief is open** under its title, first on the tab; the ways to reach us follow.
- **Services and Questions are looked up: lists that open in place**, as before (described next).
- Still to do if wanted: Services linking to an example in Work and to the brief with that service picked.

**Lists** (Services, Questions): serif titles with a fine "+". Since v63 the titles are a step below the studio name (about 28px on a phone,
the name is 34px), with generous room between rows: at the old size (about 34px) a list read as a wall of headlines and
the phone felt crowded. There is no small label above a list (the menu already names the tab; each section keeps its
name for screen readers). Each title shows a one-line description under it while closed (a tap on that line
opens the item too, v61); opening one dims the other titles and hides their one-liners (v64), so the open item has
less around it. "Have a project in mind? Get in touch" closes each tab (not on Contact). On a phone it rests
at the bottom of the screen just above the menu (at least 64px after the list), so a short tab still reads as one
composed screen; on wide screens it follows the list. No footer.

**Content (v59, partly placeholder)**: Work has seven projects; four are made up (Dune Coffee, Clinic Queue, Lantern
Nights, Invoice Helper) and use `<wadi-plate>` stand-in images (a tinted card with its own dash range that rises into
place). Opened projects show a body, a row of facts (Role, Built with; the year is only in the line under the title, v62) and a link. Links ("Visit the store", "Send the
brief") carry a fine dashed underline close under the words, in the muted colour: the quieter cousin of a picked choice's
underline. A line at the bottom of the tap area read as a divider and was removed (v61). Services has four services
(each with an "includes" dash list and a typical timeline), then a second list, Questions, with smaller titles and no one-liners (the
question says it; the answer opens in place, v63). About
adds numbered steps under Approach and a Principles list. Contact starts with "Start a project": choices are words in ink that
gain a dashed underline when picked (no boxes or pills; they are not grey, because grey means dimmed elsewhere, v61), a short note written on a line of dashes (no box; it starts as one line, grows as you write, and the dashes turn to ink
while you type, v62), and Send opens an email with the brief filled in. Then
Email, WhatsApp, Book a call, Instagram, and opening hours. Two end-marks only: "+" opens in place, an arrow leaves the
page (the envelope on Email was dropped, v62). The one-liners under titles are 14px in both languages (v62). Placeholder copy, numbers and handles need replacing.
**The four tab sections in both pages are generated by `tools/content.py`** (which also sorts each project's parts into
its stage panel): edit the words there and run it, or
the next run will overwrite hand edits.

**Tabs**: swipe sideways on the page to move between tabs (ignored near the screen edges, on the scratch card, previews
and the form, and for slow or vertical moves). A tab slides in from the side you travelled towards; on load it rises.

**Menu** (`<wadi-horizon>`): order Work, Services, About, Contact (Work opens first, so it is also first). No container. Labels float over a faint line of dashes (a horizon) that lifts
into a small hill under the active tab and travels on a switch. The page fades out behind the menu: solid behind the
labels, fading only in the space above them, so no text ever shows through the labels (v60).

**Services → Interactive + games**: a scratch-to-reveal card (`<wadi-scratch>`) as a campaign demo. The dashes behind
the "Scratch to reveal" hint are left out while it shows, so they never cross the words (v60).

**Contact**: the plain list (Email, Book a call, Jeddah local time). "Book a call" opens an email titled "Book a call"
until a booking link exists.

**Sharing**: favicon and home-screen icon (a valley between two peaks, in dashes), a link-preview image (`og.png`,
the cover itself, re-made in v66) with title and description for WhatsApp and social links, and a quiet 404 page.

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
- Anything that slides in sideways can push past the screen edge and make a phone shrink the whole page; the page
  is clipped sideways in `style.css` (v60). When testing, check the page width stays the screen width during a tab switch.
- Thin CSS dashes are drawn as a border, not a filled box: a border keeps one thickness wherever it lands, a box
  can look bold on one line and thin on the next (v60).
- The first item of a list has a larger scroll margin so its small label stays clear of the top bar (v60).

## What's next (summary; the doc has the full list)

- Cover, one component at a time: the birds (more natural flight; one perching on a peak), the name (a slow
  glint), the pointer (breathing with the landscape), the background (a soft gradient of light).
- Matching still images for the three projects instead of live app previews.
- Desktop pass (the site is still a phone column on a laptop).
- Time of day by real Jeddah time (later); a real "Book a call" link; trust signals.
- A fresh screenshot of The Little Theory (the current one shows its "coming soon" page).
