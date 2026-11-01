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
    show(k); markSeen(); window.scrollTo({top:contentTop(),behavior:'smooth'});
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

  var head=document.querySelector('header'), ticking=false;
  var native=window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()');
  function onScroll(){
    ticking=false;
    var t=Math.min(Math.max(window.scrollY/56,0),1);
    var p=t*t*(3-2*t); // ease in and out
    head.style.setProperty('--p',p.toFixed(3));
  }
  if(!native){
    window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
    onScroll();
  }

  window.addEventListener('hashchange',function(){show(location.hash.slice(1));window.scrollTo({top:contentTop(),behavior:calm.matches?'auto':'smooth'});});
  show(location.hash.slice(1)||'work');

  // ---- Opening hero (first visit of a session): the name and the landscape start zoomed in on the first
  // screen and shrink into the compact header as you scroll, following the scroll both ways.
  // Where the browser supports scroll-driven CSS animations the shrink runs there, in step with the scroll
  // itself (smoothest); otherwise this script moves them. Nothing is measured or redrawn during the scroll.
  // ?hero=on|off in the URL forces it (ignoring the once-per-session rule) for testing.
  // Skipped with reduce motion and on links that open a specific tab; tapping a tab skips past it.
  var hero=document.getElementById('hero'), heroIn=hero&&hero.firstElementChild;
  var pat=document.querySelector('wadi-pattern'), h1=document.querySelector('h1');
  var heroQ=new URLSearchParams(location.search).get('hero');
  var seen=false; try{seen=sessionStorage.getItem('wadi-hero')==='1';}catch(e){}
  var heroOn=!!(hero&&pat&&window.customElements&&!calm.matches&&heroQ!=='off'&&(heroQ||(!seen&&!location.hash)));
  var heroCss=!!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline: scroll()'));
  var ZOOM=1.6, GAP=20;                                   // how much bigger it starts; space between name and landscape
  var heroD=0, heroH0=0, heroTicking=false, nameY0=0, landY0=0, lastP=-1;
  function markSeen(){ try{sessionStorage.setItem('wadi-hero','1');}catch(e){} }
  function contentTop(){ return heroOn?heroD:0; }
  // measure once (and on resize), never during the scroll itself
  function heroLayout(){
    var root=document.documentElement;
    root.classList.remove('hero-css');
    h1.style.scale=''; h1.style.translate=''; pat.style.scale=''; pat.style.translate='';
    heroH0=Math.max(520,Math.round(window.innerHeight*.84));
    hero.style.height=heroH0+'px';
    heroD=Math.max(1,heroH0-heroIn.offsetHeight);
    document.body.style.minHeight=(heroD+window.innerHeight)+'px';   // short tabs can still scroll far enough to collapse it
    var nameH=h1.offsetHeight, nameTop=h1.offsetTop, landH=24, landBottom=pat.offsetTop+pat.offsetHeight-2;
    var groupH=(nameH+landH)*ZOOM+GAP, top=heroH0*.44-groupH/2;     // the big group, centred a little high
    nameY0=top-(nameTop+nameH/2-nameH*ZOOM/2);                      // the name zooms about its centre
    landY0=top+nameH*ZOOM+GAP+landH*ZOOM-landBottom;                // the landscape zooms up from its bottom edge
    root.style.setProperty('--hero-s',ZOOM);
    root.style.setProperty('--ny0',nameY0.toFixed(1)+'px');
    root.style.setProperty('--ly0',landY0.toFixed(1)+'px');
    pat.style.setProperty('--sky-bottom',((2+GAP+nameH*ZOOM+14)/ZOOM+landH).toFixed(1)+'px');   // birds just above the name
    if(heroCss){
      h1.style.animationRange=pat.style.animationRange='0px '+heroD+'px';
      root.classList.add('hero-css');
    }
    if(pat.setZoom) pat.setZoom(ZOOM);
    lastP=-1; heroUpdate();
  }
  function heroUpdate(){
    heroTicking=false;
    var p=Math.min(1,Math.max(0,window.scrollY/heroD));
    if(p===lastP) return; lastP=p;
    if(!heroCss){                                          // fallback: move them here
      var e=p*p*(3-2*p), k=1-e, z=(ZOOM+(1-ZOOM)*e).toFixed(4);
      h1.style.scale=z; h1.style.translate='0 '+(nameY0*k).toFixed(2)+'px';
      pat.style.scale=z; pat.style.translate='0 '+(landY0*k).toFixed(2)+'px';
    }
    if(pat.setHero) pat.setHero(p);                        // fades the birds and the swell; the widget may still be loading
  }
  if(heroOn){
    document.documentElement.classList.add('hero-on');
    if(!heroQ) markSeen();   // shown once per session; later page loads start compact
    heroLayout();
    window.addEventListener('scroll',function(){if(!heroTicking){heroTicking=true;requestAnimationFrame(heroUpdate);}},{passive:true});
    window.addEventListener('resize',heroLayout);
    customElements.whenDefined('wadi-pattern').then(heroLayout);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(heroLayout);   // the name's size depends on its font
  }

  function tick(){
    var d=new Date(Date.now()+3*3600*1000);
    var p=function(n){return (n<10?'0':'')+n;};
    document.getElementById('clock').textContent=p(d.getUTCHours())+':'+p(d.getUTCMinutes());
  }
  tick(); setInterval(tick,30000);
})();
