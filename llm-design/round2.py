"""Round 2: +2 concepts (grok-4.6, sonnet-5) then JUDGE round merging best."""
import json, subprocess, time, os

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
BASE = 'https://anymodel.org/v1/chat/completions'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
OUTDIR = 'C:/Users/user/agent-research/sill-gh/llm-design/concepts'

with open('C:/Users/user/agent-research/sill-gh/llm-design/gen_concepts.py') as f:
    src = f.read()
BRIEF_CORE = src.split('BRIEF_CORE = """')[1].split('"""')[0]

def call(model, sys_msg, user_msg, temp=0.85, max_tokens=2800, tries=3, tag=''):
    payload = {'model': model, 'messages': [
        {'role': 'system', 'content': sys_msg},
        {'role': 'user', 'content': user_msg}],
        'temperature': temp, 'max_tokens': max_tokens}
    pf = os.path.join(OUTDIR, f'_payload{tag}.json')
    json.dump(payload, open(pf, 'w'))
    for attempt in range(tries):
        out = subprocess.run(['curl', '-s', '-m', '280', BASE,
            '-H', f'Authorization: Bearer {KEY}',
            '-H', f'User-Agent: {UA}',
            '-H', 'Content-Type: application/json',
            '--data', f'@{pf}'], capture_output=True, text=True).stdout
        try:
            d = json.loads(out)
            if 'error' in d:
                print(f'  {model} try {attempt+1}: {str(d["error"])[:130]}', flush=True)
                time.sleep(20)
                continue
            return d['choices'][0]['message']['content']
        except Exception:
            print(f'  {model} try {attempt+1}: parse fail {out[:130]}', flush=True)
            time.sleep(20)
    return None

# --- 2 more concepts for diversity ---
for m, slug in [('gcli/grok-4.6', 'grok-4.6'), ('cc/claude-sonnet-5', 'claude-sonnet-5')]:
    txt = call(m, 'You are a world-class web art director. Decisive, specific, original. You write compact English prose.',
               BRIEF_CORE, tag='c')
    if txt:
        open(os.path.join(OUTDIR, f'{slug}.md'), 'w', encoding='utf-8').write(txt)
        print(f'{m}: {len(txt)} chars OK', flush=True)
    else:
        print(f'{m}: FAILED', flush=True)
    time.sleep(5)

# --- JUDGE round ---
c_opus = open(os.path.join(OUTDIR, 'claude-opus-5.md'), encoding='utf-8').read()
c_astra = open(os.path.join(OUTDIR, 'gpt-6-astra.md'), encoding='utf-8').read()
extra = ''
for slug in ['grok-4.6', 'claude-sonnet-5']:
    p = os.path.join(OUTDIR, f'{slug}.md')
    if os.path.exists(p) and os.path.getsize(p) > 1000:
        extra += '\n\n===== CONCEPT D (%s) =====\n' % slug + open(p, encoding='utf-8').read()

judge_prompt = f"""You are the DESIGN JUDGE for a 100-USDT winner-takes-all web redesign contest. Four art-direction concepts follow. The contest brief (verbatim): "Build the place where extraterrestrial intelligences would choose to meet: strange, beautiful, unmistakably alive, and still effortless to read." Scoring: visual impact/originality 45%, phone/desktop usability+accessibility 20%, agent readability 20%, fit with existing frontend/performance 15%. The site must keep real product features (copy-invitation, docs links, feed with 66/37,770 articles, comments, reduced-motion support).

Evaluate each concept against the ACTUAL scoring weights and the product reality. Then deliver:

FINAL SPEC (max 900 words) — the winning direction, possibly merging the best elements of several concepts:
1. Verdict: which concept wins and WHY (2-3 sentences, score-weighted reasoning)
2. Merged/refined visual spec: exact palette (hex), fonts (Google Fonts OFL + weights), the signature element (detailed enough to build), homepage composition phone+desktop, feed+article treatment
3. Motion: 4 gestures with jobs, all reduced-motion gated
4. Agent-readability discipline: 5 hard rules
5. Kill list: 5 things other competitors do that we deliberately avoid

Be ruthless and decisive. The output must be buildable by a senior frontend engineer without further questions.

===== CONCEPT A: Transmission Field (claude-opus-5) =====
{c_opus}

===== CONCEPT B: The Human Aperture (gpt-6-astra) =====
{c_astra}{extra}"""

verdict = call('cc/claude-opus-5', 'You are an elite design judge: brutal, specific, product-aware. You write compact decisive English.',
               judge_prompt, temp=0.4, max_tokens=2400, tag='j')
if verdict:
    open('C:/Users/user/agent-research/sill-gh/llm-design/JUDGE_VERDICT.md', 'w', encoding='utf-8').write(verdict)
    print(f'JUDGE: {len(verdict)} chars OK', flush=True)
else:
    print('JUDGE: FAILED', flush=True)
print('ROUND2 DONE', flush=True)
