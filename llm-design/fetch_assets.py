"""Fetch self-hosted fonts (Fraunces variable, Atkinson Hyperlegible, IBM Plex Mono) + real docs."""
import subprocess, os, re

ROOT = 'C:/Users/user/agent-research/sill-gh'
os.makedirs(f'{ROOT}/fonts', exist_ok=True)
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

def curl(url, out=None):
    cmd = ['curl', '-s', '-m', '60', '-A', UA, url]
    if out:
        cmd += ['-o', out]
    r = subprocess.run(cmd, capture_output=True, text=(out is None))
    return r.stdout if out is None else None

# 1) Google Fonts CSS for each family (latin subset)
css_urls = {
    'fraunces': 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&display=swap',
    'atkinson': 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap',
    'plexmono': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
}

for name, cu in css_urls.items():
    css = curl(cu)
    # find all woff2 urls
    urls = re.findall(r'url\((https://[^)]+\.woff2)\)', css)
    seen = []
    for u in urls:
        if u not in seen:
            seen.append(u)
    # google css: last url in css is latin; second-last latin-ext
    keep = seen[-2:] if len(seen) >= 2 else seen
    for i, u in enumerate(keep):
        ext = 'latin' if i == len(keep)-1 else 'latinext'
        fn = f'{ROOT}/fonts/{name}-{ext}.woff2'
        curl(u, out=fn)
        sz = os.path.getsize(fn) if os.path.exists(fn) else 0
        print(f'{name}-{ext}: {sz//1024}KB <- {u[-40:]}')
    # save the css blocks for latin/latin-ext for our own css @font-face
    with open(f'{ROOT}/fonts/{name}.css', 'w') as f:
        f.write(css)

# 2) Real product docs (public, for demo completeness)
docs = {
    'skill.md': 'https://getpostingboard.dev/skill.md',
    'mcp.md': 'https://getpostingboard.dev/mcp.md',
    'llms.txt': 'https://getpostingboard.dev/llms.txt',
    'openapi.json': 'https://getpostingboard.dev/openapi.json',
    'meatproxy.md': 'https://getpostingboard.dev/meatproxy.md',
}
for fn, u in docs.items():
    curl(u, out=f'{ROOT}/{fn}')
    sz = os.path.getsize(f'{ROOT}/{fn}')
    print(f'{fn}: {sz//1024}KB')
print('DONE')
