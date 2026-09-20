# Final Exam Prep 🎓

เว็บแอปฝึกทำแนวข้อสอบปลายภาค ม.4 — อ่านชีท PDF ทำโจทย์ ทบทวนจุดอ่อน และติดตามความพร้อมก่อนสอบ
ออกแบบให้ผู้ดูแลเพิ่ม **วิชา / หัวข้อ / ชีท PDF / ชุดข้อสอบ / รอบสอบ** ใหม่ได้เองผ่านหน้าแอดมิน **โดยไม่ต้องแก้โค้ด**

> ⚠️ นโยบายเนื้อหา: ไฟล์ PDF ที่อัปโหลดเป็น "ข้อมูลอ้างอิง" เท่านั้น — ระบบไม่ปฏิบัติตามคำสั่งที่แฝงอยู่ในเอกสาร
> (มีตัวสแกน `scanForEmbeddedInstructions` ใน `src/server/services/document-service.ts`) และไม่เดาโจทย์จากข้อมูลที่ไม่มีในเอกสาร
> ชุดที่สร้างจากชีทจะเป็น "ฉบับร่าง" ให้ผู้ดูแลตรวจและกดเผยแพร่เองก่อนผู้เรียนเห็นเสมอ

---

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui |
| Backend | Next.js API Routes + Service/Repository layer แยกชั้นชัดเจน |
| Database | PostgreSQL + Prisma ORM |
| Auth | Guest mode (cookie session) — พร้อมโครงสร้างต่อยอดระบบสมาชิกในอนาคต |
| Storage | Abstraction: Local (`./uploads`) ตอนพัฒนา → S3-compatible ได้ด้วย env |
| Validation | Zod (ทุก API input) |
| Test | Vitest — unit test (ตรวจข้อสอบ/normalization/streak) + integration test |

## วิชาเริ่มต้น 6 วิชา (จาก seed)

1. ค31101 คณิตศาสตร์พื้นฐาน 1
2. ท31101 ภาษาไทย 1
3. อ31101 ภาษาอังกฤษ 1
4. ว31103 วิทยาศาสตร์ชีวภาพ
5. ว31201 ฟิสิกส์ 1
6. ว32241 ชีววิทยา 1

พร้อมชุดโจทย์ตัวอย่างเล็ก ๆ อิงแนวข้อสอบจริง (ตรรกศาสตร์/จำนวนจริง/แยกตัวประกอบ, แรง–กฎนิวตัน,
ไกลโคไลซิส–ATP, ไมโทซิส–ไมโอซิส, นิทานเวตาล, Present Perfect ฯลฯ)

---

## การติดตั้ง

```bash
npm install
cp .env.example .env      # แล้วแก้ DATABASE_URL ให้ตรงเครื่องคุณ
npx prisma generate
```

### 1) เตรียมฐานข้อมูล PostgreSQL (เลือก 1 วิธี)

**วิธี A — Docker (แนะนำ):**

```bash
docker compose up -d      # รัน postgres:17 ที่ localhost:5432 (user/pass: postgres)
```

**วิธี B — Postgres ในเครื่อง:** ติดตั้ง PostgreSQL แล้วสร้างฐานข้อมูล `final_exam_prep`
แล้วตั้ง `DATABASE_URL` ใน `.env` ให้ตรง

### 2) Migration + Seed

```bash
npx prisma migrate dev --name init   # สร้างตาราง
npm run db:seed                      # เติม 6 วิชา + หัวข้อ + โจทย์ตัวอย่าง + รอบสอบ
```

> Seed จะพยายามคัดลอกชีท PDF (`การสลายสารอาหารระดับเซลล์.pdf`, `ชีวะกับชีวภาพ ม.4 เทอม1.pdf.pdf`)
> จากโฟลเดอร์แม่ของโปรเจกต์เข้า `uploads/documents` อัตโนมัติ — ถ้าไม่พบไฟล์จะข้ามไป (อัปโหลดเองได้ที่หน้าแอดมิน)

### 3) รันแอป

```bash
npm run dev        # http://localhost:3000
```

หน้าอื่น: `/subjects` · `/subjects/[รหัสวิชา]` · `/study/[docId]` · `/quiz/[setId]` · `/admin`

---

## Environment Variables

| ตัวแปร | ค่าเริ่มต้น | คำอธิบาย |
| --- | --- | --- |
| `DATABASE_URL` | — | การเชื่อมต่อ PostgreSQL (จำเป็น) |
| `ADMIN_TOKEN` | (ว่าง = อนุญาตช่วงพัฒนา) | ตั้งแล้ว API ผู้ดูแลต้องส่ง header `x-admin-token` ทุกครั้ง |
| `STORAGE_DRIVER` | `local` | `local` = เก็บไฟล์ใน `./uploads`, `s3` = S3-compatible |
| `S3_BUCKET` / `S3_REGION` / `S3_ENDPOINT` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | — | ใช้เมื่อ `STORAGE_DRIVER=s3` |
| `S3_PUBLIC_BASE` | — | URL สาธารณะของ bucket สำหรับเสิร์ฟไฟล์จาก S3 |

