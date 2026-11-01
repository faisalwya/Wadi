/* <wadi-pattern variant="slide|drift"></wadi-pattern>
   A section break made of code: rows of characters (this file's own source) where the
   characters lying on an eight-point star pattern (khatam / Rub el Hizb) are darker,
   so up close it reads as code and at a glance as a pattern.
   It shifts with the scroll position, in both directions, and never moves on its own:
   - slide: the code slides sideways past a fixed pattern (rows alternate direction)
   - drift: the code stays put and the pattern drifts through it
   For comparing on a preview, ?pattern=slide or ?pattern=drift in the URL overrides
   the attribute. With "reduce motion" on it stays still. Colours follow light/dark. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var FALLBACK = 'function(){var a=[];for(var i=0;i<n;i++){a.push(i*2);}return a;}const x={y:1};if(x.y>0){go();}';
  var sourceText = null;

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      var q = new URLSearchParams(location.search).get('pattern');
      this.variant = (q === 'slide' || q === 'drift') ? q : (this.getAttribute('variant') || 'slide');
      this.canvas = document.createElement('canvas');
      this.canvas.setAttribute('aria-hidden', 'true');
      this.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.text = FALLBACK; this.shift = 0; this.visible = false;

      var self = this;
      this.readColors();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readColors(); self.draw(); });
      new ResizeObserver(function () { self.resize(); }).observe(this);
      new IntersectionObserver(function (es) { self.visible = es[0].isIntersecting; if (self.visible) self.onScroll(); }).observe(this);
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (calm.matches || !self.visible || ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; self.onScroll(); });
      }, { passive: true });

      if (sourceText) this.useText(sourceText);
      else if (SRC) fetch(SRC).then(function (r) { return r.text(); }).then(function (t) {
        sourceText = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
        self.useText(sourceText);
      }).catch(function () {});
    }

    useText(t) { if (t && t.length > 200) { this.text = t; this.draw(); } }

    readColors() {
      var cs = getComputedStyle(this);
      this.ink = cs.getPropertyValue('--fg').trim() || '#16181A';
      this.font = '500 8px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
      this.starFont = '600 8px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = r.width; this.H = r.height;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr;
      this.ctx.font = this.font;
      this.cw = this.ctx.measureText('M').width;   // character cell width
      this.lh = 9;                                  // line height
      this.S = 100;                                 // star spacing
      this.draw();
    }

    onScroll() { this.shift = calm.matches ? 0 : window.scrollY; this.draw(); }

    // One row of stars across the band, like a traditional border.
    starCentres(dx) {
      var S = this.S, out = [], cy = this.H / 2;
      var i0 = Math.floor((-S - dx) / S), i1 = Math.ceil((this.W + S - dx) / S);
      for (var i = i0; i <= i1; i++) out.push([i * S + S / 2 + dx, cy]);
      return out;
    }

    // outline of one eight-point star (a square and the same square turned 45 degrees), as 16 points
    starShape() {
      if (this._shape && this._shape.S === this.S) return this._shape;
      var a = this.S * 0.25, R = a * Math.SQRT2, r = R * 0.68, pts = []   /* inner corners a little deeper than geometric, so the points read on a small screen */, segs = [], P = 0;
      for (var i = 0; i < 16; i++) { var ang = i * Math.PI / 8 - Math.PI / 2, rad = i % 2 ? r : R; pts.push([rad * Math.cos(ang), rad * Math.sin(ang)]); }
      for (var k = 0; k < 16; k++) {
        var p0 = pts[k], p1 = pts[(k + 1) % 16], len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        segs.push({ x: p0[0], y: p0[1], ux: (p1[0] - p0[0]) / len, uy: (p1[1] - p0[1]) / len, len: len, at: P }); P += len;
      }
      this._shape = { S: this.S, segs: segs, P: P };
      return this._shape;
    }

    draw() {
      var c = this.ctx, W = this.W, H = this.H;
      if (!W || !this.cw) return;
      var slide = this.variant === 'slide', s = this.shift, text = this.text, n = text.length;
      var drift = slide ? 0 : s * 0.45;
      c.clearRect(0, 0, W, H);
      c.direction = 'ltr'; c.fillStyle = this.ink;

      // 1. faint code in rows behind everything
      c.font = this.font; c.textBaseline = 'middle'; c.globalAlpha = 0.09;
      var cols = Math.ceil(W / this.cw) + 1, rows = Math.ceil(H / this.lh);
      for (var r = 0; r < rows; r++) {
        var off = slide ? Math.round(s / 4) * (r % 2 ? -1 : 1) : 0;
        var st = ((r * 97 + off) % n + n) % n, line = '';
        for (var i = 0; i < cols; i++) line += text[(st + i) % n];
        c.fillText(line, 0, r * this.lh + this.lh / 2);
      }

      // 2. code written along the star outlines, letter by letter, turning at each corner
      var shape = this.starShape(), step = this.cw * 1.02, flow = slide ? Math.round(s / 3) : 0;
      c.font = this.starFont; c.textAlign = 'center'; c.globalAlpha = 0.78;
      var centres = this.starCentres(drift), R = this.S * 0.25 * Math.SQRT2;  // star point radius
      for (var q = 0; q < centres.length; q++) {
        var cx = centres[q][0], cy = centres[q][1];
        if (cx < -this.S || cx > W + this.S || cy < -this.S || cy > H + this.S) continue;
        var seg = 0, base = q * 53 + flow;
        for (var t = 0, k = 0; t < shape.P - step * 0.5; t += step, k++) {
          while (seg < 15 && t > shape.segs[seg].at + shape.segs[seg].len) seg++;
          var g = shape.segs[seg], d = t - g.at;
          var x = cx + g.x + g.ux * d, y = cy + g.y + g.uy * d;
          if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
          c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
          c.translate(x, y); c.rotate(Math.atan2(g.uy, g.ux));
          c.fillText(text[((base + k) % n + n) % n], 0, 0);
        }
        // a line of code linking this star's right point to the next star's left point
        c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        for (var lx = cx + R + step, m = 0; lx < cx + this.S - R - step * 0.4; lx += step, m++) {
          if (lx > -6 && lx < W + 6) c.fillText(text[((base + 40 + m) % n + n) % n], lx, cy);
        }
      }
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.textAlign = 'start'; c.globalAlpha = 1;
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
