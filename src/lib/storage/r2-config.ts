/**
 * Cloudflare R2 Storage Configuration
 * Specialized for StitchCraft Ghana
 */

import { S3Client } from '@aws-sdk/client-s3';

export interface R2Config {
  buckets: {
    storage: string;
    exports: string;
  };
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  region: string; // R2 uses 'auto' as region
  publicUrl?: string; // Public URL for browser access (e.g., https://pub-xyz123.r2.dev)
}

/**
 * Load R2 configuration from environment variables
 */
export function loadR2Config(): R2Config {
  const requiredVars = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  };

  // Validate required environment variables
  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required R2 environment variables: ${missing.join(', ')}`);
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    buckets: {
      storage: process.env.R2_BUCKET_NAME || process.env.R2_STORAGE_BUCKET || 'stitch-craft-storage',
      exports: process.env.R2_BUCKET_NAME || process.env.R2_EXPORT_BUCKET || 'stitch-craft-exports',
    },
    endpoint,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    accountId,
    region: 'auto', // R2 uses 'auto' as region
    publicUrl: process.env.R2_PUBLIC_URL, // Optional public URL
  };
}

/**
 * Create R2 S3 client
 */
export function createR2Client(config?: R2Config): S3Client {
  const r2Config = config || loadR2Config();

  return new S3Client({
    region: r2Config.region,
    endpoint: r2Config.endpoint,
    credentials: {
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
    },
  });
}

/**
 * Storage configuration singleton
 */
let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = createR2Client();
  }
  return r2Client;
}

/**
 * Get bucket name by type
 */
export function getBucketName(type: 'storage' | 'exports'): string {
  const config = loadR2Config();
  return config.buckets[type];
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  try {
    loadR2Config();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public URL for a file via custom domain
 */
export function getPublicUrl(key: string): string {
  const config = loadR2Config();

  if (!config.publicUrl) {
    throw new Error('R2_PUBLIC_URL must be configured in environment variables');
  }

  // Ensure publicUrl starts with https:// protocol
  let baseUrl = config.publicUrl;
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }

  // Return public URL
  return `${baseUrl}/${key}`;
}
