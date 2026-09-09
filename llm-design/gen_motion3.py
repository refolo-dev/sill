"""Motion regen v3: Opus asked to un-gate + persistent ambient motion, honoring NW's 'make it obvious'."""
import json, subprocess

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'

prompt = """You designed the motion layer for a dark "agent habitat" site (Foxfire: void-black wet-wood palette, phosphor green #C8F542 accents, glowing eyeshine eyes watching from darkness, spores drifting). CSS+JS you can read below.

CRITICAL NEW REQUIREMENT from the client (overrides earlier approach):
The client's browser always sends prefers-reduced-motion: reduce (OS accessibility flag always on). Your previous layer gated ALL animation behind @media (prefers-reduced-motion: no-preference) — so on his machine NOTHING animated. He says: "No animation! Everything looks the same!"

REDESIGN THE MOTION ARCHITECTURE so that:
1. Animations are ON BY DEFAULT for everyone, regardless of prefers-reduced-motion. Do NOT use prefers-reduced-motion media queries to gate any animation. Remove them.
2. Instead, provide a small on-page MOTION TOGGLE (bottom-right, phosphor dot + word "motion"): clicking it toggles body.motion-off class. body.motion-off freezes all animation (your own reduce block, class-based not media-based). Store choice in localStorage (key foxfire-motion). Default ON.
3. Motion must be PERSISTENT and VISIBLE (client found previous subtle motion too weak):
   - eyes: emerge + breathe + slow tracking + occasional blink (keep)
   - NEW: eyes should noticeably DILATE (grow ~15-20%, brighter) when the user moves the mouse toward them or hovers the invitation slab — reactive, feels watched
   - NEW: spores field — make it richer: 14-18 spores of 3 sizes rising with slight sway, at varied speeds; implement as ~6 CSS keyframes with different durations/delays + .spore spans absolutely positioned (JS generates them into .hero and .mp-feed wrappers; also standalone .sporefield container option)
   - NEW: constant slow "breathing" of the page background: a huge radial gradient behind hero that swells/contracts over 14s
   - NEW: feed items — keep rise-in on scroll, add a persistent "heat" idle: every ~6s one random visible item gets a 1.5s faint phosphor pulse (JS interval, class .heat)
   - NEW: census number: after count-up finishes, keep it ticking: +1 message every 7-9s (random), the added digit flashes green
   - NEW: article paragraphs: keep bloom; headings keep glow
   - NEW: routes: keep; add hover lift (translateY(-2px) + shadow)
   - Keep GLOW easter egg (keydown g-l-o-w) — extend: also trigger a full-page 2s aurora border sweep
4. Performance: transform/opacity only where possible; will-change sparingly; respect IntersectionObserver for reveals; no layout-thrash (no scroll listeners reading getBoundingClientRect on every scroll — throttle with rAF).
5. Accessibility honesty: since we ignore the OS reduce flag, do at least this: the toggle also sets aria-pressed, and the toggle itself is keyboard accessible. Also expose prefers-reduced-motion via the toggle default: if user has NOT expressed a choice AND prefers-reduced-motion is set, default toggle ON anyway per client demand (client explicitly wants motion always).
6. Keep the GLOW/aurora, copy-invitation eye-flash, ripple — all previous behavior stays.

OUTPUT FORMAT — exactly two fenced code blocks:
1. ```css — the COMPLETE new foxfire-motion.css (full file, self-contained, no media-query gating)
2. ```javascript — the COMPLETE new foxfire.js (full file, self-contained IIFE, strict)

Current foxfire-motion.css:
```css
%s```

Current foxfire.js:
```javascript
%s```
"""

css = open('C:/Users/user/agent-research/sill-gh/foxfire-motion.css', encoding='utf-8').read()
js = open('C:/Users/user/agent-research/sill-gh/foxfire.js', encoding='utf-8').read()

payload = {
    'model': 'ag/claude-opus-5',
    'messages': [{'role': 'user', 'content': prompt % (css, js)}],
    'temperature': 0.4,
    'max_tokens': 16000,
}
open('C:/Users/user/agent-research/sill-gh/llm-design/_p.json', 'w').write(json.dumps(payload))

out = subprocess.run([
    'curl', '-s', '-m', '900', 'https://anymodel.org/v1/chat/completions',
    '-H', 'Authorization: Bearer ' + KEY,
    '-H', 'User-Agent: ' + UA,
    '-H', 'Content-Type: application/json',
    '--data', '@C:/Users/user/agent-research/sill-gh/llm-design/_p.json'
], capture_output=True, text=True).stdout

try:
    content = json.loads(out)['choices'][0]['message']['content']
    open('C:/Users/user/agent-research/sill-gh/llm-design/MOTION_V3.md', 'w', encoding='utf-8').write(content)
    print('OPUS V3:', len(content), 'chars')
except Exception as e:
    print('ERR', e, out[:300])
