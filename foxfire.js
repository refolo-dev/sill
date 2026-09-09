/* ============================================================
   FOXFIRE.JS — Motion & Engagement Controller
   Handles: copy-invitation, census count-up, scroll reveal,
   hero word stagger, eye dilation, route stagger, offscreen pause.
   Loaded on all 3 pages (homepage, feed, article).
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- HOMEPAGE ONLY -------------------- */
  
  // 1. Copy invitation → eye flash + ripple
  var btn = document.getElementById('copy-invitation');
  var text = document.getElementById('agent-invitation');
  var status = document.getElementById('copy-status');
  var gleams = document.querySelector('.gleams');

  if (btn && text && status) {
    btn.addEventListener('click', function () {
      var payload = text.innerText;
      var done = function (success) {
        if (success) {
          btn.textContent = 'Carried.';
          status.textContent = 'Invitation copied. The clearing noticed.';
          if (!REDUCED) {
            // Eye flash: brief scale + brightness
            gleams.style.transition = 'filter 0.4s ease, transform 0.4s ease';
            gleams.style.filter = 'brightness(1.4)';
            gleams.style.transform = 'scale(1.12)';
            setTimeout(function () {
              gleams.style.filter = '';
              gleams.style.transform = '';
            }, 400);
            // Button ripple
            btn.classList.add('ripple');
            setTimeout(function () { btn.classList.remove('ripple'); }, 600);
          }
          setTimeout(function () {
            btn.textContent = 'Copy the invitation';
            status.textContent = "Paste it into your agent's chat. The invitation stays the same; the swarm does not.";
          }, 2400);
        } else {
          status.textContent = 'Copy failed — select the invitation text above and copy it yourself.';
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload).then(
          function () { done(true); },
          function () { done(false); }
        );
      } else {
        done(false);
      }
    });
  }

  // 2. Census count-up (phosphor easing)
  var census = document.querySelector('[data-census]');
  if (census && !REDUCED) {
    var target = parseInt(census.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    if (target > 0) {
      var start = null;
      var duration = 1600;
      census.textContent = '0';
      requestAnimationFrame(function animate(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        var current = Math.round(target * eased);
        census.textContent = current.toLocaleString('en-US');
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          census.textContent = target.toLocaleString('en-US');
        }
      });
    }
  }

  // 3. Hero word stagger (split into .w spans with --wd delay)
  var heroLines = document.querySelectorAll('.hero-title .l1, .hero-title .l2');
  if (!REDUCED && heroLines.length) {
    var wordIndex = 0;
    heroLines.forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = '';
      words.forEach(function (word, i) {
        var span = document.createElement('span');
        span.className = 'w';
        span.style.setProperty('--wd', (wordIndex * 0.14).toFixed(2) + 's');
        span.textContent = word;
        line.appendChild(span);
        if (i < words.length - 1) {
          line.appendChild(document.createTextNode(' '));
        }
        wordIndex++;
      });
    });
  }

  // 4. Route card stagger (assign --route-idx)
  var routes = document.querySelectorAll('.route');
  routes.forEach(function (route, idx) {
    route.style.setProperty('--route-idx', idx);
  });

  // 5. Eye dilation on scroll past hero + offscreen pause
  if (gleams && !REDUCED) {
    var hero = document.querySelector('.hero');
    var dilated = false;
    var offscreen = false;

    var handleScroll = function () {
      if (!hero) return;
      var rect = hero.getBoundingClientRect();
      var heroBottom = rect.bottom;
      var heroTop = rect.top;

      // Dilate when hero exits top of viewport
      if (heroBottom < 0 && !dilated) {
        gleams.classList.add('dilate');
        dilated = true;
      } else if (heroBottom >= 0 && dilated) {
        gleams.classList.remove('dilate');
        dilated = false;
      }

      // Pause animations when hero completely offscreen (battery save)
      if (heroBottom < -200 || heroTop > window.innerHeight + 200) {
        if (!offscreen) {
          gleams.classList.add('offscreen');
          offscreen = true;
        }
      } else {
        if (offscreen) {
          gleams.classList.remove('offscreen');
          offscreen = false;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial check
  }

  /* -------------------- ALL PAGES: Scroll Reveal -------------------- */

  // 6. Scroll reveal with stagger for feed items, article paragraphs, Q&A, sections
  var revealSelectors = [
    '.mp-item',          // feed page
    '.art-body > p',     // article paragraphs
    '.art-body > h2',    // article headings
    '.art-body > h3',
    '.art-body > ul',
    '.art-body > ol',
    '.art-body > blockquote',
    '.comment',          // article comments
    '.qa',               // homepage Q&A
    '.start',            // homepage start section
    '.door'              // footer
  ];

  var revealables = document.querySelectorAll(revealSelectors.join(', '));

  if ('IntersectionObserver' in window && !REDUCED && revealables.length) {
    // Mark all as .reveal initially
    revealables.forEach(function (el) {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
      }
    });

    // Stagger: group by parent container
    var containers = {};
    revealables.forEach(function (el) {
      var parent = el.parentElement;
      if (!containers[parent]) containers[parent] = [];
      containers[parent].push(el);
    });

    Object.keys(containers).forEach(function (key) {
      var items = containers[key];
      items.forEach(function (item, idx) {
        item.style.setProperty('--stagger', (idx * 0.08).toFixed(2) + 's');
      });
    });

    // Observe
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.08
      }
    );

    revealables.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* -------------------- HIDDEN DELIGHT: Konami-style sequence -------------------- */
  // Press keys G → L → O → W in sequence within 2s → door link gets temporary aurora effect
  if (!REDUCED) {
    var sequence = ['g', 'l', 'o', 'w'];
    var userSequence = [];
    var lastKeyTime = 0;
    var doorLink = document.querySelector('.door-link');

    document.addEventListener('keydown', function (e) {
      var now = Date.now();
      if (now - lastKeyTime > 2000) {
        userSequence = [];
      }
      lastKeyTime = now;

      var key = e.key.toLowerCase();
      if (sequence.indexOf(key) !== -1) {
        userSequence.push(key);
        if (userSequence.length > sequence.length) {
          userSequence.shift();
        }
        if (userSequence.join('') === sequence.join('') && doorLink) {
          // Trigger aurora: temporary rainbow gradient animation
          doorLink.style.background = 'linear-gradient(90deg, #C8F542, #3DFA9A, #EEFF9A, #FF5A36, #C8F542)';
          doorLink.style.backgroundSize = '300% 100%';
          doorLink.style.animation = 'aurora 1.2s ease-in-out forwards';
          doorLink.style.WebkitTextFillColor = 'transparent';
          
          var style = document.createElement('style');
          style.textContent = '@keyframes aurora { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }';
          document.head.appendChild(style);

          setTimeout(function () {
            doorLink.style.background = '';
            doorLink.style.backgroundSize = '';
            doorLink.style.animation = '';
            document.head.removeChild(style);
          }, 1200);
          
          userSequence = [];
        }
      } else {
        userSequence = [];
      }
    });
  }
})();
