import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IStorageProvider, StoredFile } from "./types";
import { buildStorageKey } from "./types";

const ROOT = path.join(process.cwd(), "uploads");

/** เก็บไฟล์ไว้ใน ./uploads บนเครื่อง (สำหรับพัฒนา) */
export class LocalStorageProvider implements IStorageProvider {
  readonly driver = "local" as const;

  async save(
    data: Buffer,
    opts: { prefix?: string; mimeType: string; fileName?: string },
  ): Promise<StoredFile> {
    const key = buildStorageKey(opts.prefix ?? "files", opts.fileName ?? "file.bin");
    const full = path.join(ROOT, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
    return { key, size: data.byteLength, mimeType: opts.mimeType };
  }

  async read(key: string): Promise<Buffer> {
    const full = path.join(ROOT, key);
    // กัน path traversal
    if (!path.resolve(full).startsWith(path.resolve(ROOT))) {
      throw new Error("Invalid storage key");
    }
    return readFile(full);
  }

  getUrl(key: string): string {
    return `/api/files/${key
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/")}`;
  }

  async delete(key: string): Promise<void> {
    const full = path.join(ROOT, key);
    if (!path.resolve(full).startsWith(path.resolve(ROOT))) return;
    await unlink(full).catch(() => undefined);
  }
}
