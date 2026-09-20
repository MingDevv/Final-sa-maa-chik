// แนวข้อสอบภาษาอังกฤษ 1 — 30 ข้อ (Blueprint: Part 1 Vocabulary Unit 3 / Part 2 Grammar / Part 3 Reading — 50 marks 30 points)
import type { ExamSetDef } from "./types";

export const englishExam: ExamSetDef = {
  subjectCode: "อ31101",
  title: "English Final Exam Practice (30 items — per blueprint)",
  description:
    "Part 1: Vocabulary (Unit 3) 10 items, Part 2: Grammar (Present Perfect, Present Perfect Continuous, Past Simple vs Past Continuous) 10 items, Part 3: Reading (Seen + Unseen) 10 items",
  difficulty: "MEDIUM",
  minutes: 60,
  questions: [
    // ===== Part 1: Vocabulary (10) =====
    {
      prompt: "Choose the word that best completes the sentence: She decided to ______ her old habits and start a healthier lifestyle.",
      options: ["give up", "give in to", "look after", "put off"],
      answer: 0,
      explanation: "give up (เลิกทำ) ใช้กับ habits เช่น give up old habits | put off = เลื่อนไป, look after = ดูแล",
    },
    {
      prompt: "Choose the correct word: The school will ______ a new science lab next year.",
      options: ["participate", "build", "donate", "arrive"],
      answer: 1,
      explanation: "build (สร้าง) ต้องมีสิ่งก่อสร้างเป็นกรรม — participate ใช้ with/in, donate ใช้กับของ/เงิน",
    },
    {
      prompt: "Which word is closest in meaning to \"important\"?",
      options: ["necessary", "significant", "difficult", "popular"],
      answer: 1,
      explanation: "significant = สำคัญ (synonym ของ important) | necessary = จำเป็น | popular = เป็นที่นิยม",
    },
    {
      prompt: "Choose the best answer: He ______ to finish the project because he ran out of time.",
      options: ["managed", "failed", "enjoyed", "kept"],
      answer: 1,
      explanation: "ran out of time (เวลาหมด) → failed to finish (ไม่สำเร็จ) สอดคล้องกันทางบริบท",
    },
    {
      prompt: "Complete the sentence: Students should ______ notes during the lecture.",
      options: ["take", "make", "do", "give"],
      answer: 0,
      explanation: "collocation: take notes = จดบันทึก (ไม่ใช่ make/do notes)",
    },
    {
      prompt: "Choose the correct phrasal verb: Please don't ______ — you can pass the exam if you keep practicing.",
      options: ["give up", "give away", "take up", "look up"],
      answer: 0,
      explanation: "give up = ยอมแพ้ | give away = แจกจ่าย/เผยความลับ | take up = เริ่มทำกิจกรรม | look up = ค้นหา",
    },
    {
      prompt: "Choose the word that completes the sentence: Regular exercise can ______ your health.",
      options: ["improve", "damage", "reduce", "forget"],
      answer: 0,
      explanation: "improve (ทำให้ดีขึ้น) — การออกกำลังกายสม่ำเสมอช่วยให้สุขภาพดีขึ้น ตรงตามเหตุผล",
    },
    {
      prompt: "Which word best fits: The teacher asked us to ______ our homework before Friday.",
      options: ["submit", "celebrate", "invite", "apologize"],
      answer: 0,
      explanation: "submit homework = ส่งงาน (collocation มาตรฐานในบริบทโรงเรียน)",
    },
    {
      prompt: "Choose the word closest in meaning to \"quickly\":",
      options: ["slowly", "rapidly", "rarely", "carefully"],
      answer: 1,
      explanation: "rapidly = อย่างรวดเร็ว (synonym ของ quickly) | rarely = นาน ๆ ครั้ง",
    },
    {
      prompt: "Complete: I'm ______ in learning new languages because it's useful for my future.",
      options: ["boring", "interested", "tired", "afraid"],
      answer: 1,
      explanation: "be interested in = สนใจ (โครงสร้างที่พบบ่อย) — boring ใช้กับสิ่งที่น่าเบื่อ ไม่ใช่ความรู้สึกคน",
    },
    // ===== Part 2: Grammar (10) =====
    {
      prompt: "Choose the correct sentence.",
      options: [
        "I have studied English since 2023.",
        "I have studied English since three years.",
        "I have studied English for 2023.",
        "I have been studied English since 2023.",
      ],
      answer: 0,
      explanation: "since + จุดเริ่มต้น (since 2023) / for + ช่วงเวลา (for three years) — และต้องเป็น active (have studied) ไม่ใช่ passive",
    },
    {
      prompt: "She ______ in this school for ten years. She still works here.",
      options: ["teaches", "has taught", "taught", "was teaching"],
      answer: 1,
      explanation: "for ten years + ยังทำอยู่ (She still works here) → Present Perfect (has taught)",
    },
    {
      prompt: "Have you ______ finished your homework? Hurry up!",
      options: ["yet", "already", "ever", "never"],
      answer: 1,
      explanation: "คำถามที่คาดว่าน่าจะเสร็จแล้วและอยากให้เร็ว ใช้ already | yet ใช้ในคำถามเป็นกลาง ๆ ว่าเสร็จหรือยัง",
    },
    {
      prompt: "I have never ______ to Chiang Mai before.",
      options: ["gone", "been", "went", "going"],
      answer: 1,
      explanation: "ประสบการณ์ใช้ have/has never been to + สถานที่ (have/has + V.3)",
    },
    {
      prompt: "They ______ for two hours. They look very tired.",
      options: ["have been running", "run", "were running", "are running"],
      answer: 0,
      explanation: "เน้นการกระทำต่อเนื่องเป็นช่วงเวลา + ผลเห็นตอนนี้ (look tired) → Present Perfect Continuous (have been + V.ing)",
    },
    {
      prompt: "She ______ English for three hours straight — no wonder she needs a break.",
      options: ["studies", "studied", "has been studying", "is studying"],
      answer: 2,
      explanation: "for three hours straight (ต่อเนื่องถึงตอนนี้) → Present Perfect Continuous",
    },
    {
      prompt: "How long ______ you ______ this game?",
      options: ["have / been playing", "did / play", "are / playing", "do / play"],
      answer: 0,
      explanation: "ถามระยะเวลาที่ทำต่อเนื่องมา ใช้ How long + have/has + subject + been + V.ing",
    },
    {
      prompt: "She ______ TV when the phone rang.",
      options: ["watches", "watched", "was watching", "has watched"],
      answer: 2,
      explanation: "เหตุการณ์ยาวที่กำลังเกิดและถูกขัดจังหวะ → Past Continuous (was watching) คู่กับ Past Simple (rang)",
    },
    {
      prompt: "While I ______ to school, I saw an accident.",
      options: ["walk", "was walking", "have walked", "am walking"],
      answer: 1,
      explanation: "while + Past Continuous (เหตุการณ์ยาว) / when + Past Simple (เหตุการณ์สั้นขัดจังหวะ)",
    },
    {
      prompt: "Yesterday, my friends and I ______ football after school.",
      options: ["play", "were playing when it ended", "played", "have played"],
      answer: 2,
      explanation: "yesterday + เหตุการณ์จบชัดเจนในอดีต → Past Simple (played)",
    },
    // ===== Part 3: Reading (10) =====
    {
      prompt: "Read the passage: \"Tom has lived in Bangkok for five years. He moved there after finishing high school because he wanted to study engineering. At first, city life was hard for him, but now he loves the fast pace and the friendly people.\" Why did Tom move to Bangkok?",
      options: [
        "Because his family lives there",
        "Because he wanted to study engineering",
        "Because he loves the food",
        "Because he found a job there",
      ],
      answer: 1,
      explanation: "ประโยค He moved there ... because he wanted to study engineering — คำตอบอยู่ใน passage โดยตรง (seen reading)",
    },
    {
      prompt: "(Passage เดิม) How does Tom feel about city life now?",
      options: ["He still finds it hard", "He enjoys it", "He wants to move back home", "He never talks about it"],
      answer: 1,
      explanation: "now he loves the fast pace and the friendly people → ปัจจุบันเขาชอบชีวิตเมือง",
    },
    {
      prompt: "(Passage เดิม) How long has Tom lived in Bangkok?",
      options: ["Three years", "Four years", "Five years", "Ten years"],
      answer: 2,
      explanation: "ประโยคแรก: has lived in Bangkok for five years",
    },
    {
      prompt: "Read: \"Recycling is one of the easiest ways to help the environment. When we recycle paper, plastic, and glass, we reduce the amount of waste in landfills. This also saves natural resources because old materials can be used to make new products.\" What is the main idea of the passage?",
      options: [
        "Landfills are dangerous places",
        "Recycling helps the environment in several ways",
        "Paper is the best material to recycle",
        "New products are expensive",
      ],
      answer: 1,
      explanation: "ประโยคแรก (topic sentence) บอก main idea: recycling เป็นวิธีง่าย ๆ ช่วยสิ่งแวดล้อม แล้วยกประโยชน์ 2 ข้อสนับสนุน",
    },
    {
      prompt: "(Passage เดิม) According to the passage, recycling saves natural resources because ______.",
      options: [
        "landfills get smaller every day",
        "old materials can be used to make new products",
        "people buy fewer things",
        "plastic is cheap",
      ],
      answer: 1,
      explanation: "ประโยคท้าย: This also saves natural resources because old materials can be used to make new products",
    },
    {
      prompt: "(Passage เดิม) The word \"reduce\" in the passage is closest in meaning to ______.",
      options: ["increase", "decrease", "collect", "throw away"],
      answer: 1,
      explanation: "reduce = ลดลง (decrease) — ทายจากบริบท: รีไซเคิลช่วยลดปริมาณขยะใน landfill",
    },
    {
      prompt: "Read: \"Anna was walking home in the rain when she found a wallet on the sidewalk. Inside, there was a lot of money and an ID card. Although she needed money for a new phone, she went straight to the police station and gave them the wallet.\" What kind of person is Anna?",
      options: ["Careless", "Honest", "Funny", "Lazy"],
      answer: 1,
      explanation: "เธอเจอเงินมากมายแต่นำส่งตำรวจทันทีแม้ตัวเองต้องการเงิน → honest (ซื่อสัตย์) — ข้อสรุปต้องมีเหตุผลจากเรื่องรองรับ",
    },
    {
      prompt: "(Passage เดิม) Why is the detail about Anna's broken phone important to the story?",
      options: [
        "It shows she had a lot of money",
        "It shows that giving the wallet back was a difficult but honest choice",
        "It explains why she was walking in the rain",
        "It proves she dislikes phones",
      ],
      answer: 1,
      explanation: "ข้อ inference — รายละเอียด \"ตัวเองก็ต้องการเงิน\" เพิ่มความยากของการเลือกซื่อสัตย์ ทำให้การกระทำน่ายกย่อง",
    },
    {
      prompt: "(Passage เดิม) The best title for this passage is ______.",
      options: [
        "Anna's New Phone",
        "An Honest Choice",
        "The Rainy City",
        "The Police Station",
      ],
      answer: 1,
      explanation: "ชื่อเรื่องควรครอบคลุมใจความหลัก — หัวใจของเรื่องคือการเลือกที่จะซื่อสัตย์ (An Honest Choice)",
    },
    {
      prompt: "(Passage เดิม) From the passage, we can infer that Anna walked home in the rain because ______.",
      options: [
        "she was going to the police station",
        "she was on her way home and the rain was unexpected",
        "she wanted to find a wallet",
        "she lost her phone in the rain",
      ],
      answer: 1,
      explanation: "ข้อ unseen inference — เธอพบกระเป๋าสตางค์ระหว่างเดินกลับบ้าน (walking home ... when she found) แสดงว่าฝนตกขณะเดินทางกลับ ไม่ใช่เดินออกมาหาของ",
    },
  ],
};
