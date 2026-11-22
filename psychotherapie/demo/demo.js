(function(){
  var h=document.documentElement, q=new URLSearchParams(location.search);
  try{ if(q.get('von')) sessionStorage.setItem('demo-von', q.get('von')==='entwurf'?'entwurf':'seite'); }catch(e){}
  var von='seite'; try{ von=sessionStorage.getItem('demo-von')||'seite'; }catch(e){}
  document.querySelectorAll('[data-zurueck]').forEach(function(a){ a.href = von==='entwurf' ? '/psychotherapie/entwurf/#demo' : '/psychotherapie/#demo'; });
  document.querySelectorAll('[data-cta]').forEach(function(a){ a.href = von==='entwurf' ? '/psychotherapie/entwurf/#entwurf' : '/psychotherapie/#anfrage'; });
  function lies(k){ try{ return localStorage.getItem(k)==='1'; }catch(e){ return false; } }
  function merke(k,v){ try{ localStorage.setItem(k, v?'1':'0'); }catch(e){} }
  document.querySelectorAll('.schalt').forEach(function(b){
    var k='demo-'+b.dataset.klasse, an=lies(k); h.classList.toggle(b.dataset.klasse, an); b.setAttribute('aria-checked', an?'true':'false');
    b.addEventListener('click', function(){ var n=b.getAttribute('aria-checked')!=='true'; b.setAttribute('aria-checked', n?'true':'false'); h.classList.toggle(b.dataset.klasse, n); merke(k,n); });
  });
  var bk=document.querySelector('.bf-knopf'), bf=document.getElementById('bf'), bg=document.querySelector('.burger'), me=document.getElementById('menue');
  function zu(){ bf.hidden=true; bk.setAttribute('aria-expanded','false'); me.classList.remove('offen'); bg.setAttribute('aria-expanded','false'); }
  bk.addEventListener('click', function(e){ e.stopPropagation(); var auf=bf.hidden; zu(); bf.hidden=!auf; bk.setAttribute('aria-expanded', auf?'true':'false'); });
  bg.addEventListener('click', function(e){ e.stopPropagation(); var auf=!me.classList.contains('offen'); zu(); me.classList.toggle('offen', auf); bg.setAttribute('aria-expanded', auf?'true':'false'); });
  document.addEventListener('click', function(e){ if(!bf.contains(e.target) && !me.contains(e.target)) zu(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') zu(); });
  h.classList.toggle('voll', lies('demo-voll'));
  document.querySelectorAll('[data-plaetze]').forEach(function(b){
    function text(){ b.textContent = h.classList.contains('voll') ? 'Ansicht: Plätze frei' : 'Ansicht: Keine Plätze frei'; }
    text(); b.addEventListener('click', function(){ var v=!h.classList.contains('voll'); h.classList.toggle('voll', v); merke('demo-voll', v); text(); });
  });
  var tag=new Date().getDay(); document.querySelectorAll('tr[data-tag="'+tag+'"]').forEach(function(r){ r.classList.add('heute'); });
  var f=document.querySelector('form[data-demo]');
  if(f) f.addEventListener('submit', function(e){ e.preventDefault(); if(!f.reportValidity()) return; f.hidden=true; var g=document.getElementById('gesendet'); g.hidden=false; g.focus(); });
})();
