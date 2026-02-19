/* =====================
   State
   ===================== */
let barcodeValue = '';
let allReleases = [];
let filteredReleases = [];
let countryFilter = 'All';
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

/* =====================
   DOM refs
   ===================== */
const barcodeInput = document.getElementById('barcodeInput');
const searchBtn = document.getElementById('searchBtn');
const errorEl = document.getElementById('error');
const resultsSection = document.getElementById('resultsSection');
const resultsEl = document.getElementById('results');
const paginationEl = document.getElementById('pagination');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const filterList = document.getElementById('filterList');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewWrap = document.getElementById('previewWrap');
const previewImg = document.getElementById('previewImg');
const uploadedBadge = document.getElementById('uploadedBadge');
const clearBtn = document.getElementById('clearBtn');

/* =====================
   Helpers
   ===================== */
function normalizedCountry(c) {
    return c && c.trim() ? c.trim() : 'Unknown';
}

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = msg ? '' : 'none';
}

function setLoading(state) {
    isLoading = state;
    searchBtn.disabled = state;
    searchBtn.textContent = state ? '查询中…' : '查询';
}

function groupIdentifiers(identifiers) {
    if (!identifiers || !identifiers.length) return [];
    // 先按 variant 拆分
    const groups = {};
    const variants = [];

    identifiers.forEach(id => {
        const type = id.type.toLowerCase();
        const value = id.value;
        // 允许 Variant 1/2/3...，否则全部归为 Standard
        const variantMatch = id.type.match(/\((Variant\s*\d+)\)/i);
        const variantLabel = variantMatch ? variantMatch[1] : 'Standard';

        if (!groups[variantLabel]) {
            groups[variantLabel] = [];
            variants.push(variantLabel);
        }

        // 只收集 matrix/IFPI 相关类型
        if (
            type.includes('matrix / runout') ||
            type.includes('mastering sid code') ||
            type.includes('mould sid code') ||
            type.includes('ifpi')
        ) {
            groups[variantLabel].push({
                type: id.type,
                value: value
            });
        }
    });

    // 进一步将同一 variant 下的多组 matrix/IFPI 组合分组
    // 例如：matrix/outerSID/innerSID 顺序出现，遇到下一个 matrix/outerSID/innerSID 就新开一组
    const result = [];
    variants.forEach((variant, vIdx) => {
        const items = groups[variant];
        if (!items.length) return;
        let current = { label: variants.length > 1 ? `组合 ${vIdx + 1}` : '', matrix: '', outerSID: '', innerSID: '' };
        items.forEach((item, idx) => {
            const t = item.type.toLowerCase();
            if (t.includes('matrix / runout')) {
                // 如果当前已有 matrix，说明是新一组
                if (current.matrix || current.outerSID || current.innerSID) {
                    result.push(current);
                    current = { label: variants.length > 1 ? `组合 ${vIdx + 1}` : '', matrix: '', outerSID: '', innerSID: '' };
                }
                current.matrix = item.value;
            } else if (t.includes('mastering sid code') || t.includes('ifpi l')) {
                current.outerSID = item.value;
            } else if (t.includes('mould sid code') || t.includes('ifpi 9') || t.includes('ifpi 94') || t.includes('ifpi a')) {
                current.innerSID = item.value;
            }
        });
        // 最后一组
        if (current.matrix || current.outerSID || current.innerSID) {
            result.push(current);
        }
    });
    return result;
}

/* =====================
   Render
   ===================== */
