'use client';

import { useState, useCallback } from 'react';
import styles from './page.module.css';

type SearchResult = {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
  resource_url: string;
  type: string;
  format?: string[];
  label?: string[];
  genre?: string[];
  style?: string[];
  country?: string;
  barcode?: string[];
};

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
  notes?: string;
  tracklist?: { position: string; title: string; duration?: string }[];
};

export default function Home() {
  const [barcode, setBarcode] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseDetail | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const onSearch = useCallback(async () => {
    const q = barcode.trim();
    if (!q) {
      setError('请输入条形码');
      return;
    }
    setError(null);
    setResults([]);
    setSelectedRelease(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/discogs?barcode=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '请求失败');
        return;
      }
      const list = data.results || [];
      setResults(list);
      if (list.length === 0) setError('未找到匹配的专辑');
    } finally {
      setLoading(false);
    }
  }, [barcode]);

  const fetchRelease = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/discogs?releaseId=${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '获取详情失败');
        return;
      }
      setSelectedRelease(data);
    } finally {
      setLoading(false);
    }
  }, []);

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

      {results.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>搜索结果</h2>
          <div className={styles.results}>
            {results.map((r) => (
              <article
                key={r.id}
                className={styles.card}
                onClick={() => fetchRelease(r.id)}
              >
                <div className={styles.cardThumb}>
                  {r.thumb || r.cover_image ? (
                    <img
                      src={r.cover_image || r.thumb}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className={styles.noArt}>无封面</div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{r.title}</h3>
                  {r.year && <span className={styles.cardYear}>{r.year}</span>}
                  {r.country && <span className={styles.cardMeta}>{r.country}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedRelease && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>专辑详情</h2>
          <div className={styles.detail}>
            <div className={styles.detailArt}>
              {selectedRelease.cover_image || selectedRelease.thumb ? (
                <img
                  src={selectedRelease.cover_image || selectedRelease.thumb}
                  alt={selectedRelease.title}
                />
              ) : (
                <div className={styles.noArt}>无封面</div>
              )}
            </div>
            <div className={styles.detailInfo}>
              <h3 className={styles.detailTitle}>{selectedRelease.title}</h3>
              {selectedRelease.artists?.length ? (
                <p className={styles.detailArtists}>
                  {selectedRelease.artists.map((a) => a.name).join(', ')}
                </p>
              ) : null}
              {selectedRelease.year && (
                <p className={styles.detailMeta}>年份：{selectedRelease.year}</p>
              )}
              {selectedRelease.country && (
                <p className={styles.detailMeta}>国家/地区：{selectedRelease.country}</p>
              )}
              {selectedRelease.formats?.length ? (
                <p className={styles.detailMeta}>
                  格式：{selectedRelease.formats.map((f) => f.name).join(', ')}
                </p>
              ) : null}
              {selectedRelease.labels?.length ? (
                <p className={styles.detailMeta}>
                  厂牌：{selectedRelease.labels.map((l) => l.name).join(', ')}
                </p>
              ) : null}
              {selectedRelease.genres?.length ? (
                <p className={styles.detailMeta}>
                  流派：{selectedRelease.genres.join(', ')}
                </p>
              ) : null}
              {selectedRelease.barcode?.length ? (
                <p className={styles.detailMeta}>
                  条形码：{selectedRelease.barcode.join(', ')}
                </p>
              ) : null}
              {selectedRelease.notes && (
                <p className={styles.detailNotes}>{selectedRelease.notes}</p>
              )}
              <a
                href={selectedRelease.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.discogsLink}
              >
                在 Discogs 上查看 →
              </a>
              {selectedRelease.tracklist?.length ? (
                <div className={styles.tracklist}>
                  <h4>曲目</h4>
                  <ol>
                    {selectedRelease.tracklist.map((t, i) => (
                      <li key={i}>
                        <span className={styles.trackPos}>{t.position}</span>
                        <span className={styles.trackTitle}>{t.title}</span>
                        {t.duration && (
                          <span className={styles.trackDur}>{t.duration}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <p>数据来自 Discogs，请遵守其 API 使用条款。</p>
      </footer>
    </main>
  );
}
