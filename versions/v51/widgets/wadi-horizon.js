/* <wadi-horizon></wadi-horizon>
   The menu's marker: one faint line of dashes running under the tab labels, like a horizon. Under the
   active tab the dashes lift into a small soft hill and turn full ink. On a tab switch the hill travels
   along the line to the new tab, flattening a little as it moves and rising again with a slight spring.
   It sits inside the menu (after the .tab buttons) and finds the tabs' positions itself, so it works in
   either reading direction. Still with "reduce motion"; colours follow light/dark. */
(function () {
  if (customElements.get('wadi-horizon')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var GAP = 6, DASH = 3.4, H = 12, BASE = 9, LIFT = 5, WIDTH = 15;   // dash spacing and size, height, line level, hill height and width (px)

  class WadiHorizon extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.canvas = document.createElement('canvas');
      this.append(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.x = null; this.v = 0; this.lift = 1; this.lv = 0;
      var self = this;
      this.readInk();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { self.readInk(); self.draw(); });
      new ResizeObserver(function () { self.resize(); }).observe(this);
      document.addEventListener('wadi:tab', function (e) { self.go(e.detail); });
      // also follow the pressed state directly (covers the first tab shown on load)
      new MutationObserver(function () { self.go(); }).observe(this.parentNode, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
    }

    readInk() {
      var cs = getComputedStyle(this);
      this.ink = cs.color || '#16181A';
    }

    resize() {
      var r = this.getBoundingClientRect();
      if (!r.width) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.W = r.width;
      this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(H * dpr);
      this.canvas.style.width = this.W + 'px'; this.canvas.style.height = H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.go(null, true);
    }

    // the centre of the active tab, in this element's coordinates
    target() {
      var on = this.parentNode.querySelector('.tab[aria-pressed="true"]');
      if (!on) return this.W / 2;
      var a = on.getBoundingClientRect(), b = this.getBoundingClientRect();
      return a.left + a.width / 2 - b.left;
    }

    go(key, instant) {
      if (!this.W) return;
      var self = this;
      requestAnimationFrame(function () {                  // after the pressed state has been updated
        self.tx = self.target();
        if (self.x === null || instant || calm.matches) { self.x = self.tx; self.v = 0; self.draw(); return; }
        if (Math.abs(self.tx - self.x) > 1) self.lift = Math.min(self.lift, .35);   // the hill flattens as it sets off
        self.run();
      });
    }

    run() {
      if (this.raf) return;
      var self = this, last = performance.now();
      var tick = function (now) {
        var dt = Math.min(.032, (now - last) / 1000); last = now;
        var d = self.tx - self.x;
        self.v += (d * 120 - self.v * 16) * dt; self.x += self.v * dt;          // travel with a little spring
        var near = Math.min(1, Math.abs(d) / 30);
        var goal = near > .5 ? .35 : 1;                                          // low while travelling, full on arrival
        self.lv += ((goal - self.lift) * 160 - self.lv * 14) * dt; self.lift += self.lv * dt;
        self.draw();
        var busy = Math.abs(d) > .2 || Math.abs(self.v) > .5 || Math.abs(1 - self.lift) > .01 || Math.abs(self.lv) > .05;
        self.raf = busy ? requestAnimationFrame(tick) : 0;
        if (!busy) { self.x = self.tx; self.lift = 1; self.draw(); }
      };
      this.raf = requestAnimationFrame(tick);
    }

    draw() {
      var c = this.ctx, W = this.W;
      if (!W) return;
      c.clearRect(0, 0, W, H);
      c.fillStyle = this.ink;
      var n = Math.floor(W / GAP), off = (W - (n - 1) * GAP) / 2;
      for (var i = 0; i < n; i++) {
        var x = off + i * GAP, d = (x - this.x) / WIDTH;
        var hill = Math.exp(-d * d);                                    // 1 under the active tab, 0 far away
        var edge = Math.min(1, x / 40, (W - x) / 40);                     // the line fades out at both ends
        c.globalAlpha = (.16 + .84 * hill) * Math.max(0, edge);
        c.fillRect(x - DASH / 2, BASE - hill * LIFT * this.lift - .6, DASH, 1.2);
      }
      c.globalAlpha = 1;
    }
  }

  customElements.define('wadi-horizon', WadiHorizon);
})();
