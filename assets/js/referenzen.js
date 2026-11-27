/* Referenzen-Seite: Umbau-Schieber vorher/nachher, Firmengeschichte mit Jahren zum Antippen, Greenkeeper-App zum Ausprobieren.
   Ohne JavaScript bleibt alles lesbar: Der Schieber steht in der Mitte, die Firmengeschichte zeigt das Familienbild, die App zeigt ihren Startzustand. */
(function () {
  'use strict';
  var html = document.documentElement;
  function ruhig() { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }

  /* ---------- Umbau-Schieber: vorher / nachher ----------
     Ziehen mit Maus oder Finger direkt auf dem Bild (stufenlos, höchstens einmal pro Bild neu gezeichnet), Tastatur über den Regler.
     Es wird nur verschoben (transform), nichts neu zugeschnitten: Das läuft flüssig. */
  [].slice.call(document.querySelectorAll('[data-schieber]')).forEach(function (s) {
    var regler = s.querySelector('input[type=range]'), gezeigt = false, ziel = +regler.value, wartet = false, zieht = null;
    function setze(v) {
      ziel = Math.max(0, Math.min(100, v));
      if (wartet) return; wartet = true;
      requestAnimationFrame(function () { wartet = false; s.style.setProperty('--pos', ziel.toFixed(2) + '%'); regler.value = ziel; });
    }
    function ausZeiger(e) { var r = s.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    regler.addEventListener('input', function () { gezeigt = true; setze(+regler.value); });
    s.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      gezeigt = true; zieht = e.pointerId;
      if (e.pointerType === 'mouse') { e.preventDefault(); setze(ausZeiger(e)); s.setPointerCapture(e.pointerId); s.classList.add('zieht'); }
    });
    s.addEventListener('pointermove', function (e) {
      if (zieht !== e.pointerId) return;
      if (e.pointerType !== 'mouse' && !s.hasPointerCapture(e.pointerId)) { s.setPointerCapture(e.pointerId); s.classList.add('zieht'); }
      setze(ausZeiger(e));
    });
    function los(e) { if (zieht === e.pointerId) { zieht = null; s.classList.remove('zieht'); } }
    s.addEventListener('pointerup', los); s.addEventListener('pointercancel', los);
    /* Einmal vorführen, sobald der Schieber ins Bild kommt: von ganz vorher zum Nachher */
    if ('IntersectionObserver' in window && !ruhig()) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || gezeigt) return;
          io.disconnect();
          var start = performance.now(), von = 96, bis = 38;
          (function schritt(t) {
            if (gezeigt) return;
            var p = Math.min(1, (t - start) / 1700), w = 1 - Math.pow(1 - p, 3), v = von + (bis - von) * w;
            s.style.setProperty('--pos', v.toFixed(2) + '%'); regler.value = v;
            if (p < 1) requestAnimationFrame(schritt);
          })(start);
        });
      }, { threshold: .55 });
      io.observe(s);
    }
  });

  /* ---------- Live-Vorschau Engelshove: Am Computer lädt beim Zeigen mit der Maus die echte Website.
     Scrollen über der Vorschau scrollt die echte Seite. Am Handy bleibt der Film mit Link. ---------- */
  [].slice.call(document.querySelectorAll('[data-live-eh]')).forEach(function (l) {
    var mq = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine) and (min-width:900px)');
    if (!mq || !mq.matches) return;
    var schirm = l.querySelector('.rf-schirm'), text = l.querySelector('[data-live-text]'), fr = null, BREITE = 1440;
    l.classList.add('maus');
    function skaliere() { schirm.style.setProperty('--s', (schirm.clientWidth / BREITE).toFixed(4)); }
    function laden() {
      if (fr) return;
      fr = document.createElement('iframe');
      fr.title = 'Die echte Website von Engelshove Bau. Mit der Maus darüber scrollen.';
      fr.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      fr.src = l.getAttribute('data-live-eh');
      l.classList.add('laedt'); if (text) text.textContent = 'Die echte Website lädt …';
      fr.addEventListener('load', function () {
        l.classList.remove('laedt'); l.classList.add('live');
        if (text) text.textContent = 'Scroll los: Das ist die echte Website.';
      });
      schirm.appendChild(fr); skaliere();
    }
    schirm.addEventListener('pointerenter', laden);
    window.addEventListener('resize', skaliere);
  });

  /* ---------- Firmengeschichte: Jahre zum Antippen, läuft einmal von selbst bis zum Familienbild ---------- */
  [].slice.call(document.querySelectorAll('[data-zeit]')).forEach(function (z) {
    var bilder = [].slice.call(z.querySelectorAll('.rf-zeit-buehne img')), knoepfe = [].slice.call(z.querySelectorAll('[data-jahr]')), texte = [].slice.call(z.querySelectorAll('.rf-zeit-text p'));
    var n = bilder.length, lauf = 0;
    function zeige(i) {
      [bilder, knoepfe, texte].forEach(function (l) { l.forEach(function (el, k) { el.classList.toggle('an', k === i); }); });
    }
    knoepfe.forEach(function (b, i) { b.addEventListener('click', function () { clearInterval(lauf); lauf = -1; zeige(i); }); });
    if (!('IntersectionObserver' in window) || ruhig()) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || lauf) return;
        io.disconnect();
        var i = 0; zeige(0);
        lauf = setInterval(function () { i++; zeige(i); if (i >= n - 1) { clearInterval(lauf); lauf = -1; } }, 1500);
      });
    }, { threshold: .5 });
    io.observe(z.querySelector('.rf-zeit-buehne'));
  });

  /* ---------- Greenkeeper-App ---------- */
  [].slice.call(document.querySelectorAll('[data-gk-demo]')).forEach(function (d) {
    var schalter = [].slice.call(d.querySelectorAll('[data-gk]')), stand = d.querySelector('[data-gk-stand]');
    function an(name) { var s = d.querySelector('[data-gk="' + name + '"]'); return s.getAttribute('aria-checked') === 'true'; }
    function zeichne(geaendert) {
      var platz = an('platz');
      schalter.forEach(function (s) {
        var name = s.getAttribute('data-gk'), wert = an(name), gesperrt = !platz && name !== 'platz' && name !== 'range';
        s.disabled = gesperrt; s.classList.toggle('zu', gesperrt);
        var m = d.querySelector('[data-gk-zeigt="' + name + '"]'), frei = wert && !gesperrt;
        if (m) {
          var vorher = m.classList.contains('gk-frei');
          m.classList.toggle('gk-frei', frei);
          m.querySelector('b').textContent = name === 'platz' ? (frei ? 'Platz offen' : 'Platz zu') : m.querySelector('b').textContent;
          if (geaendert && vorher !== frei) { m.classList.remove('neu'); void m.offsetWidth; m.classList.add('neu'); }
        }
      });
      if (geaendert && stand) stand.textContent = 'Zuletzt geändert: gerade eben';
    }
    schalter.forEach(function (s) {
      s.addEventListener('click', function () { s.setAttribute('aria-checked', s.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); zeichne(true); });
    });
    zeichne(false);
  });
})();
