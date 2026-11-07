/**
 * สคริปต์ล้างเนื้อหาข้อสอบและชีตสรุปเก่าทั้งหมดออก
 * คงโครงสร้างวิชาหลัก 8 วิชาไว้ เพื่อเตรียมรับข้อมูลแนวข้อสอบชุดใหม่
 * 
 * รัน: npx tsx prisma/reset-clean-subjects.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const lt = (th: string, en?: string) => ({ th, ...(en ? { en } : {}) });

async function main() {
  console.log("🧹 กำลังล้างข้อมูลข้อสอบเก่า...");

  // 1. ล้างประวัติการสอบ คำตอบ และข้อสอบทั้งหมด
  await db.retrySession.deleteMany({});
  await db.attemptAnswer.deleteMany({});
  await db.attempt.deleteMany({});
  await db.questionStat.deleteMany({});
  await db.question.deleteMany({});
  await db.questionSet.deleteMany({});
  await db.studyGuide.deleteMany({});
  await db.bookmark.deleteMany({});
  await db.highlight.deleteMany({});
  await db.note.deleteMany({});
  await db.studyProgress.deleteMany({});
  await db.weakTopic.deleteMany({});
  await db.dailyActivity.deleteMany({});
  await db.sourceDocument.deleteMany({});
  await db.topic.deleteMany({});

  console.log("✅ ล้างข้อสอบ ชีตสรุป และประวัติการทำข้อสอบเก่าเรียบร้อยแล้ว");

  // 2. ตั้งค่ารอบสอบใหม่
  const term = await db.examTerm.upsert({
    where: { id: "term-final-exam" },
    update: { status: "ACTIVE" },
    create: {
      id: "term-final-exam",
      name: lt("สอบปลายภาค", "Final Examination"),
      academicYear: "2569",
      semester: "1",
      status: "ACTIVE",
    },
  });

  // 3. กำหนดโครงสร้างวิชาหลัก 8 วิชา
  const coreSubjects = [
    {
      code: "ค31101",
      name: lt("คณิตศาสตร์พื้นฐาน", "Foundational Mathematics"),
      color: "#9F1239",
      icon: "calculator",
      sortOrder: 1,
    },
    {
      code: "ค31201",
      name: lt("คณิตศาสตร์เพิ่มเติม", "Advanced Mathematics"),
      color: "#BE123C",
      icon: "calculator",
      sortOrder: 2,
    },
    {
      code: "ว31201",
      name: lt("ฟิสิกส์", "Physics"),
      color: "#0369A1",
      icon: "atom",
      sortOrder: 3,
    },
    {
      code: "ว30221",
      name: lt("เคมี", "Chemistry"),
      color: "#0D9488",
      icon: "flask-conical",
      sortOrder: 4,
    },
    {
      code: "ว32241",
      name: lt("ชีววิทยา", "Biology"),
      color: "#15803D",
      icon: "dna",
      sortOrder: 5,
    },
    {
      code: "ว30261",
      name: lt("โลก ดาราศาสตร์ และอวกาศ", "Earth and Space Science"),
      color: "#4338CA",
      icon: "orbit",
      sortOrder: 6,
    },
    {
      code: "ภาษาไทย",
      codeAlt: "ท31101",
      name: lt("ภาษาไทย", "Thai Language"),
      color: "#B45309",
      icon: "book-open",
      sortOrder: 7,
    },
    {
      code: "ภาษาอังกฤษ",
      codeAlt: "อ31101",
      name: lt("ภาษาอังกฤษ", "English"),
      color: "#7C3AED",
      icon: "languages",
      sortOrder: 8,
    },
    {
      code: "ส31101",
      name: lt("สังคมศึกษา ศาสนา และวัฒนธรรม", "Social Studies"),
      color: "#D97706",
      icon: "landmark",
      sortOrder: 9,
    },
  ];

  for (const s of coreSubjects) {
    const code = s.codeAlt || s.code;
    await db.subject.upsert({
      where: { code },
      update: {
        name: s.name,
        color: s.color,
        icon: s.icon,
        sortOrder: s.sortOrder,
        status: "PUBLISHED",
      },
      create: {
        code,
        name: s.name,
        color: s.color,
        icon: s.icon,
        sortOrder: s.sortOrder,
        status: "PUBLISHED",
      },
    });
  }

  console.log("✨ เตรียมโครงสร้างวิชาหลัก 8-9 วิชาเรียบร้อย พร้อมรับข้อสอบชุดใหม่!");
}

main()
  .catch((e) => {
    console.error("❌ เกิดข้อผิดพลาด:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
