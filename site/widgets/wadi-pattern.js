/* <wadi-pattern pattern="wave|diamonds|evolve|beads"></wadi-pattern>
   A slim ornament under the studio name, made only of line-like symbols ( ) / \ | - _ < >
   that join into shapes. The ends fade out.

   Patterns:
   - wave      two rows: one continuous zigzag running along the ribbon
   - diamonds  two rows: a chain of small diamonds
   - evolve    two rows: sparse dashes that gradually build into a dense diamond lattice
   - beads     one row, mirrored: brackets forming diamonds and circles around a centre
   For comparing on a preview, ?pattern=<name> in the URL overrides the attribute.

   Movement (never constant; all of it off with "reduce motion"):
   - on arrival it draws itself once (from the centre, or from where reading starts)
   - when you switch tabs, a ripple runs along it: each column flips (/ to \, < to >,
     ( to ), | to -), turning the shapes inside out for a moment, then settles back
   - tapping it sends the ripple out from where you touched
   - optional "breath": ?breath=1 (or a breath attribute) runs a soft ripple every ~10 s */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function rep(s, n) { return s.repeat(n); }
  // from: where arrival and tab ripples start: 'centre', or 'start' (where reading starts)
  var PATTERNS = {
    wave:     { from: 'start',  rows: [rep(' /\\ ', 9), rep('/  \\', 9)] },
    diamonds: { from: 'centre', rows: [rep('/\\ ', 12), rep('\\/ ', 12)] },
    evolve:   { from: 'start',  rows: ['        _   _  _ _ /\\ /\\/\\/\\/\\/\\/\\/\\/\\',
                                       '-  -  - - -- -- -- \\/ \\/\\/\\/\\/\\/\\/\\/\\/'] },
    beads:    { from: 'centre', rows: ['- () -<>- () -<>-(|)-<>- () -<>- () -'] }
  };
  var FLIP = { '/': '\\', '\\': '/', '<': '>', '>': '<', '|': '-', '-': '|', '(': ')', ')': '(', '_': '-' };

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.dir = 'ltr';
      var q = new URLSearchParams(location.search).get('pattern');
      var name = PATTERNS[q] ? q : (PATTERNS[this.getAttribute('pattern')] ? this.getAttribute('pattern') : 'wave');
      var pat = PATTERNS[name], rows = pat.rows, n = rows[0].length, self = this;
      var rtl = document.documentElement.dir === 'rtl';
      this.mid = (n - 1) / 2;
      this.origin = pat.from === 'centre' ? this.mid : (rtl ? n - 1 : 0);
      this.cols = [];
      this.className = 'p-' + name;
      rows.forEach(function (row, r) {
        var line = document.createElement('div');
        row.split('').forEach(function (ch, i) {
          var s = document.createElement('span');
          var edge = Math.min(i + 1, n - i) / 7;                                   // fade over the last few characters
          var centre = pat.from === 'centre' ? 1 - 0.35 * Math.abs(i - self.mid) / self.mid : 1;
          s.textContent = ch; s.dataset.ch = ch;
          s.style.setProperty('--o', (Math.min(1, edge) * centre * 0.9).toFixed(3));
          s.style.setProperty('--d', Math.round(Math.abs(i - self.origin) * 20 + r * 40) + 'ms');
          line.append(s);
          (self.cols[i] = self.cols[i] || []).push(s);
        });
        self.append(line);
      });

      new IntersectionObserver(function (es) {
        self.onScreen = es[0].isIntersecting;
        if (self.onScreen && !self.arrived) {
          self.arrived = true;
          if (calm.matches) self.classList.add('in', 'now');
          else requestAnimationFrame(function () { self.classList.add('in'); });
          setTimeout(function () { self.settled = true; }, 1200);
        }
      }).observe(this);

      document.addEventListener('wadi:tab', function () { self.ripple(self.origin); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.getBoundingClientRect();
        self.ripple(Math.round((e.clientX - r.left) / r.width * (self.cols.length - 1)));
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.ripple(self.origin, true); }, 10000);
      }
    }

    // each column flips, one after another outwards from `from`, then settles back
    ripple(from, soft) {
      if (calm.matches || !this.settled || this.busy) return;
      this.busy = true;
      var self = this, step = soft ? 45 : 26, hold = soft ? 300 : 200, far = 0;
      this.cols.forEach(function (col, i) {
        var dist = Math.abs(i - from); far = Math.max(far, dist);
        setTimeout(function () {
          col.forEach(function (s) { var alt = FLIP[s.dataset.ch]; if (alt) { s.textContent = alt; s.classList.add('lit'); } });
          setTimeout(function () { col.forEach(function (s) { s.textContent = s.dataset.ch; s.classList.remove('lit'); }); }, hold);
        }, dist * step);
      });
      setTimeout(function () { self.busy = false; }, far * step + hold + 50);
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
