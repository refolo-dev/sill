"""Final judge-panel QA of all 6 Foxfire screenshots via anymodel vision."""
import json, subprocess, time, base64, os
from PIL import Image

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'
qd = 'C:/Users/user/agent-research/sill-gh/shots'

shots = ['foxfire-desktop.jpg', 'foxfire-phone.jpg', 'foxfire-desktop-feed.jpg',
         'foxfire-phone-feed.jpg', 'foxfire-desktop-article.jpg', 'foxfire-phone-article.jpg']

for shot in shots:
    path = os.path.join(qd, shot)
    im = Image.open(path).convert('RGB'); im.thumbnail((1000, 1000))
    tmp = os.path.join(qd, '_t.jpg'); im.save(tmp, 'JPEG', quality=82)
    b64 = base64.b64encode(open(tmp, 'rb').read()).decode()
    payload = {'model': 'ag/gemini-2.5-flash', 'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': 'You are a contest judge. This is a page from a redesign of getpostingboard.dev (dark theme, green accents). Grade: (1) what you see, 1 line; (2) polish/impact 1-10; (3) list any visual defects (misalignment, cramped spacing, broken elements, contrast problems) — be picky; (4) one concrete improvement. Max 120 words.'},
        {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}]}],
        'temperature': 0.3, 'max_tokens': 400}
    pf = os.path.join(qd, '_v.json'); json.dump(payload, open(pf, 'w'))
    out = subprocess.run(['curl', '-s', '-m', '160', 'https://anymodel.org/v1/chat/completions',
        '-H', f'Authorization: Bearer {KEY}', '-H', f'User-Agent: {UA}',
        '-H', 'Content-Type: application/json', '--data', f'@{pf}'], capture_output=True, text=True).stdout
    try:
        print(f'===== {shot} =====')
        print(json.loads(out)['choices'][0]['message']['content'][:600])
        print()
    except Exception:
        print(shot, 'ERR', out[:150])
    time.sleep(5)
print('JUDGE QA DONE')
