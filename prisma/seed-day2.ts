/**
 * Seed รอบสอบวันที่ 2 — 5 วิชา + topics + เอกสารอ้างอิง (static ใน public/seed-day2)
 * ชุดวันที่ 1 ถูกย้ายเป็น ARCHIVED (ไม่ลบข้อมูลใด ๆ)
 * รัน: npm run seed:day2
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const lt = (th: string, en?: string) => ({ th, ...(en ? { en } : {}) });

const SUBJECTS = [
  {
    code: "ค31201",
    name: lt("คณิตศาสตร์เพิ่มเติม", "Additional Mathematics"),
    color: "#9F1239",
    icon: "calculator",
    topics: [
      "3.1 จำนวนจริง",
      "3.2 สมบัติของระบบจำนวนจริง",
      "3.3 พหุนามตัวแปรเดียว",
      "3.4 การแยกตัวประกอบของพหุนามตัวแปรเดียว",
      "3.5 สมการพหุนามตัวแปรเดียว",
      "3.6 เศษส่วนของพหุนาม",
      "3.7 สมการเศษส่วนของพหุนาม",
      "3.8 ช่วง",
      "3.9 อสมการพหุนามตัวแปรเดียว",
      "3.10-3.11 การแก้อสมการค่าสัมบูรณ์",
    ],
    docs: [{ key: "static-day2/algebra-blueprint.pdf", title: "The Algebra Blueprint", pages: null as number | null }],
  },
  {
    code: "ว30221",
    name: lt("เคมี 1", "Chemistry 1"),
    color: "#0D9488",
    icon: "flask-conical",
    topics: [
      "การเรียกชื่อและเขียนสูตรสารประกอบไอออนิก",
      "พลังงานกับการเกิดสารประกอบไอออนิก (Born-Haber)",
      "การละลายน้ำและการเกิดตะกอน",
      "การเรียกชื่อสารโคเวเลนต์",
      "Lewis structure, VSEPR และรูปร่างโมเลกุล",
      "พลังงานพันธะโคเวเลนต์",
      "สารโคเวเลนต์โครงผลึกร่างตาข่าย",
      "พันธะโลหะ",
      "เปรียบเทียบสมบัติของสารประกอบแต่ละชนิดพันธะ",
      "แรงระหว่างโมเลกุลของสารโคเวเลนต์",
    ],
    docs: [
      { key: "static-day2/chem-summary.pdf", title: "สรุปแนวสอบเคมี ม.4", pages: 13 },
      { key: "static-day2/chem-scope.jpg", title: "แนวข้อสอบเคมี (ภาพ)", pages: null },
    ],
  },
  {
    code: "ว30261",
    name: lt("ดาราศาสตร์", "Astronomy"),
    color: "#4F46E5",
    icon: "telescope",
    topics: [
      "โครงสร้างโลก (Crust, Mantle, Core)",
      "การแบ่งชั้นโลกตามองค์ประกอบกับตามสมบัติเชิงกล",
      "ทฤษฎีทวีปเลื่อนของ Alfred Wegener",
      "การแผ่ขยายพื้นมหาสมุทรและเปลือกโลก",
      "แผ่นเปลือกโลกและกระแสการพา (convection current)",
      "การอ่านและตีความภาพตัดขวางโลก",
    ],
    docs: [
      { key: "static-day2/astro-summary.pdf", title: "สรุปแนวสอบดาราศาสตร์ ม.4", pages: 11 },
      { key: "static-day2/astro-scope.jpg", title: "แนวข้อสอบดาราศาสตร์ (ภาพ)", pages: null },
    ],
  },
  {
    code: "ส31101",
    name: lt("สังคมศึกษา (พุทธศาสนา)", "Social Studies (Buddhism)"),
    color: "#B45309",
    icon: "landmark",
    topics: [
      "พระไตรปิฎกและคัมภีร์",
      "ไตรลักษณ์",
      "สติปัฏฐาน 4",
      "พรหมวิหาร 4",
      "โยนิโสมนสิการ (กระบวนการคิด)",
      "หน้าที่ชาวพุทธและบทบาทพระสงฆ์",
      "หลักทานและปฏิคาหก",
      "มารยาทในการรับรองและการจัดที่นั่ง",
    ],
    docs: [
      { key: "static-day2/social-tutor.pdf", title: "แนวข้อสอบติวเข้มสังคม 31101", pages: 9 },
      { key: "static-day2/social-tripitaka1.pdf", title: "พระไตรปิฎก (ฉบับที่ 5)", pages: 15 },
      { key: "static-day2/social-tripitaka2.pdf", title: "พระไตรปิฎก (ฉบับที่ 7)", pages: 22 },
      { key: "static-day2/social-panna.pdf", title: "การเจริญปัญญา", pages: 15 },
      { key: "static-day2/social-duties.pdf", title: "หน้าที่และมารยาทชาวพุทธ", pages: 23 },
    ],
  },
  {
    code: "อ31102-RW",
    name: lt("ภาษาอังกฤษอ่าน-เขียน", "English Reading & Writing"),
    color: "#7C3AED",
    icon: "book-open",
    topics: [
      "Unit 1: Body Mass and Weight",
      "Unit 2: Headaches",
      "Unit 3: Should I Stay or Should I Go?",
      "Unit 4: Under COVID-19",
      "Reading Comprehension",
    ],
    docs: Array.from({ length: 5 }, (_, i) => ({
      key: `static-day2/eng-${i + 1}.jpg`,
      title: `แนวข้อสอบอังกฤษอ่าน-เขียน (ภาพ ${i + 1})`,
      pages: null as number | null,
    })).concat([{ key: "static-day2/eng-6.png", title: "แนวข้อสอบอังกฤษอ่าน-เขียน (ภาพ 6)", pages: null }]),
  },
];

async function main() {
  console.log("seed-day2: เริ่ม...");

  // 1) รอบสอบวันที่ 2 (ACTIVE) และย้ายวันที่ 1 เป็น ARCHIVED
  await db.examTerm.upsert({
    where: { id: "final-m4-day-2" },
    update: { status: "ACTIVE" },
    create: {
      id: "final-m4-day-2",
      name: lt("สอบปลายภาค วันที่ 2 (5 วิชา)", "Final Examination Day 2"),
      academicYear: "2569",
      semester: "1",
      status: "ACTIVE",
    },
  });
  await db.examTerm.update({ where: { id: "term-final-1-2569" }, data: { status: "ARCHIVED" } });
  console.log("  term วันที่ 2 ACTIVE / วันที่ 1 ARCHIVED");

  // 2) เก็บวิชาวันที่ 1 เข้า archive (ซ่อนจากหน้าแรก ไม่ลบข้อมูล)
  const day1 = await db.subject.updateMany({
    where: { code: { in: ["ค31101", "ท31101", "อ31101", "ว31103", "ว31201", "ว32241"] } },
    data: { status: "ARCHIVED" },
  });
  console.log(`  archive วิชาวันที่ 1: ${day1.count} วิชา`);

  // 3) วิชา + topics + documents ของวันที่ 2
  for (const [i, def] of SUBJECTS.entries()) {
    const existing = await db.subject.findUnique({ where: { code: def.code } });
    const subject =
      existing ??
      (await db.subject.create({
        data: {
          code: def.code,
          name: def.name,
          color: def.color,
          icon: def.icon,
          sortOrder: 100 + i,
          status: "PUBLISHED",
        },
      }));
    if (existing && existing.status === "ARCHIVED") {
      await db.subject.update({ where: { id: existing.id }, data: { status: "PUBLISHED" } });
    }

    let order = 0;
    for (const t of def.topics) {
      const dup = await db.topic.findFirst({
        where: { subjectId: subject.id, title: { path: ["th"], equals: t } },
      });
      if (!dup) {
        await db.topic.create({
          data: { subjectId: subject.id, title: lt(t), sortOrder: order++ },
        });
      }
      order++;
    }

    for (const doc of def.docs) {
      const dup = await db.sourceDocument.findFirst({
        where: { subjectId: subject.id, storageKey: doc.key },
      });
      if (!dup) {
        await db.sourceDocument.create({
          data: {
            title: lt(doc.title),
            subjectId: subject.id,
            storageKey: doc.key,
            mimeType: doc.key.endsWith(".pdf")
              ? "application/pdf"
              : doc.key.endsWith(".png")
                ? "image/png"
                : "image/jpeg",
            status: "READY",
            metadata: { policy: "reference-only", source: "seed-day2" },
          },
        });
      }
    }
    console.log(`  วิชา: ${def.code} ${def.name.th} (${def.topics.length} หัวข้อ, ${def.docs.length} เอกสาร)`);
  }

  console.log("seed-day2: เสร็จ (ชุดข้อสอบให้รัน seed:exams-day2 ต่อ)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
