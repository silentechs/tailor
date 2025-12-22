/**
 * Storage Adapter Interface
 * Abstraction layer for file storage (Cloudflare R2)
 */

export interface FileMetadata {
  id: string;
  filename: string;
  contentType?: string;
  size?: number;
  [key: string]: unknown;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType?: string;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface SignedUrlOptions {
  expiresIn: number; // seconds
  contentType?: string;
  contentDisposition?: string;
}

export type StitchCraftFileType =
  | 'order-photo'
  | 'client-photo'
  | 'profile-photo'
  | 'portfolio'
  | 'invoice'
  | 'export'
  | 'voice-note'
  | 'client-designs';

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /**
   * Upload a file
   */
  upload(
    tailorId: string,
    fileType: StitchCraftFileType,
    file: Buffer | File,
    metadata: FileMetadata
  ): Promise<UploadResult>;

  /**
   * Delete a file
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple files
   */
  deleteMany(keys: string[]): Promise<void>;

  /**
   * Get signed URL for download
   */
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;

  /**
   * Get signed URL for upload (for direct browser uploads)
   */
  getSignedUploadUrl(
    tailorId: string,
    fileType: StitchCraftFileType,
    filename: string,
    contentType: string,
    options?: SignedUrlOptions
  ): Promise<{ url: string; key: string }>;

  /**
   * Get file size
   */
  getFileSize(key: string): Promise<number>;

  /**
   * List files by prefix
   */
  listFiles(prefix: string, maxKeys?: number): Promise<FileInfo[]>;

  /**
   * Check if file exists
   */
  fileExists(key: string): Promise<boolean>;

  /**
   * Copy file
   */
  copyFile(sourceKey: string, destinationKey: string): Promise<void>;
}

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(key: string) {
    super(`File not found: ${key}`, 'FILE_NOT_FOUND', 404);
  }
}

export class QuotaExceededError extends StorageError {
  constructor(message: string) {
    super(message, 'QUOTA_EXCEEDED', 413);
  }
}

export class InvalidFileError extends StorageError {
  constructor(message: string) {
    super(message, 'INVALID_FILE', 400);
  }
}
