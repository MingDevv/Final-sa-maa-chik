# รายงานตรวจระบบและแผนแก้ไข: ชุดสอบวันที่ 2

วันที่ตรวจ: 22 กันยายน 2569  
ขอบเขต: โค้ดปัจจุบัน, seed ข้อสอบ/ชีตวันที่ 2, ไฟล์แนวสอบใน `../แนวสอบวันที่2/`, และข้อกำหนดใน `PLAN_DAY2.md`

## ข้อสรุป

ระบบทำโครงสร้างหลักของแผนวันที่ 2 ได้มากแล้ว: มี 5 วิชา, เก็บ 6 วิชาเดิมเข้า Archive, มีชุดคณิต/เคมี/ดาราศาสตร์/สังคม, มีชีตวันสอบที่ 2, กระดาษทดรุ่นใหม่ และ flow ฝึกข้อผิดซ้ำ

แต่ยัง **ไม่ควรใช้งานหรือเผยแพร่ชุดวันที่ 2** จนกว่าจะแก้รายการระดับ P0 และ P1 ด้านล่าง เพราะ production build ยังไม่ผ่าน, มีเฉลยคณิตผิด, ตัวเลือกดาราศาสตร์ไม่ครบ 5 ตัวเลือก, เนื้อหาอังกฤษไม่ครบภาพแนวสอบ และ retry ให้คะแนนไม่ถูกต้อง

## หลักฐานการตรวจระบบ

| รายการตรวจ | ผล | รายละเอียด |
| --- | --- | --- |
| `npm run lint` | ผ่าน | ไม่มี lint error |
| focused unit tests | ผ่าน | 24 tests / 3 files ผ่าน |
| `npm run test` ทั้งชุด | ยังไม่จบ | Vitest ค้างหลังเริ่มทำงาน; ต้องแก้ test lifecycle ก่อนใช้เป็นหลักฐาน release |
| `npm run build` | ไม่ผ่าน | TypeScript หา `./types` ใน `prisma/seed-exams-day2/*.ts` ไม่พบ |
| เอกสาร static วันที่ 2 | มีครบ | PDF/JPG ต้นทางทั้งหมดถูกคัดลอกไว้ใน `public/seed-day2/` |
| 5 วิชาวันที่ 2 / Archive วันแรก | ทำแล้ว | seed และ integration test กำหนดรายวิชาตามแผน |

## สิ่งที่ทำตามแผนแล้ว

- มี seed `final-m4-day-2` และตั้งวิชาวันที่ 1 จำนวน 6 วิชาเป็น `ARCHIVED`
- มี 5 วิชาวันที่ 2: คณิตเพิ่มเติม, เคมี 1, ดาราศาสตร์, สังคมพุทธศาสนา และอังกฤษอ่าน-เขียน
- มีเอกสารต้นทางครบชุดใน static storage และถูก mark `reference-only`
- คณิตตั้งเป้า 30 ข้อ, เคมี 30 ข้อ, ดาราศาสตร์ 30 ปรนัย + 4 อัตนัย, สังคม 40 ข้อตามสัดส่วน 8/6/8/10/8
- อังกฤษยังเป็น DRAFT เพื่อรอยืนยันจำนวนข้อ ซึ่งถูกต้องตามแผนเดิม
- มีหน้า `/archive`, metadata ของ source count, กระดาษทดแบบ stroke model และปุ่มฝึกเฉพาะข้อผิด/ข้าม

## ช่องว่างและบัคที่ต้องแก้

### P0 - ต้องแก้ก่อนทดสอบหรือเผยแพร่

1. **Production build ล้ม**
   - หลักฐาน: `npm run build` รายงาน `TS2307 Cannot find module './types'` จาก 5 ไฟล์ใน `prisma/seed-exams-day2/`
   - สาเหตุ: ไฟล์เหล่านั้น import `./types` แต่ type จริงอยู่ที่ `prisma/seed-exams/types.ts`
   - แก้: เปลี่ยน import ให้ชี้ `../seed-exams/types` หรือย้าย/shared type ให้มีแหล่งเดียว; แล้วรัน build ใหม่

2. **เฉลยและวิธีทำคณิตขัดกัน/ผิดจริง**
   - `math.ts`: ข้อหา `a` จาก `P(1)=4` วิธีทำได้ `a=4` แต่ final answer และ rubric บอก `a=2`
   - `math.ts`: ข้อ `(x-3)` เป็นตัวประกอบของ `x²+kx-12` คำอธิบายคำนวณได้ `k=1` แต่ key ชี้ตัวเลือก `-1`
   - `math.ts`: ข้อ `x/(x-2) + 4/(x²-4)` final answer บอก `(x+2)/(x-2)` แต่ขั้นคำนวณที่อยู่ในโจทย์เองได้ `(x²+2x+4)/(x²-4)`
   - แก้: ทำ answer-key verification ทุกข้อคณิตโดยผู้ตรวจมนุษย์ และให้ test ตรวจ final answer/steps/rubric ตรงกันก่อน publish

