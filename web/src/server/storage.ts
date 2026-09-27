// Exported films live in S3 (the animate-worker IAM user can only reach this one bucket). Downloads are short-lived
// presigned links, handed out only after an ownership check (api/runs/[id]/download).
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'node:fs';

export const s3Enabled = () => !!(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

let client: S3Client | null = null;
const s3 = () => (client ||= new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID!, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! },
}));

// upload a local file; returns the reference stored in renders.file ("s3://<key>")
export async function putFile(key: string, localPath: string, contentType = 'video/mp4'): Promise<string> {
  await s3().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: readFileSync(localPath), ContentType: contentType }));
  return `s3://${key}`;
}

export async function signedUrl(ref: string, opts: { download?: string; expiresIn?: number } = {}): Promise<string> {
  const key = ref.replace(/^s3:\/\//, '');
  return getSignedUrl(s3(), new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!, Key: key,
    ...(opts.download ? { ResponseContentDisposition: `attachment; filename="${opts.download.replace(/"/g, '')}"` } : {}),
  }), { expiresIn: opts.expiresIn ?? 3600 });
}

export async function putBuffer(key: string, body: Buffer, contentType: string, cacheControl?: string) {
  await s3().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key, Body: body, ContentType: contentType, ...(cacheControl ? { CacheControl: cacheControl } : {}) }));
}
export async function getBuffer(key: string): Promise<Buffer | null> {
  try {
    const r = await s3().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }));
    return Buffer.from(await r.Body!.transformToByteArray());
  } catch (e) {
    if ((e as { name?: string }).name === 'NoSuchKey') return null;
    throw e;
  }
}
export async function exists(key: string): Promise<boolean> {
  try { await s3().send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key })); return true; }
  catch (e) { if ((e as { name?: string }).name === 'NotFound' || (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false; throw e; }
}
