// แนวข้อสอบภาษาอังกฤษอ่าน-เขียน (วันที่ 2) — Vocabulary Units 1-4 + Reading
// สถานะ: DRAFT — ต้นทางยังไม่ระบุจำนวนข้อ ผู้ดูแลต้องยืนยันก่อน publish
// ตัวเลือกหลอกใช้คำศัพท์จริงจากหน่วยเดียวกัน
import type { ExamSetDef, ExamQ } from "./types";

type Vocab = { word: string; pos: string; meaning: string; unit: string };

const UNITS: Record<string, Vocab[]> = {
  "Unit 1: Body Mass and Weight": [
    { word: "diagnose", pos: "v.", meaning: "วินิจฉัยโรค", unit: "Unit 1" },
    { word: "gauge", pos: "v./n.", meaning: "วัด/ประเมิน", unit: "Unit 1" },
    { word: "thickness", pos: "n.", meaning: "ความหนา", unit: "Unit 1" },
    { word: "crude", pos: "adj.", meaning: "ดิบ ๆ / หยาบ ๆ", unit: "Unit 1" },
    { word: "obese", pos: "adj.", meaning: "อ้วนมาก (ทางการแพทย์)", unit: "Unit 1" },
    { word: "precise", pos: "adj.", meaning: "เที่ยงตรง", unit: "Unit 1" },
    { word: "estimate", pos: "v./n.", meaning: "ประมาณ", unit: "Unit 1" },
    { word: "composition", pos: "n.", meaning: "องค์ประกอบ", unit: "Unit 1" },
    { word: "reliable", pos: "adj.", meaning: "เชื่อถือได้", unit: "Unit 1" },
    { word: "density", pos: "n.", meaning: "ความหนาแน่น", unit: "Unit 1" },
  ],
  "Unit 2: Headaches": [
    { word: "tumor", pos: "n.", meaning: "เนื้องอก", unit: "Unit 2" },
    { word: "acid", pos: "n.", meaning: "กรด", unit: "Unit 2" },
    { word: "physiological", pos: "adj.", meaning: "เกี่ยวกับสรีรวิทยา", unit: "Unit 2" },
    { word: "productivity", pos: "n.", meaning: "ผลิตภาพ", unit: "Unit 2" },
    { word: "stimulus", pos: "n.", meaning: "สิ่งกระตุ้น", unit: "Unit 2" },
    { word: "severe", pos: "adj.", meaning: "รุนแรง", unit: "Unit 2" },
    { word: "prescribe", pos: "v.", meaning: "สั่งจ่ายยา", unit: "Unit 2" },
    { word: "classify", pos: "v.", meaning: "จัดหมวดหมู่", unit: "Unit 2" },
    { word: "infection", pos: "n.", meaning: "การติดเชื้อ", unit: "Unit 2" },
    { word: "abnormal", pos: "adj.", meaning: "ผิดปกติ", unit: "Unit 2" },
  ],
  "Unit 3: Should I Stay or Should I Go?": [
    { word: "flexible", pos: "adj.", meaning: "ยืดหยุ่น", unit: "Unit 3" },
    { word: "reputation", pos: "n.", meaning: "ชื่อเสียง", unit: "Unit 3" },
    { word: "guarantee", pos: "v./n.", meaning: "รับประกัน", unit: "Unit 3" },
    { word: "worthwhile", pos: "adj.", meaning: "คุ้มค่า", unit: "Unit 3" },
    { word: "exclusive", pos: "adj.", meaning: "พิเศษเฉพาะ", unit: "Unit 3" },
    { word: "independent", pos: "adj.", meaning: "อิสระ", unit: "Unit 3" },
    { word: "applicant", pos: "n.", meaning: "ผู้สมัคร", unit: "Unit 3" },
    { word: "debt", pos: "n.", meaning: "หนี้", unit: "Unit 3" },
    { word: "bilingual", pos: "adj.", meaning: "สองภาษา", unit: "Unit 3" },
    { word: "curriculum", pos: "n.", meaning: "หลักสูตร", unit: "Unit 3" },
  ],
  "Unit 4: Under COVID-19": [
    { word: "generalize", pos: "v.", meaning: "สรุปกว้าง ๆ", unit: "Unit 4" },
    { word: "closure", pos: "n.", meaning: "การปิด", unit: "Unit 4" },
    { word: "occupation", pos: "n.", meaning: "อาชีพ", unit: "Unit 4" },
    { word: "behavioral", pos: "adj.", meaning: "เกี่ยวกับพฤติกรรม", unit: "Unit 4" },
    { word: "innate", pos: "adj.", meaning: "แต่กำเนิด", unit: "Unit 4" },
    { word: "continuity", pos: "n.", meaning: "ความต่อเนื่อง", unit: "Unit 4" },
  ],
};

