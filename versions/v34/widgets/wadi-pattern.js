/* <wadi-pattern glyph="dash|bar"></wadi-pattern>
   A slim digital landscape under the studio name: a grid of identical symbols, like a small LED
   display. Each column is a stack that rises to the landscape's height, so the mountains appear as
   a silhouette made of uniform pieces; the top of each column is brightest and the stack fades
   downwards.
   - A landscape for each tab (Work: peaks, Services: rolling dunes, About: one broad mountain,
     Contact: a calm horizon with an open valley). On a tab switch the columns rise and fall to the
     new shape in a wave from where reading starts, with a little spring; the top symbol of each
     column fades in and out so heights glide rather than jump.
   - Columns are linked to their neighbours, so a tap sends a ripple across.
   - Optional breath: ?breath=1 (or a breath attribute) gives a small ripple every ~10 s.
   - Symbol: dash (stacked -, the default) or bar (stacked |); ?glyph=dash|bar in the URL overrides it for comparing.
   - Opening hero: the page zooms the whole element (CSS scale) for its first screen and shrinks it as you
     scroll; setZoom(z) draws the canvas at a resolution that stays sharp at that zoom, so nothing is redrawn
     or resized while scrolling. setHero(p) only tells it how far the shrink has gone (0 big, 1 compact).
     While big it is "alive": a slow swell rolls across the mountains, the ridgeline shimmers faintly and a
     few small birds (two dash strokes each) flap and glide across in reading direction. All of it fades
     out as you scroll, leaving the usual compact landscape; it pauses when off screen or hidden.
   It only animates while something is moving; with "reduce motion" it changes shape instantly. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var COLS = 40, ROWS = 6, CW = 5.5, RH = 4;    // grid and cell size (px)
  var K = 150, C = 15, LINK = 110;               // spring stiffness, damping, link to neighbours

  var LANDS = {
    work: { smooth: false, pts: [[0, .05], [.07, .16], [.12, .1], [.2, .44], [.26, .28], [.33, .62], [.4, .36], [.445, .8],
      [.5, .04], [.565, .96], [.63, .42], [.7, .6], [.78, .26], [.86, .38], [.93, .12], [1, .05]] },
    services: { smooth: true, pts: [[0, .06], [.12, .34], [.25, .12], [.38, .6], [.5, .18], [.62, .66], [.75, .16], [.88, .38], [1, .06]] },
    about: { smooth: false, pts: [[0, .04], [.16, .12], [.3, .34], [.4, .6], [.46, .74], [.5, 1], [.555, .78], [.6, .66], [.7, .38],
      [.84, .14], [1, .04]] },
    contact: { smooth: true, pts: [[0, .16], [.18, .32], [.34, .22], [.44, .08], [.5, .02], [.56, .08], [.66, .24], [.82, .34], [1, .16]] }
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
  // column heights in rows (0..ROWS) for a landscape; never quite empty, so a ground line remains
  function heights(key) {
    var out = [];
    for (var c = 0; c < COLS; c++) out.push(0.7 + heightAt(LANDS[key], (c + .5) / COLS) * (ROWS - 0.7));
    return out;
  }

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this, rtl = document.documentElement.dir === 'rtl';
      var q = new URLSearchParams(location.search).get('glyph');
      var g = q || this.getAttribute('glyph') || 'dash';
      this.glyph = g === 'dash' ? '-' : '|';
      // drawn on a canvas as tiny lines (not text), so it looks identical on every device and font
      this.box = document.createElement('canvas'); this.box.className = 'grid';
      this.rtl = rtl;
      this.ctx = this.box.getContext('2d');
      this.view = { mode: null, p: 1 };
      this.append(this.box);
      this.size(COLS * CW, ROWS * RH);
      this.readInk();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readInk(); self.draw(); });

      var key = location.hash.slice(1);
      this.land = LANDS[key] ? key : 'work';
      this.th = heights(this.land);
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
        var r = self.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * COLS;
        self.kick(rtl ? COLS - x : x, 14);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.kick(COLS / 2, 7); }, 10000);
      }
    }

    readInk() { this.ink = getComputedStyle(this).color || '#3F3D38'; }

    // canvas size in CSS px; it sits on the element's bottom edge, centred, and may overflow it
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

    // drawn sharp enough to be shown zoomed in by z (the opening hero)
    setZoom(z) {
      if (this.zoom === z) return;
      this.zoom = z; this.cw = 0; this.draw();
      if (this.sky) { this.sky.remove(); this.sky = null; this.drawSky(); }
    }

    // opening hero: p 0 = big first screen, 1 = compact
    setHero(p) {
      this.view = { mode: p >= 1 ? null : 'shrink', p: p };
      this.draw();
      this.drawSky();
      this.alive();
    }

    // how alive the big landscape is: full at the top of the page, gone a third of the way into the shrink
    aliveness() {
      var v = this.view;
      return (v.mode === 'shrink' && !calm.matches) ? Math.max(0, 1 - v.p * 3) : 0;
    }

    // keep a gentle loop running only while the big landscape is alive and visible
    alive() {
      if (this.aliveRaf || this.aliveness() <= 0) return;
      var self = this;
      if (!this.birds) {
        this.birds = [0, 1, 2].map(function (i) {
          return { x: [25, 120, 205][i], y0: [16, 25, 8][i], vx: [9, 7, 11][i], seed: i * 2.1 + .7, s: [3.5, 2.8, 3.1][i] };   // in unzoomed px
        });
      }
      var last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        self.aliveT = now / 1000;
        if (self.aliveness() <= 0 || document.hidden || self.onScreen === false) {
          self.aliveRaf = 0; self.aliveT = 0; self.draw(); self.drawSky(); return;
        }
        self.birds.forEach(function (b) {
          b.x += b.vx * dt;
          if (b.x > self.skyW + 8) { b.x = -8; b.y0 = 6 + Math.random() * 22; }
        });
        if (!self.raf) self.draw();      // the physics loop draws too, when it is running
        self.drawSky();
        self.aliveRaf = requestAnimationFrame(tick);
      };
      this.aliveRaf = requestAnimationFrame(tick);
    }

    // the open sky above the name, where the birds fly; fades out with the shrink (app.js sets --sky-bottom)
    drawSky() {
      var a = this.aliveness();
      if (!this.sky) {
        if (a <= 0) return;
        this.sky = document.createElement('canvas'); this.sky.className = 'sky';
        var z = this.zoom || 1;                                   // the element is zoomed by z, so draw at 1/z
        this.skyW = Math.min(window.innerWidth, 420) / z; this.skyH = 60 / z;
        var dpr = Math.min(window.devicePixelRatio || 1, 3) * z;
        this.sky.width = Math.round(this.skyW * dpr); this.sky.height = Math.round(this.skyH * dpr);
        this.sky.style.width = this.skyW + 'px'; this.sky.style.height = this.skyH + 'px';
        this.sky.style.transform = 'translateX(-50%)' + (this.rtl ? ' scaleX(-1)' : '');
        this.sctx = this.sky.getContext('2d'); this.sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.append(this.sky);
      }
      var c = this.sctx, t = this.aliveT || 0;
      c.clearRect(0, 0, this.skyW, this.skyH);
      this.sky.style.opacity = a.toFixed(3);
      if (a <= 0 || !this.birds) return;
      c.strokeStyle = this.ink; c.lineWidth = 1.1 / (this.zoom || 1); c.lineCap = 'round'; c.lineJoin = 'round';
      this.birds.forEach(function (b) {
        var y = b.y0 + 2 * Math.sin(t * .8 + b.seed);
        var flapping = ((t + b.seed * 3) % 4.5) < 1.4;                       // a burst of flaps, then a glide
        var wing = flapping ? .35 + .65 * Math.sin(t * 11 + b.seed) : .3;
        c.globalAlpha = .7;
        c.beginPath();
        c.moveTo(b.x - b.s, y - b.s * .55 * wing); c.lineTo(b.x, y); c.lineTo(b.x + b.s, y - b.s * .55 * wing);
        c.stroke();
      });
      c.globalAlpha = 1;
    }

    // the grid at cell scale f (width) and g (height), centred on the bottom edge of a cw x ch canvas
    layer(cw, ch, f, g, alive) {
      var c2 = this.ctx, bar = this.glyph === '|', cellW = CW * f, rowH = RH * g, t = this.aliveT || 0;
      var w = bar ? 1 : 3.6 * f, hgt = bar ? 3 * g : Math.max(1, Math.min(1.5, f * .9));
      var x0 = cw / 2 - COLS * cellW / 2, fade = COLS * .14;
      for (var c = 0; c < COLS; c++) {
        var h = this.h[c];
        if (alive) h += alive * (.22 * Math.sin(t * .7 - c * .32) + .1 * Math.sin(t * 1.3 + c * .9));   // a slow swell
        h = Math.max(0, h);
        var x = x0 + (c + .5) * cellW;
        var edge = Math.min(1, (c + .5) / fade, (COLS - c - .5) / fade);   // ends fade out
        edge = edge * edge * (3 - 2 * edge);
        for (var r = 0; r < ROWS; r++) {
          var on = Math.max(0, Math.min(1, h - r));
          if (on <= 0.01) continue;
          var depth = 1 - 0.55 * Math.max(0, Math.min(1, (h - 1 - r) / 3));   // brightest at the top, fading down
          var shimmer = (alive && r === Math.floor(h - .001)) ? 1 - alive * .3 * (.5 + .5 * Math.sin(t * 2.1 + c * 2.3)) : 1;   // the ridgeline glints
          c2.globalAlpha = on * depth * edge * shimmer;
          c2.fillRect(x - w / 2, ch - (r + .5) * rowH - hgt / 2, w, hgt);
        }
      }
    }

    // light the cells: full below the column's height, the top one partly, so heights glide
    draw() {
      var c2 = this.ctx, cw = COLS * CW, ch = ROWS * RH;
      this.size(cw, ch); c2.clearRect(0, 0, this.cw, this.ch); c2.fillStyle = this.ink;
      this.layer(cw, ch, 1, 1, this.aliveness());
      c2.globalAlpha = 1;
    }

    arrive() {
      if (calm.matches) { this.settled = true; return; }
      var self = this;
      setTimeout(function () {
        var now = performance.now();
        for (var c = 0; c < COLS; c++) { self.next[c] = self.th[c]; self.th[c] = 0; self.at[c] = now + c * 22; }
        self.run();
        setTimeout(function () { self.settled = true; }, COLS * 22 + 600);
      }, 120);
    }

    morph(key) {
      if (!LANDS[key] || key === this.land) return;
      this.land = key;
      var hs = heights(key), now = performance.now();
      if (calm.matches) { this.h = hs.slice(); this.th = hs.slice(); this.draw(); return; }
      for (var c = 0; c < COLS; c++) { this.next[c] = hs[c]; this.at[c] = now + c * 14; }
      this.run();
    }

    kick(x0, amount) {
      if (calm.matches || !this.settled) return;
      for (var c = 0; c < COLS; c++) { var d = (c - x0) / 3; this.v[c] += amount * Math.exp(-d * d); }
      this.run();
    }

    step(now, dt) {
      var busy = false, d = [];
      for (var c = 0; c < COLS; c++) {
        if (this.next[c] !== null && now >= this.at[c]) { this.th[c] = this.next[c]; this.next[c] = null; }
        if (this.next[c] !== null) busy = true;
        d.push(this.h[c] - this.th[c]);
      }
      for (var j = 0; j < COLS; j++) {
        var l = j ? d[j - 1] : d[j], r = j < COLS - 1 ? d[j + 1] : d[j];
        this.v[j] += (-K * d[j] - C * this.v[j] + LINK * (l + r - 2 * d[j])) * dt;
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
        for (var k = 0; k < 3; k++) busy = self.step(now, dt / 3) || busy;
        self.draw();
        self.raf = busy ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
