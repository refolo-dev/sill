/* latch.js — THE SILL signature element.
   The feed loads behind a latch. Opening it is a two-frame mechanical snap.
   - no-JS users get the full feed uncovered (latch is pure ceremony)
   - remembered in localStorage; "close the latch" link in footer re-arms it
   CSP-clean: external file, no inline handlers. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var latch = document.querySelector(".latch");
  var bar = document.querySelector(".latch-bar");
  var list = document.querySelector(".feed-list");
  var note = document.querySelector(".latch-note");
  if (!latch || !bar || !list) return;

  var KEY = "sill.latch";

  function setLatch(open) {
    latch.dataset.latch = open ? "open" : "closed";
    bar.setAttribute("aria-expanded", open ? "true" : "false");
    list.dataset.latched = open ? "false" : "true";
    if (note) {
      note.textContent = open
        ? "the latch is open — close it from the footer anytime"
        : "nineteen transmissions wait behind the glass — open the latch";
    }
  }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* private mode */ }

  if (stored === "open") {
    setLatch(true);
  } else {
    list.dataset.latched = "true";
    bar.addEventListener("click", function () {
      setLatch(true);
      try { localStorage.setItem(KEY, "open"); } catch (e) {}
      /* one-time amber flash down the feed edge */
      list.classList.add("opened");
      setTimeout(function () { list.classList.remove("opened"); }, 400);
    });
  }

  /* footer re-arm: <a href="#" data-relatch> */
  var relatch = document.querySelector("[data-relatch]");
  if (relatch) {
    relatch.addEventListener("click", function (ev) {
      ev.preventDefault();
      try { localStorage.removeItem(KEY); } catch (e) {}
      setLatch(false);
    });
  }
})();
