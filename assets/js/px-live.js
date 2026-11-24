/* Askel: Handy-Rahmen auf /praxis/, /praxis/entwurf/, /zahnarzt/ und /zahnarzt/entwurf/, in denen die echte Demo-Praxis läuft.
   Markup (aus tools/seiten_praxis.py):  <figure class="handy px-live" data-live="/praxis/demo/?rahmen=1&ab=termin" data-titel="…">
                                           <div class="px-schirm"><img …></div></figure>
   Ohne dieses Skript bleibt das Bildschirmfoto stehen.
   - Die Demo lädt, sobald der Rahmen in die Nähe des Bildschirms kommt, und ist sofort bedienbar: kein Start-Klick (Leon, 24.11.).
   - Damit die Seite nicht am Rahmen hängen bleibt, scrollt die Demo erst selbst, nachdem jemand hineingetippt hat (das regelt die
     Demo, siehe „Einbett-Ansicht“ in tools/praxis_demo_vorlage.html). Vorher bewegt Wischen über dem Rahmen die Seite.
   - Scrollt der Rahmen aus dem Bild oder wird Esc gedrückt, ruht die Demo wieder (ihr Stand bleibt).
   - Große Schrift, starker Kontrast und „Bewegung aus“ von Leons Seite gelten auch in der Demo. */
(function () {
  'use strict';
  var html = document.documentElement;
  var figuren = Array.prototype.slice.call(document.querySelectorAll('[data-live]'));
  if (!figuren.length || !('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;
  var BREITE = 390, SCHALTER = ['gross', 'kontrast', 'ruhig'], alle = [];

  function seite() { return { gross: html.classList.contains('gross-schrift'), kontrast: html.classList.contains('kontrast'), ruhig: html.classList.contains('ruhig') }; }

  figuren.forEach(function (fig) {
    var schirm = fig.querySelector('.px-schirm');
    if (!schirm) return;
    var titel = fig.getAttribute('data-titel') || 'Demo-Praxis';
    var z = { fig: fig, frame: null, bereit: false, gezaehlt: false, eigen: {}, wartet: [] };
    alle.push(z);

    /* Für die Tastatur: die Demo hat viele Knöpfe, dieser Link führt daran vorbei */
    var sprung = document.createElement('a');
    sprung.className = 'px-sprung';
    sprung.href = '#';
    sprung.textContent = 'Demo überspringen';
    fig.insertBefore(sprung, schirm);

    var leiste = document.createElement('div');
    leiste.className = 'px-leiste';
    leiste.innerHTML = '<span>Echte Demo: einfach ausprobieren</span><button type="button">Von vorn</button>'
      + (fig.getAttribute('data-gross') ? '<a href="' + fig.getAttribute('data-gross') + '">Groß öffnen</a>' : '');
    fig.appendChild(leiste);
    var vonVorn = leiste.querySelector('button');
    sprung.addEventListener('click', function (e) { e.preventDefault(); vonVorn.focus(); });

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
      f.addEventListener('load', function () {
        z.bereit = true; fig.classList.add('px-da');
        var w = z.wartet; z.wartet = [];
        w.forEach(post);
      });
      f.src = quelle();
      schirm.appendChild(f);
      z.frame = f;
      masse();
    }
    /* Die Demo meldet, ob gerade jemand darin arbeitet (dann scrollt sie selbst) */
    z.frei = function (an) {
      fig.classList.toggle('px-aktiv', an);
      if (an && !z.gezaehlt) { z.gezaehlt = true; document.dispatchEvent(new CustomEvent('px-live', { detail: titel })); }
    };
    z.raus = function () { post({ ruhe: 1 }); vonVorn.focus({ preventScroll: true }); };
    z.post = post; z.stand = stand;

    vonVorn.addEventListener('click', function () {
      if (!z.frame) { lade(); return; }
      z.bereit = false; fig.classList.remove('px-da'); z.frei(false);
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
    /* Aus dem Bild gescrollt (oder Reiter gewechselt): die Demo ruht wieder, damit die Seite beim Zurückscrollen nicht hängen bleibt */
    new IntersectionObserver(function (es) { if (es[0].intersectionRatio < .3 && z.frame) post({ ruhe: 1 }); }, { threshold: [0, .3] }).observe(fig);
  });

  /* Meldungen aus der Demo */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (e.origin !== location.origin || !d || !d.askelDemo) return;
    var z = alle.filter(function (x) { return x.frame && x.frame.contentWindow === e.source; })[0];
    if (!z) return;
    if (d.frei != null) z.frei(!!d.frei);
    if (d.raus) z.raus();
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
