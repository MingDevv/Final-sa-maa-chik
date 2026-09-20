// Abstraction สำหรับจัดเก็บไฟล์ (PDF / รูปภาพ / ภาพกระดานเขียน)
// ตอนพัฒนาใช้ LocalStorageProvider เก็บในโฟลเดอร์ ./uploads
// ภายหลังตั้ง STORAGE_DRIVER=s3 + S3_* env จะสลับไป S3-compatible storage ได้ทันที

export interface StoredFile {
  key: string;
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  readonly driver: "local" | "s3";
  /** บันทึกไฟล์ binary แล้วคืน storage key */
  save(data: Buffer, opts: { prefix?: string; mimeType: string; fileName?: string }): Promise<StoredFile>;
  /** อ่านไฟล์เป็น Buffer (สำหรับ stream ผ่าน API) */
  read(key: string): Promise<Buffer>;
  /** URL สำหรับเข้าถึงไฟล์แบบ sync (local = route, s3 = public base URL) */
  getUrl(key: string): string;
  /** URL แบบ presigned สำหรับ provider ที่รองรับ (ใช้เมื่อไฟล์ต้องเข้าถึงแบบเร่งความเร็ว) */
  getPresignedUrl?(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

/** สร้าง key ที่ปลอดภัยจากชื่อไฟล์ */
export const buildStorageKey = (
  prefix: string,
  fileName: string,
): string => {
  const safe = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-80);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}/${stamp}-${rand}-${safe || "file"}`;
};
