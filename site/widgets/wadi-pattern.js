/* <wadi-pattern motif="lozenge|lattice|line"></wadi-pattern>
   A slim ribbon under the studio name, drawn only with everyday symbols ( ) : ; / \ . < >.
   A small motif repeats along it, loosely recalling a geometric border, and the ribbon
   glides sideways as you scroll (in both directions; it never moves on its own).
   - Plain text, so it stays crisp and costs almost nothing.
   - Still with "reduce motion"; colour follows the site (light/dark).
   - For comparing on a preview, ?pattern=lozenge|lattice|line in the URL overrides the attribute. */
(function () {
  if (customElements.get('wadi-pattern')) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  // each motif: rows of equal length; the ribbon repeats them side by side
  var MOTIFS = {
    // small roundels (:) alternating with diamonds
    lozenge: ['  .  /\\ ',
              ' (:)<  >',
              "  '  \\/ "],
    // crossing diagonals, like a strapwork lattice
    lattice: ['\\../',
              '.><.',
              '/..\\'],
    // a single quiet line
    line:    [' (:) . < > . ']
  };

  class WadiPattern extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      var q = new URLSearchParams(location.search).get('pattern');
      var name = MOTIFS[q] ? q : (MOTIFS[this.getAttribute('motif')] ? this.getAttribute('motif') : 'lozenge');
      this.rowsSrc = MOTIFS[name];
      this.setAttribute('aria-hidden', 'true');
      this.box = document.createElement('div');
      this.box.className = 'rows'; this.box.dir = 'ltr';
      this.append(this.box);
      var self = this, ticking = false;
      new ResizeObserver(function () { self.build(); }).observe(this);
      window.addEventListener('scroll', function () {
        if (calm.matches || ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; self.place(); });
      }, { passive: true });
    }

    build() {
      var W = this.getBoundingClientRect().width;
      if (!W) return;
      var len = this.rowsSrc[0].length;
      // measure one character
      var probe = document.createElement('span'); probe.textContent = 'MMMMMMMMMM';
      this.box.textContent = ''; this.box.append(probe);
      this.cw = probe.getBoundingClientRect().width / 10;
      this.period = len * this.cw;
      var reps = Math.ceil(W / this.period) + 3, rows = [];
      this.rowsSrc.forEach(function (r) { rows.push(r.repeat(reps)); });
      this.box.textContent = rows.join('\n');
      // centre a motif under the middle of the title
      this.base = ((W / 2 - this.period / 2) % this.period) - this.period;
      this.place();
    }

    place() {
      if (!this.period) return;
      var s = calm.matches ? 0 : window.scrollY * 0.35;
      var x = this.base - (s % this.period);
      this.box.style.transform = 'translateX(' + x.toFixed(2) + 'px)';
    }
  }

  customElements.define('wadi-pattern', WadiPattern);
})();
