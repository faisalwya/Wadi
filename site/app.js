/* Shared behaviour for every language page. */
(function(){
  var keys=['services','work','about','contact'];
  var label=document.getElementById('label'), ind=document.getElementById('ind'), next=document.getElementById('next');
  var calm=window.matchMedia('(prefers-reduced-motion: reduce)');
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  var rtl=document.documentElement.dir==='rtl', started=false;

  function clearSel(view){
    view.classList.remove('has-sel');
    view.querySelectorAll('.it.on').forEach(function(it){it.classList.remove('on');it.querySelector('.t').setAttribute('aria-expanded','false');});
  }
  function show(key){
    if(keys.indexOf(key)<0) key='work';
    keys.forEach(function(k){
      var v=document.getElementById('v-'+k);
      if(k===key){
        clearSel(v);
        v.hidden=false;
        v.querySelectorAll('.it').forEach(function(it){it.style.animation='none';void it.offsetWidth;it.style.animation='';});
        label.textContent=v.dataset.label;
      } else v.hidden=true;
    });
    tabs.forEach(function(t){t.setAttribute('aria-pressed', t.dataset.tab===key?'true':'false');});
    ind.style.transform='translateX('+(keys.indexOf(key)*100*(rtl?-1:1))+'%)';
    next.hidden=(key==='contact');
    if(started) document.dispatchEvent(new CustomEvent('wadi:tab',{detail:key}));  // lets widgets react to tab changes
    started=true;
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){
    var k=t.dataset.tab;
    if(location.hash!=='#'+k){try{history.replaceState(null,'','#'+k);}catch(e){} }
    show(k); window.scrollTo({top:0,behavior:'smooth'});
  });});

  document.querySelectorAll('.view').forEach(function(view){
    view.querySelectorAll('.it .t').forEach(function(btn){
      btn.addEventListener('click',function(){
        var it=btn.closest('.it'), was=it.classList.contains('on');
        clearSel(view);
        if(!was){it.classList.add('on');btn.setAttribute('aria-expanded','true');view.classList.add('has-sel');loadEmbed(it);
          setTimeout(function(){it.scrollIntoView({block:'nearest',behavior:calm.matches?'auto':'smooth'});},calm.matches?0:420);}
      });
    });
  });

  function loadEmbed(it){
    var v=it.querySelector('.vis[data-embed]');
    if(!v||v.querySelector('iframe')) return;
    var f=document.createElement('iframe');
    f.src=v.dataset.embed; f.title=''; f.setAttribute('aria-hidden','true'); f.tabIndex=-1;
    f.setAttribute('loading','lazy'); f.setAttribute('sandbox','allow-scripts allow-same-origin');
    f.addEventListener('load',function(){f.classList.add('ready');});
    v.appendChild(f);
  }

  // ---- Cover (first visit of a session): a full screen with the big name, the living landscape and the birds.
  // Entering (the button, a swipe up, a scroll or a key) carries the name and landscape up into the top bar in
  // one pre-built move while the cover fades and the content and menu slide in. Nothing here follows the scroll,
  // so it plays the same on every phone. Skipped with reduce motion and on links that open a specific tab.
  // ?cover=on|off in the URL forces it (ignoring the once-per-session rule) for testing.
  var cover=document.getElementById('cover'), root=document.documentElement;
  var coverQ=new URLSearchParams(location.search).get('cover');
  var seen=false; try{seen=sessionStorage.getItem('wadi-cover')==='1';}catch(e){}
  var coverOn=!!(cover&&!calm.matches&&coverQ!=='off'&&(coverQ||(!seen&&!location.hash)));
  if(coverOn) openCover();

  function openCover(){
    var wrap=document.querySelector('.wrap'), nav=document.querySelector('nav');
    var cName=cover.querySelector('.cover-name'), cLand=cover.querySelector('.cover-land'), enterBtn=cover.querySelector('.enter');
    var ZOOM=1.6, entering=false;
    root.classList.add('cover-on'); cover.hidden=false;
    wrap.inert=true; nav.inert=true;
    if(!coverQ){ try{sessionStorage.setItem('wadi-cover','1');}catch(e){} }   // once per session
    // the cover's landscape: shown zoomed in, alive, with the birds just above the name
    customElements.whenDefined('wadi-pattern').then(function(){
      cLand.setZoom(ZOOM); cLand.setHero(0);
      cLand.style.setProperty('--sky-bottom',((2+20+cName.offsetHeight+14)/ZOOM+24).toFixed(1)+'px');
    });
    setTimeout(function(){ try{enterBtn.focus({preventScroll:true});}catch(e){} },50);

    enterBtn.addEventListener('click',enter);
    cover.addEventListener('wheel',function(e){ if(e.deltaY>8) enter(); },{passive:true});
    var y0=null;
    cover.addEventListener('touchstart',function(e){ y0=e.touches[0].clientY; },{passive:true});
    cover.addEventListener('touchmove',function(e){ if(y0!==null&&y0-e.touches[0].clientY>28){ y0=null; enter(); } },{passive:true});
    document.addEventListener('keydown',function onKey(e){
      if(['ArrowDown','PageDown',' ','Enter'].indexOf(e.key)>-1){ document.removeEventListener('keydown',onKey); if(e.target!==enterBtn) e.preventDefault(); enter(); }
    });

    function enter(){
      if(entering) return; entering=true;
      var hName=document.querySelector('.top h1'), hLand=document.querySelector('.top wadi-pattern');
      // where each piece is now, and where it lands in the top bar
      var a=cName.getBoundingClientRect(), b=hName.getBoundingClientRect();
      var la=cLand.getBoundingClientRect(), lb=hLand.getBoundingClientRect();   // zoomed about its bottom centre, so that point is true
      var s=b.width/a.width;
      var dx=(b.left+b.width/2)-(a.left+a.width*s/2), dy=(b.top+b.height/2)-(a.top+a.height*s/2);   // centre onto centre
      var ldx=(lb.left+lb.width/2)-(la.left+la.width/2), ldy=lb.bottom-la.bottom;                     // bottom centre onto bottom centre
      var ease='cubic-bezier(.65,0,.3,1)', D=640;
      // the birds and the swell settle as the move begins
      var t0=performance.now();
      (function calmDown(now){ var k=Math.min(1,(now-t0)/220); cLand.setHero(k*.34); if(k<1) requestAnimationFrame(calmDown); })(t0);
      enterBtn.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'});
      cName.animate([{transform:'none'},{transform:'translate('+dx+'px,'+dy+'px) scale('+s+')'}],{duration:D,easing:ease,fill:'forwards'});
      cLand.animate([{transform:'scale('+ZOOM+')'},{transform:'translate('+ldx+'px,'+ldy+'px) scale(1)'}],{duration:D,easing:ease,fill:'forwards'});
      cover.querySelector('.cover-bg').animate([{opacity:1},{opacity:0}],{duration:D*.7,delay:D*.3,easing:'ease',fill:'forwards'});
      // the content and the menu slide in under it
      [].slice.call(wrap.children).forEach(function(el,i){
        if(el.classList.contains('top')) return;
        el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:520,delay:D*.45+i*30,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      });
      nav.animate([{transform:'translateY(120%)'},{transform:'none'}],{duration:560,delay:D*.5,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      // hand over: the real name and landscape fade in as the travelling copies fade out (hides any sub-pixel difference)
      setTimeout(function(){
        root.classList.remove('cover-on');
        [hName,hLand].forEach(function(el){ el.animate([{opacity:0},{opacity:1}],{duration:140,easing:'ease'}); });
        [cName,cLand].forEach(function(el){ el.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease',fill:'forwards'}); });
      },D-60);
      setTimeout(function(){
        cover.hidden=true; wrap.inert=false; nav.inert=false;
        cover.remove();
      },D+100);
    }
  }

  window.addEventListener('hashchange',function(){show(location.hash.slice(1));window.scrollTo({top:0,behavior:calm.matches?'auto':'smooth'});});
  show(location.hash.slice(1)||'work');

  function tick(){
    var d=new Date(Date.now()+3*3600*1000);
    var p=function(n){return (n<10?'0':'')+n;};
    document.getElementById('clock').textContent=p(d.getUTCHours())+':'+p(d.getUTCMinutes());
  }
  tick(); setInterval(tick,30000);
})();
