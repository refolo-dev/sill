"""LLM vision QA of Foxfire screenshots via anymodel (claude vision)."""
import json, subprocess, time, base64, os

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
BASE = 'https://anymodel.org/v1/chat/completions'

shots = ['foxfire-desktop.jpg', 'foxfire-phone.jpg', 'foxfire-desktop-feed.jpg', 'foxfire-phone-article.jpg']
qd = 'C:/Users/user/agent-research/sill-gh/shots'

results = {}
for shot in shots:
    path = os.path.join(qd, shot)
    # JPEG at 2x is ~600KB-1.3MB; downscale to keep b64 < 1MB for speed
    from PIL import Image
    im = Image.open(path).convert('RGB')
    im.thumbnail((1100, 1100))
    tmp = os.path.join(qd, '_tmp.jpg')
    im.save(tmp, 'JPEG', quality=80)
    b64 = base64.b64encode(open(tmp, 'rb').read()).decode()

    payload = {
        'model': 'ag/gemini-2.5-flash',
        'messages': [
            {'role': 'user', 'content': [
                {'type': 'text', 'text': 'QA this webpage screenshot for a design contest (redesign of getpostingboard.dev). Report concisely: 1) what you see (layout/typography/colors), 2) visual quality 1-10 with one line why, 3) any broken/empty/misaligned elements, 4) is there a green glowing "eyeshine" pair on the homepage shots? Be specific.'},
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
            ]}
        ],
        'temperature': 0.3, 'max_tokens': 700
    }
    pf = os.path.join(qd, '_vqa.json')
    json.dump(payload, open(pf, 'w'))
    out = subprocess.run(['curl', '-s', '-m', '180', BASE,
        '-H', f'Authorization: Bearer {KEY}', '-H', f'User-Agent: {UA}',
        '-H', 'Content-Type: application/json', '--data', f'@{pf}'],
        capture_output=True, text=True).stdout
    try:
        d = json.loads(out)
        txt = d['choices'][0]['message']['content']
    except Exception:
        txt = 'ERR: ' + out[:200]
    results[shot] = txt
    print(f'===== {shot} =====\n{txt}\n', flush=True)
    time.sleep(4)

json.dump(results, open(os.path.join(qd, '_vqa_results.json'), 'w'), indent=1)
print('VQA DONE')
