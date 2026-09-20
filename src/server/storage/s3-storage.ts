import type { IStorageProvider, StoredFile } from "./types";
import { buildStorageKey } from "./types";

/**
 * S3-compatible provider (AWS S3 / MinIO / Cloudflare R2 ฯลฯ)
 * เปิดใช้เมื่อตั้ง STORAGE_DRIVER=s3 พร้อม env:
 * S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 * และ S3_PUBLIC_BASE (URL สาธารณะของ bucket สำหรับเสิร์ฟไฟล์)
 * หมายเหตุ: ต้องติดตั้ง @aws-sdk/client-s3 และ @aws-sdk/s3-request-presigner เพิ่มเมื่อใช้จริง
 */
export class S3StorageProvider implements IStorageProvider {
  readonly driver = "s3" as const;

  private readonly bucket = process.env.S3_BUCKET;
  private readonly region = process.env.S3_REGION;
  private readonly endpoint = process.env.S3_ENDPOINT;

  private async client() {
    if (!this.bucket || !this.region) {
      throw new Error(
        "ยังไม่ได้ตั้งค่า S3 (S3_BUCKET / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY)",
      );
    }
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: Boolean(this.endpoint),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async save(
    data: Buffer,
    opts: { prefix?: string; mimeType: string; fileName?: string },
  ): Promise<StoredFile> {
    const key = buildStorageKey(opts.prefix ?? "files", opts.fileName ?? "file.bin");
    const client = await this.client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: opts.mimeType,
      }),
    );
    return { key, size: data.byteLength, mimeType: opts.mimeType };
  }

  async read(key: string): Promise<Buffer> {
    const client = await this.client();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error(`อ่านไฟล์ไม่สำเร็จ: ${key}`);
    return Buffer.from(bytes);
  }

  /** URL แบบ sync — ใช้ public base URL ที่ตั้งไว้ใน S3_PUBLIC_BASE */
  getUrl(key: string): string {
    const base = process.env.S3_PUBLIC_BASE;
    if (!base) {
      throw new Error("ตั้ง S3_PUBLIC_BASE (URL สาธารณะของ bucket) เพื่อเสิร์ฟไฟล์จาก S3");
    }
    return `${base.replace(/\/$/, "")}/${key}`;
  }

  /** presigned URL (หมดอายุ 1 ชม.) สำหรับกรณี bucket ไม่เปิดสาธารณะ */
  async getPresignedUrl(key: string): Promise<string> {
    const client = await this.client();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 3600 },
    );
  }

  async delete(key: string): Promise<void> {
    const client = await this.client();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