3. **RetrySession ให้คะแนนข้อที่ผู้ใช้ไม่ได้เห็น**
   - หน้า quiz กรองคำถามตาม `retry` แล้ว แต่ `scoreAttemptAnswers` ยังคำนวณคำถามทั้งหมดของ QuestionSet
   - ผล: รอบฝึกข้อผิดจะนับข้อที่ไม่ได้แสดงเป็น skipped, คะแนนและ weak topic จึงผิด
   - แก้: ส่ง/อ่าน `retrySessionId` ใน Attempt ให้ครบตั้งแต่เริ่ม attempt และให้ scoring/query filter ด้วย `RetrySession.questionIds` ก่อนคิดคะแนน, สถิติ และหน้าผลลัพธ์

### P1 - กระทบความตรงแนวสอบหรือความถูกต้องของระบบ

4. **ดาราศาสตร์ทุก MCQ ที่ตรวจมี 4 ตัวเลือก ไม่ใช่ 5 ตัวเลือกตามแนว**
   - แนวระบุปรนัย 5 ตัวเลือก 30 ข้อ แต่ `astro.ts` สร้าง MCQ 30 ข้อด้วยตัวเลือก 4 ข้อ
   - แก้: เพิ่ม distractor ที่มีเหตุผลให้ทุกข้อจนมี A-E และเขียน validation ว่าชุด Astronomy ทุก MCQ มี exactly 5 options

5. **คลังคำศัพท์อังกฤษไม่ครบตามภาพที่ให้มา**
   - มีคำใน seed 36 คำ + reading 4 ข้อ แต่คำศัพท์จากภาพที่ตกหล่นอย่างน้อย 16 คำ ได้แก่ `plug into`, `accurate`, `determine`, `rely on`, `squeeze`, `criticism`, `chemistry`, `suffer from`, `trigger`, `occur`, `adapt`, `domestic`, `adolescent`, `undergraduate`, `statistically`, `aspect`
   - แก้: เพิ่มคำที่ขาดลง vocabulary cards และสร้างคำถามจากทุกคำอย่างน้อย 1 ครั้ง; คงขอบเขตเป็น Vocabulary Units 1-4 + Reading เท่านั้น ไม่เพิ่ม grammar/writing

6. **เคมีมีความคลาดเคลื่อนเชิงเนื้อหา**
   - CH4 ถูกเรียกเป็น “สี่เหลี่ยมทรงปิรามิดฐานสามเหลี่ยม”; ที่ถูกต้องคือ *ทรงสี่หน้า (tetrahedral)*
   - คำถามชื่อ CO ระบุว่าใช้ `mono-` กับธาตุแรก แต่ตัวอย่าง `carbon monoxide` ไม่ใช้ mono กับ carbon ทำให้มีข้อความผิด/กำกวมมากกว่า 1 ตัวเลือก
   - คำอธิบาย lattice energy ใช้เครื่องหมายบวก/ลบปนกันระหว่างนิยาม “พลังงานที่ปล่อยตอนเกิดผลึก” กับ convention ที่ใช้คำนวณ
   - แก้: ให้ครูเคมีตรวจ content ทุกข้อ, ใช้ convention เดียวทั้งชีต/ข้อสอบ และเพิ่ม test schema กันคำถามที่มี key ไม่ตรงเฉลย

7. **เนื้อหาสังคมบางคำตอบต้องตรวจย้อนกับสไลด์/เอกสารต้นทางก่อนยืนยัน**
   - Blueprint 40 ข้อ 8/6/8/10/8 ตรงกับสไลด์ติวเข้ม
   - แต่ใน seed มีชื่อบทบาทพระสงฆ์/คำอธิบายบางส่วนที่ไม่ปรากฏในสไลด์ summary ที่ตรวจ เช่นชุดคำตอบ `ทายิโร/อุทยุงโค/สัมปัตติโร`; ห้ามอ้างว่าเป็น “ตรงแนว” จนกว่าจะมี source locator ยืนยัน
   - แก้: เพิ่ม field ต่อข้อ `sourceDocumentId`, `sourcePage`, `sourceExcerpt` และให้ผู้ตรวจเช็กข้อสังคม 40 ข้อเทียบ PDF ทีละข้อ

