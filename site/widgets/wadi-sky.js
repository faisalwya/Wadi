/* <wadi-sky></wadi-sky>
   The cover's sky, drawn in the same dash language as the landscape: five birds (two dash strokes
   each) at different depths, nearer ones larger and darker, flapping in bursts and gliding, crossing
   in reading direction; and the time of day, following light/dark mode: by day a sun, by night a
   crescent moon, both drawn as a fine grid of small dashes (like the mountains, a little finer so the disc reads
   round), to one side of the sky; at night a dozen faint dash stars twinkle, each at its own pace.
   It fills its parent (the cover) and keeps the birds in a band just above the cover's name (.cover-name),
   close to the scene without crowding it. The band is re-measured whenever the layout changes (fonts
   arriving, phone toolbars moving); birds already flying glide into the new band.
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
      var name = this.parentNode && this.parentNode.querySelector('.cover-name');
      if (name) new ResizeObserver(function () { self.resize(); }).observe(name);       // the name settles after its font loads
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.resize(); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) self.run(); });
    }

    disconnectedCallback() { cancelAnimationFrame(this.raf); this.raf = 0; }

    readInk() { this.ink = getComputedStyle(this).color || '#3F3D38'; this.night = window.matchMedia('(prefers-color-scheme: dark)').matches; }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var land = this.parentNode && this.parentNode.querySelector('.cover-land'), name = this.parentNode && this.parentNode.querySelector('.cover-name');
      // measure where the name and landscape rest in the layout (offsets ignore any move in progress, such as
      // the name gliding back down from the top bar when returning to the cover)
      this.cx = land ? land.offsetLeft + land.offsetWidth / 2 : this.W / 2;
      var oldTop = this.skyTop, oldBottom = this.skyBottom;
      var nameTop = name ? name.offsetTop : this.H * .4;
      this.skyBottom = nameTop - 20;                               // just above the name
      this.skyTop = Math.max(24, nameTop - 120);
      if (oldTop !== this.skyTop || oldBottom !== this.skyBottom) this.stars = null;   // stars are placed again only if the sky changed
      if (!this.birds) this.setup();
      else if (oldBottom !== undefined && (oldTop !== this.skyTop || oldBottom !== this.skyBottom)) {
        var self = this, span = (oldBottom - oldTop) || 1;
        this.birds.forEach(function (b) {                          // keep each bird's place within the band
          b.target = self.skyTop + (b.y0 - oldTop) / span * (self.skyBottom - self.skyTop);
        });
      }
      this.run();
    }

    setup() {
      var self = this;
      this.birds = [0, 1, 2, 3, 4].map(function (i) {
        var depth = [1, .75, .55, .9, .45][i];                     // 1 = near
        return { x: rand(0, self.W), y0: rand(self.skyTop, self.skyBottom), depth: depth, vx: 10 + 16 * depth,
                 s: 2.6 + 3.4 * depth, seed: rand(0, 10) };
      });
    }

    run() {
      if (this.raf || !this.W) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        if (document.hidden || !self.isConnected || !self.offsetWidth) { self.raf = 0; return; }   // hidden: rest until shown again
        self.step(now / 1000, dt);
        self.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    drawSky(c, t) {
      // a finer grid than the mountains, so the small disc reads round; centred so it is symmetrical
      var CW = 3.3, RH = 2.6, DW = 2.3, DH = 1;
      var R = 14, x0 = this.cx + Math.min(118, this.W * .3), y0 = this.skyTop + (this.skyBottom - this.skyTop) * .38;
      var mx = x0 + R * .5, my = y0 - R * .2, mR = R * .9;         // the shadow that carves the crescent
      if (this.night) this.drawStars(c, t, x0, y0, R);
      var nx = Math.ceil((R + 7) / CW), ny = Math.ceil((R + 7) / RH);
      for (var j = -ny; j <= ny; j++) {
        for (var i = -nx; i <= nx; i++) {
          var x = i * CW + (j % 2 ? CW / 2 : 0), y = j * RH;        // rows offset by half a cell: a rounder edge
          var d = Math.hypot(x, y), a = 0;
          var rim = Math.max(0, Math.min(1, (R - d) / 1.8 + .5));     // dashes soften at the very edge
          if (rim > 0) {
            if (this.night) {
              var shade = Math.max(0, Math.min(1, (mR - Math.hypot(x0 + x - mx, y0 + y - my)) / 1.6 + .5));
              a = rim * ((.64 - .2 * (d / R)) * (1 - shade) + .07 * shade);   // the crescent, and the faint dark side
            } else {
              a = rim * (.62 - .28 * (d / R));                                 // the sun, densest at its centre
            }
          }
          if (!this.night && d > R - 1 && d <= R + 7) {
            a = Math.max(a, .1 * (1 - (d - R) / 7) * (.6 + .4 * Math.sin(t * .8 + Math.atan2(y, x) * 2)));   // a faint halo, breathing slowly
          }
          if (a <= .01) continue;
          c.globalAlpha = a;
          c.fillRect(x0 + x - DW / 2, y0 + y - DH / 2, DW, DH);
        }
      }
      c.globalAlpha = 1;
    }

    // night: tiny dash glimmers scattered across the sky, each twinkling at its own pace, now and then a brief glint
    drawStars(c, t, mx, my, mr) {
      if (!this.stars) {
        var self = this, top = 18, bottom = this.skyBottom + 6, tries = 0;
        this.stars = [];
        while (this.stars.length < 13 && tries++ < 400) {
          var x = Math.random() * this.W, y = top + Math.random() * (bottom - top);
          if (Math.hypot(x - mx, y - my) < mr + 18) continue;                   // not on the moon
          if (this.stars.some(function (s) { return Math.hypot(s.x - x, s.y - y) < 34; })) continue;   // spread out
          this.stars.push({ x: x, y: y, speed: .5 + Math.random() * .9, seed: Math.random() * 10, size: Math.random() < .3 ? 2.6 : 1.8 });
        }
      }
      this.stars.forEach(function (s) {
        var tw = .5 + .5 * Math.sin(t * s.speed + s.seed);
        var glint = Math.pow(Math.max(0, Math.sin(t * .23 + s.seed * 3)), 40);    // rare, brief
        c.globalAlpha = .08 + .22 * tw + .5 * glint;
        c.fillRect(s.x - s.size / 2, s.y - .5, s.size, 1);
        if (glint > .3) { c.globalAlpha = .4 * glint; c.fillRect(s.x - .5, s.y - s.size / 2 - .5, 1, s.size + 1); }   // a tiny cross when it glints
      });
      c.globalAlpha = 1;
    }

    step(t, dt) {
      var c = this.ctx, W = this.W, H = this.H, self = this;
      c.clearRect(0, 0, W, H);
      c.save();
      if (this.rtl) { c.translate(W, 0); c.scale(-1, 1); }       // everything moves in reading direction
      c.strokeStyle = this.ink; c.fillStyle = this.ink; c.lineCap = 'round';

      // the sun (day) or the moon (night): a disc made of rows of dashes, like the mountains' grid
      this.drawSky(c, t);

      // birds: flap in bursts, glide in between, nearer ones larger and darker
      this.birds.forEach(function (b) {
        b.x += b.vx * dt;
        if (b.target !== undefined) { b.y0 += (b.target - b.y0) * Math.min(1, dt * 2.5); if (Math.abs(b.target - b.y0) < .3) { b.y0 = b.target; b.target = undefined; } }   // glide into a new band
        if (b.x > W + 14) { b.x = -14; b.y0 = rand(self.skyTop, self.skyBottom); b.target = undefined; }
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
