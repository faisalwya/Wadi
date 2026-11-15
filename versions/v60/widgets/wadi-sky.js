/* <wadi-sky></wadi-sky>
   The cover's sky, drawn in the same dash language as the landscape: five birds at different depths,
   nearer ones larger and darker, each wing two short dashes, crossing in reading direction; they flap in
   bursts (a quick downstroke, a slower upstroke) and ease into a glide in between; and the time of day, following light/dark mode: by day a sun, by night a
   crescent moon, both drawn as a fine grid of small dashes (like the mountains, a little finer so the disc reads
   round), to one side of the sky, with a glow of faint dashes around it; at night a dozen faint dash stars
   twinkle, each at its own pace.
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

    readInk() { var cs = getComputedStyle(this); this.ink = cs.color || '#3F3D38'; this.glow = cs.getPropertyValue('--fg').trim() || this.ink; this.night = window.matchMedia('(prefers-color-scheme: dark)').matches; }

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
      this.cx = land ? land.offsetLeft + land.offsetWidth / 2 - this.offsetLeft : this.W / 2;   // in the sky's own coordinates (it may be narrower than the cover)
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
      // a fine, centred grid of small dashes (rows offset by half a cell so the disc reads round); the brightest
      // dashes use the strongest ink, as the light does on the hills, and a halo of faint dashes makes the glow
      var CW = 2.7, RH = 2.2, DW = 1.9, DH = .9, HALO = 11;
      var R = 15, x0 = this.cx + Math.min(118, this.W * .3), y0 = this.skyTop + (this.skyBottom - this.skyTop) * .38;
      var mx = x0 + R * .5, my = y0 - R * .2, mR = R * .9;          // the shadow that carves the crescent
      var night = this.night;
      if (night) this.drawStars(c, t, x0, y0, R + HALO);
      var nx = Math.ceil((R + HALO) / CW), ny = Math.ceil((R + HALO) / RH);
      for (var j = -ny; j <= ny; j++) {
        for (var i = -nx; i <= nx; i++) {
          var x = i * CW + (j % 2 ? CW / 2 : 0), y = j * RH;
          var d = Math.hypot(x, y), ang = Math.atan2(y, x);
          if (d > R + HALO) continue;
          var rim = Math.max(0, Math.min(1, (R - d) / 1.6 + .5));     // dashes soften at the very edge
          var lit, a = 0, bright = 0;
          if (night) {
            var s2 = (mR - Math.hypot(x0 + x - mx, y0 + y - my)) / 3.2 + .5;
            var shade = Math.max(0, Math.min(1, s2)); shade = shade * shade * (3 - 2 * shade);   // a soft edge of shadow
            lit = 1 - shade;
            if (rim > 0) {
              var limb = d > R - 3.5 ? .85 + .15 * Math.sin(t * 1.7 + ang * 5) : 1;   // the lit edge glints slowly
              bright = rim * lit * (.62 + .3 * (1 - d / R)) * limb;
              a = rim * .06 * shade;                                                  // the faint dark side
            }
            // glow: faint dashes spilling out beside the lit crescent, fading outwards
            if (d > R - 1) {
              var face = Math.max(0, -(x * .9 + y * .4) / (d || 1));   // towards the lit side
              var g = Math.pow(Math.max(0, 1 - (d - R) / HALO), 1.6) * (.25 + .75 * face);
              a = Math.max(a, .16 * g * (.85 + .15 * Math.sin(t * .6 + ang * 3)));
            }
          } else {
            if (rim > 0) bright = rim * (.7 - .32 * (d / R));          // the sun: a brighter core
            if (d > R - 1) {
              var gs = Math.pow(Math.max(0, 1 - (d - R) / HALO), 1.4);
              a = Math.max(a, .13 * gs * (.6 + .4 * Math.sin(t * .8 + ang * 2)));   // a soft halo, breathing slowly
            }
          }
          if (a > .01) { c.fillStyle = this.ink; c.globalAlpha = a; c.fillRect(x0 + x - DW / 2, y0 + y - DH / 2, DW, DH); }
          if (bright > .01) { c.fillStyle = this.glow; c.globalAlpha = bright; c.fillRect(x0 + x - DW / 2, y0 + y - DH / 2, DW, DH); }
        }
      }
      c.fillStyle = this.ink; c.globalAlpha = 1;
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

    // the wing's height (1 = up, below 0 = down): in a burst, a quick downstroke (a third of each beat) and a slower,
    // easing upstroke, about three beats a second; between bursts the wings ease into a gentle glide pose
    wingAt(t, b) {
      var GLIDE = .5, cycle = 4.2, burst = 1.3, p = (t + b.seed) % cycle;
      var into = Math.min(1, p / .2), out = Math.min(1, Math.max(0, (burst - p) / .25));
      var mix = p < burst ? Math.min(into, out) : 0;                     // ease in and out of the burst
      if (!mix) return GLIDE;
      var u = ((t + b.seed) * 3) % 1, w;
      if (u < .33) { var k = u / .33; w = 1 - 1.45 * (k * k * (3 - 2 * k)); }          // down, quick
      else { var k2 = (u - .33) / .67; w = -.45 + 1.45 * (1 - Math.pow(1 - k2, 2)); }  // up, slower, easing
      return GLIDE + (w - GLIDE) * mix;
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
        var wing = self.wingAt(t, b);
        c.globalAlpha = .25 + .5 * b.depth; c.lineWidth = .8 + .5 * b.depth;
        // each wing is two short dashes with a small gap, from the body out to the tip
        [-1, 1].forEach(function (side) {
          var tx = b.x + side * b.s, ty = y - b.s * .75 * wing;
          [[.08, .46], [.58, 1]].forEach(function (seg) {
            c.beginPath();
            c.moveTo(b.x + (tx - b.x) * seg[0], y + (ty - y) * seg[0]);
            c.lineTo(b.x + (tx - b.x) * seg[1], y + (ty - y) * seg[1]);
            c.stroke();
          });
        });
      });
      c.restore();
    }
  }

  customElements.define('wadi-sky', WadiSky);
})();
