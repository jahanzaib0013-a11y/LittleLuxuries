import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client: S3Client | null = null;

export function getR2Client() {
  if (!s3Client && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string | null> {
  try {
    const client = getR2Client();
    if (!client) {
      console.warn('R2 not configured');
      return null;
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'little-luxuries-products',
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year cache for immutable assets
    });

    await client.send(command);

    return `${process.env.R2_PUBLIC_URL || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`}/${key}`;
  } catch (error) {
    console.error('R2 upload error:', error);
    return null;
  }
}

export async function getR2PublicUrl(key: string): Promise<string> {
  const baseUrl = process.env.R2_PUBLIC_URL || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return `${baseUrl}/${key}`;
}

export async function listR2Objects(prefix: string = ''): Promise<string[]> {
  try {
    const client = getR2Client();
    if (!client) return [];

    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'little-luxuries-products',
      Prefix: prefix,
    });

    const response = await client.send(command);
    return response.Contents?.map((obj) => obj.Key || '') || [];
  } catch (error) {
    console.error('R2 list error:', error);
    return [];
  }
}

export function closeR2() {
  if (s3Client) {
    s3Client.destroy();
    s3Client = null;
  }
}
