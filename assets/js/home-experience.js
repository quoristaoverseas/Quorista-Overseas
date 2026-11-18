/* Quorista homepage-only interactive motion. No libraries or external requests. */
(function(){
  'use strict';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root=document.documentElement;
  root.classList.add('home-focus-ring');
  var revealTargets=document.querySelectorAll('.intro-grid,.section-head,.dest-card,.path-card,.university-copy,.university-wall,.scholar-visual,.scholarship-copy,.service-row,.process-step,.faq-item,.contact-copy,.form-shell');
  if(!reduce&&'IntersectionObserver' in window){
    root.classList.add('home-motion-ready');
    var revealObserver=new IntersectionObserver(function(entries,observer){
      entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('home-visible');observer.unobserve(entry.target);}});
    },{threshold:.12,rootMargin:'0px 0px -35px 0px'});
    Array.prototype.forEach.call(revealTargets,function(el,index){
      el.classList.add('home-reveal');
      if(index%7===1)el.classList.add('home-delay-1');
      if(index%7===3)el.classList.add('home-delay-2');
      if(index%7===5)el.classList.add('home-delay-3');
      revealObserver.observe(el);
    });
  }
  if(!fine||reduce)return;
  var cards=document.querySelectorAll('.dest-card,.path-card,.process-step,.info-card');
  cards.forEach(function(card){
    var raf=0;
    card.addEventListener('pointermove',function(event){
      var rect=card.getBoundingClientRect();
      var x=(event.clientX-rect.left)/Math.max(rect.width,1);
      var y=(event.clientY-rect.top)/Math.max(rect.height,1);
      var tiltX=((.5-y)*5.5).toFixed(2);
      var tiltY=((x-.5)*6.5).toFixed(2);
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(function(){
        card.style.setProperty('--qo-tilt-x',tiltX+'deg');
        card.style.setProperty('--qo-tilt-y',tiltY+'deg');
        card.style.setProperty('--qo-pointer-x',(x*100)+'%');
        card.style.setProperty('--qo-pointer-y',(y*100)+'%');
      });
    },{passive:true});
    card.addEventListener('pointerleave',function(){
      if(raf)cancelAnimationFrame(raf);
      card.style.setProperty('--qo-tilt-x','0deg');
      card.style.setProperty('--qo-tilt-y','0deg');
      card.style.setProperty('--qo-lift','0px');
    },{passive:true});
  });
  var hero=document.querySelector('.hero');
  var visual=hero&&hero.querySelector('.image-stack');
  if(hero&&visual){
    var frame=0,px=0,py=0;
    hero.addEventListener('pointermove',function(e){
      var r=hero.getBoundingClientRect();
      px=((e.clientX-r.left)/Math.max(r.width,1)-.5)*-3.2;
      py=((e.clientY-r.top)/Math.max(r.height,1)-.5)*2.4;
      if(!frame)frame=requestAnimationFrame(function(){
        visual.style.setProperty('--qo-hero-x',py.toFixed(2)+'deg');
        visual.style.setProperty('--qo-hero-y',px.toFixed(2)+'deg');
        frame=0;
      });
    },{passive:true});
    hero.addEventListener('pointerleave',function(){
      visual.style.setProperty('--qo-hero-x','0deg');
      visual.style.setProperty('--qo-hero-y','0deg');
    },{passive:true});
  }
})();

