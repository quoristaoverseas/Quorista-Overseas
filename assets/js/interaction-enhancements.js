/* Quorista Overseas — accessible micro-interactions.
   No dependencies; deliberately does not alter forms, destinations or navigation targets. */
(function(){
  'use strict';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var header=document.querySelector('.site-header');
  var menu=document.querySelector('.menu-toggle');
  var nav=document.querySelector('.site-header .nav');
  function setMenu(open){
    if(!menu||!nav)return;
    nav.classList.toggle('open',!!open);
    menu.setAttribute('aria-expanded',String(!!open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    if(!nav.id)nav.id='quorista-main-navigation';
    menu.setAttribute('aria-controls',nav.id);
  }
  if(menu&&nav){
    setMenu(nav.classList.contains('open'));
    menu.addEventListener('click',function(){setMenu(nav.classList.contains('open'));});
    document.addEventListener('click',function(e){
      if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target))setMenu(false);
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus();}
    });
    nav.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
    window.addEventListener('resize',function(){if(window.innerWidth>850)setMenu(false);},{passive:true});
  }
  /* Pointer-following ambient light is limited to the hero and fine-pointer devices. */
  if(finePointer&&!reduce){
    var hero=document.querySelector('.hero');
    if(hero){
      var glow=document.createElement('span');
      glow.className='qe-pointer-glow';
      glow.setAttribute('aria-hidden','true');
      glow.style.cssText='position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;transition:opacity 240ms ease;background:radial-gradient(360px circle at var(--qe-x,50%) var(--qe-y,50%),rgba(255,255,255,.10),transparent 72%);';
      hero.insertBefore(glow,hero.firstChild);
      var frame=0,lastX=50,lastY=50;
      hero.addEventListener('pointermove',function(e){
        var rect=hero.getBoundingClientRect();
        lastX=((e.clientX-rect.left)/Math.max(rect.width,1))*100;
        lastY=((e.clientY-rect.top)/Math.max(rect.height,1))*100;
        if(!frame)frame=requestAnimationFrame(function(){
          hero.style.setProperty('--qe-x',lastX+'%');
          hero.style.setProperty('--qe-y',lastY+'%');
          glow.style.opacity='.9';frame=0;
        });
      },{passive:true});
      hero.addEventListener('pointerleave',function(){glow.style.opacity='0';},{passive:true});
    }
  }
  /* Keep destination detail dialogs keyboard-friendly where the homepage modal exists. */
  var modal=document.querySelector('#destModal');
  if(modal){
    var previousFocus=null,closeButton=modal.querySelector('.modal-close');
    var observer=new MutationObserver(function(){
      var open=modal.classList.contains('open');
      if(open){
        if(!modal.dataset.qeFocused){
          previousFocus=document.activeElement;
          modal.dataset.qeFocused='1';
          window.requestAnimationFrame(function(){if(closeButton)closeButton.focus();});
        }
      }else if(modal.dataset.qeFocused){
        delete modal.dataset.qeFocused;
        if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
    modal.addEventListener('keydown',function(e){
      if(e.key!=='Tab'||!modal.classList.contains('open'))return;
      var focusable=Array.prototype.slice.call(modal.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(el){return el.getClientRects().length;});
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    });
  }
})();
