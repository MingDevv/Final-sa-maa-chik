// แฟลชการ์ด คณิตศาสตร์ บทที่ 1 ความสัมพันธ์ (1.1–1.6) — วิชา ค31201
// ข้อความในการ์ดรองรับสูตร $...$ (KaTeX)
import type { Flashcard } from "@/data/english-future-flashcards";
import type { FlashcardCategoryOption } from "@/components/flashcards/flashcard-deck";

const r = String.raw;

export const MATH_RELATIONS_FLASHCARD_CATEGORIES: FlashcardCategoryOption[] = [
  { label: "ทั้งหมด", value: "All" },
  { label: "นิยาม & สูตร", value: "นิยาม & สูตร" },
  { label: "กราฟ", value: "กราฟ" },
  { label: "โดเมน/เรนจ์", value: "โดเมน/เรนจ์" },
  { label: "ตัวผกผัน", value: "ตัวผกผัน" },
  { label: "กับดักข้อสอบ", value: "กับดักข้อสอบ" },
];

export const MATH_RELATIONS_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-mr-ordered-pair",
    title: "การเท่ากันของคู่อันดับ",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$(a,b) = (c,d)$ เมื่อไหร่?`,
      subtext: r`แล้วถ้า $(s+t,\ s-t) = (11,3)$ หา $s^2 - 2t$ ยังไง`,
      badge: "1.1",
    },
    back: {
      formula: r`$(a,b) = (c,d) \iff a = c \text{ และ } b = d$`,
      rule: "หน้าเท่าหน้า หลังเท่าหลัง แล้วแก้สมการ — ลำดับสำคัญ (1,2) กับ (2,1) คนละคู่",
      keywords: ["หน้าเท่าหน้า", "หลังเท่าหลัง", "บวกสองสมการ"],
      example: r`$s+t = 11,\ s-t = 3$ → $2s = 14$, $s = 7$, $t = 4$ → $s^2 - 2t = 49 - 8 = 41$`,
      examTip: "เจอ (ผลบวก, ผลต่าง) ให้บวกสองสมการหาตัวแรก แล้วแทนกลับหาตัวที่สอง",
    },
  },
  {
    id: "fc-mr-cartesian",
    title: "ผลคูณคาร์ทีเซียน A × B",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$A \times B$ คืออะไร และมีสมาชิกกี่ตัว?`,
      subtext: r`$A = \{1,2\},\ B = \{3,4,5\}$`,
      badge: "1.2",
    },
    back: {
      formula: r`$n(A \times B) = n(A) \cdot n(B)$`,
      rule: r`เซตของคู่อันดับ $(a,b)$ ทั้งหมดที่ $a \in A$ และ $b \in B$ — ตัวหน้ามาจากเซตหน้า ตัวหลังมาจากเซตหลังเสมอ`,
      keywords: [r`$A \times B \neq B \times A$`, r`$A \times \varnothing = \varnothing$`],
      example: r`$A \times B = \{(1,3),(1,4),(1,5),(2,3),(2,4),(2,5)\}$ มี $2 \cdot 3 = 6$ คู่`,
      examTip: r`$A \times B$ กับ $B \times A$ คนละเซต แต่จำนวนสมาชิกเท่ากัน`,
    },
  },
  {
    id: "fc-mr-distributive",
    title: "สมบัติการกระจาย",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$A \times (B \cup C)$, $A \times (B \cap C)$, $A \times (B - C)$ กระจายได้ไหม?`,
      badge: "1.2",
    },
    back: {
      formula: r`$A \times (B \cap C) = (A \times B) \cap (A \times C)$`,
      rule: r`กระจายได้ทั้ง 3 แบบ: $\cup$, $\cap$ และผลต่าง — ทำในวงเล็บก่อนแล้วค่อยคูณจะเร็วกว่า`,
      keywords: [r`$\cup$`, r`$\cap$`, r`$-$`],
      example: r`$M=\{1,2\}, N=\{2,3\}, P=\{4,5\}$: $N \cap P = \varnothing$ → $(M \times N) \cap (M \times P) = \varnothing$`,
    },
  },
  {
    id: "fc-mr-onet",
    title: "โจทย์ O-NET: หา n(B)",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$A = \{x \in \mathbb{N} \mid x^2 - 5x - 14 \le 0\}$, $n(A \times B) = 42$ แล้ว $n(B)$ = ?`,
      badge: "O-NET",
    },
    back: {
      rule: r`แยกตัวประกอบ $(x-7)(x+2) \le 0$ → $-2 \le x \le 7$ แต่ต้องเป็นจำนวนนับ → $A = \{1,\dots,7\}$`,
      keywords: [r`$\mathbb{N}$ = จำนวนนับ เริ่มที่ 1`],
      example: r`$7 \cdot n(B) = 42$ → $n(B) = 6$`,
      examTip: r`อย่านับ $-2, -1, 0$ เข้าไป เพราะ $x \in \mathbb{N}$`,
    },
  },
  {
    id: "fc-mr-relation-def",
    title: "ความหมายของความสัมพันธ์",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$r$ เป็นความสัมพันธ์จาก $A$ ไป $B$ เมื่อไหร่?`,
      subtext: r`$A=\{1,2\}, B=\{2,4\}$: $\{(1,2),(2,4)\}$ เป็นไหม? $\{(2,1),(4,2)\}$ ล่ะ?`,
      badge: "1.3",
    },
    back: {
      formula: r`$r \subset A \times B$`,
      rule: r`ทุกคู่ใน $r$ ต้องมีตัวหน้าใน $A$ และตัวหลังใน $B$ — ถ้า $r \subset A \times A$ เรียกว่าความสัมพันธ์บน $A$`,
      keywords: ["สับเซต", r`$\varnothing$ ก็เป็นความสัมพันธ์`],
      example: r`$\{(1,2),(2,4)\}$ เป็น ✔ แต่ $\{(2,1),(4,2)\}$ ไม่เป็น ✘ (เป็นจาก $B$ ไป $A$)`,
      examTip: r`$r$ เป็นความสัมพันธ์ ไม่ได้แปลว่า $r = A \times B$ แค่เป็นสับเซตก็พอ`,
    },
  },
  {
    id: "fc-mr-count",
    title: "จำนวนความสัมพันธ์ทั้งหมด",
    category: "กับดักข้อสอบ",
    front: {
      prompt: r`$n(A) = 2,\ n(B) = 3$ มีความสัมพันธ์จาก $A$ ไป $B$ กี่แบบ?`,
      subtext: "ตอบ 6 = ผิด!",
      badge: "ออกแน่",
    },
    back: {
      formula: r`$2^{n(A) \cdot n(B)}$`,
      rule: r`จำนวนความสัมพันธ์ = จำนวนสับเซตของ $A \times B$ → ยกกำลังของ 2`,
      keywords: [r`$n(A)n(B)$ = จำนวนคู่อันดับ`, r`$2^{n(A)n(B)}$ = จำนวนความสัมพันธ์`],
      example: r`$2^{2 \cdot 3} = 2^6 = 64$ ความสัมพันธ์ | บน $A$ ที่มี 5 ตัว: $2^{25}$`,
      examTip: r`จำนวนความสัมพันธ์ที่มีพอดี $k$ คู่ = เลือก $k$ คู่จาก $A \times B$ เช่น 4 คู่เลือก 2 ได้ 6 แบบ`,
    },
  },
  {
    id: "fc-mr-listing",
    title: "เขียนความสัมพันธ์แบบแจกแจง",
    category: "นิยาม & สูตร",
    front: {
      prompt: r`$A=\{0,2,4\}, B=\{0,1,2\}$ และ $x = 2y$ เขียน $r$ แบบแจกแจง`,
      badge: "1.3",
    },
    back: {
      rule: r`จัดให้ $y$ อยู่ในรูป $x$ แล้วแทน $x$ ทีละตัว เก็บเฉพาะคู่ที่ $y$ อยู่ในเซตหลัง`,
      keywords: ["แทนทีละตัว", "เช็คว่าอยู่ในเซตหลังไหม"],
      example: r`$y = \frac{x}{2}$: $(0,0),(2,1),(4,2)$ → $r = \{(0,0),(2,1),(4,2)\}$`,
      examTip: r`ถ้าไม่มีคู่ไหนทำได้ เช่น $x - y = 6$ บน $\{1,\dots,5\}$ ตอบ $r = \varnothing$`,
    },
  },
  {
    id: "fc-mr-graph-type",
    title: "จุด เส้น หรือพื้นที่?",
    category: "กราฟ",
    front: {
      prompt: r`กราฟบน $\mathbb{N} \times \mathbb{N}$, $\mathbb{R} \times \mathbb{R}$, $\ge$ และ $>$ หน้าตาต่างกันยังไง?`,
      badge: "1.4",
    },
    back: {
      rule: r`$\mathbb{N}, \mathbb{Z}$ หรือแจกแจง → จุดแยก (ห้ามลากเส้น) | $\mathbb{R}$ → เส้นทึบต่อเนื่อง | $\ge, \le$ → ระบาย + เส้นทึบ | $>, <$ → ระบาย + เส้นประ`,
      keywords: ["จุด", "เส้นทึบ", "เส้นประ", "ระบาย"],
      example: r`$\{(x,y) \in \mathbb{N} \times \mathbb{N} \mid x + y = 6\}$ = 5 จุด $(1,5)$ ถึง $(5,1)$`,
      examTip: r`ไม่แน่ใจว่าระบายฝั่งไหน แทนจุดทดสอบ เช่น $(0,0)$ ถ้าจริงระบายฝั่งที่มีจุดนั้น`,
    },
  },
  {
    id: "fc-mr-graph-shapes",
    title: "รูปร่างกราฟพื้นฐาน",
    category: "กราฟ",
    front: {
      prompt: r`$y = x^2$, $y = -x^2$, $x = y^2$, $x = -y^2$ เปิดไปทางไหน?`,
      badge: "1.4",
    },
    back: {
      rule: r`$y = x^2$ หงาย ∪ | $y = -x^2$ คว่ำ ∩ | $x = y^2$ ตะแคงเปิดขวา ⊂ | $x = -y^2$ ตะแคงเปิดซ้าย ⊃`,
      keywords: [r`$y = \lvert x \rvert$ ตัว V`, r`$y = -\lvert x \rvert$ ตัว V คว่ำ`],
      example: r`$y > \lvert x \rvert$ → ตัว V เส้นประ ระบายด้านในเหนือตัว V`,
    },
  },
  {
    id: "fc-mr-graph-sqrt",
    title: "กราฟรากที่สอง",
    category: "กราฟ",
    front: {
      prompt: r`$y = \sqrt{x-1}$, $y = \sqrt{2-x}$, $y = -\sqrt{x+2}$ เริ่มที่จุดไหน ไปทางไหน?`,
      badge: "1.4",
    },
    back: {
      rule: r`หาจุดเริ่มจาก "ในราก = 0" แล้วดูว่า $x$ ไปทางไหนได้ / มีลบหน้ารากกราฟจะลง`,
      keywords: ["ในราก = 0 คือจุดเริ่ม", "ลบหน้าราก = ลง"],
      example: r`$\sqrt{x-1}$: เริ่ม $(1,0)$ ไปขวา-ขึ้น | $\sqrt{2-x}$: เริ่ม $(2,0)$ ไปซ้าย-ขึ้น | $-\sqrt{x+2}$: เริ่ม $(-2,0)$ ไปขวา-ลง`,
    },
  },
  {
    id: "fc-mr-dr-def",
    title: "โดเมนและเรนจ์คืออะไร",
    category: "โดเมน/เรนจ์",
    front: {
      prompt: r`$r = \{(1,2),(2,4),(3,4),(3,6)\}$ หา $D_r$ และ $R_r$`,
      badge: "1.5",
    },
    back: {
      rule: r`$D_r$ = ตัวหน้าทั้งหมด, $R_r$ = ตัวหลังทั้งหมด (ตัวซ้ำเขียนครั้งเดียว)`,
      keywords: ["ตัวหน้า = โดเมน", "ตัวหลัง = เรนจ์"],
      example: r`$D_r = \{1,2,3\}$, $R_r = \{2,4,6\}$`,
      examTip: "จากกราฟ: จุดทึบใช้ [ ] จุดโปร่งใช้ ( ) — กราฟเป็นจุดตอบเป็นเซต กราฟเป็นเส้นตอบเป็นช่วง",
    },
  },
  {
    id: "fc-mr-dr-rules",
    title: "กฎทอง 4 ข้อหาโดเมน/เรนจ์",
    category: "โดเมน/เรนจ์",
    front: {
      prompt: "เจอเศษส่วน ราก กำลังสอง ค่าสัมบูรณ์ ต้องจำกฎอะไร?",
      badge: "1.5",
    },
    back: {
      rule: r`ส่วน $\neq 0$ | ในราก $\ge 0$ และ $\sqrt{\ } \ge 0$ | $\square^2 \ge 0$ | $\lvert \square \rvert \ge 0$`,
      keywords: ["โดเมน: ดู x ที่แทนได้", "เรนจ์: ดูขอบเขตของ y"],
      example: r`$y = \sqrt{x+3}$: $D = [-3,\infty)$, $R = [0,\infty)$ | $y = x^2 + 1$: $R = [1,\infty)$ | $y = \lvert x+3 \rvert + 2$: $R = [2,\infty)$`,
    },
  },
  {
    id: "fc-mr-dr-fraction",
    title: "ทางลัด: เศษส่วนเชิงเส้น",
    category: "โดเมน/เรนจ์",
    front: {
      prompt: r`$y = \frac{4x-7}{5x-3}$ โดเมนและเรนจ์คือ?`,
      badge: "ทางลัด",
    },
    back: {
      formula: r`$y = \frac{ax+b}{cx+d}$: $D = \mathbb{R} - \{-\frac{d}{c}\}$, $R = \mathbb{R} - \{\frac{a}{c}\}$`,
      rule: r`โดเมน: ส่วนห้ามเป็น 0 | เรนจ์: จัดรูปเป็น $x = \frac{3y-7}{5y-4}$ แล้วให้ส่วน $\neq 0$`,
      keywords: [r`เรนจ์ตัด $\frac{a}{c}$`],
      example: r`$D = \mathbb{R} - \{\frac{3}{5}\}$, $R = \mathbb{R} - \{\frac{4}{5}\}$ | $y = \frac{1}{x-2}$: $R = \mathbb{R} - \{0\}$`,
      examTip: "ข้อเขียนให้แสดงวิธีจัดรูปหา x ในรูป y ด้วย ทางลัดใช้เช็คคำตอบ",
    },
  },
  {
    id: "fc-mr-dr-traps",
    title: "กับดักโดเมน",
    category: "กับดักข้อสอบ",
    front: {
      prompt: r`$y = \sqrt{x^2 - 1}$ กับ $y = \frac{9}{\sqrt{x^2-3x-4}}$ โดเมนคืออะไร?`,
      badge: "กับดัก",
    },
    back: {
      rule: r`ในรากอย่างเดียว ใช้ $\ge 0$ | รากอยู่ที่ส่วน ใช้ $> 0$ (ห้ามเป็น 0 ด้วย)`,
      keywords: [r`$\ge$ → [ ]`, r`$>$ → ( )`],
      example: r`$x^2 \ge 1$ → $(-\infty,-1] \cup [1,\infty)$ | $(x-4)(x+1) > 0$ → $(-\infty,-1) \cup (4,\infty)$`,
      examTip: r`อย่าลืมฝั่งลบ: $x^2 \ge 1$ ไม่ได้มีแค่ $x \ge 1$`,
    },
  },
  {
    id: "fc-mr-inverse-def",
    title: "ตัวผกผันของความสัมพันธ์",
    category: "ตัวผกผัน",
    front: {
      prompt: r`$r^{-1}$ คืออะไร และ $D_{r^{-1}}$, $R_{r^{-1}}$ สัมพันธ์กับ $r$ ยังไง?`,
      badge: "1.6",
    },
    back: {
      formula: r`$D_{r^{-1}} = R_r$ และ $R_{r^{-1}} = D_r$`,
      rule: r`สลับตัวหน้ากับตัวหลังทุกคู่ — ถ้า $r \subset A \times B$ แล้ว $r^{-1} \subset B \times A$ / กราฟสะท้อนกับเส้น $y = x$`,
      keywords: ["สลับคู่", r`สะท้อนกับ $y = x$`],
      example: r`$r = \{(1,2),(4,3),(2,1)\}$ → $r^{-1} = \{(2,1),(3,4),(1,2)\}$`,
      examTip: r`สะท้อนกับเส้น $y = x$ ไม่ใช่แกน X`,
    },
  },
  {
    id: "fc-mr-inverse-eq",
    title: "หา r⁻¹ จากสมการ",
    category: "ตัวผกผัน",
    front: {
      prompt: r`$r: y = 2x + 1$ แล้ว $r^{-1}$ คือ?`,
      subtext: r`ลองอีกข้อ: $y = \frac{2-x}{3}$`,
      badge: "1.6",
    },
    back: {
      rule: r`สลับ $x$ กับ $y$ ในสมการ แล้วจัดรูปให้เป็น $y = \dots$`,
      keywords: ["สลับ x, y", "จัดรูปเป็น y ="],
      example: r`$x = 2y + 1$ → $y = \frac{x-1}{2}$ | $x = \frac{2-y}{3}$ → $y = 2 - 3x$`,
      examTip: r`ตัวผกผัน ≠ ส่วนกลับ: $r^{-1}$ ของ $y = 2x+1$ ไม่ใช่ $\frac{1}{2x+1}$`,
    },
  },
  {
    id: "fc-mr-inverse-sqrt",
    title: "r⁻¹ ของรากที่สอง (มีเงื่อนไข)",
    category: "กับดักข้อสอบ",
    front: {
      prompt: r`$r: y = \sqrt{x+2}$ แล้ว $r^{-1}$ คือ?`,
      badge: "กับดัก",
    },
    back: {
      rule: r`สลับ: $x = \sqrt{y+2}$ ซึ่งบังคับ $x \ge 0$ → ยกกำลังสอง $y = x^2 - 2$ โดยต้องพกเงื่อนไข $x \ge 0$ ไปด้วย`,
      keywords: [r`พก $x \ge 0$`],
      example: r`$r^{-1} = \{(x,y) \mid y = x^2 - 2 \text{ และ } x \ge 0\}$, $D_{r^{-1}} = [0,\infty)$, $R_{r^{-1}} = [-2,\infty)$`,
      examTip: r`ถ้า $r: y = x^2 + 1$ จะได้ $r^{-1}: y = \pm\sqrt{x-1}$ (มีทั้งบวกและลบ)`,
    },
  },
];
