const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

// Mobile navigation
const menuToggle = $('.menu-toggle');
const nav = $('.nav');
menuToggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('.nav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded','false');
}));

// Reading progress
const progressBar = $('#progressBar');
const updateProgress = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  progressBar.style.width = `${max > 0 ? (doc.scrollTop / max) * 100 : 0}%`;
};
window.addEventListener('scroll', updateProgress, {passive:true});
updateProgress();

// Reveal animations
const revealItems = $$('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
  }), {threshold:.12});
  revealItems.forEach(el => io.observe(el));
} else revealItems.forEach(el => el.classList.add('visible'));

// Destination filters
const cards = $$('.dest-card');
$$('.filter').forEach(btn => btn.addEventListener('click', () => {
  $$('.filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filter = btn.dataset.filter;
  cards.forEach(card => {
    const show = filter === 'all' || card.dataset.region === filter;
    card.style.display = show ? '' : 'none';
  });
}));

// Destination detail modal
const modal = $('#destModal');
const modalImage = $('#modalImage');
const modalIndex = $('#modalIndex');
const modalRegion = $('#modalRegion');
const modalTitle = $('#modalTitle');
const modalCopy = $('#modalCopy');
const modalTags = $('#modalTags');
const openModal = card => {
  const img = $('img', card);
  modalImage.src = img.src;
  modalImage.alt = img.alt;
  modalIndex.textContent = card.dataset.index;
  modalRegion.textContent = card.querySelector('.country-region')?.textContent || '';
  modalTitle.textContent = card.dataset.country;
  modalCopy.textContent = card.dataset.copy;
  modalTags.innerHTML = '';
  (card.dataset.tags || '').split('|').filter(Boolean).forEach(tag => {
    const s = document.createElement('span'); s.textContent = tag; modalTags.appendChild(s);
  });
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
};
const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); };
cards.forEach(card => card.addEventListener('click', () => openModal(card)));
$$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// FormSubmit lead form
const form = $('#leadForm');
const status = $('#formStatus');
const leadEmail = $('#leadEmail');
const formUrl = $('#formUrl');
const formReplyTo = $('#formReplyTo');
if (formUrl) formUrl.value = window.location.href;
form?.addEventListener('submit', async e => {
  e.preventDefault();
  status.textContent = 'Sending your enquiry…';
  status.style.color = '#6e6c7a';
  if (formReplyTo && leadEmail) formReplyTo.value = leadEmail.value;
  try {
    const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}});
    const data = await response.json();
    if (response.ok && (data.success === true || data.message)) {
      status.textContent = 'Thank you — your enquiry has been sent. We’ll get back to you soon.';
      status.style.color = '#1b7f4d';
      form.reset();
      if (formUrl) formUrl.value = window.location.href;
    } else throw new Error(data.message || 'Unable to send');
  } catch (err) {
    status.innerHTML = 'We could not confirm the submission. Please email <strong>quoristaoverseas@gmail.com</strong> or use WhatsApp.';
    status.style.color = '#b3261e';
  }
});

// Footer year
$('#year').textContent = new Date().getFullYear();
