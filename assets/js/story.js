/* Die Geschichte: Ein paar tausend Punkte formen sich beim Scrollen zu Logo, Sprechblase, Fenster, „0 €“ und Haken.
   Sie weichen dem Mauszeiger aus. Mit „Bewegung aus“ bleibt die Fläche leer und die Seite ist ein ruhiger Text. */
(function () {
  'use strict';
  var c = document.getElementById('teilchen');
  if (!c || !c.getContext) return;
  var x = c.getContext('2d'), html = document.documentElement;
  var kaps = [].slice.call(document.querySelectorAll('[data-form]'));
  var N = window.innerWidth < 700 ? 1500 : 3400, W, H, P = [], maus = { x: -999, y: -999 }, formen = {};
  function groesse() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function punkte(zeichne) {
    var o = document.createElement('canvas'); o.width = o.height = 300;
    var g = o.getContext('2d'); g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
    zeichne(g);
    var d = g.getImageData(0, 0, 300, 300).data, l = [];
    for (var yy = 0; yy < 300; yy += 2) for (var xx = 0; xx < 300; xx += 2) if (d[(yy * 300 + xx) * 4 + 3] > 120) l.push([xx / 300 - .5, yy / 300 - .5]);
    for (var i = l.length - 1; i > 0; i--) { var j = Math.random() * (i + 1) | 0, t = l[i]; l[i] = l[j]; l[j] = t; }
    return l.length ? l : [[0, 0]];
  }
  function rund(g, a, b, w, h, r) { if (g.roundRect) g.roundRect(a, b, w, h, r); else g.rect(a, b, w, h); }
  formen.blase = punkte(function (g) {
    g.beginPath(); rund(g, 30, 50, 240, 150, 34); g.fill();
    g.beginPath(); g.moveTo(80, 195); g.lineTo(70, 255); g.lineTo(140, 198); g.fill();
    g.globalCompositeOperation = 'destination-out';
    [100, 150, 200].forEach(function (cx) { g.beginPath(); g.arc(cx, 125, 13, 0, 7); g.fill(); });
  });
  formen.fenster = punkte(function (g) {
    g.lineWidth = 7; g.beginPath(); rund(g, 20, 45, 260, 210, 18); g.stroke(); g.fillRect(20, 85, 260, 6);
    [40, 62, 84].forEach(function (cx) { g.beginPath(); g.arc(cx, 66, 6, 0, 7); g.fill(); });
    g.fillRect(45, 115, 130, 16); g.fillRect(45, 145, 90, 8); g.fillRect(45, 163, 110, 8);
    g.beginPath(); rund(g, 45, 190, 70, 26, 13); g.fill(); g.beginPath(); rund(g, 195, 115, 60, 100, 10); g.fill();
  });
  formen.haken = punkte(function (g) {
    g.lineWidth = 12; g.beginPath(); g.arc(150, 150, 120, 0, 7); g.stroke();
    g.lineWidth = 26; g.beginPath(); g.moveTo(92, 155); g.lineTo(135, 198); g.lineTo(212, 108); g.stroke();
  });
  function nullForm() {
    formen.null = punkte(function (g) { g.font = '400 190px "Instrument Serif", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0 €', 150, 160); });
  }
  nullForm();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(nullForm);
  /* Für die Seite „Etwas anderes“: Fragezeichen und Herz */
  function frageForm() {
    formen.frage = punkte(function (g) { g.font = '400 300px "Instrument Serif", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 150, 165); });
  }
  frageForm();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(frageForm);
  formen.herz = punkte(function (g) {
    g.beginPath(); g.moveTo(150, 262); g.bezierCurveTo(20, 170, 22, 78, 92, 62); g.bezierCurveTo(124, 55, 144, 76, 150, 100);
    g.bezierCurveTo(156, 76, 176, 55, 208, 62); g.bezierCurveTo(278, 78, 280, 170, 150, 262); g.fill();
  });
  formen.logo = formen.haken;
  var bild = new Image();
  bild.onload = function () {
    formen.logo = punkte(function (g) { var s = Math.min(270 / bild.width, 270 / bild.height), w = bild.width * s, h = bild.height * s; g.drawImage(bild, 150 - w / 2, 150 - h / 2, w, h); });
  };
  bild.src = '/assets/img/lo-weiss.webp';
  for (var i = 0; i < N; i++) P.push({ r: Math.random(), w: Math.random() * 6.283, x: Math.random() * window.innerWidth, y: -40 - Math.random() * 300 });

  function ziel(k) {
    var schmal = W < 860, s = Math.min(W, H) * (schmal ? .58 : .52), cx = W * .5, cy = H * (schmal ? .27 : .5), a = 1, kl = k.classList;
    if (!schmal) { if (kl.contains('links')) cx = W * .72; else if (kl.contains('rechts')) cx = W * .28; }
    if (kl.contains('mitte') || kl.contains('kap-ende')) { a = .3; s *= 1.3; cy = H * .5; }
    return { cx: cx, cy: cy, s: s, a: a, f: formen[k.getAttribute('data-form')] || formen.haken, rot: k.getAttribute('data-form') === 'null' ? 1 : 0 };
  }
  function bild_() {
    requestAnimationFrame(bild_);
    if (html.classList.contains('ruhig') || html.classList.contains('gross-schrift') || document.hidden) { x.clearRect(0, 0, W, H); return; }
    var mitte = H / 2, i0 = kaps.length - 1, t = 0, m = kaps.map(function (k) { var r = k.getBoundingClientRect(); return r.top + r.height / 2; });
    for (var i = 0; i < kaps.length - 1; i++) { if (m[i + 1] > mitte) { i0 = i; break; } }
    if (i0 < kaps.length - 1) { t = (mitte - m[i0]) / (m[i0 + 1] - m[i0]); t = Math.max(0, Math.min(1, (t - .2) / .6)); t = t * t * (3 - 2 * t); }
    var A = ziel(kaps[i0]), B = ziel(kaps[Math.min(i0 + 1, kaps.length - 1)]);
    var letzt = kaps[kaps.length - 1].getBoundingClientRect(), aus = Math.max(0, Math.min(1, (letzt.bottom - H * .25) / (H * .5)));
    var zeit = performance.now() / 1000, wirbel = 4 * t * (1 - t), alpha = (A.a + (B.a - A.a) * t) * aus, rot = A.rot + (B.rot - A.rot) * t;
    x.clearRect(0, 0, W, H);
    if (alpha < .01) return;
    x.fillStyle = 'rgba(' + Math.round(242 + 13 * rot) + ',' + Math.round(240 - 150 * rot) + ',' + Math.round(235 - 189 * rot) + ',' + alpha.toFixed(3) + ')';
    for (var n = 0; n < N; n++) {
      var p = P[n], a = A.f[n % A.f.length], b = B.f[n % B.f.length];
      var ax = A.cx + a[0] * A.s, ay = A.cy + a[1] * A.s, bx = B.cx + b[0] * B.s, by = B.cy + b[1] * B.s, weit = wirbel * (50 + p.r * 170);
      var px = ax + (bx - ax) * t + Math.cos(p.w + zeit * .3) * weit + Math.cos(p.w * 3 + zeit) * 1.4;
      var py = ay + (by - ay) * t + Math.sin(p.w + zeit * .3) * weit + Math.sin(p.w * 2 + zeit * 1.3) * 1.4;
      var dx = px - maus.x, dy = py - maus.y, d = dx * dx + dy * dy;
      if (d < 14000) { var kraft = (1 - d / 14000) * 38 / Math.sqrt(d + 1); px += dx * kraft; py += dy * kraft; }
      p.x += (px - p.x) * .16; p.y += (py - p.y) * .16;
      x.fillRect(p.x, p.y, 1.8, 1.8);
    }
  }
  groesse();
  window.addEventListener('resize', groesse);
  window.addEventListener('pointermove', function (e) { maus.x = e.clientX; maus.y = e.clientY; });
  document.addEventListener('pointerleave', function () { maus.x = -999; });
  requestAnimationFrame(bild_);
})();
