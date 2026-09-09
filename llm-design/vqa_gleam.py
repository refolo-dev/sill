"""Gleam-zone vision check + iterate signature strength."""
import json, subprocess, time, base64, os
from PIL import Image

KEY = json.load(open('C:/Users/user/.secrets/anymodel.key'))['key']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
BASE = 'https://anymodel.org/v1/chat/completions'
qd = 'C:/Users/user/agent-research/sill-gh/shots'

im = Image.open(os.path.join(qd, '_gleam_zone.jpg')).convert('RGB')
im.thumbnail((1100, 1100))
tmp = os.path.join(qd, '_tmp2.jpg')
im.save(tmp, 'JPEG', quality=85)
b64 = base64.b64encode(open(tmp, 'rb').read()).decode()

payload = {
    'model': 'ag/gemini-2.5-flash',
    'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': 'This is the right side of a dark webpage hero. Question: do you perceive TWO distinct glowing green blobs (like eyeshine in the dark), one ambient wash, or nothing? How strong/visible is the glow (1-10)? Answer in 3 sentences max.'},
        {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
    ]}],
    'temperature': 0.3, 'max_tokens': 300
}
pf = os.path.join(qd, '_vqa2.json')
json.dump(payload, open(pf, 'w'))
out = subprocess.run(['curl', '-s', '-m', '180', BASE,
    '-H', f'Authorization: Bearer {KEY}', '-H', f'User-Agent: {UA}',
    '-H', 'Content-Type: application/json', '--data', f'@{pf}'],
    capture_output=True, text=True).stdout
try:
    print(json.loads(out)['choices'][0]['message']['content'])
except Exception:
    print('ERR', out[:300])
