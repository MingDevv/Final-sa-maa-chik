// Seed ชุดข้อสอบอังกฤษเพิ่มเติม (ชุดที่ 2, 3) — ใช้ฟังก์ชันเดียวกับที่เว็บรันเองตอนเปิดหน้าวิชา
// รัน: npm run seed:english-extra  (รันซ้ำได้ อัปเดตเฉพาะชุดที่ version ใน JSON ใหม่กว่า)
import { db } from "../src/lib/db";
import { ENGLISH_EXTRA_SETS, ensureExtraEnglishSets } from "../src/server/auto-seed-english";

async function main() {
  const subject = await db.subject.findUnique({ where: { code: "อ31101" } });
  if (!subject) throw new Error("ยังไม่มีวิชา อ31101 — รัน npm run seed:english ก่อน");
  const topic = await db.topic.findFirst({ where: { subjectId: subject.id }, orderBy: { sortOrder: "asc" } });

  await ensureExtraEnglishSets(subject.id, topic?.id ?? null);

  for (const { id, data } of ENGLISH_EXTRA_SETS) {
    const set = await db.questionSet.findFirst({
      where: { OR: [{ id }, { subjectId: subject.id, title: { path: ["th"], equals: data.title.th } }] },
      include: { _count: { select: { questions: true } } },
    });
    console.log(set ? `✅ ${data.title.th} — id ${set.id}, v${set.version}, ${set._count.questions} ข้อ` : `❌ ไม่พบ ${id}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed ไม่สำเร็จ:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
