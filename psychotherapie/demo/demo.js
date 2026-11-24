/* Demo-Praxis „Praxis am Stadtgarten“ (erfundene Daten). Quelle: tools/psy_demo/demo.js. Gehört Psyche.
   In der Demo wird nichts verschickt und nichts gebucht. */
(function () {
  'use strict';
  var h = document.documentElement;
  var q = new URLSearchParams(location.search);
  /* Einbett-Ansicht: Die Demo läuft in einem Handy-Rahmen auf Leons Seite. Dann ohne gespeicherte Einstellungen
     (nur die aus der Adresse), ohne Demo-Leiste und ohne den Fokus der äußeren Seite an sich zu ziehen. */
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

  /* ---------- Leiste von Leon: zurück zur Seite, von der man kam ---------- */
  try { if (q.get('von')) sessionStorage.setItem('demo-von', q.get('von') === 'entwurf' ? 'entwurf' : 'seite'); } catch (e) {}
  var von = 'seite'; try { von = sessionStorage.getItem('demo-von') || 'seite'; } catch (e) {}
  $$('[data-zurueck]').forEach(function (a) { a.href = von === 'entwurf' ? '/psychotherapie/entwurf/#demo' : '/psychotherapie/#demo'; });
  $$('[data-cta]').forEach(function (a) { a.href = von === 'entwurf' ? '/psychotherapie/entwurf/#entwurf' : '/psychotherapie/#anfrage'; });

  if (EIN && location.search) $$('a[href^="/psychotherapie/demo/"]').forEach(function (a) {
    var u = a.getAttribute('href').split('#'); if (u[0].indexOf('?') < 0) a.setAttribute('href', u[0] + location.search + (u[1] ? '#' + u[1] : ''));
  });

  /* ---------- Barrierefreiheit ---------- */
  $$('.schalt').forEach(function (b) {
    var k = 'demo-' + b.dataset.klasse, an = lies(k) || (EIN && q.get(b.dataset.klasse) === '1');
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
    var l = $('.aktion-leiste'), k = $('.auftakt .knopfzeile');
    if (!l || !k || !('IntersectionObserver' in window)) return;
    l.classList.add('oben');
    new IntersectionObserver(function (es) { l.classList.toggle('oben', es[0].isIntersecting); }).observe(k);
  })();

  /* ---------- Demo-Schalter: keine freien Plätze ---------- */
  h.classList.toggle('voll', q.get('plaetze') === 'voll' || (EIN && q.get('voll') === '1') || (q.get('plaetze') !== 'frei' && lies('demo-voll')));
  function schalterText() { $$('[data-plaetze]').forEach(function (b) { b.textContent = h.classList.contains('voll') ? 'Ansicht: Plätze frei' : 'Ansicht: Keine Plätze frei'; }); }
  $$('[data-plaetze]').forEach(function (b) { b.addEventListener('click', function () { var v = !h.classList.contains('voll'); h.classList.toggle('voll', v); merke('demo-voll', v); schalterText(); naechsterTermin(); }); });
  schalterText();

  /* ---------- Sanftes Einblenden ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    $$('.zeige').forEach(function (el) { io.observe(el); });
  } else { $$('.zeige').forEach(function (el) { el.classList.add('da'); }); }

  /* ---------- Telefonzeiten und freie Termine (immer ab heute gerechnet) ---------- */
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var TELEFON = { 1: ['12:30', '13:00'], 3: ['12:30', '13:00'], 5: ['8:00', '8:30'] };
  function minuten(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  var jetzt = new Date();
  $$('tr[data-tag="' + jetzt.getDay() + '"]').forEach(function (r) { r.classList.add('heute'); });
  (function telefonStatus() {
    var el = $$('[data-telefon]'); if (!el.length) return;
    var t = TELEFON[jetzt.getDay()], m = jetzt.getHours() * 60 + jetzt.getMinutes(), text, an = false;
    if (t && m >= minuten(t[0]) && m < minuten(t[1])) { text = 'Jetzt erreichbar, bis ' + t[1] + ' Uhr'; an = true; }
    else {
      for (var i = 0; i < 8; i++) {
        var d = (jetzt.getDay() + i) % 7, z = TELEFON[d];
        if (z && (i > 0 || m < minuten(z[0]))) { text = (i === 0 ? 'Heute' : i === 1 ? 'Morgen' : TAGE[d]) + ' ab ' + z[0] + ' Uhr'; break; }
      }
    }
    el.forEach(function (e) { e.querySelector('b').textContent = text; e.classList.toggle('aus', !an); });
  })();

  var ZEITEN = ['8:30', '9:20', '10:10', '11:00', '14:00', '14:50', '15:40', '16:30', '17:20'];
  function tage() {
    var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
    while (out.length < 10) { d = new Date(d.getTime() + 864e5); if (d.getDay() > 0 && d.getDay() < 6) out.push(d); }
    return out.map(function (tag, i) {
      var s = tag.getDate() * 7 + tag.getMonth() * 3;
      var z = ZEITEN.filter(function (_, j) { return (s + j * 5) % 7 < 3; });
      if (i === 0) z = [];
      return { datum: tag, zeiten: z };
    });
  }
  function kurz(d) { return d.toLocaleDateString('de-DE', { weekday: 'short' }).replace('.', ''); }
  function lang(d) { return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function naechsterTermin() {
    var t = tage().filter(function (x) { return x.zeiten.length; })[0];
    $$('[data-naechster]').forEach(function (e) { e.textContent = h.classList.contains('voll') ? 'Zurzeit keine freien Termine' : lang(t.datum) + ', ' + t.zeiten[0] + ' Uhr'; });
  }
  naechsterTermin();

  /* ---------- Ablauf-Fenster ---------- */
  var dlg = $('#ablauf'), buehne = $('#ablauf-buehne'), details = $('#ablauf-details'), titel = $('#ablauf-titel'), unter = $('#ablauf-unter');
  var balken = $('#ablauf-balken'), zurueck = $('#ablauf-zurueck'), leiste = $('.aktion-leiste'), toast = $('#toast');
  var lauf = null, stand = 0, wahl = {}, verlauf = [];
  var ruhig = function () { return h.classList.contains('ruhig') || window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  var IC = {
    pfeil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    kal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    schloss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    klammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/></svg>',
    haken: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    uhr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
  };

  function wahlListe(name, optionen) {
    return '<div class="wahl" role="list">' + optionen.map(function (o) {
      return '<button type="button" role="listitem" data-wert="' + esc(o[0]) + '" data-name="' + name + '"' + (wahl[name] === o[0] ? ' aria-pressed="true"' : '') + '><span>' + esc(o[0]) + (o[1] ? '<small>' + esc(o[1]) + '</small>' : '') + '</span></button>';
    }).join('') + '</div>';
  }
  function feld(id, label, typ, opt, extra) {
    var f = typ === 'textarea' ? '<textarea id="' + id + '" name="' + id + '"' + (extra || '') + '>' + esc(wahl[id] || '') + '</textarea>'
      : '<input id="' + id + '" name="' + id + '" type="' + typ + '" value="' + esc(wahl[id] || '') + '"' + (extra || '') + '>';
    return '<div class="feld"><label for="' + id + '">' + label + (opt ? ' <span class="opt">(' + opt + ')</span>' : '') + '</label>' + f + '<p class="fehler" id="' + id + '-fehler"></p></div>';
  }
  function kurzDetails() {
    var t = lauf.details().filter(function (d) { return !d[1] && !d[2]; }).map(function (d) { return esc(d[0]); });
    return t.length ? '<p class="details-kurz">' + t.join(', ') + '</p>' : '';
  }
  var kontaktFelder = function () {
    return '<div class="felder">' + feld('name', 'Vor- und Nachname', 'text', '', ' autocomplete="name"')
      + '<div class="zwei">' + feld('telefon', 'Telefon', 'tel', '', ' autocomplete="tel" inputmode="tel"') + feld('email', 'E-Mail', 'email', '', ' autocomplete="email"') + '</div>'
      + '<p class="klein" style="margin:-.3rem 0 0">Telefon oder E-Mail genügt.</p></div>';
  };
  function pruefeKontakt() {
    var ok = true, n = $('#name'), t = $('#telefon'), m = $('#email');
    [n, t, m].forEach(function (i) { wahl[i.id] = i.value.trim(); i.closest('.feld').classList.remove('falsch'); i.removeAttribute('aria-invalid'); });
    function fehler(i, text) { ok = false; i.closest('.feld').classList.add('falsch'); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', i.id + '-fehler'); $('#' + i.id + '-fehler').textContent = text; }
    if (!wahl.name) fehler(n, 'Bitte den Namen angeben.');
    if (!wahl.telefon && !wahl.email) fehler(t, 'Bitte Telefon oder E-Mail angeben.');
    if (wahl.email && !/^\S+@\S+\.\S+$/.test(wahl.email)) fehler(m, 'Diese E-Mail-Adresse sieht nicht vollständig aus.');
    if (!ok) { var erstes = $('.feld.falsch input'); if (erstes) erstes.focus(); }
    return ok;
  }
  function weiter() { verlauf.push(stand); zeige(stand + 1, 1); }

  var ABLAEUFE = {
    termin: {
      titel: 'Sprechstunde buchen', unter: 'Praxis am Stadtgarten', kasten: 'Ihr Termin',
      details: function () {
        return [[!wahl.neu ? 'Neu oder schon in Behandlung' : wahl.neu.indexOf('Nein') === 0 ? 'Neu in der Praxis' : 'Schon in Behandlung', !wahl.neu], [wahl.versicherung || 'Versicherung', !wahl.versicherung], [wahl.art || 'Terminart', !wahl.art],
          [wahl.zeit ? lang(wahl.tag) + ', ' + wahl.zeit + ' Uhr' : 'Datum und Uhrzeit', !wahl.zeit], ['Stadtgarten 22, 12345 Musterstadt', false, true]];
      },
      schritte: [
        function () {
          return '<h2>Waren Sie schon einmal in dieser Praxis?</h2><p class="leise">Damit die passende Terminart angezeigt wird.</p>'
            + wahlListe('neu', [['Nein, ich bin neu hier', 'Erster Kontakt mit der Praxis'], ['Ja, ich war schon in Behandlung', 'Termine für bestehende Patientinnen und Patienten']]);
        },
        function () {
          return '<h2>Wie sind Sie versichert?</h2><p class="leise">Die Praxis rechnet mit allen Kassen ab.</p>'
            + wahlListe('versicherung', [['Gesetzlich versichert', ''], ['Privat versichert oder Beihilfe', ''], ['Selbst zahlend', '']]);
        },
        function () {
          var neu = wahl.neu !== 'Ja, ich war schon in Behandlung';
          return '<h2>Welche Terminart?</h2><p class="leise">' + (neu ? 'Der erste Schritt ist die Sprechstunde, zum Kennenlernen und um Fragen zu klären.' : 'Für Patientinnen und Patienten der Praxis.') + '</p>'
            + (neu ? '<p class="gruppe-titel">Erster Termin</p>' + wahlListe('art', [['Psychotherapeutische Sprechstunde', '50 Minuten, vor Ort']])
              + '<p class="klein" style="margin-top:1rem">Einen Therapieplatz vergibt die Praxis nach der Sprechstunde. <a href="#warteliste" data-flow="warteliste">Zur Warteliste</a></p>'
              : '<p class="gruppe-titel">Folgetermine</p>' + wahlListe('art', [['Einzelsitzung', '50 Minuten, vor Ort'], ['Einzelsitzung per Video', '50 Minuten, per Video']]));
        },
        function () {
          if (h.classList.contains('voll')) {
            return '<div class="leer-zustand"><div class="kreis">' + IC.kal + '</div><h2>Zurzeit keine freien Termine</h2><p class="leise" style="max-width:26rem;margin:0 auto 1.3rem">Alle Sprechstunden sind vergeben und die Warteliste ist geschlossen. Bei der Suche nach einem Platz hilft die Terminservicestelle unter <span class="nw">116 117</span>.</p>'
              + '<div class="knopfzeile" style="justify-content:center"><a class="knopf" href="https://www.116117.de" target="_blank" rel="noopener">116117.de öffnen</a><button class="knopf hell" type="button" data-flow="nachricht">Nachricht an die Praxis</button></div></div>';
          }
          var liste = tage();
          if (wahl.tagIndex == null) { var erster = liste.filter(function (x) { return x.zeiten.length; })[0]; wahl.tagIndex = liste.indexOf(erster); }
          var akt = liste[wahl.tagIndex];
          var tageHtml = liste.map(function (x, i) {
            return '<button type="button" class="tag' + (x.zeiten.length ? '' : ' leer') + '" data-tag="' + i + '" aria-pressed="' + (i === wahl.tagIndex) + '"' + (x.zeiten.length ? '' : ' disabled') + '><small>' + kurz(x.datum) + '</small><b>' + x.datum.getDate() + '.' + (x.datum.getMonth() + 1) + '.</b><em>' + (x.zeiten.length ? x.zeiten.length + ' frei' : 'belegt') + '</em></button>';
          }).join('');
          var zeitenHtml = akt.zeiten.map(function (z, i) { return '<button type="button" class="zeit" style="animation-delay:' + (i * 40) + 'ms" data-zeit="' + z + '" aria-pressed="' + (wahl.zeit === z && !!wahl.tag && wahl.tag.toDateString() === akt.datum.toDateString()) + '">' + z + '</button>'; }).join('');
          return '<h2>Wählen Sie einen Termin</h2><p class="leise">' + esc(wahl.art || 'Sprechstunde') + ', 50 Minuten</p>' + kurzDetails()
            + '<div class="tage" role="group" aria-label="Tag wählen">' + tageHtml + '</div>'
            + '<p class="gruppe-titel" style="margin-top:.8rem">' + lang(akt.datum) + '</p><div class="zeiten" role="group" aria-label="Uhrzeit wählen">' + zeitenHtml + '</div>';
        },
        function () {
          return '<h2>Ihre Angaben</h2><p class="leise">Für die Terminbestätigung. Angaben zum Anliegen sind nicht nötig.</p>' + kurzDetails() + kontaktFelder()
            + '<p class="sicher">' + IC.schloss + '<span>Verschlüsselt übertragen. Die Daten sieht nur die Praxis.</span></p>'
            + '<div class="schritt-fuss"><button class="knopf" type="button" data-senden>Termin verbindlich buchen</button></div>';
        },
        function () {
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Ihr Termin ist gebucht.</h2><p class="leise">Eine Bestätigung geht an ' + esc(wahl.email || wahl.telefon) + '.</p>'
            + '<div class="zusammen"><p><span>Termin</span><b>' + esc(wahl.art) + '</b></p><p><span>Wann</span><b>' + lang(wahl.tag) + ', ' + wahl.zeit + ' Uhr</b></p><p><span>Wo</span><b>Stadtgarten 22, 2. Etage</b></p><p><span>Mitbringen</span><b>Versichertenkarte</b></p></div>'
            + '<div class="knopfzeile"><button class="knopf hell" type="button" data-kalender>' + IC.kal + ' In den Kalender</button><button class="knopf" type="button" data-schliessen>Fertig</button></div>'
            + '<p class="demo-hinweis">Demo: Es wurde nichts gebucht.</p></div>';
        }
      ]
    },
    warteliste: {
      titel: 'Warteliste', unter: 'Für einen Therapieplatz', kasten: 'Ihre Angaben',
      details: function () {
        return [[wahl.versicherung || 'Versicherung', !wahl.versicherung], [wahl.tage && wahl.tage.length ? 'Gut erreichbar: ' + wahl.tage.join(', ') : 'Erreichbarkeit', !(wahl.tage && wahl.tage.length)], ['Rückmeldung, sobald ein Platz frei ist', false, true]];
      },
      schritte: [
        function () {
          if (h.classList.contains('voll')) {
            return '<div class="leer-zustand"><div class="kreis">' + IC.uhr + '</div><h2>Die Warteliste ist zurzeit geschlossen</h2><p class="leise" style="max-width:26rem;margin:0 auto 1.3rem">Sobald wieder Plätze frei werden, steht es hier. Bei der Suche nach einem Platz hilft die Terminservicestelle unter <span class="nw">116 117</span>.</p>'
              + '<div class="knopfzeile" style="justify-content:center"><a class="knopf" href="https://www.116117.de" target="_blank" rel="noopener">116117.de öffnen</a></div></div>';
          }
          return '<h2>Auf die Warteliste</h2><p class="leise">Für einen Therapieplatz nach der Sprechstunde. Plätze werden in der Reihenfolge der Anmeldung vergeben.</p>'
            + '<p class="gruppe-titel">Versicherung</p>' + wahlListe('versicherung', [['Gesetzlich versichert', ''], ['Privat versichert oder Beihilfe', ''], ['Selbst zahlend', '']]);
        },
        function () {
          var t = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'], z = ['vormittags', 'nachmittags', 'ab 17 Uhr'];
          wahl.tage = wahl.tage || []; wahl.tageszeit = wahl.tageszeit || [];
          var chip = function (liste, gruppe) { return '<div class="chips">' + liste.map(function (x) { return '<button type="button" class="chip" data-chip="' + gruppe + '" aria-pressed="' + (wahl[gruppe].indexOf(x) > -1) + '">' + x + '</button>'; }).join('') + '</div>'; };
          return '<h2>Wann passen Termine?</h2><p class="leise">Damit ein freier Platz schnell zugeordnet werden kann. Mehrfachauswahl möglich.</p>' + kurzDetails()
            + '<p class="gruppe-titel">Tage</p>' + chip(t, 'tage') + '<p class="gruppe-titel">Tageszeit</p>' + chip(z, 'tageszeit')
            + '<div class="schritt-fuss"><button class="knopf" type="button" data-weiter>Weiter</button></div>';
        },
        function () {
          return '<h2>Wie erreicht die Praxis Sie?</h2><p class="leise">Für die Rückmeldung, sobald ein Platz frei ist. Angaben zum Anliegen sind nicht nötig.</p>' + kurzDetails() + kontaktFelder()
            + '<p class="sicher">' + IC.schloss + '<span>Verschlüsselt übertragen. Die Daten sieht nur die Praxis.</span></p>'
            + '<div class="schritt-fuss"><button class="knopf" type="button" data-senden>Auf die Warteliste</button></div>';
        },
        function () {
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Sie stehen auf der Warteliste.</h2><p class="leise" style="max-width:26rem;margin:0 auto">Die Praxis meldet sich, sobald ein Platz frei ist. Bis dahin ist nichts weiter zu tun.</p>'
            + '<div class="knopfzeile"><button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts verschickt.</p></div>';
        }
      ]
    },
    nachricht: {
      titel: 'Nachricht an die Praxis', unter: 'Verschlüsselt übertragen', kasten: 'Ihre Nachricht',
      details: function () { return [[wahl.thema || 'Thema', !wahl.thema], ['Antwort meist innerhalb von zwei Werktagen', false, true]]; },
      schritte: [
        function () {
          return '<h2>Worum geht es?</h2><p class="leise">Für alles Organisatorische, ohne auf die Telefonzeit zu warten.</p>'
            + wahlListe('thema', [['Termin verschieben oder absagen', 'Bitte mindestens 48 Stunden vorher'], ['Bescheinigung oder Unterlagen', 'z. B. für Arbeitgeber oder Versicherung'], ['Frage zur Abrechnung', ''], ['Etwas anderes', '']])
            + '<p class="hinweis" style="margin-top:1.3rem"><b>Nicht für Notfälle</b>In einer akuten Krise: Notruf <span class="nw">112</span> oder Telefonseelsorge <span class="nw">0800 111 0 111</span>, kostenlos und rund um die Uhr.</p>';
        },
        function () {
          return '<h2>Ihre Nachricht</h2><p class="leise">Persönliches besprechen Sie am besten in der Sitzung.</p>' + kurzDetails() + '<div class="felder" style="margin-bottom:1rem">' + feld('text', 'Nachricht', 'textarea', '', ' rows="5"') + '</div>' + kontaktFelder()
            + '<label class="datei" style="margin-top:1rem">' + IC.klammer + '<input type="file" id="anhang"> Datei anhängen <span>(freiwillig, z. B. Formular als PDF)</span></label>'
            + '<p class="sicher">' + IC.schloss + '<span>Verschlüsselt übertragen. Die Nachricht liest nur die Praxis.</span></p>'
            + '<div class="schritt-fuss"><button class="knopf" type="button" data-senden>Nachricht senden</button></div>';
        },
        function () {
          return '<div class="erfolg"><div class="haken">' + IC.haken + '</div><h2>Nachricht gesendet.</h2><p class="leise" style="max-width:26rem;margin:0 auto">Die Praxis antwortet in der Regel innerhalb von zwei Werktagen, per ' + (wahl.email ? 'E-Mail' : 'Rückruf') + '.</p>'
            + '<div class="knopfzeile"><button class="knopf" type="button" data-schliessen>Fertig</button></div><p class="demo-hinweis">Demo: Es wurde nichts verschickt.</p></div>';
        }
      ]
    }
  };

  function detailsZeichnen() {
    var d = lauf.details();
    details.innerHTML = '<h4>' + lauf.kasten + '</h4><div class="details-praxis"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#blatt"/></svg><span><b>Praxis am Stadtgarten</b><small>Psychotherapie, Jona Albers</small></span></div>'
      + '<ul class="details-liste">' + d.map(function (x) { return '<li' + (x[1] ? ' class="offen"' : '') + '>' + esc(x[0]) + '</li>'; }).join('') + '</ul>';
  }

  function zeige(n, richtung) {
    stand = n;
    var anzahl = lauf.schritte.length, fertig = n === anzahl - 1;
    var html = '<div class="schritt">' + lauf.schritte[n]() + '</div>';
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
    if (alt && richtung && !ruhig()) {
      alt.classList.add(richtung > 0 ? 'von-links' : 'von-rechts');
      setTimeout(setzen, 200);
    } else setzen();
    balken.style.width = (fertig ? 100 : Math.round((n / (anzahl - 1)) * 100)) + '%';
    zurueck.hidden = n === 0 || fertig;
    detailsZeichnen();
  }

  function oeffne(name) {
    if (!ABLAEUFE[name]) return;
    lauf = ABLAEUFE[name]; wahl = {}; verlauf = [];
    titel.textContent = lauf.titel; unter.textContent = lauf.unter;
    zuKlappen();
    if (!dlg.open) {
      if (EIN && !beruehrt) dlg.setAttribute('open', ''); else dlg.showModal();
      if (leiste) leiste.classList.add('weg');
      requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('auf'); }); });
    }
    zeige(0, 0);
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
  }
  function schliesse() {
    dlg.classList.remove('auf');
    if (leiste) leiste.classList.remove('weg');
    setTimeout(function () { if (dlg.open) dlg.close(); }, ruhig() ? 0 : 320);
    if (/^#(termin|warteliste|nachricht)$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-flow]');
    if (a) { e.preventDefault(); oeffne(a.dataset.flow); return; }
    if (!dlg.open || !dlg.contains(e.target)) return;
    var b;
    if ((b = e.target.closest('[data-schliessen]'))) { schliesse(); return; }
    if ((b = e.target.closest('.wahl button'))) {
      wahl[b.dataset.name] = b.dataset.wert;
      $$('.wahl button', buehne).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      if (b.dataset.name === 'neu' || b.dataset.name === 'art') { delete wahl.zeit; delete wahl.tag; delete wahl.tagIndex; }
      detailsZeichnen();
      setTimeout(weiter, ruhig() ? 0 : 160);
      return;
    }
    if ((b = e.target.closest('.tag'))) { wahl.tagIndex = +b.dataset.tag; zeige(stand, 0); return; }
    if ((b = e.target.closest('.zeit'))) {
      wahl.zeit = b.dataset.zeit; wahl.tag = tage()[wahl.tagIndex].datum;
      $$('.zeit', buehne).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      detailsZeichnen(); setTimeout(weiter, ruhig() ? 0 : 220); return;
    }
    if ((b = e.target.closest('.chip'))) {
      var g = b.dataset.chip, w = b.textContent, i = wahl[g].indexOf(w);
      if (i > -1) wahl[g].splice(i, 1); else wahl[g].push(w);
      b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true'); detailsZeichnen(); return;
    }
    if (e.target.closest('[data-weiter]')) { weiter(); return; }
    if (e.target.closest('[data-senden]')) {
      var txt = $('#text'); if (txt) wahl.text = txt.value;
      if (pruefeKontakt()) weiter();
      return;
    }
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
    var e = new Date(d.getTime() + 50 * 6e4), f = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); };
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Demo//Praxis am Stadtgarten//DE', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@demo', 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(d), 'DTEND:' + f(e),
      'SUMMARY:' + wahl.art + ' (Demo)', 'LOCATION:Stadtgarten 22\\, 12345 Musterstadt', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'termin-praxis-am-stadtgarten.ics';
    document.body.appendChild(a); a.click(); a.remove(); meldung('Kalendereintrag erstellt (Demo)');
  }

  // Direkt öffnen über #termin, #warteliste oder #nachricht
  var start = location.hash.replace('#', '');
  if (ABLAEUFE[start]) oeffne(start);
  window.addEventListener('hashchange', function () { var s = location.hash.replace('#', ''); if (ABLAEUFE[s]) oeffne(s); });
})();
