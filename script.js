(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // year
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // scroll progress + sticky header style
  const bar = $('#progressBar'), header = $('.site-header');
  const onScroll = () => {
    const h = document.documentElement;
    if (bar) bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + '%';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 30);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  const toggle = $('.menu-toggle'), nav = $('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', false); }));
  }

  // reveal on scroll
  const items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
    items.forEach(i => io.observe(i));
  } else items.forEach(i => i.classList.add('in'));

  // destination filter
  const cards = $$('.dest-card'), note = $('.atlas-note');
  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    const f = btn.dataset.filter; let n = 0;
    cards.forEach(c => { const show = f === 'all' || c.dataset.region === f; c.classList.toggle('hide', !show); if (show) { n++; c.classList.add('in'); } });
    if (note) note.textContent = n + ' / ' + cards.length + ' destinations';
  }));

  // destination modal
  const modal = $('#destModal');
  if (modal) {
    const close = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
    cards.forEach(c => c.addEventListener('click', () => {
      $('#modalImage').src = $('img', c).src; $('#modalImage').alt = $('img', c).alt;
      $('#modalIndex').textContent = c.dataset.index;
      $('#modalRegion').textContent = $('.country-region', c).textContent;
      $('#modalTitle').textContent = c.dataset.country;
      $('#modalCopy').textContent = c.dataset.copy;
      $('#modalTags').innerHTML = c.dataset.tags.split('|').map(t => '<span>' + t + '</span>').join('');
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    }));
    $$('[data-close-modal]', modal).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // career tabs
  const tabs = $$('.career-tab'), panels = $$('.career-panel');
  const showTab = id => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    panels.forEach(p => p.classList.toggle('active', p.id === id));
  };
  tabs.forEach(t => t.addEventListener('click', () => { showTab(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }));
  if (tabs.length) {
    const h = location.hash.slice(1);
    showTab(['full-time', 'part-time', 'internship'].includes(h) ? h : 'full-time');
  }

  // all forms (enquiry + careers)
  $$('form.ajax-form').forEach(form => {
    const status = $('.form-status', form), btn = $('button[type=submit]', form);
    const u = $('[name=_url]', form); if (u) u.value = location.href;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const em = $('[type=email]', form), rt = $('[name=_replyto]', form);
      if (em && rt) rt.value = em.value;
      btn.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        if (!res.ok) throw new Error();
        form.reset(); status.classList.add('ok');
        status.textContent = 'Thank you! We have received your submission and will get back to you soon.';
      } catch (err) {
        status.classList.add('err');
        status.textContent = 'Something went wrong. Please try again or message us on WhatsApp.';
      } finally { btn.disabled = false; }
    });
  });
})();
