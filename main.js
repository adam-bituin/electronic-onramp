(() => {
  'use strict';

  /* PLACEHOLDER: the company's WhatsApp number, digits only with country code. Every [data-wa] link and
     the quote planner use it. The visible number in the HTML (+973 0000 0000) needs changing too. */
  const WHATSAPP = '97300000000';
  /* Paste a Calendly / Cal.com / Google appointment-page URL here. Empty = the planner's
     confirmation just says we'll reply on WhatsApp. */
  const BOOKING_URL = '';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  /* The Arabic page loads assets/l10n/ar.js first, which sets window.EOR_L10N; English is the fallback. */
  const L10N = window.EOR_L10N || {};
  const UI = Object.assign({
    menuOpen: 'Open menu', menuClose: 'Close menu',
    demoPause: 'Pause animation', demoPlay: 'Play animation',
    none: 'No services selected',
    errService: 'Select at least one service.',
    errContact: 'Please add your name and WhatsApp number.',
    wa: { title: '*New quote request from the Electronic On-Ramp website*', name: 'Name', business: 'Company', phone: 'WhatsApp',
          link: 'Email or website', about: 'What we do' }
  }, L10N.ui);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Both pages opt out of browser translation. If someone translates anyway (Google Translate rewrites
     <html lang> and adds a translated-ltr/rtl class), send them to the real page in that language,
     so they never see English text in the right-to-left Arabic layout or the reverse. */
  const root = document.documentElement, pageLang = root.lang;
  new MutationObserver(() => {
    const to = root.lang.slice(0, 2);
    if (to === pageLang || !/translated-(ltr|rtl)/.test(root.className)) return;
    if (to === 'en' && pageLang === 'ar') location.replace('/' + location.hash);
    else if (to === 'ar' && pageLang === 'en') location.replace('/ar/' + location.hash);
  }).observe(root, { attributes: true, attributeFilter: ['lang', 'class'] });

  $('#year').textContent = new Date().getFullYear();
  $$('[data-wa]').forEach(a => { a.href = `https://wa.me/${WHATSAPP}`; });

  /* Header: the capsule tightens and lifts once the page scrolls, and the pill behind the links
     follows the section in view. A section is current once its top passes 40% of the viewport;
     sections without a nav link (the quote form) leave no pill showing. */
  const header = $('.site-header'), nav = $('#nav'), ind = $('.nav-ind', nav);
  const sections = $$('main section[id]');
  const linkFor = id => $(`a[href="#${id}"]:not(.nav-cta)`, nav);
  let current = null;
  const moveInd = () => {
    if (!current || !ind.offsetParent) { ind.classList.remove('on'); return; }
    ind.style.setProperty('--ind-x', current.offsetLeft + 'px');
    ind.style.setProperty('--ind-w', current.offsetWidth + 'px');
    ind.classList.add('on');
  };
  const spy = () => {
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    let sec = atEnd ? sections.at(-1) : null;
    if (!sec) for (const s of sections) if (s.getBoundingClientRect().top <= innerHeight * .4) sec = s;
    const hit = sec ? linkFor(sec.id) : null;
    if (hit === current) return;
    current?.removeAttribute('aria-current');
    hit?.setAttribute('aria-current', 'location');
    current = hit; moveInd();
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; header.classList.toggle('scrolled', scrollY > 8); spy(); });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  /* The capsule changes width as it tightens, so re-measure once that settles */
  header.addEventListener('transitionend', e => { if (e.target === header && e.propertyName === 'width') moveInd(); });
  addEventListener('resize', moveInd);
  document.fonts?.ready.then(moveInd);

  /* Mobile nav: a glass sheet under the capsule. Closes on a link, Escape or a tap outside. */
  const toggle = $('.nav-toggle');
  const setNav = open => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? UI.menuClose : UI.menuOpen);
  };
  toggle.addEventListener('click', () => setNav(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); }
  });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !header.contains(e.target)) setNav(false); });

  /* ── Get a quote: services and their questions ──
     type: one = pick one, many = pick any, text = short answer, long = a few lines.
     Service ids match the data-pick links on the service cards. */
  const GROUPS = L10N.groups || ['Software solutions', 'IT support', 'Infrastructure', 'Cloud & security'];
  const [SOFT, SUPPORT, INFRA, CLOUD] = GROUPS;
  const SERVICES = L10N.services || [
    { id: 'acct', group: SOFT, name: 'Accounting, ERP, inventory & POS', qs: [
      { q: 'Which platform?', type: 'one', opts: ['QuickBooks Online', 'QuickBooks Desktop', 'Sage 50', 'Sage 200 Evolution', 'Sage Business Cloud', 'Not sure, advise us'] },
      { q: 'What do you need?', type: 'many', opts: ['New licences', 'Implementation and setup', 'Data migration', 'Inventory', 'Point of sale', 'Training', 'Support and upgrades'] },
      { q: 'Number of users', type: 'text' },
      { q: 'Current system, if any', type: 'text', ph: 'For example: Excel, Tally, Odoo' } ] },
    { id: 'payroll', group: SOFT, name: 'HR & payroll', qs: [
      { q: 'Number of employees', type: 'one', opts: ['Under 25', '25 to 100', '100 to 500', 'More than 500'] },
      { q: 'What do you need?', type: 'many', opts: ['Payroll', 'Leave management', 'Attendance', 'Employee records', 'End of service calculations'] },
      { q: 'Current system, if any', type: 'text', ph: 'Optional' } ] },
    { id: 'crm', group: SOFT, name: 'CRM', qs: [
      { q: 'What should it manage?', type: 'many', opts: ['Leads and sales pipeline', 'Customer service', 'Marketing', 'Quotes and invoices'] },
      { q: 'Number of users', type: 'text' },
      { q: 'Connect it to your accounting software?', type: 'one', opts: ['Yes', 'No', 'Not sure'] } ] },
    { id: 'industry', group: SOFT, name: 'Facility, school & IP management', qs: [
      { q: 'Which system?', type: 'many', opts: ['Facility management (QuickFMS)', 'School management', 'Intellectual property management'] },
      { q: 'Size of your organisation', type: 'text', ph: 'Sites, students, staff or cases' },
      { q: 'Anything specific?', type: 'long', ph: 'Optional' } ] },
    { id: 'zatca', group: SOFT, name: 'E-invoicing (ZATCA)', qs: [
      { q: 'Where do you invoice?', type: 'one', opts: ['Saudi Arabia only', 'Saudi Arabia and other GCC countries', 'Not sure'] },
      { q: 'Your accounting system', type: 'text', ph: 'For example: Sage, QuickBooks, Excel' },
      { q: 'Invoices per month, roughly', type: 'one', opts: ['Under 100', '100 to 1,000', 'Over 1,000'] } ] },
    { id: 'reports', group: SOFT, name: 'Crystal Reports & BI', qs: [
      { q: 'What do you need?', type: 'many', opts: ['New Crystal Reports', 'Change existing reports', 'Dashboards', 'Scheduled report emails'] },
      { q: 'Where does the data come from?', type: 'text', ph: 'For example: Sage, SQL Server, Excel' } ] },
    { id: 'dbc', group: SOFT, name: 'Digital business cards', qs: [
      { q: 'How many cards?', type: 'one', opts: ['1 to 10', '11 to 50', 'More than 50'] },
      { q: 'Features', type: 'many', opts: ['QR code', 'NFC card', 'Save to contacts', 'Company branding'] } ] },
    { id: 'software', group: SOFT, name: 'Custom application development', qs: [
      { q: 'What should it do?', type: 'long', ph: 'Describe the task or process in a sentence or two' },
      { q: 'Who will use it?', type: 'one', opts: ['Our team', 'Our customers', 'Both'] },
      { q: 'Tools it should connect to', type: 'many', opts: ['Excel or Sheets', 'Microsoft 365', 'Accounting software', 'A CRM', 'WhatsApp'] } ] },
    { id: 'web', group: SOFT, name: 'Websites & e-commerce', qs: [
      { q: 'What do you need?', type: 'one', opts: ['New website', 'Website redesign', 'Online store', 'Mobile app', 'Web app or portal'] },
      { q: 'Main goal', type: 'many', opts: ['Show the business', 'Get enquiries', 'Sell online', 'Take bookings'] },
      { q: 'Languages', type: 'one', opts: ['English', 'Arabic', 'Both'] },
      { q: 'Current website', type: 'text', ph: 'Optional' } ] },
    { id: 'support', group: SUPPORT, name: 'Managed IT & helpdesk', qs: [
      { q: 'How many computers and laptops?', type: 'one', opts: ['Under 10', '10 to 50', '50 to 200', 'More than 200'] },
      { q: 'How is IT handled today?', type: 'one', opts: ['Nobody, we manage ourselves', 'In-house IT person', 'Another provider', 'Mix of these'] },
      { q: 'What do you need covered?', type: 'many', opts: ['Helpdesk for staff', 'Monitoring', 'Updates and patching', 'New starter setups', 'Printers'] },
      { q: 'Support hours needed', type: 'one', opts: ['Working hours', 'Extended hours', '24/7'] } ] },
    { id: 'onsite', group: SUPPORT, name: 'On-site support & annual maintenance', qs: [
      { q: 'What kind of arrangement?', type: 'one', opts: ['Annual maintenance contract', 'Visits when needed', 'A one-off job', 'Not sure yet'] },
      { q: 'Number of locations', type: 'one', opts: ['1', '2 to 3', 'More than 3'] },
      { q: 'What needs looking after?', type: 'many', opts: ['Computers', 'Printers and copiers', 'Network', 'Servers', 'CCTV', 'Phones'] },
      { q: 'Where are you based?', type: 'text', ph: 'Area or building' } ] },
    { id: 'consult', group: SUPPORT, name: 'IT consulting & audits', qs: [
      { q: 'What prompted this?', type: 'many', opts: ['Slow or unreliable systems', 'Security worries', 'Rising costs', 'Moving office', 'Growing the team'] },
      { q: 'What should we review?', type: 'many', opts: ['Network', 'Security', 'Cloud and email', 'Software and licences', 'Everything'] },
      { q: 'Anything specific on your mind?', type: 'long', ph: 'Optional' } ] },
    { id: 'network', group: INFRA, name: 'Networking & Wi-Fi', qs: [
      { q: 'New setup or improving an existing one?', type: 'one', opts: ['New office', 'Upgrade existing', 'Fixing problems'] },
      { q: 'Office size, roughly', type: 'one', opts: ['Under 200 m²', '200 to 1,000 m²', 'Over 1,000 m²', 'Several floors or sites'] },
      { q: 'How many users and devices?', type: 'text' },
      { q: 'Main problems today', type: 'many', opts: ['Slow internet', 'Wi-Fi dead spots', 'Drops and outages', 'No guest network', 'None, it is new'] } ] },
    { id: 'cabling', group: INFRA, name: 'Structured cabling & racks', qs: [
      { q: 'What is the job?', type: 'one', opts: ['New fit-out', 'Re-cabling', 'Tidy up existing', 'Add a few points'] },
      { q: 'Number of network points, roughly', type: 'one', opts: ['Under 20', '20 to 100', 'Over 100', 'Not sure'] },
      { q: 'Do you need a rack or server room?', type: 'one', opts: ['Yes', 'No', 'Not sure'] },
      { q: 'When is the site ready?', type: 'text', ph: 'Date, or "ready now"' } ] },
    { id: 'cctv', group: INFRA, name: 'CCTV & access control', qs: [
      { q: 'What do you need?', type: 'many', opts: ['CCTV cameras', 'Door access', 'Intercom', 'Time attendance'] },
      { q: 'Number of cameras or doors, roughly', type: 'text' },
      { q: 'Indoor, outdoor or both?', type: 'one', opts: ['Indoor', 'Outdoor', 'Both'] },
      { q: 'View from your phone?', type: 'one', opts: ['Yes', 'No'] } ] },
    { id: 'm365', group: CLOUD, name: 'Microsoft 365 & Google Workspace', qs: [
      { q: 'Which platform?', type: 'one', opts: ['Microsoft 365', 'Google Workspace', 'Not sure, advise us'] },
      { q: 'What do you need?', type: 'many', opts: ['New setup', 'Move email from another provider', 'Licence management', 'Teams or SharePoint', 'Security settings'] },
      { q: 'Number of users', type: 'text' },
      { q: 'Your current email provider', type: 'text', ph: 'Optional' } ] },
    { id: 'cloud', group: CLOUD, name: 'Cloud & servers', qs: [
      { q: 'What are you looking for?', type: 'one', opts: ['Move to the cloud', 'New on-site server', 'Manage existing servers', 'Not sure'] },
      { q: 'What runs on it?', type: 'many', opts: ['Files', 'Accounting or ERP', 'Databases', 'Websites or apps', 'Remote access'] },
      { q: 'Preferred cloud', type: 'one', opts: ['Microsoft Azure', 'AWS', 'Google Cloud', 'No preference'] } ] },
    { id: 'cyber', group: CLOUD, name: 'Firewall, cybersecurity & backup', qs: [
      { q: 'What do you need?', type: 'many', opts: ['Firewall', 'Acronis Cyber Protect Cloud', 'Antivirus and endpoint protection', 'Backups', 'Email security', 'Staff training', 'Security review'] },
      { q: 'Have you had an incident recently?', type: 'one', opts: ['Yes', 'No', 'Not sure'] },
      { q: 'Do you have backups today?', type: 'one', opts: ['Yes, tested', 'Yes, never tested', 'No', 'Not sure'] },
      { q: 'Any compliance requirements?', type: 'text', ph: 'For example: client audits, ISO 27001, PDPL' } ] }
  ];
  const SHARED = L10N.shared || [
    { id: 'team', q: 'Team size', type: 'one', opts: ['1 to 10', '11 to 50', '51 to 200', 'More than 200'] },
    { id: 'timeline', q: 'When do you need it?', type: 'one', opts: ['Urgently', 'Within a month', '1 to 3 months', 'Just exploring'] },
    { id: 'budget', q: 'Budget range', type: 'one', opts: ['Under 500 BHD', '500 to 2,000 BHD', '2,000 to 10,000 BHD', 'Over 10,000 BHD', 'Not sure yet'] }
  ];

  const el = (tag, props = {}, kids = []) => {
    const n = Object.assign(document.createElement(tag), props);
    n.append(...kids);
    return n;
  };

  const chip = (type, name, value, onChange) => {
    const input = el('input', { type, name, value });
    if (onChange) input.addEventListener('change', onChange);
    return el('label', { className: 'chip' }, [input, el('span', { textContent: value })]);
  };

  /* One question → its markup. Choice questions are fieldsets; text questions a labelled input. */
  const renderQ = (q, name) => {
    if (q.type === 'one' || q.type === 'many') {
      return el('fieldset', { className: 'q' }, [
        el('legend', { textContent: q.q }),
        el('div', { className: 'chips' }, q.opts.map(o => chip(q.type === 'one' ? 'radio' : 'checkbox', name, o)))
      ]);
    }
    const field = q.type === 'long'
      ? el('textarea', { name, id: name, rows: 3, placeholder: q.ph || '' })
      : el('input', { type: 'text', name, id: name, placeholder: q.ph || '' });
    return el('div', { className: 'q' }, [el('label', { className: 'q-label', htmlFor: name, textContent: q.q }), field]);
  };

  const pickEl = $('#pick'), qsEl = $('#qs'), form = $('#planner');
  const chosen = () => SERVICES.filter(s => form.elements[`svc-${s.id}`].checked);

  /* An answer as text: checked choices joined, or the trimmed field value. */
  const answer = name => {
    const f = form.elements[name];
    if (!f) return '';
    const nodes = typeof f.length === 'number' && !f.tagName ? [...f] : [f];
    return nodes
      .filter(n => (n.type === 'checkbox' || n.type === 'radio') ? n.checked : true)
      .map(n => n.value.trim()).filter(Boolean).join(', ');
  };

  const summary = $('#summary-list'), empty = $('#qs-empty');
  const refresh = () => {
    const list = chosen();
    SERVICES.forEach(s => { blocks[s.id].hidden = !list.includes(s); });
    empty.hidden = list.length > 0;
    summary.replaceChildren(...(list.length
      ? list.map(s => el('li', { textContent: s.name }))
      : [el('li', { className: 'muted', textContent: UI.none })]));
    if (list.length) $('#plan-error').hidden = true;
  };

  GROUPS.forEach(g => pickEl.append(el('div', { className: 'pick-group' }, [
    el('p', { textContent: g }),
    el('div', { className: 'chips' }, SERVICES.filter(s => s.group === g).map(s => chip('checkbox', `svc-${s.id}`, s.name, refresh)))
  ])));

  const blocks = Object.fromEntries(SERVICES.map(s => {
    const b = el('div', { className: 'svc-qs', hidden: true }, [
      el('h4', { textContent: s.name }),
      ...s.qs.map((q, i) => renderQ(q, `${s.id}-${i}`))
    ]);
    qsEl.append(b);
    return [s.id, b];
  }));
  SHARED.forEach(q => $(`#q-${q.id}`).replaceWith(renderQ(q, q.id)));

  /* "Get a quote" on a service card ticks that service before jumping to the planner */
  $$('[data-pick]').forEach(a => a.addEventListener('click', () => {
    const box = form.elements[`svc-${a.dataset.pick}`];
    if (box && !box.checked) { box.checked = true; refresh(); }
  }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const list = chosen();
    const name = $('#p-name'), phone = $('#p-phone');
    const missing = [name, phone].filter(f => !f.value.trim());
    [name, phone].forEach(f => f.classList.toggle('invalid', missing.includes(f)));

    const err = $('#plan-error');
    if (!list.length) {
      err.textContent = UI.errService;
      err.hidden = false;
      pickEl.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      return;
    }
    if (missing.length) {
      err.textContent = UI.errContact;
      err.hidden = false;
      missing[0].focus();
      return;
    }
    err.hidden = true;

    const line = (label, value) => value ? `${label}: ${value}` : null;
    const text = [
      UI.wa.title, '',
      line(UI.wa.name, name.value.trim()),
      line(UI.wa.business, answer('business')),
      line(UI.wa.phone, phone.value.trim()),
      line(UI.wa.link, answer('link')),
      line(UI.wa.about, answer('about')),
      ...SHARED.map(q => line(q.q, answer(q.id))),
      ...list.flatMap(s => ['', `*${s.name}*`, ...s.qs.map((q, i) => line(q.q, answer(`${s.id}-${i}`)))])
    ].filter(l => l !== null).join('\n');

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');

    const book = $('#book-link');
    if (BOOKING_URL) { book.href = BOOKING_URL; book.hidden = false; }
    $('#plan-done').hidden = false;
  });

  refresh();

  /* Hero demo: the orange bar under the active tab times each scene; when it finishes, the next tab plays.
     Pauses on request, while scrolled off-screen, and while the browser tab is hidden. With reduced motion
     nothing plays: each tab shows its finished scene. */
  const demo = $('[data-demo]');
  if (demo) {
    const tabs = $$('[data-tab]', demo), scenes = $$('[data-scene]', demo), caps = $$('[data-cap]', demo);
    const pause = $('.demo-pause', demo);
    let current = 0;
    const show = i => {
      current = i;
      tabs.forEach((t, k) => { t.setAttribute('aria-pressed', k === i); t.classList.remove('run'); });
      scenes.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.remove('play'); });
      caps.forEach((c, k) => { c.hidden = k !== i; });
      if (reduceMotion) return;
      void demo.offsetWidth; /* restart the CSS animations */
      scenes[i].classList.add('play');
      tabs[i].classList.add('run');
    };
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k));
      $('i', t).addEventListener('animationend', () => { if (k === current) show((k + 1) % tabs.length); });
    });
    pause.addEventListener('click', () => {
      const paused = demo.classList.toggle('paused');
      pause.setAttribute('aria-pressed', paused);
      pause.setAttribute('aria-label', paused ? UI.demoPlay : UI.demoPause);
    });
    const offscreen = { view: false, tab: false };
    const sync = () => demo.classList.toggle('offscreen', offscreen.view || offscreen.tab);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { offscreen.view = !en.isIntersecting; sync(); }).observe(demo);
    }
    document.addEventListener('visibilitychange', () => { offscreen.tab = document.hidden; sync(); });
    show(0);
  }

  /* Hero → demo: as the page scrolls, the hero text drifts slower than the page and fades, while the demo
     stage opens from a card to the full screen width (--p 0 → 1). It then holds, pinned, for a short stretch
     before the page moves on. It pins centred when it fits below the header, otherwise bottom-aligned. */
  const pin = $('.stage-pin'), stage = $('.hero-stage'), heroText = $('.hero > .wrap');
  if (pin && stage && !reduceMotion) {
    root.classList.add('js-stage');
    let range = 1, queued = false;
    const expand = () => {
      queued = false;
      const p = Math.min(1, Math.max(0, scrollY / range));
      stage.style.setProperty('--p', p.toFixed(4));
      heroText.style.transform = `translateY(${Math.min(scrollY, range) * .3}px) scale(${1 - p * .05})`;
      heroText.style.opacity = Math.max(0, 1 - p * 1.15).toFixed(3);
    };
    const measure = () => {
      const h = stage.offsetHeight, room = innerHeight - 72;
      const pinTop = h <= room ? 72 + (room - h) / 2 : innerHeight - h;
      stage.style.setProperty('--pin-top', pinTop + 'px');
      range = Math.max(200, pin.getBoundingClientRect().top + scrollY - pinTop);
      expand();
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(expand); } }, { passive: true });
    addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    measure();
  }

  /* Subtle reveal on scroll */
  const targets = $$('.sec-head, .feature, .catalog > div, .steps li, .about-copy, .facts, .plan-block, .summary, .faq, .contact-grid');
  if ('IntersectionObserver' in window && !reduceMotion) {
    targets.forEach(n => n.classList.add('reveal'));
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(n => io.observe(n));
  }
})();
