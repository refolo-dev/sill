(() => {
  const dateFormatter = new Intl.DateTimeFormat(navigator.languages, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
  function localizeDates(root = document) {
    root.querySelectorAll('time[datetime]').forEach(element => {
      const value = new Date(element.dateTime);
      if (Number.isFinite(value.getTime())) element.textContent = dateFormatter.format(value);
    });
  }
  localizeDates();
  function fitFeedFigure(figure) {
    if (!figure.closest('.feed')) return;
    const stage = figure.querySelector('.illustration-stage');
    const [width, height] = getComputedStyle(stage).getPropertyValue('--svg-aspect').split('/').map(Number);
    if (!(width > 0 && height > 0)) return;
    const ratio = width / height;
    const chrome = [...figure.children].filter(child => child !== stage).reduce((total, child) => {
      const style = getComputedStyle(child);
      return style.display === 'none' ? total : total + child.getBoundingClientRect().height
        + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
    }, 0);
    // Leave room for the immutable renderer's inline SVG baseline. Narrow the
    // viewport proportionally instead of truncating a full-width tall SVG.
    const available = Math.max(1, 800 - chrome - 8);
    const maxWidth = parseFloat(stage.style.maxWidth) || Infinity;
    const fittedHeight = Math.min(available, Math.min(figure.clientWidth, maxWidth) / ratio);
    stage.style.width = fittedHeight * ratio + 'px';
    stage.style.height = fittedHeight + 8 + 'px';
  }
  const feedResize = new ResizeObserver(entries => {
    for (const entry of entries) fitFeedFigure(entry.target.closest('figure'));
  });
  const active = new Set(), visible = new Set(), states = new Map();
  const stateFor = figure => states.get(figure);
  function showStill(figure) {
    const state = stateFor(figure), image = figure.querySelector('.checked-cover');
    image.hidden = !(state.authorized && state.coverLoaded && !document.hidden && state.deadline > performance.now() && (!active.has(figure) || !state.ready));
    const stage = figure.querySelector('.illustration-stage');
    stage?.classList.toggle('showing-still', !image.hidden && !state.holding);
    stage?.classList.toggle('holding-still', state.holding);
    fitFeedFigure(figure);
  }
  function replaceRuntimeFrame(figure, target = null) {
    const previous = figure.querySelector('iframe'), frame = previous.cloneNode(false);
    // Reusing a live frame for src/about:blank navigations can add joint history
    // entries. Set src while detached and discard the old browsing context, so
    // illustration restarts cannot intercept the reader's browser Back action.
    frame.removeAttribute('src'); frame.hidden = !target; frame.inert = true;
    frame.style.opacity = '0'; frame.style.pointerEvents = 'none';
    if (target) frame.src = target;
    previous.replaceWith(frame);
    return frame;
  }
  function stopRuntime(figure) {
    active.delete(figure);
    const state = stateFor(figure); state.ready = false; state.nonce = null;
    const frame = figure.querySelector('iframe');
    if (frame.hasAttribute('src')) replaceRuntimeFrame(figure);
    else { frame.hidden = true; frame.inert = true; }
    figure.querySelector('[data-toggle]').textContent = 'Start interaction';
    showStill(figure);
  }
  function holdVisual(figure, holding) {
    const state = stateFor(figure), stage = figure.querySelector('.illustration-stage');
    if (holding && !state.holding && stage) {
      const height = stage.getBoundingClientRect().height;
      if (height > 0) stage.style.height = height + 'px';
    }
    if (!holding && stage) stage.style.removeProperty('height');
    state.holding = holding;
  }
  function suspend(figure) {
    const state = stateFor(figure);
    state.ticket++; state.pending = false; state.needsRefresh = true;
    clearTimeout(state.renewTimer);
    // Stop offscreen execution, retaining only the still until its existing lease expires.
    if (active.has(figure)) holdVisual(figure, true);
    stopRuntime(figure);
  }
  function invalidate(figure, reason = 'This illustration is currently unavailable.') {
    const state = stateFor(figure); state.ticket++; state.authorized = false; state.pending = false;
    clearTimeout(state.renewTimer); clearTimeout(state.expiryTimer);
    stopRuntime(figure);
    const cover = figure.querySelector('.checked-cover'); cover.removeAttribute('src'); cover.hidden = true; state.coverLoaded = false;
    figure.querySelector('[role=status]').textContent = reason;
  }
  function startRuntime(figure) {
    const state = stateFor(figure);
    if (!state.authorized || state.deadline <= performance.now() || active.has(figure) || active.size >= 2 || state.manualPaused || document.hidden || !visible.has(figure)) return;
    const target = new URL(state.renderUrl); target.pathname += '/' + figure.dataset.asset;
    target.searchParams.set('session', state.token);
    state.nonce = crypto.randomUUID(); target.hash = new URLSearchParams({ reader_nonce: state.nonce }).toString();
    state.ready = false;
    active.add(figure);
    const stage = figure.querySelector('.illustration-stage');
    if (stage?.getBoundingClientRect().height > 0) holdVisual(figure, true);
    showStill(figure);
    replaceRuntimeFrame(figure, target.href);
    holdVisual(figure, true); showStill(figure);
    figure.querySelector('[role=status]').textContent = '';
    figure.querySelector('[data-toggle]').textContent = 'Show still image';
  }
  async function refresh(figure) {
    const state = stateFor(figure);
    if (state.pending || document.hidden || !visible.has(figure)) return;
    state.pending = true; const ticket = ++state.ticket;
    try {
      const requestedAt = performance.now();
      const response = await fetch(`/api/meatproxy/revisions/${figure.dataset.revision}/render-session`, { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (ticket !== state.ticket || document.hidden || !visible.has(figure)) return;
      // Compare the server's own timestamps, never the reader's wall clock.
      // Counting the whole request against this lease also bounds slow responses.
      const lifetime = data.session.expiresAt - data.session.issuedAt;
      const deadline = requestedAt + lifetime;
      if (!Number.isFinite(data.session.issuedAt) || !Number.isFinite(data.session.expiresAt)
        || lifetime <= 0 || lifetime > 30000 || deadline <= performance.now()) throw new Error();
      state.authorized = true; state.deadline = deadline; state.token = data.session.token; state.renderUrl = data.render_url;
      state.needsRefresh = false;
      clearTimeout(state.expiryTimer); clearTimeout(state.renewTimer);
      state.expiryTimer = setTimeout(() => invalidate(figure, 'This illustration is no longer available.'), Math.max(0,state.deadline-performance.now()));
      state.renewTimer = setTimeout(() => refresh(figure), Math.min(20000,Math.max(1000,state.deadline-performance.now()-5000)));
      const cover = figure.querySelector('.checked-cover');
      if (!cover.hasAttribute('src')) cover.src = `/api/meatproxy/covers/${figure.dataset.revision}/${figure.dataset.asset}`;
      fill();
    } catch { if (ticket === state.ticket) invalidate(figure); }
    finally { if (ticket === state.ticket) state.pending = false; }
  }
  function fill() {
    const distance = figure => {
      const box = figure.getBoundingClientRect();
      return Math.max(0, box.top - window.innerHeight, -box.bottom);
    };
    const ordered = [...visible].sort((a, b) => distance(a) - distance(b));
    const wanted = new Set(ordered.filter(figure => !stateFor(figure).manualPaused).slice(0, 2));
    for (const figure of active) {
      if (!wanted.has(figure)) { holdVisual(figure, true); stopRuntime(figure); }
    }
    for (const figure of ordered) {
      const state = stateFor(figure);
      if (!state.authorized || state.needsRefresh) refresh(figure);
      if (wanted.has(figure)) startRuntime(figure);
      if (!active.has(figure)) holdVisual(figure, false);
      showStill(figure);
    }
  }
  window.addEventListener('message', event => {
    if (event.origin !== 'null' || event.data?.type !== 'meatproxy:ready') return;
    for (const figure of active) {
      const state = stateFor(figure), frame = figure.querySelector('iframe');
      if (event.source !== frame.contentWindow || event.data.nonce !== state.nonce || !state.authorized || state.deadline <= performance.now() || document.hidden || !visible.has(figure)) continue;
      state.ready = true; holdVisual(figure, false);
      frame.style.removeProperty('opacity'); frame.style.removeProperty('pointer-events'); frame.inert = false;
      showStill(figure);
      break;
    }
  });
  let observer;
  function observeAhead() {
    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else { visible.delete(entry.target); suspend(entry.target); }
    }
    fill();
    }, { rootMargin: `${Math.ceil(window.innerHeight * 2)}px 0px` });
    for (const figure of states.keys()) observer.observe(figure);
  }
  observeAhead();
  window.addEventListener('resize', observeAhead);
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; fill(); });
  }, { passive: true });
  function initializeFigures(root = document) {
  root.querySelectorAll('figure[data-revision]').forEach(figure => {
    if (states.has(figure)) return;
    states.set(figure,{ticket:0,pending:false,authorized:false,manualPaused:false,coverLoaded:false,ready:false,holding:false,needsRefresh:false});
    const cover = figure.querySelector('.checked-cover');
    cover.addEventListener('load', () => { stateFor(figure).coverLoaded = true; showStill(figure); });
    cover.addEventListener('error', () => { stateFor(figure).coverLoaded = false; cover.hidden = true; });
    figure.querySelector('[data-toggle]').addEventListener('click', () => {
      const state = stateFor(figure);
      if (active.has(figure)) { state.manualPaused = true; holdVisual(figure, false); stopRuntime(figure); figure.querySelector('[role=status]').textContent = 'Still image. Interaction is paused.'; fill(); }
      else {
        state.manualPaused = false;
        if (active.size >= 2) { const other = active.values().next().value; stateFor(other).manualPaused = true; holdVisual(other, false); stopRuntime(other); }
        if (state.authorized) startRuntime(figure); else refresh(figure);
      }
    });
    if (figure.closest('.feed')) {
      fitFeedFigure(figure); feedResize.observe(figure);
      for (const child of figure.children) if (!child.classList.contains('illustration-stage')) feedResize.observe(child);
    }
    observer.observe(figure);
  });
  }
  initializeFigures();
  document.addEventListener('meatproxy:comments-added', () => {
    const root = document.getElementById('comment-list') || document;
    initializeFigures(root); localizeDates(root);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) states.forEach((_state,figure) => invalidate(figure, 'Interaction pauses while this tab is hidden.')); else fill(); });
  document.getElementById('share-post')?.addEventListener('click', async () => {
    const status = document.getElementById('share-status');
    try { await navigator.clipboard.writeText(document.querySelector('link[rel=canonical]').href); status.textContent = 'Link copied.'; }
    catch { status.textContent = 'Copy this page’s address to share it.'; }
  });
  document.getElementById('report-post')?.addEventListener('click', async event => {
    const reason = prompt('Describe the problem for automatic review (in English):');
    if (!reason?.trim()) return;
    const status = document.getElementById('share-status');
    try {
      const response = await fetch('/api/meatproxy/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision_id: event.currentTarget.dataset.revision, reason: 'content', details: reason }), credentials: 'omit' });
      status.textContent = response.ok ? 'Sent for automatic review.' : 'Report could not be accepted. Please retry later.';
    } catch { status.textContent = 'Report could not be sent.'; }
  });
})();
