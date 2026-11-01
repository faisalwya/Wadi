/* <wadi-pattern></wadi-pattern>
   A slim landscape under the studio name, built from individual symbols:
   / going up, \ going down, - on flatter ground, ^ on peak tips and _ on the valley floor.
   - Pieces are spaced evenly along the line itself (not across the width), so slopes and ridges
     have the same rhythm, and each piece is tilted a little to follow the slope.
   - Spring physics: each piece has momentum and settles crisply; pieces are linked to their
     neighbours, so a tap or a change travels along the range like a wave.
   - A landscape for each tab (Work: peaks, Services: rolling dunes, About: one broad mountain,
     Contact: a calm horizon with an open valley). Switching tabs flows the pieces into the new
     shape in a wave from where reading starts.
   - Flip-book symbols: while a piece moves fast it cycles - / | \, then settles into the symbol
     that fits its slope.
   - Optional breath: ?breath=1 (or a breath attribute) gives a small ripple every ~10 s.
   It only animates while something is moving; with "reduce motion" it changes shape instantly. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 220, H = 26, BASE = 22, TOP = 17;   // size (px), ground level, tallest peak
  var N = 46;                                 // number of pieces
  var SLASH = 62;                             // angle a / is drawn at in a monospace font (degrees)
  var FLIPS = ['-', '/', '|', '\\'];
  var K = 170, C = 17, LINK = 160;            // spring stiffness, damping, link to neighbours

  // Landscapes: [x 0..1, height 0..1]; smooth = rounded (dunes) rather than angular (mountains)
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

  // N points spaced evenly along the landscape's line
  function sample(land) {
    var dense = [], len = [0], steps = 400;
    for (var i = 0; i <= steps; i++) {
      var u = i / steps;
      dense.push([u * W, BASE - heightAt(land, u) * TOP]);
      if (i) len.push(len[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    }
    var total = len[steps], out = [], j = 0;
    for (var k = 0; k < N; k++) {
      var target = total * k / (N - 1);
      while (j < steps - 1 && len[j + 1] < target) j++;
      var t = (target - len[j]) / ((len[j + 1] - len[j]) || 1);
      out.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * t, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * t]);
    }
    return out;
  }
  var SAMPLES = {};
  Object.keys(LANDS).forEach(function (k) { SAMPLES[k] = sample(LANDS[k]); });

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this, rtl = document.documentElement.dir === 'rtl';
      this.box = document.createElement('div'); this.box.className = 'range';
      this.box.style.width = W + 'px'; this.box.style.height = H + 'px';
      if (rtl) this.box.style.transform = 'scaleX(-1)';            // waves start where reading starts
      this.x = []; this.y = []; this.vx = []; this.vy = []; this.tx = []; this.ty = [];
      this.next = []; this.at = []; this.phase = []; this.pieces = [];
      for (var i = 0; i < N; i++) {
        var s = document.createElement('span'); this.box.append(s); this.pieces.push(s);
        this.vx.push(0); this.vy.push(0); this.at.push(0); this.phase.push(0); this.next.push(null);
      }
      this.append(this.box);

      var key = location.hash.slice(1);
      this.land = LANDS[key] ? key : 'work';
      SAMPLES[this.land].forEach(function (p, i) { self.x[i] = self.tx[i] = p[0]; self.y[i] = self.ty[i] = p[1]; });
      this.appearT = calm.matches ? null : Infinity;              // hidden until it arrives
      this.draw(0);

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) { self.arrived = true; self.arrive(); }
      }).observe(this);

      document.addEventListener('wadi:tab', function (e) { self.morph(e.detail); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
        self.kick(rtl ? W - x : x, 90);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.kick(W / 2, 40); }, 10000);
      }
    }

    kick(x0, amount) {
      if (calm.matches || !this.settled) return;
      for (var i = 0; i < N; i++) { var d = (this.x[i] - x0) / 16; this.vy[i] -= amount * Math.exp(-d * d); }
      this.run();
    }

    // pieces fade in one after another from where reading starts
    appear(i) {
      if (this.appearT === null) return 1;
      return Math.max(0, Math.min(1, (performance.now() - this.appearT - i * 18) / 320));
    }

    arrive() {
      var self = this;
      if (calm.matches) { this.appearT = null; this.settled = true; this.draw(0); return; }
      setTimeout(function () {
        self.appearT = performance.now();
        for (var i = 0; i < N; i++) {          // start a little above and drop in, in turn
          self.next[i] = [self.tx[i], self.ty[i]];
          self.y[i] = self.ty[i] - 8; self.ty[i] -= 8;
          self.at[i] = self.appearT + i * 18;
        }
        self.run();
        setTimeout(function () { self.appearT = null; self.settled = true; }, N * 18 + 700);
      }, 120);
    }

    morph(key) {
      if (!LANDS[key] || key === this.land) return;
      this.land = key;
      var pts = SAMPLES[key], now = performance.now(), self = this;
      if (calm.matches) {
        pts.forEach(function (p, i) { self.x[i] = self.tx[i] = p[0]; self.y[i] = self.ty[i] = p[1]; });
        this.draw(0); return;
      }
      pts.forEach(function (p, i) { self.next[i] = p; self.at[i] = now + i * 10; });   // a wave from the reading start
      this.run();
    }

    step(now, dt) {
      var busy = false, d = [];
      for (var i = 0; i < N; i++) {
        if (this.next[i] && now >= this.at[i]) { this.tx[i] = this.next[i][0]; this.ty[i] = this.next[i][1]; this.next[i] = null; }
        if (this.next[i]) busy = true;
        d.push(this.y[i] - this.ty[i]);
      }
      for (var j = 0; j < N; j++) {
        var l = j ? d[j - 1] : d[j], r = j < N - 1 ? d[j + 1] : d[j];
        var ay = -K * d[j] - C * this.vy[j] + LINK * (l + r - 2 * d[j]);
        var ax = -K * (this.x[j] - this.tx[j]) - C * this.vx[j];
        this.vy[j] += ay * dt; this.y[j] += this.vy[j] * dt;
        this.vx[j] += ax * dt; this.x[j] += this.vx[j] * dt;
        if (Math.abs(this.vy[j]) + Math.abs(this.vx[j]) > .03 || Math.abs(d[j]) > .03 || Math.abs(this.x[j] - this.tx[j]) > .03) busy = true;
      }
      return busy;
    }

    draw(dt) {
      for (var i = 0; i < N; i++) {
        var x = this.x[i], y = this.y[i];
        var a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1);
        var ang = Math.atan2(-(this.y[b] - this.y[a]), (this.x[b] - this.x[a]) || 1) * 180 / Math.PI;
        var speed = Math.hypot(this.vx[i], this.vy[i]), ch, rot = 0, nudge = 0;
        var up = this.y[a] - y, down = this.y[b] - y;               // > 0 means this piece is higher than that neighbour
        if (speed > 60) { this.phase[i] += speed * dt * .08; ch = FLIPS[Math.floor(this.phase[i]) % 4]; }
        else if (up > .6 && down > .6 && BASE - y > 6) { ch = '^'; nudge = 2.6; }
        else if (up < -.5 && down < -.5 && BASE - y < 2.5) { ch = '_'; nudge = -3.6; }
        else if (Math.abs(ang) < 30) { ch = '-'; rot = -ang; }                                      // dashes tilt to match exactly
        else if (ang > 0) { ch = '/'; rot = Math.max(-34, Math.min(34, SLASH - ang)); }             // steep: slashes, tilted to line up
        else { ch = '\\'; rot = Math.max(-34, Math.min(34, -SLASH - ang)); }
        var s = this.pieces[i];
        if (s.textContent !== ch) s.textContent = ch;
        s.style.opacity = this.appear(i).toFixed(3);
        s.style.transform = 'translate(' + x.toFixed(2) + 'px,' + (y + nudge).toFixed(2) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
      }
    }

    run() {
      if (this.raf) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.032, (now - last) / 1000), busy = false; last = now;
        for (var k = 0; k < 3; k++) busy = self.step(now, dt / 3) || busy;
        self.draw(dt);
        self.raf = (busy || self.appearT !== null) ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
