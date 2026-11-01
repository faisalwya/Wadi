/* <wadi-rain hint="Tap to bring rain"></wadi-rain>
   A small toy for the "Interactive + games" panel: tap the valley to make it rain.
   Drops roll a little down the slope; where they soak in, a plant sprouts.
   Drops that reach the valley floor fill a pool.
   - Starts only when it is actually on screen (e.g. its panel is open), and the
     animation loop stops whenever nothing is moving.
   - Colours come from the site's tokens, so it follows light/dark mode.
   - With "reduce motion" on, drops land instantly and plants appear fully grown. */
(function () {
  if (customElements.get('wadi-rain')) return;

  var MAX_PLANTS = 36;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function rand(a, b) { return a + Math.random() * (b - a); }

  class WadiRain extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.drops = []; this.plants = []; this.ripples = [];
      this.pool = 0; this.raf = 0; this.started = false; this.visible = false;

      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.hintEl = document.createElement('span');
      this.hintEl.className = 'hint';
      this.hintEl.textContent = this.getAttribute('hint') || '';
      this.append(this.canvas, this.hintEl);
      this.setAttribute('role', 'img');
      if (this.getAttribute('label')) this.setAttribute('aria-label', this.getAttribute('label'));
      this.ctx = this.canvas.getContext('2d');

      this.readColors();
      var self = this;
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readColors(); self.draw(); });

      new ResizeObserver(function () { self.resize(); }).observe(this);
      new IntersectionObserver(function (es) {
        self.visible = es[0].isIntersecting;
        if (self.visible && !self.started) { self.started = true; self.demo(); }
        if (self.visible) self.kick();
      }, { threshold: 0.35 }).observe(this);

      var lastMove = 0;
      this.canvas.addEventListener('pointerdown', function (e) {
        self.rainAt(e); self.down = true; self.dismissHint();
      });
      this.canvas.addEventListener('pointermove', function (e) {
        if (!self.down) return;
        var now = performance.now();
        if (now - lastMove > 70) { lastMove = now; self.rainAt(e); }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
        self.canvas.addEventListener(t, function () { self.down = false; });
      });
    }

    readColors() {
      var cs = getComputedStyle(this);
      this.col = {
        sky: cs.getPropertyValue('--w4').trim() || '#D8D4CB',
        sand: cs.getPropertyValue('--w2').trim() || '#C99A62',
        water: cs.getPropertyValue('--w3').trim() || '#86A19C',
        leaf: cs.getPropertyValue('--w1').trim() || '#55794C',
        bloom: cs.getPropertyValue('--w5').trim() || '#D9BCAA'
      };
    }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var oldW = this.W;
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(this.W * dpr);
      this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // keep existing plants on the ground after a resize
      if (oldW) {
        var k = this.W / oldW, self = this;
        this.plants.forEach(function (p) { p.x *= k; p.y = self.ground(p.x); });
      }
      this.floorY = 0;
      for (var x = 0; x <= this.W; x += 2) this.floorY = Math.max(this.floorY, this.ground(x));
      this.draw();
    }

    // y of the ground surface at x: a valley, low in the middle, with gentle bumps
    ground(x) {
      var W = this.W, H = this.H, u = (x - W * 0.5) / (W * 0.3);
      var lift = H * 0.17 + H * 0.4 * (1 - Math.exp(-u * u)) + H * 0.025 * Math.sin(x / W * 9.5);
      return H - lift;
    }
    surface() { return this.floorY - this.pool; }

    rainAt(e) {
      var r = this.canvas.getBoundingClientRect();
      this.addDrop(e.clientX - r.left, e.clientY - r.top);
    }

    addDrop(x, y) {
      x = Math.max(4, Math.min(this.W - 4, x));
      y = Math.min(y, this.ground(x) - 6);
      if (calm.matches) { this.land(x, true); this.draw(); return; }
      this.drops.push({ x: x, y: Math.max(2, y), vx: 0, vy: 0, mode: 'fall', t: 0, soak: rand(14, 34) });
      this.kick();
    }

    // a drop comes to rest at x: into the pool, or a plant sprouts
    land(x, instant) {
      if (this.ground(x) >= this.surface()) {
        this.pool = Math.min(this.H * 0.13, this.pool + 1.1);
        if (!instant) this.ripples.push({ x: x, r: 2, a: 0.6 });
        return;
      }
      var near = 1 - Math.min(1, Math.abs(x - this.W / 2) / (this.W * 0.45));
      this.plants.push({
        x: x, y: this.ground(x), g: instant ? 1 : 0,
        h: rand(14, 28) * (1 + 0.6 * near) * Math.max(0.8, this.H / 220),
        lean: rand(-0.35, 0.35), bloom: Math.random() < 0.35, side: Math.random() < 0.5 ? 1 : -1
      });
      if (this.plants.length > MAX_PLANTS) this.plants.shift();
    }

    demo() {
      var self = this, xs = [0.28, 0.66, 0.44];
      if (calm.matches) { xs.forEach(function (f) { self.land(self.W * f, true); }); this.draw(); return; }
      xs.forEach(function (f, i) {
        setTimeout(function () { self.addDrop(self.W * f, self.H * 0.08); }, 250 + i * 380);
      });
    }

    dismissHint() { if (!this.hinted) { this.hinted = true; this.hintEl.classList.add('gone'); } }

    kick() {
      if (this.raf || !this.visible) return;
      var self = this, last = performance.now();
      var step = function (now) {
        var dt = Math.min(3, (now - last) / 16.67); last = now;
        var busy = self.update(dt);
        self.draw();
        self.raf = (busy && self.visible) ? requestAnimationFrame(step) : 0;
      };
      this.raf = requestAnimationFrame(step);
    }

    update(dt) {
      var self = this;
      this.drops = this.drops.filter(function (d) {
        d.t += dt;
        if (d.mode === 'fall') {
          d.vy += 0.38 * dt; d.y += d.vy * dt;
          var gy = self.ground(d.x);
          if (d.y >= Math.min(gy, self.surface())) {
            if (gy >= self.surface()) { self.land(d.x); return false; }
            d.y = gy; d.mode = 'roll'; d.t = 0;
          }
          return true;
        }
        var s = (self.ground(d.x + 1) - self.ground(d.x - 1)) / 2;
        d.vx = (d.vx + s * 0.45 * dt) * Math.pow(0.9, dt);
        d.x = Math.max(2, Math.min(self.W - 2, d.x + d.vx * dt));
        d.y = self.ground(d.x);
        if (d.y >= self.surface() || d.t > d.soak) { self.land(d.x); return false; }
        return true;
      });
      var growing = false;
      this.plants.forEach(function (p) { if (p.g < 1) { p.g = Math.min(1, p.g + 0.022 * dt); growing = true; } });
      this.ripples = this.ripples.filter(function (r) { r.r += 0.6 * dt; r.a -= 0.018 * dt; return r.a > 0; });
      return this.drops.length > 0 || growing || this.ripples.length > 0;
    }

    draw() {
      var c = this.ctx, W = this.W, H = this.H, col = this.col;
      if (!W) return;
      c.clearRect(0, 0, W, H);
      c.fillStyle = col.sky; c.fillRect(0, 0, W, H);

      // ground
      var sy = this.surface();
      c.beginPath(); c.moveTo(0, H);
      for (var gx = 0; gx <= W; gx += 2) c.lineTo(gx, this.ground(gx));
      c.lineTo(W, H); c.closePath(); c.fillStyle = col.sand; c.fill();

      // pool: the part of the valley that lies below the water line
      if (this.pool > 0.5) {
        c.beginPath(); var on = false;
        for (var x = 0; x <= W; x += 1) {
          var gy = this.ground(x);
          if (gy > sy) { if (!on) { c.moveTo(x, sy); on = true; } c.lineTo(x, gy); }
          else if (on) { c.lineTo(x, sy); c.closePath(); on = false; }
        }
        if (on) { c.lineTo(W, sy); c.closePath(); }
        c.fillStyle = col.water; c.fill();
      }

      // ripples on the pool
      this.ripples.forEach(function (r) {
        c.beginPath(); c.ellipse(r.x, sy, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
        c.strokeStyle = col.sky; c.globalAlpha = r.a; c.lineWidth = 1.2; c.stroke(); c.globalAlpha = 1;
      });

      // plants
      c.lineCap = 'round';
      this.plants.forEach(function (p) {
        var e = 1 - Math.pow(1 - p.g, 3), h = p.h * e, tx = p.x + p.lean * h, ty = p.y - h;
        c.beginPath(); c.moveTo(p.x, p.y);
        c.quadraticCurveTo(p.x + p.lean * h * 0.2, p.y - h * 0.6, tx, ty);
        c.strokeStyle = col.leaf; c.lineWidth = 1.6; c.stroke();
        [[0.45, p.side], [0.7, -p.side]].forEach(function (l) {
          var lx = p.x + p.lean * h * l[0] * 0.6, ly = p.y - h * l[0], s = Math.min(1, e * 1.4) * Math.max(2.6, p.h * 0.17);
          c.beginPath(); c.ellipse(lx + l[1] * s * 0.9, ly, s, s * 0.42, l[1] * -0.5, 0, Math.PI * 2);
          c.fillStyle = col.leaf; c.fill();
        });
        if (p.bloom && p.g > 0.85) {
          c.beginPath(); c.arc(tx, ty, 2.6 * (p.g - 0.85) / 0.15 + 0.4, 0, Math.PI * 2);
          c.fillStyle = col.bloom; c.fill();
        }
      });

      // drops
      c.fillStyle = col.water;
      this.drops.forEach(function (d) {
        c.beginPath();
        if (d.mode === 'fall') c.ellipse(d.x, d.y, 2, 2 + Math.min(4, d.vy * 0.5), 0, 0, Math.PI * 2);
        else c.arc(d.x, d.y - 1.5, 2, 0, Math.PI * 2);
        c.fill();
      });
    }
  }

  customElements.define('wadi-rain', WadiRain);
})();
