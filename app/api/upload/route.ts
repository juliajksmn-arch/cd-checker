import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: '未选择文件' },
        { status: 400 }
      );
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Vercel 部署：使用 Blob 存储（需在 Vercel 配置 BLOB_READ_WRITE_TOKEN）
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const blob = await put(safeName, file, { access: 'public' });
      return NextResponse.json({ url: blob.url, name: file.name });
    }

    // 本地开发：写入 public/uploads（Vercel 上无 Blob 时此处会失败）
    await mkdir(UPLOAD_DIR, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOAD_DIR, safeName);
    await writeFile(filePath, buffer);
    const url = `/uploads/${safeName}`;
    return NextResponse.json({ url, name: file.name });
  } catch (e) {
    console.error('Upload error:', e);
    const message =
      process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN
        ? '当前环境未配置 Blob 存储，请在 Vercel Storage 中创建 Blob'
        : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
