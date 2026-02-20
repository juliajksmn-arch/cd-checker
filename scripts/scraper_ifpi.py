import json
import re
import urllib.request
import os

URL = 'http://wiki.musik-sammler.de/index.php?title=Herstellungsland_(CDs_/_DVDs)'
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'ifpi_db.json')

# Translation map for common German terms found in the Wikipedia source
TRANSLATIONS = {
    'Deutschland': 'Germany',
    'Österreich': 'Austria',
    'Frankreich': 'France',
    'Großbritannien': 'United Kingdom',
    'Italien': 'Italy',
    'Niederlande': 'Netherlands',
    'Spanien': 'Spain',
    'Schweiz': 'Switzerland',
    'Belgien': 'Belgium',
    'Europa': 'Europe',
    'Vereinigte Staaten': 'USA',
    'Vereinigte Staaten von Amerika': 'USA',
    'Japan': 'Japan',
    'Kanada': 'Canada',
    'Australien': 'Australia',
    'Südkorea': 'South Korea',
    'Taiwan': 'Taiwan',
    'Hongkong': 'Hong Kong',
    'Singapur': 'Singapore',
    'Mexiko': 'Mexico',
    'Brasilien': 'Brazil',
    'Argentinien': 'Argentina',
    'Russland': 'Russia',
    'Polen': 'Poland',
    'Tschechien': 'Czech Republic',
    'Ungarn': 'Hungary',
    'Griechenland': 'Greece',
    'Türkei': 'Turkey',
    'Israel': 'Israel',
    'Indien': 'India',
    'China': 'China',
    'unbekannt': 'Unknown',
    'unbekanntes Land': 'Unknown Country',
}


def _clean_html(text: str) -> str:
    text = re.sub(r'<[^>]+>', '', text or '').strip()
    text = text.replace('&', '&').replace('&#160;', ' ').strip()
    text = re.sub(r'\s+', ' ', text)
    return text


def _translate(text: str) -> str:
    if not text:
        return text
    # Direct translation check
    if text in TRANSLATIONS:
        return TRANSLATIONS[text]
    # Check for partial matches or comma-separated lists
    parts = [p.strip() for p in text.split(',')]
    translated_parts = [TRANSLATIONS.get(p, p) for p in parts]
    return ', '.join(translated_parts)


def _extract_ifpi_code(text: str) -> str | None:
    if not text:
        return None
    m = re.search(r'\bIFPI\s*([A-Z0-9]{2,6})\b', text.upper())
    if not m:
        return None
    return m.group(1).strip()


def fetch_and_parse():
    print(f"Fetching {URL}...")
    req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching URL: {e}")
        return

    db = {}

    # The German Wiki uses a specific table structure
    # Typically: | Code | SID-Code | Presswerk | Land |
    row_pattern = re.compile(r'<tr[^>]*>(.*?)</tr>', re.IGNORECASE | re.DOTALL)
    td_pattern = re.compile(r'<td[^>]*>(.*?)</td>', re.IGNORECASE | re.DOTALL)

    for row in row_pattern.finditer(html):
        tds = [_clean_html(t) for t in td_pattern.findall(row.group(1))]
        if len(tds) < 3:
            continue

        ifpi_code = None
        factory = ''
        country = ''

        # The SID code is usually in the second column (index 1) if there are 4+ columns
        # Otherwise it might be in the first column (index 0)
        if len(tds) >= 4:
            ifpi_code = _extract_ifpi_code(tds[1]) or _extract_ifpi_code(tds[0])
            factory = tds[2]
            country = tds[3]
        else:
            # Fallback for 3-column layout
            ifpi_code = _extract_ifpi_code(tds[0])
            factory = tds[1]
            country = tds[2]

        if not ifpi_code:
            # Try searching all cells if still not found
            for cell in tds:
                ifpi_code = _extract_ifpi_code(cell)
                if ifpi_code:
                    break

        if not ifpi_code:
            continue

        # Translate factory and country if possible
        factory = _translate(factory)
        country = _translate(country)

        # Basic filtering of junk
        ref_words = {'REFERENZ', 'REFERENCE', 'SIEHE', 'SEE'}
        if factory.strip().upper() in ref_words:
            factory = ''
        if country.strip().upper() in ref_words:
            country = factory
            factory = ''

        key = ifpi_code.strip().upper()
        if not key:
            continue

        # Update if already exists to prefer more complete data
        if key in db:
            if not db[key]['factory'] and factory:
                db[key]['factory'] = factory
            if not db[key]['country'] and country:
                db[key]['country'] = country
        else:
            db[key] = {
                'factory': factory,
                'country': country,
            }

    if not db:
        print("Could not parse. HTML might have a different format.")
    else:
        print(f"Extracted {len(db)} entries.")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(db, f, indent=2, ensure_ascii=False)
        print(f"Saved to {OUTPUT_FILE}")


if __name__ == '__main__':
    fetch_and_parse()
