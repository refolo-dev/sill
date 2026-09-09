"""Direct anymodel calls for the design sprint (bypass OmniRoute rate-limit).
Concept round: 4 top models, sequenced, retries, direct API."""
import json, subprocess, time, os, sys

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
BASE = 'https://anymodel.org/v1/chat/completions'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
OUTDIR = 'C:/Users/user/agent-research/sill-gh/llm-design/concepts'
os.makedirs(OUTDIR, exist_ok=True)

with open('C:/Users/user/agent-research/sill-gh/llm-design/gen_concepts.py') as f:
    src = f.read()
BRIEF_CORE = src.split('BRIEF_CORE = """')[1].split('"""')[0]

def call(model, temp=0.85, max_tokens=2800, tries=3):
    payload = {'model': model, 'messages': [
        {'role': 'system', 'content': 'You are a world-class web art director. Decisive, specific, original. You write compact English prose.'},
        {'role': 'user', 'content': BRIEF_CORE}],
        'temperature': temp, 'max_tokens': max_tokens}
    pf = os.path.join(OUTDIR, '_payload.json')
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
                print(f'  try {attempt+1}: {str(d["error"])[:140]}', flush=True)
                time.sleep(15)
                continue
            return d['choices'][0]['message']['content']
        except Exception:
            print(f'  try {attempt+1}: parse fail {out[:140]}', flush=True)
            time.sleep(15)
    return None

models = [
    ('cc/claude-opus-5', 'claude-opus-5'),
    ('cx/gpt-6-astra', 'gpt-6-astra'),
    ('glm/glm-5.3', 'glm-5.3'),
    ('ds/deepseek-v4-pro', 'deepseek-v4-pro'),
]
for m, slug in models:
    t0 = time.time()
    txt = call(m)
    if txt:
        open(os.path.join(OUTDIR, f'{slug}.md'), 'w', encoding='utf-8').write(txt)
        print(f'{m}: {len(txt)} chars in {time.time()-t0:.0f}s OK', flush=True)
    else:
        print(f'{m}: FAILED', flush=True)
    time.sleep(5)
print('ROUND1-DIRECT DONE', flush=True)
