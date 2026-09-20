import type { IStorageProvider } from "./types";
import { LocalStorageProvider } from "./local-storage";
import { S3StorageProvider } from "./s3-storage";

let provider: IStorageProvider | null = null;

/** เลือก storage provider จาก env (ค่าเริ่มต้น: local) */
export const getStorage = (): IStorageProvider => {
  if (!provider) {
    provider =
      process.env.STORAGE_DRIVER === "s3"
        ? new S3StorageProvider()
        : new LocalStorageProvider();
  }
  return provider;
};
