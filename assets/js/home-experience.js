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