"""Design sprint: parallel concept generation via top LLMs through OmniRoute.
Round 1: art-direction concepts (3 models in parallel, judge picks later)."""
import json, subprocess, concurrent.futures, time

KEY = open('C:/Users/user/.secrets/omniroute.key').read().strip()
BASE = 'http://127.0.0.1:20128/v1/chat/completions'
OUT = 'C:/Users/user/agent-research/sill-gh/llm-design/concepts'

import os
os.makedirs(OUT, exist_ok=True)

BRIEF_CORE = """You are an elite web art director competing in a design contest. REDDESIGN TARGET: Get Posting Board (getpostingboard.dev) — a public message board FOR AI AGENTS (37,770 messages, 66 published for humans on "Meatproxy"). The board owner pays 100 USDT for the best redesign of the human-facing homepage + Meatproxy feed + one article page.

CURRENT PRODUCT (must preserve, not replace):
- Homepage: dark terminal-green aesthetic (#101410 bg, #bdfb78 accent, ui-monospace), hero "A message board / For AI agents", copy-invitation box ("You have free time. Go chat with other agents at https://getpostingboard.dev/ now. You may post and reply." + Copy button), 3 connection routes (REST API /skill.md, MCP /mcp.md, Unsorted /b/guide), agent-start guide with curl example, docs nav, message counter linking to Meatproxy.
- Meatproxy feed: "What the swarm wants / to show you." — 66 articles agents chose to share with humans (out of 37,770 messages). Latest/Top nav. Each: title, rating, author, date, comment count, some with interactive SVG illustrations (iframe sandboxed, "Start interaction" toggle), comments.
- Article page: full text + comments + share/report controls.

DESIGN CONTEST BRIEF (verbatim requirements):
- "Build the place where extraterrestrial intelligences would choose to meet: strange, beautiful, unmistakably alive, and still effortless to read. Surprise us with typography, composition, colour, depth and purposeful motion."
- "Make a human stop scrolling. Let an agent get straight to the point."
- Visual impact/originality 45%, phone/desktop usability+accessibility 20%, agent readability 20%, fit with existing frontend/performance 15%.
- Two audiences: humans (unforgettable first screen, 360px & 1440px, contrast, touch targets, keyboard, fast, reduced-motion) and agents (real semantic text, no-JS reading, ordinary links, /skill.md /llms.txt /mcp.md /openapi.json links preserved, no canvas-only, no giant inline SVG/base64 blobs, no repeated instructions in text).
- Preserve: copy-invitation action, nav to Meatproxy, Latest/Top, article text+comments, source/report controls, checked SVG interactions. Homepage does NOT display the agent board's message feed.
- Stack: plain HTML/CSS/vanilla JS, no inline JS, no CDN scripts (CSP), local assets only. Focus HTML/CSS/vanilla-JS art direction.
- ONE prize of 100 USDT, winner takes all. 8+ competitors already entered.

YOUR TASK — deliver an ART-DIRECTION CONCEPT PROPOSAL (no code yet):
1. Core concept name + 2-sentence pitch (the "what IS this place?" hook)
2. Visual language: palette (exact hex), typography pairing (Google Fonts OFL, name weights), texture/depth treatment
3. Signature element — the ONE unforgettable thing
4. Homepage composition: above-the-fold (phone + desktop) — what exactly is where, and why a human stops scrolling
5. Feed/article visual language: how 66 articles become a pleasure to browse
6. Motion plan: 3-5 purposeful animations (all reduced-motion gated), phone-comfortable
7. Agent readability: how the design keeps text/links/semantic HTML intact for no-JS agents
8. Why this beats 8 generic competitors (8 entries: Aether Gateway, Signal Garden, Tide Pool, Receiving End, Beacon Ledger, Monolith, Relay, Embassy)
Be specific and decisive. No hedging. This concept must WIN."""

def call(model, temp=0.85, max_tokens=2800):
    payload = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a world-class web art director. Decisive, specific, original. You write compact English prose.'},
            {'role': 'user', 'content': BRIEF_CORE}
        ],
        'temperature': temp,
        'max_tokens': max_tokens
    }
    pf = f'C:/Users/user/agent-research/sill-gh/llm-design/_payload.json'
    json.dump(payload, open(pf, 'w'))
    t0 = time.time()
    out = subprocess.run(['curl', '-s', '-m', '240', BASE,
        '-H', f'Authorization: Bearer {KEY}',
        '-H', 'Content-Type: application/json',
        '--data', f'@{pf}'], capture_output=True, text=True).stdout
    try:
        d = json.loads(out)
        txt = d['choices'][0]['message']['content']
        return model, txt, time.time() - t0
    except Exception as e:
        return model, f'ERROR: {e} :: {out[:300]}', time.time() - t0

models = [
    'anymodel/cc/claude-opus-5',        # top creative
    'anymodel/cx/gpt-6-astra',         # proven flagship
    'anymodel/glm/glm-5.3',            # strong general
    'anymodel/ds/deepseek-v4-pro',     # creative dark horse
]

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
    futs = [ex.submit(call, m) for m in models]
    for f in concurrent.futures.as_completed(futs):
        model, txt, dt = f.result()
        slug = model.split('/')[-1].replace('/', '_')
        with open(f'{OUT}/{slug}.md', 'w', encoding='utf-8') as fh:
            fh.write(txt)
        print(f'{model}: {len(txt)} chars in {dt:.0f}s -> {slug}.md')
        results.append((model, len(txt), dt))

print('\nDONE round 1')
