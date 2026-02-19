'use client';

import { useState, useCallback } from 'react';
import styles from './page.module.css';

type ReleaseDetail = {
  id: number;
  title: string;
  year?: number;
  artists?: { name: string; id: number }[];
  thumb?: string;
  cover_image?: string;
  resource_url: string;
  formats?: { name: string; qty: string }[];
  labels?: { name: string; catno?: string }[];
  genres?: string[];
  styles?: string[];
  country?: string;
  barcode?: string[];
  identifiers?: { type: string; value: string }[];
  images?: { type: string; uri: string; resource_url: string; uri150: string; width: number; height: number }[];
};

export default function Home() {
  const [barcode, setBarcode] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [releaseDetails, setReleaseDetails] = useState<ReleaseDetail[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [dragOver, setDragOver] = useState(false);

  // Modal states
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeRelease, setActiveRelease] = useState<ReleaseDetail | null>(null);

  const extractOuterSID = (identifiers: ReleaseDetail['identifiers'] | undefined) =>
    (identifiers ?? [])
      .filter((id) => id.type.toLowerCase().includes('mastering sid code'))
      .map((id) => id.value);

  const extractInnerSID = (identifiers: ReleaseDetail['identifiers'] | undefined) =>
    (identifiers ?? [])
      .filter((id) => id.type.toLowerCase().includes('mould sid code'))
      .map((id) => id.value);

  const extractMatrixCodes = (identifiers: ReleaseDetail['identifiers'] | undefined) =>
    (identifiers ?? [])
      .filter((id) => id.type.toLowerCase().includes('matrix / runout'))
      .map((id) => id.value);

  const fetchReleases = useCallback(
    async (targetPage: number) => {
      const q = barcode.trim();
      if (!q) {
        setError('请输入条形码');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const res = await fetch(
          `/api/discogs?barcode=${encodeURIComponent(q)}&page=${targetPage}`
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '请求失败');
          return;
        }
        const list: ReleaseDetail[] = data.releases || [];
        if (list.length === 0) {
          setError('未找到匹配的专辑');
          setReleaseDetails([]);
          setTotalPages(1);
          setPage(1);
          return;
        }

        const pagination = data.pagination as
          | { page?: number; pages?: number }
          | undefined;

        setReleaseDetails(list);
        setPage(pagination?.page ?? targetPage);
        setTotalPages(pagination?.pages ?? 1);
      } finally {
        setLoading(false);
      }
    },
    [barcode]
  );

  const fetchReleaseDetail = async (id: number) => {
    setModalLoading(true);
    setIsModalOpen(true);
    setSelectedReleaseId(id);
    setActiveRelease(null);
    try {
      const res = await fetch(`/api/discogs?releaseId=${id}`);
      const data = await res.json();
      if (res.ok) {
        setActiveRelease(data);
      } else {
        setError(data.error || '获取详情失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setModalLoading(false);
    }
  };

  const onSearch = useCallback(() => {
    setReleaseDetails([]);
    setPage(1);
    setTotalPages(1);
    setCountryFilter('All');
    void fetchReleases(1);
  }, [fetchReleases]);

  const normalizedCountry = (c?: string) => (c && c.trim() ? c.trim() : 'Unknown');

  // 现在 releaseDetails 就是所有的搜索结果（因为 per_page 设为了 50）
  const countryCounts = releaseDetails.reduce<Record<string, number>>((acc: Record<string, number>, r: ReleaseDetail) => {
    const key = normalizedCountry(r.country);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const countryOptions = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([country, count]) => ({ country, count }));

  const filteredReleaseDetails =
    countryFilter === 'All'
      ? releaseDetails
      : releaseDetails.filter((r) => normalizedCountry(r.country) === countryFilter);

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      setUploadPreview(null);
      setUploadUrl(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append('file', file);
    fetch('/api/upload', { method: 'POST', body: fd })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) setUploadUrl(data.url);
      })
      .catch(() => setError('上传失败'));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setDragOver(false), []);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>CD Checker</h1>
        <p className={styles.subtitle}>上传封面或输入条形码，从 Discogs 查询专辑信息</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>图片上传</h2>
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ''}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {uploadPreview ? (
            <div className={styles.previewWrap}>
              <img src={uploadPreview} alt="上传预览" className={styles.previewImg} />
              {uploadUrl && <span className={styles.uploadedBadge}>已上传</span>}
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => handleFile(null)}
              >
                清除
              </button>
            </div>
          ) : (
            <p className={styles.uploadHint}>拖拽图片到此处，或点击选择文件</p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>条形码查询</h2>
        <div className={styles.barcodeRow}>
          <input
            type="text"
            placeholder="输入专辑条形码（如 5012394144777）"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className={styles.barcodeInput}
          />
          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className={styles.searchBtn}
          >
            {loading ? '查询中…' : '查询'}
          </button>
        </div>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {releaseDetails.length > 0 && (
        <section className={styles.section}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.sectionTitle}>专辑查询结果</h2>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  onClick={() => void fetchReleases(page - 1)}
                  disabled={loading || page <= 1}
                >
                  上一页
                </button>
                <span>
                  第 {page} / {totalPages} 页
                </span>
                <button
                  type="button"
                  onClick={() => void fetchReleases(page + 1)}
                  disabled={loading || page >= totalPages}
                >
                  下一页
                </button>
              </div>
            )}
          </div>

          <div className={styles.resultsLayout}>
            <aside className={styles.filters}>
              <div className={styles.filterBlock}>
                <div className={styles.filterTitle}>Country</div>
                <button
                  type="button"
                  className={`${styles.filterItem} ${countryFilter === 'All' ? styles.filterItemActive : ''
                    }`}
                  onClick={() => setCountryFilter('All')}
                >
                  <span>All</span>
                  <span className={styles.filterCount}>{releaseDetails.length}</span>
                </button>
                {countryOptions.map((opt) => (
                  <button
                    key={opt.country}
                    type="button"
                    className={`${styles.filterItem} ${countryFilter === opt.country ? styles.filterItemActive : ''
                      }`}
                    onClick={() => setCountryFilter(opt.country)}
                  >
                    <span>{opt.country}</span>
                    <span className={styles.filterCount}>{opt.count}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className={styles.resultsContent}>
              <div className={styles.results}>
                {filteredReleaseDetails.map((release) => (
                  <div
                    key={release.id}
                    className={styles.card}
                    onClick={() => fetchReleaseDetail(release.id)}
                  >
                    <div className={styles.cardThumb}>
                      {release.cover_image || release.thumb ? (
                        <img
                          src={release.thumb || release.cover_image}
                          alt={release.title}
                        />
                      ) : (
                        <div className={styles.noArt}>无封面</div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{release.title}</h3>
                      <div className={styles.detailMetaRow}>
                        {release.year && (
                          <span className={styles.cardYear}>{release.year}</span>
                        )}
                        <span className={styles.cardMeta}>
                          {normalizedCountry(release.country)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setIsModalOpen(false)}>✕</button>
            <div className={styles.modalBody}>
              {modalLoading ? (
                <div className={styles.modalLoading}>正在加载详情...</div>
              ) : activeRelease ? (
                <>
                  <div className={styles.detail}>
                    <div className={styles.detailArt}>
                      {activeRelease.images && activeRelease.images.length > 0 ? (
                        <img
                          src={activeRelease.images[0].uri}
                          alt={activeRelease.title}
                        />
                      ) : activeRelease.cover_image || activeRelease.thumb ? (
                        <img
                          src={activeRelease.cover_image || activeRelease.thumb}
                          alt={activeRelease.title}
                        />
                      ) : (
                        <div className={styles.noArt}>无封面</div>
                      )}
                    </div>
                    <div className={styles.detailInfo}>
                      <h2 className={styles.detailTitle}>{activeRelease.title}</h2>
                      {activeRelease.artists?.length ? (
                        <p className={styles.detailArtists}>
                          {activeRelease.artists.map((a) => a.name).join(', ')}
                        </p>
                      ) : null}
                      <p className={styles.detailMetaRow}>
                        {activeRelease.year && (
                          <span className={styles.detailMeta}>年份：{activeRelease.year}</span>
                        )}
                        <span className={styles.detailMeta}>
                          国家/地区：{normalizedCountry(activeRelease.country)}
                        </span>
                      </p>
                      {activeRelease.labels?.length ? (
                        <p className={styles.detailMeta}>
                          厂牌：{activeRelease.labels.map((l) => l.name).join(', ')}
                        </p>
                      ) : null}
                      {activeRelease.barcode?.length ? (
                        <p className={styles.detailMeta}>
                          条形码：{activeRelease.barcode.join(', ')}
                        </p>
                      ) : null}
                      {extractOuterSID(activeRelease.identifiers).length > 0 ? (
                        <p className={styles.detailMeta}>
                          外圈码：{extractOuterSID(activeRelease.identifiers).join(', ')}
                        </p>
                      ) : null}
                      {extractInnerSID(activeRelease.identifiers).length > 0 ? (
                        <p className={styles.detailMeta}>
                          内圈码：{extractInnerSID(activeRelease.identifiers).join(', ')}
                        </p>
                      ) : null}
                      {extractMatrixCodes(activeRelease.identifiers).length > 0 ? (
                        <p className={styles.detailMeta}>
                          Matrix 编码：{extractMatrixCodes(activeRelease.identifiers).join(', ')}
                        </p>
                      ) : null}
                      <p className={styles.detailMetaRow} style={{ marginTop: '1rem' }}>
                        <a
                          href={`https://www.discogs.com/release/${activeRelease.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.discogsLink}
                        >
                          Discogs
                        </a>
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.modalLoading}>未能加载内容</div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>数据来自 Discogs，请遵守其 API 使用条款。</p>
      </footer>
    </main>
  );
}
