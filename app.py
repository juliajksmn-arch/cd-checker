import os
import requests
from flask import Flask, request, jsonify, render_template, send_from_directory
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)

DISCOGS_SEARCH = 'https://api.discogs.com/database/search'
DISCOGS_RELEASE = 'https://api.discogs.com/releases'
# Vercel's /tmp is the only writable directory in serverless functions
if os.environ.get('VERCEL'):
    UPLOAD_FOLDER = '/tmp/uploads'
else:
    UPLOAD_FOLDER = os.path.join(app.static_folder, 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


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
            return jsonify(r.json())

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
    filename = secure_filename(f.filename)
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    f.save(save_path)
    # Return the URL for the newly added route
    url = f'/uploads/{filename}'
    return jsonify({'url': url})


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
