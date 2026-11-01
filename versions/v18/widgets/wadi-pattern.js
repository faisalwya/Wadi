/* <wadi-pattern></wadi-pattern>
   A slim ornament under the studio name, drawn only with everyday symbols.
   It is built around a centre point and mirrored, denser and darker in the middle,
   thinning and fading towards the ends, with facing brackets )( like links in a chain.

   Movement (never constant; all of it off with "reduce motion"):
   - on arrival it draws itself once, from the centre outwards
   - when you switch tabs, a ripple runs along it: symbols briefly turn into their
     neighbours ( to <, . to :, : to ; ) and settle back
   - tapping it sends a ripple out from where you touched
   - optional "breath": ?breath=1 in the URL (or a breath attribute) runs a soft ripple
     every ~10 s while it is on screen */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  // right half, read outwards from the centre ':'; the left half is its mirror image
  var RIGHT = ') . )( :  .  -   .    .';
  var MIRROR = { '(': ')', ')': '(', '<': '>', '>': '<', '/': '\\', '\\': '/' };
  var NEXT = { '(': '<', ')': '>', '.': ':', ':': ';', '-': '=', '<': '(', '>': ')', ';': ':' };

  function buildLine() {
    var left = RIGHT.split('').reverse().map(function (ch) { return MIRROR[ch] || ch; }).join('');
    return left + ':' + RIGHT;
  }

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.dir = 'ltr';
      var line = buildLine(), mid = (line.length - 1) / 2, self = this;
      this.mid = mid;
      this.cells = line.split('').map(function (ch, i) {
        var s = document.createElement('span'), d = Math.abs(i - mid) / mid;
        s.textContent = ch;
        s.dataset.ch = ch;
        s.style.setProperty('--o', (1 - 0.82 * Math.pow(d, 1.3)).toFixed(3));   // darker in the middle
        s.style.setProperty('--d', Math.round(Math.abs(i - mid) * 22) + 'ms');   // arrival delay, centre first
        self.append(s);
        return s;
      });

      // arrival: draw once, from the centre outwards, when it first comes into view
      var io = new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) {
          self.arrived = true;
          if (calm.matches) self.classList.add('in', 'now');
          else requestAnimationFrame(function () { self.classList.add('in'); });
          setTimeout(function () { self.settled = true; }, 900);
        }
      });
      io.observe(this);

      // ripple when the visitor switches tabs (app.js announces it)
      document.addEventListener('wadi:tab', function () { self.ripple(self.mid); });
      // ripple from where it is tapped
      this.addEventListener('pointerdown', function (e) {
        var r = self.getBoundingClientRect();
        self.ripple(Math.round((e.clientX - r.left) / r.width * (self.cells.length - 1)));
      });
      // optional breath
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.ripple(self.mid, true); }, 10000);
      }
    }

    // symbols turn into their neighbours one after another, spreading out from `from`, then settle back
    ripple(from, soft) {
      if (calm.matches || !this.settled || this.busy) return;
      this.busy = true;
      var self = this, step = soft ? 55 : 32, hold = soft ? 260 : 170, far = 0;
      this.cells.forEach(function (s, i) {
        var ch = s.dataset.ch, alt = NEXT[ch], dist = Math.abs(i - from);
        far = Math.max(far, dist);
        if (!alt) return;
        setTimeout(function () {
          s.textContent = alt; s.classList.add('lit');
          setTimeout(function () { s.textContent = ch; s.classList.remove('lit'); }, hold);
        }, dist * step);
      });
      setTimeout(function () { self.busy = false; }, far * step + hold + 50);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
