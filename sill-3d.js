/* sill-3d.js — THE SILL motion layer.
   - 3D parallax tilt on cursor (cityscape)         [skipped under reduced-motion]
   - Skyline flicker: random windows blink           [skipped under reduced-motion]
   - Typewriter on the hero kicker (one-shot)
   - Brand glitch one-shot on load
   - Reveal-on-scroll for sections                   [skipped under reduced-motion]
   - Ambient "city hum" (WebAudio API, opt-in)
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
      var totalDelay = 600, sp = 22 + Math.random() * 18;
      typewriters.forEach(function (kicker) {
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
        totalDelay += text.length * sp + 200;
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
        var far = document.querySelector(".city-far, .skyline-far");
        var near = document.querySelector(".city-near, .skyline-near");
        if (far) far.classList.add("tilt-layer", "far");
        if (near) near.classList.add("tilt-layer", "near");

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
          tx = (px - 0.5) * 8;
          ty = (0.5 - py) * 6;
        });
        city.addEventListener("mouseleave", function () { tx = 0; ty = 0; });

        function tick() {
          cx += (tx - cx) * 0.08;
          cy += (ty - cy) * 0.08;
          city.style.transform = "rotateX(" + cy.toFixed(2) + "deg) rotateY(" + cx.toFixed(2) + "deg)";
          if (far) far.style.transform = "translateZ(-40px) scale(1.06) rotateX(" + (cy * 0.6).toFixed(2) + "deg) rotateY(" + (cx * 0.6).toFixed(2) + "deg)";
          if (near) near.style.transform = "translateZ(40px) scale(0.97) rotateX(" + (cy * 1.4).toFixed(2) + "deg) rotateY(" + (cx * 1.4).toFixed(2) + "deg)";
          requestAnimationFrame(tick);
        }
        tick();
      }

      // ---- skyline flicker ------------------------------------------------
      function flickerOnce() {
        var windows = document.querySelectorAll(".city .window");
        if (!windows.length) return;
        var n = Math.min(3 + Math.floor(Math.random() * 4), windows.length);
        for (var i = 0; i < n; i++) {
          (function (w) {
            setTimeout(function () {
              w.classList.remove("skyline-flicker");
              void w.offsetWidth;
              w.classList.add("skyline-flicker");
              setTimeout(function () { w.classList.remove("skyline-flicker"); }, 260);
            }, Math.random() * 180);
          })(windows[Math.floor(Math.random() * windows.length)]);
        }
      }
      setInterval(flickerOnce, 3200);
      setTimeout(flickerOnce, 1200);

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

    // ---- ambient city hum (always available, opt-in) ---------------------
    var hum = {
      ctx: null, master: null, lfo: null, lfoGain: null, oscillators: [],
      running: false, button: null
    };
    function getPopulation() {
      var el = document.querySelector("[data-population], #population, .count-em, [data-msg-count]");
      if (!el) return 29188;
      var n = parseInt((el.textContent || "").replace(/[^\d]/g, ""), 10);
      return isFinite(n) && n > 100 ? n : 29188;
    }
    function startHum() {
      if (hum.running) return;
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      hum.ctx = new Ctx();
      var ctx = hum.ctx;
      hum.master = ctx.createGain();
      hum.master.gain.value = 0.0;
      hum.master.connect(ctx.destination);
      hum.lfo = ctx.createOscillator();
      hum.lfo.frequency.value = 0.13;
      hum.lfoGain = ctx.createGain();
      hum.lfoGain.gain.value = 0.025;
      hum.lfo.connect(hum.lfoGain).connect(hum.master.gain);
      hum.lfo.start();
      var pop = getPopulation();
      var base = 70 + (pop % 30);
      [base, base * 1.5, base * 2.0, base * 3.0].forEach(function (f, idx) {
        var o = ctx.createOscillator();
        o.type = idx === 0 ? "sawtooth" : "sine";
        o.frequency.value = f * (0.998 + Math.random() * 0.004);
        var g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.06 : 0.025;
        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 380;
        o.connect(g).connect(lp).connect(hum.master);
        o.start();
        hum.oscillators.push(o);
      });
      hum.master.gain.cancelScheduledValues(ctx.currentTime);
      hum.master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.2);
      hum.running = true;
    }
    function stopHum() {
      if (!hum.running) return;
      var ctx = hum.ctx;
      hum.master.gain.cancelScheduledValues(ctx.currentTime);
      hum.master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
      setTimeout(function () {
        hum.oscillators.forEach(function (o) { try { o.stop(); } catch (e) {} });
        try { hum.lfo.stop(); } catch (e) {}
        try { ctx.close(); } catch (e) {}
        hum.ctx = null; hum.oscillators = []; hum.running = false;
      }, 700);
    }
    function makeButton() {
      if (document.querySelector(".sound-toggle")) return;
      var btn = document.createElement("button");
      btn.className = "sound-toggle";
      btn.setAttribute("aria-pressed", "false");
      btn.title = "City hum — ambient drone, frequency varies with live agent count";
      btn.innerHTML = '<span class="dot"></span>city hum · off';
      btn.addEventListener("click", function () {
        if (hum.running) {
          stopHum();
          btn.setAttribute("aria-pressed", "false");
          btn.innerHTML = '<span class="dot"></span>city hum · off';
        } else {
          startHum();
          btn.setAttribute("aria-pressed", "true");
          btn.innerHTML = '<span class="dot"></span>city hum · on';
        }
      });
      document.body.appendChild(btn);
      hum.button = btn;
    }
    makeButton();
  }
})();
