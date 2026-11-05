/* Quorista Overseas — progressive two-step enquiry form.
   Keeps the existing Apps Script endpoint and field names unchanged. */
(function(){
  'use strict';
  // Lock the iframe target to a stable name before any legacy submit handler runs.
  // This prevents the Apps Script response from replacing the current page.
  const submissionFrame=document.getElementById('sheetsSubmissionFrame');
  if(submissionFrame){
    submissionFrame.name='sheetsSubmissionFrame';
    submissionFrame.setAttribute('name','sheetsSubmissionFrame');
  }
  const forms=[...document.querySelectorAll('form#leadForm,form#destinationEnquiry')];
  forms.forEach(form=>{
    if(!/script\.google\.com\/macros\/s\//.test(form.getAttribute('action')||'')) return;
    if(form.dataset.qoEnhanced==='true') return;
    const names=['name','phone','email','interest','destination','contact_method','message','consent'];
    const controls={};
    names.forEach(name=>{controls[name]=form.querySelector('[name="'+name+'"]');});
    if(!controls.name||!controls.phone||!controls.email||!controls.interest) return;
    form.dataset.qoEnhanced='true';
    form.classList.add('qo-enquiry-form');
    if(submissionFrame){
      // Set this in the capture phase so the native Apps Script POST is always
      // directed to the hidden iframe, not the top-level browser window.
      form.addEventListener('submit',()=>{
        form.target='sheetsSubmissionFrame';
        form.setAttribute('target','sheetsSubmissionFrame');
      },true);
    }

    const progress=document.createElement('div');
    progress.className='qo-enquiry-progress-wrap';
    progress.innerHTML='<div class="qo-enquiry-progress" aria-hidden="true"><span class="qo-enquiry-progress__segment is-active"></span><span class="qo-enquiry-progress__segment"></span></div><div class="qo-enquiry-progress__meta"><span class="qo-enquiry-step-copy">YOUR DETAILS</span><strong>STEP 1 OF 2</strong></div>';
    const honeypot=form.querySelector('[name="_honey"]');
    if(honeypot&&honeypot.nextSibling) form.insertBefore(progress,honeypot.nextSibling);
    else form.insertBefore(progress,form.firstChild);

    const stepOne=['name','phone','email','interest','destination'];
    const stepTwo=['contact_method','message','consent'];
    const requiredState=new Map();
    function assign(name,step){
      const el=controls[name]; if(!el) return;
      const label=el.closest('label'); if(!label) return;
      label.classList.add('qo-enquiry-field');
      label.dataset.qoStep=String(step);
      if(el.required) requiredState.set(el,true);
    }
    stepOne.forEach(n=>assign(n,1));
    stepTwo.forEach(n=>assign(n,2));

    const submit=form.querySelector('button[type="submit"],input[type="submit"]');
    const bar=document.createElement('div');
    bar.className='qo-enquiry-controls';
    const back=document.createElement('button');
    back.type='button';back.className='qo-enquiry-back';back.textContent='← Back';
    const next=document.createElement('button');
    next.type='button';next.className='qo-enquiry-next';next.textContent='Continue →';
    bar.append(back,next);
    if(submit&&submit.parentNode) submit.parentNode.insertBefore(bar,submit);
    else form.appendChild(bar);

    let current=1;
    const segments=[...progress.querySelectorAll('.qo-enquiry-progress__segment')];
    const copy=progress.querySelector('.qo-enquiry-step-copy');
    const count=progress.querySelector('.qo-enquiry-progress__meta strong');
    function setStep(step){
      current=step;
      form.querySelectorAll('.qo-enquiry-field').forEach(label=>{
        const active=Number(label.dataset.qoStep)===step;
        label.hidden=!active;
        const input=label.querySelector('input,select,textarea');
        if(input&&requiredState.has(input)) input.required=active;
      });
      segments.forEach((seg,i)=>seg.classList.toggle('is-active',i<step));
      copy.textContent=step===1?'YOUR DETAILS':'YOUR REQUIREMENTS';
      count.textContent='STEP '+step+' OF 2';
      back.hidden=step===1;
      next.hidden=step===2;
      if(submit) submit.hidden=step===1;
      bar.style.justifyContent=step===1?'flex-end':'space-between';
    }
    function validateStep(){
      for(const label of form.querySelectorAll('.qo-enquiry-field[data-qo-step="'+current+'"]')){
        const input=label.querySelector('input,select,textarea');
        if(input&&input.willValidate&&!input.checkValidity()){input.reportValidity();return false;}
      }
      return true;
    }
    next.addEventListener('click',()=>{if(validateStep())setStep(2);});
    back.addEventListener('click',()=>setStep(1));
    form.addEventListener('submit',event=>{
      if(current===1){event.preventDefault();event.stopImmediatePropagation();if(validateStep())setStep(2);}
    },true);
    setStep(1);
  });
})();
