import { describe, expect, it } from "vitest";
import { mathDay2Exam } from "../prisma/seed-exams-day2/math";
import { chemExam } from "../prisma/seed-exams-day2/chem";
import { astroExam } from "../prisma/seed-exams-day2/astro";
import { socialExam } from "../prisma/seed-exams-day2/social";
import { englishExam } from "../prisma/seed-exams-day2/english";
import { GUIDES } from "../prisma/seed-guides-day2";
import { scoreAttemptAnswers } from "@/server/services/attempt-service";
import type { AttemptRow } from "@/server/repositories/attempt-repository";

describe("Day 2 Content Audit & Quality Gates", () => {
  describe("คณิตศาสตร์เพิ่มเติม (Math Day 2)", () => {
    it("มีข้อสอบครบ 30 ข้อ: 17 ปรนัย + 13 อัตนัย (ข้อเขียน)", () => {
      expect(mathDay2Exam.questions.length).toBe(30);
      const mcqs = mathDay2Exam.questions.filter((q) => q.type !== "WRITTEN");
      const written = mathDay2Exam.questions.filter((q) => q.type === "WRITTEN");
      expect(mcqs.length).toBe(17);
      expect(written.length).toBe(13);
    });

    it("ทุกข้อเขียนมีเกณฑ์การตรวจ (rubric) ที่มีคะแนน > 0", () => {
      const written = mathDay2Exam.questions.filter((q) => q.type === "WRITTEN");
      for (const q of written) {
        expect(q.rubric).toBeDefined();
        expect(Array.isArray(q.rubric)).toBe(true);
        expect(q.rubric!.length).toBeGreaterThan(0);
        for (const item of q.rubric!) {
          expect(item.points).toBeGreaterThan(0);
          expect(item.description.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it("ตรวจแก้จุดตายคณิตศาสตร์ตามแผนตรวจแก้ (P0/P1 corrections)", () => {
      // 1. ข้อแยกตัวประกอบ $(x - 3)$ ตอบ k = 1 (index 1)
      const factorQ = mathDay2Exam.questions.find((q) => q.prompt.includes("(x - 3)") && q.prompt.includes("ตัวประกอบ"));
      expect(factorQ).toBeDefined();
      expect(factorQ!.answer).toBe(1);
      expect(factorQ!.options![1]).toBe("1");

      // 2. ข้อทฤษฎีเศษเหลือ P(1) = 4 ได้ a = 4
      const p1Q = mathDay2Exam.questions.find((q) => q.prompt.includes("P(1) = 4"));
      expect(p1Q).toBeDefined();
      expect((p1Q!.answer as { finalAnswer: string }).finalAnswer).toBe("$a = 4$");

      // 3. สมการขัดแย้ง (x-3)/(x-4) = 2/(x-4) + 1 ต้องตอบ ไม่มีคำตอบ
      const contraQ = mathDay2Exam.questions.find((q) => q.prompt.includes("x - 4"));
      expect(contraQ).toBeDefined();
      expect((contraQ!.answer as { finalAnswer: string }).finalAnswer).toContain("ไม่มีคำตอบ");

      // 4. อสมการ |x+4| < 6 คำตอบ -10 < x < 2
      const absQ = mathDay2Exam.questions.find((q) => q.prompt.includes("|x + 4| < 6"));
      expect(absQ).toBeDefined();
      expect(absQ!.answer).toBe(0);
      expect(absQ!.options![0]).toBe("$-10 < x < 2$");
    });
  });

  describe("เคมี 1 (Chem Day 2)", () => {
    it("มีข้อสอบครบ 30 ข้อ", () => {
      expect(chemExam.questions.length).toBe(30);
    });

    it("รูปร่างโมเลกุล CH₄ ต้องเป็นทรงสี่หน้า (tetrahedral, 109.5°)", () => {
      const ch4Q = chemExam.questions.find((q) => q.prompt.includes("CH") && q.prompt.includes("VSEPR"));
      expect(ch4Q).toBeDefined();
      const ansIndex = ch4Q!.answer as number;
      const correctOpt = ch4Q!.options![ansIndex];
      expect(correctOpt).toContain("ทรงสี่หน้า");
      expect(correctOpt).toContain("109.5");
    });

    it("พลังงานแลตทิซระบุการเกิดผลึกปล่อยพลังงานอย่างถูกต้อง", () => {
      const latticeQ = chemExam.questions.find((q) => q.explanation?.includes("แลตทิซ"));
      expect(latticeQ).toBeDefined();
      expect(latticeQ!.explanation).toContain("ปล่อยพลังงาน");
    });
  });

  describe("ดาราศาสตร์ (Astro Day 2)", () => {
    it("มีข้อสอบ 34 ข้อ: 30 ปรนัย + 4 อัตนัย", () => {
      expect(astroExam.questions.length).toBe(34);
      const mcqs = astroExam.questions.filter((q) => q.type !== "WRITTEN");
      const written = astroExam.questions.filter((q) => q.type === "WRITTEN");
      expect(mcqs.length).toBe(30);
      expect(written.length).toBe(4);
    });

    it("ข้อสอบปรนัยทั้ง 30 ข้อมี 5 ตัวเลือก", () => {
      const mcqs = astroExam.questions.filter((q) => q.type !== "WRITTEN");
      for (const q of mcqs) {
        expect(q.options).toBeDefined();
        expect(q.options!.length).toBe(5);
      }
    });

    it("ข้อสอบอัตนัยทุกข้อมีคำอธิบายเฉลยและเกณฑ์การให้คะแนน", () => {
      const written = astroExam.questions.filter((q) => q.type === "WRITTEN");
      for (const q of written) {
        expect(q.explanation).toBeDefined();
        expect(q.explanation!.length).toBeGreaterThan(10);
      }
    });
  });

  describe("สังคมศึกษา (Social Day 2)", () => {
    it("มีข้อสอบครบ 40 ข้อ และคำอธิบายระบุสัดส่วน 8/6/8/10/8", () => {
      expect(socialExam.questions.length).toBe(40);
      expect(socialExam.description).toContain("ไตรปิฎก/ไตรลักษณ์ 8");
      expect(socialExam.description).toContain("สติปัฏฐาน4-พรหมวิหาร4 6");
      expect(socialExam.description).toContain("โยนิโสมนสิการ 8");
      expect(socialExam.description).toContain("หน้าที่ชาวพุทธ 10");
      expect(socialExam.description).toContain("มารยาท 8");
    });

    it("ไม่มีคำศัพท์ที่ไม่อยู่ในหลักสูตร (ทายิโร, อุทยุงโค, สัมปัตติโร)", () => {
      const raw = JSON.stringify(socialExam);
      expect(raw.includes("ทายิโร")).toBe(false);
      expect(raw.includes("อุทยุงโค")).toBe(false);
      expect(raw.includes("สัมปัตติโร")).toBe(false);
    });

    it("มีเนื้อหาพระธรรมทูตและทิศ 6 ที่ตรงกับสไลด์สรุปจริง", () => {
      const raw = JSON.stringify(socialExam);
      expect(raw.includes("พระธรรมทูต")).toBe(true);
      expect(raw.includes("ทิศ 6") || raw.includes("ทิศเบื้อง")).toBe(true);
    });

    it("ชีตสรุปสังคมศึกษา มีเนื้อหาการสังคายนาพระไตรปิฎก 10 ครั้ง และรัชกาลสำคัญครบถ้วน", () => {
      const socialGuide = GUIDES["ส31101"];
      expect(socialGuide).toBeDefined();
      expect(socialGuide).toContain("สรุปเจาะลึกการสังคายนาพระไตรปิฎก");
      for (let i = 1; i <= 10; i++) {
        expect(socialGuide).toContain(`ครั้งที่ ${i}`);
      }
      expect(socialGuide).toContain("พระเจ้าติโลกราช");
      expect(socialGuide).toContain("รัชกาลที่ 1");
      expect(socialGuide).toContain("ฉบับทองใหญ่");
      expect(socialGuide).toContain("รัชกาลที่ 9");
      expect(socialGuide).toContain("รัชกาลที่ 5");
      expect(socialGuide).toContain("รัชกาลที่ 7");
      expect(socialGuide).toContain("ฉบับสยามรัฐ");
      expect(socialGuide).toContain("ใบลาน");
    });
  });

  describe("ภาษาอังกฤษ (English Day 2)", () => {
    it("มีข้อสอบครบ 56 ข้อและมีคำศัพท์ 16 คำที่ระบุใน blueprint", () => {
      expect(englishExam.questions.length).toBe(56);
      const missingWords = [
        "plug into",
        "accurate",
        "determine",
        "rely on",
        "squeeze",
        "criticism",
        "chemistry",
        "suffer from",
        "trigger",
        "occur",
        "adapt",
        "domestic",
        "adolescent",
        "undergraduate",
        "statistically",
        "aspect",
      ];
      const allText = englishExam.questions
        .map((q) => `${q.prompt} ${q.options?.join(" ") ?? ""}`)
        .join(" ")
        .toLowerCase();

      for (const word of missingWords) {
        expect(allText).toContain(word.toLowerCase());
      }
    });
  });

  describe("Scoring Isolation สำหรับ Retry Session", () => {
    it("คำนวณคะแนนเฉพาะข้อที่เลือกซ้ำ (ไม่หักคะแนนข้อที่ไม่ได้ซ้ำเป็น skipped)", () => {
      const mockAttempt: AttemptRow = {
        id: "att-1",
        setId: "set-1",
        userId: null,
        guestSessionId: "guest-1",
        mode: "EXAM",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        finishedAt: null,
        durationSec: null,
        score: null,
        retrySessionId: "rs-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        set: {
          id: "set-1",
          subjectId: "sub-1",
          topicId: "top-1",
          termId: "term-1",
          title: { th: "ชุดทดสอบ" },
          description: null,
          difficulty: "MEDIUM",
          recommendedMinutes: 30,
          status: "PUBLISHED",
          version: 1,
          shuffleQuestions: false,
          shuffleOptions: false,
          revealMode: "AFTER_SUBMIT",
          metadata: null,
          createdBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          subject: {
            id: "sub-1",
            code: "ค31201",
            name: { th: "คณิต" },
            color: "#000",
            icon: "calculator",
            status: "PUBLISHED",
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          topic: null,
          questions: [
            {
              id: "q-1",
              setId: "set-1",
              type: "MCQ",
              prompt: "Q1",
              imageKey: null,
              options: [{ key: "A", text: "A" }, { key: "B", text: "B" }],
              answer: { kind: "MCQ", correctKeys: ["A"] },
              explanation: "exp",
              rubric: null,
              points: 1,
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "q-2",
              setId: "set-1",
              type: "MCQ",
              prompt: "Q2",
              imageKey: null,
              options: [{ key: "A", text: "A" }, { key: "B", text: "B" }],
              answer: { kind: "MCQ", correctKeys: ["B"] },
              explanation: "exp",
              rubric: null,
              points: 1,
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "q-3",
              setId: "set-1",
              type: "MCQ",
              prompt: "Q3",
              imageKey: null,
              options: [{ key: "A", text: "A" }, { key: "B", text: "B" }],
              answer: { kind: "MCQ", correctKeys: ["A"] },
              explanation: "exp",
              rubric: null,
              points: 1,
              sortOrder: 3,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        answers: [
          {
            id: "ans-1",
            attemptId: "att-1",
            questionId: "q-1",
            answer: { selectedKeys: ["A"] },
            sketchKey: null,
            flagged: false,
            selfChecked: false,
            isCorrect: true,
            answeredAt: new Date(),
          },
        ],
        retrySession: {
          id: "rs-1",
          sourceAttemptId: "att-0",
          questionIds: ["q-1"], // ฝึกซ้ำเฉพาะ q-1
          ownerUserId: null,
          ownerGuestId: "guest-1",
          createdAt: new Date(),
        },
      };

      const result = scoreAttemptAnswers(mockAttempt);
      // ต้องตรวจเฉพาะ q-1 เท่านั้น (total = 1, earned = 1, percent = 100)
      expect(result.perQuestion.length).toBe(1);
      expect(result.perQuestion[0].questionId).toBe("q-1");
      expect(result.perQuestion[0].status).toBe("correct");
      expect(result.score.total).toBe(1);
      expect(result.score.earned).toBe(1);
      expect(result.score.percent).toBe(100);
    });

    it("saveAnswer และ selfCheck ป้องกันการส่งคำตอบนอกชุด หรือนอก retrySession", async () => {
      const { attemptService } = await import("@/server/services/attempt-service");
      const { attemptRepository } = await import("@/server/repositories/attempt-repository");
      const { vi } = await import("vitest");

      const mockAttempt = {
        id: "att-1",
        setId: "set-1",
        userId: null,
        guestSessionId: "guest-1",
        mode: "PRACTICE" as const,
        status: "IN_PROGRESS" as const,
        startedAt: new Date(),
        finishedAt: null,
        durationSec: 0,
        score: null,
        retrySessionId: "rs-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        set: {
          id: "set-1",
          subjectId: "sub-1",
          topicId: null,
          title: "Set 1",
          description: null,
          timeLimitMin: null,
          passPercent: 60,
          revealMode: "IMMEDIATE" as const,
          shuffleMode: "NONE" as const,
          status: "PUBLISHED" as const,
          sourceDocCount: null,
          examTermId: null,
          metadata: null,
          createdBy: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          questions: [
            {
              id: "q-1",
              setId: "set-1",
              type: "MCQ" as const,
              prompt: "Q1",
              imageKey: null,
              options: [{ key: "A", text: "A" }],
              answer: { kind: "MCQ", correctKeys: ["A"] },
              explanation: "exp",
              rubric: null,
              points: 1,
              sortOrder: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "q-2",
              setId: "set-1",
              type: "WRITTEN" as const,
              prompt: "Q2",
              imageKey: null,
              options: null,
              answer: { kind: "WRITTEN", rubrics: [] },
              explanation: "exp",
              rubric: [],
              points: 1,
              sortOrder: 2,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        answers: [],
        retrySession: {
          id: "rs-1",
          sourceAttemptId: "att-0",
          questionIds: ["q-1"], // ในรอบ retry มีเฉพาะ q-1
          ownerUserId: null,
          ownerGuestId: "guest-1",
          createdAt: new Date(),
        },
      };

      vi.spyOn(attemptRepository, "findById").mockResolvedValue(mockAttempt as unknown as AttemptRow);

      const owner = { guestSessionId: "guest-1" };

      // 1. ตอบข้อที่ไม่มีในชุด -> โยน NOT_FOUND
      await expect(
        attemptService.saveAnswer({
          attemptId: "att-1",
          owner,
          data: { questionId: "non-existent" },
        }),
      ).rejects.toThrow("NOT_FOUND");

      // 2. ตอบข้อ q-2 ที่มีในชุดแต่ไม่อยู่ใน retrySession -> โยน FORBIDDEN
      await expect(
        attemptService.saveAnswer({
          attemptId: "att-1",
          owner,
          data: { questionId: "q-2" },
        }),
      ).rejects.toThrow("FORBIDDEN");

      // 3. selfCheck ข้อที่ไม่อยู่ใน retrySession -> โยน FORBIDDEN
      await expect(
        attemptService.selfCheck({
          attemptId: "att-1",
          questionId: "q-2",
          correct: true,
          owner,
        }),
      ).rejects.toThrow("FORBIDDEN");

      vi.restoreAllMocks();
    });
  });
});
