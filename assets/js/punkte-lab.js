/* Pünktchen-Konzepte (interne Testseiten /entwurf-punkte-…/):
   A „Die Unterschrift“  Punkte schreiben das Logo im Kopf und die Unterschrift am Seitenende.
   B „Der Stift“         ein Schwarm Tinte wandert mit und markiert von Hand (unterstreichen, einkreisen, abhaken, Pfeil, Notiz).
   C „Aus Punkten gebaut“ die Punkte bauen eine Website, werden zu jedem Betrieb, der Besucher schreibt selbst mit ihnen.
   Mit „Bewegung aus“ oder „Große Schrift“ bleiben alle Flächen leer; die Seiten funktionieren dann als ruhiger Text. */
(function () {
  'use strict';
  var main = document.querySelector('[data-konzept]');
  if (!main) return;
  var html = document.documentElement, K = main.getAttribute('data-konzept'), handy = window.innerWidth < 700;
  function still() { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift'); }
  function klemme(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function weich(v) { return v * v * (3 - 2 * v); }
  function glocke() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
  function farbe(name, ersatz) { return getComputedStyle(main).getPropertyValue(name).trim() || ersatz; }
  function leinwand(c, w, h) {
    var d = Math.min(window.devicePixelRatio || 1, 2); c.width = Math.round(w * d); c.height = Math.round(h * d);
    var g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); return g;
  }
  function logoBild() { return [].filter.call(document.querySelectorAll('.kopf .marke img'), function (b) { return b.offsetWidth > 0; })[0]; }

  /* Die Initialen „lo“ in Schreibrichtung: Jeder Bildpunkt des Logos bekommt die Stelle (0 bis 1), an der der Stift dort vorbeikommt. */
  var WEG = [[2, 146], [25, 134], [47, 116], [72, 78], [98, 40], [111, 14], [104, 3], [86, 12], [68, 38], [52, 65], [40, 95], [31, 122], [35, 143], [50, 152], [66, 147], [82, 130],
    [97, 108], [115, 93], [135, 90], [150, 100], [153, 118], [143, 138], [122, 151], [104, 147], [94, 130], [100, 110], [156, 108], [172, 113], [186, 108], [197, 100]], SPRUNG = 25;
  var LO = null, loWart = [];
  function ladeLo(cb) {
    if (LO) { cb(LO); return; }
    loWart.push(cb); if (loWart.length > 1) return;
    var b = new Image();
    b.onload = function () {
      var c = document.createElement('canvas'); c.width = 199; c.height = 160;
      var g = c.getContext('2d'); g.drawImage(b, 0, 0, 199, 160);
      var d = g.getImageData(0, 0, 199, 160).data, l = [], seg = [], ges = 0, i;
      for (i = 0; i < WEG.length - 1; i++) { var L = i === SPRUNG ? 0 : Math.hypot(WEG[i + 1][0] - WEG[i][0], WEG[i + 1][1] - WEG[i][1]); seg.push([ges, L]); ges += L; }
      for (var y = 0; y < 160; y++) for (var x = 0; x < 199; x++) if (d[(y * 199 + x) * 4 + 3] > 110) {
        var best = 1e9, t = 0;
        for (i = 0; i < seg.length; i++) {
          if (i === SPRUNG) continue;
          var a = WEG[i], e = WEG[i + 1], dx = e[0] - a[0], dy = e[1] - a[1], q = klemme(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)), ex = a[0] + dx * q - x, ey = a[1] + dy * q - y, dd = ex * ex + ey * ey;
          if (dd < best) { best = dd; t = (seg[i][0] + seg[i][1] * q) / ges; }
        }
        l.push([x / 199 - .5, (y - 80) / 199, t]);
      }
      l.sort(function (p, q) { return p[2] - q[2]; });
      LO = l; loWart.forEach(function (f) { f(l); });
    };
    b.src = '/assets/img/lo-weiss.webp';
  }

  /* ================================================================ A: Die Unterschrift */
  function schreiber(c, opt) {
    var g, W, H, P = [], lo = null, start = 0, lauf = false, fertig = false, maus = { x: -999, y: -999 };
    function mass() {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !lo) return;
      g = leinwand(c, W, H);
      var s = Math.min(W - opt.rand * 2, (H - opt.rand * 2) * 199 / 160); P = [];
      for (var i = 0; i < opt.n; i++) {
        var q = lo[Math.min(lo.length - 1, (i + Math.random()) / opt.n * lo.length | 0)];
        P.push({ u: q[2], hx: W / 2 + q[0] * s, hy: H / 2 + q[1] * s, x: 0, y: 0, ox: (Math.random() - .5) * opt.streu, oy: (Math.random() - .7) * opt.streu, w: Math.random() * 6.28 });
      }
    }
    function bild(jetzt) {
      if (!lauf) return;
      requestAnimationFrame(bild);
      if (!g) return;
      g.clearRect(0, 0, W, H);
      if (still()) return;
      var p = (jetzt - start) / opt.dauer, zeit = jetzt / 1000;
      g.fillStyle = farbe('--ink', '#10213a');
      for (var i = 0; i < P.length; i++) {
        var q = P[i], k = klemme((p - q.u) * opt.dauer / 260);
        if (k <= 0) continue;
        var e = 1 - (1 - k) * (1 - k), tx = q.hx + q.ox * (1 - e) + Math.cos(q.w + zeit) * opt.atem, ty = q.hy + q.oy * (1 - e) + Math.sin(q.w * 2 + zeit * 1.2) * opt.atem;
        var dx = tx - maus.x, dy = ty - maus.y, d = dx * dx + dy * dy;
        if (d < opt.radius) { var f = (1 - d / opt.radius) * opt.kraft / Math.sqrt(d + 1); tx += dx * f; ty += dy * f; }
        if (k < 1) { q.x = tx; q.y = ty; g.globalAlpha = k; } else { q.x += (tx - q.x) * .16; q.y += (ty - q.y) * .16; }
        g.fillRect(q.x, q.y, opt.punkt, opt.punkt);
        if (k < 1) g.globalAlpha = 1;
      }
      if (!fertig && p > 1.3) { fertig = true; if (opt.danach) opt.danach(); }
    }
    ladeLo(function (l) { lo = l; mass(); if (opt.bereit) opt.bereit(); });
    window.addEventListener('resize', mass);
    window.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); maus.x = e.clientX - r.left; maus.y = e.clientY - r.top; });
    return {
      los: function () { if (!P.length) mass(); start = performance.now(); fertig = false; if (!lauf) { lauf = true; requestAnimationFrame(bild); } },
      halt: function () { lauf = false; if (g) g.clearRect(0, 0, W, H); }
    };
  }
  function konzeptA() {
    /* Briefkopf: Das Logo oben wird einmal von den Punkten geschrieben, dann steht es fest da. */
    var b = logoBild();
    if (b && !still()) {
      var marke = b.parentNode, cv = document.createElement('canvas'), kopf;
      cv.className = 'pk-logo'; cv.setAttribute('aria-hidden', 'true');
      marke.style.position = 'relative';
      cv.style.cssText = 'left:' + (b.offsetLeft - 8) + 'px;top:' + (b.offsetTop - 8) + 'px;width:' + (b.offsetWidth + 16) + 'px;height:' + (b.offsetHeight + 16) + 'px';
      marke.appendChild(cv);
      var schreibe = function () { b.style.transition = 'none'; b.style.opacity = 0; cv.style.transition = 'none'; cv.style.opacity = 1; kopf.los(); };
      kopf = schreiber(cv, { n: 620, rand: 8, dauer: 1300, punkt: 1.25, streu: 14, atem: 0, radius: 0, kraft: 0,
        bereit: function () { setTimeout(schreibe, 350); },
        danach: function () { b.style.transition = cv.style.transition = 'opacity .45s'; b.style.opacity = 1; cv.style.opacity = 0; setTimeout(kopf.halt, 500); } });
      marke.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && b.style.opacity === '1') schreibe(); });
    }
    /* Unterschrift: Am Ende der Seite schreiben die Punkte die Initialen, jedes Mal, wenn man dort ankommt. */
    var feld = main.querySelector('[data-pk-sign]');
    if (feld && 'IntersectionObserver' in window) {
      var sign = schreiber(feld, { n: handy ? 2300 : 3200, rand: 18, dauer: 2100, punkt: handy ? 1.5 : 1.8, streu: 30, atem: .6, radius: 9000, kraft: 34 });
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) sign.los(); else sign.halt(); }, { threshold: .45 }).observe(feld);
    }
  }

  /* ================================================================ B: Der Stift */
  function konzeptB() {
    var c = document.getElementById('pk-stift'), g, W, H, N = handy ? 1300 : 1800, P = [], maus = { x: -999, y: -999 }, i;
    var marken = [].map.call(main.querySelectorAll('[data-stift]'), function (el) { var t = el.getAttribute('data-stift').split(':'); return { el: el, typ: t[0], name: t[1], pts: null }; });
    if (!c || !marken.length) return;
    var quelle = { el: logoBild() || marken[0].el, typ: 'lo', pts: null }, akt = quelle, vor = quelle, T0 = 0, sperre = performance.now() + 700, DAUER = 620, FLUG = 430, tx = 0, ty = 0;
    function mass() { W = window.innerWidth; H = window.innerHeight; g = leinwand(c, W, H); }
    for (i = 0; i < N; i++) P.push({ u: i / N, j1: glocke(), j2: glocke(), x: -9999, y: 0, b: 12 + Math.random() * 46, m: 0 });
    /* Aus allen Bildpunkten einer Form genau N zufällig ziehen und in Schreibrichtung ordnen: Punkt Nummer n gehört dann zu Teilchen Nummer n. */
    function stich(l) { var a = []; for (var n = 0; n < N; n++) a.push(l[Math.random() * l.length | 0]); a.sort(function (p, q) { return p[2] - q[2]; }); return a; }
    ladeLo(function (l) { quelle.pts = stich(l); marken.forEach(function (m) { if (m.typ === 'lo') m.pts = stich(l); }); });
    marken.forEach(function (m) {
      if (m.typ !== 'bild') return;
      var b = new Image();
      b.onload = function () {
        var w = 440, h = Math.round(w * b.height / b.width), o = document.createElement('canvas'); o.width = w; o.height = h;
        var k = o.getContext('2d'); k.drawImage(b, 0, 0, w, h);
        var d = k.getImageData(0, 0, w, h).data, l = [];
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 120) l.push([x / w - .5, (y - h / 2) / w, x]);
        m.pts = stich(l);
      };
      b.src = '/assets/img/ht-n-' + m.name + '.webp';
    });
    /* Jede Marke ist ein Strich wie mit dem Stift gezogen: Punkte [x, y, gezeichnet?] im Fenster, neu berechnet in jedem Bild, damit sie am Text kleben. */
    function geo(m) {
      var r = m.el.getBoundingClientRect(), o = { dick: 1.5, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }, L = [], s, e, n;
      if (m.typ === 'unter') {
        var zeilen = m.el.getClientRects(), z;   /* bei Umbruch jede Zeile einzeln unterstreichen */
        for (var k = 0; k < zeilen.length; k++) { z = zeilen[k]; for (n = 0; n <= 18; n++) { s = n / 18; L.push([z.left - 4 + (z.width + 10) * s, z.bottom + 1 + Math.sin(s * 4.2 + k) * 2.5 - s * 3, n ? 1 : 0]); } }
        if (z) for (n = 1; n <= 12; n++) { s = 1 - n / 12 * .55; L.push([z.left + (z.width + 4) * s, z.bottom + 8 + Math.sin(s * 5 + 1) * 2 - s * 3, 1]); }
        o.dick = 1.7;
      } else if (m.typ === 'kreis') {
        var rx = r.width / 2 + 20, ry = r.height / 2 + 5;
        for (n = 0; n <= 44; n++) { s = n / 44; var a = -2.5 + s * 7.1, f = .95 + s * .12, px = Math.cos(a) * rx * f, py = Math.sin(a) * ry * f; L.push([o.cx + px + py * .1, o.cy + py - px * .05, n ? 1 : 0]); }
      } else if (m.typ === 'haken') {
        [].forEach.call(m.el.children, function (li) { var q = li.getBoundingClientRect(), x0 = q.left + 2, y0 = q.top + 16; L.push([x0, y0 + 1, 0], [x0 + 11, y0 + 13, 1], [x0 + 34, y0 - 14, 1]); });
        o.dick = 2.1;
      } else if (m.typ === 'pfeil') {
        var my = r.top + r.height / 2, tip, p0, cp, h1, h2;
        if (r.right + 160 < W) { tip = [r.right + 16, my]; p0 = [r.right + 132, r.top - 44]; cp = [r.right + 138, my + 24]; h1 = [tip[0] + 23, tip[1] - 15]; h2 = [tip[0] + 22, tip[1] + 16]; }
        else { tip = [r.left + r.width * .5, r.top - 12]; p0 = [r.left + r.width * .84, r.top - 76]; cp = [r.left + r.width * .44, r.top - 80]; h1 = [tip[0] - 16, tip[1] - 16]; h2 = [tip[0] + 15, tip[1] - 18]; }
        for (n = 0; n <= 20; n++) { s = n / 20; e = 1 - s; L.push([e * e * p0[0] + 2 * e * s * cp[0] + s * s * tip[0], e * e * p0[1] + 2 * e * s * cp[1] + s * s * tip[1], n ? 1 : 0]); }
        L.push([h1[0], h1[1], 0], [tip[0], tip[1], 1], [h2[0], h2[1], 1]); o.dick = 1.8;
      } else { o.pts = m.pts; o.s = m.typ === 'lo' ? Math.min(r.width, r.height * 199 / 160) * .92 : r.width; return o; }
      o.L = L; o.cum = [0]; for (n = 1; n < L.length; n++) o.cum.push(o.cum[n - 1] + (L[n][2] ? Math.hypot(L[n][0] - L[n - 1][0], L[n][1] - L[n - 1][1]) : 0));
      o.ges = o.cum[L.length - 1];
      return o;
    }
    function ort(o, p) {
      if (o.L) {
        var z = p.u * o.ges, L = o.L, n = 1;
        while (n < L.length - 1 && (!L[n][2] || o.cum[n] < z)) n++;
        var a = L[n - 1], b = L[n], q = (z - o.cum[n - 1]) / ((o.cum[n] - o.cum[n - 1]) || 1);
        tx = a[0] + (b[0] - a[0]) * q + p.j1 * o.dick; ty = a[1] + (b[1] - a[1]) * q + p.j2 * o.dick; return;
      }
      if (!o.pts) { tx = o.cx; ty = o.cy; return; }
      var t = o.pts[Math.min(o.pts.length - 1, Math.round(p.u * o.pts.length))]; tx = o.cx + t[0] * o.s + p.j1 * .5; ty = o.cy + t[1] * o.s + p.j2 * .5;
    }
    /* Der Stift ist immer bei der Marke, die gerade am nächsten an der Bildschirmmitte steht. */
    function waehle(jetzt) {
      if (jetzt < sperre) return;
      var best = akt, bd = 1e9, unten = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 30;
      marken.forEach(function (m, n) {
        var r = m.el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - H * .5) - (m === akt ? 70 : 0);
        if (unten && n === marken.length - 1) d = -1e6;
        if (d < bd) { bd = d; best = m; }
      });
      if (best !== akt) { vor = akt; akt = best; T0 = jetzt; sperre = jetzt + 450; }
    }
    function bild(jetzt) {
      requestAnimationFrame(bild);
      g.clearRect(0, 0, W, H);
      if (still() || document.hidden) return;
      waehle(jetzt);
      var A = geo(vor), Z = geo(akt);
      g.fillStyle = farbe('--accent', '#d4380d');
      for (var n = 0; n < N; n++) {
        var p = P[n], k = klemme((jetzt - T0 - p.u * DAUER) / FLUG), e = weich(k), zx, zy;
        if (k < 1) { ort(A, p); zx = tx; zy = ty; }
        if (k > 0) { ort(Z, p); if (k < 1) { zx += (tx - zx) * e; zy += (ty - zy) * e - Math.sin(e * 3.1416) * p.b; } else { zx = tx; zy = ty; } }
        var dx = zx - maus.x, dy = zy - maus.y, d = dx * dx + dy * dy;
        if (d < 5200) { var f = (1 - d / 5200) * 22 / Math.sqrt(d + 1); zx += dx * f; zy += dy * f; p.m = 14; }
        if (p.x < -9000 || (k >= 1 && p.m <= 0)) { p.x = zx; p.y = zy; } else { p.x += (zx - p.x) * .3; p.y += (zy - p.y) * .3; if (p.m > 0) p.m--; }
        g.fillRect(p.x, p.y, 2, 2);
      }
    }
    mass();
    window.addEventListener('resize', mass);
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { maus.x = e.clientX; maus.y = e.clientY; } });
    requestAnimationFrame(bild);
  }

  /* ================================================================ C: Aus Punkten gebaut */
  function konzeptC() {
    var c = document.getElementById('pk-stoff'), g, W, H, N = handy ? 2300 : 5400, P = [], maus = { x: -999, y: -999 }, formen = {}, i;
    if (!c) return;
    var szenen = [].map.call(main.querySelectorAll('[data-szene]'), function (el) { return { el: el, name: el.getAttribute('data-szene'), platz: el.querySelector('[data-platz]') || el, seit: 0 }; });
    var art = 'praxis', selbst = false, dom = -1, freiTab = null, striche = [], zeichnet = false, letzt = 0, tx = 0, ty = 0, staub = false;
    function mass() { W = window.innerWidth; H = window.innerHeight; g = leinwand(c, W, H); }
    function punkte(zeichne, stufe) {
      var o = document.createElement('canvas'); o.width = o.height = 300;
      var k = o.getContext('2d'); k.fillStyle = k.strokeStyle = '#fff'; k.lineCap = k.lineJoin = 'round';
      zeichne(k);
      var d = k.getImageData(0, 0, 300, 300).data, l = [];
      for (var y = 0; y < 300; y += 2) for (var x = 0; x < 300; x += 2) if (d[(y * 300 + x) * 4 + 3] > 120) l.push([x / 300 - .5, y / 300 - .5, stufe || 0]);
      return l.length ? l : [[0, 0, 0]];
    }
    function misch(l) { for (var n = l.length - 1; n > 0; n--) { var j = Math.random() * (n + 1) | 0, t = l[n]; l[n] = l[j]; l[j] = t; } return l; }
    function rund(k, a, b, w, h, r) { k.beginPath(); if (k.roundRect) k.roundRect(a, b, w, h, r); else k.rect(a, b, w, h); }
    function zeichen(z, px, dy) { return misch(punkte(function (k) { k.font = '400 ' + px + 'px "Instrument Serif", Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(z, 150, 150 + dy); })); }
    /* Die Website, die sich Stück für Stück aufbaut: Rahmen, Leiste, Überschrift, Text, Knopf, Bild */
    formen.bau = misch([].concat(
      punkte(function (k) { k.lineWidth = 7; rund(k, 20, 45, 260, 210, 18); k.stroke(); }, 0),
      punkte(function (k) { k.fillRect(20, 85, 260, 6); [40, 62, 84].forEach(function (x) { k.beginPath(); k.arc(x, 66, 6, 0, 7); k.fill(); }); }, 1),
      punkte(function (k) { k.fillRect(45, 112, 130, 18); }, 2),
      punkte(function (k) { k.fillRect(45, 145, 90, 8); k.fillRect(45, 163, 110, 8); }, 3),
      punkte(function (k) { rund(k, 45, 192, 76, 28, 14); k.fill(); }, 4),
      punkte(function (k) { rund(k, 195, 112, 62, 108, 10); k.fill(); }, 5)));
    formen.praxis = misch(punkte(function (k) { rund(k, 112, 40, 76, 220, 18); k.fill(); rund(k, 40, 112, 220, 76, 18); k.fill(); }));
    formen.psychotherapie = misch(punkte(function (k) {
      rund(k, 30, 50, 240, 150, 34); k.fill(); k.beginPath(); k.moveTo(80, 195); k.lineTo(70, 255); k.lineTo(140, 198); k.fill();
      k.globalCompositeOperation = 'destination-out'; [100, 150, 200].forEach(function (x) { k.beginPath(); k.arc(x, 125, 13, 0, 7); k.fill(); });
    }));
    formen.handwerk = misch(punkte(function (k) { k.translate(150, 150); k.rotate(.72); rund(k, -17, -70, 34, 205, 10); k.fill(); rund(k, -88, -128, 176, 66, 12); k.fill(); k.fillRect(-116, -110, 30, 30); }));
    formen.restaurant = misch(punkte(function (k) {
      [70, 94, 118].forEach(function (x) { rund(k, x, 30, 12, 92, 6); k.fill(); }); rund(k, 70, 104, 60, 40, 18); k.fill(); rund(k, 91, 130, 18, 142, 9); k.fill();
      k.beginPath(); k.moveTo(196, 28); k.quadraticCurveTo(246, 80, 232, 168); k.lineTo(196, 168); k.closePath(); k.fill(); rund(k, 196, 160, 20, 112, 9); k.fill();
    }));
    function schrift() { formen.kanzlei = zeichen('§', 290, 6); formen.sonstiges = zeichen('?', 300, 14); formen.null = zeichen('0 €', 190, 10); }
    schrift();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schrift);
    /* Vorgabe im Schreibfeld: eine Schleifenlinie, wie beim Einschreiben eines Stifts */
    formen.frei = (function () { var l = []; for (var n = 0; n < 900; n++) { var t = n / 900 * 31.4; l.push([(t - 2.1 * Math.sin(t)) / 31.4 - .5, -Math.cos(t) * .075, 0]); } return l; })();
    ladeLo(function (l) { formen.lo = l; });
    for (i = 0; i < N; i++) P.push({ r: Math.random(), r2: Math.random(), w: Math.random() * 6.283, j1: glocke(), j2: glocke(), s: 1.1 + Math.pow(Math.random(), 2.2) * 1.7, x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: 0, vy: 0 });

    function ziel(sz) {
      var r = sz.platz.getBoundingClientRect(), o = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, s: Math.min(r.width, r.height), b: r.width, n: sz.name, seit: sz.seit, rot: sz.name === 'null' ? 1 : 0 };
      o.f = sz.name === 'arten' ? formen[art] : formen[sz.name];
      if (sz.name === 'lo') o.s = Math.min(r.width, r.height * 199 / 160) * .95;
      return o;
    }
    function ort(o, p, n, jetzt, zeit) {
      var q, f = o.f; staub = false;
      if (o.n === 'frei' && freiTab) { q = freiTab[Math.min(freiTab.length - 1, p.r2 * freiTab.length | 0)]; tx = o.cx + q[0] + p.j1 * 2.6; ty = o.cy + q[1] + p.j2 * 2.6; return; }
      if (!f) staub = true;
      else if (o.n === 'lo') { q = f[Math.min(f.length - 1, p.r2 * f.length | 0)]; staub = q[2] > (jetzt - o.seit - 350) / 2300; }
      else if (o.n === 'frei') q = f[n % f.length];
      else { q = f[n % f.length]; if (o.n === 'bau') staub = q[2] > (jetzt - o.seit - 300) / 620; }
      if (staub) { tx = o.cx + Math.cos(p.w + zeit * (.1 + p.r * .22)) * o.s * (.2 + p.r * .8); ty = o.cy + Math.sin(p.w * 1.7 + zeit * (.08 + p.r * .16)) * o.s * (.2 + p.r * .62); return; }
      var s = o.n === 'frei' ? o.b * .8 : o.s; tx = o.cx + q[0] * s; ty = o.cy + q[1] * s;
    }
    var SX = new Float32Array(N), SY = new Float32Array(N), SS = new Float32Array(N);
    function bild(jetzt) {
      requestAnimationFrame(bild);
      g.clearRect(0, 0, W, H);
      if (still() || document.hidden) return;
      var mitte = H / 2, i0 = szenen.length - 1, t = 0, m = szenen.map(function (s) { var r = s.el.getBoundingClientRect(); return r.top + r.height / 2; }), n;
      for (n = 0; n < szenen.length - 1; n++) { if (m[n + 1] > mitte) { i0 = n; break; } }
      if (i0 < szenen.length - 1) { t = (mitte - m[i0]) / (m[i0 + 1] - m[i0]); t = klemme((t - .2) / .6); t = weich(t); }
      var i1 = Math.min(i0 + 1, szenen.length - 1), d0 = t < .5 ? i0 : i1;
      if (d0 !== dom) { dom = d0; szenen[dom].seit = jetzt; }
      var A = ziel(szenen[i0]), Z = ziel(szenen[i1]), zeit = jetzt / 1000, wirbel = 4 * t * (1 - t), rot = A.rot + (Z.rot - A.rot) * t, ns = 0;
      g.fillStyle = 'rgb(' + Math.round(242 + 13 * rot) + ',' + Math.round(240 - 150 * rot) + ',' + Math.round(235 - 189 * rot) + ')';
      g.globalAlpha = .92;
      for (n = 0; n < N; n++) {
        var p = P[n], zx, zy, st;
        ort(A, p, n, jetzt, zeit); zx = tx; zy = ty; st = staub;
        if (t > 0) { ort(Z, p, n, jetzt, zeit); zx += (tx - zx) * t; zy += (ty - zy) * t; if (t >= .5) st = staub; }
        var weit = wirbel * (40 + p.r * 190);
        zx += Math.cos(p.w + zeit * .3) * weit + Math.cos(p.w * 3 + zeit) * 1.3; zy += Math.sin(p.w + zeit * .3) * weit + Math.sin(p.w * 2 + zeit * 1.3) * 1.3;
        var dx = p.x - maus.x, dy = p.y - maus.y, d = dx * dx + dy * dy;
        if (d < 15000) { var k = (1 - d / 15000) * 2.4 / Math.sqrt(d + 1); p.vx += dx * k; p.vy += dy * k; }
        p.vx = (p.vx + (zx - p.x) * .055) * .8; p.vy = (p.vy + (zy - p.y) * .055) * .8; p.x += p.vx; p.y += p.vy;
        if (st) { SX[ns] = p.x; SY[ns] = p.y; SS[ns++] = p.s; } else g.fillRect(p.x, p.y, p.s, p.s);
      }
      g.globalAlpha = .3;
      for (n = 0; n < ns; n++) g.fillRect(SX[n], SY[n], SS[n], SS[n]);
      g.globalAlpha = 1;
    }
    /* Betriebsarten: zeigen, antippen oder einfach warten */
    var knoepfe = [].slice.call(main.querySelectorAll('.pk-arten button'));
    function waehle(b) { art = b.getAttribute('data-form'); knoepfe.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); }
    knoepfe.forEach(function (b) {
      b.addEventListener('click', function () { selbst = true; waehle(b); });
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { selbst = true; waehle(b); } });
      b.addEventListener('focus', function () { waehle(b); });
    });
    setInterval(function () {
      if (selbst || still() || dom < 0 || szenen[dom].name !== 'arten') return;
      var n = 0; knoepfe.forEach(function (b, k) { if (b.getAttribute('aria-pressed') === 'true') n = k; }); waehle(knoepfe[(n + 1) % knoepfe.length]);
    }, 2400);
    /* Schreibfeld: Der Besucher zieht eine Linie, die Punkte folgen ihr. */
    var feld = main.querySelector('[data-pk-feld]');
    function tabelle() {
      var seg = [], ges = 0, eins = null;
      striche.forEach(function (s) { if (s.length) eins = s[0]; for (var n = 1; n < s.length; n++) { var L = Math.hypot(s[n][0] - s[n - 1][0], s[n][1] - s[n - 1][1]); seg.push([s[n - 1], s[n], L]); ges += L; } });
      if (!seg.length) { freiTab = eins ? [eins] : null; return; }
      var M = 800, si = 0, bis = seg[0][2], vorher = 0, l = [];
      for (var k = 0; k < M; k++) {
        var z = k / (M - 1) * ges;
        while (si < seg.length - 1 && z > bis) { vorher = bis; si++; bis += seg[si][2]; }
        var q = klemme((z - vorher) / (seg[si][2] || 1)), a = seg[si][0], b = seg[si][1];
        l.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]);
      }
      freiTab = l;
    }
    function hin(e) {
      var r = feld.getBoundingClientRect(), s = striche[striche.length - 1], px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2, l = s[s.length - 1];
      if (!l || Math.hypot(px - l[0], py - l[1]) > 3) { s.push([px, py]); tabelle(); }
    }
    if (feld) {
      feld.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button')) return;
        e.preventDefault(); try { feld.setPointerCapture(e.pointerId); } catch (x) {}
        if (performance.now() - letzt > 2500) striche = [];
        striche.push([]); zeichnet = true; feld.classList.add('benutzt'); hin(e);
      });
      feld.addEventListener('pointermove', function (e) { if (zeichnet) hin(e); });
      ['pointerup', 'pointercancel'].forEach(function (n) { feld.addEventListener(n, function () { zeichnet = false; letzt = performance.now(); }); });
      var neu = feld.querySelector('[data-pk-neu]');
      if (neu) neu.addEventListener('click', function () { striche = []; freiTab = null; feld.classList.remove('benutzt'); });
    }
    /* Klick oder Tipp irgendwo: Die Punkte stieben auseinander, die Website baut sich neu. */
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('[data-pk-feld],a,button')) return;
      for (var n = 0; n < N; n++) { var p = P[n], dx = p.x - e.clientX, dy = p.y - e.clientY, d = Math.sqrt(dx * dx + dy * dy) + 1; if (d < 320) { var k = (1 - d / 320) * 30 / d; p.vx += dx * k; p.vy += dy * k; } }
      if (dom >= 0 && (szenen[dom].name === 'bau' || szenen[dom].name === 'lo')) szenen[dom].seit = performance.now() + 250;
    });
    mass();
    window.addEventListener('resize', mass);
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { maus.x = e.clientX; maus.y = e.clientY; } });
    document.addEventListener('pointerleave', function () { maus.x = -999; });
    requestAnimationFrame(bild);
  }

  if (K === 'a') konzeptA(); else if (K === 'b') konzeptB(); else if (K === 'c') konzeptC();
})();
