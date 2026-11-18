/* leonossendorf.de, Neubau 2026, Fassung 2. Ohne fremde Bibliotheken. */
(function () {
  'use strict';
  var html = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var klemme = function (x) { return Math.max(0, Math.min(1, x)); };
  var weich = function (x) { return 1 - Math.pow(1 - x, 3); };
  var zwei = function (n) { return (n < 10 ? '0' : '') + n; };
  var LIVE = ['leonossendorf.de', 'www.leonossendorf.de', 'neu.leonossendorf.de'].indexOf(location.hostname) > -1;
  /* Der Mailversand läuft als eigener kleiner Dienst bei Cloudflare und schickt über Resend */
  var MAIL = 'https://leonossendorf-kontakt.leon-ossendorf.workers.dev/api/contact';
  var still = function () { return html.classList.contains('ruhig') || html.classList.contains('gross-schrift'); };

  /* ---------- Die Spur des Besuchs: nur im Tab gemerkt, geht erst mit einer Anfrage an Leon ---------- */
  var spur = null;
  try { spur = JSON.parse(sessionStorage.getItem('spur')); } catch (e) {}
  if (!spur) {
    var q = new URLSearchParams(location.search), k = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (n) { if (q.get(n)) k[n.replace('utm_', '')] = q.get(n).slice(0, 80); });
    var ref = document.referrer || '';
    if (ref.indexOf(location.origin) === 0) ref = '';
    spur = { start: Date.now(), ref: ref.slice(0, 200), lande: location.pathname, anzeige: q.has('gclid') || q.has('gbraid') || q.has('wbraid'), k: k, seiten: [], dinge: [] };
  }
  (function () {
    var q2 = new URLSearchParams(location.search), k2 = {}, da = q2.has('gclid') || q2.has('gbraid') || q2.has('wbraid');
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (n) { if (q2.get(n)) k2[n.replace('utm_', '')] = q2.get(n).slice(0, 80); });
    if (da || Object.keys(k2).length) { spur.anzeige = spur.anzeige || da; spur.k = k2; }
  })();
  var jetzt = { p: location.pathname, t: Date.now(), ab: [] };
  spur.seiten.push(jetzt);
  if (spur.seiten.length > 14) spur.seiten.splice(1, 1);
  function sichern() { jetzt.d = Date.now() - jetzt.t; try { sessionStorage.setItem('spur', JSON.stringify(spur)); } catch (e) {} }
  function merke(text) { if (spur.dinge.indexOf(text) < 0) { spur.dinge.push(text); if (spur.dinge.length > 25) spur.dinge.shift(); } sichern(); }
  sichern();
  window.addEventListener('pagehide', sichern);
  document.addEventListener('visibilitychange', sichern);
  function dauer(ms) { var s = Math.round(ms / 1000); return s < 60 ? s + ' Sek' : (s < 3600 ? Math.floor(s / 60) + ':' + zwei(s % 60) + ' Min' : Math.floor(s / 3600) + ':' + zwei(Math.floor(s % 3600 / 60)) + ' Std'); }
  function zusammenhang() {
    var z = ['--- Zusammenhang ---', 'Anfrage von: ' + location.pathname + ' („' + document.title + '“)'];
    var her = spur.anzeige ? 'Google-Anzeige' : (spur.k.source ? 'Kampagne' : (spur.ref ? 'Verweis von ' + spur.ref : 'direkt aufgerufen (Link aus Brief oder Mail, Lesezeichen oder eingetippt)'));
    var kk = Object.keys(spur.k).map(function (n) { return n + '=' + spur.k[n]; }).join(', ');
    if (kk) her += ' (' + kk + ')';
    if (spur.anzeige && spur.ref) her += ', Verweis ' + spur.ref;
    z.push('Gekommen über: ' + her);
    z.push('Erste Seite: ' + spur.lande + ' · Besuch seit ' + dauer(Date.now() - spur.start));
    z.push('Weg: ' + spur.seiten.map(function (s) {
      return s.p + ' [' + dauer(s === jetzt ? Date.now() - s.t : (s.d || 0)) + (s.ab && s.ab.length ? '; gesehen: ' + s.ab.join(', ') : '') + ']';
    }).join(' → '));
    if (spur.dinge.length) z.push('Gemacht: ' + spur.dinge.join('; '));
    if (window.ANGEBOT_STAND) z.push('Angebot: ' + window.ANGEBOT_STAND());
    z.push('Gerät: ' + (window.matchMedia('(max-width:860px)').matches ? 'Handy' : 'Computer') + ', ' + window.innerWidth + '×' + window.innerHeight);
    return z.join('\n');
  }

  /* ---------- Kopf: Menü und Barrierefreiheit als Klappfelder ---------- */
  var bf = {};
  try { bf = JSON.parse(localStorage.getItem('bf') || '{}'); } catch (e) {}
  var klassen = { gross: 'gross-schrift', kontrast: 'kontrast', ruhig: 'ruhig' };
  var namen = { gross: 'Große Schrift', kontrast: 'Starker Kontrast', ruhig: 'Bewegung aus' };
  function bfZeigen() { $$('.schalter[data-schalter]').forEach(function (s) { s.setAttribute('aria-checked', html.classList.contains(klassen[s.dataset.schalter]) ? 'true' : 'false'); }); }
  var klappen = $$('[data-klappe]');
  function zu(ausser) {
    klappen.forEach(function (kn) { if (kn !== ausser) { var f = document.getElementById(kn.getAttribute('aria-controls')); if (f) f.hidden = true; kn.setAttribute('aria-expanded', 'false'); } });
  }
  klappen.forEach(function (kn) {
    var feld = document.getElementById(kn.getAttribute('aria-controls'));
    kn.addEventListener('click', function () {
      var auf = feld.hidden; zu(kn); feld.hidden = !auf; kn.setAttribute('aria-expanded', auf ? 'true' : 'false');
      if (auf) { bfZeigen(); var erstes = $('a,button', feld); if (erstes) erstes.focus(); }
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') zu(); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.klappe') && !e.target.closest('[data-klappe]')) zu(); });
  $$('.schalter[data-schalter]').forEach(function (s) {
    s.addEventListener('click', function () {
      var key = s.dataset.schalter, an = !html.classList.contains(klassen[key]);
      html.classList.toggle(klassen[key], an); bf[key] = an;
      try { localStorage.setItem('bf', JSON.stringify(bf)); } catch (e) {}
      bfZeigen(); merke('Schalter „' + namen[key] + '“ ' + (an ? 'an' : 'aus')); messen();
    });
  });

  var mb = $('[data-menue]'), vor = $('#menue');
  if (mb && vor) {
    var menue = function (auf) {
      html.classList.toggle('menue-offen', auf);
      mb.setAttribute('aria-expanded', auf ? 'true' : 'false'); mb.setAttribute('aria-label', auf ? 'Menü schließen' : 'Menü');
      if (auf) { vor.removeAttribute('inert'); zu(); } else vor.setAttribute('inert', '');
    };
    mb.addEventListener('click', function () { menue(!html.classList.contains('menue-offen')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menue(false); });
    $$('a', vor).forEach(function (a) { a.addEventListener('click', function () { menue(false); }); });
    document.addEventListener('click', function (e) { if (html.classList.contains('menue-offen') && !vor.contains(e.target) && !mb.contains(e.target)) menue(false); });
    var kon = $('[data-kontakt]', vor);
    if (kon) kon.addEventListener('click', function (e) { var d = $('dialog.schnell'); if (!$('#anfrage') && d) { e.preventDefault(); d.showModal(); } });
  }
  /* Ochtrup wird nur genannt, wenn der Besucher aus der Region kommt (Werbeseite oder Link mit ?nah) */
  try {
    if (html.hasAttribute('data-region') || /[?&]nah\b/.test(location.search)) sessionStorage.setItem('region', '1');
    if (sessionStorage.getItem('region')) html.classList.add('region');
  } catch (e) {}

  /* ---------- Sanftes Einblenden, und merken, welche Abschnitte gesehen wurden ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.ein').forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target.getAttribute('data-ab');
        if (jetzt.ab.indexOf(n) < 0) { jetzt.ab.push(n); sichern(); }
        io2.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -30% 0px' });
    $$('[data-ab]').forEach(function (el) { io2.observe(el); });
  } else { $$('.ein').forEach(function (el) { el.classList.add('da'); }); }
  $$('a[href^="tel:"]').forEach(function (a) { a.addEventListener('click', function () { merke('Telefonnummer angetippt'); }); });
  $$('a[href*="wa.me"]').forEach(function (a) { a.addEventListener('click', function () { merke('WhatsApp-Link angetippt'); }); });

  /* ---------- Scroll-Szenen ---------- */
  var szenen = $$('.szene'), rollt = $$('.held, .angebot-bild'), leiste = $('.leiste'), formAb = $('#anfrage');
  var wartet = false, schnellKnopf = $('[data-schnell]'), schnell = $('dialog.schnell');
  function messen() {
    wartet = false;
    var vh = window.innerHeight, ruhig = still();
    szenen.forEach(function (s) {
      var r = s.getBoundingClientRect(), lauf = r.height - vh;
      var p = ruhig ? 1 : (lauf > 0 ? klemme(-r.top / lauf) : 0);
      s.style.setProperty('--p', p.toFixed(4));
      $$('.woerter', s).forEach(function (w) {
        var von = parseFloat(w.dataset.von || 0), bis = parseFloat(w.dataset.bis || 1), sp = $$('span', w);
        sp.forEach(function (x, i) { x.classList.toggle('an', ruhig || p >= von + (bis - von) * (i / sp.length)); });
      });
      $$('.teil', s).forEach(function (t) {
        var qq = ruhig ? 1 : weich(klemme((p - parseFloat(t.dataset.start || 0)) / parseFloat(t.dataset.dauer || .1)));
        t.style.setProperty('--q', qq.toFixed(4));
      });
    });
    $$('[data-lauf]').forEach(function (l) {
      var r = l.getBoundingClientRect();
      l.style.setProperty('--p', ruhig ? 1 : klemme((vh * .62 - r.top) / r.height).toFixed(4));
      $$('.halt', l).forEach(function (h) { var q = h.getBoundingClientRect(); h.classList.toggle('an', ruhig || q.top + q.height * .35 < vh * .68); });
    });
    $$('.kap').forEach(function (k) {
      var r = k.getBoundingClientRect(), p = ruhig ? 1 : klemme((vh - r.top) / (vh + r.height));
      $$('.woerter', k).forEach(function (w) {
        var von = parseFloat(w.dataset.von || 0), bis = parseFloat(w.dataset.bis || 1), sp = $$('span', w);
        sp.forEach(function (x, i) { x.classList.toggle('an', ruhig || p >= von + (bis - von) * (i / sp.length)); });
      });
    });
    if (schnellKnopf) schnellKnopf.classList.toggle('da', window.scrollY > vh * .5 && !(formAb && formAb.getBoundingClientRect().top < vh * .9));
    var roll = klemme(window.scrollY / vh).toFixed(3);
    rollt.forEach(function (el) { el.style.setProperty('--roll', roll); });
    if (leiste) {
      var imForm = formAb && formAb.getBoundingClientRect().top < vh * .75;
      leiste.classList.toggle('da', window.scrollY > vh * .8 && !imForm && !html.classList.contains('abgelaufen'));
    }
  }
  function anstossen() { if (!wartet) { wartet = true; requestAnimationFrame(messen); } }
  window.addEventListener('scroll', anstossen, { passive: true });
  window.addEventListener('resize', anstossen);
  messen();

  /* ---------- Referenzen: eine Vorschau, die von selbst scrollt; Klick öffnet die echte Seite im Fenster ---------- */
  var dlg = $('dialog.live');
  $$('[data-schau]').forEach(function (s) {
    var daten = JSON.parse(s.getAttribute('data-schau')), tabs = $$('.schau-wahl .pille', s), pc = $('.pc', s), schirm = $('.schirm', s);
    var img = $('img', schirm), adr = $('.adr', s), tit = $('.schau-fuss h3', s), txt = $('.schau-fuss p', s), akt = 0;
    function zeige(i, vomNutzer) {
      akt = i; var d = daten[i];
      tabs.forEach(function (t2, n) { t2.setAttribute('aria-pressed', n === i ? 'true' : 'false'); });
      img.src = '/assets/img/schau-' + d.k + '-pc.webp'; img.alt = 'Website ' + d.name;
      adr.textContent = d.adr; tit.textContent = d.name + ', ' + d.ort; txt.textContent = d.text;
      schirm.scrollTop = 0; schirm._y = 0; schirm._d = 1;
      if (vomNutzer) merke('Referenz angesehen: ' + d.name);
    }
    tabs.forEach(function (t2, n) { t2.addEventListener('click', function () { zeige(n, true); }); });
    var pause = 0, sichtbar = false, zuletzt = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; }, { threshold: .2 }).observe(s);
    schirm._y = 0; schirm._d = 1;
    ['wheel', 'touchstart'].forEach(function (ev) { schirm.addEventListener(ev, function () { pause = Date.now() + 9000; merke('In Referenz gescrollt: ' + daten[akt].name); }, { passive: true }); });
    (function lauf(zeit) {
      var dt = Math.min(60, (zeit || 0) - zuletzt); zuletzt = zeit || 0;
      if (sichtbar && Date.now() > pause && !still()) {
        var max = schirm.scrollHeight - schirm.clientHeight;
        if (max > 20) {
          if (Math.abs(schirm._y - schirm.scrollTop) > 3) schirm._y = schirm.scrollTop;
          schirm._y += schirm._d * dt * max / 36000;
          if (schirm._y >= max) { schirm._y = max; schirm._d = -1; } else if (schirm._y <= 0) { schirm._y = 0; schirm._d = 1; }
          schirm.scrollTop = schirm._y;
        }
      }
      requestAnimationFrame(lauf);
    })(0);
    /* Der Zeiger folgt der Maus, die Vorschau neigt sich leicht mit */
    pc.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !still()) pc.classList.add('drauf'); });
    pc.addEventListener('pointerleave', function () { pc.classList.remove('drauf'); pc.style.setProperty('--tx', 0); pc.style.setProperty('--ty', 0); });
    pc.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = pc.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      pc.style.setProperty('--zx', mx + 'px'); pc.style.setProperty('--zy', my + 'px');
      if (!still()) { pc.style.setProperty('--tx', ((mx / r.width - .5) * 2).toFixed(3)); pc.style.setProperty('--ty', ((my / r.height - .5) * 2).toFixed(3)); }
    });
    function auf() {
      if (!dlg) return;
      var d = daten[akt], rahmen = document.createElement('iframe');
      rahmen.title = 'Website ' + d.name; rahmen.src = d.url;
      $('iframe', dlg).replaceWith(rahmen);
      $('.live-kopf span', dlg).textContent = d.name + ' · ' + d.adr;
      dlg.showModal(); history.pushState({ live: 1 }, '');
      merke('Referenz live geöffnet: ' + d.name);
    }
    pc.addEventListener('click', auf);
    pc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); auf(); } });
    var live = $('[data-live]', s); if (live) live.addEventListener('click', auf);
  });
  if (dlg) {
    /* „Zurück“ im Browser schließt das Fenster und führt direkt auf diese Seite zurück */
    var liveZu = function () { if (history.state && history.state.live) history.back(); else dlg.close(); };
    $('.live-kopf button', dlg).addEventListener('click', liveZu);
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); liveZu(); });
    window.addEventListener('popstate', function () { if (dlg.open) dlg.close(); });
    dlg.addEventListener('close', function () { $('iframe', dlg).replaceWith(document.createElement('iframe')); });
  }

  /* ---------- Bausteine zum Anfassen: Auswahl-Knöpfe zeigen Passendes und tragen ihren Text ein ---------- */
  $$('[data-gruppe]').forEach(function (g) {
    var meins = function (el) { return el.closest('[data-gruppe]') === g; };
    function stand() {
      $$('[data-wenn]', g).filter(meins).forEach(function (el) { var w = el.getAttribute('data-wenn').split(':'); el.hidden = g.getAttribute('data-r-' + w[0]) !== w[1]; });
      $$('[data-text]', g).filter(meins).forEach(function (el) { var v = g.getAttribute('data-t-' + el.getAttribute('data-text')); if (v) el.textContent = v; });
    }
    $$('[data-wahl]', g).filter(meins).forEach(function (b2) {
      var r = b2.getAttribute('data-reihe');
      var setze = function () { g.setAttribute('data-r-' + r, b2.getAttribute('data-wahl')); g.setAttribute('data-t-' + r, b2.textContent.trim()); };
      if (b2.getAttribute('aria-pressed') === 'true') setze();
      b2.addEventListener('click', function () {
        $$('[data-reihe="' + r + '"]', g).filter(meins).forEach(function (o) { o.setAttribute('aria-pressed', o === b2 ? 'true' : 'false'); });
        setze(); stand(); if (!window.__auto) merke('Baustein angetippt: ' + b2.textContent.trim());
      });
    });
    stand();
  });
  $$('[data-umschalt]').forEach(function (b2) {
    b2.addEventListener('click', function () {
      var d = b2.closest('.bau-demo'), kl = b2.getAttribute('data-umschalt'), an = !d.classList.contains(kl);
      d.classList.toggle(kl, an); b2.setAttribute('aria-checked', an ? 'true' : 'false');
    });
  });
  /* Sprechzeiten: heutiger Tag markiert, Status „jetzt geöffnet“ */
  $$('[data-zeiten]').forEach(function (z) {
    var plan = JSON.parse(z.getAttribute('data-zeiten')), d = new Date(), tag = d.getDay(), std = d.getHours() + d.getMinutes() / 60;
    var st = $('[data-status]', z), zeile = $('tr[data-tag="' + tag + '"]', z), namen2 = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    if (zeile) zeile.classList.add('heute');
    var uhr2 = function (h) { return (h | 0) + ' Uhr'; }, heute = plan[tag] || [], text = '', auf2 = false;
    heute.forEach(function (bl) { if (std >= bl[0] && std < bl[1]) { auf2 = true; text = 'Jetzt geöffnet bis ' + uhr2(bl[1]); } });
    if (!auf2) {
      var sp = heute.filter(function (bl) { return bl[0] > std; })[0];
      if (sp) text = 'Gerade geschlossen. Heute wieder ab ' + uhr2(sp[0]);
      else for (var i = 1; i <= 7; i++) { var t3 = (tag + i) % 7; if (plan[t3]) { text = 'Gerade geschlossen. Wieder ' + (i === 1 ? 'morgen' : 'am ' + namen2[t3]) + ' ab ' + uhr2(plan[t3][0][0]); break; } }
    }
    st.textContent = text; st.parentNode.classList.toggle('auf', auf2);
  });
  /* Kundenarten: Ein Bild der jeweiligen Seite folgt dem Mauszeiger, weich nachlaufend und leicht geneigt */
  var blick = $('.weg-blick');
  if (blick) {
    var bx = 0, by = 0, zx = 0, zy = 0, blickAn = false, groesse = .6, bImg = $('img', blick);
    $$('.wege a').forEach(function (a) {
      new Image().src = '/assets/img/blick-' + a.getAttribute('data-stil') + '.webp';
      a.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse' || still()) return;
        bImg.src = '/assets/img/blick-' + a.getAttribute('data-stil') + '.webp';
        zx = e.clientX; zy = e.clientY;
        if (!blickAn) { bx = zx; by = zy; }
        blickAn = true; blick.classList.add('da');
      });
      a.addEventListener('pointerleave', function () { blickAn = false; blick.classList.remove('da'); });
      a.addEventListener('pointermove', function (e) { zx = e.clientX; zy = e.clientY; });
    });
    (function nach() {
      var dx = zx - bx, dy = zy - by;
      bx += dx * .13; by += dy * .13; groesse += ((blickAn ? 1 : .6) - groesse) * .16;
      var x = Math.min(bx + 36, window.innerWidth - blick.offsetWidth - 16), y = Math.max(12, Math.min(by - blick.offsetHeight * .62, window.innerHeight - blick.offsetHeight - 16));
      blick.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + Math.max(-9, Math.min(9, dx * .07)).toFixed(2) + 'deg) scale(' + groesse.toFixed(3) + ')';
      requestAnimationFrame(nach);
    })();
  }
  /* Bausteine: laufen von selbst durch, bis jemand hineingreift; das Gerät neigt sich leicht zur Maus */
  $$('.bau').forEach(function (b) {
    var tabs = $$('.bau-wahl .pille', b), aus = false, buehne = $('.bau-buehne', b);
    function halt() { clearTimeout(b._zeit); tabs.forEach(function (t2) { t2.classList.remove('laeuft'); }); }
    function los() {
      halt();
      if (aus || still() || tabs.length < 2) return;
      var akt = tabs.filter(function (t2) { return t2.getAttribute('aria-pressed') === 'true'; })[0] || tabs[0];
      void akt.offsetWidth; akt.classList.add('laeuft');
      b._zeit = setTimeout(function () { window.__auto = true; tabs[(tabs.indexOf(akt) + 1) % tabs.length].click(); window.__auto = false; los(); }, 6000);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) los(); else halt(); }, { threshold: .35 }).observe(b);
    ['pointerdown', 'keydown'].forEach(function (ev) { b.addEventListener(ev, function () { if (!window.__auto) { aus = true; halt(); } }, true); });
    if (buehne) {
      buehne.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || still()) return;
        var d = $('.bau-feld:not([hidden]) .bau-demo', b), r = buehne.getBoundingClientRect();
        if (d) { d.style.setProperty('--tx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3)); d.style.setProperty('--ty', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3)); }
      });
      buehne.addEventListener('pointerleave', function () { $$('.bau-demo', b).forEach(function (d) { d.style.setProperty('--tx', 0); d.style.setProperty('--ty', 0); }); });
    }
  });
  /* Die Anfrage ist von überall erreichbar */
  if (schnellKnopf && schnell) {
    schnellKnopf.addEventListener('click', function () { schnell.showModal(); merke('Schnellanfrage geöffnet'); });
    $('.zu', schnell).addEventListener('click', function () { schnell.close(); });
    schnell.addEventListener('click', function (e) { if (e.target === schnell) schnell.close(); });
  }

  /* ---------- Frist des Angebots: läuft für jeden Besucher ab dem ersten Besuch und startet nicht neu ---------- */
  var ang = html.getAttribute('data-angebot');
  if (ang) {
    var spanne = parseFloat(html.getAttribute('data-stunden')) * 3600000, key = 'angebot-' + ang, st = 0;
    try { st = parseInt(localStorage.getItem(key), 10) || 0; } catch (e) {}
    if (!st) { st = Date.now(); try { localStorage.setItem(key, String(st)); } catch (e) {} }
    var ende = st + spanne, e0 = new Date(ende), heute = new Date(), tag;
    var tage = Math.round((new Date(e0.getFullYear(), e0.getMonth(), e0.getDate()) - new Date(heute.getFullYear(), heute.getMonth(), heute.getDate())) / 86400000);
    tag = tage === 0 ? 'heute' : (tage === 1 ? 'morgen' : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][e0.getDay()] + ', ' + e0.getDate() + '.' + (e0.getMonth() + 1) + '.');
    var fristText = tag + ', ' + zwei(e0.getHours()) + ':' + zwei(e0.getMinutes()) + ' Uhr';
    $$('[data-frist]').forEach(function (el) { el.textContent = fristText; });
    var letzteS = -1;
    window.ANGEBOT_STAND = function () {
      var rest = ende - Date.now();
      return rest > 0 ? '999 € statt 1.500 €, persönliche Frist bis ' + fristText + ' (noch ' + dauer(rest) + ')' : 'Frist abgelaufen am ' + e0.toLocaleString('de-DE') + ', Seite zeigte 1.500 €';
    };
    var ticken = function () {
      var rest = ende - Date.now();
      if (rest <= 0) { html.classList.add('abgelaufen'); if (leiste) leiste.classList.remove('da'); return false; }
      var s = Math.floor(rest / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sek = s % 60;
      $$('[data-zeit="h"]').forEach(function (el) { el.textContent = zwei(h); });
      $$('[data-zeit="m"]').forEach(function (el) { el.textContent = zwei(m); });
      $$('[data-zeit="s"]').forEach(function (el) {
        el.textContent = zwei(sek);
        if (sek !== letzteS) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
      });
      letzteS = sek;
      $$('[data-zeit="kurz"]').forEach(function (el) { el.textContent = zwei(h) + ':' + zwei(m) + ':' + zwei(sek); });
      $$('.frist-balken i').forEach(function (el) { el.style.setProperty('--rest', (klemme(rest / spanne) * 34).toFixed(2) + '%'); });
      return true;
    };
    if (ticken()) { var uhr = setInterval(function () { if (!ticken()) clearInterval(uhr); }, 1000); }
  }

  /* ---------- Anfrage-Formulare: schicken den ganzen Zusammenhang mit ---------- */
  var gueltig = function (v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || (/^\+?[\d\s().\/-]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15);
  };
  $$('form[data-anfrage]').forEach(function (form) {
    var status = $('.form-status', form), schritte = $$('.schritt', form), laeuft = false;
    var kennung = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
    if (!LIVE) { var hin = $('.vorschau-hinweis', form); if (hin) hin.hidden = false; }
    function fehler(feld, text) {
      var f = form.elements[feld], ziel = document.getElementById(form.id + '-' + feld + '-fehler');
      if (ziel) ziel.textContent = text;
      if (f && f.setAttribute) f.setAttribute('aria-invalid', text ? 'true' : 'false');
    }
    function pruefen() {
      fehler('name', ''); fehler('email', ''); fehler('telefon', '');
      if (!form.elements.name.value.trim()) fehler('name', form.getAttribute('data-f-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.elements.email.value.trim())) fehler('email', form.getAttribute('data-f-email'));
      var tel = form.elements.telefon.value.trim(), zif = tel.replace(/\D/g, '').length;
      if (!/^\+?[\d\s().\/-]+$/.test(tel) || zif < 7 || zif > 15) fehler('telefon', form.getAttribute('data-f-telefon'));
      var falsch = $('[aria-invalid="true"]', form);
      if (falsch) { falsch.focus(); return false; }
      return true;
    }
    var weiter = $('[data-weiter]', form);
    if (weiter) weiter.addEventListener('click', function () {
      if (!pruefen()) return;
      schritte[0].hidden = true; schritte[1].hidden = false; merke('Formular: Schritt 2 erreicht');
      var erstes = $('input,textarea', schritte[1]); if (erstes) erstes.focus();
    });
    var zurueck = $('[data-zurueck]', form);
    if (zurueck) zurueck.addEventListener('click', function () { schritte[1].hidden = true; schritte[0].hidden = false; form.elements.name.focus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (laeuft) return;
      if (!pruefen()) { if (schritte.length > 1) { schritte[1].hidden = true; schritte[0].hidden = false; } return; }
      var el = form.elements, zeilen = [];
      var dazu = function (titel, name) { var f = el[name]; var v = f && f.value ? String(f.value).trim() : ''; if (v) zeilen.push(titel + ': ' + v); };
      dazu('Telefon', 'telefon'); dazu('Möchte', 'anliegen'); dazu('Nachricht', 'nachricht'); dazu('Betrieb', 'betrieb'); dazu('Ort', 'ort'); dazu('Jetzige Website', 'website'); dazu('Gewünschter Kontaktweg', 'weg'); dazu('Kundenart der Seite', 'wer');
      zeilen.push('', zusammenhang());
      var text = zeilen.join('\n').slice(0, 3900), danke = form.getAttribute('data-danke') || '/danke/';
      try { sessionStorage.setItem('letzte-anfrage', text); } catch (e2) {}
      if (!LIVE) { location.href = danke; return; }
      laeuft = true; status.textContent = form.getAttribute('data-f-senden');
      fetch(MAIL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: el.name.value.trim(), reply: el.email.value.trim(), message: text, company: el.company.value, requestId: kennung, anrede: form.getAttribute('data-anrede') })
      }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
        .then(function (x) {
          if (!x.ok || x.b.state !== 'accepted') throw new Error('nicht bestätigt');
          /* Gezählt wird die Anfrage über den Aufruf der Danke-Seite (siehe Messung unten). */
          location.href = danke;
        }).catch(function () { laeuft = false; status.textContent = form.getAttribute('data-f-fehler'); });
    });
  });
  /* In der Vorschau zeigt die Danke-Seite, was Leon bekommen hätte */
  $$('[data-nur-vorschau]').forEach(function (el) {
    el.hidden = LIVE;
    var pre = $('pre', el), t = '';
    try { t = sessionStorage.getItem('letzte-anfrage') || ''; } catch (e) {}
    if (pre && t) pre.textContent = t;
  });
  /* Messung der Anzeigen (Google Ads) im Einwilligungsmodus. Das Google-Tag steht im Kopf jeder Seite und lädt sofort,
     setzt und liest aber erst nach Zustimmung Cookies. Die Auswahl steht im Speicher des Browsers, gilt 180 Tage
     und lässt sich über „Cookie-Auswahl“ im Fuß ändern. Gezählt wird bei Google der Aufruf der Danke-Seite. */
  var mFrage = null;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  function mStand() {
    try { var m = JSON.parse(localStorage.getItem('messung') || 'null'); if (m && Date.now() - m.t < 180 * 864e5) return m.w; } catch (e) {}
    return '';
  }
  function mLaden() { window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted' }); }
  function mAus() {
    window.gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied' });
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^_gcl_|^_gac_/.test(n)) ['', '; domain=.leonossendorf.de', '; domain=leonossendorf.de'].forEach(function (d) { document.cookie = n + '=; Max-Age=0; path=/' + d; });
    });
  }
  function mSetzen(w) {
    try { localStorage.setItem('messung', JSON.stringify({ w: w, t: Date.now() })); } catch (e) {}
    if (w === 'ja') mLaden(); else mAus();
    if (mFrage) { mFrage.remove(); mFrage = null; }
  }
  function mFragen(zeigeStand) {
    if (mFrage) { $('button', mFrage).focus(); return; }
    var du = !!$('[data-anrede="du"]'), stand = zeigeStand ? mStand() : '';
    mFrage = document.createElement('section');
    mFrage.className = 'mess'; mFrage.setAttribute('aria-labelledby', 'mess-titel');
    mFrage.innerHTML = '<p class="mess-titel" id="mess-titel">Darf Google Cookies setzen?</p>'
      + '<p>Ich schalte Anzeigen bei Google. Mit ' + (du ? 'deiner' : 'Ihrer') + ' Zustimmung misst Google mit Cookies genau, ob eine Anzeige zu einer Anfrage geführt hat. Ohne Zustimmung zählt Google nur grob und ohne Cookies mit. <a href="/datenschutz/#messung">Mehr dazu</a></p>'
      + (stand ? '<p class="mess-stand">Bisher: ' + (stand === 'ja' ? 'zugestimmt' : 'abgelehnt') + '.</p>' : '')
      + '<div class="mess-wahl"><button type="button" data-m="nein">Ablehnen</button><button type="button" data-m="ja">Zustimmen</button></div>';
    document.body.insertBefore(mFrage, document.body.firstChild);
    $$('button', mFrage).forEach(function (b) { b.addEventListener('click', function () { mSetzen(b.getAttribute('data-m')); }); });
    if (zeigeStand) $('button', mFrage).focus();
  }
  if (!mStand() && location.pathname.indexOf('/angebot') === 0) mFragen(false);
  $$('[data-messung]').forEach(function (b) { b.addEventListener('click', function () { mFragen(true); }); });
  /* Auf den Angebotsseiten: Klicks auf WhatsApp und Telefon als eigene Ereignisse merken */
  if (location.pathname.indexOf('/angebot') === 0) document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null, h = a ? a.getAttribute('href') : '';
    if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(h)) window.gtag('event', 'whatsapp_klick', { seite: location.pathname });
    else if (/^tel:/.test(h)) window.gtag('event', 'telefon_klick', { seite: location.pathname });
  });
})();
