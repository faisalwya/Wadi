/* <wadi-pattern></wadi-pattern>
   A slim ornament under the studio name: a mountain range built from individual symbols.
   Each symbol is its own piece, placed on the ridge line and tilted to follow it:
   / going up, \ going down, - on flatter ridges, ^ on peak tips and _ on the valley floor.
   Close up you see the pieces; at a glance,
   the range, with the deepest valley (the wadi) at the centre. The ends fade out.

   Movement (never constant; all of it off with "reduce motion"):
   - on arrival the pieces drop into place one after another from where reading starts
   - when you switch tabs, a swell travels through the range: pieces rise and tilt with it,
     and where a slope steepens a - turns into a /, then everything settles back
   - tapping it starts the swell from where you touched
   - optional "breath": ?breath=1 in the URL (or a breath attribute) gives a slow, gentle rise
     and fall every ~10 s while it is on screen */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 220, H = 24, BASE = 20, TOP = 15, STEP = 7.3;   // size (px), valley floor, tallest peak, spacing
  // The range, drawn by hand: [x 0..1, height 0..1]. Not mirrored; the centre drops to the floor.
  var RANGE = [
    [0, .04], [.04, .1], [.07, .07], [.11, .24], [.145, .17], [.2, .5], [.235, .38], [.26, .44], [.31, .16],
    [.355, .62], [.38, .52], [.415, .8], [.5, 0],
    [.565, .92], [.6, .7], [.625, .76], [.68, .28], [.72, .46], [.75, .36], [.8, .54], [.845, .2],
    [.885, .27], [.93, .1], [.965, .13], [1, .04]
  ];
  var SLASH = 62;   // the angle a / is drawn at in a monospace font (degrees)

  function heightAt(u) {           // ridge height (0..1) at u (0..1), straight lines between points
    for (var i = 1; i < RANGE.length; i++) {
      if (u <= RANGE[i][0]) {
        var a = RANGE[i - 1], b = RANGE[i], t = (u - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return RANGE[RANGE.length - 1][1];
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function settle(t) { var c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }  // small overshoot

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      var self = this, rtl = document.documentElement.dir === 'rtl';
      this.rtl = rtl;
      this.n = Math.floor(W / STEP) + 1;
      this.lift = new Array(this.n).fill(0);
      this.box = document.createElement('div'); this.box.className = 'range';
      this.box.style.width = W + 'px'; this.box.style.height = H + 'px';
      if (rtl) this.box.style.transform = 'scaleX(-1)';        // arrive from the reading start
      this.pieces = [];
      for (var i = 0; i < this.n; i++) {
        var s = document.createElement('span');
        this.box.append(s); this.pieces.push(s);
      }
      this.append(this.box);
      this.appear = calm.matches ? 1 : 0;
      this.render(calm.matches ? null : 0);

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) { self.arrived = true; self.arrive(); }
      }).observe(this);

      document.addEventListener('wadi:tab', function () { self.swell(0); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W;
        self.swell(rtl ? W - x : x, false, true);
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.swell(W / 2, true); }, 10000);
      }
    }

    // place every piece on the ridge; `t` is time since arrival started (null = fully arrived)
    render(t) {
      var self = this, n = this.n;
      for (var i = 0; i < n; i++) {
        var x = i * STEP;
        var hy = function (k) {                  // y of the ridge (with swell) near piece k
          var xx = Math.max(0, Math.min(W, x + k));
          var li = self.lift[Math.max(0, Math.min(n - 1, Math.round(xx / STEP)))];
          return BASE - heightAt(xx / W) * TOP * (1 + 0.6 * li);
        };
        var y = hy(0), dy = hy(STEP / 2) - hy(-STEP / 2);
        var ang = Math.atan2(-dy, STEP) * 180 / Math.PI;          // slope angle, up is positive
        var ch, rot, nudge = 0, here = hy(0), left = hy(-STEP), right = hy(STEP);
        if (here < left - 1.2 && here < right - 1.2 && BASE - here > 6) { ch = '^'; rot = 0; nudge = 3.2; }   // a peak's tip
        else if (here > left + 1.2 && here > right + 1.2 && BASE - here < 1.5) { ch = '_'; rot = 0; nudge = -4.5; } // the valley floor
        else if (Math.abs(ang) < 16) { ch = '-'; rot = -ang; }
        else if (ang > 0) { ch = '/'; rot = Math.max(-28, Math.min(28, SLASH - ang)); }
        else { ch = '\\'; rot = Math.max(-28, Math.min(28, -SLASH - ang)); }
        y += nudge;
        var s = this.pieces[i];
        if (s.textContent !== ch) s.textContent = ch;
        var drop = 0, op = 1;
        if (t !== null && t !== undefined) {   // arriving: each piece drops in, in turn
          var p = Math.max(0, Math.min(1, (t - i * 22) / 420));
          drop = (1 - settle(p)) * -7; op = ease(p);
        }
        s.style.opacity = op.toFixed(3);
        s.style.transform = 'translate(' + x.toFixed(2) + 'px,' + (y + drop).toFixed(2) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
      }
    }

    arrive() {
      if (calm.matches) { this.render(null); this.settled = true; return; }
      var self = this, start = performance.now(), total = this.n * 22 + 450;
      var tick = function (now) {
        var t = now - start;
        self.render(t);
        if (t < total) requestAnimationFrame(tick); else { self.render(null); self.settled = true; }
      };
      setTimeout(function () { start = performance.now(); requestAnimationFrame(tick); }, 120);
    }

    // a swell travels outwards from x (in drawing units); the range rises as it passes, then settles
    swell(x0, soft, local) {
      if (calm.matches || !this.settled) return;
      var self = this, start = performance.now();
      var speed = soft ? 0.09 : 0.3, width = soft ? 80 : 30, dur = soft ? 2600 : (local ? 950 : 1150);
      cancelAnimationFrame(this.raf);
      var tick = function (now) {
        var t = now - start, front = t * speed, fade = Math.max(0, 1 - t / dur);
        for (var i = 0; i < self.n; i++) {
          var dist = Math.abs(i * STEP - x0);
          self.lift[i] = soft ? Math.sin(Math.min(1, t / dur) * Math.PI) * 0.5
                              : Math.exp(-Math.pow((dist - front) / width, 2)) * fade;
        }
        self.render(null);
        if (t < dur) self.raf = requestAnimationFrame(tick);
        else { self.lift.fill(0); self.render(null); }
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