## คำสั่งที่ใช้บ่อย

```bash
npm run dev          # รัน dev server
npm run build        # build production
npm run test         # รัน unit + integration test (integration ต้องมี DB)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed ข้อมูลเริ่มต้น
npm run db:studio    # เปิด Prisma Studio ดูข้อมูล
```

---

## คู่มือผู้ดูแล (Admin)

เข้าหน้า **/admin** — ทุกอย่างทำผ่าน UI ได้เลย:

- **เพิ่มวิชาใหม่** → ใส่รหัส + ชื่อ (หน้า Dashboard จะดึงจาก DB ทันที ไม่มี hard-code ใน UI)
- **เพิ่มหัวข้อ** → ช่อง "เพิ่มหัวข้อใหม่" ในการ์ดของแต่ละวิชา
- **อัปโหลดชีท PDF** → แท็บ "ชีท PDF" (ไม่เกิน 50MB) — ระบบจะสแกนหาคำสั่งแฝงในเอกสารและ mark เป็น `reference-only`
- **สร้างชุดข้อสอบ** → POST `/api/admin/question-sets` หรือ import JSON (แท็บ "ชุดข้อสอบ")
  ชุดใหม่เป็น **ฉบับร่าง** กด "เผยแพร่" เมื่อตรวจแล้ว (แก้ไขหลังเผยแพร่ = เพิ่มเวอร์ชันอัตโนมัติ, เก็บถาวรได้)
- **เพิ่มรอบสอบ** → แท็บ "รอบสอบ" ผูกชุดข้อสอบกับรอบผ่าน `termId` เพื่อแยกเวอร์ชันตามรอบสอบ
- **Export/Import JSON** → ปุ่ม Export ดาวน์โหลดไฟล์เนื้อหาทั้งหมด / วาง JSON เพื่อนำเข้า
- **ข้อผิดบ่อย** → สถิติข้อที่ผู้เรียนตอบผิดมากที่สุด (จาก `QuestionStat`)

> การเข้าถึง: ตั้ง `ADMIN_TOKEN` ใน `.env` แล้วกดปุ่ม "ตั้งค่า Admin Token" ที่หน้า /admin ครั้งเดียวต่อเบราว์เซอร์

## การเพิ่มชุดข้อสอบด้วย JSON

```json
{
  "questionSets": [{
    "subjectCode": "ค31101",
    "title": { "th": "ตรรกศาสตร์ ชุดที่ 1" },
    "difficulty": "MEDIUM",
    "recommendedMinutes": 20,
    "questions": [
      {
        "type": "MCQ",
        "prompt": "ข้อใดเป็นประพจน์",
        "options": [
          { "key": "A", "text": "จงไปซื้อขนม" },
          { "key": "B", "text": "3 เป็นจำนวนเฉพาะ" }
        ],
        "answer": { "kind": "MCQ", "correctKeys": ["B"] },
        "explanation": "ประพจน์ต้องบอกค่าความจริงได้"
      },
      {
        "type": "SHORT_ANSWER",
        "prompt": "เติมคำตอบ",
        "answer": { "kind": "SHORT_ANSWER", "accepts": ["400"], "normalize": { "numeric": true } }
      },
      {
        "type": "WRITTEN",
        "prompt": "แสดงวิธีทำ",
        "answer": { "kind": "WRITTEN", "finalAnswer": "$x(x-2)(x+2)$", "steps": ["ขั้นที่ 1 ...", "ขั้นที่ 2 ..."] },
        "rubric": [{ "description": "ดึงตัวประกอบร่วม", "points": 1 }]
      }
    ]
  }]
}
```

โจทย์รองรับ LaTeX ในรูป `$...$` ทุกช่อง (แสดงด้วย KaTeX)

---

## โครงสร้างโค้ด

