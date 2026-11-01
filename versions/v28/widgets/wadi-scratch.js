/* <wadi-scratch hint="Scratch to reveal" again="Scratch again"> …prize content… </wadi-scratch>
   A scratch-to-reveal card, the kind of mechanic used in shop and restaurant promotions.
   The prize is ordinary text written in the page (so it is translated and readable by screen
   readers); the widget covers it with a grid of dashes. Rubbing knocks the dashes off where the
   finger passes: they fly off and fall away like sand, uncovering the prize. Once about half is
   cleared, the rest scatters on its own in a wave, and "Scratch again" covers it back up.
   - Starts only when visible; animates only while pieces are moving.
   - Colours come from the site's tokens (light/dark).
   - Keyboard: focus the card and press Enter or Space to reveal.
   - With "reduce motion", pieces vanish instead of flying. */
(function () {
  if (customElements.get('wadi-scratch')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CELL = 9, BRUSH = 17, DONE_AT = 0.55;     // cell size, finger radius (px), share cleared before auto-reveal

  class WadiScratch extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      var self = this;
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.hintEl = document.createElement('span'); this.hintEl.className = 'hint';
      this.hintEl.textContent = this.getAttribute('hint') || '';
      this.againEl = document.createElement('button'); this.againEl.type = 'button'; this.againEl.className = 'again';
      this.againEl.textContent = this.getAttribute('again') || 'Again';
      this.append(this.canvas, this.hintEl, this.againEl);
      this.ctx = this.canvas.getContext('2d');
      this.tabIndex = 0;
      this.setAttribute('role', 'group');
      this.readColors();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readColors(); self.draw(); });

      new ResizeObserver(function () { self.resize(); }).observe(this);
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.run(); }, { threshold: 0.2 }).observe(this);

      var last = null;
      this.canvas.addEventListener('pointerdown', function (e) {
        if (self.revealed) return;
        self.canvas.setPointerCapture(e.pointerId);
        last = self.point(e); self.scratch(last, last);
      });
      this.canvas.addEventListener('pointermove', function (e) {
        if (!last) return;
        var p = self.point(e); self.scratch(last, p); last = p;
      });
      ['pointerup', 'pointercancel'].forEach(function (t) { self.canvas.addEventListener(t, function () { last = null; }); });
      this.againEl.addEventListener('click', function () { self.cover(true); self.focus(); });
      this.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === self && !self.revealed) { e.preventDefault(); self.revealAll(); }
      });
    }

    readColors() {
      var cs = getComputedStyle(this);
      this.col = { cover: cs.getPropertyValue('--w4').trim() || '#D8D4CB', ink: cs.getPropertyValue('--soft').trim() || '#3F3D38' };
    }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.cover(false);
    }

    // build the grid of covering pieces; `animate` drops them back in, in a wave
    cover(animate) {
      var cols = Math.ceil(this.W / CELL), rows = Math.ceil(this.H / CELL), now = performance.now();
      this.cols = cols; this.rows = rows;
      this.cells = []; this.flying = []; this.cleared = 0; this.revealed = false;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var cell = { c: c, r: r, on: true, t: 0 };
        if (animate && !calm.matches) cell.t = now + (c + r * 0.6) * 9;   // drop back in, left to right
        this.cells.push(cell);
      }
      this.classList.remove('revealed');
      this.hintEl.classList.remove('gone');
      this.draw();
      if (animate) this.run();
    }

    point(e) { var r = this.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    // knock off the pieces along the finger's path
    scratch(a, b) {
      if (!this.hintGone) { this.hintGone = true; this.hintEl.classList.add('gone'); }
      var dist = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(dist / 4));
      var dx = (b.x - a.x) / (dist || 1), dy = (b.y - a.y) / (dist || 1);
      for (var s = 0; s <= steps; s++) {
        var x = a.x + (b.x - a.x) * s / steps, y = a.y + (b.y - a.y) * s / steps;
        var c0 = Math.max(0, Math.floor((x - BRUSH) / CELL)), c1 = Math.min(this.cols - 1, Math.floor((x + BRUSH) / CELL));
        var r0 = Math.max(0, Math.floor((y - BRUSH) / CELL)), r1 = Math.min(this.rows - 1, Math.floor((y + BRUSH) / CELL));
        for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
          var cx = c * CELL + CELL / 2, cy = r * CELL + CELL / 2;
          if (Math.hypot(cx - x, cy - y) <= BRUSH) this.knock(this.cells[r * this.cols + c], dx, dy);
        }
      }
      if (this.cleared / this.cells.length >= DONE_AT) this.revealAll();
      this.draw(); this.run();
    }

    // a piece leaves the cover and, unless motion is reduced, flies off and falls
    knock(cell, dx, dy) {
      if (!cell || !cell.on) return;
      cell.on = false; this.cleared++;
      if (calm.matches) return;
      var x = cell.c * CELL + CELL / 2, y = cell.r * CELL + CELL / 2;
      this.flying.push({ x: x, y: y, vx: dx * 90 + (Math.random() - .5) * 120, vy: dy * 90 - 60 - Math.random() * 90,
        rot: 0, vr: (Math.random() - .5) * 14, life: 1 });
    }

    revealAll() {
      if (this.revealed) return;
      this.revealed = true;
      var self = this, now = performance.now();
      this.cells.forEach(function (cell) {
        if (!cell.on) return;
        if (calm.matches) { cell.on = false; return; }
        cell.go = now + (cell.c + cell.r * 0.5) * 7;   // the rest scatters in a wave
      });
      this.hintEl.classList.add('gone');
      setTimeout(function () { self.classList.add('revealed'); }, calm.matches ? 0 : 450);
      this.draw(); this.run();
    }

    run() {
      if (this.raf || !this.visible) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.033, (now - last) / 1000); last = now;
        var busy = false;
        self.cells.forEach(function (cell) {
          if (cell.go && now >= cell.go) { cell.go = 0; self.knock(cell, (Math.random() - .5) * .6, -0.4); }
          if (cell.go || (cell.t && now < cell.t + 260)) busy = true;
        });
        self.flying = self.flying.filter(function (p) {
          p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt * 1.4;
          return p.life > 0 && p.y < self.H + 20;
        });
        if (self.flying.length) busy = true;
        self.draw(now);
        self.raf = busy ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }

    draw(now) {
      var c = this.ctx, W = this.W, H = this.H, col = this.col;
      if (!W) return;
      now = now || performance.now();
      c.clearRect(0, 0, W, H);
      c.font = '400 9px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (var i = 0; i < this.cells.length; i++) {
        var cell = this.cells[i];
        if (!cell.on) continue;
        var drop = 0, a = 1;
        if (cell.t) {                                   // dropping back in
          var p = Math.max(0, Math.min(1, (now - cell.t) / 260));
          drop = (1 - p) * -6; a = p;
          if (p >= 1) cell.t = 0;
        }
        if (a <= 0) continue;
        var x = cell.c * CELL, y = cell.r * CELL + drop;
        c.globalAlpha = a;
        c.fillStyle = col.cover; c.fillRect(x - .3, y - .3, CELL + .6, CELL + .6);
        c.fillStyle = col.ink; c.globalAlpha = a * 0.55;
        c.fillText('-', x + CELL / 2, y + CELL / 2);
      }
      c.fillStyle = col.ink;
      for (var j = 0; j < this.flying.length; j++) {
        var f = this.flying[j];
        c.save(); c.globalAlpha = Math.max(0, f.life) * 0.8;
        c.translate(f.x, f.y); c.rotate(f.rot); c.fillText('-', 0, 0); c.restore();
      }
      c.globalAlpha = 1;
    }
  }

  customElements.define('wadi-scratch', WadiScratch);
})();
