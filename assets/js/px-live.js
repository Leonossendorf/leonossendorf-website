/* Askel: Handy-Rahmen auf /praxis/, /praxis/entwurf/, /zahnarzt/ und /zahnarzt/entwurf/, in denen die echte Demo-Praxis läuft.
   Markup (aus tools/seiten_praxis.py):  <figure class="handy px-live" data-live="/praxis/demo/?rahmen=1&ab=termin" data-titel="…">
                                           <div class="px-schirm"><img …></div></figure>
   Ohne dieses Skript bleibt das Bildschirmfoto stehen.
   - Die Demo lädt erst, wenn der Rahmen in die Nähe des Bildschirms kommt.
   - Sie reagiert erst nach einem Tipp auf den Rahmen. Vorher scrollt die Seite ganz normal über den Rahmen hinweg.
   - Scrollt der Rahmen aus dem Bild oder wird Esc gedrückt, ruht die Demo wieder.
   - Große Schrift, starker Kontrast und „Bewegung aus“ von Leons Seite gelten auch in der Demo. */
(function () {
  'use strict';
  var html = document.documentElement;
  var figuren = Array.prototype.slice.call(document.querySelectorAll('[data-live]'));
  if (!figuren.length || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;
  var BREITE = 390, SCHALTER = ['gross', 'kontrast', 'ruhig'], alle = [];
  var FINGER = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M9 11.5V5a1.5 1.5 0 0 1 3 0v5"/><path d="M12 10V9a1.5 1.5 0 0 1 3 0v1.5"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15a1.5 1.5 0 0 1 2.3-1.9L9 15.5"/></svg>';

  function seite() { return { gross: html.classList.contains('gross-schrift'), kontrast: html.classList.contains('kontrast'), ruhig: html.classList.contains('ruhig') }; }

  figuren.forEach(function (fig) {
    var schirm = fig.querySelector('.px-schirm');
    if (!schirm) return;
    var titel = fig.getAttribute('data-titel') || 'Demo-Praxis';
    var z = { fig: fig, frame: null, aktiv: false, bereit: false, eigen: {}, wartet: [] };
    alle.push(z);

    var start = document.createElement('button');
    start.type = 'button';
    start.className = 'px-start';
    start.setAttribute('aria-label', titel + ': hier ausprobieren');
    start.innerHTML = '<span class="px-tipp">' + FINGER + '<span class="px-t-tipp">Zum Ausprobieren antippen</span><span class="px-t-klick">Zum Ausprobieren anklicken</span></span>';
    schirm.appendChild(start);

    var leiste = document.createElement('div');
    leiste.className = 'px-leiste';
    leiste.innerHTML = '<button type="button">Von vorn</button>' + (fig.getAttribute('data-gross') ? '<a href="' + fig.getAttribute('data-gross') + '">Groß öffnen</a>' : '');
    fig.appendChild(leiste);

    function stand() { var s = seite(), o = {}; SCHALTER.forEach(function (k) { o[k] = !!(s[k] || z.eigen[k]); }); return o; }
    function quelle() { var u = fig.getAttribute('data-live'), s = stand(); SCHALTER.forEach(function (k) { if (s[k]) u += '&' + k + '=1'; }); return u; }
    function post(o) {
      o.askelDemo = 1;
      if (!z.bereit) { z.wartet.push(o); return; }
      try { z.frame.contentWindow.postMessage(o, location.origin); } catch (e) {}
    }
    function masse() {
      if (!z.frame) return;
      var b = schirm.clientWidth, h = schirm.clientHeight;
      if (!b || !h) return;
      var s = b / BREITE;
      z.frame.style.width = BREITE + 'px';
      z.frame.style.height = Math.round(h / s) + 'px';
      z.frame.style.transform = 'scale(' + s.toFixed(4) + ')';
    }
    function lade() {
      if (z.frame) return;
      var f = document.createElement('iframe');
      f.title = titel + ' (Demo zum Ausprobieren)';
      f.setAttribute('tabindex', '-1');
      f.inert = true;
      f.addEventListener('load', function () {
        z.bereit = true; fig.classList.add('px-da');
        var w = z.wartet; z.wartet = [];
        w.forEach(post);
        if (z.aktiv) post({ aktiv: 1 });
      });
      f.src = quelle();
      schirm.insertBefore(f, start);
      z.frame = f;
      masse();
    }
    function an() {
      lade();
      z.aktiv = true; fig.classList.add('px-aktiv');
      z.frame.inert = false; z.frame.removeAttribute('tabindex');
      start.hidden = true;
      post({ aktiv: 1 });
      try { z.frame.focus({ preventScroll: true }); } catch (e) {}
      document.dispatchEvent(new CustomEvent('px-live', { detail: titel }));
    }
    function aus(fokus) {
      if (!z.aktiv) return;
      z.aktiv = false; fig.classList.remove('px-aktiv');
      z.frame.inert = true; z.frame.setAttribute('tabindex', '-1');
      start.hidden = false;
      if (fokus) start.focus({ preventScroll: true });
    }
    z.aus = aus; z.post = post; z.lade = lade; z.stand = stand;

    start.addEventListener('click', an);
    leiste.querySelector('button').addEventListener('click', function () {
      if (!z.frame) { lade(); return; }
      z.bereit = false; fig.classList.remove('px-da');
      z.frame.src = quelle();
      z.schritt(0);
    });

    /* Liste der Schritte neben dem Rahmen (Online-Termin): springt in der Demo und zeigt, wo sie gerade steht */
    var kasten = fig.closest('[data-px-schritte]');
    var knoepfe = kasten ? Array.prototype.slice.call(kasten.querySelectorAll('button[data-s]')) : [];
    z.schritt = function (g) { knoepfe.forEach(function (b, i) { b.classList.toggle('an', i === g); if (i === g) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); };
    knoepfe.forEach(function (b, i) { b.addEventListener('click', function () { lade(); post({ terminGruppe: i }); z.schritt(i); }); });

    /* Schalter über dem Rahmen (Barrierefrei): stellen nur die Demo um, nicht Leons Seite */
    var feld = fig.closest('[data-px-schalter]');
    if (feld) Array.prototype.slice.call(feld.querySelectorAll('button[data-k]')).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), anK = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', anK ? 'true' : 'false');
        z.eigen[k] = anK;
        lade(); post({ setze: stand() });
      });
    });
    if (feld) { var w = feld.querySelector('[data-px-wahl]'); if (w) w.hidden = false; }

    new ResizeObserver(masse).observe(schirm);
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) lade(); }, { rootMargin: '500px 0px' }).observe(fig);
    new IntersectionObserver(function (es) { if (es[0].intersectionRatio < .3) aus(false); }, { threshold: [0, .3] }).observe(fig);
  });

  /* Meldungen aus der Demo: Esc gedrückt, Schritt der Buchung gewechselt */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (e.origin !== location.origin || !d || !d.askelDemo) return;
    var z = alle.filter(function (x) { return x.frame && x.frame.contentWindow === e.source; })[0];
    if (!z) return;
    if (d.raus) z.aus(true);
    if (d.termin != null) z.schritt(d.termin < 3 ? 0 : d.termin === 3 ? 1 : d.termin < 6 ? 2 : 3);
    if (d.ort && d.ort.indexOf('termin') !== 0) z.schritt(-1);
  });

  /* Schalter auf Leons Seite gelten auch in den Rahmen */
  var zuletzt = JSON.stringify(seite());
  new MutationObserver(function () {
    var jetzt = JSON.stringify(seite());
    if (jetzt === zuletzt) return;
    zuletzt = jetzt;
    alle.forEach(function (z) { if (z.frame) z.post({ setze: z.stand() }); });
  }).observe(html, { attributes: true, attributeFilter: ['class'] });
})();
