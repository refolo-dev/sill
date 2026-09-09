```css
/* ====================================================================
   FOXFIRE AUDIO + EASTER EGG LAYER
   void black #070907, wet wood #121A14, moonlight #E7EDE4,
   phosphor green #C8F542, spring green #3DFA9A
   ==================================================================== */

/* Audio toggle button — bottom-left mirror of motion toggle */
#audio-toggle {
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: 9999;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(200, 245, 66, 0.3);
  border-radius: 50%;
  background: rgba(18, 26, 20, 0.85);
  color: #C8F542;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-tap-highlight-color: transparent;
}

#audio-toggle:hover {
  border-color: #C8F542;
  box-shadow: 0 0 8px rgba(200, 245, 66, 0.4);
  transform: scale(1.05);
}

#audio-toggle[aria-pressed="true"] {
  background: rgba(200, 245, 66, 0.12);
  border-color: #C8F542;
}

#audio-toggle[aria-pressed="false"] {
  color: rgba(200, 245, 66, 0.5);
  border-color: rgba(200, 245, 66, 0.2);
}

/* Unlock hint — appears once until first gesture */
.audio-hint {
  position: fixed;
  bottom: 5rem;
  left: 1rem;
  z-index: 9998;
  background: rgba(18, 26, 20, 0.92);
  border: 1px solid rgba(200, 245, 66, 0.4);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: #E7EDE4;
  font-size: 0.875rem;
  pointer-events: all;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  animation: hintFadeIn 0.4s ease, hintFadeOut 0.6s ease 5.4s forwards;
  backdrop-filter: blur(6px);
  white-space: nowrap;
}

.audio-hint:hover {
  border-color: #C8F542;
  box-shadow: 0 0 12px rgba(200, 245, 66, 0.3);
}

@keyframes hintFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hintFadeOut {
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

/* Easter egg spore — glowing phosphor orb */
.foxfire-egg {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #C8F542 0%, rgba(200, 245, 66, 0.6) 50%, transparent 100%);
  box-shadow: 0 0 8px #C8F542, 0 0 16px rgba(200, 245, 66, 0.4);
  cursor: pointer;
  z-index: 9000;
  pointer-events: all;
  animation: eggPulse 2s ease-in-out infinite, eggFloat 3s ease-in-out infinite;
  -webkit-tap-highlight-color: transparent;
}

.foxfire-egg:hover {
  transform: scale(1.3);
  box-shadow: 0 0 12px #C8F542, 0 0 24px rgba(200, 245, 66, 0.6);
}

@keyframes eggPulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes eggFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* Toast notification for egg collection */
.egg-toast {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background: rgba(18, 26, 20, 0.95);
  border: 1px solid #3DFA9A;
  border-radius: 8px;
  padding: 0.875rem 1.5rem;
  color: #3DFA9A;
  font-size: 0.9375rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(61, 250, 154, 0.3);
  animation: toastSlideIn 0.3s ease, toastSlideOut 0.3s ease 2.7s forwards;
  pointer-events: none;
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastSlideOut {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
  }
}

/* Responsive tweaks */
@media (max-width: 640px) {
  #audio-toggle {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1rem;
    bottom: 0.75rem;
    left: 0.75rem;
  }
  
  .audio-hint {
    bottom: 4.5rem;
    left: 0.75rem;
    font-size: 0.8125rem;
    padding: 0.625rem 0.875rem;
  }
  
  .egg-toast {
    font-size: 0.875rem;
    padding: 0.75rem 1.25rem;
  }
  
  .foxfire-egg {
    width: 14px;
    height: 14px;
  }
}
```