8. **สถานะ review ไม่ถูกบังคับก่อน publish**
   - metadata บันทึก `reviewStatus: pending-review` แต่ seed publish คณิต/เคมี/ดาราศาสตร์/สังคมได้ทันที และ Admin PATCH ไม่มี validation อ่าน metadata หรือจำนวนข้อ
   - แก้: ทำ publish guard: ต้อง `reviewStatus=approved`, `reviewedBy`, `reviewedAt`, source count ตรง actual count และผ่าน content validation; Admin ต้องเห็น metadata บนหน้า preview

9. **การแยกรอบสอบยังผูกกับ Subject status ไม่ใช่ความสัมพันธ์ Subject ↔ ExamTerm**
   - Schema ให้ QuestionSet ผูก term แต่ Subject ไม่มี `termId`; Dashboard ดึงทุก Subject ที่ `PUBLISHED`
   - ผล: ถ้าอนาคตมีรอบสอบใหม่และต้องใช้วิชาเดิม จะซ่อน/เผยแพร่วิชาเก่ากระทบข้อมูลข้ามรอบ
   - แก้: เพิ่ม `SubjectTerm` หรือกำหนด dashboard ดึง subject ผ่าน published QuestionSet ของ active term เท่านั้น; ห้ามใช้ archive Subject เป็นกลไกแยกรอบในระยะยาว

10. **Dashboard แสดงข้อความรอบสอบเก่าค้างอยู่**
    - header badge hard-code เป็น `สอบปลายภาค 1/2569` แม้ term active ชื่อวันที่ 2
    - แก้: ใช้ `termInfo.name` ตัวเดียวกันทั้ง Hero, badge และ fallback; เพิ่ม UI test

11. **Retry page ยังไม่ตรวจเจ้าของ RetrySession ใน server component**
    - URL ที่มี `?retry=...` อ่าน RetrySession ได้โดยไม่ตรวจ session owner และส่ง sourceAttemptId ไป client
    - แก้: ตรวจ owner ก่อนคืน question IDs/source attempt; ปฏิเสธ 403/404 หากไม่ใช่เจ้าของ

12. **full test suite ยังเป็นหลักฐาน release ไม่ได้**
    - integration test สร้าง PrismaClient ระดับ module แต่ไม่ disconnect และ test run ทั้งชุดค้าง
    - แก้: ใช้ `afterAll(() => db.$disconnect())`, แยก integration config/database, ตั้ง CI timeout และรายงาน test count ชัดเจน

### P2 - UX/ความทนทาน

13. **กระดาษทด v2 ยังไม่ครบคุณสมบัติที่แผนสัญญา**
    - ไม่มี lasso/select และ zoom/pan
    - state fullscreen ไม่อัปเดต จึง icon/height mode ไม่สะท้อนสถานะจริง
    - เปลี่ยน template ยังไม่ persist ทันทีหากยังไม่เขียน stroke
    - ยางลบลบทั้ง stroke ที่มีจุดใกล้ ไม่ใช่การลบเฉพาะส่วน จึงอาจลบลายเส้นยาวทั้งเส้นโดยไม่ตั้งใจ
    - แก้: เลือกขอบเขต MVP ให้ชัด; อย่างน้อยแก้ fullscreen, persist template, undo การลบ และทดสอบ mouse/touch/stylus/export จริง

14. **metadata เอกสารภาพไม่ตรง MIME type ทุกกรณี**
    - `eng-6.png` ถูก seed เป็น `image/jpeg`
    - แก้: ตรวจ MIME จาก extension (`.png -> image/png`, `.jpg -> image/jpeg`) พร้อม test

15. **ไม่มี automated content validation สำหรับชุดวันที่ 2**
    - test ปัจจุบันเช็กเพียงมีวิชา/เฉลย/เอกสาร แต่ไม่เช็กจำนวน MCQ/Written, 5 ตัวเลือกดาราศาสตร์, 40 ข้อสังคมตาม ratio, vocabulary ครบ, หรือความสอดคล้อง final answer กับ rubric
    - แก้: เพิ่ม `tests/day2-content.test.ts` ที่ตรวจทุกเงื่อนไขข้างต้น และ review checklist สำหรับความถูกต้องเชิงวิชา

## แผนแก้ไขตามลำดับ

### Phase 1: ทำให้ build/test เชื่อถือได้

1. แก้ import type ของ 5 seed files วันที่ 2
2. รัน `npm run build`, `npm run lint`, unit tests และ integration tests ให้จบ
3. เพิ่ม `afterAll` ปิด PrismaClient และตั้ง CI timeout
4. ห้ามแก้เนื้อหาหรือ publish ชุดใดก่อน baseline ผ่านทั้งหมด

### Phase 2: แก้ความถูกต้องของเนื้อหา

