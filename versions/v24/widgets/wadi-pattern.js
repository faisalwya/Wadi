/* <wadi-pattern></wadi-pattern>
   A slim landscape under the studio name, built from individual symbols:
   / going up, \ going down, - on flatter ground, ^ on peak tips and _ on a valley floor.
   - Fine pieces with physics: each piece has momentum and a springy settle, and the pieces are
     linked to their neighbours, so a disturbance travels along the range like a real wave.
   - A different landscape for each tab (Work: dramatic peaks, Services: rolling dunes,
     About: one broad mountain, Contact: a calm horizon with an open valley). Switching tabs makes
     the pieces flow into the new shape in a wave from where reading starts.
   - A fainter range behind follows a moment later, more softly, for depth.
   - Flip-book symbols: while a piece moves fast it cycles - / | \, then settles into the symbol
     that matches its slope.
   - Tapping sends a ripple out from where you touched. Optional breath: ?breath=1 (or a breath
     attribute) gives a small ripple every ~10 s while on screen.
   It only animates while something is moving, and with "reduce motion" it changes shape instantly
   with no animation. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 220, H = 28, BASE = 23, TOP = 16;       // size (px), ground level, tallest peak
  var SLASH = 62;                                  // angle a / is drawn at in a monospace font (degrees)
  var FLIPS = ['-', '/', '|', '\\'];

  // Landscapes: [x 0..1, height 0..1]; smooth = rounded (dunes) rather than angular (mountains)
  var LANDS = {
    work: { smooth: false, pts: [[0, .04], [.04, .1], [.07, .07], [.11, .24], [.145, .17], [.2, .5], [.235, .38], [.26, .44], [.31, .16],
      [.355, .62], [.38, .52], [.415, .8], [.5, 0], [.565, .92], [.6, .7], [.625, .76], [.68, .28], [.72, .46], [.75, .36],
      [.8, .54], [.845, .2], [.885, .27], [.93, .1], [.965, .13], [1, .04]] },
    services: { smooth: true, pts: [[0, .05], [.08, .26], [.16, .12], [.26, .54], [.36, .2], [.44, .66], [.5, .18], [.57, .72],
      [.66, .26], [.75, .56], [.84, .18], [.92, .32], [1, .05]] },
    about: { smooth: false, pts: [[0, .04], [.12, .1], [.2, .2], [.27, .17], [.34, .42], [.4, .6], [.44, .56], [.5, 1],
      [.55, .82], [.58, .86], [.64, .58], [.7, .4], [.76, .26], [.82, .3], [.9, .12], [1, .04]] },
    contact: { smooth: true, pts: [[0, .14], [.12, .3], [.24, .2], [.34, .36], [.43, .12], [.5, 0], [.57, .12], [.66, .38],
      [.78, .22], [.88, .32], [1, .14]] }
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

  // one layer of pieces (the main range, or the fainter one behind)
  function Layer(host, opt) {
    this.opt = opt;
    this.n = Math.floor(W / opt.step) + 1;
    this.el = document.createElement('div'); this.el.className = opt.cls;
    this.y = []; this.v = []; this.ty = []; this.from = []; this.to = []; this.at = []; this.phase = []; this.alpha = [];
    this.pieces = [];
    for (var i = 0; i < this.n; i++) {
      var s = document.createElement('span'); this.el.append(s); this.pieces.push(s);
      this.y.push(BASE); this.v.push(0); this.ty.push(BASE); this.at.push(0); this.phase.push(0); this.alpha.push(1);
    }
    host.append(this.el);
  }
  Layer.prototype.target = function (land, i) {
    var u = (i * this.opt.step) / W, h;
    if (this.opt.back) {   // the back range: a softened, lower echo of the landscape, shifted a little
      h = (heightAt(land, Math.min(1, u + .05)) + heightAt(land, Math.max(0, u - .07)) + heightAt(land, u)) / 3;
      return BASE - 3 - h * TOP * .7;
    }
    return BASE - heightAt(land, u) * TOP;
  };
  Layer.prototype.setLand = function (land, now, delayPer, instant) {
    for (var i = 0; i < this.n; i++) {
      this.from[i] = this.ty[i]; this.to[i] = this.target(land, i);
      this.at[i] = instant ? 0 : now + this.opt.lag + i * delayPer;
      if (instant) { this.ty[i] = this.to[i]; this.y[i] = this.to[i]; this.v[i] = 0; }
    }
  };
  // advance the physics; returns true while anything is still moving
  Layer.prototype.step = function (now, dt) {
    var o = this.opt, n = this.n, busy = false, d = [];
    for (var i = 0; i < n; i++) {
      if (this.at[i] && now >= this.at[i]) { this.ty[i] = this.to[i]; this.at[i] = 0; }
      if (this.at[i]) busy = true;
      d.push(this.y[i] - this.ty[i]);
    }
    for (var j = 0; j < n; j++) {
      var l = j ? d[j - 1] : d[j], r = j < n - 1 ? d[j + 1] : d[j];
      var acc = -o.k * d[j] - o.c * this.v[j] + o.link * (l + r - 2 * d[j]);
      this.v[j] += acc * dt; this.y[j] += this.v[j] * dt;
      if (Math.abs(this.v[j]) > .02 || Math.abs(d[j]) > .02) busy = true;
    }
    return busy;
  };
  Layer.prototype.draw = function (dt, appear) {
    var o = this.opt, n = this.n;
    for (var i = 0; i < n; i++) {
      var x = i * o.step, y = this.y[i];
      var yl = this.y[Math.max(0, i - 1)], yr = this.y[Math.min(n - 1, i + 1)];
      var ang = Math.atan2(-(yr - yl), 2 * o.step) * 180 / Math.PI;
      var ch, rot = 0, nudge = 0, speed = Math.abs(this.v[i]);
      if (speed > o.flipAt) {                                   // moving fast: flip-book
        this.phase[i] += speed * dt * .09;
        ch = FLIPS[Math.floor(this.phase[i]) % 4];
      } else if (y < yl - .5 && y < yr - .5 && BASE - y > 7) { ch = '^'; nudge = o.size * .32; }
      else if (y > yl + .4 && y > yr + .4 && BASE - y < 1.5) { ch = '_'; nudge = -o.size * .45; }
      else if (Math.abs(ang) < 15) { ch = '-'; rot = -ang; }
      else if (ang > 0) { ch = '/'; rot = Math.max(-28, Math.min(28, SLASH - ang)); }
      else { ch = '\\'; rot = Math.max(-28, Math.min(28, -SLASH - ang)); }
      var s = this.pieces[i];
      if (s.textContent !== ch) s.textContent = ch;
      var a = appear ? appear(i, n) : 1;
      s.style.opacity = a.toFixed(3);
      s.style.transform = 'translate(' + x.toFixed(2) + 'px,' + (y + nudge).toFixed(2) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
    }
  };
  Layer.prototype.kick = function (x0, amount) {   // push pieces near x0 upwards
    for (var i = 0; i < this.n; i++) {
      var dist = (i * this.opt.step - x0) / 14;
      this.v[i] -= amount * Math.exp(-dist * dist);
    }
  };

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this, rtl = document.documentElement.dir === 'rtl';
      this.box = document.createElement('div'); this.box.className = 'range';
      this.box.style.width = W + 'px'; this.box.style.height = H + 'px';
      if (rtl) this.box.style.transform = 'scaleX(-1)';                // waves start where reading starts
      this.back = new Layer(this.box, { cls: 'back', back: true, step: 5.4, size: 6, k: 60, c: 9, link: 40, lag: 140, flipAt: 70 });
      this.front = new Layer(this.box, { cls: 'front', step: 4.3, size: 7.5, k: 120, c: 11, link: 260, lag: 0, flipAt: 55 });
      this.append(this.box);

      var key = location.hash.slice(1);
      this.land = LANDS[key] ? key : 'work';
      this.back.setLand(LANDS[this.land], 0, 0, true);
      this.front.setLand(LANDS[this.land], 0, 0, true);
      this.appearT = calm.matches ? null : Infinity;   // hidden until it arrives
      this.draw(0);

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) { self.arrived = true; self.arrive(); }
      }).observe(this);

      document.addEventListener('wadi:tab', function (e) { self.morph(e.detail); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
        if (rtl) x = W - x;
        self.front.kick(x, 70); self.back.kick(x, 25); self.run();
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () {
          if (self.onScreen && !document.hidden && !calm.matches) { self.front.kick(W * .5, 30); self.back.kick(W * .5, 12); self.run(); }
        }, 10000);
      }
    }

    // pieces fade in one after another from where reading starts, while dropping into place
    appear(i, n) {
      if (this.appearT === null) return 1;
      var p = (performance.now() - this.appearT - i * (900 / n)) / 380;
      return Math.max(0, Math.min(1, p));
    }

    draw(dt) {
      var self = this, ap = function (i, n) { return self.appear(i, n); };
      this.back.draw(dt, ap); this.front.draw(dt, ap);
    }

    arrive() {
      if (calm.matches) { this.appearT = null; this.draw(0); return; }
      var self = this;
      setTimeout(function () {
        self.appearT = performance.now();
        // each piece starts a little above its place and drops in, in turn
        [self.front, self.back].forEach(function (L) {
          for (var i = 0; i < L.n; i++) { L.y[i] = L.ty[i] - 9; L.v[i] = 0; L.at[i] = 0; }
          L.from = L.ty.slice(); L.to = L.ty.slice();
          L.ty = L.ty.map(function (t) { return t - 9; });
          for (var j = 0; j < L.n; j++) L.at[j] = self.appearT + L.opt.lag + j * (900 / L.n);
        });
        self.run();
        setTimeout(function () { self.appearT = null; }, 1600);
      }, 120);
    }

    morph(key) {
      if (!LANDS[key] || key === this.land) return;
      this.land = key;
      var instant = calm.matches, now = performance.now();
      this.front.setLand(LANDS[key], now, 9, instant);
      this.back.setLand(LANDS[key], now, 11, instant);
      if (instant) this.draw(0); else this.run();
    }

    run() {
      if (this.raf) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.032, (now - last) / 1000); last = now;
        var busy = false, sub = 2;
        for (var k = 0; k < sub; k++) { busy = self.front.step(now, dt / sub) | busy; busy = self.back.step(now, dt / sub) | busy; }
        self.draw(dt);
        self.raf = (busy || self.appearT !== null) ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