/* Homepage section-level interactions: FAQ accordion, atlas filtering, navigation and modal polish. */
(function(){
  'use strict';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var faqList=document.getElementById('faqList');
  var faqInput=document.getElementById('faqSearch');
  var faqCount=document.getElementById('faqCount');
  var faqEmpty=document.getElementById('faqEmpty');
  var faqItems=faqList?Array.prototype.slice.call(faqList.querySelectorAll('.faq-item')):[];
  var faqAnimations=new WeakMap();
  function animateFaq(item,opening){
    var panel=item.querySelector('p');
    if(!panel){item.open=opening;return;}
    var previous=faqAnimations.get(item);
    if(previous){previous.cancel();faqAnimations.delete(item);}
    item.classList.add('qo-faq-animating');
    if(opening){
      item.open=true;
      panel.style.height='auto';
      var target=panel.scrollHeight;
      panel.style.height='0px';
      panel.style.opacity='0';
      var animation=panel.animate([{height:'0px',opacity:0},{height:target+'px',opacity:1}],{duration:reduce?0:380,easing:'cubic-bezier(.22,.8,.24,1)'});
      faqAnimations.set(item,animation);
      animation.onfinish=function(){panel.style.height='';panel.style.opacity='';item.classList.remove('qo-faq-animating');faqAnimations.delete(item);};
    }else{
      var start=panel.getBoundingClientRect().height;
      var animation=panel.animate([{height:start+'px',opacity:1},{height:'0px',opacity:0}],{duration:reduce?0:300,easing:'cubic-bezier(.4,0,.2,1)'});
      faqAnimations.set(item,animation);
      animation.onfinish=function(){item.open=false;panel.style.height='';panel.style.opacity='';item.classList.remove('qo-faq-animating');faqAnimations.delete(item);};
    }
  }
  if(faqList){
    document.addEventListener('click',function(event){
      var summary=event.target.closest('#faqList .faq-item summary');
      if(!summary)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var item=summary.parentElement;
      var opening=!item.open;
      if(opening)faqItems.forEach(function(other){if(other!==item&&other.open)animateFaq(other,false);});
      animateFaq(item,opening);
    },true);
  }
  if(faqInput&&faqList){
    document.addEventListener('input',function(event){
      if(event.target!==faqInput)return;
      event.stopImmediatePropagation();
      var term=faqInput.value.trim().toLocaleLowerCase();
      var visible=0;
      faqItems.forEach(function(item){
        var match=item.textContent.toLocaleLowerCase().includes(term);
        if(!match&&item.open)animateFaq(item,false);
        item.hidden=!match;
        if(match)visible++;
      });
      if(faqCount)faqCount.textContent=visible+' '+(visible===1?'answer':'answers');
      if(faqEmpty)faqEmpty.hidden=visible!==0;
    },true);
  }
  /* Replace the instant atlas filter with a short, accessible card transition. */
  document.addEventListener('click',function(event){
    var button=event.target.closest('.filter[data-filter]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var buttons=Array.prototype.slice.call(document.querySelectorAll('.filter[data-filter]'));
    var cards=Array.prototype.slice.call(document.querySelectorAll('.dest-card'));
    var note=document.querySelector('.atlas-note');
    buttons.forEach(function(b){var active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    var filter=button.dataset.filter,count=0;
    cards.forEach(function(card){
      var show=filter==='all'||card.dataset.region===filter;
      if(show)count++;
      card.classList.remove('qo-filter-in','qo-filter-out');
      if(card._qoFilterAnimation){card._qoFilterAnimation.cancel();card._qoFilterAnimation=null;}
      if(show){
        var wasHidden=card.classList.contains('hide');
        card.classList.remove('hide');
        if(wasHidden&&!reduce){
          var animation=card.animate([{opacity:0,transform:'translateY(14px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:360,easing:'cubic-bezier(.22,.8,.24,1)'});
          card._qoFilterAnimation=animation;
        }
      }else if(!card.classList.contains('hide')){
        if(reduce){card.classList.add('hide');}
        else{
          var animation=card.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(10px) scale(.985)'}],{duration:220,easing:'ease-in'});
          card._qoFilterAnimation=animation;
          animation.onfinish=function(){card.classList.add('hide');card._qoFilterAnimation=null;};
        }
      }
    });
    if(note)note.textContent=count+' / '+cards.length+' destinations';
  },true);
  /* Highlight the section currently being viewed in the desktop navigation. */
  var navLinks=Array.prototype.slice.call(document.querySelectorAll('.site-header .nav a[href^="#"]'));
  var observedSections=navLinks.map(function(link){return document.querySelector(link.getAttribute('href'));}).filter(Boolean);
  if('IntersectionObserver' in window&&observedSections.length){
    var navObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting)return;
        navLinks.forEach(function(link){
          var current=link.getAttribute('href')==='#'+entry.target.id;
          if(current)link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      });
    },{rootMargin:'-28% 0px -62% 0px',threshold:0});
    observedSections.forEach(function(section){navObserver.observe(section);});
  }
  /* Prevent background page scrolling while the destination detail dialog is open. */
  var modal=document.getElementById('destModal');
  if(modal){
    var modalObserver=new MutationObserver(function(){
      document.body.classList.toggle('qo-modal-open',modal.classList.contains('open'));
    });
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    document.body.classList.toggle('qo-modal-open',modal.classList.contains('open'));
  }
  /* Consistent pressed feedback for keyboard and touch as well as mouse users. */
  document.addEventListener('pointerdown',function(event){
    var control=event.target.closest('.btn,.nav-cta,.submit-btn,.filter,.menu-toggle,.modal-close');
    if(!control||control.disabled)return;
    control.classList.add('qo-pressed');
  },{passive:true});
  ['pointerup','pointercancel'].forEach(function(type){
    document.addEventListener(type,function(event){
      var control=event.target.closest('.qo-pressed');
      if(control)control.classList.remove('qo-pressed');
    },{passive:true});
  });
})();
