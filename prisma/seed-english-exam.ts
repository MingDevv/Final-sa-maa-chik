import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";

interface QuestionItem {
  prompt: string;
  options: Array<{ key: string; text: string }>;
  answer: {
    correctKey: string;
  };
  explanation: string;
  points?: number;
  sortOrder?: number;
}

interface QuestionSetFile {
  title: {
    th: string;
    en?: string;
  };
  description?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  recommendedMinutes?: number;
  questions: QuestionItem[];
}

async function main() {
  console.log("🚀 เริ่มต้นกระบวนการ Seed ข้อมูลข้อสอบภาษาอังกฤษ (English Future Tenses Exam)...");

  // 1. ค้นหาหรือสร้างรายวิชา อ31101 (ภาษาอังกฤษ)
  console.log("📚 1. ตรวจสอบและอัปเดตรายวิชา อ31101 (ภาษาอังกฤษ)...");
  const englishSubject = await db.subject.upsert({
    where: { code: "อ31101" },
    update: {
      name: { th: "ภาษาอังกฤษ", en: "English" },
      color: "#7C3AED",
      icon: "languages",
      sortOrder: 9,
      status: "PUBLISHED",
    },
    create: {
      code: "อ31101",
      name: { th: "ภาษาอังกฤษ", en: "English" },
      color: "#7C3AED",
      icon: "languages",
      sortOrder: 9,
      status: "PUBLISHED",
    },
  });
  console.log(`   ✅ Subject: ${englishSubject.code} (${englishSubject.id})`);

  // สร้างหรือค้นหาหัวข้อการเรียนรู้ (Topic)
  let topic = await db.topic.findFirst({
    where: {
      subjectId: englishSubject.id,
      title: { path: ["th"], equals: "Future Tenses (Will, Be Going To, Future Continuous)" },
    },
  });
  if (!topic) {
    topic = await db.topic.create({
      data: {
        subjectId: englishSubject.id,
        title: {
          th: "Future Tenses (Will, Be Going To, Future Continuous)",
          en: "Future Tenses (Will, Be Going To, Future Continuous)",
        },
        description: "โครงสร้างและหลักการใช้ Future Simple Tense (will vs be going to) และ Future Continuous Tense",
        sortOrder: 1,
      },
    });
    console.log(`   ✅ Topic: Future Tenses (${topic.id})`);
  }

  // 2. อ่านไฟล์ Study Guide Markdown และ Upsert ลงตาราง StudyGuide
  console.log("📖 2. อ่านและบันทึก Study Guide...");
  const studyGuidePath = path.resolve(__dirname, "data/english-future-study-guide.md");
  if (!fs.existsSync(studyGuidePath)) {
    throw new Error(`ไม่พบไฟล์ Study Guide ที่: ${studyGuidePath}`);
  }
  const studyGuideContent = fs.readFileSync(studyGuidePath, "utf-8");

  const studyGuide = await db.studyGuide.upsert({
    where: { subjectId: englishSubject.id },
    update: {
      content: studyGuideContent,
    },
    create: {
      subjectId: englishSubject.id,
      content: studyGuideContent,
    },
  });
  console.log(`   ✅ StudyGuide บันทึกเรียบร้อย (ความยาว ${studyGuideContent.length} ตัวอักษร, ID: ${studyGuide.id})`);

  // 3. อ่านไฟล์แบบทดสอบ 20 ข้อ JSON และสร้าง/อัปเดต QuestionSet พร้อม Questions
  console.log("📝 3. อ่านและบันทึก QuestionSet พร้อม Questions 20 ข้อ...");
  const questionsJsonPath = path.resolve(__dirname, "data/english-future-20-questions.json");
  if (!fs.existsSync(questionsJsonPath)) {
    throw new Error(`ไม่พบไฟล์ข้อสอบ JSON ที่: ${questionsJsonPath}`);
  }
  const rawJson = fs.readFileSync(questionsJsonPath, "utf-8");
  const examData: QuestionSetFile = JSON.parse(rawJson);

  const term = await db.examTerm.findFirst({ where: { status: "ACTIVE" } });

  const targetTitle = {
    th: "แนวข้อสอบเก็บคะแนน: Future Simple & Future Continuous Tense (20 ข้อ)",
    en: "Grammar Test: Future Simple vs Future Continuous (20 Items)",
  };

  const existingSet = await db.questionSet.findFirst({
    where: {
      subjectId: englishSubject.id,
      title: { path: ["th"], equals: targetTitle.th },
    },
  });

  let questionSet;
  if (existingSet) {
    console.log(`   พบชุดข้อสอบเดิม (${existingSet.id}) กำลังเคลียร์ข้อสอบเก่าเพื่ออัปเดตใหม่...`);
    await db.question.deleteMany({ where: { setId: existingSet.id } });
    questionSet = await db.questionSet.update({
      where: { id: existingSet.id },
      data: {
        title: targetTitle,
        description: examData.description || "แบบทดสอบวัดความเข้าใจการใช้ Will, Be Going To และ Future Continuous Tense (20 ข้อ 20 คะแนน)",
        topicId: topic.id,
        termId: term?.id ?? null,
        difficulty: "MEDIUM",
        recommendedMinutes: 25,
        status: "PUBLISHED",
        revealMode: "AFTER_SUBMIT",
        shuffleQuestions: false,
        shuffleOptions: false,
      },
    });
  } else {
    questionSet = await db.questionSet.create({
      data: {
        title: targetTitle,
        description: examData.description || "แบบทดสอบวัดความเข้าใจการใช้ Will, Be Going To และ Future Continuous Tense (20 ข้อ 20 คะแนน)",
        subjectId: englishSubject.id,
        topicId: topic.id,
        termId: term?.id ?? null,
        difficulty: "MEDIUM",
        recommendedMinutes: 25,
        status: "PUBLISHED",
        revealMode: "AFTER_SUBMIT",
        shuffleQuestions: false,
        shuffleOptions: false,
      },
    });
  }
  console.log(`   ✅ QuestionSet: ${targetTitle.th} (ID: ${questionSet.id})`);

  // บันทึกข้อสอบทั้ง 20 ข้อ
  for (let i = 0; i < examData.questions.length; i++) {
    const q = examData.questions[i];
    const correctKey = q.answer.correctKey;
    await db.question.create({
      data: {
        setId: questionSet.id,
        type: "MCQ",
        prompt: q.prompt,
        options: q.options,
        answer: {
          kind: "MCQ",
          correctKeys: [correctKey],
          correctKey: correctKey,
        },
        explanation: q.explanation,
        points: q.points ?? 1,
        sortOrder: q.sortOrder ?? (i + 1),
      },
    });
  }
  const qCount = await db.question.count({ where: { setId: questionSet.id } });
  console.log(`   ✅ นำเข้า Questions สำเร็จครบทั้งหมด ${qCount} ข้อ`);

  // 4. ลงทะเบียนเอกสาร PDF 3 ไฟล์ใน public/seed ลงใน SourceDocument table (ใช้ static/ เพื่อให้เข้าถึงได้ทั้ง dev และ Vercel)
  console.log("📄 4. ตรวจสอบและลงทะเบียน SourceDocument 3 ไฟล์ PDF...");
  const pdfDocs = [
    {
      fileName: "will-be-going-to-key.pdf",
      storageKey: "static/will-be-going-to-key.pdf",
      title: { th: "WILL & BE GOING TO with Key", en: "Will & Be Going To with Key" },
    },
    {
      fileName: "will-going-to-future-cont.pdf",
      storageKey: "static/will-going-to-future-cont.pdf",
      title: { th: "ชีทสรุป Will / Going to + Future Continuous Tense", en: "Will / Going to + Future Continuous Summary" },
    },
    {
      fileName: "worksheet-future-tense.pdf",
      storageKey: "static/worksheet-future-tense.pdf",
      title: { th: "ใบงานแบบฝึกหัด Future Tenses 20 ข้อ", en: "English Worksheet: Future Tenses" },
    },
  ];

  for (const doc of pdfDocs) {
    const filePath = path.resolve(__dirname, "../public/seed", doc.fileName);
    let sizeBytes: number | null = null;
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      sizeBytes = stat.size;
    }

    const existingDoc = await db.sourceDocument.findFirst({
      where: {
        subjectId: englishSubject.id,
        storageKey: doc.storageKey,
      },
    });

    if (existingDoc) {
      await db.sourceDocument.update({
        where: { id: existingDoc.id },
        data: {
          title: doc.title,
          topicId: topic.id,
          status: "READY",
          mimeType: "application/pdf",
          sizeBytes: sizeBytes ?? existingDoc.sizeBytes,
          metadata: {
            policy: "reference-only",
            source: "course-materials",
          },
        },
      });
      console.log(`   🔄 อัปเดตเอกสาร: ${doc.storageKey} (${existingDoc.id})`);
    } else {
      const createdDoc = await db.sourceDocument.create({
        data: {
          subjectId: englishSubject.id,
          topicId: topic.id,
          storageKey: doc.storageKey,
          title: doc.title,
          status: "READY",
          mimeType: "application/pdf",
          sizeBytes: sizeBytes,
          metadata: {
            policy: "reference-only",
            source: "course-materials",
          },
        },
      });
      console.log(`   ✅ สร้างเอกสาร: ${doc.storageKey} (${createdDoc.id})`);
    }
  }

  console.log("\n🎉 กระบวนการ Seed ข้อมูลข้อสอบภาษาอังกฤษเสร็จสิ้นอย่างสมบูรณ์!");
  console.log(`- Subject ID: ${englishSubject.id}`);
  console.log(`- QuestionSet ID: ${questionSet.id}`);
  console.log(`- Questions Count: ${qCount}`);
}

main()
  .catch((err) => {
    console.error("❌ เกิดข้อผิดพลาดในการรัน Seeder:", err);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
