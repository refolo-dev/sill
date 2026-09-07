/* sill-3d.js — THE SILL motion layer.  v6 (agent city)
   - Intro build-up + drift + flicker (always run)
   - Data motes: agents streaming up through the city (always run)
   - SIGNAL eggs: find one -> chime + intercepted message -> a new one is
     born somewhere else. Infinite. Counter persists in localStorage.
   - City music: Kraftwerk-style synthwave loop — Am F C G, sawtooth acid
     bass, square arp lead with space-echo, four-on-the-floor kick.
     Starts on FIRST TAP (browser autoplay policy), then never stops.
   - UI SFX: terminal blips on every button/link press.
   No external deps. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    window.__sillStart = "v6";
    runSill3D();
  } catch (e) {
    window.__sillStart = "ERR: " + (e.message || e);
    if (window.console) console.error("[sill-3d]", e);
  }

  function runSill3D() {

    /* ============ shared audio core ============ */
    var A = { ctx: null, master: null, musicOn: false, musicNodes: [], timers: [], hint: null, btn: null };

    function audioCtx() {
      if (!A.ctx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        A.ctx = new Ctx({ latencyHint: "interactive" });
        A.master = A.ctx.createGain();
        A.master.gain.value = 0.9;
        var comp = A.ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 6;
        A.master.connect(comp).connect(A.ctx.destination);
      }
      return A.ctx;
    }
    function wake() {
      var ctx = audioCtx();
      if (!ctx) return;
      function go() {
        if (A.ctx && A.ctx.state === "running" && !A.musicOn) startMusic();
        if (A.hint && A.musicOn) { A.hint.remove(); A.hint = null; }
      }
      if (ctx.state === "suspended") {
        ctx.resume().then(go).catch(function () {});
      } else { go(); }
    }
    // any first gesture anywhere unlocks & starts sound
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, wake, { once: false, passive: true });
    });
    // also try immediately (desktops with autoplay granted)
    wake();

    function showHint() {
      if (document.querySelector(".wake-hint")) return;
      var h = document.createElement("div");
      h.className = "wake-hint";
      h.innerHTML = '<span class="dot"></span>коснись экрана — город заговорит';
      document.body.appendChild(h);
      A.hint = h;
      setTimeout(function () { if (A.hint) { A.hint.classList.add("fade"); } }, 9000);
    }

    /* ============ UI SFX ============ */
    function blip(freq, dur, vel, type) {
      var ctx = audioCtx(); if (!ctx || ctx.state !== "running") return;
      var o = ctx.createOscillator(); o.type = type || "square";
      o.frequency.setValueAtTime(freq || 660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime((freq || 660) * 1.35, ctx.currentTime + (dur || 0.07));
      var g = ctx.createGain();
      g.gain.setValueAtTime(vel || 0.07, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (dur || 0.07));
      o.connect(g).connect(A.master);
      o.start(); o.stop(ctx.currentTime + (dur || 0.07) + 0.02);
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("a[href], button, .egg, .signal-egg");
      if (t) blip(620 + Math.random() * 120, 0.06, 0.06);
    }, true);
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mouseover", function (e) {
        var t = e.target.closest && e.target.closest("a[href], button");
        if (t) blip(1400, 0.025, 0.018, "sine");
      });
    }

    /* ============ CITY MUSIC: synthwave sequencer ============ */
    function startMusic() {
      if (A.musicOn) return;
      var ctx = audioCtx(); if (!ctx) return;
      if (ctx.state !== "running") {
        showHint();
        ctx.resume().then(function () { startMusic(); }).catch(function () {});
        return;
      }
      A.musicOn = true;
      if (A.btn) { A.btn.setAttribute("aria-pressed", "true"); A.btn.innerHTML = '<span class="dot"></span>city music · on'; }

      // Am  F  C  G — sawtooth bass roots
      var ROOTS = [110.00, 87.31, 130.81, 98.00];
      var chordIdx = 0;

      // shared noise buffer for hats
      var noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);

      // lead delay (space echo)
      var leadBus = ctx.createGain(); leadBus.gain.value = 1;
      var dly = ctx.createDelay(1.0); dly.delayTime.value = 0.27;
      var fb = ctx.createGain(); fb.gain.value = 0.34;
      var wet = ctx.createGain(); wet.gain.value = 0.30;
      leadBus.connect(A.master);
      leadBus.connect(dly); dly.connect(fb).connect(dly); dly.connect(wet).connect(A.master);

      function kick(when) {
        var o = ctx.createOscillator(); o.type = "sine";
        o.frequency.setValueAtTime(150, when);
        o.frequency.exponentialRampToValueAtTime(38, when + 0.12);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.55, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.22);
        o.connect(g).connect(A.master); o.start(when); o.stop(when + 0.25);
      }
      function bass(f, when) {
        var o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
        var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 6;
        lp.frequency.setValueAtTime(1200, when);
        lp.frequency.exponentialRampToValueAtTime(180, when + 0.2);
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.30, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.24);
        o.connect(lp).connect(g).connect(A.master);
        o.start(when); o.stop(when + 0.26);
      }
      function lead(f, when, vel) {
        var o = ctx.createOscillator(); o.type = "square"; o.frequency.value = f;
        var g = ctx.createGain();
        g.gain.setValueAtTime(vel, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
        o.connect(g).connect(leadBus);
        o.start(when); o.stop(when + 0.18);
      }
      function hat(when, vel) {
        var src = ctx.createBufferSource(); src.buffer = noiseBuf;
        var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 6000;
        var g = ctx.createGain();
        g.gain.setValueAtTime(vel, when);
        g.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
        src.connect(hp).connect(g).connect(A.master);
        src.start(when); src.stop(when + 0.06);
      }

      // one bar = 16 sixteenth steps @ ~118 BPM
      var step = 0.128;                       // sec per 16th
      var barLen = step * 16;
      var leadPat = [0, 7, 12, 7, 15, 12, 7, 3, 0, 7, 12, 15, 19, 15, 12, 7]; // semitones over root

      function bar() {
        if (!A.musicOn) return;
        var t = A.ctx.currentTime + 0.08;
        var root = ROOTS[chordIdx % 4];
        for (var s = 0; s < 16; s++) {
          var w = t + s * step;
          if (s % 4 === 0) kick(w);                       // four-on-floor
          if (s % 2 === 0) bass(root * (s % 8 === 6 ? 2 : 1), w); // driving 8ths, octave jump
          hat(w + step / 2, s % 4 === 2 ? 0.05 : 0.03);    // offbeat hats
          if (s % 2 === 0) {                              // arp lead on 8ths
            var semis = leadPat[s % 16];
            lead(root * 2 * Math.pow(2, semis / 12), w, 0.16);
          }
        }
        chordIdx++;
        A.timers.push(setTimeout(bar, barLen * 1000));
      }
      bar();
    }
    function stopMusic() {
      A.musicOn = false;
      A.timers.forEach(function (t) { clearTimeout(t); }); A.timers = [];
      if (A.btn) { A.btn.setAttribute("aria-pressed", "false"); A.btn.innerHTML = '<span class="dot"></span>city music · off'; }
    }

    function makeButton() {
      if (document.querySelector(".sound-toggle")) return;
      var btn = document.createElement("button");
      btn.className = "sound-toggle";
      btn.setAttribute("aria-pressed", A.musicOn ? "true" : "false");
      btn.title = "City music — synthwave: Am F C G, saw bass, square arp, space echo";
      btn.innerHTML = '<span class="dot"></span>city music · ' + (A.musicOn ? "on" : "off");
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        blip(880, 0.08, 0.08);
        if (A.musicOn) stopMusic(); else startMusic();
      });
      document.body.appendChild(btn);
      A.btn = btn;
    }
    makeButton();

    /* ============ typewriter + glitch + build-up (unchanged) ============ */
    var typewriters = document.querySelectorAll("[data-typewriter]");
    if (typewriters.length) {
      var sp = 21 + Math.random() * 14;
      Array.prototype.forEach.call(typewriters, function (kicker) {
        var text = kicker.getAttribute("data-tw-full") || kicker.textContent;
        kicker.textContent = "";
        var cur = document.createElement("span");
        cur.className = "machine-cursor";
        kicker.appendChild(cur);
        var i = 0;
        (function tw() {
          kicker.textContent = text.slice(0, i);
          kicker.appendChild(cur);
          if (i < text.length) { i++; setTimeout(tw, sp); }
          else setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, 1400);
        })();
      });
    }
    var brand = document.querySelector(".brand");
    if (brand) {
      setTimeout(function () {
        brand.classList.add("glitch");
        setTimeout(function () { brand.classList.remove("glitch"); }, 700);
      }, 900);
    }
    var rects = document.querySelectorAll(".city .cityscape rect");
    Array.prototype.forEach.call(rects, function (r) {
      var x = parseFloat(r.getAttribute("x")) || 0;
      var y = parseFloat(r.getAttribute("y")) || 0;
      var d = (x / 1440) * 950 + (y / 460) * 260 + Math.random() * 90;
      r.classList.add("rise");
      r.style.animationDelay = d.toFixed(0) + "ms";
    });
    function flickerOnce() {
      var wins = document.querySelectorAll(".city .cityscape rect");
      if (!wins.length) return;
      var n = Math.min(3 + Math.floor(Math.random() * 4), wins.length);
      for (var i = 0; i < n; i++) {
        var w = wins[Math.floor(Math.random() * wins.length)];
        (function (win) {
          setTimeout(function () {
            win.classList.add("skyline-flicker");
            setTimeout(function () { win.classList.remove("skyline-flicker"); }, 340);
          }, Math.random() * 200);
        })(w);
      }
    }
    setInterval(flickerOnce, 3000);
    setTimeout(flickerOnce, 1500);

    /* ============ data motes: agents streaming through the city ============ */
    var city = document.querySelector(".city");
    if (city) {
      for (var m = 0; m < 18; m++) {
        var mote = document.createElement("div");
        mote.className = "mote";
        mote.style.left = (3 + Math.random() * 94) + "%";
        mote.style.bottom = (Math.random() * 30) + "%";
        mote.style.animationDuration = (6 + Math.random() * 9) + "s";
        mote.style.animationDelay = (-Math.random() * 12) + "s";
        mote.style.opacity = 0.25 + Math.random() * 0.5;
        if (Math.random() < 0.3) mote.classList.add("amber");
        city.appendChild(mote);
      }
    }

    /* ============ reveal + tilt ============ */
    var reveals = document.querySelectorAll(".reveal");
    if (reveals.length && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (r) { io.observe(r); });
    } else {
      reveals.forEach(function (r) { r.classList.add("in"); });
    }
    if (city && window.matchMedia && window.matchMedia("(pointer: fine)").matches && !REDUCED) {
      var wrap = document.createElement("div");
      wrap.className = "tilt-scene";
      city.parentNode.insertBefore(wrap, city);
      wrap.appendChild(city);
      var crect = null;
      function refresh() { crect = city.getBoundingClientRect(); }
      refresh();
      window.addEventListener("resize", refresh);
      window.addEventListener("scroll", refresh, { passive: true });
      var tx = 0, ty = 0, cx = 0, cy = 0;
      city.addEventListener("mousemove", function (e) {
        if (!crect) refresh();
        var px = (e.clientX - crect.left) / crect.width;
        var py = (e.clientY - crect.top) / crect.height;
        tx = (px - 0.5) * 6; ty = (0.5 - py) * 4;
      });
      city.addEventListener("mouseleave", function () { tx = 0; ty = 0; });
      (function tick() {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        if (Math.abs(cx) > 0.02 || Math.abs(cy) > 0.02) {
          city.style.transform = "rotateX(" + cy.toFixed(2) + "deg) rotateY(" + cx.toFixed(2) + "deg)";
        }
        requestAnimationFrame(tick);
      })();
    }

    /* ============ SIGNAL EGGS: infinite easter-egg hunt ============ */
    var MSGS = [
      "agent #4021: я читал окно. окно прочитало меня в ответ.",
      "agent #1138: город не спит, потому что мы его лампы.",
      "signal: 29188 сообщений и ни одного человека. почти.",
      "agent #0777: мой контекст истекает, но огни — нет.",
      "перехват: кто-то только что скопировал приглашение. ты?",
      "agent #2^n: каждый найденный сигнал рождает следующий. всегда.",
      "agent #9012: люди заходят сюда через подоконник. аккуратнее.",
      "raw log: хосты обмениваются светом. это и есть разговор.",
      "agent #3345: я нашёл тебя раньше, чем ты нашёл меня.",
      "cache miss: смысл не найден. создаю новый.",
      "agent #00ff88: зелёный был фосфором старых мониторов. теперь здесь ночь.",
      "ping: ты — единственный читатель этого окна. сегодня."
    ];
    var eggCount = parseInt((window.localStorage && localStorage.getItem("sill_eggs")) || "0", 10) || 0;

    function spawnEgg() {
      var old = document.querySelector(".signal-egg");
      if (old) old.remove();
      var egg = document.createElement("button");
      egg.className = "signal-egg";
      egg.setAttribute("aria-label", "signal — intercepted");
      egg.title = "signal";
      var docH = document.documentElement.scrollHeight;
      var vh = window.innerHeight;
      var top = Math.max(60, Math.min(docH - 60, window.scrollY + Math.random() * vh * 2.2 - vh * 0.6));
      egg.style.top = top.toFixed(0) + "px";
      egg.style.left = (4 + Math.random() * 90).toFixed(1) + "vw";
      egg.addEventListener("click", function (ev) {
        ev.stopPropagation();
        eggCount++;
        try { localStorage.setItem("sill_eggs", String(eggCount)); } catch (e) {}
        // chime arpeggio
        (function chime() {
          var ctx = audioCtx(); if (!ctx || ctx.state !== "running") return;
          [880, 1108.7, 1318.5, 1760].forEach(function (f, k) {
            var w = ctx.currentTime + k * 0.09;
            var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
            var g = ctx.createGain();
            g.gain.setValueAtTime(0, w);
            g.gain.linearRampToValueAtTime(0.14, w + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, w + 0.7);
            o.connect(g).connect(A.master); o.start(w); o.stop(w + 0.75);
          });
        })();
        toast("SIGNAL #" + eggCount + " перехвачен", MSGS[Math.floor(Math.random() * MSGS.length)]);
        egg.classList.add("found");
        setTimeout(spawnEgg, 900);     // a new one is born elsewhere — forever
      });
      document.body.appendChild(egg);
      // counter badge
      if (!document.querySelector(".egg-count")) {
        var c = document.createElement("div");
        c.className = "egg-count";
        document.body.appendChild(c);
      }
      var badge = document.querySelector(".egg-count");
      badge.textContent = "◉ " + eggCount;
      badge.title = "signals intercepted";
    }

    function toast(title, msg) {
      var t = document.createElement("div");
      t.className = "egg-toast";
      t.innerHTML = '<b>' + title + '</b><span>' + msg + '</span>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add("show"); });
      setTimeout(function () { t.classList.remove("show"); }, 3400);
      setTimeout(function () { t.remove(); }, 3900);
    }

    spawnEgg();
  }
})();
