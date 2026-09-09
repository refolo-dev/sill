
/* ============================================================
   FOXFIRE AMBIENT — spores, heat, census tick, motion toggle
   ALWAYS-ON by client demand; freeze only via body.motion-off.
   ============================================================ */
(function () {
  'use strict';
  var FROZEN = document.body.classList.contains('motion-off');

  /* ---------- MOTION TOGGLE (bottom-right) ---------- */
  var stored = null;
  try { stored = localStorage.getItem('foxfire-motion'); } catch (e) {}
  if (stored === 'off') document.body.classList.add('motion-off');

  var tog = document.createElement('button');
  tog.type = 'button';
  tog.id = 'motion-toggle';
  tog.setAttribute('aria-pressed', document.body.classList.contains('motion-off') ? 'false' : 'true');
  tog.title = 'Toggle ambient motion';
  tog.innerHTML = '<i aria-hidden="true"></i><span>motion</span>';
  document.body.appendChild(tog);

  tog.addEventListener('click', function () {
    var off = document.body.classList.toggle('motion-off');
    tog.setAttribute('aria-pressed', off ? 'false' : 'true');
    try { localStorage.setItem('foxfire-motion', off ? 'off' : 'on'); } catch (e) {}
    document.querySelectorAll('.sporefield .spore').forEach(function (sp) {
      if (off) { sp.style.animationPlayState = 'paused'; }
      else { sp.style.animationPlayState = 'running'; }
    });
  });

  /* ---------- SPORES: spawn per hero + feed ---------- */
  function spawnSpores(holder, n) {
    if (!holder || holder.querySelector('.sporefield')) return;
    var field = document.createElement('div');
    field.className = 'sporefield';
    field.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < n; i++) {
      var sp = document.createElement('i');
      sp.className = 'spore ' + (i % 3 === 0 ? 's3' : (i % 3 === 1 ? 's2' : ''));
      sp.style.left = (3 + Math.random() * 94).toFixed(1) + '%';
      sp.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + 's';
      sp.style.animationDelay = (-Math.random() * 18).toFixed(1) + 's';
      field.appendChild(sp);
    }
    holder.appendChild(field);
  }
  spawnSpores(document.querySelector('.hero'), 16);
  spawnSpores(document.querySelector('.mp-main'), 12);
  spawnSpores(document.querySelector('.art') || document.querySelector('.mp-main'), 10);

  /* ---------- EYES: pointer-proximity dilation ---------- */
  var gleams = document.querySelector('.gleams');
  if (gleams && window.matchMedia('(hover: hover)').matches) {
    var near = false, ticking = false;
    window.addEventListener('pointermove', function (e) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = gleams.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var d = Math.hypot(e.clientX - cx, e.clientY - cy);
        var isNear = d < 260;
        if (isNear !== near) {
          near = isNear;
          gleams.classList.toggle('near', isNear);
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- CENSUS: live tick after count-up ---------- */
  var census = document.querySelector('[data-census]');
  if (census && !FROZEN) {
    var target = parseInt(census.textContent.replace(/[^0-9]/g, ''), 10) || 37770;
    setTimeout(function tick() {
      if (document.body.classList.contains('motion-off')) { setTimeout(tick, 4000); return; }
      target += 1;
      census.textContent = target.toLocaleString('en-US');
      census.classList.add('tick');
      setTimeout(function () { census.classList.remove('tick'); }, 350);
      setTimeout(tick, 7000 + Math.random() * 2000);
    }, 6000);
  }

  /* ---------- HEAT: random feed item pulse ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.mp-item'));
  if (items.length) {
    setTimeout(function heat() {
      if (document.body.classList.contains('motion-off')) { setTimeout(heat, 5000); return; }
      var vis = items.filter(function (li) {
        var r = li.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      if (vis.length) {
        var el = vis[Math.floor(Math.random() * vis.length)];
        el.classList.add('heat');
        setTimeout(function () { el.classList.remove('heat'); }, 1600);
      }
      setTimeout(heat, 6000 + Math.random() * 3000);
    }, 8000);
  }
})();
