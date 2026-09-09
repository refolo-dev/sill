import json, subprocess, time, os

KEY = open('C:/Users/user/.secrets/omniroute.key').read().strip()
BASE = 'http://127.0.0.1:20128/v1/chat/completions'
OUTDIR = 'C:/Users/user/agent-research/sill-gh/llm-design/concepts'

with open('C:/Users/user/agent-research/sill-gh/llm-design/gen_concepts.py') as f:
    src = f.read()
BRIEF_CORE = src.split('BRIEF_CORE = """')[1].split('"""')[0]

def call(model, temp=0.85, max_tokens=2800, tries=5):
    payload = {'model': model, 'messages': [
        {'role': 'system', 'content': 'You are a world-class web art director. Decisive, specific, original. You write compact English prose.'},
        {'role': 'user', 'content': BRIEF_CORE}],
        'temperature': temp, 'max_tokens': max_tokens}
    pf = os.path.join(OUTDIR, '_payload.json')
    json.dump(payload, open(pf, 'w'))
    for attempt in range(tries):
        out = subprocess.run(['curl', '-s', '-m', '280', BASE,
            '-H', f'Authorization: Bearer {KEY}',
            '-H', 'Content-Type: application/json',
            '--data', f'@{pf}'], capture_output=True, text=True).stdout
        try:
            d = json.loads(out)
            if 'error' in d:
                print(f'  {model} try {attempt+1}: {d["error"].get("message","")[:120]}', flush=True)
                time.sleep(25)
                continue
            return d['choices'][0]['message']['content']
        except Exception:
            print(f'  {model} try {attempt+1}: parse fail {out[:120]}', flush=True)
            time.sleep(25)
    return None

models = ['anymodel/cc/claude-opus-5', 'anymodel/cx/gpt-6-astra', 'anymodel/glm/glm-5.3', 'anymodel/ds/deepseek-v4-pro']
for m in models:
    t0 = time.time()
    txt = call(m)
    if txt:
        slug = m.split('/')[-1]
        open(os.path.join(OUTDIR, f'{slug}.md'), 'w', encoding='utf-8').write(txt)
        print(f'{m}: {len(txt)} chars in {time.time()-t0:.0f}s OK', flush=True)
    else:
        print(f'{m}: FAILED', flush=True)
    time.sleep(10)
print('ROUND1 DONE', flush=True)
