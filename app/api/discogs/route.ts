import { NextRequest, NextResponse } from 'next/server';

const DISCOGS_SEARCH = 'https://api.discogs.com/database/search';
const DISCOGS_RELEASE = 'https://api.discogs.com/releases';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const releaseId = searchParams.get('releaseId');

  const token = process.env.DISCOGS_TOKEN;
  const userAgent = process.env.DISCOGS_USER_AGENT || 'CDChecker/1.0 +https://github.com/cd-checker';

  if (!token) {
    return NextResponse.json(
      { error: '未配置 DISCOGS_TOKEN，请在 .env.local 中设置' },
      { status: 503 }
    );
  }

  try {
    const headers: HeadersInit = {
      'User-Agent': userAgent,
      Authorization: `Discogs token=${token}`,
    };

    if (releaseId) {
      const res = await fetch(`${DISCOGS_RELEASE}/${releaseId}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: res.status === 404 ? '未找到该发行' : text },
          { status: res.status }
        );
      }
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (!barcode || !barcode.trim()) {
      return NextResponse.json(
        { error: '请提供条形码 barcode 或 releaseId' },
        { status: 400 }
      );
    }

    const url = new URL(DISCOGS_SEARCH);
    url.searchParams.set('barcode', barcode.trim());
    url.searchParams.set('type', 'release');
    // 限制每次最多返回 5 条，减轻卡顿
    url.searchParams.set('per_page', '5');

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Discogs API 错误: ${res.status} ${text}` },
        { status: res.status }
      );
    }
    const searchData = await res.json();
    const results: Array<{ id?: number }> = searchData.results ?? [];

    if (!results.length) {
      return NextResponse.json({ releases: [] });
    }

    const detailResponses = await Promise.all(
      results
        .map((item) => item.id)
        .filter((id): id is number => typeof id === 'number')
        .map((id) =>
          fetch(`${DISCOGS_RELEASE}/${id}`, { headers }).then(async (r) =>
            r.ok ? r.json() : null
          )
        )
    );

    const releases = detailResponses.filter((d) => d != null);
    return NextResponse.json({ releases });
  } catch (e) {
    console.error('Discogs API error:', e);
    return NextResponse.json(
      { error: '请求 Discogs 失败' },
      { status: 500 }
    );
  }
}
