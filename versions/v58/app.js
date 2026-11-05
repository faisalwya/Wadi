/* Shared behaviour for every language page. */
(function(){
  var keys=['work','services','about','contact'];   // the menu's order; Work opens first
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

  // ---- Cover: a full screen with the big name, the living landscape and the birds. It opens on the first
  // visit of a session; entering (the pointer, a swipe up, a scroll or a key) carries the name and landscape
  // up into the top bar in one pre-built move while the cover fades and the content and menu slide in.
  // Tapping the name in the top bar plays the same move in reverse and returns to the cover.
  // Nothing here follows the scroll, so it plays the same on every phone. The cover is skipped on links that
  // open a specific tab and on return visits; with reduce motion there is no cover at all.
  // ?cover=on|off in the URL forces it (ignoring the once-per-session rule) for testing.
  var cover=document.getElementById('cover'), root=document.documentElement;
  if(cover&&!calm.matches) setupCover(); else if(cover) cover.remove();

  function setupCover(){
    var wrap=document.querySelector('.wrap'), nav=document.querySelector('nav');
    var cName=cover.querySelector('.cover-name'), cLand=cover.querySelector('.cover-land'), enterBtn=cover.querySelector('.enter');
    var bg=cover.querySelector('.cover-bg'), sky=cover.querySelector('wadi-sky'), line=cover.querySelector('.cover-line');
    var hName=document.querySelector('.top h1'), hLand=document.querySelector('.top wadi-pattern');
    var ZOOM=1.6, D=640, EASE='cubic-bezier(.65,0,.3,1)', state='site';
    var q=new URLSearchParams(location.search).get('cover');
    var seen=false; try{seen=sessionStorage.getItem('wadi-cover')==='1';}catch(e){}
    customElements.whenDefined('wadi-pattern').then(function(){ cLand.setZoom(ZOOM); });

    // the name in the top bar becomes a button back to the cover (inside the heading, so it stays a heading)
    var home=document.createElement('button');
    home.type='button'; home.className='home'; home.textContent=hName.textContent;
    home.setAttribute('aria-label',document.documentElement.lang==='ar'?'العودة إلى الغلاف':'Back to the cover');
    hName.textContent=''; hName.append(home);
    home.addEventListener('click',back);

    // ways in
    enterBtn.addEventListener('click',enter);
    cover.addEventListener('click',enter);                 // or a tap anywhere on the cover
    cover.addEventListener('wheel',function(e){ if(e.deltaY>8) enter(); },{passive:true});
    var y0=null;
    cover.addEventListener('touchstart',function(e){ y0=e.touches[0].clientY; },{passive:true});
    cover.addEventListener('touchmove',function(e){ if(y0!==null&&y0-e.touches[0].clientY>28){ y0=null; enter(); } },{passive:true});
    document.addEventListener('keydown',function(e){
      if(state==='cover'&&['ArrowDown','PageDown',' ','Enter'].indexOf(e.key)>-1){ if(e.target!==enterBtn) e.preventDefault(); enter(); }
    });

    if(q!=='off'&&(q||(!seen&&!location.hash))){
      if(!q){ try{sessionStorage.setItem('wadi-cover','1');}catch(e){} }   // once per session
      showCover();
    }

    function clear(els){ els.forEach(function(el){ el.getAnimations().forEach(function(an){ an.cancel(); }); }); }
    function contentEls(){ return [].slice.call(wrap.children).filter(function(el){ return !el.classList.contains('top'); }); }

    // the cover on load: the name fades gently up while the landscape rises
    function showCover(){
      state='cover';
      root.classList.add('cover-on'); cover.hidden=false; wrap.inert=true; nav.inert=true;
      customElements.whenDefined('wadi-pattern').then(function(){ cLand.setHero(0); });
      // wait (briefly) for the display font, so the name never swaps typeface while it is on show
      cName.style.opacity='0'; line.style.opacity='0';
      var shown=false, reveal=function(){
        if(shown) return; shown=true; cName.style.opacity=''; line.style.opacity='';
        cName.animate([{opacity:0,translate:'0 6px'},{opacity:1,translate:'0 0'}],{duration:900,delay:100,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
        line.animate([{opacity:0},{opacity:1}],{duration:900,delay:700,easing:'ease',fill:'backwards'});
      };
      if(document.fonts&&document.fonts.ready) document.fonts.ready.then(reveal);
      setTimeout(reveal,900);
    }

    // where the cover's name and landscape sit, compared with their places in the top bar
    function offsets(){
      var a=cName.getBoundingClientRect(), b=hName.getBoundingClientRect();
      var la=cLand.getBoundingClientRect(), lb=hLand.getBoundingClientRect();   // zoomed about its bottom centre, so that point is true
      var s=b.width/a.width;
      return { s:s,
        name:'translate('+((b.left+b.width/2)-(a.left+a.width*s/2))+'px,'+((b.top+b.height/2)-(a.top+a.height*s/2))+'px) scale('+s+')',   // centre onto centre
        land:'translate('+((lb.left+lb.width/2)-(la.left+la.width/2))+'px,'+(lb.bottom-la.bottom)+'px) scale(1)' };                     // bottom centre onto bottom centre
    }

    function enter(){
      if(state!=='cover') return; state='moving';
      clear([cName,cLand,bg,sky,line,enterBtn].concat(contentEls(),[nav]));
      var o=offsets(), t0=performance.now();
      // the birds and the swell settle as the move begins
      (function calmDown(now){ var k=Math.min(1,(now-t0)/220); cLand.setHero(k*.34); if(k<1) requestAnimationFrame(calmDown); })(t0);
      enterBtn.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'});
      sky.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease',fill:'forwards'});
      line.animate([{opacity:1},{opacity:0}],{duration:200,easing:'ease',fill:'forwards'});
      cName.animate([{transform:'none'},{transform:o.name}],{duration:D,easing:EASE,fill:'forwards'});
      cLand.animate([{transform:'scale('+ZOOM+')'},{transform:o.land}],{duration:D,easing:EASE,fill:'forwards'});
      bg.animate([{opacity:1},{opacity:0}],{duration:D*.7,delay:D*.3,easing:'ease',fill:'forwards'});
      // the content and the menu slide in under it
      contentEls().forEach(function(el,i){
        el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:520,delay:D*.45+i*30,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      });
      nav.animate([{transform:'translateY(120%)'},{transform:'none'}],{duration:560,delay:D*.5,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      // hand over: the real name and landscape fade in as the travelling copies fade out (hides any sub-pixel difference)
      setTimeout(function(){
        root.classList.remove('cover-on');
        [hName,hLand].forEach(function(el){ el.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease'}); });
        [cName,cLand].forEach(function(el){ el.animate([{opacity:1},{opacity:0}],{duration:220,easing:'ease',fill:'forwards'}); });
      },D-120);
      setTimeout(function(){
        cover.hidden=true; wrap.inert=false; nav.inert=false;
        state='site';
      },D+120);
    }

    // back to the cover: the same move in reverse
    function back(){
      if(state!=='site') return; state='moving';
      window.scrollTo(0,0);
      clear([cName,cLand,bg,sky,line,enterBtn].concat(contentEls(),[nav]));
      cover.hidden=false; root.classList.add('cover-on'); wrap.inert=true; nav.inert=true;
      var o=offsets();
      contentEls().forEach(function(el){ el.animate([{opacity:1},{opacity:0,transform:'translateY(12px)'}],{duration:260,easing:'ease',fill:'forwards'}); });
      nav.animate([{transform:'none'},{transform:'translateY(120%)'}],{duration:320,easing:'cubic-bezier(.5,0,.75,0)',fill:'forwards'});
      bg.animate([{opacity:0},{opacity:1}],{duration:D*.6,easing:'ease',fill:'backwards'});
      cName.animate([{transform:o.name},{transform:'none'}],{duration:D,easing:EASE,fill:'backwards'});
      cLand.animate([{transform:o.land},{transform:'scale('+ZOOM+')'}],{duration:D,easing:EASE,fill:'backwards'});
      sky.animate([{opacity:0},{opacity:1}],{duration:420,delay:D*.7,easing:'ease',fill:'backwards'});
      line.animate([{opacity:0},{opacity:1}],{duration:420,delay:D*.8,easing:'ease',fill:'backwards'});
      enterBtn.animate([{opacity:0},{opacity:1}],{duration:320,delay:D*.8,easing:'ease',fill:'backwards'});
      setTimeout(function(){
        state='cover';
        cLand.setHero(0);                                   // the birds and the swell come back
        clear(contentEls().concat([nav]));                  // the content waits, unseen, under the cover
      },D+40);
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
