/* Astro Lanches & Galáxia Açaí — prévia v0.1 (18/11/2026) */
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const MENU = window.CARDAPIO || [];
  const brl = v => 'R$ ' + v.toFixed(2).replace('.', ',');
  const byCat = c => MENU.filter(i => i.cat === c);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const thumb = (it, cls = '') => it.img
    ? `<img src="${it.img}" alt="" width="240" height="240" loading="lazy" decoding="async"${cls}>`
    : `<span class="noimg" aria-hidden="true">foto a confirmar</span>`;

  /* ---------- Menu móvel ---------- */
  const topbar = $('.topbar'), menuBtn = $('.menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = !topbar.classList.contains('is-open');
    topbar.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.sr-only', menuBtn).textContent = open ? 'Fechar menu' : 'Abrir menu';
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    topbar.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && topbar.classList.contains('is-open')) { menuBtn.click(); menuBtn.focus(); }
  });

  /* ---------- Hero: céu estrelado (desenho único) ---------- */
  const hero = $('.hero'), canvas = $('.stars');
  function drawStars() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = hero.clientWidth, h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const n = Math.round(w * h / 5200);
    for (let i = 0; i < n; i++) {
      const r = rnd() < .92 ? rnd() * .9 + .3 : rnd() * 1.4 + 1;
      ctx.globalAlpha = .25 + rnd() * .6;
      ctx.fillStyle = rnd() < .12 ? '#f2b33d' : '#fff';
      ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ---------- Hero: órbita (preset orbit) ---------- */
  const SATS = {
    astro: ['5012269', '5078814', '4548590', '4107408', '3544395', '3544416'],
    galaxia: ['3553249', '3553251', '3553252', '3553253', '3553255', '3837757']
  };
  const imgOf = id => (MENU.find(i => i.id === id) || {}).img;
  const satBox = $('.sats');
  const sats = SATS.astro.map((id, i) => {
    const el = document.createElement('div');
    el.className = 'sat';
    el.innerHTML = `<img class="a" src="${imgOf(id)}" alt="" width="240" height="240" decoding="async"><img class="g" src="${imgOf(SATS.galaxia[i])}" alt="" width="240" height="240" loading="lazy" decoding="async">`;
    satBox.appendChild(el);
    return el;
  });
  let boxW = 0, boxH = 0, angle = 0.4, last = 0, orbitRunning = false, heroVisible = true, raf = 0;
  function placeSats() {
    const n = sats.length;
    sats.forEach((el, i) => {
      const t = angle + i * (Math.PI * 2 / n);
      const s = Math.sin(t), c = Math.cos(t);
      const x = boxW * (0.5 + 0.477 * c), y = boxH * (0.5 + 0.16 * s);
      const k = 0.6 + 0.4 * ((s + 1) / 2);
      el.style.transform = `translate3d(${x}px,${y}px,0) scale(${k})`;
      el.style.zIndex = s > 0 ? 6 : 4;
      el.style.opacity = (0.55 + 0.45 * ((s + 1) / 2)).toFixed(3);
    });
  }
  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(now - last, 64); last = now;
    angle += dt * (Math.PI * 2 / 48000);
    placeSats();
    raf = requestAnimationFrame(tick);
  }
  function setOrbit() {
    const should = heroVisible && !document.hidden && !reduce.matches;
    if (should && !orbitRunning) { orbitRunning = true; last = 0; raf = requestAnimationFrame(tick); }
    if (!should && orbitRunning) { orbitRunning = false; cancelAnimationFrame(raf); }
  }
  new ResizeObserver(() => { boxW = satBox.clientWidth; boxH = satBox.clientHeight; placeSats(); }).observe(satBox);
  new ResizeObserver(drawStars).observe(hero);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; setOrbit(); }).observe(hero);
  document.addEventListener('visibilitychange', setOrbit);
  reduce.addEventListener('change', setOrbit);

  /* Parallax discreto do planeta (só ponteiro fino) */
  const planet = $('.planet');
  planet.style.transition = 'transform 700ms cubic-bezier(.22,1,.36,1)';
  hero.addEventListener('pointermove', e => {
    if (!finePointer.matches || reduce.matches) return;
    const r = hero.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5;
    planet.style.transform = `translate(${mx * 14}px, ${my * 14}px)`;
  });
  hero.addEventListener('pointerleave', () => { planet.style.transform = ''; });

  /* ---------- Troca de universo (eclipse: preset circle + line-mask) ---------- */
  const heroAnchor = $('.js-hero-anchor');
  function setUniverse(u) {
    if (root.dataset.universe === u) return;
    const hr = hero.getBoundingClientRect(), pr = planet.getBoundingClientRect();
    hero.style.setProperty('--cx', ((pr.left + pr.width / 2 - hr.left) / hr.width * 100).toFixed(1) + '%');
    hero.style.setProperty('--cy', ((pr.top + pr.height / 2 - hr.top) / hr.height * 100).toFixed(1) + '%');
    root.dataset.universe = u;
    $$('.switch-opt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.go === u)));
    heroAnchor.textContent = u === 'astro' ? 'Ver os burgers' : 'Ver os copos';
    heroAnchor.href = u === 'astro' ? '#burgers' : '#acai';
    $('meta[name="theme-color"]').content = u === 'astro' ? '#160a0c' : '#14061c';
  }
  $$('.switch-opt').forEach(b => b.addEventListener('click', () => setUniverse(b.dataset.go)));
  planet.addEventListener('click', () => setUniverse(root.dataset.universe === 'astro' ? 'galaxia' : 'astro'));

  /* ---------- Listas ---------- */
  const rowHTML = it => `<li class="row">${thumb(it)}<span class="row-name"><span>${esc(it.nome)}</span></span><span class="price">${brl(it.preco)}</span></li>`;
  $('#rows-burgers').innerHTML = byCat('Burgers').map(rowHTML).join('');
  $('#rows-porcoes').innerHTML = byCat('Servem até 2 pessoas').map(rowHTML).join('');
  $('#rows-tabuas').innerHTML = byCat('Tábuas').map(rowHTML).join('');
  $('#rows-casal').innerHTML = byCat('Combo casal').map(rowHTML).join('');

  /* ---------- Carrossel de destaques (ix-carousel-focus) ---------- */
  const track = $('.feature-track'), cards = $$('.fcard', track);
  const count = $('.feature-count'), [prev, next] = $$('.feature-ctrl .round-btn');
  let active = 0;
  const setActive = i => {
    active = i;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    count.textContent = `${i + 1} / ${cards.length}`;
    prev.disabled = i === 0; next.disabled = i === cards.length - 1;
  };
  setActive(0);
  const cardIO = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) setActive(cards.indexOf(e.target)); });
  }, { root: track, threshold: .6 });
  cards.forEach(c => cardIO.observe(c));
  const go = d => {
    const i = Math.max(0, Math.min(cards.length - 1, active + d));
    track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* ---------- Horizonte (progresso de rolagem, sem pin) ---------- */
  const horizon = $('.horizon');
  let hTicking = false, hNear = false;
  const updHorizon = () => {
    hTicking = false;
    if (reduce.matches) { horizon.style.setProperty('--p', 1); return; }
    const r = horizon.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.95)));
    horizon.style.setProperty('--p', p.toFixed(3));
  };
  new IntersectionObserver(([e]) => { hNear = e.isIntersecting; if (hNear) updHorizon(); }, { rootMargin: '20% 0px' }).observe(horizon);
  addEventListener('scroll', () => { if (hNear && !hTicking) { hTicking = true; requestAnimationFrame(updHorizon); } }, { passive: true });
  updHorizon();

  /* ---------- Constelação de copos (ix-radio-orbit) ---------- */
  const cupsPremium = byCat('Copos premium');
  const POS = [[12, 30], [25, 14], [39, 27], [31, 50], [49, 60], [61, 38], [75, 20], [89, 34], [82, 60], [65, 80], [42, 85]];
  const LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [2, 5], [4, 9]];
  const map = $('.sky-map'), lines = $('.sky-lines');
  lines.innerHTML = LINKS.map(([a, b]) => `<line x1="${POS[a][0]}" y1="${POS[a][1]}" x2="${POS[b][0]}" y2="${POS[b][1]}"/>`).join('');
  const shortName = n => n.replace(/\s*550ml/i, '').replace(/\s*<3.*$/, '');
  const stars = cupsPremium.slice(0, POS.length).map((it, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'star'; b.setAttribute('role', 'radio');
    b.style.left = POS[i][0] + '%'; b.style.top = POS[i][1] + '%';
    b.setAttribute('aria-label', `${it.nome}, ${brl(it.preco)}`);
    b.innerHTML = `<span class="star-label" aria-hidden="true">${esc(shortName(it.nome))}</span>`;
    b.addEventListener('click', () => pickCup(i, true));
    map.appendChild(b);
    return b;
  });
  const cupImg = $('#cup-img'), porthole = $('.porthole'), emptyLbl = $('.porthole-empty');
  let cupIdx = -1, swapT = 0;
  function pickCup(i, focus) {
    if (i === cupIdx) return;
    cupIdx = i;
    const it = cupsPremium[i];
    stars.forEach((s, k) => { s.setAttribute('aria-checked', String(k === i)); s.tabIndex = k === i ? 0 : -1; });
    if (focus) stars[i].focus();
    $('#cup-name').textContent = it.nome.replace(/\s*<3\s*:\)/, ' ♥');
    $('#cup-price').textContent = brl(it.preco);
    const src = it.id === '3553254' ? 'assets/img/quasar.webp' : it.img;
    clearTimeout(swapT);
    porthole.classList.add('is-swapping');
    swapT = setTimeout(() => {
      if (src) { cupImg.src = src; cupImg.alt = `Copo ${it.nome}`; cupImg.hidden = false; emptyLbl.hidden = true; }
      else { cupImg.hidden = true; cupImg.alt = ''; emptyLbl.hidden = false; }
      requestAnimationFrame(() => porthole.classList.remove('is-swapping'));
    }, reduce.matches ? 0 : 220);
  }
  map.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    pickCup((cupIdx + d + stars.length) % stars.length, true);
  });
  pickCup(0, false);

  /* ---------- Monte seu açaí: copos proporcionais ---------- */
  const sizes = byCat('Monte seu açaí').map(it => ({ it, ml: +(it.nome.match(/(\d+)\s*ml/i) || [0, 0])[1] })).sort((a, b) => a.ml - b.ml);
  const maxMl = Math.max(...sizes.map(s => s.ml));
  $('#cups').innerHTML = sizes.map(({ it, ml }, i) => {
    const h = Math.round(60 + 140 * ml / maxMl);
    return `<div class="cup"><svg viewBox="0 0 100 ${h + 8}" role="img" aria-label="${esc(it.nome)}, ${brl(it.preco)}">
      <defs><linearGradient id="gf${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7b7ff"/><stop offset=".25" stop-color="#9b2aa8"/><stop offset="1" stop-color="#4a0b57"/></linearGradient></defs>
      <path class="fill" style="transition-delay:${i * 110}ms" d="M14 ${6 + h * .12} L86 ${6 + h * .12} L78 ${h + 4} L22 ${h + 4} Z" fill="url(#gf${i})"/>
      <path d="M8 6 L92 6 L80 ${h + 6} L20 ${h + 6} Z" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2" stroke-linejoin="round"/>
    </svg><b>${ml} ml</b><span>${brl(it.preco)}</span></div>`;
  }).join('');

  /* ---------- Cardápio completo (tabs) ---------- */
  const TABS = [
    { id: 'lanches', label: 'Lanches', cats: ['Novidades do mês', 'Mais pedidos', 'Burgers', 'Lanches tradicionais'] },
    { id: 'combos', label: 'Combos', cats: ['Destaques', 'Combo individual', 'Combo casal'] },
    { id: 'porcoes', label: 'Porções', cats: ['Entradas e porções', 'Servem até 2 pessoas', 'Tábuas'] },
    { id: 'acai', label: 'Açaí', cats: ['Copos premium', 'Monte seu açaí'], galaxia: true },
    { id: 'doces', label: 'Doces e molhos', cats: ['Doces e sobremesas', 'Molhos e maionese'] },
    { id: 'bebidas', label: 'Bebidas', cats: ['Bebidas'] }
  ];
  const tabsEl = $('#menu-tabs'), panel = $('#menu-panel'), ind = $('.tab-ind', tabsEl), search = $('#menu-search');
  const tabBtns = TABS.map((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tab'; b.id = 'tab-' + t.id; b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'menu-panel'); b.textContent = t.label;
    b.addEventListener('click', () => { search.value = ''; selectTab(i); });
    tabsEl.appendChild(b);
    return b;
  });
  const itemHTML = it => `<div class="mitem">${thumb(it)}<b>${esc(it.nome)}</b><span class="price">${brl(it.preco)}</span></div>`;
  const groupHTML = (cat, items) => items.length ? `<div class="menu-group"><h3>${esc(cat)}</h3><div class="menu-grid">${items.map(itemHTML).join('')}</div></div>` : '';
  let tabIdx = 0;
  function moveInd() {
    const b = tabBtns[tabIdx];
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = `translateX(${b.offsetLeft}px)`;
  }
  function selectTab(i, focus) {
    tabIdx = i;
    tabBtns.forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    tabsEl.classList.toggle('is-galaxia', !!TABS[i].galaxia);
    panel.setAttribute('aria-labelledby', tabBtns[i].id);
    panel.innerHTML = TABS[i].cats.map(c => groupHTML(c, byCat(c))).join('');
    moveInd();
    if (focus) { tabBtns[i].focus(); tabBtns[i].scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  tabsEl.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); selectTab((tabIdx + d + TABS.length) % TABS.length, true); }
  });
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  search.addEventListener('input', () => {
    const q = norm(search.value.trim());
    if (!q) { selectTab(tabIdx); return; }
    const cats = [...new Set(MENU.map(i => i.cat))];
    const html = cats.map(c => groupHTML(c, byCat(c).filter(i => norm(i.nome).includes(q)))).join('');
    panel.innerHTML = html || `<p class="menu-empty">Nada com “${esc(search.value)}”. O cardápio online tem a lista completa e atualizada.</p>`;
  });
  selectTab(0);
  new ResizeObserver(moveInd).observe(tabsEl);

  /* ---------- Reveals e dock ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }), { threshold: .2 });
  $$('.reveal-img, .cups').forEach(el => revealIO.observe(el));

  const dock = $('.dock');
  new IntersectionObserver(([e]) => dock.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(hero);
})();