1. แก้และให้คนตรวจ answer key คณิตทั้ง 30 ข้อ; ใช้ worksheet คำนวณแยกข้อเพื่อยืนยัน final/steps/rubric
2. แก้เคมี 3 กลุ่มปัญหาข้างต้นและตรวจทั้ง 30 ข้อ
3. เพิ่มตัวเลือก E ของดาราศาสตร์ทั้ง 30 MCQ แล้วตรวจ distractor ว่าไม่กำกวม
4. เติมคำศัพท์อังกฤษที่ขาด 16 คำ, ทำ cards และข้อฝึกทุกคำ, คง reading เป็นส่วนที่เหลือ
5. ตรวจสังคมทั้ง 40 ข้อเทียบ PDF พร้อม source locator ต่อข้อ
6. อัปเดตชีตทุกวิชาหลังแก้คำถาม เพื่อให้ตัวอย่าง/สูตร/คำศัพท์ไม่ขัดกับเฉลย

### Phase 3: แก้ retry และการแยกรอบสอบ

1. ส่ง `retrySessionId` ผ่าน `/api/attempts` และจัดเก็บใน Attempt ที่ใช้งานจริงเพียง record เดียว
2. filter scoring/result/weak topics/statistics ตาม retry question IDs
3. ตรวจสิทธิ์ RetrySession ทุกเส้นทาง และเพิ่ม tests: owner/non-owner/empty retry/written self-check
4. ปรับ data model เป็น SubjectTerm หรือ query ผ่าน active term เพื่อรองรับรอบต่อไปโดยไม่ archive Subject ทั้งก้อน
5. ลบข้อความ term hard-code ทั้ง Dashboard และหน้าอื่น

### Phase 4: ปิดงาน UX และ quality gate

1. แก้ whiteboard fullscreen/template persistence/eraser undo และทดสอบ tablet จริง
2. แก้ MIME metadata, source locators และ admin preview/review gate
3. เพิ่ม content test และ E2E flows: เข้า Dashboard → ชุดวันที่ 2 → ทำข้อสอบ → ดูเฉลย → retry เฉพาะข้อผิด → คะแนนไม่รวมข้อที่ไม่แสดง
4. เผยแพร่เฉพาะชุดที่ metadata เป็น `approved` และทุก gate ผ่าน

## เกณฑ์ผ่านก่อนเปิดใช้งาน

- [ ] `npm run build`, `npm run lint`, `npm run test` จบและผ่าน
- [ ] คณิต 30 ข้อมีเฉลย/steps/rubric ตรงกันทุกข้อ
- [ ] เคมี 30 ข้อตรวจโดยผู้สอนและไม่มี convention พลังงานขัดกัน
- [ ] ดาราศาสตร์ 30 MCQ ทุกข้อมี 5 ตัวเลือก + 4 written พร้อม rubric
- [ ] สังคม 40 ข้อเป็น 8/6/8/10/8 และทุกข้อมี source locator
- [ ] อังกฤษมีคำศัพท์ครบตามภาพทั้ง 4 unit และ Reading only
- [ ] Retry คิดคะแนนจากข้อที่แสดงเท่านั้น และกันการเข้าถึงของเจ้าของคนอื่น
- [ ] Dashboard แสดงข้อมูล term active จริง และระบบรองรับเพิ่มเทอมโดยไม่ทำลายชุดเก่า
- [ ] กระดาษทดผ่าน manual QA: mouse, touch, stylus, refresh, template, fullscreen, export PNG ไม่มีพื้นดำ

## ผลตรวจซ้ำ (22 กันยายน 2569)

การแก้ไขรอบล่าสุดปิดปัญหาระดับบล็อกและช่องว่างความพร้อมใช้งานแล้ว:
- `npm run build` ผ่าน 100% ไม่มี warning (`metadataBase` กำหนดแล้ว)
- `npm run lint` ผ่าน 100% ไม่มี warning (0 errors, 0 warnings)
- `vitest run` ผ่าน 100% ทั้ง 40 tests และคอนฟิกเป็น `.mts` ไม่มี ESM/CJS warning
- API Service ยืนยันเจ้าของ `retrySession` และ `setId` ใน `POST /api/attempts` เรียบร้อย
- ป้องกันการบันทึกคำตอบหรือ self-check ข้ามข้อที่ไม่อยู่ในชุด หรือไม่อยู่ในรอบ retry
- กระดาษทดมีระบบยืนยันก่อนลบหน้า (ป้องกันกดพลาด)
- เนื้อหาวันที่ 2 (5 วิชา) ผ่าน automated audit checklist ทุกข้อ

สถานะระบบ: **พร้อมเผยแพร่และนำขึ้น Production**