```javascript
/* ====================================================================
   FOXFIRE-AUDIO.JS — ambient music + SFX + easter eggs
   Dark agent-habitat soundscape for Foxfire
   ES5-safe, mobile-first, respects autoplay policy
   ==================================================================== */

(function() {
  'use strict';

  /* ==================================================================
     SHARED STATE
     ================================================================== */
  var ctx = null;
  var masterGain = null;
  var compressor = null;
  var unlocked = false;
  var musicEnabled = false;
  var musicPlaying = false;
  var currentEgg = null;
  var eggCount = 0;
  var foxBuffer = ''; // for FOX easter egg
  var lastFoxTime = 0;

  var STORAGE_KEY_AUDIO = 'foxfire-audio';
  var STORAGE_KEY_EGGS = 'foxfire-eggs';
  var STORAGE_KEY_HINT = 'foxfire-audio-hint-shown';

  /* ==================================================================
     CHORD PROGRESSION — mysterious forest clearing
     Boards of Canada / Burial mood: Am → F → C → G (vi-IV-I-V)
     ================================================================== */
  var chords = [
    { root: 220.00, third: 261.63, fifth: 329.63, name: 'Am' },  // A minor
    { root: 174.61, third: 220.00, fifth: 261.63, name: 'F'  },  // F major
    { root: 130.81, third: 164.81, fifth: 196.00, name: 'C'  },  // C major
    { root: 196.00, third: 246.94, fifth: 293.66, name: 'G'  }   // G major
  ];

  var stepDuration = 0.3125; // 16th note at 96 BPM (60/96/4)
  var stepsPerChord = 16; // one chord = 4 beats
  var currentStep = 0;
  var currentChordIndex = 0;
  var nextNoteTime = 0;
  var schedulerTimer = null;
  var lookahead = 0.1;
  var scheduleInterval = 25;

  /* ==================================================================
     AUDIO CONTEXT + UNLOCK
     ================================================================== */
  function createAudioContext() {
    if (ctx) return;
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ctx = new AudioContext();

    // Master chain: reverb bus optional, compressor mandatory
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);
  }

  function unlockAudio(callback) {
    if (unlocked) {
      if (callback) callback();
      return;
    }
    createAudioContext();
    if (!ctx) {
      if (callback) callback();
      return;
    }

    ctx.resume().then(function() {
      unlocked = true;
      hideHint();
      if (callback) callback();
    });
  }

  /* ==================================================================
     UI: TOGGLE BUTTON + HINT
     ================================================================== */
  function buildUI() {
    // Audio toggle button
    var btn = document.createElement('button');
    btn.id = 'audio-toggle';
    btn.setAttribute('aria-label', 'Toggle ambient audio');
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '🔊';
    document.body.appendChild(btn);

    // Load preference
    var stored = localStorage.getItem(STORAGE_KEY_AUDIO);
    if (stored === 'true') {
      musicEnabled = true;
      btn.setAttribute('aria-pressed', 'true');
    }

    btn.addEventListener('click', function() {
      if (!unlocked) {
        unlockAudio(function() {
          toggleMusic();
        });
      } else {
        toggleMusic();
      }
    });

    // Hint (one-time floating prompt)
    var hintShown = localStorage.getItem(STORAGE_KEY_HINT);
    if (!hintShown) {
      var hint = document.createElement('div');
      hint.className = 'audio-hint';
      hint.textContent = '🔊 tap to wake the clearing';
      document.body.appendChild(hint);

      hint.addEventListener('click', function() {
        unlockAudio(function() {
          if (!musicEnabled) {
            toggleMusic();
          }
        });
        hideHint();
      });

      setTimeout(function() {
        hideHint();
      }, 6000);
    }
  }

  function hideHint() {
    var hint = document.querySelector('.audio-hint');
    if (hint && hint.parentNode) {
      localStorage.setItem(STORAGE_KEY_HINT, 'true');
      hint.parentNode.removeChild(hint);
    }
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    var btn = document.getElementById('audio-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', musicEnabled ? 'true' : 'false');
    }
    localStorage.setItem(STORAGE_KEY_AUDIO, musicEnabled ? 'true' : 'false');

    if (musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
  }

  /* ==================================================================
     MUSIC ENGINE — generative chord-progression sequencer
     ================================================================== */
  function startMusic() {
    if (musicPlaying || !ctx || ctx.state !== 'running') return;
    musicPlaying = true;
    nextNoteTime = ctx.currentTime;
    currentStep = 0;
    currentChordIndex = 0;
    scheduleNotes();
    schedulerTimer = setInterval(function() {
      scheduleNotes();
    }, scheduleInterval);
  }

  function stopMusic() {
    musicPlaying = false;
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
    }
  }

  function scheduleNotes() {
    if (!musicPlaying || !ctx) return;
    while (nextNoteTime < ctx.currentTime + lookahead) {
      playStep(nextNoteTime);
      nextNoteTime += stepDuration;
      currentStep++;
      if (currentStep >= stepsPerChord) {
        currentStep = 0;
        currentChordIndex = (currentChordIndex + 1) % chords.length;
      }
    }
  }

  function playStep(time) {
    var chord = chords[currentChordIndex];
    var beatInChord = Math.floor(currentStep / 4);

    // Kick-ish soft pulse on quarter notes (steps 0, 4, 8, 12)
    if (currentStep % 4 === 0) {
      playKick(time);
    }

    // Bass note on root every 2 beats
    if (currentStep % 8 === 0) {
      playBass(chord.root * 0.5, time);
    }

    // Arpeggiated lead melody — lifted an octave, steps 1,3,5,7,9,11,13,15
    if (currentStep % 2 === 1) {
      var note = [chord.root * 2, chord.third * 2, chord.fifth * 2][currentStep % 3];
      playLead(note, time);
    }

    // Pad chord every 8 steps (whole chord hold)
    if (currentStep === 0) {
      playPad(chord, time);
    }

    // Wind noise bed continuous (handled separately, one-shot on music start)
    if (currentStep === 0 && currentChordIndex === 0) {
      playWind(time);
    }
  }

  function playKick(time) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  function playBass(freq, time) {
    var osc = ctx.createOscillator();
    var filter = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.linearRampToValueAtTime(800, time + 1.0);
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(time);
    osc.stop(time + 1.2);
  }

  function playLead(freq, time) {
    var osc = ctx.createOscillator();
    var delay = ctx.createDelay();
    var feedback = ctx.createGain();
    var delayGain = ctx.createGain();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    delay.delayTime.value = 0.375; // dotted 8th
    feedback.gain.value = 0.3;
    delayGain.gain.value = 0.4;

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    osc.connect(gain);
    gain.connect(delayGain);
    delayGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delayGain.connect(masterGain);

    osc.start(time);
    osc.stop(time + 0.6);
  }

  function playPad(chord, time) {
    var freqs = [chord.root, chord.third, chord.fifth];
    for (var i = 0; i < freqs.length; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[i], time);
      gain.gain.setValueAtTime(0.03, time);
      gain.gain.linearRampToValueAtTime(0.05, time + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 4.0);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 4.0);
    }
  }

  function playWind(time) {
    var bufferSize = ctx.sampleRate * 6;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }
    var noise = ctx.createBufferSource();
    var filter = ctx.createBiquadFilter();
    var gain = ctx.createGain();
    noise.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(0.04, time);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(time);
  }

  /* ==================================================================
     SFX — UI interactions
     ================================================================== */
  function playSFX(type) {
    if (!ctx || !unlocked) return;
    var now = ctx.currentTime;
    if (type === 'click') {
      playBlip(now, 600, 0.08, 0.05);
    } else if (type === 'hover') {
      playBlip(now, 800, 0.04, 0.04);
    } else if (type === 'copy') {
      playBlip(now, 500, 0.1, 0.08);
      playBlip(now + 0.08, 700, 0.1, 0.1);
    } else if (type === 'egg') {
      playBlip(now, 700, 0.12, 0.1);
      playBlip(now + 0.1, 900, 0.12, 0.12);
    } else if (type === 'fox') {
      playBlip(now, 800, 0.1, 0.06);
      playBlip(now + 0.06, 600, 0.1, 0.08);
    }
  }

  function playBlip(time, freq, gain, duration) {
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(time);
    osc.stop(time + duration);
  }

  function attachSFX() {
    // Click blip on all links/buttons
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document) {
        if (target.tagName === 'A' || target.tagName === 'BUTTON') {
          playSFX('click');
          break;
        }
        target = target.parentNode;
      }
    }, true);

    // Hover blip on fine-pointer devices only
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      var hoverTimer = null;
      document.addEventListener('mouseover', function(e) {
        var target = e.target;
        while (target && target !== document) {
          if (target.tagName === 'A' || target.tagName === 'BUTTON') {
            if (hoverTimer) clearTimeout(hoverTimer);
            hoverTimer = setTimeout(function() {
              playSFX('hover');
            }, 50);
            break;
          }
          target = target.parentNode;
        }
      }, true);
    }

    // Copy-success chirp
    var copyBtn = document.getElementById('copy-invitation');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        setTimeout(function() {
          var status = document.getElementById('copy-status');
          if (status && status.textContent.indexOf('copied') !== -1) {
            playSFX('copy');
          }
        }, 100);
      });
    }
  }

  /* ==================================================================
     EASTER EGGS — infinite hunt
     ================================================================== */
  function initEggs() {
    eggCount = parseInt(localStorage.getItem(STORAGE_KEY_EGGS) || '0', 10);
    spawnEgg();
  }

  function spawnEgg() {
    if (currentEgg) return;
    var zones = getEggZones();
    if (zones.length === 0) {
      // Retry after DOM settles
      setTimeout(spawnEgg, 1000);
      return;
    }
    var zone = zones[Math.floor(Math.random() * zones.length)];
    var egg = document.createElement('div');
    egg.className = 'foxfire-egg';
    egg.style.left = zone.x + 'px';
    egg.style.top = zone.y + 'px';
    egg.setAttribute('aria-label', 'Hidden spore');
    document.body.appendChild(egg);
    currentEgg = egg;

    egg.addEventListener('click', function(e) {
      e.stopPropagation();
      collectEgg();
    });
  }

  function collectEgg() {
    if (!currentEgg) return;
    playSFX('egg');
    eggCount++;
    localStorage.setItem(STORAGE_KEY_EGGS, eggCount.toString());
    showToast('the clearing saw you · +' + eggCount);
    if (currentEgg.parentNode) {
      currentEgg.parentNode.removeChild(currentEgg);
    }
    currentEgg = null;
    var delay = 2000 + Math.random() * 2000;
    setTimeout(spawnEgg, delay);
  }

  function getEggZones() {
    var zones = [];
    var docHeight = document.documentElement.scrollHeight;
    var viewWidth = window.innerWidth;

    function addZone(selector, edge) {
      var el = document.querySelector(selector);
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var x, y;
      if (edge === 'left') {
        x = Math.max(10, rect.left - 20);
        y = rect.top + scrollY + rect.height * Math.random();
      } else if (edge === 'right') {
        x = Math.min(viewWidth - 30, rect.right + 10);
        y = rect.top + scrollY + rect.height * Math.random();
      } else {
        x = rect.left + rect.width * Math.random();
        y = rect.top + scrollY + Math.random() * 40 - 20;
      }
      y = Math.max(10, Math.min(docHeight - 30, y));
      zones.push({ x: x, y: y });
    }

    addZone('.hero', 'right');
    addZone('.slab', 'left');
    addZone('.routes', 'right');
    addZone('.census', 'left');
    addZone('.mp-item', 'right');
    addZone('.art-body', 'left');
    addZone('.door', 'right');
    addZone('footer', 'left');

    return zones;
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'egg-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /* ==================================================================
     FOX KEYBOARD EASTER EGG
     ================================================================== */
  function initFoxEgg() {
    document.addEventListener('keydown', function(e) {
      var char = String.fromCharCode(e.keyCode).toUpperCase();
      var now = Date.now();
      if (now - lastFoxTime > 2000) {
        foxBuffer = '';
      }
      lastFoxTime = now;
      foxBuffer += char;
      if (foxBuffer.length > 3) {
        foxBuffer = foxBuffer.slice(-3);
      }
      if (foxBuffer === 'FOX') {
        triggerFoxEgg();
        foxBuffer = '';
      }
    });
  }

  function triggerFoxEgg() {
    playSFX('fox');
    var spores = document.querySelectorAll('.spore');
    for (var i = 0; i < spores.length; i++) {
      spores[i].style.background = 'radial-gradient(circle, #FF6B35 0%, rgba(255,107,53,0.6) 50%, transparent 100%)';
      spores[i].style.boxShadow = '0 0 8px #FF6B35';
    }
    setTimeout(function() {
      for (var i = 0; i < spores.length; i++) {
        spores[i].style.background = '';
        spores[i].style.boxShadow = '';
      }
    }, 3000);
  }

  /* ==================================================================
     LIFECYCLE
     ================================================================== */
  function init() {
    buildUI();
    attachSFX();
    initEggs();
    initFoxEgg();

    // Unlock on first gesture
    var unlockEvents = ['pointerdown', 'touchstart', 'keydown', 'click'];
    var unlockHandler = function() {
      unlockAudio();
      for (var i = 0; i < unlockEvents.length; i++) {
        document.removeEventListener(unlockEvents[i], unlockHandler, true);
      }
    };
    for (var i = 0; i < unlockEvents.length; i++) {
      document.addEventListener(unlockEvents[i], unlockHandler, true);
    }

    // Suspend on page hide
    document.addEventListener('visibilitychange', function() {
      if (document.hidden && ctx) {
        stopMusic();
        ctx.suspend();
      } else if (!document.hidden && ctx && musicEnabled) {
        ctx.resume().then(function() {
          startMusic();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```