function buildCountryCounts() {
    const counts = {};
    allReleases.forEach(r => {
        const key = normalizedCountry(r.country);
        counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([country, count]) => ({ country, count }));
}

function applyFilter() {
    filteredReleases = countryFilter === 'All'
        ? allReleases
        : allReleases.filter(r => normalizedCountry(r.country) === countryFilter);
    renderCards();
    renderFilterList();
}

function renderFilterList() {
    const options = buildCountryCounts();
    let html = `
    <button class="filterItem ${countryFilter === 'All' ? 'filterItemActive' : ''}" data-country="All">
      <span>All</span>
      <span class="filterCount">${allReleases.length}</span>
    </button>
  `;
    options.forEach(({ country, count }) => {
        html += `
      <button class="filterItem ${countryFilter === country ? 'filterItemActive' : ''}" data-country="${escHtml(country)}">
        <span>${escHtml(country)}</span>
        <span class="filterCount">${count}</span>
      </button>
    `;
    });
    filterList.innerHTML = html;
    filterList.querySelectorAll('.filterItem').forEach(btn => {
        btn.addEventListener('click', () => {
            countryFilter = btn.dataset.country;
            applyFilter();
        });
    });
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCards() {
    if (!filteredReleases.length) {
        resultsEl.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem 0;">暂无结果</p>';
        return;
    }
        resultsEl.innerHTML = filteredReleases.map(r => `
        <div class="card" data-id="${r.id}">
            <div class="cardThumb">
                ${r.cover_image || r.thumb
                        ? `<img src="${escHtml(r.cover_image || r.thumb)}" alt="${escHtml(r.title)}" loading="lazy" />`
                        : `<div class="noArt">无封面</div>`}
            </div>
            <div class="cardBody">
                <h3 class="cardTitle">${escHtml(r.title)}</h3>
                <div class="detailMetaRow">
                    ${r.year ? `<span class="cardYear cardMetaHighlight">${r.year}</span>` : ''}
                    <span class="cardMeta cardMetaHighlight">${escHtml(normalizedCountry(r.country))}</span>
                </div>
            </div>
        </div>
    `).join('');

    resultsEl.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => openModal(Number(card.dataset.id)));
    });
}

function renderPagination() {
    if (totalPages <= 1) {
        paginationEl.style.display = 'none';
        return;
    }
    paginationEl.style.display = '';
    pageInfo.textContent = `第 ${currentPage} / ${totalPages} 页`;
    prevBtn.disabled = isLoading || currentPage <= 1;
    nextBtn.disabled = isLoading || currentPage >= totalPages;
}

/* =====================
   Fetch releases
   ===================== */
async function fetchReleases(targetPage) {
    const q = barcodeValue.trim();
    if (!q) { showError('请输入条形码'); return; }
    showError('');
    setLoading(true);
    try {
        const res = await fetch(`/api/discogs?barcode=${encodeURIComponent(q)}&page=${targetPage}`);
        const data = await res.json();
        if (!res.ok) { showError(data.error || '请求失败'); return; }

        const list = data.releases || [];
        if (!list.length) {
            showError('未找到匹配的专辑');
            allReleases = [];
            filteredReleases = [];
            resultsSection.style.display = 'none';
            return;
        }

        allReleases = list;
        currentPage = data.pagination?.page ?? targetPage;
        totalPages = data.pagination?.pages ?? 1;
        countryFilter = 'All';
        applyFilter();
        renderPagination();
        resultsSection.style.display = '';
    } finally {
        setLoading(false);
    }
}

/* =====================
   Modal
   ===================== */
async function openModal(id) {
    modalOverlay.style.display = '';
    modalBody.innerHTML = '<div class="modalLoading">正在加载详情...</div>';

    try {
        const res = await fetch(`/api/discogs?releaseId=${id}`);
        const data = await res.json();
        if (!res.ok) {
            modalBody.innerHTML = `<div class="modalLoading">${escHtml(data.error || '获取详情失败')}</div>`;
            return;
        }
        renderModal(data);
    } catch {
        modalBody.innerHTML = '<div class="modalLoading">网络错误</div>';
    }
}

