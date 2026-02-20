import os
import json
import re
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

app = Flask(__name__)

DISCOGS_SEARCH = 'https://api.discogs.com/database/search'
DISCOGS_RELEASE = 'https://api.discogs.com/releases'

IFPI_DB = {}
_ifpi_path = os.path.join(os.path.dirname(__file__), 'data', 'ifpi_db.json')
try:
    with open(_ifpi_path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
        if isinstance(raw, dict):
            # Normalize keys: allow both "IFPI 01" and "01"
            for k, v in raw.items():
                if not isinstance(k, str) or not isinstance(v, dict):
                    continue
                nk = k.strip().upper()
                if nk.startswith('IFPI '):
                    nk = nk.replace('IFPI ', '', 1).strip()
                IFPI_DB[nk] = v
except FileNotFoundError:
    IFPI_DB = {}
except Exception:
    IFPI_DB = {}


def _extract_ifpi_code(value: str) -> str | None:
    if not value:
        return None
    m = re.search(r'\bIFPI\s*([A-Z0-9]{2,6})\b', value.upper())
    if not m:
        return None
    return m.group(1)


def _lookup_ifpi(code: str):
    if not code:
        return None
    c = code.strip().upper()
    # Try most specific first, then fallback to prefix matches
    for key in (c, c[:4], c[:3], c[:2]):
        if key and key in IFPI_DB:
            return IFPI_DB[key]
    return None


def _augment_identifiers(identifiers):
    if not identifiers or not isinstance(identifiers, list):
        return identifiers

    for item in identifiers:
        if not isinstance(item, dict):
            continue
        v = item.get('value', '')
        code = _extract_ifpi_code(v)
        if not code:
            continue

        # Filter out pseudo-information (e.g., descriptions starting with "IFPI")
        if v.strip().upper() == f"IFPI {code.upper()}":
            # This is a clean code entry, proceed
            pass
        elif v.strip().upper().startswith("IFPI"):
            # If it's something like "IFPI 1234 (text)", it's fine,
            # but if the whole value is just a generic descriptor, we might want to be careful.
            # For now, we trust _extract_ifpi_code to get the code.
            pass

        info = _lookup_ifpi(code)
        if not info:
            continue

        factory = (info.get('factory') or '').strip()
        country = (info.get('country') or '').strip()

        # Basic filtering to ensure it's not a reference to another IFPI code
        if not factory or factory.upper().startswith('IFPI '):
            continue

        item['factory_info'] = f'{factory}, {country}' if country else factory

    return identifiers



def discogs_headers():
    token = os.getenv('DISCOGS_TOKEN', '')
    user_agent = os.getenv('DISCOGS_USER_AGENT', 'CDChecker/1.0 +https://github.com/cd-checker')
    return {
        'User-Agent': user_agent,
        'Authorization': f'Discogs token={token}',
    }


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/discogs')
def discogs():
    token = os.getenv('DISCOGS_TOKEN', '')
    if not token:
        return jsonify({'error': '未配置 DISCOGS_TOKEN，请在 .env 中设置'}), 503

    barcode = request.args.get('barcode', '').strip()
    release_id = request.args.get('releaseId', '').strip()
    headers = discogs_headers()

    try:
        if release_id:
            r = requests.get(f'{DISCOGS_RELEASE}/{release_id}', headers=headers, timeout=10)
            if not r.ok:
                msg = '未找到该发行' if r.status_code == 404 else r.text
                return jsonify({'error': msg}), r.status_code
            payload = r.json()
            if isinstance(payload, dict) and payload.get('identifiers'):
                payload['identifiers'] = _augment_identifiers(payload.get('identifiers'))
            return jsonify(payload)

        if not barcode:
            return jsonify({'error': '请提供条形码 barcode 或 releaseId'}), 400

        page = int(request.args.get('page', 1) or 1)
        params = {
            'barcode': barcode,
            'type': 'release',
            'per_page': 50,
            'page': page,
        }
        r = requests.get(DISCOGS_SEARCH, params=params, headers=headers, timeout=10)
        if not r.ok:
            return jsonify({'error': f'Discogs API 错误: {r.status_code} {r.text}'}), r.status_code

        data = r.json()
        return jsonify({
            'releases': data.get('results', []),
            'pagination': data.get('pagination'),
        })

    except requests.RequestException as e:
        return jsonify({'error': f'请求 Discogs 失败: {str(e)}'}), 500


@app.route('/api/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': '未收到文件'}), 400
    f = request.files['file']
    if not f or f.filename == '':
        return jsonify({'error': '文件名为空'}), 400

    try:
        from pyzbar.pyzbar import decode
    except Exception:
        return jsonify({'error': '服务端缺少条形码识别依赖（libzbar），请联系管理员安装后重试'}), 503

    try:
        image = Image.open(f.stream)
    except Exception:
        return jsonify({'error': '未能从图片中正确识别条形码，请尝试手动输入'}), 400

    try:
        decoded = decode(image)
    except Exception:
        return jsonify({'error': '未能从图片中正确识别条形码，请尝试手动输入'}), 400

    if not decoded:
        return jsonify({'error': '未能从图片中正确识别条形码，请尝试手动输入'}), 400

    barcode_digits = None
    for item in decoded:
        if getattr(item, 'type', '') in ('EAN13', 'EAN8', 'UPCA', 'UPCE', 'CODE128', 'CODE39', 'ITF'):
            try:
                barcode_digits = item.data.decode('utf-8', errors='ignore').strip()
            except Exception:
                barcode_digits = None
            if barcode_digits:
                break

    if not barcode_digits:
        try:
            barcode_digits = decoded[0].data.decode('utf-8', errors='ignore').strip()
        except Exception:
            barcode_digits = None

    if not barcode_digits or not any(ch.isdigit() for ch in barcode_digits):
        return jsonify({'error': '未能从图片中正确识别条形码，请尝试手动输入'}), 400

    return jsonify({'barcode': barcode_digits})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
