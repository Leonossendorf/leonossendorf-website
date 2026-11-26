/* Demo-Praxis „Physio am Kai“ (erfundene Daten). Quelle: tools/physio_demo/demo.js. Gehört Chiron.
   In der Demo wird nichts verschickt und nichts gebucht. Abläufe: #termin, #kurs, #absage, #bewerbung. */
(function () {
  'use strict';
  var h = document.documentElement;
  var q = new URLSearchParams(location.search);
  var DEMO = '/physiotherapie/demo/';
  /* Einbett-Ansicht: Die Demo läuft in einem Handy-Rahmen auf Leons Seite. Dann ohne gespeicherte Einstellungen
     (nur die aus der Adresse) und ohne den Fokus oder die Scrollposition der äußeren Seite an sich zu ziehen. */
  var EIN = h.classList.contains('einbett'), beruehrt = !EIN;
  if (EIN) ['pointerdown', 'keydown'].forEach(function (n) {
    document.addEventListener(n, function () {
      if (beruehrt) return;
      beruehrt = true;
      var d = document.getElementById('ablauf');   // ab der ersten Berührung ein richtiges Fenster (Fokus bleibt darin)
      if (d && d.open && !d.matches(':modal')) { d.removeAttribute('open'); d.showModal(); }
    }, true);
  });
  function lies(k) { if (EIN) return false; try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } }
  function merke(k, v) { if (EIN) return; try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} }
  function $(s, w) { return (w || document).querySelector(s); }
  function $$(s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Im Rahmen: Einstellungen aus der Adresse an die Links der Demo weitergeben
  if (EIN && location.search) $$('a[href^="' + DEMO + '"]').forEach(function (a) {
    var u = a.getAttribute('href').split('#'); if (u[0].indexOf('?') < 0) a.setAttribute('href', u[0] + location.search + (u[1] ? '#' + u[1] : ''));
  });

  /* ---------- Barrierefreiheit: ein Symbol, dahinter Schalter ---------- */
  $$('.schalt').forEach(function (b) {
    var k = 'physio-' + b.dataset.klasse, an = lies(k) || (EIN && q.get(b.dataset.klasse) === '1');
    h.classList.toggle(b.dataset.klasse, an); b.setAttribute('aria-checked', an ? 'true' : 'false');
    b.addEventListener('click', function () {
      var n = b.getAttribute('aria-checked') !== 'true';
      b.setAttribute('aria-checked', n ? 'true' : 'false'); h.classList.toggle(b.dataset.klasse, n); merke(k, n);
    });
  });
  var bk = $('.bf-knopf'), bf = $('#bf'), bg = $('.burger'), me = $('#menue');
  function zuKlappen() { bf.hidden = true; bk.setAttribute('aria-expanded', 'false'); me.classList.remove('offen'); bg.setAttribute('aria-expanded', 'false'); }
  bk.addEventListener('click', function (e) { e.stopPropagation(); var auf = bf.hidden; zuKlappen(); bf.hidden = !auf; bk.setAttribute('aria-expanded', auf ? 'true' : 'false'); });
  bg.addEventListener('click', function (e) { e.stopPropagation(); var auf = !me.classList.contains('offen'); zuKlappen(); me.classList.toggle('offen', auf); bg.setAttribute('aria-expanded', auf ? 'true' : 'false'); });
  document.addEventListener('click', function (e) { if (!bf.contains(e.target) && !me.contains(e.target)) zuKlappen(); });
  var kopf = $('.kopf');
  function rollen() { kopf.classList.toggle('unten', window.scrollY > 8); }
  window.addEventListener('scroll', rollen, { passive: true }); rollen();

  /* ---------- Handy: Die Leiste unten erscheint erst, wenn die Knöpfe im Einstieg aus dem Bild sind ---------- */
  (function () {
    var l = $('.aktion-leiste'), k = $('.auftakt .knopfzeile, .seite-kopf .knopfzeile');
    if (!l || !k || !('IntersectionObserver' in window)) return;
    l.classList.add('oben');
    new IntersectionObserver(function (es) { l.classList.toggle('oben', es[0].isIntersecting); }).observe(k);
  })();

  /* ---------- Sanftes Einblenden ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.zeige').forEach(function (el) { io.observe(el); });
  } else { $$('.zeige').forEach(function (el) { el.classList.add('da'); }); }

  /* ---------- Öffnungszeiten und freie Termine (immer ab heute gerechnet) ---------- */
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var OFFEN = { 1: ['7:30', '20:00'], 2: ['7:30', '20:00'], 3: ['7:30', '20:00'], 4: ['7:30', '20:00'], 5: ['7:30', '16:00'] };
  function minuten(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  var jetzt = new Date();
  $$('tr[data-tag="' + jetzt.getDay() + '"]').forEach(function (r) { r.classList.add('heute'); });
  (function offenStatus() {
    var t = OFFEN[jetzt.getDay()], m = jetzt.getHours() * 60 + jetzt.getMinutes(), text, kurzT, an = false;
    if (t && m >= minuten(t[0]) && m < minuten(t[1])) { text = 'Jetzt geöffnet, heute bis ' + t[1] + ' Uhr'; kurzT = 'Heute bis ' + t[1] + ' Uhr'; an = true; }
    else {
      for (var i = 0; i < 8; i++) {
        var d = (jetzt.getDay() + i) % 7, z = OFFEN[d];
        if (z && (i > 0 || m < minuten(z[0]))) { kurzT = (i === 0 ? 'Heute' : i === 1 ? 'Morgen' : TAGE[d]) + ' ab ' + z[0] + ' Uhr'; text = 'Geschlossen. Wieder geöffnet: ' + kurzT.charAt(0).toLowerCase() + kurzT.slice(1); break; }
      }
    }
    $$('[data-offen]').forEach(function (e) { e.textContent = text; e.classList.toggle('aus', !an); });
    $$('[data-offen-kurz]').forEach(function (e) { e.textContent = kurzT; });
  })();

  var TEAM = [
    { name: 'Hanna Brandt', bild: 'team-1', kurz: 'Manuelle Therapie, Krankengymnastik', arten: ['KG', 'MT', 'SZ'] },
    { name: 'Jonas Keller', bild: 'team-2', kurz: 'Krankengymnastik am Gerät, Sport', arten: ['KG', 'KGG', 'SZ'] },
    { name: 'Lena Marquardt', bild: 'team-3', kurz: 'Lymphdrainage, Krankengymnastik', arten: ['KG', 'MLD', 'SZ'] }
  ];
  var ZEITEN = ['7:40', '8:20', '9:00', '9:40', '10:20', '11:00', '11:40', '13:20', '14:00', '14:40', '15:20', '16:00', '17:00', '17:40', '18:20', '19:00'];
  function tage(schluessel) {
    var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
    var versatz = schluessel ? schluessel.length : 0;
    while (out.length < 10) { d = new Date(d.getTime() + 864e5); if (d.getDay() > 0 && d.getDay() < 6) out.push(d); }
    return out.map(function (tag, i) {
      var s = tag.getDate() * 7 + tag.getMonth() * 3 + versatz;
      var z = ZEITEN.filter(function (zeit, j) { return (s + j * 5) % 7 < (schluessel ? 2 : 3) && !(tag.getDay() === 5 && minuten(zeit) > 15 * 60 + 30); });
      if (i === 0) z = z.slice(-2);
      return { datum: tag, zeiten: z };
    });
  }
  function kurz(d) { return d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', ''); }
  function lang(d) { return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function datum(d) { return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' }); }
  (function naechsterTermin() {
    var t = tage().filter(function (x) { return x.zeiten.length; })[0];
    $$('[data-naechster]').forEach(function (e) { e.textContent = lang(t.datum) + ', ' + t.zeiten[0] + ' Uhr'; });
  })();

  /* ---------- Kurse: Startdatum immer in der Zukunft ---------- */
  function start(wochentag, abTagen) {
    var d = new Date(); d.setHours(0, 0, 0, 0); d = new Date(d.getTime() + abTagen * 864e5);
    while (d.getDay() !== wochentag) d = new Date(d.getTime() + 864e5);
    return d;
  }
  var KURSE = [
    { id: 'ruecken', name: 'Rückenfit', wann: 'montags, 18:00 bis 19:00 Uhr', tag: 1, ab: 9, dauer: '8 Termine', preis: '120 €', frei: 3, kasse: true },
    { id: 'pilates', name: 'Pilates für Einsteiger', wann: 'mittwochs, 9:30 bis 10:30 Uhr', tag: 3, ab: 12, dauer: '10 Termine', preis: '150 €', frei: 5, kasse: true },
    { id: 'becken', name: 'Beckenboden', wann: 'donnerstags, 17:00 bis 18:00 Uhr', tag: 4, ab: 16, dauer: '8 Termine', preis: '120 €', frei: 2, kasse: false }
  ];
  KURSE.forEach(function (k) {
    k.start = start(k.tag, k.ab);
    $$('[data-kurs-start="' + k.id + '"]').forEach(function (e) { e.textContent = datum(k.start); });
  });

  /* ---------- Ablauf-Fenster ---------- */
  var dlg = $('#ablauf'), buehne = $('#ablauf-buehne'), details = $('#ablauf-details'), titel = $('#ablauf-titel'), unter = $('#ablauf-unter');
  var balken = $('#ablauf-balken'), zurueck = $('#ablauf-zurueck'), leiste = $('.aktion-leiste'), toast = $('#toast');
  var lauf = null, stand = 0, wahl = {}, verlauf = [];
  var ruhig = function () { return h.classList.contains('ruhig') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  var IC = {
    kal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    klammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/></svg>',
    haken: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.2"/></svg>'
  };

  // optionen: [Wert, Zusatz, rechts, Bild]
  function wahlListe(name, optionen) {
    return '<div class="wahl" role="list">' + optionen.map(function (o) {
      var text = '<span>' + esc(o[0]) + (o[1] ? '<small>' + esc(o[1]) + '</small>' : '') + '</span>';
      if (o[3]) text = '<span class="foto"><img src="' + DEMO + 'img/' + o[3] + '.webp" alt="" width="56" height="56">' + text + '</span>';
      return '<button type="button" role="listitem" data-wert="' + esc(o[0]) + '" data-name="' + name + '"' + (wahl[name] === o[0] ? ' aria-pressed="true"' : '') + '>' + text + (o[2] ? '<em>' + esc(o[2]) + '</em>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function feld(id, label, typ, opt, extra) {
    var f = typ === 'textarea' ? '<textarea id="' + id + '" name="' + id + '"' + (extra || '') + '>' + esc(wahl[id] || '') + '</textarea>'
      : '<input id="' + id + '" name="' + id + '" type="' + typ + '" value="' + esc(wahl[id] || '') + '"' + (extra || '') + '>';
    return '<div class="feld"><label for="' + id + '">' + label + (opt ? ' <span class="opt">(' + opt + ')</span>' : '') + '</label>' + f + '<p class="fehler" id="' + id + '-fehler"></p></div>';
  }
  function kurzDetails() {
    var t = lauf.details().filter(function (d) { return !d[1] && !d[2]; }).map(function (d) { return esc(d[0]); });
    return t.length ? '<p class="details-kurz">' + t.join(' · ') + '</p>' : '';
  }
  function kontaktFelder() {
    return '<div class="felder">' + feld('name', 'Vor- und Nachname', 'text', '', ' autocomplete="name"')
      + '<div class="zwei">' + feld('telefon', 'Telefon', 'tel', '', ' autocomplete="tel" inputmode="tel"') + feld('email', 'E-Mail', 'email', '', ' autocomplete="email"') + '</div>'
      + '<p class="klein" style="margin:-.3rem 0 0">Telefon oder E-Mail genügt.</p></div>';
  }
  function sicher(t) { return '<p class="sicher">' + IC.schloss + '<span>' + t + '</span></p>'; }
  function info(t) { return '<p class="infozeile">' + IC.info + '<span>' + t + '</span></p>'; }
  function pruefeKontakt() {
    var ok = true, n = $('#name'), t = $('#telefon'), m = $('#email');
    $$('input,textarea', buehne).forEach(function (i) { if (i.type !== 'file' && i.id) wahl[i.id] = i.value.trim(); });
    [n, t, m].forEach(function (i) { i.closest('.feld').classList.remove('falsch'); i.removeAttribute('aria-invalid'); $('#' + i.id + '-fehler').textContent = ''; });
    function fehler(i, text) { ok = false; i.closest('.feld').classList.add('falsch'); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', i.id + '-fehler'); $('#' + i.id + '-fehler').textContent = text; }
    if (!wahl.name) fehler(n, 'Bitte den Namen angeben.');
    if (!wahl.telefon && !wahl.email) fehler(t, 'Bitte Telefon oder E-Mail angeben.');
    if (wahl.email && !/^\S+@\S+\.\S+$/.test(wahl.email)) fehler(m, 'Diese E-Mail-Adresse sieht nicht vollständig aus.');
    if (!ok) { var erstes = $('.feld.falsch input'); if (erstes) erstes.focus(); }
    return ok;
  }

  var REZEPT = { kasse: 'Ja, ein Kassenrezept', privat: 'Ja, ein Privatrezept', selbst: 'Nein, ich zahle selbst' };
  var HAUS = 'Hausbesuch ist angekreuzt';
  function mitRezept() { return wahl.rezept && wahl.rezept !== REZEPT.selbst; }
  function hausbesuch() { return wahl.art === HAUS; }
  function artKurz() { var m = /\((\w+)\)/.exec(wahl.art || ''); return m ? m[1] : (mitRezept() ? 'KG' : 'SZ'); }
  function therapeuten() { var a = artKurz(); return TEAM.filter(function (t) { return t.arten.indexOf(a) > -1; }); }
  function slotSchluessel() { return wahl.wer && wahl.wer.indexOf('Nächster') !== 0 ? wahl.wer : ''; }
  function dauer() { var a = wahl.art || ''; return a.indexOf('(KGG)') > -1 || a.indexOf('Gerätetraining') > -1 ? 60 : a.indexOf('(MLD)') > -1 || a.indexOf('Massage') > -1 ? 30 : a.indexOf('Bewegungs') > -1 ? 45 : 20; }

  var ABLAEUFE = {
    termin: {
      titel: 'Termin buchen', unter: 'Physio am Kai', kasten: 'Ihr Termin',
      details: function () {
        return [[!wahl.rezept ? 'Verordnung' : wahl.rezept === REZEPT.selbst ? 'Ohne Verordnung, selbst zahlend' : wahl.rezept === REZEPT.kasse ? 'Kassenrezept' : 'Privatrezept', !wahl.rezept],
          [wahl.art || 'Behandlung', !wahl.art],
          hausbesuch() ? ['Termine stimmt die Praxis telefonisch ab', false] : [wahl.wer ? (wahl.wer.indexOf('Nächster') === 0 ? 'Bei wem: egal' : 'Bei ' + wahl.wer) : 'Therapeutin oder Therapeut', !wahl.wer],
          hausbesuch() ? ['Hausbesuch bei Ihnen', false, true] : [wahl.zeit ? lang(wahl.tag) + ', ' + wahl.zeit + ' Uhr' : 'Datum und Uhrzeit', !wahl.zeit],
          ['Am Kai 7, 12345 Musterstadt', false, true]];
      },
      schritte: [
        { html: function () {
          return '<h2>Haben Sie eine Verordnung?</h2><p class="leise">Die Verordnung ist das Rezept von der Ärztin oder vom Arzt.</p>'
            + wahlListe('rezept', [[REZEPT.kasse, 'Gesetzlich versichert'], [REZEPT.privat, 'Privat versichert oder Beihilfe'], [REZEPT.selbst, 'Ohne Verordnung, zur Vorsorge und zum Wohlbefinden']]);
        } },
        { html: function () {
          if (mitRezept()) return '<h2>Was steht auf der Verordnung?</h2><p class="leise">Die Abkürzung steht im Feld „Heilmittel“.</p>'
            + wahlListe('art', [['Krankengymnastik (KG)', '20 Minuten'], ['Manuelle Therapie (MT)', '20 Minuten'], ['Manuelle Lymphdrainage (MLD)', '30 bis 60 Minuten, je nach Verordnung'], ['Krankengymnastik am Gerät (KGG)', '60 Minuten, in der Kleingruppe'],
              [HAUS, 'Die Praxis kommt zu Ihnen nach Hause'], ['Ich bin nicht sicher', 'Die Praxis sieht beim ersten Termin nach']]);
          return '<h2>Welche Leistung?</h2><p class="leise">Ohne Verordnung, zum Selbstzahlen. Die Preise gelten je Termin.</p>'
            + wahlListe('art', [['Klassische Massage', '30 Minuten', '39 €'], ['Bewegungs-Check mit Trainingsplan', '45 Minuten', '59 €'], ['Gerätetraining: Einweisung', '60 Minuten', '49 €']]);
        } },
        { wenn: function () { return !hausbesuch(); }, html: function () {
          return '<h2>Bei wem möchten Sie den Termin?</h2><p class="leise">Wer die gewählte Behandlung anbietet, steht hier.</p>'
            + wahlListe('wer', [['Nächster freier Termin', 'Egal bei wem']].concat(therapeuten().map(function (t) { return [t.name, t.kurz, '', t.bild]; })));
        } },
        { wenn: function () { return !hausbesuch(); }, html: function () {
          var liste = tage(slotSchluessel());
          if (wahl.tagIndex == null || !liste[wahl.tagIndex].zeiten.length) { var erster = liste.filter(function (x) { return x.zeiten.length; })[0]; wahl.tagIndex = liste.indexOf(erster); }
          var akt = liste[wahl.tagIndex];
          var tageHtml = liste.map(function (x, i) {
            return '<button type="button" class="tag' + (x.zeiten.length ? '' : ' leer') + '" data-tag="' + i + '" aria-pressed="' + (i === wahl.tagIndex) + '"' + (x.zeiten.length ? '' : ' disabled') + '><small>' + kurz(x.datum) + '</small><b>' + x.datum.getDate() + '.' + (x.datum.getMonth() + 1) + '.</b><em>' + (x.zeiten.length ? x.zeiten.length + ' frei' : 'belegt') + '</em></button>';
          }).join('');
          var zeitenHtml = akt.zeiten.map(function (z, i) { return '<button type="button" class="zeit" style="animation-delay:' + (i * 40) + 'ms" data-zeit="' + z + '" aria-pressed="' + (wahl.zeit === z && !!wahl.tag && wahl.tag.toDateString() === akt.datum.toDateString()) + '">' + z + '</button>'; }).join('');
          return '<h2>Wählen Sie den ersten Termin</h2><p class="leise">' + esc(wahl.art) + ', ' + dauer() + ' Minuten</p>' + kurzDetails()
            + (wahl.rezept === REZEPT.kasse ? info('Bei einem Kassenrezept muss die Behandlung spätestens 28 Tage nach dem Ausstellen beginnen. Ist „dringlicher Behandlungsbedarf“ angekreuzt, sind es 14 Tage.') : '')
            + '<div class="tage" role="group" aria-label="Tag wählen">' + tageHtml + '</div>'
            + '<p class="gruppe-titel" style="margin-top:.6rem">' + lang(akt.datum) + '</p><div class="zeiten" role="group" aria-label="Uhrzeit wählen">' + zeitenHtml + '</div>';
        } },
        { html: function () {
          var hb = hausbesuch();
          return '<h2>Ihre Angaben</h2><p class="leise">' + (hb ? 'Die Praxis ruft zurück und stimmt die Termine für den Hausbesuch ab.' : 'Für die Terminbestätigung. Angaben zur Diagnose sind nicht nötig.') + '</p>' + kurzDetails() + kontaktFelder()
            + (hb ? '<div class="felder" style="margin-top:.9rem">' + feld('ort', 'Adresse für den Hausbesuch', 'text', '', ' autocomplete="street-address"') + '</div>' : '')
            + sicher('Verschlüsselt übertragen. Die Daten sieht nur die Praxis.')
            + '<div class="schritt-fuss"><button class="knopf riesig" type="button" data-senden>' + (hb ? 'Hausbesuch anfragen' : 'Termin verbindlich buchen') + '</button></div>';
        } },
        { html: function () {
          if (hausbesuch()) return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Ihre Anfrage ist angekommen.</h2><p class="leise" style="max-width:26rem;margin:0 auto">Die Praxis ruft innerhalb eines Werktags zurück und stimmt die Termine für den Hausbesuch ab.</p>'
            + '<div class="zusammen"><p><span>Bereithalten</span><b>Verordnung und Versichertenkarte</b></p></div>'
            + '<div class="knopfzeile"><button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts verschickt.</p></div>';
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Ihr Termin ist gebucht.</h2><p class="leise">Eine Bestätigung geht an ' + esc(wahl.email || wahl.telefon) + '.</p>'
            + '<div class="zusammen"><p><span>Termin</span><b>' + esc(wahl.art) + '</b></p><p><span>Wann</span><b>' + lang(wahl.tag) + ', ' + wahl.zeit + ' Uhr</b></p>'
            + (wahl.wer && wahl.wer.indexOf('Nächster') !== 0 ? '<p><span>Bei</span><b>' + esc(wahl.wer) + '</b></p>' : '') + '<p><span>Wo</span><b>Am Kai 7, Erdgeschoss</b></p>'
            + '<p><span>Mitbringen</span><b>' + (mitRezept() ? 'Verordnung im Original, Versichertenkarte, großes Handtuch' : 'Großes Handtuch, bequeme Kleidung') + '</b></p></div>'
            + (mitRezept() ? '<p class="klein" style="max-width:27rem;margin:0 auto 1.2rem">Die weiteren Termine der Verordnung plant die Praxis beim ersten Termin mit Ihnen.</p>' : '')
            + '<div class="knopfzeile"><button class="knopf hell" type="button" data-kalender>' + IC.kal + ' In den Kalender</button><button class="knopf" type="button" data-schliessen>Fertig</button></div>'
            + '<p class="demo-hinweis">Demo: Es wurde nichts gebucht.</p></div>';
        } }
      ]
    },
    kurs: {
      titel: 'Kursplatz sichern', unter: 'Kurse am Kai', kasten: 'Ihr Kurs',
      details: function () {
        var k = KURSE.filter(function (x) { return x.name === wahl.kurs; })[0];
        return [[wahl.kurs || 'Kurs', !wahl.kurs], [k ? 'Start am ' + datum(k.start) + ', ' + k.wann : 'Start und Uhrzeit', !k], [k ? k.dauer + ', ' + k.preis : 'Dauer und Preis', !k], ['Kursraum, Am Kai 7', false, true]];
      },
      schritte: [
        { html: function () {
          return '<h2>Welcher Kurs?</h2><p class="leise">Kleine Gruppen mit höchstens zehn Plätzen.</p>'
            + wahlListe('kurs', KURSE.map(function (k) { return [k.name, 'Start ' + datum(k.start) + ', ' + k.wann + ' · ' + k.dauer, k.frei + ' frei']; }));
        } },
        { html: function () {
          var k = KURSE.filter(function (x) { return x.name === wahl.kurs; })[0];
          return '<h2>Ihre Angaben</h2><p class="leise">Für die Anmeldung zu „' + esc(wahl.kurs) + '“, ' + k.preis + ' für ' + k.dauer + '.</p>' + kurzDetails()
            + (k.kasse ? info('Dieser Kurs ist als Präventionskurs zertifiziert. Viele gesetzliche Krankenkassen erstatten bei regelmäßiger Teilnahme einen Teil der Kursgebühr. Die Bescheinigung dafür gibt es nach dem Kurs.') : '')
            + kontaktFelder() + sicher('Verschlüsselt übertragen. Die Daten sieht nur die Praxis.')
            + '<div class="schritt-fuss"><button class="knopf riesig" type="button" data-senden>Platz verbindlich buchen</button></div>';
        } },
        { html: function () {
          var k = KURSE.filter(function (x) { return x.name === wahl.kurs; })[0];
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Ihr Platz ist gesichert.</h2><p class="leise">Eine Bestätigung geht an ' + esc(wahl.email || wahl.telefon) + '.</p>'
            + '<div class="zusammen"><p><span>Kurs</span><b>' + esc(k.name) + '</b></p><p><span>Start</span><b>' + lang(k.start) + '</b></p><p><span>Wann</span><b>' + k.wann + '</b></p><p><span>Mitbringen</span><b>Bequeme Kleidung, Handtuch, etwas zu trinken</b></p></div>'
            + '<div class="knopfzeile"><button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts gebucht.</p></div>';
        } }
      ]
    },
    absage: {
      titel: 'Termin absagen oder verschieben', unter: 'Physio am Kai', kasten: 'Ihre Nachricht',
      details: function () { return [[wahl.was || 'Absagen oder verschieben', !wahl.was], ['Die Praxis bestätigt per ' + (wahl.email ? 'E-Mail' : 'Rückruf oder E-Mail'), false, true]]; },
      schritte: [
        { html: function () {
          return '<h2>Was möchten Sie?</h2><p class="leise">Geht auch abends und am Wochenende, ohne Anruf.</p>'
            + wahlListe('was', [['Termin absagen', 'Der Termin wird für andere frei'], ['Termin verschieben', 'Die Praxis schlägt einen neuen Termin vor']])
            + '<p class="hinweis" style="margin-top:1.3rem"><b>Bitte spätestens 24 Stunden vorher</b>Dann kann jemand anderes den Termin bekommen.</p>';
        } },
        { html: function () {
          var v = wahl.was === 'Termin verschieben';
          wahl.besser = wahl.besser || [];
          return '<h2>Um welchen Termin geht es?</h2><p class="leise">Ein Grund muss nicht angegeben werden.</p>' + kurzDetails()
            + '<div class="felder" style="margin-bottom:.9rem"><div class="zwei">' + feld('tagalt', 'Datum des Termins', 'date', '') + feld('uhralt', 'Uhrzeit', 'text', 'falls bekannt', ' inputmode="numeric" placeholder="z. B. 14:40"') + '</div></div>'
            + (v ? '<p class="gruppe-titel">Wann passt es besser?</p><div class="chips" style="margin-bottom:1.1rem">' + ['vormittags', 'nachmittags', 'ab 17 Uhr'].map(function (x) { return '<button type="button" class="chip" data-chip="besser" aria-pressed="' + (wahl.besser.indexOf(x) > -1) + '">' + x + '</button>'; }).join('') + '</div>' : '')
            + kontaktFelder() + sicher('Verschlüsselt übertragen. Die Nachricht liest nur die Praxis.')
            + '<div class="schritt-fuss"><button class="knopf riesig" type="button" data-senden>' + (v ? 'Verschieben anfragen' : 'Termin absagen') + '</button></div>';
        } },
        { html: function () {
          var v = wahl.was === 'Termin verschieben';
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>' + (v ? 'Ihre Anfrage ist angekommen.' : 'Der Termin ist abgesagt.') + '</h2><p class="leise" style="max-width:26rem;margin:0 auto">'
            + (v ? 'Die Praxis meldet sich mit einem neuen Terminvorschlag.' : 'Die Praxis bestätigt die Absage. Ein neuer Termin lässt sich jederzeit online buchen.') + '</p>'
            + '<div class="knopfzeile" style="margin-top:1.4rem">' + (v ? '' : '<button class="knopf hell" type="button" data-flow="termin">Neuen Termin buchen</button>') + '<button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts verschickt.</p></div>';
        } }
      ]
    },
    bewerbung: {
      titel: 'Kurzbewerbung', unter: 'In zwei Minuten, ohne Anschreiben', kasten: 'Ihre Bewerbung',
      details: function () { return [[wahl.stelle || 'Stelle', !wahl.stelle], [wahl.umfang || 'Umfang', !wahl.umfang], ['Antwort innerhalb von zwei Werktagen', false, true]]; },
      schritte: [
        { html: function () {
          return '<h2>Für welche Stelle?</h2><p class="leise">Ein Anschreiben ist nicht nötig.</p>'
            + wahlListe('stelle', [['Physiotherapeutin oder Physiotherapeut', 'Voll- oder Teilzeit, ab sofort'], ['Rezeption und Terminplanung', 'Teilzeit, 20 Stunden'], ['Etwas anderes', 'Zum Beispiel Praktikum oder Ausbildung']]);
        } },
        { html: function () {
          return '<h2>In welchem Umfang?</h2><p class="leise">Die Stunden lassen sich später genau besprechen.</p>' + kurzDetails()
            + wahlListe('umfang', [['Vollzeit', ''], ['Teilzeit', ''], ['Minijob', ''], ['Noch offen', '']]);
        } },
        { html: function () {
          return '<h2>Wie erreicht die Praxis Sie?</h2><p class="leise">Hanna Brandt meldet sich persönlich.</p>' + kurzDetails() + kontaktFelder()
            + '<label class="datei" style="margin-top:1rem">' + IC.klammer + '<input type="file" id="anhang"> Lebenslauf anhängen <span>(freiwillig)</span></label>'
            + sicher('Verschlüsselt übertragen. Die Bewerbung liest nur die Praxisleitung.')
            + '<div class="schritt-fuss"><button class="knopf riesig" type="button" data-senden>Bewerbung absenden</button></div>';
        } },
        { html: function () {
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Danke, die Bewerbung ist angekommen.</h2><p class="leise" style="max-width:26rem;margin:0 auto">Hanna Brandt meldet sich innerhalb von zwei Werktagen, per ' + (wahl.telefon ? 'Telefon' : 'E-Mail') + '.</p>'
            + '<div class="knopfzeile" style="margin-top:1.4rem"><button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts verschickt.</p></div>';
        } }
      ]
    }
  };

  function aktive() { return lauf.schritte.filter(function (s) { return !s.wenn || s.wenn(); }); }
  function weiter() { verlauf.push(stand); zeige(stand + 1, 1); }

  function detailsZeichnen() {
    var d = lauf.details();
    details.innerHTML = '<h4>' + lauf.kasten + '</h4><div class="details-praxis"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#zeichen"/></svg><span><b>Physio am Kai</b><small>Am Kai 7, Musterstadt</small></span></div>'
      + '<ul class="details-liste">' + d.map(function (x) { return '<li' + (x[1] ? ' class="offen"' : '') + '>' + esc(x[0]) + '</li>'; }).join('') + '</ul>';
  }

  function zeige(n, richtung) {
    var liste = aktive();
    stand = Math.min(n, liste.length - 1);
    var anzahl = liste.length, fertig = stand === anzahl - 1;
    var html = '<div class="schritt">' + liste[stand].html() + '</div>';
    var alt = buehne.firstElementChild;
    var setzen = function () {
      buehne.innerHTML = html;
      var neu = buehne.firstElementChild;
      buehne.scrollTop = 0;
      if (richtung && !ruhig()) {
        neu.classList.add(richtung > 0 ? 'von-rechts' : 'von-links');
        requestAnimationFrame(function () { requestAnimationFrame(function () { neu.classList.remove('von-rechts', 'von-links'); }); });
      }
      var fokus = neu.querySelector('h2');
      if (fokus && beruehrt) { fokus.setAttribute('tabindex', '-1'); fokus.focus({ preventScroll: true }); }
    };
    if (alt && richtung && !ruhig()) { alt.classList.add(richtung > 0 ? 'von-links' : 'von-rechts'); setTimeout(setzen, 200); } else setzen();
    balken.style.width = (fertig ? 100 : Math.round((stand / (anzahl - 1)) * 100)) + '%';
    zurueck.hidden = stand === 0 || fertig;
    detailsZeichnen();
  }

  function oeffne(name, vorwahl) {
    if (!ABLAEUFE[name]) return;
    lauf = ABLAEUFE[name]; wahl = vorwahl || {}; verlauf = [];
    titel.textContent = lauf.titel; unter.textContent = lauf.unter;
    zuKlappen();
    if (!dlg.open) {
      if (EIN && !beruehrt) dlg.setAttribute('open', ''); else dlg.showModal();
      if (leiste) leiste.classList.add('weg');
      h.classList.add('ablauf-offen');
      requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('auf'); }); });
    }
    var beginn = 0;
    if (name === 'kurs' && wahl.kurs) { beginn = 1; verlauf = [0]; }
    zeige(beginn, 0);
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }
  function schliesse() {
    dlg.classList.remove('auf');
    h.classList.remove('ablauf-offen');
    if (leiste) leiste.classList.remove('weg');
    setTimeout(function () { if (dlg.open) dlg.close(); }, ruhig() ? 0 : 320);
    if (/^#(termin|kurs|absage|bewerbung)$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-flow]');
    if (a) {
      e.preventDefault();
      var vor = {};
      if (a.dataset.kurs) { var k = KURSE.filter(function (x) { return x.id === a.dataset.kurs; })[0]; if (k) vor.kurs = k.name; }
      oeffne(a.dataset.flow, vor); return;
    }
    if (!dlg.open || !dlg.contains(e.target)) return;
    var b;
    if ((b = e.target.closest('[data-schliessen]'))) { schliesse(); return; }
    if ((b = e.target.closest('.wahl button'))) {
      wahl[b.dataset.name] = b.dataset.wert;
      $$('.wahl button', buehne).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (b.dataset.name === 'rezept') { delete wahl.art; delete wahl.wer; }
      if (b.dataset.name === 'art') delete wahl.wer;
      if (/^(rezept|art|wer)$/.test(b.dataset.name)) { delete wahl.zeit; delete wahl.tag; delete wahl.tagIndex; }
      detailsZeichnen();
      setTimeout(weiter, ruhig() ? 0 : 160);
      return;
    }
    if ((b = e.target.closest('.tag'))) { wahl.tagIndex = +b.dataset.tag; zeige(stand, 0); return; }
    if ((b = e.target.closest('.zeit'))) {
      wahl.zeit = b.dataset.zeit; wahl.tag = tage(slotSchluessel())[wahl.tagIndex].datum;
      $$('.zeit', buehne).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      detailsZeichnen(); setTimeout(weiter, ruhig() ? 0 : 220); return;
    }
    if ((b = e.target.closest('.chip'))) {
      var g = b.dataset.chip, w = b.textContent, i = wahl[g].indexOf(w);
      if (i > -1) wahl[g].splice(i, 1); else wahl[g].push(w);
      b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true'); return;
    }
    if (e.target.closest('[data-senden]')) { if (pruefeKontakt()) weiter(); return; }
    if (e.target.closest('[data-kalender]')) { kalender(); return; }
  });
  zurueck.addEventListener('click', function () { if (verlauf.length) zeige(verlauf.pop(), -1); });
  $('#ablauf-zu').addEventListener('click', schliesse);
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); schliesse(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) schliesse(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zuKlappen(); });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'anhang' && e.target.files[0]) e.target.parentNode.querySelector('span').textContent = e.target.files[0].name;
  });

  function meldung(t) { toast.textContent = t; toast.classList.add('da'); clearTimeout(meldung.z); meldung.z = setTimeout(function () { toast.classList.remove('da'); }, 2600); }
  function kalender() {
    var d = new Date(wahl.tag), p = wahl.zeit.split(':'); d.setHours(+p[0], +p[1], 0, 0);
    var e = new Date(d.getTime() + dauer() * 6e4), f = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Demo//Physio am Kai//DE', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@demo', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(d), 'DTEND:' + f(e),
      'SUMMARY:' + wahl.art + ' (Demo)', 'LOCATION:Am Kai 7\\, 12345 Musterstadt', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'termin-physio-am-kai.ics';
    document.body.appendChild(a); a.click(); a.remove(); meldung('Kalendereintrag erstellt (Demo)');
  }

  // Direkt öffnen über #termin, #kurs, #absage oder #bewerbung
  var anker = location.hash.replace('#', '');
  if (ABLAEUFE[anker]) oeffne(anker);
  window.addEventListener('hashchange', function () { var s = location.hash.replace('#', ''); if (ABLAEUFE[s]) oeffne(s); });
})();
