/* <wadi-pattern></wadi-pattern>
   A slim ornament under the studio name: three short rows of line-like symbols
   ( ) / \ | - + < > that join into shapes. At the centre a small radiating star,
     \|/
    (-+-)
     /|\
   and on each side a woven chain of crossing diagonals with diamonds between them.
   Mirrored left/right and top/bottom, darker at the centre and fading to the ends.

   Movement (never constant; all of it off with "reduce motion"):
   - on arrival it draws itself once, from the centre outwards
   - when you switch tabs, a ripple runs out from the centre: each column flips
     (/ to \, < to >, | to -), so the chain turns inside out for a moment and settles back
   - tapping it sends the ripple out from where you touched
   - optional "breath": ?breath=1 in the URL (or a breath attribute) runs a soft ripple
     every ~10 s while it is on screen */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var UNITS = 3;                                                                  // chain links on each side
  var SIDE = { '(': ')', ')': '(', '<': '>', '>': '<', '/': '\\', '\\': '/' };   // left-right mirror
  var UPDOWN = { '/': '\\', '\\': '/' };                                        // top-bottom mirror
  var FLIP = { '/': '\\', '\\': '/', '<': '>', '>': '<', '|': '-', '-': '|', '(': ')', ')': '(' };

  // Columns of the right half as [top, middle]; the left half mirrors them and the
  // bottom row is the top row turned upside down.
  function rightHalf() {
    var cols = [['/', '-'], [' ', ')'], [' ', ' ']];                 // right side of the star, then a gap
    for (var u = 0; u < UNITS; u++) cols.push(['\\', ' '], [' ', '>'], [' ', '<'], ['/', ' ']);  // one crossing link
    cols.push([' ', ' '], [' ', '-']);                                // a short tail
    return cols;
  }
  function grid() {
    var R = rightHalf();
    var L = R.slice().reverse().map(function (c) { return [SIDE[c[0]] || c[0], SIDE[c[1]] || c[1]]; });
    var all = L.concat([['|', '+']], R);
    var top = all.map(function (c) { return c[0]; }).join('');
    var mid = all.map(function (c) { return c[1]; }).join('');
    var bot = top.split('').map(function (ch) { return UPDOWN[ch] || ch; }).join('');
    return [top, mid, bot];
  }

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this.setAttribute('aria-hidden', 'true');
      this.dir = 'ltr';
      var rows = grid(), n = rows[0].length, mid = (n - 1) / 2, self = this;
      this.mid = mid; this.cols = [];
      rows.forEach(function (row, r) {
        var line = document.createElement('div');
        row.split('').forEach(function (ch, i) {
          var s = document.createElement('span'), d = Math.abs(i - mid) / mid;
          s.textContent = ch; s.dataset.ch = ch;
          s.style.setProperty('--o', (1 - 0.78 * Math.pow(d, 1.25)).toFixed(3));                      // darker at the centre
          s.style.setProperty('--d', Math.round(Math.abs(i - mid) * 26 + Math.abs(r - 1) * 45) + 'ms'); // centre first
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
          setTimeout(function () { self.settled = true; }, 1100);
        }
      }).observe(this);

      document.addEventListener('wadi:tab', function () { self.ripple(self.mid); });
      this.addEventListener('pointerdown', function (e) {
        var r = self.getBoundingClientRect();
        self.ripple(Math.round((e.clientX - r.left) / r.width * (self.cols.length - 1)));
      });
      if (this.hasAttribute('breath') || new URLSearchParams(location.search).get('breath') === '1') {
        setInterval(function () { if (self.onScreen && !document.hidden) self.ripple(self.mid, true); }, 10000);
      }
    }

    // each column flips, one after another outwards from `from`, then settles back
    ripple(from, soft) {
      if (calm.matches || !this.settled || this.busy) return;
      this.busy = true;
      var self = this, step = soft ? 55 : 34, hold = soft ? 300 : 200, far = 0;
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
