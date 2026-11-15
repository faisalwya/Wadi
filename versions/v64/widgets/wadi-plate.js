/* <wadi-plate seed="Dune Coffee"></wadi-plate>
   A stand-in project image in the site's dash language: a tinted card with its own small range of dash
   mountains, shaped by the seed (so each project gets a different, stable landscape). The tint comes from
   the element's background (set it with a --w colour); the dashes are drawn in a pale ink over it.
   When the card comes into view the columns rise into place, once, in a wave from where reading starts.
   Still with "reduce motion"; redrawn on resize. */
(function () {
  if (customElements.get('wadi-plate')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  class WadiPlate extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.rtl = document.documentElement.dir === 'rtl';
      this.canvas = document.createElement('canvas');
      this.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      var r = rng(hash(this.getAttribute('seed') || 'wadi'));
      // a few soft waves with random phases make the range; one or two peaks stand out
      this.waves = [0, 1, 2].map(function (i) { return { f: [1.3, 2.7, 5.2][i] * (.8 + r() * .5), p: r() * 6.3, a: [.5, .28, .12][i] }; });
      this.peak = { at: .25 + r() * .5, w: .07 + r() * .06, h: .35 + r() * .25 };
      this.k = calm.matches ? 1 : 0;
      var self = this;
      new ResizeObserver(function () { self.resize(); }).observe(this);
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && self.k < 1 && !self.raf) self.rise();
      }, { threshold: .35 }).observe(this);
    }

    resize() {
      var b = this.getBoundingClientRect();
      if (!b.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.W = b.width; this.H = b.height;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
      this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.draw();
    }

    height(u) {
      var h = .18;
      this.waves.forEach(function (w) { h += w.a * (.5 + .5 * Math.sin(u * w.f * 6.283 + w.p)) * .55; });
      var d = (u - this.peak.at) / this.peak.w; h += this.peak.h * Math.exp(-d * d);
      return Math.min(1, h);
    }

    rise() {
      var self = this, t0 = performance.now();
      var tick = function (now) {
        self.k = Math.min(1, (now - t0) / 1100);
        self.draw();
        self.raf = self.k < 1 ? requestAnimationFrame(tick) : 0;
      };
      this.raf = requestAnimationFrame(tick);
    }

    draw() {
      var c = this.ctx, W = this.W, H = this.H;
      if (!W) return;
      c.clearRect(0, 0, W, H);
      var CW = 7, RH = 5, DW = 4.6, DH = 1.4;                       // cell and dash size, like the cover's grid
      var cols = Math.floor((W * .84) / CW), rows = Math.floor((H * .56) / RH);
      var x0 = (W - cols * CW) / 2, base = H * .78;
      c.fillStyle = 'rgba(255,255,255,.78)';
      for (var i = 0; i < cols; i++) {
        var u = (i + .5) / cols, col = this.rtl ? cols - 1 - i : i;
        var lag = Math.max(0, Math.min(1, (this.k * 1.6 - u * .6)));  // a wave from the reading side
        lag = 1 - Math.pow(1 - lag, 3);
        var n = Math.max(1, Math.round(this.height(u) * rows * lag));
        var edge = Math.min(1, u / .12, (1 - u) / .12);
        for (var j = 0; j < n; j++) {
          c.globalAlpha = Math.max(0, edge) * (.45 + .55 * (j + 1) / n);
          c.fillRect(x0 + col * CW + (CW - DW) / 2, base - j * RH - DH, DW, DH);
        }
        // a faint reflection under the ground line
        for (var m = 1; m <= Math.min(n, 3); m++) {
          c.globalAlpha = Math.max(0, edge) * .14 / m;
          c.fillRect(x0 + col * CW + (CW - DW) / 2, base + m * RH - DH, DW, DH);
        }
      }
      c.globalAlpha = 1;
    }
  }

  customElements.define('wadi-plate', WadiPlate);
})();
