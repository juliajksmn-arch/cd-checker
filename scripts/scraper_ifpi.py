import json
import re
import urllib.request
import os

URL = 'http://wiki.musik-sammler.de/index.php?title=Herstellungsland_(CDs_/_DVDs)'
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'ifpi_db.json')

def fetch_and_parse():
    print(f"Fetching {URL}...")
    req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')

    db = {}
    
    # We are looking for rows in the tables. 
    # Example table row: <tr><td>01**</td><td>Universal M &amp; L</td><td>Deutschland</td></tr>
    # The wiki might have varying structures, but mostly <tr><td>CODE</td><td>Presswerk</td><td>Land</td>...
    
    # Let's find all rows with 3 or more td elements
    row_pattern = re.compile(r'<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*<td>(.*?)</td>', re.IGNORECASE | re.DOTALL)
    for match in row_pattern.finditer(html):
        code = re.sub(r'<[^>]+>', '', match.group(1)).strip()
        factory = re.sub(r'<[^>]+>', '', match.group(2)).strip()
        country = re.sub(r'<[^>]+>', '', match.group(3)).strip()
        
        # Clean entities
        factory = factory.replace('&amp;', '&').replace('&#160;', ' ').strip()
        country = country.replace('&amp;', '&').replace('&#160;', ' ').strip()
        code = code.replace('&amp;', '&').replace('&#160;', ' ').strip()
        
        # Many codes have '**', like '01**'. For searching prefix '01', we can store '01' as key
        # Some are just 'A01' or 'L321'
        # We will parse out the base prefix
        code_prefix = code.replace('*', '').replace('-', '').upper()
        if code_prefix:
            db[code_prefix] = {
                'factory': factory,
                'country': country
            }
            
    # Also some entries might have 4 TDs if there's comments, but 3 is enough
    if not db:
        print("Could not parse. HTML might have a different format.")
    else:
        print(f"Extracted {len(db)} entries.")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        print(f"Saved to {OUTPUT_FILE}")

if __name__ == '__main__':
    fetch_and_parse()
