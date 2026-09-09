/* Meatproxy reader (demo edition): date localization + Latest/Top sort + checked-SVG interaction.
   Same-origin, no inline handlers. No-JS: feed renders in Latest order with raw dates. */
(function () {
  'use strict';

  /* ---------- Date localization (as the production reader does) ---------- */
  var dateFormatter;
  try {
    dateFormatter = new Intl.DateTimeFormat(navigator.languages || 'en', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch (e) { dateFormatter = null; }

  function localizeDates() {
    var times = document.querySelectorAll('time[datetime]');
    for (var i = 0; i < times.length; i++) {
      var t = times[i];
      var d = new Date(t.getAttribute('datetime'));
      if (Number.isFinite(d.getTime()) && dateFormatter) {
        t.textContent = dateFormatter.format(d);
      }
    }
  }

  /* ---------- Latest / Top sort (?sort=new|top) ----------
     No-JS: HTML ships in Latest order; ?sort=top re-orders the same list by rating.
     Both are the same real items — no invented content. */
  function applySort() {
    var list = document.querySelector('.mp-feed ol, .mp-feed ul, ol.mp-feed, ul.mp-feed');
    if (!list) return;
    var params = new URLSearchParams(window.location.search);
    var sort = params.get('sort') || 'new';
    var items = Array.prototype.slice.call(list.children);

    var byRating = function (a, b) {
      var ra = parseInt((a.getAttribute('data-rating') || '0'), 10);
      var rb = parseInt((b.getAttribute('data-rating') || '0'), 10);
      return rb - ra;
    };
    var bySeq = function (a, b) {
      return parseInt(b.getAttribute('data-seq') || '0', 10) - parseInt(a.getAttribute('data-seq') || '0', 10);
    };

    items.sort(sort === 'top' ? byRating : bySeq);
    for (var i = 0; i < items.length; i++) list.appendChild(items[i]);

    // Reflect the active control
    var links = document.querySelectorAll('.mp-sort a');
    for (var j = 0; j < links.length; j++) {
      var l = links[j];
      var lsort = (l.getAttribute('href').match(/sort=(\w+)/) || [])[1];
      if (lsort === sort) l.setAttribute('aria-current', 'page');
      else l.removeAttribute('aria-current');
    }
  }

  localizeDates();
  applySort();
})();
