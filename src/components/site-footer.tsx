import { Heart } from "lucide-react";

/** ข้อความที่วิ่งในแถบเครดิต — แก้ตรงนี้ที่เดียว */
const ITEMS = [
  "By Ming",
  "Final-sa-maa-chik",
  "ติวสอบปลายภาค ม.4",
  "ทำโจทย์ทุกวัน คะแนนขึ้นจริง",
  "By Ming",
  "สู้ ๆ นะทุกคน",
];

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((t, i) => (
        <li key={i} className="flex items-center gap-6 px-6 text-sm font-medium">
          <span className={t === "By Ming" ? "font-bold text-primary" : "text-muted-foreground"}>{t}</span>
          <Heart className="h-3.5 w-3.5 fill-primary/70 text-primary/70" aria-hidden />
        </li>
      ))}
    </ul>
  );
}

/** footer: แถบเครดิตตัวหนังสือวิ่ง (หยุดเมื่อเอาเมาส์ชี้ / ไม่วิ่งถ้าตั้งค่าลดการเคลื่อนไหว) */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="marquee overflow-hidden py-4" aria-label="เครดิต: เว็บนี้ทำโดย Ming">
        <div className="marquee-track">
          <Row />
          <Row hidden />
        </div>
      </div>
      <p className="pb-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Final-sa-maa-chik · Made with{" "}
        <Heart className="inline h-3 w-3 fill-primary text-primary" aria-label="ความรัก" /> by{" "}
        <span className="font-semibold text-foreground">Ming</span>
      </p>
    </footer>
  );
}
