import glob
import os
import re
import json

def parse_frontmatter(text):
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', text, re.DOTALL)
    if not match:
        return {}, text
    fm_str, body = match.group(1), match.group(2)
    
    # Simple YAML parser for our structured markdown
    fm = {}
    current_key = None
    in_sources = False
    current_source = None
    sources = []

    for line in fm_str.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith('#'):
            continue
        
        if line.startswith('sources:'):
            in_sources = True
            current_key = 'sources'
            continue

        if in_sources:
            if line.startswith('  - '):
                if current_source:
                    sources.append(current_source)
                current_source = {}
                rest = line[4:].strip()
                if ':' in rest:
                    k, v = rest.split(':', 1)
                    val = v.strip().strip('"\'')
                    if val.isdigit(): val = int(val)
                    current_source[k.strip()] = val
            elif line.startswith('    ') and current_source is not None:
                rest = line.strip()
                if ':' in rest:
                    k, v = rest.split(':', 1)
                    val = v.strip().strip('"\'')
                    if val.isdigit(): val = int(val)
                    current_source[k.strip()] = val
            elif not line.startswith(' ') and not line.startswith('\t'):
                in_sources = False
                if current_source:
                    sources.append(current_source)
                    current_source = None
                # process standard key
                if ':' in line:
                    k, v = line.split(':', 1)
                    fm[k.strip()] = v.strip().strip('"\'')
        else:
            if ':' in line:
                k, v = line.split(':', 1)
                fm[k.strip()] = v.strip().strip('"\'')

    if current_source:
        sources.append(current_source)
    if sources:
        fm['sources'] = sources

    return fm, body.strip()

topics = []
for p in sorted(glob.glob('content/**/*.md', recursive=True)):
    with open(p, encoding='utf-8') as f:
        content = f.read()
    fm, body = parse_frontmatter(content)
    
    # derive summary from first paragraph
    first_para = ''
    for para in body.split('\n\n'):
        para = para.strip()
        if para and not para.startswith('#') and not para.startswith('>'):
            first_para = para.replace('\n', ' ')
            break

    # derive keywords
    keywords = list(dict.fromkeys([w.lower() for w in re.findall(r'[a-zA-Z]{4,}', fm.get('title', '') + ' ' + first_para)]))[:10]

    topics.append({
        'id': fm.get('id', os.path.splitext(os.path.basename(p))[0]),
        'title': fm.get('title', ''),
        'journey': fm.get('journey', 'menstrual'),
        'sources': fm.get('sources', []),
        'reviewStatus': fm.get('reviewStatus', 'pending'),
        'content': body,
        'summary': first_para[:250],
        'keywords': keywords
    })

print(f'Parsed {len(topics)} topics.')
os.makedirs('src/content', exist_ok=True)
with open('src/content/data.ts', 'w', encoding='utf-8') as f:
    f.write('// Auto-generated FEMORA reviewed content library\nimport { ContentTopic } from "../types";\n\n')
    f.write('export const CONTENT_TOPICS: ContentTopic[] = ')
    f.write(json.dumps(topics, indent=2))
    f.write(';\n')

print('Wrote src/content/data.ts successfully.')
