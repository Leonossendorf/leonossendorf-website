/* Pizzeria-Seiten: Bestell-Demo mit Küchenbon, Provisions-Rechnung an der Pizza, Bestellstatus.
   Ohne JavaScript bleibt alles lesbar: Die Karte der Demo steht da, die Rechnung zeigt das Beispiel (60 Bestellungen, 25 €, 13 %). */
(function () {
  'use strict';
  var html = document.documentElement;
  function ruhig() { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift') || (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches); }
  function euro(x, cent) { return x.toLocaleString('de-DE', { minimumFractionDigits: cent ? 2 : 0, maximumFractionDigits: cent ? 2 : 0 }) + ' €'; }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function alle(w, s) { return [].slice.call(w.querySelectorAll(s)); }

  /* ---------- Bestell-Demo: Handy bestellt, der Küchendrucker druckt ---------- */
  alle(document, '[data-pz-demo]').forEach(function (d) {
    var korb = {}, folge = [], nr = 40 + Math.floor(Math.random() * 40);
    var anzahlEl = d.querySelector('[data-pz-anzahl]'), summeEl = d.querySelector('[data-pz-summe]'), senden = d.querySelector('[data-pz-senden]'), leeren = d.querySelector('[data-pz-leeren]');
    var status = d.querySelector('[data-pz-status]'), bon = d.querySelector('[data-pz-bon]'), leer = d.querySelector('[data-pz-leerhinweis]');
    function zeichne() {
      var n = 0, s = 0;
      folge.forEach(function (name) { n += korb[name].n; s += korb[name].n * korb[name].p; });
      alle(d, '[data-pz-artikel]').forEach(function (b) {
        var k = korb[b.getAttribute('data-name')], i = b.querySelector('i');
        i.textContent = k && k.n ? k.n + '×' : '+'; b.classList.toggle('drin', !!(k && k.n));
      });
      anzahlEl.textContent = n ? (n === 1 ? '1 Pizza' : n + ' Pizzen') : 'Noch nichts gewählt';
      summeEl.textContent = n ? euro(s, true) : '';
      senden.disabled = !n; leeren.hidden = !n;
      return s;
    }
    alle(d, '[data-pz-artikel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-name');
        if (!korb[name]) { korb[name] = { n: 0, p: parseFloat(b.getAttribute('data-preis')) }; folge.push(name); }
        korb[name].n++; status.textContent = ''; zeichne();
      });
    });
    leeren.addEventListener('click', function () { korb = {}; folge = []; zeichne(); });
    senden.addEventListener('click', function () {
      var s = zeichne(), jetzt = new Date(), ab = new Date(jetzt.getTime() + 20 * 60000), ul = bon.querySelector('[data-pz-zeilen]');
      nr++;
      ul.innerHTML = '';
      folge.forEach(function (name) {
        var li = document.createElement('li'), a = document.createElement('span'), b2 = document.createElement('b');
        a.textContent = korb[name].n + '× ' + name; b2.textContent = euro(korb[name].n * korb[name].p, true);
        li.appendChild(a); li.appendChild(b2); ul.appendChild(li);
      });
      bon.querySelector('[data-pz-nr]').textContent = 'Nr. ' + nr;
      bon.querySelector('[data-pz-zeit]').textContent = zwei(jetzt.getHours()) + ':' + zwei(jetzt.getMinutes());
      bon.querySelector('[data-pz-abhol]').textContent = zwei(ab.getHours()) + ':' + zwei(ab.getMinutes());
      bon.querySelector('[data-pz-bonsumme]').textContent = euro(s, true);
      leer.hidden = true; bon.hidden = false;
      bon.classList.remove('druck'); void bon.offsetWidth; if (!ruhig()) bon.classList.add('druck');
      d.classList.add('gedruckt');
      status.textContent = 'Bestellung Nr. ' + nr + ' ist in der Küche angekommen.';
      korb = {}; folge = []; zeichne();
    });
    zeichne();
  });

  /* ---------- Provision: ein Stück rückt aus der Pizza ---------- */
  alle(document, '[data-pz-torte]').forEach(function (t) {
    var bereich = t.closest('section'), satz = 13;
    var ein = {}, aus = {};
    alle(bereich, '[data-pz-in]').forEach(function (i) { ein[i.getAttribute('data-pz-in')] = i; });
    alle(bereich, '[data-pz-out]').forEach(function (o) { aus[o.getAttribute('data-pz-out')] = o; });
    var monat = bereich.querySelector('[data-pz-monat]'), prozent = t.querySelector('[data-pz-prozent]');
    function rechne() {
      var n = +ein.anzahl.value, w = +ein.wert.value, m = Math.round(n * w * satz / 100 * 4.33 / 5) * 5;
      aus.anzahl.textContent = n; aus.wert.textContent = w + ' €';
      monat.textContent = euro(m);
      prozent.textContent = satz + ' %';
      /* Das Stück beginnt oben (12 Uhr) und läuft im Uhrzeigersinn; es rückt entlang seiner Mitte nach außen */
      var winkel = satz / 100 * Math.PI, weit = 7;
      t.style.setProperty('--anteil', satz);
      t.style.setProperty('--dx', (Math.sin(winkel) * weit).toFixed(2) + '%');
      t.style.setProperty('--dy', (-Math.cos(winkel) * weit).toFixed(2) + '%');
      t.style.setProperty('--mx', (50 + Math.sin(winkel) * 62).toFixed(1) + '%');
      t.style.setProperty('--my', (50 - Math.cos(winkel) * 62).toFixed(1) + '%');
    }
    alle(bereich, '[data-pz-satz]').forEach(function (b) {
      b.addEventListener('click', function () {
        satz = +b.getAttribute('data-pz-satz');
        alle(bereich, '[data-pz-satz]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        rechne();
      });
    });
    Object.keys(ein).forEach(function (k) { ein[k].addEventListener('input', rechne); });
    rechne();
    t.classList.add('bereit');
  });

  /* ---------- Bestellstatus: läuft durch, sobald er ins Bild kommt ---------- */
  alle(document, '[data-pz-spur]').forEach(function (s) {
    if (!('IntersectionObserver' in window) || ruhig()) { s.classList.add('an'); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { s.classList.add('an'); io.disconnect(); } }); }, { threshold: .35 });
    io.observe(s);
  });
})();
