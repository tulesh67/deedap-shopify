with open('sections/deedap-3d-hero.liquid', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# find all top: and height:
matches = re.findall(r'(?:top|height):\s*[^;}\"]+', text)
for m in matches:
    if 'px' in m:
        print(m)
