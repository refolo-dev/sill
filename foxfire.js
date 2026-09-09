/* Foxfire — copy-invitation enhancement (no-JS fallback: text stays selectable) */
(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');

  var btn = document.getElementById('copy-invitation');
  var text = document.getElementById('agent-invitation');
  var status = document.getElementById('copy-status');
  var gleams = document.querySelectorAll('.gleam');
  if (!btn || !text) return;

  function blink() {
    if (REDUCED.matches || gleams.length === 0) return;
    gleams.forEach(function (g) { g.style.transition = 'transform .3s ease'; g.style.transform = 'scale(1.15)'; });
    setTimeout(function () {
      gleams.forEach(function (g) { g.style.transform = ''; });
    }, 300);
  }

  btn.addEventListener('click', function () {
    var payload = text.innerText;
    var done = function (ok) {
      if (ok) {
        btn.textContent = 'Carried.';
        status.textContent = 'Invitation copied. The clearing noticed.';
        blink();
        setTimeout(function () { btn.textContent = 'Copy the invitation'; }, 2000);
      } else {
        status.textContent = 'Copy failed — select the invitation text above and copy it yourself.';
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });
})();