function renderModal(r) {
    const imgSrc = (r.images && r.images[0]?.uri) || r.cover_image || r.thumb;
    const groups = groupIdentifiers(r.identifiers);

    const artistsHtml = r.artists?.length
        ? `<p class="detailArtists">${escHtml(r.artists.map(a => a.name).join(', '))}</p>` : '';

    const labelsHtml = r.labels?.length
        ? `<p class="detailMeta">厂牌：${escHtml(r.labels.map(l => l.name).join(', '))}</p>` : '';

    const barcodeHtml = r.barcode?.length
        ? `<p class="detailMeta">条形码：${escHtml(r.barcode.join(', '))}</p>` : '';

    const groupsHtml = groups.length > 0 ? groups.map((g, i) => `
        <div class="variantGroup">
            ${g.label ? `<div class="variantTitle">${escHtml(g.label)}</div>` : ''}
            <ul class="matrixList">
                ${g.matrix ? `<li><span class="metaLabel">Matrix 编码：</span>${escHtml(g.matrix)}</li>` : ''}
                ${g.outerSID ? `<li><span class="metaLabel">外圈码：</span>${escHtml(g.outerSID)}</li>` : ''}
                ${g.innerSID ? `<li><span class="metaLabel">内圈码：</span>${escHtml(g.innerSID)}</li>` : ''}
            </ul>
        </div>
    `).join('') : '<div class="variantGroup"><span>无 Matrix/SID 信息</span></div>';

    modalBody.innerHTML = `
    <div class="detail detailFlex">
      <div class="detailCol detailColMain">
        <div class="detailMainRow">
          <div class="detailArt">
            ${imgSrc
                ? `<img src="${escHtml(imgSrc)}" alt="${escHtml(r.title)}" />`
                : `<div class="noArt">无封面</div>`}
          </div>
          <div class="detailInfo">
            <h2 class="detailTitle">${escHtml(r.title)}</h2>
            ${artistsHtml}
            <p class="detailMetaRow">
              ${r.year ? `<span class="detailMeta">年份：${r.year}</span>` : ''}
              <span class="detailMeta">国家/地区：${escHtml(normalizedCountry(r.country))}</span>
            </p>
            ${labelsHtml}
            ${barcodeHtml}
          </div>
        </div>
      </div>
      <div class="detailCol detailColMatrix">
        <div class="matrixBlock">
          <div class="matrixBlockTitle">盘面码</div>
          ${groupsHtml}
        </div>
        <div class="modalFooter">
          <a href="https://www.discogs.com/release/${r.id}" target="_blank" rel="noopener noreferrer" class="discogsLink">
            在 Discogs 上查看详情
          </a>
        </div>
      </div>
    </div>
  `;
}

function closeModal() {
    modalOverlay.style.display = 'none';
    modalBody.innerHTML = '';
}

/* =====================
   Upload
   ===================== */
function handleFile(file) {
    if (!file) {
        previewWrap.style.display = 'none';
        uploadPlaceholder.style.display = '';
        uploadedBadge.style.display = 'none';
        return;
    }
    if (!file.type.startsWith('image/')) {
        showError('请选择图片文件');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        previewImg.src = reader.result;
        previewWrap.style.display = '';
        uploadPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('file', file);
    fetch('/api/upload', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => { if (data.url) uploadedBadge.style.display = ''; })
        .catch(() => showError('上传失败'));
}

/* =====================
   Event Listeners
   ===================== */
searchBtn.addEventListener('click', () => {
    barcodeValue = barcodeInput.value;
    allReleases = [];
    filteredReleases = [];
    currentPage = 1;
    totalPages = 1;
    resultsSection.style.display = 'none';
    fetchReleases(1);
});

barcodeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) fetchReleases(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) fetchReleases(currentPage + 1);
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

fileInput.addEventListener('change', e => handleFile(e.target.files?.[0] ?? null));

clearBtn.addEventListener('click', () => {
    handleFile(null);
    fileInput.value = '';
});

uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('dragOver');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragOver'));

uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragOver');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});
