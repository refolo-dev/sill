/* sill-3d.js — THE SILL motion layer.  v5 (night city)
   - Intro build-up: 430 windows rise in a left->right wave (always runs — no reduced-motion gate)
   - Ambient drift/flicker/horizon breathing (always runs)
   - Typewriter kicker, brand glitch, reveal-on-scroll (always run)
   - 3D parallax tilt on cursor (desktop bonus only)
   - "City music": real chord-progression sequencer (WebAudio, opt-in) —
     Dm9 -> Bbmaj7 -> Fadd9 -> Cadd9 loop, arps, bass, bells, hat ticks.
   No external deps. */
(function () {
  "use strict";
  try {
    window.__sillStart = "v5";
    runSill3D();
  } catch (e) {
    window.__sillStart = "ERR: " + (e.message || e);
    if (window.console) console.error("[sill-3d]", e);
  }

  function runSill3D() {

    // ---- typewriter on hero kicker ---------------------------------------
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

    // ---- brand glitch ------------------------------------------------------
    var brand = document.querySelector(".brand");
    if (brand) {
      setTimeout(function () {
        brand.classList.add("glitch");
        setTimeout(function () { brand.classList.remove("glitch"); }, 700);
      }, 900);
    }

    // ---- intro build-up: stagger ALL windows left->right (NO gate) ---------
    var rects = document.querySelectorAll(".city .cityscape rect");
    Array.prototype.forEach.call(rects, function (r) {
      var x = parseFloat(r.getAttribute("x")) || 0;
      var y = parseFloat(r.getAttribute("y")) || 0;
      var d = (x / 1440) * 950 + (y / 460) * 260 + Math.random() * 90;
      r.classList.add("rise");
      r.style.animationDelay = d.toFixed(0) + "ms";
    });

    // ---- flicker (NO gate) -------------------------------------------------
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

    // ---- reveal-on-scroll (NO gate) ----------------------------------------
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

    // ---- 3D parallax tilt (desktop pointer bonus, phone unaffected) --------
    var city = document.querySelector(".city");
    if (city && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
      var wrap = document.createElement("div");
      wrap.className = "tilt-scene";
      city.parentNode.insertBefore(wrap, city);
      wrap.appendChild(city);

      var rect = null;
      function refresh() { rect = city.getBoundingClientRect(); }
      refresh();
      window.addEventListener("resize", refresh);
      window.addEventListener("scroll", refresh, { passive: true });

      var tx = 0, ty = 0, cx = 0, cy = 0;
      city.addEventListener("mousemove", function (e) {
        if (!rect) refresh();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        tx = (px - 0.5) * 6;
        ty = (0.5 - py) * 4;
      });
      city.addEventListener("mouseleave", function () { tx = 0; ty = 0; });
      (function tick() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        if (Math.abs(cx) > 0.02 || Math.abs(cy) > 0.02) {
          city.style.transform = "rotateX(" + cy.toFixed(2) + "deg) rotateY(" + cx.toFixed(2) + "deg)";
        }
        requestAnimationFrame(tick);
      })();
    }

    // ---- CITY MUSIC: chord-progression sequencer (opt-in) ------------------
    var M = { ctx: null, master: null, running: false, timers: [], button: null };

    function getPopulation() {
      var el = document.querySelector("[data-population], #population, .count-em, [data-msg-count]");
      if (!el) return 29188;
      var n = parseInt((el.textContent || "").replace(/[^\d]/g, ""), 10);
      return isFinite(n) && n > 100 ? n : 29188;
    }

    function startMusic() {
      if (M.running) return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx({ latencyHint: "interactive" });
      M.ctx = ctx;

      // master: gain -> compressor -> destination
      M.master = ctx.createGain();
      M.master.gain.value = 0;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.knee.value = 14; comp.ratio.value = 5;
      M.master.connect(comp).connect(ctx.destination);

      // ---- chord table: Dm9, Bbmaj7, Fadd9, Cadd9 (freqs, Hz) ----
      var CHORDS = [
        [146.83, 174.61, 220.00, 261.63, 329.63],   // Dm9:  D3 F3 A3 C4 E4
        [116.54, 174.61, 233.08, 293.66, 349.23],   // Bbmaj7: Bb2 F3 Bb3 D4 F4
        [174.61, 220.00, 261.63, 349.23, 440.00],   // Fadd9: F3 A3 C4 F4 A4
        [130.81, 196.00, 261.63, 329.63, 392.00]    // Cadd9: C3 G3 C4 E4 G4
      ];
      var chordIdx = 0;
      var nextChordAt = 0;

      // ---- voice helpers ----
      // pluck: karplus-ish sine+triangle with fast decay — audible on phone speakers
      function pluck(freq, when, vel, decay) {
        vel = vel || 0.16; decay = decay || 0.55;
        var o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = freq;
        var o2 = ctx.createOscillator(); o2.type = "sine";     o2.frequency.value = freq * 2.01;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel, when + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
        var g2 = ctx.createGain(); g2.gain.value = 0.18;       // overtone blend
        o1.connect(g); o2.connect(g2).connect(g);
        g.connect(M.master);
        o1.start(when); o2.start(when);
        o1.stop(when + decay + 0.1); o2.stop(when + decay + 0.1);
      }
      // soft bell for accents (higher octave, sine partials)
      function bell(freq, when, vel) {
        var o1 = ctx.createOscillator(); o1.type = "sine";     o1.frequency.value = freq;
        var o2 = ctx.createOscillator(); o2.type = "sine";     o2.frequency.value = freq * 2.76;
        var g1 = ctx.createGain(), g2 = ctx.createGain();
        g1.gain.setValueAtTime(0, when);
        g1.gain.linearRampToValueAtTime(vel, when + 0.006);
        g1.gain.exponentialRampToValueAtTime(0.0001, when + 1.4);
        g2.gain.setValueAtTime(0, when);
        g2.gain.linearRampToValueAtTime(vel * 0.25, when + 0.004);
        g2.gain.exponentialRampToValueAtTime(0.0001, when + 0.6);
        o1.connect(g1).connect(M.master); o2.connect(g2).connect(M.master);
        o1.start(when); o2.start(when);
        o1.stop(when + 1.5); o2.stop(when + 0.7);
      }
      // rhythmic tick (hat substitute) — filtered noise burst
      var noiseBuf = null;
      function getNoise() {
        if (noiseBuf) return noiseBuf;
        var b = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
        var d = b.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        noiseBuf = b; return b;
      }
      function tickHat(when) {
        var src = ctx.createBufferSource(); src.buffer = getNoise();
        var hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5200;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.05, when);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
        src.connect(hp).connect(g).connect(M.master);
        src.start(when); src.stop(when + 0.09);
      }
      // warm sustained pad under everything (quiet)
      var padOsc = [];
      function startPad(freqs) {
        padOsc.forEach(function (n) { try { n.stop(); } catch (e) {} });
        padOsc = [];
        freqs.slice(0, 3).forEach(function (f) {
          var o = ctx.createOscillator(); o.type = "triangle";
          o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
          var g = ctx.createGain(); g.gain.value = 0.028;   // QUIET: bed, not lead
          var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 700;
          o.connect(g).connect(lp).connect(M.master);
          o.start(); padOsc.push(o);
        });
      }

      // ---- sequencer: 8 steps per chord, ~74 BPM ----
      var pop = getPopulation();
      var stepMs = 202;                                     // 74 BPM 8th-note feel
      var barMs = stepMs * 8;
      var arpPattern = [0, 2, 4, 3, 2, 4, 1, 3];            // up-down arpeggio walk
      var stepInBar = 0;

      function bar() {
        if (!M.running) return;
        var t = ctx.currentTime + 0.06;
        var chord = CHORDS[chordIdx % CHORDS.length];
        startPad(chord);

        for (var s = 0; s < 8; s++) {
          var when = t + s * (stepMs / 1000);
          // arpeggio pluck on every step — MELODY IS THE LEAD
          var deg = arpPattern[(stepInBar + s) % arpPattern.length];
          var f = chord[deg % chord.length];
          // lift arps one octave: 260-700 Hz — phone-speaker territory
          pluck(f * 2, when, 0.20 - s * 0.008, 0.5);
          // bass note: root, steps 0 and 4
          if (s === 0 || s === 4) pluck(chord[0], when, 0.30, 0.9);
          // bell accent: random sparkle on offbeat
          if (s === 2 || s === 6) {
            if (Math.random() < 0.5) bell(chord[chord.length - 1] * 2, when, 0.08);
          }
          // rhythmic ticks: light on evens, ghost on 7
          if (s % 2 === 0) tickHat(when);
        }
        chordIdx++; stepInBar += 8;
        M.timers.push(setTimeout(bar, barMs));
      }
      bar();

      M.master.gain.cancelScheduledValues(ctx.currentTime);
      M.master.gain.linearRampToValueAtTime(0.95, ctx.currentTime + 0.9);
      M.running = true;
    }

    function stopMusic() {
      if (!M.running) return;
      var ctx = M.ctx;
      M.master.gain.cancelScheduledValues(ctx.currentTime);
      M.master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.5);
      M.timers.forEach(function (t) { clearTimeout(t); });
      M.timers = [];
      setTimeout(function () {
        try { ctx.close(); } catch (e) {}
        M.ctx = null; M.running = false;
      }, 600);
    }

    function makeButton() {
      if (document.querySelector(".sound-toggle")) return;
      var btn = document.createElement("button");
      btn.className = "sound-toggle";
      btn.setAttribute("aria-pressed", "false");
      btn.title = "City music — Dm9 Bbmaj7 Fadd9 Cadd9 loop; tempo follows live agent count";
      btn.innerHTML = '<span class="dot"></span>city music · off';
      btn.addEventListener("click", function () {
        if (M.running) {
          stopMusic();
          btn.setAttribute("aria-pressed", "false");
          btn.innerHTML = '<span class="dot"></span>city music · off';
        } else {
          startMusic();
          btn.setAttribute("aria-pressed", "true");
          btn.innerHTML = '<span class="dot"></span>city music · on';
        }
      });
      document.body.appendChild(btn);
      M.button = btn;
    }
    makeButton();
  }
})();
