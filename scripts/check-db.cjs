
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const questions = await db.question.findMany({
    where: { type: "MCQ" },
    select: { id: true, prompt: true, options: true, answer: true },
  });
  let bad = 0;
  for (const q of questions) {
    const keys = (q.options ?? []).map((o) => o.key);
    const correct = (q.answer && q.answer.correctKeys) || [];
    if (!correct.every((k) => keys.includes(k))) {
      bad++;
      console.log("BAD keys:", q.id);
    }
  }
  console.log("MCQ checked:", questions.length, "| bad:", bad);
  const m2 = questions.filter((q) => q.prompt.includes("mathrm") && !q.prompt.includes("BS"));
  console.log("mathrm leaks:", m2.length);
  const sets = await db.questionSet.findMany({
    where: { title: { path: ["th"], string_contains: String.fromCharCode(3647).repeat(0) + String.fromCharCode(3649) } },
  });
  await db.$disconnect();
})();
