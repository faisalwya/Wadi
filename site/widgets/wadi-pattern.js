/* <wadi-pattern glyph="bar|dash"></wadi-pattern>
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
   - Symbol: bar (stacked |, the default) or dash (stacked -); ?glyph=dash|bar in the URL overrides it for comparing.
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
      var g = q || this.getAttribute('glyph') || 'bar';
      this.glyph = g === 'dash' ? '-' : '|';
      this.classList.add(this.glyph === '|' ? 'g-bar' : 'g-dash');
      this.box = document.createElement('div'); this.box.className = 'grid';
      this.box.style.width = (COLS * CW) + 'px'; this.box.style.height = (ROWS * RH) + 'px';
      if (rtl) this.box.style.transform = 'scaleX(-1)';             // waves start where reading starts
      this.cells = [];
      for (var c = 0; c < COLS; c++) {
        var col = [];
        for (var r = 0; r < ROWS; r++) {
          var s = document.createElement('span');
          s.textContent = this.glyph;
          s.style.transform = 'translate(' + (c * CW).toFixed(1) + 'px,' + ((ROWS - 1 - r) * RH) + 'px)';
          this.box.append(s); col.push(s);
        }
        this.cells.push(col);
      }
      this.append(this.box);

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
        var r = self.box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * COLS;
        self.kick(rtl ? COLS - x : x, 14);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.kick(COLS / 2, 7); }, 10000);
      }
    }

    // light the cells: full below the column's height, the top one partly, so heights glide
    draw() {
      for (var c = 0; c < COLS; c++) {
        var h = Math.max(0, this.h[c]);
        for (var r = 0; r < ROWS; r++) {
          var on = Math.max(0, Math.min(1, h - r));
          var depth = 1 - 0.55 * Math.max(0, Math.min(1, (h - 1 - r) / 3));   // brightest at the top, fading down
          var o = on * depth;
          var s = this.cells[c][r], val = o.toFixed(2);
          if (s._o !== val) { s.style.opacity = val; s._o = val; }
        }
      }
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
