/**
 * Cloudflare R2 Storage Adapter
 * S3-compatible storage implementation for StitchCraft Ghana
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getBucketName, getPublicUrl, getR2Client } from './r2-config';
import {
  type FileInfo,
  type FileMetadata,
  FileNotFoundError,
  type SignedUrlOptions,
  type StitchCraftFileType,
  type StorageAdapter,
  StorageError,
  type UploadResult,
} from './storage-adapter';

export class R2StorageAdapter implements StorageAdapter {
  private client = getR2Client();
  private bucket = getBucketName('storage');

  /**
   * Generate storage key for file
   */
  private generateKey(
    tailorId: string,
    fileType: StitchCraftFileType,
    metadata: FileMetadata
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = metadata.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Structure: tailors/{tailorId}/{fileType}s/{id}/{timestamp}-{filename}
    const pluralFileType = fileType.endsWith('s') ? fileType : `${fileType}s`;
    return `tailors/${tailorId}/${pluralFileType}/${metadata.id}/${timestamp}-${sanitizedFilename}`;
  }

  /**
   * Ensure key starts with tailors/ prefix (security check)
   */
  private validateKey(tailorId: string, key: string): void {
    const expectedPrefix = `tailors/${tailorId}/`;
    if (!key.startsWith(expectedPrefix)) {
      throw new StorageError('Invalid file key for tailor', 'INVALID_KEY', 403);
    }
  }

  /**
   * Convert File to Buffer
   */
  private async fileToBuffer(file: File | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(file)) {
      return file;
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Upload a file to R2
   */
  async upload(
    tailorId: string,
    fileType: StitchCraftFileType,
    file: Buffer | File,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    try {
      const key = this.generateKey(tailorId, fileType, metadata);
      this.validateKey(tailorId, key);
      const buffer = await this.fileToBuffer(file);

      const contentType = metadata.contentType || 'application/octet-stream';

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          Metadata: {
            tailorId,
            fileType,
            originalName: metadata.filename,
            uploadedAt: new Date().toISOString(),
          },
        })
      );

      const url = getPublicUrl(key);

      return {
        url,
        key,
        size: buffer.length,
        contentType,
      };
    } catch (error: any) {
      console.error('R2 upload error:', error);
      throw new StorageError(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPLOAD_FAILED'
      );
    }
  }

  /**
   * Delete a file from R2
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error: any) {
      console.error('R2 delete error:', error);
      throw new StorageError(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_FAILED'
      );
    }
  }

  /**
   * Delete multiple files from R2
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const batches = [];
      for (let i = 0; i < keys.length; i += 1000) {
        batches.push(keys.slice(i, i + 1000));
      }

      for (const batch of batches) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: batch.map((key) => ({ Key: key })),
              Quiet: true,
            },
          })
        );
      }
    } catch (error: any) {
      console.error('R2 batch delete error:', error);
      throw new StorageError(
        `Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_MANY_FAILED'
      );
    }
  }

  /**
   * Get signed URL for download
   */
  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: options?.contentType,
        ResponseContentDisposition: options?.contentDisposition,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options?.expiresIn || 3600, // Default 1 hour
      });

      return url;
    } catch (error: any) {
      console.error('R2 signed URL error:', error);
      throw new StorageError(
        `Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNED_URL_FAILED'
      );
    }
  }

  /**
   * Get signed URL for upload (for direct browser uploads)
   */
  async getSignedUploadUrl(
    tailorId: string,
    fileType: StitchCraftFileType,
    filename: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<{ url: string; key: string }> {
    try {
      const key = this.generateKey(tailorId, fileType, {
        id: 'pending',
        filename,
      });
      this.validateKey(tailorId, key);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options?.expiresIn || 3600,
      });

      return { url, key };
    } catch (error: any) {
      console.error('R2 signed upload URL error:', error);
      throw new StorageError(
        `Failed to generate signed upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGNED_UPLOAD_URL_FAILED'
      );
    }
  }

  /**
   * Get file size
   */
  async getFileSize(key: string): Promise<number> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );

      return response.ContentLength || 0;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        throw new FileNotFoundError(key);
      }
      throw new StorageError(`Failed to get file size: ${error.message}`, 'GET_SIZE_FAILED');
    }
  }

  /**
   * List files by prefix
   */
  async listFiles(prefix: string, maxKeys: number = 1000): Promise<FileInfo[]> {
    try {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: maxKeys,
        })
      );

      return (response.Contents || []).map((item) => ({
        key: item.Key!,
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
        contentType: undefined,
      }));
    } catch (error: any) {
      console.error('R2 list files error:', error);
      throw new StorageError(
        `Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'LIST_FILES_FAILED'
      );
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw new StorageError(
        `Failed to check file existence: ${error.message}`,
        'FILE_EXISTS_CHECK_FAILED'
      );
    }
  }

  /**
   * Copy file
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        })
      );
    } catch (error: any) {
      console.error('R2 copy file error:', error);
      throw new StorageError(
        `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COPY_FILE_FAILED'
      );
    }
  }
}

/**
 * Singleton instance
 */
let r2StorageAdapter: R2StorageAdapter | null = null;

export function getR2StorageAdapter(): R2StorageAdapter {
  if (!r2StorageAdapter) {
    r2StorageAdapter = new R2StorageAdapter();
  }
  return r2StorageAdapter;
}
