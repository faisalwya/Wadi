/* wadiAssemble(el, fromEl) -> { finish() }
   Builds a line of text out of dashes, once: the text in `el` is hidden, small dashes rise from `fromEl`
   (the cover's landscape) and drift in from across the screen, turning as they fly, and settle into the
   shapes of the letters, filling in in reading direction; then the dashed letters cross-fade into the
   real type. About 1.5 s. finish() ends it at once (used when the visitor enters early).
   The letter shapes are read from the text drawn with the element's own font, so they match the real type.
   If the font is not ready in time, or anything is unsupported, the text simply shows. */
(function () {
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  window.wadiAssemble = function (el, fromEl) {
    var done = false, raf = 0, canvas = null;
    var ctl = { finish: finish };
    el.style.opacity = '0';

    function finish() {
      if (done) return; done = true;
      cancelAnimationFrame(raf);
      if (canvas) canvas.remove();
      el.style.transition = ''; el.style.opacity = '';
    }

    // wait briefly for the font; if it is slow, skip the effect rather than delay the cover
    var fontReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var timeout = new Promise(function (res) { setTimeout(function () { res('late'); }, 1200); });
    Promise.race([fontReady, timeout]).then(function (r) {
      if (done) return;
      if (r === 'late') { finish(); return; }
      try { start(); } catch (e) { finish(); }
    });

    function start() {
      var rect = el.getBoundingClientRect(), cs = getComputedStyle(el), text = el.textContent.trim();
      if (!rect.width || !text) { finish(); return; }
      var rtl = getComputedStyle(document.documentElement).direction === 'rtl';

      // 1. where the letters are: draw the text off screen with the element's font and sample it
      var off = document.createElement('canvas'), W = Math.ceil(rect.width) + 8, H = Math.ceil(rect.height) + 8;
      off.width = W; off.height = H;
      var o = off.getContext('2d', { willReadFrequently: true });
      o.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      o.direction = rtl ? 'rtl' : 'ltr'; o.textAlign = 'center'; o.textBaseline = 'alphabetic';
      var m = o.measureText(text), size = parseFloat(cs.fontSize);
      var asc = m.fontBoundingBoxAscent || size * .8, desc = m.fontBoundingBoxDescent || size * .2;
      var lineH = parseFloat(cs.lineHeight) || size;
      o.fillStyle = '#000';
      o.fillText(text, W / 2, 4 + (lineH - (asc + desc)) / 2 + asc);
      var data = o.getImageData(0, 0, W, H).data, step = 3, pts = [];
      for (var tries = 0; tries < 4; tries++) {
        pts = [];
        for (var y = 0; y < H; y += step) for (var x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 140) pts.push([rect.left - 4 + x, rect.top - 4 + y]);
        }
        if (pts.length <= 1100) break;
        step += 1;                                   // too many: sample more coarsely
      }
      if (pts.length < 40) { finish(); return; }

      // 2. a full-screen layer to fly the dashes on
      var dpr = Math.min(window.devicePixelRatio || 1, 2), VW = window.innerWidth, VH = window.innerHeight;
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.cssText = 'position:fixed;inset:0;width:' + VW + 'px;height:' + VH + 'px;pointer-events:none;z-index:1';
      canvas.width = Math.round(VW * dpr); canvas.height = Math.round(VH * dpr);
      el.parentNode.insertBefore(canvas, el.nextSibling);
      var c = canvas.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var ink = cs.color, dashW = Math.max(2.2, step * .8), dashH = Math.max(1, step * .32);

      // 3. each dash: a start (mostly lifting off the mountains, some from across the screen), a delay in
      //    reading order, a curved path and a turn that ends level
      var fr = fromEl ? fromEl.getBoundingClientRect() : { left: 0, right: VW, top: VH * .6, bottom: VH * .6 };
      var minX = rect.left, spanX = rect.width || 1;
      var parts = pts.map(function (p) {
        var fromLand = Math.random() < .65;
        var sx = fromLand ? fr.left + Math.random() * (fr.right - fr.left) : Math.random() * VW;
        var sy = fromLand ? fr.top + Math.random() * Math.max(10, fr.bottom - fr.top) : Math.random() * VH;
        var order = (p[0] - minX) / spanX; if (rtl) order = 1 - order;
        return { sx: sx, sy: sy, tx: p[0], ty: p[1], lift: 30 + Math.random() * 70, rot: (Math.random() - .5) * Math.PI * 2,
                 delay: order * 420 + Math.random() * 160, dur: 700 + Math.random() * 260 };
      });
      var t0 = performance.now(), FLY = 420 + 160 + 960, FADE = 380;

      function frame(now) {
        if (done) return;
        var t = now - t0;
        c.clearRect(0, 0, VW, VH); c.fillStyle = ink;
        var fade = Math.max(0, Math.min(1, (t - FLY) / FADE));
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i], k = Math.max(0, Math.min(1, (t - p.delay) / p.dur));
          if (k <= 0) continue;
          var e = easeOut(k);
          var x = p.sx + (p.tx - p.sx) * e;
          var y = p.sy + (p.ty - p.sy) * e - p.lift * Math.sin(Math.PI * e) * (1 - e * .4);   // a gentle arc
          var a = p.rot * (1 - e);
          c.globalAlpha = Math.min(1, k * 3) * (1 - fade) * .9;
          c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-dashW / 2, -dashH / 2, dashW, dashH); c.restore();
        }
        if (t >= FLY && !el.style.transition) {        // the real letters take over
          el.style.transition = 'opacity ' + FADE + 'ms ease'; el.style.opacity = '1';
        }
        if (t < FLY + FADE) raf = requestAnimationFrame(frame); else finish();
      }
      raf = requestAnimationFrame(frame);
    }
    return ctl;
  };
})();
