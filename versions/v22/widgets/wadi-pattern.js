/* <wadi-pattern></wadi-pattern>
   A slim ornament under the studio name: a mountain range drawn as one fine line, with
   the deepest valley (the wadi) at the centre holding a small dot, like water.
   Angular peaks echo the / \ of the earlier symbol version; the ends fade out.

   Movement (never constant; all of it off with "reduce motion"):
   - on arrival the line draws itself in one stroke, from where reading starts, then the dot appears
   - when you switch tabs, a swell travels through the range: peaks rise and settle as it passes,
     and the dot bobs in its valley
   - tapping it starts the swell from where you touched
   - optional "breath": ?breath=1 in the URL (or a breath attribute) gives a slow, gentle rise
     and fall every ~10 s while it is on screen */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NS = 'http://www.w3.org/2000/svg';
  var W = 220, H = 22, BASE = 19;                 // drawing size (px) and the valley floor level

  // The range, drawn by hand: [x 0..1, height 0..1]. Broad peaks of different heights with
  // smaller ridges on their slopes, not mirrored; the centre drops to the valley floor (the wadi).
  var RANGE = [
    [0, .04], [.04, .1], [.07, .07], [.11, .24], [.145, .17], [.2, .5], [.235, .38], [.26, .44], [.31, .16],
    [.355, .62], [.38, .52], [.415, .8], [.5, 0],
    [.565, .92], [.6, .7], [.625, .76], [.68, .28], [.72, .46], [.75, .36], [.8, .54], [.845, .2],
    [.885, .27], [.93, .1], [.965, .13], [1, .04]
  ];
  var TOP = 15;                                   // tallest peak height (px)
  function range() {
    return RANGE.map(function (p) { return { x: p[0] * W, h: p[1] * TOP, peak: p[1] > .12, centre: p[0] === .5 }; });
  }

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this;
      this.pts = range();
      this.centreIndex = this.pts.findIndex(function (p) { return p.centre; });
      this.amp = this.pts.map(function () { return 0; });
      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      this.svg.setAttribute('width', W); this.svg.setAttribute('height', H);
      if (document.documentElement.dir === 'rtl') this.svg.style.transform = 'scaleX(-1)';  // draw from the reading start
      this.path = document.createElementNS(NS, 'path');
      this.dot = document.createElementNS(NS, 'circle');
      this.dot.setAttribute('r', '1.7');
      this.svg.append(this.path, this.dot);
      this.append(this.svg);
      this.render(0);
      this.len = this.path.getTotalLength();
      this.style.setProperty('--len', this.len.toFixed(1));
      getComputedStyle(this.path).strokeDashoffset;   // register the undrawn state before drawing in

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) {
          self.arrived = true;
          if (calm.matches) self.classList.add('in', 'now');
          else setTimeout(function () { requestAnimationFrame(function () { self.classList.add('in'); }); }, 120);
          setTimeout(function () { self.settled = true; }, 1500);
        }
      }).observe(this);

      document.addEventListener('wadi:tab', function () { self.swell(document.documentElement.dir === 'rtl' ? W : 0); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
        if (document.documentElement.dir === 'rtl') x = W - x;
        self.swell(x, false, true);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.swell(W / 2, true); }, 10000);
      }
    }

    // draw the range with each point lifted by its current swell
    render(t) {
      var d = '', self = this, cx = 0, cy = 0;
      this.pts.forEach(function (p, i) {
        var lift = self.amp[i];
        var h = p.peak ? p.h * (1 + 0.55 * lift) : p.h;
        var y = BASE - h;
        d += (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + y.toFixed(2);
        if (p.centre) { cx = p.x; cy = y; }
      });
      this.path.setAttribute('d', d);
      this.dot.setAttribute('cx', cx.toFixed(2));
      this.dot.setAttribute('cy', (cy - 2.6 - 3 * (this.dotLift || 0)).toFixed(2));
    }

    // a swell travels outwards from x (in drawing units); peaks rise as it passes, then settle
    swell(x0, soft, local) {
      if (calm.matches || !this.settled) return;
      var self = this, start = performance.now();
      var speed = soft ? 0.09 : 0.32, width = soft ? 70 : 34, dur = soft ? 2600 : (local ? 900 : 1100);
      cancelAnimationFrame(this.raf);
      var tick = function (now) {
        var t = now - start, front = t * speed, fade = Math.max(0, 1 - t / dur);
        self.pts.forEach(function (p, i) {
          var dist = Math.abs(p.x - x0);
          // a soft bump centred on the travelling front (both directions for a local swell)
          var g = Math.exp(-Math.pow((dist - front) / width, 2));
          self.amp[i] = soft ? Math.sin(Math.min(1, t / dur) * Math.PI) * 0.5 : g * fade;
        });
        self.dotLift = self.amp[self.centreIndex];
        self.render(t);
        if (t < dur) self.raf = requestAnimationFrame(tick);
        else { self.amp = self.amp.map(function () { return 0; }); self.dotLift = 0; self.render(0); }
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
