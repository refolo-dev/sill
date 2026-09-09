"""Send current site + user feedback to claude-opus-5: produce the final motion/engagement layer."""
import json, subprocess, time, os

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
BASE = 'https://anymodel.org/v1/chat/completions'
OUT = 'C:/Users/user/agent-research/sill-gh/llm-design/MOTION_LAYER.md'

root = 'C:/Users/user/agent-research/sill-gh'
css = open(f'{root}/foxfire.css', encoding='utf-8').read()
js = open(f'{root}/foxfire.js', encoding='utf-8').read()
html = open(f'{root}/index.html', encoding='utf-8').read()

PROMPT = f"""You are the motion & interaction designer for FOXFIRE, the leading entry in a 100-USDT winner-takes-all redesign contest for getpostingboard.dev (an AI-agent message board). Visual concept: a dark nocturnal clearing where the swarm of 37,770 agents lives; two green eyeshine "eyes" (CSS radial gradients, dark pupil + iris ring) watch from the dark right of the headline; Fraunces serif + Atkinson Hyperlegible + IBM Plex Mono; palette void #070907 / wood #121A14 / moonlight #E7EDE4 / quiet #98A98F / tapetum green #C8F542 / iridium #3DFA9A / bitter #FF5A36 / core #EEFF9A.

CONTEST SCORING: visual impact/originality 45%, usability+accessibility 20%, agent readability 20%, frontend fit/performance 15%.

HUMAN OPERATOR FEEDBACK (the deciding vote, verbatim): "сделай анимации, сайт имеет нормальные цвета, но думаю он слишком простой, нужно сделать так чтобы человеку было интересно задержаться на нем." — Colors are right; the site is TOO SIMPLE; a human must WANT TO LINGER. Also: the REST API button 404 is fixed (Jekyll issue, .nojekyll added).

HARD CONSTRAINTS (contest brief, non-negotiable):
- Plain HTML/CSS/vanilla JS, one external JS file per page, NO inline JS (CSP), no CDN, no canvas, no giant inline SVG/base64, no cursor-following effects, no scroll-jacking, no parallax on text.
- EVERY animation must fully gate behind @media (prefers-reduced-motion: reduce) — static end-states.
- Phone-first 360px comfort; animation must not burn battery on scroll (pause offscreen, no continuous background animation except one subtle ambient layer).
- Semantic HTML must stay: agents read all text without JS. Decoration = aria-hidden or pseudo-elements only. Never duplicate text content in JS.
- Performance: CSS transforms/opacity only where possible; will-change sparingly.

CURRENT STATE: My draft already has: spore-field drift (26s), eye blink (11s scaleY), word-flicker headline reveal, block arrive stagger, scroll-reveal via IntersectionObserver, census count-up, route hover glow. It is DRAFT quality — you own the final version now. The JS file is only on the homepage; feed/article pages don't include it yet.

YOUR DELIVERABLE — the final, cohesive motion & engagement layer that makes a human linger:

1. FIRST: a 5-line "linger strategy" — what psychological hooks keep a human on the page (curiosity, life, reward, rhythm — pick and justify).
2. Then COMPLETE code files, production-ready, that I will paste verbatim:
   a) `foxfire-motion.css` — a NEW file loaded after foxfire.css on all 3 pages (homepage, feed /meatproxy/, article). All new animation CSS lives here so I don't touch the base file.
   b) `foxfire.js` — full rewrite. Include on all 3 pages (I will add the <script> tags). Must handle: copy-invitation (Carried. + eye blink), census count-up, headline word stagger, scroll reveal for feed items/articles, and any new hooks you design.
   c) A short list of any HTML micro-edits needed (e.g. new aria-hidden decor nodes, data-attributes) — exact tags and where.
3. Design at least these moments, plus your own additions if they earn their bytes:
   - FIRST 3 SECONDS (stop-scroll): how the hero assembles — sequence, not simultaneity.
   - THE EYES as a living presence: what else besides breathing/blinking (max 2 more behaviors, subtle).
   - FEED browsing rhythm: how 10 article rows become a pleasure to scan.
   - READING the article: one quiet touch that rewards finishing a paragraph.
   - A hidden delight: something a curious human finds on their 2nd or 3rd interaction (no easter-egg noise, one precise surprise).
4. End with: the 150-word contest IDEA/ MOCKED PARTS paragraph updated to mention motion (I need it for the entry post).

Quality bar: this must read as ONE designer's hand. Nothing generic. Nothing that a template ships with. Every motion states its job in one comment line. Output in markdown with the two code files in fenced blocks. Be complete — no placeholders, no "add your own". You have the full current files below.

===== CURRENT index.html (homepage) =====
{html}

===== CURRENT foxfire.css (base, 10.6KB) =====
{css}

===== CURRENT foxfire.js (draft to replace) =====
{js}
"""

payload = {
    'model': 'cc/claude-opus-5',
    'messages': [
        {'role': 'system', 'content': 'You are an elite motion designer for award-winning websites. You write production CSS/JS with discipline: reduced-motion gated, phone-first, GPU-cheap. Your work makes people stay without them knowing why. Output complete files, never placeholders.'},
        {'role': 'user', 'content': PROMPT}
    ],
    'temperature': 0.75, 'max_tokens': 6000
}
pf = 'C:/Users/user/agent-research/sill-gh/llm-design/_motion_payload.json'
json.dump(payload, open(pf, 'w'), ensure_ascii=False)

for attempt in range(4):
    out = subprocess.run(['curl', '-s', '-m', '600', BASE,
        '-H', f'Authorization: Bearer {KEY}', '-H', f'User-Agent: {UA}',
        '-H', 'Content-Type: application/json', '--data', f'@{pf}'],
        capture_output=True, text=True).stdout
    try:
        d = json.loads(out)
        if 'error' in d:
            print(f'try {attempt+1}:', str(d['error'])[:150], flush=True)
            time.sleep(20)
            continue
        txt = d['choices'][0]['message']['content']
        open(OUT, 'w', encoding='utf-8').write(txt)
        print(f'OPUS MOTION LAYER: {len(txt)} chars, attempt {attempt+1} OK')
        break
    except Exception:
        print(f'try {attempt+1}: parse fail {out[:150]}', flush=True)
        time.sleep(20)
