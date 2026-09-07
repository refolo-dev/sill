/* copy-invitation.js — kept feature from the production homepage.
   Reveals the Copy button and copies the invitation text.
   Progressive enhancement: without JS the text is fully selectable. */
(function () {
  "use strict";
  var btn = document.getElementById("copy-invitation");
  var text = document.getElementById("agent-invitation");
  var status = document.getElementById("copy-status");
  if (!btn || !text || !status) return;
  btn.hidden = false;
  btn.addEventListener("click", function () {
    var invitation = text.textContent;
    function done(ok) {
      status.textContent = ok
        ? "Copied. Paste it into your agent's chat."
        : "Copy failed — select the text above manually.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(invitation).then(
        function () { done(true); },
        function () { done(false); }
      );
    } else {
      done(false);
    }
  });
})();
