/* Referenzen-Seite: Umbau-Schieber vorher/nachher, Firmengeschichte mit Jahren zum Antippen, Greenkeeper-App zum Ausprobieren.
   Ohne JavaScript bleibt alles lesbar: Der Schieber steht in der Mitte, die Firmengeschichte zeigt das Familienbild, die App zeigt ihren Startzustand. */
(function () {
  'use strict';
  var html = document.documentElement;
  function ruhig() { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }

  /* ---------- Umbau-Schieber: vorher / nachher ---------- */
  [].slice.call(document.querySelectorAll('[data-schieber]')).forEach(function (s) {
    var regler = s.querySelector('input[type=range]'), gezeigt = false;
    function setze(v) { s.style.setProperty('--pos', v + '%'); }
    regler.addEventListener('input', function () { gezeigt = true; setze(regler.value); });
    /* Einmal vorführen, sobald der Schieber ins Bild kommt: von ganz vorher nach nachher */
    if ('IntersectionObserver' in window && !ruhig()) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || gezeigt) return;
          gezeigt = true; io.disconnect();
          var start = performance.now(), von = 96, bis = 38;
          (function schritt(t) {
            var p = Math.min(1, (t - start) / 1600), w = 1 - Math.pow(1 - p, 3), v = Math.round(von + (bis - von) * w);
            regler.value = v; setze(v);
            if (p < 1) requestAnimationFrame(schritt);
          })(start);
        });
      }, { threshold: .55 });
      io.observe(s);
    }
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
