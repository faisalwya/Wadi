/* <wadi-sky></wadi-sky>
   The cover's sky, drawn in the same dash language as the landscape: a sun made of a ring of short
   dashes high in the sky to one side, turning very slowly, a few sparse lines of dashes drifting
   across like wind, and five birds (two dash strokes each) at different depths, nearer ones larger and
   darker, flapping in bursts and gliding, crossing in reading direction.
   It fills its parent (the cover) and finds the horizon from the cover's landscape (.cover-land).
   The loop runs only while it is visible; colours follow light/dark. */
(function () {
  if (customElements.get('wadi-sky')) return;

  function rand(a, b) { return a + Math.random() * (b - a); }

  class WadiSky extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.rtl = document.documentElement.dir === 'rtl';
      this.canvas = document.createElement('canvas');
      this.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      var self = this;
      this.readInk();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readInk(); });
      new ResizeObserver(function () { self.resize(); }).observe(this);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) self.run(); });
    }

    disconnectedCallback() { cancelAnimationFrame(this.raf); this.raf = 0; }

    readInk() { this.ink = getComputedStyle(this).color || '#3F3D38'; }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // the horizon: the top of the cover's mountains
      var land = this.parentNode && this.parentNode.querySelector('.cover-land'), name = this.parentNode && this.parentNode.querySelector('.cover-name');
      var lr = land ? land.getBoundingClientRect() : null, nr = name ? name.getBoundingClientRect() : null;
      this.horizon = lr ? lr.top - r.top : this.H * .55;            // top of the (zoomed) mountains
      this.cx = lr ? lr.left + lr.width / 2 - r.left : this.W / 2;
      this.skyTop = Math.max(24, (nr ? nr.top - r.top : this.H * .4) - this.H * .28);
      this.skyBottom = nr ? nr.top - r.top - 18 : this.H * .45;
      if (!this.birds) this.setup();
      this.run();
    }

    setup() {
      var self = this;
      this.birds = [0, 1, 2, 3, 4].map(function (i) {
        var depth = [1, .75, .55, .9, .45][i];                     // 1 = near
        return { x: rand(0, self.W), y0: rand(self.skyTop, self.skyBottom), depth: depth, vx: 10 + 16 * depth,
                 s: 2.6 + 3.4 * depth, seed: rand(0, 10) };
      });
      this.wind = [0, 1, 2].map(function (i) {
        return { y: self.skyTop + (self.skyBottom - self.skyTop) * (.15 + i * .33), x: rand(0, self.W), v: 4 + i * 2.5, len: 70 + i * 30, seed: rand(0, 10) };
      });
    }

    run() {
      if (this.raf || !this.W) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        if (document.hidden || !self.isConnected) { self.raf = 0; return; }
        self.step(now / 1000, dt);
        self.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    step(t, dt) {
      var c = this.ctx, W = this.W, H = this.H, self = this;
      c.clearRect(0, 0, W, H);
      c.save();
      if (this.rtl) { c.translate(W, 0); c.scale(-1, 1); }       // everything moves in reading direction
      c.strokeStyle = this.ink; c.fillStyle = this.ink; c.lineCap = 'round';

      // the sun: a ring of short dashes, low behind the mountains, turning slowly
      var sx = this.cx + Math.min(120, this.W * .3), sy = this.skyTop + (this.skyBottom - this.skyTop) * .5, R = 13, n = 16, turn = t * .09;
      c.lineWidth = 1.1;
      for (var i = 0; i < n; i++) {
        var a = turn + i * Math.PI * 2 / n, a2 = a + .2;
        c.globalAlpha = .4;
        c.beginPath(); c.arc(sx, sy, R, a, a2); c.stroke();
      }

      // wind: sparse dashes drifting across
      c.lineWidth = 1;
      this.wind.forEach(function (w) {
        w.x += w.v * dt; if (w.x > W + w.len) w.x = -w.len;
        for (var k = 0; k < 6; k++) {
          var x = w.x - k * (w.len / 6), fade = Math.sin((k + .5) / 6 * Math.PI);
          var y = w.y + Math.sin(t * .5 + w.seed + k * .6) * 1.5;
          c.globalAlpha = .18 * fade;
          c.fillRect(x, y, 5, 1);
        }
      });

      // birds: flap in bursts, glide in between, nearer ones larger and darker
      this.birds.forEach(function (b) {
        b.x += b.vx * dt;
        if (b.x > W + 14) { b.x = -14; b.y0 = rand(self.skyTop, self.skyBottom); }
        var y = b.y0 + 3 * Math.sin(t * .7 + b.seed);
        var flapping = ((t + b.seed) % 4.2) < 1.3;
        var wing = flapping ? .5 + .7 * Math.sin(t * 10 + b.seed * 3) : .55;     // a clear v, flatter on the downstroke
        c.globalAlpha = .25 + .5 * b.depth; c.lineWidth = .8 + .5 * b.depth; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(b.x - b.s, y - b.s * .7 * wing); c.lineTo(b.x, y); c.lineTo(b.x + b.s, y - b.s * .7 * wing);
        c.stroke();
      });
      c.restore();
    }
  }

  customElements.define('wadi-sky', WadiSky);
})();