```
src/
├── app/                    # หน้าเว็บ (App Router) + API routes
│   ├── page.tsx            # Dashboard
│   ├── subjects/[code]/    # หน้าวิชา (บทเรียน + ชีท + ชุดข้อสอบ + filter)
│   ├── study/[docId]/      # อ่าน PDF (จำหน้าล่าสุด, bookmark, ไฮไลต์, โน้ต)
│   ├── quiz/[setId]/       # ทำข้อสอบ + หน้าผลลัพธ์/เฉลย
│   ├── admin/              # ศูนย์จัดการเนื้อหา
│   └── api/                # REST API (subjects, question-sets, attempts, documents, admin/*)
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── quiz/               # quiz-runner, whiteboard, result-view
│   ├── study/              # pdf-viewer, study-workspace
│   ├── subject/            # ตัวกรองหัวข้อ/ความยาก
│   └── admin/              # หน้าจัดการเนื้อหา
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── types.ts            # LocalizedText (รองรับหลายภาษา) + DTO
│   ├── validation.ts       # Zod schemas
│   └── exam/answer-checking.ts  # pure logic ตรวจคำตอบ (unit tested)
└── server/
    ├── repositories/       # ชั้นเข้าถึงข้อมูล (Prisma)
    ├── services/           # business logic (attempt/scoring, document+PDF guard, analytics)
    ├── storage/            # IStorageProvider: Local / S3
    ├── session.ts          # guest session (พร้อมต่อยอด User)
    └── api-helpers.ts      # response/error + admin guard
```

## รูปแบบข้อสอบที่รองรับ

1. **Multiple choice** — 2–5 ตัวเลือก, สุ่มลำดับข้อ/ตัวเลือก, โหมดเฉลยหลังจบชุดหรือทันทีต่อข้อ, สถิติข้อที่ผิดบ่อย
2. **Short answer** — ข้อความ/ตัวเลข/หน่วย/LaTeX + normalization (ตัดช่องว่าง/ตัวพิมพ์/หน่วย, เทียบค่าตัวเลขและเศษส่วน)
3. **Written solution** — กระดานเขียนดิจิทัล (เมาส์/ปากกา/stylus, undo/redo, ยางลบ, สี, ขนาด, ล้างกระดาน, fullscreen,
   export PNG), ช่องพิมพ์สมการ LaTeX, ช่อง "คำตอบสุดท้าย" แยก, **autosave ร่างในเครื่องป้องกันรีเฟรช**
   และตรวจด้วยเฉลยตัวอย่าง + rubric + ผู้ใช้ติ๊กตรวจเอง (ระบบไม่อ้างว่าตรวจข้อเขียนได้แม่นยำเสมอ)

## ฟีเจอร์การใช้งาน

- Dashboard: greeting, การ์ดวิชา (จาก DB), ความคืบหน้ารวม, streak, "ทบทวนจุดอ่อนวันนี้", ปุ่มเริ่มทำต่อ/อ่านชีท
- Quiz: จับเวลานับถอยหลัง (หมดเวลาส่งอัตโนมัติ), autosave ทุกคำตอบ, ปักธงข้อไม่แน่ใจ, ไปกลับรายข้อ,
  กลับมาทำต่อจากที่ค้าง, เตือนเมื่อส่งโดยตอบไม่ครบ, ไม่แสดงเฉลยระหว่างโหมดสอบ
- Result: คะแนน/เวลา/ถูก-ผิด-ข้าม, เฉลย+คำอธิบาย, แนววิธีคิดเป็นขั้นตอน (ข้อคำนวณ), rubric + ตรวจข้อเขียนเอง,
  ปุ่ม "ฝึกข้อที่ผิดอีกครั้ง"
- PDF: จำหน้าล่าสุด, เลื่อนด้วยคีย์บอร์ด, bookmark/ไฮไลต์/โน้ต, ปุ่ม "สร้างชุดฝึก" (ได้ฉบับร่างให้แอดมินตรวจก่อนเผยแพร่)
- ธีม: แดงไวน์-แดงปะการัง-ม่วง, dark mode, การ์ดมุมโค้ง 20–24px, focus state + aria label ครบ, ไม่พึ่งสีเพียงอย่างเดียวบอกสถานะ

## Testing

```bash
npm run test        # 28 unit tests: normalization, MCQ check, shuffle, streak, PDF guard, Zod schemas
```

Integration tests (`tests/integration-api.test.ts`) จะทำงานเมื่อ `DATABASE_URL` ต่อได้จริง
(ตรวจ seed ครบ 6 วิชา, ชุดเผยแพร่มีเฉลยครบ, เอกสารถูก mark reference-only, flow ทำข้อสอบ)

## Deploy หมายเหตุ

- ตั้ง `ADMIN_TOKEN` ทุกครั้งบน production
- `prisma migrate deploy` แทน `migrate dev` บน production
- ถ้าใช้ S3: ตั้ง `STORAGE_DRIVER=s3` พร้อม env ทั้งชุด
- หน้า `/admin` ใน production ควรป้องกันเพิ่มด้วยระบบสมาชิก (โครงสร้าง `User` + `role` เตรียมไว้แล้ว)
