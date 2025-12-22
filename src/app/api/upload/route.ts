import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/direct-current-user';
import { isR2Configured } from '@/lib/storage/r2-config';
import { getR2StorageAdapter } from '@/lib/storage/r2-storage-adapter';

// Local storage fallback helper
async function saveToLocalStorage(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (_e) {
    // Ignore if already exists
  }

  // Generate unique filename
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const originalName = file.name || 'image.jpg';
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${folder}-${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // Allow TAILOR, SEAMSTRESS, or CLIENT
    if (user.role !== 'TAILOR' && user.role !== 'SEAMSTRESS' && user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = ((formData.get('folder') as string) || 'portfolio') as any;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Try R2 first, fall back to local storage if it fails
    if (isR2Configured()) {
      try {
        const storage = getR2StorageAdapter();
        const buffer = Buffer.from(await file.arrayBuffer());

        const result = await storage.upload(user.id, folder, buffer, {
          id: 'temp',
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });

        return NextResponse.json({
          success: true,
          url: result.url,
        });
      } catch (r2Error) {
        // R2 failed (bucket doesn't exist, credentials invalid, etc.)
        // Fall back to local storage
        console.warn('R2 upload failed, falling back to local storage:', r2Error);

        const localUrl = await saveToLocalStorage(file, folder);
        return NextResponse.json({
          success: true,
          url: localUrl,
          note: 'Saved locally (R2 unavailable)',
        });
      }
    } else {
      // R2 not configured - use local storage
      console.warn('R2 not configured, using local storage');

      const localUrl = await saveToLocalStorage(file, folder);
      return NextResponse.json({
        success: true,
        url: localUrl,
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
