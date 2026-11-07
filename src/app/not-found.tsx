import Link from "next/link";
import { Archive, House, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "ไม่พบหน้า" };

/**
 * หน้า 404 ของทั้งแอป — ครอบคลุมทั้ง notFound() ที่ถูก throw ใน route ต่าง ๆ
 * (เช่น ชุดข้อสอบที่ถูกลบ/เก็บถาวร) และ URL ที่ไม่ตรงกับหน้าใดเลย
 * render ภายใน root layout จึงได้ header/footer/ธีมสว่าง-มืดเหมือนหน้าอื่น
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-14 text-center">
      <span
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl brand-tile shadow-soft"
        aria-hidden
      >
        <SearchX className="h-8 w-8" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-wine dark:text-primary">ไม่พบหน้านี้</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          ลิงก์ที่เปิดอาจไม่มีอยู่จริง หรือข้อสอบชุดนี้อาจถูกลบหรือเก็บถาวรไปแล้ว
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="rounded-2xl">
          <Link href="/">
            <House className="mr-1 h-4 w-4" aria-hidden /> กลับหน้าแรก
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/archive">
            <Archive className="mr-1 h-4 w-4" aria-hidden /> ไปคลังข้อสอบ
          </Link>
        </Button>
      </div>
    </div>
  );
}