const KEY = ["A", "B", "C", "D"];

/** สร้างข้อ "เลือกความหมาย" — ตัวเลือกหลอกดึงจากคำศัพท์อื่นในหน่วยเดียวกัน */
function vocabQ(all: Vocab[], target: Vocab): ExamQ {
  const others = all.filter((v) => v.word !== target.word).slice(0, 3).map((v) => v.meaning);
  const options = [target.meaning, ...others];
  return {
    type: "MCQ",
    prompt: `คำว่า "${target.word}" (${target.unit}) มีความหมายตรงกับข้อใด`,
    options,
    answer: 0,
    explanation: `${target.word} (${target.pos}) = ${target.meaning} — จากคลังคำศัพท์ ${target.unit}`,
  };
}

const questions: ExamQ[] = [];
for (const list of Object.values(UNITS)) {
  for (const v of list) {
    questions.push(vocabQ(list, v));
  }
}

// ===== Reading (2 passages) =====
questions.push(
  {
    type: "MCQ",
    prompt:
      'Passage: "During the pandemic, school closures forced millions of adolescents to study from home. At first, many found it difficult to adapt, but over time, flexible schedules and online tools helped maintain the continuity of education. Statistically, students in bilingual programs adapted faster than others." According to the passage, what helped maintain the continuity of education?',
    options: [
      "Flexible schedules and online tools",
      "School closures",
      "Bilingual teachers only",
      "Shorter curricula",
    ],
    answer: 0,
    explanation: "ประโยค: flexible schedules and online tools helped maintain the continuity of education",
  },
  {
    type: "MCQ",
    prompt: "(Passage เดิม) The word \"adapt\" in the passage is closest in meaning to ______.",
    options: ["adjust", "ignore", "close", "estimate"],
    answer: 0,
    explanation: "adapt = ปรับตัว (adjust) — เป็นคำศัพท์ Unit 3 ที่กำหนดในแนว",
  },
  {
    type: "MCQ",
    prompt: "(Passage เดิม) Which group adapted faster, according to the passage?",
    options: [
      "Students in bilingual programs",
      "Students without internet",
      "Undergraduate students only",
      "Students with severe headaches",
    ],
    answer: 0,
    explanation: "ประโยคสุดท้าย: students in bilingual programs adapted faster than others",
  },
  {
    type: "MCQ",
    prompt: "(Passage เดิม) The best title for this passage is ______.",
    options: [
      "School Closures During the Pandemic",
      "How Students Adapted to Learning at Home",
      "Bilingual Programs Are the Best",
      "The History of Online Tools",
    ],
    answer: 1,
    explanation: "ใจความหลักคือการปรับตัวของนักเรียนกับการเรียนที่บ้านในช่วง pandemic",
  },
);

export const englishExam: ExamSetDef = {
  subjectCode: "อ31102-RW",
  title: "แนวข้อสอบภาษาอังกฤษอ่าน-เขียน (รอยืนยันจำนวนข้อ)",
  description:
    "Vocabulary Units 1-4 (เลือกความหมาย/จับคู่คำ) + Reading Comprehension — สถานะฉบับร่าง: ต้นทางยังไม่ระบุจำนวนข้อ ผู้ดูแลต้องยืนยันจำนวนก่อน publish (ห้ามอ้างว่าจำนวนตรงแนว)",
  difficulty: "MEDIUM",
  minutes: 50,
  questions,
};
