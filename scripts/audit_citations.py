import glob
import re

files = sorted(glob.glob('content/**/*.md', recursive=True))
print(f'Total markdown files: {len(files)}')

reviewed_count = 0
pending_count = 0

for f in files:
    with open(f, encoding='utf-8') as fh:
        text = fh.read()
    
    # Extract reviewStatus
    status_match = re.search(r'reviewStatus:\s*"?([a-zA-Z]+)"?', text)
    status = status_match.group(1) if status_match else 'UNKNOWN'
    
    # Extract sources
    sources = re.findall(r'name:\s*"([^"]+)"', text)
    orgs = re.findall(r'organization:\s*"([^"]+)"', text)
    urls = re.findall(r'url:\s*"([^"]+)"', text)
    
    if status == 'reviewed':
        reviewed_count += 1
    else:
        pending_count += 1
        
    print(f"\n{f} [{status.upper()}]:")
    for s, o, u in zip(sources, orgs, urls if urls else ['N/A']*len(sources)):
        print(f"  • {s}")
        print(f"    Org: {o} | URL: {u}")

print(f"\nAudit Summary: {reviewed_count} reviewed, {pending_count} pending (Total {len(files)})")
