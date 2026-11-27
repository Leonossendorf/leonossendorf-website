/* Referenzen-Seite: Schieber vom Strich zum Haus, Firmengeschichte zum Durchscrollen, Greenkeeper-App zum Ausprobieren.
   Ohne JavaScript bleibt alles lesbar: Der Schieber steht in der Mitte, die Firmengeschichte zeigt das Familienbild, die App zeigt ihren Startzustand. */
(function () {
  'use strict';
  var html = document.documentElement;
  function ruhig() { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }

  /* ---------- Schieber ---------- */
  [].slice.call(document.querySelectorAll('[data-schieber]')).forEach(function (s) {
    var regler = s.querySelector('input[type=range]'), licht = document.querySelector('[data-licht]'), gezeigt = false;
    function setze(v) { s.style.setProperty('--pos', v + '%'); }
    regler.addEventListener('input', function () { gezeigt = true; setze(regler.value); });
    if (licht) licht.addEventListener('click', function () {
      var an = licht.getAttribute('aria-pressed') !== 'true';
      licht.setAttribute('aria-pressed', an ? 'true' : 'false'); licht.textContent = an ? 'Licht aus' : 'Licht an';
      s.classList.toggle('abend', an);
      if (an && +regler.value > 40) { regler.value = 22; setze(22); }
    });
    /* Einmal vorführen, sobald der Schieber ins Bild kommt: von ganz Zeichnung zum Haus */
    if ('IntersectionObserver' in window && !ruhig()) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting || gezeigt) return;
          gezeigt = true; io.disconnect();
          var start = performance.now(), von = 96, bis = 42;
          (function schritt(t) {
            var p = Math.min(1, (t - start) / 1900), w = 1 - Math.pow(1 - p, 3), v = Math.round(von + (bis - von) * w);
            regler.value = v; setze(v);
            if (p < 1) requestAnimationFrame(schritt);
          })(start);
        });
      }, { threshold: .55 });
      io.observe(s);
    }
  });

  /* ---------- Firmengeschichte: läuft mit dem Scrollen ---------- */
  [].slice.call(document.querySelectorAll('[data-zeit]')).forEach(function (z) {
    var bilder = [].slice.call(z.querySelectorAll('.rf-zeit-buehne img')), knoepfe = [].slice.call(z.querySelectorAll('[data-jahr]')), texte = [].slice.call(z.querySelectorAll('.rf-zeit-text p'));
    var n = bilder.length, aktiv = -1;
    function zeige(i) {
      if (i === aktiv) return; aktiv = i;
      [bilder, knoepfe, texte].forEach(function (l) { l.forEach(function (el, k) { el.classList.toggle('an', k === i); }); });
    }
    if (ruhig()) { knoepfe.forEach(function (b, i) { b.addEventListener('click', function () { zeige(i); }); }); return; }
    z.classList.add('rf-zeit--lauf');
    function mass() {
      var r = z.getBoundingClientRect(), weg = r.height - window.innerHeight;
      var p = weg > 0 ? Math.max(0, Math.min(.999, -r.top / weg)) : 0;
      zeige(Math.floor(p * n));
    }
    knoepfe.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var r = z.getBoundingClientRect(), weg = r.height - window.innerHeight;
        window.scrollTo({ top: window.scrollY + r.top + weg * ((i + .5) / n), behavior: 'smooth' });
      });
    });
    window.addEventListener('scroll', mass, { passive: true }); window.addEventListener('resize', mass);
    zeige(0); mass();
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
