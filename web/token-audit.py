import re
import glob

defined = set()
for f in ['src/app/globals.css'] + glob.glob('src/styles/*.css'):
    with open(f, encoding='utf8') as fh:
        for m in re.finditer(r'(--[\w-]+)\s*:', fh.read()):
            defined.add(m.group(1))

used = {}
for f in ['src/app/globals.css'] + glob.glob('src/styles/*.css'):
    with open(f, encoding='utf8') as fh:
        for m in re.finditer(r'var\((--[\w-]+)', fh.read()):
            short = f.replace('\\', '/').split('/')[-1]
            used.setdefault(m.group(1), set()).add(short)

missing = {k: sorted(v) for k, v in used.items() if k not in defined}
print("UNDEFINED NOW:", missing if missing else "NONE — all tokens resolve")
