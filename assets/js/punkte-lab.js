/* Pünktchen-Konzepte (interne Testseiten /entwurf-punkte-…/), zweite Runde:
   In allen drei Konzepten baut sich das Logo im Kopf aus Punkten auf, die Unterschrift am Ende bleibt stehen, ein Pfeil zeigt auf den Knopf.
   A „Brief und Unterschrift“      sonst ruhig; am Ende große Unterschrift auf hellem Grund.
   B „Mit dem Stift durchgegangen“ dazu Handmarken in Dunkelblau, die stehen bleiben; am Ende dunkle Bühne mit riesiger Unterschrift.
   C „Aus Punkten gebaut“          dunkle Bühne schiebt sich über den Hero, die Website baut sich beim Scrollen vom Boden auf.
   Nichts startet neu: Alles wird einmal geschrieben oder hängt direkt am Scrollen.
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

  /* ================================================================ Schreiber: Punkte schreiben die Initialen einmal in Schreibrichtung, dann bleiben sie stehen. */
  function schreiber(c, opt) {
    var g, W, H, P = [], lo = null, start = 0, lauf = false, fertig = false, maus = { x: -999, y: -999 }, punkt = 1.8, ton = '#10213a';
    function mass() {
      var r = c.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !lo) return;
      g = leinwand(c, W, H); ton = getComputedStyle(c).color;
      var s = Math.min(W - opt.rand * 2, (H - opt.rand * 2) * 199 / 160), n = opt.n || Math.max(600, Math.min(9500, Math.round(s * s / 62)));
      punkt = opt.punkt || (s > 560 ? 2.3 : 1.8); P = [];
      for (var i = 0; i < n; i++) {
        var q = lo[Math.min(lo.length - 1, (i + Math.random()) / n * lo.length | 0)];
        P.push({ u: q[2], hx: W / 2 + (q[0] + (Math.random() - .5) / 199) * s, hy: H / 2 + (q[1] + (Math.random() - .5) / 199) * s, x: 0, y: 0, ox: (Math.random() - .5) * opt.streu, oy: (Math.random() - .7) * opt.streu, w: Math.random() * 6.28 });
      }
    }
    function bild(jetzt) {
      if (!lauf) return;
      requestAnimationFrame(bild);
      if (!g) return;
      g.clearRect(0, 0, W, H);
      if (still()) return;
      var p = (jetzt - start) / opt.dauer, zeit = jetzt / 1000, grund = opt.alpha || 1;
      g.fillStyle = ton; g.globalAlpha = grund;
      for (var i = 0; i < P.length; i++) {
        var q = P[i], k = klemme((p - q.u) * opt.dauer / 260);
        if (k <= 0) continue;
        var e = 1 - (1 - k) * (1 - k), tx = q.hx + q.ox * (1 - e) + Math.cos(q.w + zeit) * opt.atem, ty = q.hy + q.oy * (1 - e) + Math.sin(q.w * 2 + zeit * 1.2) * opt.atem;
        var dx = tx - maus.x, dy = ty - maus.y, d = dx * dx + dy * dy;
        if (d < opt.radius) { var f = (1 - d / opt.radius) * opt.kraft / Math.sqrt(d + 1); tx += dx * f; ty += dy * f; }
        if (k < 1) { q.x = tx; q.y = ty; g.globalAlpha = grund * k; } else { q.x += (tx - q.x) * .16; q.y += (ty - q.y) * .16; }
        g.fillRect(q.x, q.y, punkt, punkt);
        if (k < 1) g.globalAlpha = grund;
      }
      g.globalAlpha = 1;
      if (!fertig && p > 1.25) { fertig = true; if (opt.danach) opt.danach(); }
    }
    ladeLo(function (l) { lo = l; mass(); if (opt.bereit) opt.bereit(); });
    window.addEventListener('resize', mass);
    if (opt.radius) window.addEventListener('pointermove', function (e) { if (!lauf) return; var r = c.getBoundingClientRect(); maus.x = e.clientX - r.left; maus.y = e.clientY - r.top; });
    return {
      /* sichtbar(true) schreibt beim ersten Mal und läuft danach nur weiter; sichtbar(false) hält an, ohne etwas zu löschen */
      sichtbar: function (an) { if (!an) { lauf = false; return; } if (!P.length) mass(); if (!start) start = performance.now(); if (!lauf) { lauf = true; requestAnimationFrame(bild); } },
      halt: function () { lauf = false; if (g) g.clearRect(0, 0, W, H); }
    };
  }
  /* Briefkopf: Das Logo oben baut sich einmal aus Punkten auf, dann steht es fest da. */
  function kopfLogo() {
    var b = logoBild();
    if (!b || still()) return;
    var marke = b.parentNode, cv = document.createElement('canvas'), kopf;
    cv.className = 'pk-logo'; cv.setAttribute('aria-hidden', 'true');
    marke.style.position = 'relative';
    cv.style.cssText = 'left:' + (b.offsetLeft - 8) + 'px;top:' + (b.offsetTop - 8) + 'px;width:' + (b.offsetWidth + 16) + 'px;height:' + (b.offsetHeight + 16) + 'px';
    marke.appendChild(cv);
    kopf = schreiber(cv, { n: 640, rand: 8, dauer: 1400, punkt: 1.25, streu: 14, atem: 0, radius: 0, kraft: 0,
      bereit: function () { b.style.opacity = 0; setTimeout(function () { kopf.sichtbar(true); }, 350); },
      danach: function () { b.style.transition = cv.style.transition = 'opacity .45s'; b.style.opacity = 1; cv.style.opacity = 0; setTimeout(kopf.halt, 500); } });
  }

  /* ================================================================ Tinte: Handmarken (unterstreichen, einkreisen, abhaken, Pfeil), an Ort und Stelle geschrieben, bleiben stehen. */
  function tinte() {
    var c = document.getElementById('pk-tinte');
    if (!c) return { frei: function () {} };
    var g, W, H, tx = 0, ty = 0;
    var marken = [].map.call(main.querySelectorAll('[data-stift]'), function (el) { return { el: el, typ: el.getAttribute('data-stift'), nach: el.getAttribute('data-nach'), P: null, start: 0, dauer: 600, farbe: '' }; });
    function mass() { W = window.innerWidth; H = window.innerHeight; g = leinwand(c, W, H); marken.forEach(function (m) { m.farbe = getComputedStyle(m.el.parentNode).color; }); }
    /* Jede Marke ist ein Strich wie mit dem Stift gezogen: Punkte [x, y, gezeichnet?] im Fenster, in jedem Bild neu berechnet, damit sie am Text kleben. */
    function geo(m, r) {
      var o = { dick: 1.5 }, L = [], s, e, n, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (m.typ === 'unter') {
        var zeilen = m.el.getClientRects(), z;   /* bei Umbruch jede Zeile einzeln unterstreichen */
        for (var k = 0; k < zeilen.length; k++) { z = zeilen[k]; for (n = 0; n <= 18; n++) { s = n / 18; L.push([z.left - 4 + (z.width + 10) * s, z.bottom + 1 + Math.sin(s * 4.2 + k) * 2.5 - s * 3, n ? 1 : 0]); } }
        if (z) for (n = 1; n <= 12; n++) { s = 1 - n / 12 * .55; L.push([z.left + (z.width + 4) * s, z.bottom + 8 + Math.sin(s * 5 + 1) * 2 - s * 3, 1]); }
        o.dick = 1.6;
      } else if (m.typ === 'kreis') {
        var rx = r.width / 2 + 20, ry = r.height / 2 + 5;
        for (n = 0; n <= 44; n++) { s = n / 44; var a = -2.5 + s * 7.1, f = .95 + s * .12, px = Math.cos(a) * rx * f, py = Math.sin(a) * ry * f; L.push([cx + px + py * .1, cy + py - px * .05, n ? 1 : 0]); }
      } else if (m.typ === 'haken') {
        [].forEach.call(m.el.children, function (li) { var q = li.getBoundingClientRect(), x0 = q.left + 2, y0 = q.top + 16; L.push([x0, y0 + 1, 0], [x0 + 11, y0 + 13, 1], [x0 + 34, y0 - 14, 1]); });
        o.dick = 2;
      } else {
        var my = r.top + r.height / 2, tip, p0, cp, h1, h2;
        if (r.right + 160 < W) { tip = [r.right + 16, my]; p0 = [r.right + 132, r.top - 44]; cp = [r.right + 138, my + 24]; h1 = [tip[0] + 23, tip[1] - 15]; h2 = [tip[0] + 22, tip[1] + 16]; }
        else { tip = [r.left + r.width * .5, r.top - 12]; p0 = [r.left + r.width * .84, r.top - 76]; cp = [r.left + r.width * .44, r.top - 80]; h1 = [tip[0] - 16, tip[1] - 16]; h2 = [tip[0] + 15, tip[1] - 18]; }
        for (n = 0; n <= 20; n++) { s = n / 20; e = 1 - s; L.push([e * e * p0[0] + 2 * e * s * cp[0] + s * s * tip[0], e * e * p0[1] + 2 * e * s * cp[1] + s * s * tip[1], n ? 1 : 0]); }
        L.push([h1[0], h1[1], 0], [tip[0], tip[1], 1], [h2[0], h2[1], 1]); o.dick = 1.7;
      }
      o.L = L; o.cum = [0]; for (n = 1; n < L.length; n++) o.cum.push(o.cum[n - 1] + (L[n][2] ? Math.hypot(L[n][0] - L[n - 1][0], L[n][1] - L[n - 1][1]) : 0));
      o.ges = o.cum[L.length - 1];
      return o;
    }
    function ort(o, q) {
      var z = q.u * o.ges, L = o.L, n = 1;
      while (n < L.length - 1 && (!L[n][2] || o.cum[n] < z)) n++;
      var a = L[n - 1], b = L[n], t = (z - o.cum[n - 1]) / ((o.cum[n] - o.cum[n - 1]) || 1);
      tx = a[0] + (b[0] - a[0]) * t + q.j1 * o.dick; ty = a[1] + (b[1] - a[1]) * t + q.j2 * o.dick;
    }
    function bild(jetzt) {
      requestAnimationFrame(bild);
      g.clearRect(0, 0, W, H);
      if (still() || document.hidden) return;
      for (var i = 0; i < marken.length; i++) {
        var m = marken[i], r = m.el.getBoundingClientRect();
        if (r.bottom < -160 || r.top > H + 160 || !r.width) continue;
        if (!m.start) { if (m.nach || r.top > H * (m.los ? .97 : .8)) continue; m.start = jetzt; }
        var o = geo(m, r), n, q;
        if (!m.P) { m.P = []; var anz = Math.round(140 + klemme(o.ges / 900) * 640); m.dauer = 380 + o.ges * 1.3; for (n = 0; n < anz; n++) m.P.push({ u: n / anz, j1: glocke(), j2: glocke(), ox: (Math.random() - .5) * 12, oy: (Math.random() - .7) * 12 }); }
        var p = (jetzt - m.start) / m.dauer, ruht = p > 1.4;
        g.fillStyle = m.farbe;
        for (n = 0; n < m.P.length; n++) {
          q = m.P[n]; ort(o, q);
          if (ruht) { g.fillRect(tx, ty, 2, 2); continue; }
          var k = klemme((p - q.u) * m.dauer / 200);
          if (k <= 0) continue;
          var e = 1 - (1 - k) * (1 - k);
          g.globalAlpha = k; g.fillRect(tx + q.ox * (1 - e), ty + q.oy * (1 - e), 2, 2);
        }
        g.globalAlpha = 1;
      }
    }
    mass();
    window.addEventListener('resize', mass);
    requestAnimationFrame(bild);
    return { frei: function (name) { marken.forEach(function (m) { if (m.nach === name) { m.nach = null; m.los = true; } }); } };
  }

  /* ================================================================ A und B: große Unterschrift am Ende, danach der Pfeil zum Knopf */
  function konzeptAB(T) {
    var feld = main.querySelector('[data-pk-sign]');
    if (!feld || !('IntersectionObserver' in window)) { T.frei('sign'); return; }
    var hell = K === 'a';
    var sign = schreiber(feld, { rand: 20, dauer: hell ? 2400 : 2900, streu: 34, atem: .6, radius: 11000, kraft: 36, alpha: hell ? 1 : .34, danach: function () { T.frei('sign'); } });
    new IntersectionObserver(function (e) { if (!e[0].isIntersecting) sign.sichtbar(false); else if (e[0].intersectionRatio >= .3) sign.sichtbar(true); }, { threshold: [0, .3] }).observe(feld);
  }

  /* ================================================================ C: Aus Punkten gebaut */
  function konzeptC(T) {
    var c = document.getElementById('pk-stoff'), nacht = main.querySelector('.pk-nacht'), held = main.querySelector('.held'), lang = main.querySelector('[data-lang]');
    if (!c || !nacht || !lang) return;
    var g, W, H, N = handy ? 2600 : 5600, P = [], maus = { x: -999, y: -999 }, formen = {}, i, off = 0;
    var szenen = [].map.call(main.querySelectorAll('[data-szene]'), function (el) { return { el: el, name: el.getAttribute('data-szene'), platz: el.querySelector('[data-platz]') || el }; });
    var schritte = [].slice.call(main.querySelectorAll('.pk-schritte li')), art = 'praxis', selbst = false, dom = -1, uhr = 0, schrieb = 0, wz = 0, pfeil = false, tx = 0, ty = 0, matt = false;
    function mass() {
      W = c.clientWidth || window.innerWidth; H = c.clientHeight || window.innerHeight; g = leinwand(c, W, H);
      if (held) held.style.top = Math.min(0, window.innerHeight - held.offsetHeight) + 'px';   /* Hero bleibt stehen, auch wenn er höher ist als das Fenster */
    }
    function punkte(zeichne, stufe, fein) {
      var m = 300 * (fein || 1), o = document.createElement('canvas'); o.width = o.height = m;
      var k = o.getContext('2d'); k.scale(fein || 1, fein || 1); k.fillStyle = k.strokeStyle = '#fff'; k.lineCap = k.lineJoin = 'round';
      zeichne(k);
      var d = k.getImageData(0, 0, m, m).data, l = [];
      for (var y = 0; y < m; y += 2) for (var x = 0; x < m; x += 2) if (d[(y * m + x) * 4 + 3] > 120) l.push([x / m - .5, y / m - .5, stufe || 0]);
      return l.length ? l : [[0, 0, 0]];
    }
    function misch(l) { for (var n = l.length - 1; n > 0; n--) { var j = Math.random() * (n + 1) | 0, t = l[n]; l[n] = l[j]; l[j] = t; } return l; }
    function rund(k, a, b, w, h, r) { k.beginPath(); if (k.roundRect) k.roundRect(a, b, w, h, r); else k.rect(a, b, w, h); }
    function rahmen(k) { k.lineWidth = 7; rund(k, 20, 45, 260, 210, 18); k.stroke(); }
    function leiste(k) { k.fillRect(20, 85, 260, 6); [40, 62, 84].forEach(function (x) { k.beginPath(); k.arc(x, 66, 6, 0, 7); k.fill(); }); }
    var SERIF = '"Instrument Serif", Georgia, serif';
    /* Die Website, die sich beim Scrollen Stück für Stück vom Boden aus aufbaut: Rahmen, Leiste, Überschrift, Text, Knopf, Bild */
    formen.bau = misch([].concat(punkte(rahmen, 0), punkte(leiste, 1),
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
    /* „Etwas anderes“: ein Gipfel mit Fahne. Das schaffen wir. */
    formen.sonstiges = misch(punkte(function (k) {
      k.beginPath(); k.moveTo(18, 262); k.lineTo(128, 104); k.lineTo(170, 164); k.lineTo(204, 124); k.lineTo(284, 262); k.closePath(); k.fill();
      k.fillRect(125, 30, 6, 80); k.beginPath(); k.moveTo(131, 32); k.lineTo(196, 52); k.lineTo(131, 74); k.closePath(); k.fill();
    }));
    function zeichen(z, px, dy) { return misch(punkte(function (k) { k.font = '400 ' + px + 'px ' + SERIF; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(z, 150, 150 + dy); })); }
    /* Der Name des Betriebs im Fenster der Website */
    function nameForm(text) {
      return misch([].concat(punkte(rahmen, 0, 2), punkte(leiste, 0, 2), punkte(function (k) {
        var w = text.split(/\s+/), px, zeilen;
        for (px = 60; px >= 18; px -= 2) {
          k.font = '400 ' + px + 'px ' + SERIF; zeilen = [''];
          w.forEach(function (x) { var l = zeilen[zeilen.length - 1], neu = l ? l + ' ' + x : x; if (l && k.measureText(neu).width > 206) zeilen.push(x); else zeilen[zeilen.length - 1] = neu; });
          if (zeilen.length * px * 1.04 <= 128 && zeilen.every(function (l) { return k.measureText(l).width <= 212; })) break;
        }
        k.textAlign = 'center'; k.textBaseline = 'middle';
        zeilen.forEach(function (l, n) { k.fillText(l, 150, 170 + (n - (zeilen.length - 1) / 2) * px * 1.04); });
      }, 0, 2)));
    }
    var feldName = main.querySelector('[data-pk-name]');
    function schrift() { formen.kanzlei = zeichen('§', 290, 6); formen.null = zeichen('0 €', 190, 10); formen.name = nameForm((feldName && feldName.value.trim()) || 'Dein Betrieb'); }
    schrift();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schrift);
    if (feldName) feldName.addEventListener('input', function () { formen.name = nameForm(feldName.value.trim() || 'Dein Betrieb'); });
    ladeLo(function (l) { formen.lo = l; });
    for (i = 0; i < N; i++) P.push({ r: Math.random(), r2: Math.random(), o: Math.random(), j1: glocke(), jx: (Math.random() - .5) / 199, jy: (Math.random() - .5) / 199, s: 1.1 + Math.pow(Math.random(), 2.2) * 1.6, x: NaN, y: 0 });

    function ziel(sz) {
      var r = sz.platz.getBoundingClientRect(), o = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 - off, s: Math.min(r.width, r.height), n: sz.name };
      o.f = sz.name === 'arten' ? formen[art] : formen[sz.name];
      if (sz.name === 'lo') o.s = Math.min(r.width, r.height * 199 / 160) * .95;
      return o;
    }
    /* Alles entsteht von einer Grundlinie aus: Die Punkte liegen dort als ruhige Linie und steigen senkrecht an ihren Platz,
       von links nach rechts. hub (0 bis 1) sagt, wie weit die Form beim Wechsel zwischen zwei Abschnitten aus der Linie gehoben ist. */
    function ort(o, p, n, hub) {
      var f = o.f, q, k, grund, xs, jx = 0, jy = 0; matt = false;
      if (!f) { tx = o.cx + (p.r - .5) * o.s; ty = o.cy + o.s * .43; matt = true; return; }
      if (o.n === 'lo') { q = f[Math.min(f.length - 1, p.r2 * f.length | 0)]; k = schrieb ? weich(klemme((wz - q[2]) / .1)) : 0; jx = p.jx; jy = p.jy; }
      else { q = f[n % f.length]; k = 1; }
      xs = q[0] + .5;
      if (o.n === 'bau') k = weich(klemme((uhr - q[2] - xs * .55) / .45));
      if (hub < 1) k *= weich(klemme(hub * 1.5 - xs * .5));
      tx = o.cx + (q[0] + jx) * o.s; ty = o.cy + (q[1] + jy) * o.s;
      if (k < 1) { grund = o.cy + o.s * .43 + p.j1 * 1.3; ty = grund + (ty - grund) * k; matt = k < .5; }
    }
    var SX = new Float32Array(N), SY = new Float32Array(N), SS = new Float32Array(N);
    function bild(jetzt) {
      requestAnimationFrame(bild);
      var vh = window.innerHeight, cr = c.getBoundingClientRect(), nr = nacht.getBoundingClientRect();
      if (held) held.style.setProperty('--zu', (klemme(1 - nr.top / vh) * .6).toFixed(3));
      g.clearRect(0, 0, W, H);
      if (still() || document.hidden || cr.top > vh || cr.bottom < 0) return;
      off = cr.top;
      /* Bau-Uhr: 0 bis 1 während die Bühne hochkommt (Rahmen), danach hängt jede weitere Stufe am Scrollen */
      var lr = lang.getBoundingClientRect(), n;
      uhr = klemme((vh * .92 - lr.top) / (vh * .62)) + klemme(-lr.top / Math.max(1, lr.height - vh)) * 5.9;
      for (n = 0; n < schritte.length; n++) schritte[n].classList.toggle('an', n === 0 ? uhr > .5 : n === 1 ? uhr >= 2 : uhr >= 6);
      var mitte = vh / 2, i0 = szenen.length - 1, t = 0, m = szenen.map(function (s) { var r = s.el.getBoundingClientRect(); return r.top + r.height / 2; });
      for (n = 0; n < szenen.length - 1; n++) { if (m[n + 1] > mitte) { i0 = n; break; } }
      if (i0 < szenen.length - 1) { t = (mitte - m[i0]) / (m[i0 + 1] - m[i0]); t = klemme((t - .22) / .56); }
      var i1 = Math.min(i0 + 1, szenen.length - 1);
      dom = t < .5 ? i0 : i1;
      if (szenen[dom].name === 'lo' && !schrieb && (t > .85 || i0 === i1)) schrieb = jetzt;
      wz = schrieb ? (jetzt - schrieb - 200) / 2400 : 0;
      if (schrieb && !pfeil && wz > 1.15) { pfeil = true; T.frei('sign'); }
      var A = ziel(szenen[i0]), Z = ziel(szenen[i1]), ns = 0, my = maus.y - off, hubA = 1 - klemme(t / .4), hubZ = klemme((t - .6) / .4), zug = weich(klemme((t - .3) / .4));
      g.fillStyle = 'rgb(242,240,235)'; g.globalAlpha = .92;
      for (n = 0; n < N; n++) {
        var p = P[n], zx, zy, ma;
        ort(A, p, n, hubA); zx = tx; zy = ty; ma = matt;
        if (zug > 0) { ort(Z, p, n, hubZ); zx += (tx - zx) * zug; zy += (ty - zy) * zug; if (zug >= .5) ma = matt; }
        var dx = zx - maus.x, dy = zy - my, d = dx * dx + dy * dy;
        if (d < 9000) { var f = (1 - d / 9000) * 24 / Math.sqrt(d + 1); zx += dx * f; zy += dy * f; }
        if (p.x !== p.x) { p.x = zx; p.y = zy; } else { p.x += (zx - p.x) * .26; p.y += (zy - p.y) * .26; }
        if (ma) { SX[ns] = p.x; SY[ns] = p.y; SS[ns++] = p.s; } else g.fillRect(p.x, p.y, p.s, p.s);
      }
      g.globalAlpha = .5;
      for (n = 0; n < ns; n++) g.fillRect(SX[n], SY[n], SS[n], SS[n]);
      g.globalAlpha = 1;
    }
    /* Betriebsarten: Zeigen mit der Maus oder Tastatur wählt das Zeichen, sonst wechselt es ruhig von selbst. Ein Klick führt auf die Seite. */
    var wege = [].slice.call(main.querySelectorAll('.pk-arten a'));
    function waehle(b) { art = b.getAttribute('data-form'); wege.forEach(function (x) { x.classList.toggle('an', x === b); }); }
    wege.forEach(function (b) {
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { selbst = true; waehle(b); } });
      b.addEventListener('focus', function () { selbst = true; waehle(b); });
    });
    setInterval(function () {
      if (selbst || still() || dom < 0 || szenen[dom].name !== 'arten') return;
      var n = 0; wege.forEach(function (b, k) { if (b.classList.contains('an')) n = k; }); waehle(wege[(n + 1) % wege.length]);
    }, 2800);
    mass();
    window.addEventListener('resize', mass);
    window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { maus.x = e.clientX; maus.y = e.clientY; } });
    document.addEventListener('pointerleave', function () { maus.x = -999; });
    requestAnimationFrame(bild);
  }

  kopfLogo();
  var T = tinte();
  if (K === 'c') konzeptC(T); else konzeptAB(T);
})();
