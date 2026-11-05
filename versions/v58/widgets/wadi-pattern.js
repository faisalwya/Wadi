/* <wadi-pattern glyph="dash|bar" cols="40" rows="6"></wadi-pattern>
   A slim digital landscape under the studio name: a grid of identical symbols, like a small LED
   display. Each column is a stack that rises to the landscape's height, so the mountains appear as
   a silhouette made of uniform pieces; the top of each column is brightest and the stack fades
   downwards, and the ends fade out. It is always 220 x 24 px; cols/rows set how fine the grid is
   (the cover uses a finer one).
   - A landscape for each tab (Work: peaks, Services: rolling dunes, About: one broad mountain,
     Contact: two peaks facing each other across the valley). On a tab switch the columns rise and fall to the
     new shape in a wave from where reading starts, with a little spring; the top symbol of each
     column fades in and out so heights glide rather than jump.
   - Columns are linked to their neighbours, so a tap sends a ripple across.
   - Optional breath: ?breath=1 (or a breath attribute) gives a small ripple every ~10 s.
   - Symbol: dash (stacked -, the default) or bar (stacked |); ?glyph=dash|bar in the URL overrides it.
   - Cover: setZoom(z) draws it sharp when the page shows it zoomed in; setHero(0) makes it "alive"
     (a slow swell rolls across the mountains and the ridgeline shimmers faintly); setHero(p) with p
     rising towards 1 calms it (gone by p = 1/3). That loop pauses when hidden.
   - While alive, light passes over the range: every ~9 s a soft band travels across it (in reading
     direction, ~3.5 s), catching the ridgelines most, the slopes a little and the valley floors barely,
     and showing faintly in the reflection.
   - reflect (attribute, the cover): while alive, a faint mirrored copy of the mountains lies just below the
     ground line, flattened like a reflection on water, fading with depth, with a slow ripple running through
     it. It fades out with the calm, so it never travels into the top bar.
   Drawn on a canvas as tiny lines (not text), so it looks the same on every device and font. It only
   animates while something is moving; with "reduce motion" it changes shape instantly. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var WIDTH = 220, HEIGHT = 24;                  // always this size (px)
  var REFL = 14, SQUASH = .55;                   // the reflection's depth below the ground line (px) and flattening
  var K = 150, C = 15, LINK = 110;               // spring stiffness, damping, link to neighbours

  var LANDS = {
    work: { smooth: false, pts: [[0, .05], [.07, .16], [.12, .1], [.2, .44], [.26, .28], [.33, .62], [.4, .36], [.445, .8],
      [.5, .04], [.565, .96], [.63, .42], [.7, .6], [.78, .26], [.86, .38], [.93, .12], [1, .05]] },
    services: { smooth: true, pts: [[0, .06], [.12, .34], [.25, .12], [.38, .6], [.5, .18], [.62, .66], [.75, .16], [.88, .38], [1, .06]] },
    about: { smooth: false, pts: [[0, .04], [.16, .12], [.3, .34], [.4, .6], [.46, .74], [.5, 1], [.555, .78], [.6, .66], [.7, .38],
      [.84, .14], [1, .04]] },
    contact: { smooth: true, pts: [[0, .06], [.1, .14], [.18, .32], [.25, .58], [.31, .84], [.35, .78], [.39, .52], [.45, .2], [.5, .07],
      [.55, .2], [.61, .52], [.65, .78], [.69, .84], [.75, .58], [.82, .32], [.9, .14], [1, .06]] }   // two peaks facing each other across the valley
  };
  function heightAt(land, u) {
    var p = land.pts;
    for (var i = 1; i < p.length; i++) {
      if (u <= p[i][0]) {
        var a = p[i - 1], b = p[i], t = (u - a[0]) / (b[0] - a[0]);
        if (land.smooth) t = (1 - Math.cos(t * Math.PI)) / 2;
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return p[p.length - 1][1];
  }

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this, rtl = document.documentElement.dir === 'rtl';
      var q = new URLSearchParams(location.search).get('glyph');
      this.glyph = (q || this.getAttribute('glyph') || 'dash') === 'dash' ? '-' : '|';
      this.cols = parseInt(this.getAttribute('cols'), 10) || 40;
      this.rows = parseInt(this.getAttribute('rows'), 10) || 6;
      this.cellW = WIDTH / this.cols; this.rowH = HEIGHT / this.rows;
      this.reflect = this.hasAttribute('reflect');
      this.box = document.createElement('canvas'); this.box.className = 'grid';
      if (this.reflect) this.box.style.bottom = (2 - REFL) + 'px';   // the landscape stays put; the water hangs below
      this.rtl = rtl;
      this.ctx = this.box.getContext('2d');
      this.view = { mode: null, p: 1 };
      this.append(this.box);
      this.size(WIDTH, HEIGHT + (this.reflect ? REFL : 0));
      this.readInk();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readInk(); self.draw(); });

      var key = location.hash.slice(1);
      this.land = LANDS[key] ? key : 'work';
      this.th = this.heights(this.land);
      this.h = calm.matches ? this.th.slice() : this.th.map(function () { return 0; });
      this.v = this.th.map(function () { return 0; });
      this.next = this.th.map(function () { return null; });
      this.at = this.th.map(function () { return 0; });
      this.draw();

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) { self.arrived = true; self.arrive(); }
      }).observe(this);

      document.addEventListener('wadi:tab', function (e) { self.morph(e.detail); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * self.cols;
        self.kick(rtl ? self.cols - x : x, 14);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.kick(self.cols / 2, 7); }, 10000);
      }
    }

    // column heights in rows (0..rows) for a landscape; never quite empty, so a ground line remains
    heights(key) {
      var out = [], base = this.rows * .12;
      for (var c = 0; c < this.cols; c++) out.push(base + heightAt(LANDS[key], (c + .5) / this.cols) * (this.rows - base));
      return out;
    }

    readInk() { var cs = getComputedStyle(this); this.ink = cs.color || '#3F3D38'; this.glow = cs.getPropertyValue('--fg').trim() || this.ink; }   // glow: the strongest ink, for the passing light

    // canvas size in CSS px; it sits on the element's bottom edge, centred
    size(w, h) {
      w = Math.round(w); h = Math.round(h);
      if (this.cw === w && this.ch === h) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3) * (this.zoom || 1);   // sharp even when zoomed in
      this.cw = w; this.ch = h;
      this.box.width = Math.round(w * dpr); this.box.height = Math.round(h * dpr);
      this.box.style.width = w + 'px'; this.box.style.height = h + 'px';
      this.box.style.transform = 'translateX(-50%)' + (this.rtl ? ' scaleX(-1)' : '');   // waves start where reading starts
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // drawn sharp enough to be shown zoomed in by z (the cover)
    setZoom(z) {
      if (this.zoom === z) return;
      this.zoom = z; this.cw = 0; this.draw();
    }

    // the cover: 0 = alive, rising towards 1 = calm
    setHero(p) {
      this.view = { mode: p >= 1 ? null : 'alive', p: p };
      this.draw();
      this.alive();
    }

    aliveness() {
      var v = this.view;
      return (v.mode === 'alive' && !calm.matches) ? Math.max(0, 1 - v.p * 3) : 0;
    }

    // a gentle loop, only while alive and visible
    alive() {
      if (this.aliveRaf || this.aliveness() <= 0) return;
      var self = this;
      var tick = function (now) {
        self.aliveT = now / 1000;
        if (self.aliveness() <= 0 || document.hidden || !self.isConnected) { self.aliveRaf = 0; self.aliveT = 0; self.draw(); return; }
        if (!self.raf) self.draw();      // the physics loop draws too, when it is running
        self.aliveRaf = requestAnimationFrame(tick);
      };
      this.aliveRaf = requestAnimationFrame(tick);
    }

    // light the cells: full below the column's height, the top one partly, so heights glide
    draw() {
      var c2 = this.ctx, cols = this.cols, rows = this.rows, cellW = this.cellW, rowH = this.rowH;
      var alive = this.aliveness(), t = this.aliveT || 0, bar = this.glyph === '|';
      var w = bar ? Math.max(.8, cellW * .2) : cellW * .65, hgt = bar ? rowH * .75 : (rows <= 6 ? 1.3 : Math.max(.7, Math.min(1, rowH * .3)));   // the small landscape gets slightly bolder dashes
      var fade = cols * .14;
      this.size(WIDTH, HEIGHT + (this.reflect ? REFL : 0));
      // the passing light: a band that sweeps across in the first 3.6 s of every 9 s
      var sweep = alive ? (t % 9) / 3.6 : 2, lightX = -.15 + sweep * 1.3;
      c2.clearRect(0, 0, this.cw, this.ch); c2.fillStyle = this.ink;
      for (var c = 0; c < cols; c++) {
        var h = this.h[c], u = c / cols;
        if (alive) h += alive * rows * (.04 * Math.sin(t * .7 - u * 12.8) + .018 * Math.sin(t * 1.3 + u * 36));   // a slow swell
        h = Math.max(0, h);
        var x = (c + .5) * cellW;
        var edge = Math.min(1, (c + .5) / fade, (cols - c - .5) / fade);   // ends fade out
        edge = edge * edge * (3 - 2 * edge);
        for (var r = 0; r < rows; r++) {
          var on = Math.max(0, Math.min(1, h - r));
          if (on <= 0.01) continue;
          var depth = 1 - 0.55 * Math.max(0, Math.min(1, (h - 1 - r) / (rows * .5)));   // brightest at the top, fading down
          var top = Math.floor(h - .001);
          var shimmer = (alive && r === top) ? 1 - alive * .3 * (.5 + .5 * Math.sin(t * 2.1 + u * 92)) : 1;   // the ridgeline glints
          var light = sweep <= 1 ? alive * Math.exp(-Math.pow((u - lightX) / .09, 2)) : 0;            // the passing light
          var catchLight = r === top ? 1 : r === top - 1 ? .55 : .18;                                // ridges catch it most
          c2.globalAlpha = on * depth * edge * shimmer;
          c2.fillRect(x - w / 2, HEIGHT - (r + .5) * rowH - hgt / 2, w, hgt);
          if (light * catchLight > .02) {                                                          // lit: redrawn in the strongest ink
            c2.fillStyle = this.glow; c2.globalAlpha = on * edge * light * catchLight * .65;   // kept soft
            c2.fillRect(x - w / 2, HEIGHT - (r + .5) * rowH - hgt / 2, w, hgt);
            c2.fillStyle = this.ink;
          }
          // its reflection on the water: mirrored, flattened, fainter with depth, rippling
          if (this.reflect && alive) {
            var below = (r + .5) * rowH * SQUASH, ripple = Math.sin(t * 1.5 + r * 1.1 + u * 9) * .9;
            c2.globalAlpha = on * edge * alive * .2 * (1 - r / rows) * (.8 + .2 * Math.sin(t * 2.3 + c * .7 + r)) * (1 + light * 1.4);   // the light shows in the water too
            c2.fillRect(x - w / 2 + ripple, HEIGHT + 1.5 + below - hgt / 2, w, hgt * .9);
          }
        }
      }
      c2.globalAlpha = 1;
    }

    arrive() {
      if (calm.matches) { this.settled = true; return; }
      var self = this, stagger = 880 / this.cols;
      setTimeout(function () {
        var now = performance.now();
        for (var c = 0; c < self.cols; c++) { self.next[c] = self.th[c]; self.th[c] = 0; self.at[c] = now + c * stagger; }
        self.run();
        setTimeout(function () { self.settled = true; }, 880 + 600);
      }, 120);
    }

    morph(key) {
      if (!LANDS[key] || key === this.land) return;
      this.land = key;
      var hs = this.heights(key), now = performance.now(), stagger = 560 / this.cols;
      if (calm.matches) { this.h = hs.slice(); this.th = hs.slice(); this.draw(); return; }
      for (var c = 0; c < this.cols; c++) { this.next[c] = hs[c]; this.at[c] = now + c * stagger; }
      this.run();
    }

    kick(x0, amount) {
      if (calm.matches || !this.settled) return;
      var spread = this.cols / 13;
      for (var c = 0; c < this.cols; c++) { var d = (c - x0) / spread; this.v[c] += amount * (this.rows / 6) * Math.exp(-d * d); }
      this.run();
    }

    step(now, dt) {
      var busy = false, d = [], n = this.cols;
      var link = LINK * Math.pow(n / 40, 2);       // the same wave speed at any density
      for (var c = 0; c < n; c++) {
        if (this.next[c] !== null && now >= this.at[c]) { this.th[c] = this.next[c]; this.next[c] = null; }
        if (this.next[c] !== null) busy = true;
        d.push(this.h[c] - this.th[c]);
      }
      for (var j = 0; j < n; j++) {
        var l = j ? d[j - 1] : d[j], r = j < n - 1 ? d[j + 1] : d[j];
        this.v[j] += (-K * d[j] - C * this.v[j] + link * (l + r - 2 * d[j])) * dt;
        this.h[j] += this.v[j] * dt;
        if (Math.abs(this.v[j]) > .01 || Math.abs(d[j]) > .01) busy = true;
      }
      return busy;
    }

    run() {
      if (this.raf) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.032, (now - last) / 1000), busy = false; last = now;
        var sub = self.cols > 40 ? 6 : 3;          // finer grids need smaller steps to stay stable
        for (var k = 0; k < sub; k++) busy = self.step(now, dt / sub) || busy;
        self.draw();
        self.raf = busy ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
