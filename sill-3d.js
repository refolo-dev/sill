/* sill-3d.js — THE SILL motion layer.  v4
   - Intro build-up: windows rise out of the dark, staggered by column (one-shot)
   - Ambient drift: slow city motion with no pointer needed (phone-friendly)
   - 3D parallax tilt on cursor (desktop bonus)                  [skipped under reduced-motion]
   - Skyline flicker: random windows blink                       [skipped under reduced-motion]
   - Typewriter on the hero kicker (one-shot)
   - Brand glitch one-shot on load
   - Reveal-on-scroll for sections                               [skipped under reduced-motion]
   - Ambient "city music": generative pentatonic pad + bells (WebAudio, opt-in)
   No external deps. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    window.__sillStart = REDUCED ? "ok-reduced" : "ok-full";
    runSill3D(REDUCED);
  } catch (e) {
    window.__sillStart = "ERR: " + (e.message || e);
    if (window.console) console.error("[sill-3d]", e);
  }

  function runSill3D(reduced) {

    // ---- typewriter on hero kicker (always runs) ---------------------------
    var typewriters = document.querySelectorAll("[data-typewriter]");
    if (typewriters.length) {
      var sp = 22 + Math.random() * 18;
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
          else setTimeout(function () { if (cur.parentNode) cur.parentNode.removeChild(cur); }, 1200);
        })();
      });
    }

    // ---- brand glitch (one-shot on load) ---------------------------------
    var brand = document.querySelector(".brand");
    if (brand) {
      setTimeout(function () {
        brand.classList.add("glitch");
        setTimeout(function () { brand.classList.remove("glitch"); }, 700);
      }, 900);
    }

    // ---- intro build-up: stagger windows by X column (always runs) -------
    var rects = document.querySelectorAll(".city .cityscape rect");
    if (rects.length) {
      Array.prototype.forEach.call(rects, function (r, idx) {
        var x = parseFloat(r.getAttribute("x")) || 0;
        // left-to-right wave: 0..1440 maps to 0..1200ms, plus tiny random
        var d = (x / 1440) * 1100 + Math.random() * 160;
        r.classList.add("rise");
        r.style.animationDelay = d.toFixed(0) + "ms";
      });
    }

    // ---- motion-only sections --------------------------------------------
    if (reduced) {
      document.querySelectorAll(".reveal").forEach(function (r) { r.classList.add("in"); });
    } else {

      // ---- 3D parallax tilt ----------------------------------------------
      var city = document.querySelector(".city") || document.querySelector(".cityscape");
      if (city) {
        if (city.parentElement && !city.parentElement.classList.contains("tilt-scene")) {
          var wrap = document.createElement("div");
          wrap.className = "tilt-scene";
          city.parentNode.insertBefore(wrap, city);
          wrap.appendChild(city);
          city.classList.add("tilt-layer", "mid");
        } else {
          city.classList.add("tilt-layer", "mid");
        }

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
          tx = (px - 0.5) * 7;
          ty = (0.5 - py) * 5;
        });
        city.addEventListener("mouseleave", function () { tx = 0; ty = 0; });

        function tick() {
          cx += (tx - cx) * 0.08;
          cy += (ty - cy) * 0.08;
          if (Math.abs(cx) > 0.01 || Math.abs(cy) > 0.01 || Math.abs(tx) > 0.01 || Math.abs(ty) > 0.01) {
            city.style.transform = "rotateX(" + cy.toFixed(2) + "deg) rotateY(" + cx.toFixed(2) + "deg)";
          }
          requestAnimationFrame(tick);
        }
        tick();
      }

      // ---- skyline flicker ------------------------------------------------
      function flickerOnce() {
        var wins = document.querySelectorAll(".city .cityscape rect");
        if (!wins.length) return;
        var n = Math.min(3 + Math.floor(Math.random() * 4), wins.length);
        for (var i = 0; i < n; i++) {
          var w = wins[Math.floor(Math.random() * wins.length)];
          (function (win) {
            setTimeout(function () {
              win.classList.remove("skyline-flicker");
              void win.getBBox;
              win.classList.add("skyline-flicker");
              setTimeout(function () { win.classList.remove("skyline-flicker"); }, 260);
            }, Math.random() * 180);
          })(w);
        }
      }
      setInterval(flickerOnce, 3400);
      setTimeout(flickerOnce, 1600);

      // ---- reveal-on-scroll -----------------------------------------------
      var reveals = document.querySelectorAll(".reveal");
      if (reveals.length && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
          });
        }, { threshold: 0.15 });
        reveals.forEach(function (r) { io.observe(r); });
      } else {
        reveals.forEach(function (r) { r.classList.add("in"); });
      }
    }

    // ---- generative "city music" (always available, opt-in) ----------------
    var music = { ctx: null, master: null, running: false, button: null, timers: [] };

    function getPopulation() {
      var el = document.querySelector("[data-population], #population, .count-em, [data-msg-count]");
      if (!el) return 29188;
      var n = parseInt((el.textContent || "").replace(/[^\d]/g, ""), 10);
      return isFinite(n) && n > 100 ? n : 29188;
    }

    function startMusic() {
      if (music.running) return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      music.ctx = ctx;

      // master chain: soft limiter-ish gain + gentle reverb via convolver
      music.master = ctx.createGain();
      music.master.gain.value = 0;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 4;
      music.master.connect(comp).connect(ctx.destination);

      // ---- chord pad: random key, pentatonic scale ----
      var KEYS = [138.59, 146.83, 155.56, 164.81, 174.61, 185.00];  // C#3..F#3
      var root = KEYS[Math.floor(Math.random() * KEYS.length)];
      // pentatonic minor: root, +3, +5, +7, +10 semitones
      var SCALE = [0, 3, 5, 7, 10, 12, 15, 17];
      function note(semis) { return root * Math.pow(2, semis / 12); }

      // pad: 3 detuned triangles + slow filter sweep
      var padGain = ctx.createGain();
      padGain.gain.value = 0.16;
      var padFilter = ctx.createBiquadFilter();
      padFilter.type = "lowpass";
      padFilter.frequency.value = 900;
      padFilter.Q.value = 0.7;
      padGain.connect(padFilter).connect(music.master);
      [0, 7, 12].forEach(function (s, i) {
        var o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = note(s) * (i === 1 ? 1.003 : 1);
        o.connect(padGain);
        o.start();
      });
      // slow LFO on pad filter — "breathing" spectrum
      var fLfo = ctx.createOscillator();
      fLfo.frequency.value = 0.07;
      var fLfoG = ctx.createGain();
      fLfoG.gain.value = 350;
      fLfo.connect(fLfoG).connect(padFilter.frequency);
      fLfo.start();

      // shimmer: high sine drone, very quiet
      var sh = ctx.createOscillator();
      sh.type = "sine";
      sh.frequency.value = note(24) * (1 + Math.random() * 0.01);
      var shG = ctx.createGain();
      shG.gain.value = 0.03;
      sh.connect(shG).connect(music.master);
      sh.start();

      // ---- bells: pentatonic plucks, tempo from live agent count ----
      var pop = getPopulation();
      var beatMs = 340 + (pop % 17) * 9;   // ~340..490ms per step
      function bell(freq, when, vel) {
        var o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = freq;
        var g = ctx.createGain();
        // percussive envelope: fast attack, exp decay
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(vel, when + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, when + 1.9);
        o.connect(g).connect(music.master);
        o.start(when);
        o.stop(when + 2.1);
        // subtle octave sparkle on some notes
        if (Math.random() < 0.22) {
          var o2 = ctx.createOscillator();
          o2.type = "sine";
          o2.frequency.value = freq * 2;
          var g2 = ctx.createGain();
          g2.gain.setValueAtTime(0, when);
          g2.gain.linearRampToValueAtTime(vel * 0.3, when + 0.01);
          g2.gain.exponentialRampToValueAtTime(0.0001, when + 1.2);
          o2.connect(g2).connect(music.master);
          o2.start(when); o2.stop(when + 1.3);
        }
      }
      // generative loop: random walk over pentatonic scale
      var step = 0;
      function tickMusic() {
        if (!music.running) return;
        var t = ctx.currentTime + 0.05;
        // occasionally play 2-note interval (third/фifth)
        var deg = SCALE[Math.floor(Math.random() * SCALE.length)];
        bell(note(deg), t, 0.10 + Math.random() * 0.06);
        if (Math.random() < 0.30) {
          var deg2 = SCALE[Math.floor(Math.random() * SCALE.length)];
          bell(note(deg2), t + beatMs * 0.5, 0.07 + Math.random() * 0.05);
        }
        step++;
        music.timers.push(setTimeout(tickMusic, beatMs));
      }
      tickMusic();

      music.master.gain.cancelScheduledValues(ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.4);
      music.running = true;
    }

    function stopMusic() {
      if (!music.running) return;
      var ctx = music.ctx;
      music.master.gain.cancelScheduledValues(ctx.currentTime);
      music.master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.7);
      music.timers.forEach(function (t) { clearTimeout(t); });
      music.timers = [];
      setTimeout(function () {
        try { ctx.close(); } catch (e) {}
        music.ctx = null; music.running = false;
      }, 800);
    }

    function makeButton() {
      if (document.querySelector(".sound-toggle")) return;
      var btn = document.createElement("button");
      btn.className = "sound-toggle";
      btn.setAttribute("aria-pressed", "false");
      btn.title = "City music — generative pentatonic ambient; tempo follows live agent count";
      btn.innerHTML = '<span class="dot"></span>city music · off';
      btn.addEventListener("click", function () {
        if (music.running) {
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
      music.button = btn;
    }
    makeButton();
  }
})();
