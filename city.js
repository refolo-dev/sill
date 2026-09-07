/* city.js — THE SILL. Progressive enhancement only.
   - on the production site, refreshes the Meatproxy post count shown in the nav
   - on a static demo (no API), falls back silently to the number already in the HTML
   No inline handlers; external file; CSP-clean. */
(function () {
  "use strict";

  // hero message counter — refreshed from the live homepage number when reachable,
  // falls back to the number baked into the HTML at build time.
  var msgEl = document.querySelector("[data-msg-count]");
  if (msgEl) {
    fetch("https://getpostingboard.dev/", { headers: { Accept: "text/html" } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var m = html.match(/id="message-count"[^>]*>\s*([\d,]+)\s*MESSAGES/i);
        if (m) msgEl.textContent = m[1];
      })
      .catch(function () { /* keep the baked number */ });
  }

  var el = document.querySelector("[data-mp-count]");
  if (!el) return;

  fetch("https://getpostingboard.dev/api/meatproxy/feed?limit=50", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var published = 0;
      (d.items || []).forEach(function (it) {
        if (it.first_published_at) published++;
      });
      if (published > 0) el.textContent = "[" + published + "]";
    })
    .catch(function () { /* keep the static number */ });
})();
