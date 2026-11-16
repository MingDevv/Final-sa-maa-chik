export type FlashcardCategory =
  | "Formula"
  | "Will vs Going To"
  | "Future Continuous"
  | "Exam Trick";

export interface Flashcard {
  id: string;
  title: string;
  /** หมวดของการ์ด — อังกฤษใช้ FlashcardCategory, วิชาอื่นตั้งชื่อหมวดเองได้ */
  category: string;
  front: {
    prompt: string;
    subtext?: string;
    badge?: string;
  };
  back: {
    rule: string;
    formula?: string;
    keywords: string[];
    example: string;
    /** คำแปลไทยของประโยคตัวอย่าง (เฉพาะภาษา) */
    thaiMeaning?: string;
    examTip?: string;
  };
}

export const ENGLISH_FUTURE_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-will-spontaneous",
    title: "Will: การตัดสินใจทันที (Spontaneous Decision)",
    category: "Will vs Going To",
    front: {
      prompt: "เพิ่งคิดได้เดี๋ยวนั้น! ไม่ได้วางแผนล่วงหน้ามาก่อน ใช้ Will หรือ Be Going To?",
      subtext: "เช่น อยู่ดีๆ โทรศัพท์ดัง หรือเห็นเสื้อสวยแล้วตัดสินใจซื้อทันที",
      badge: "ตัดสินใจฉับพลัน",
    },
    back: {
      formula: "S + will ('ll) + V.inf (V.1 ไม่ผัน)",
      rule: "ใช้ Will เมื่อตัดสินใจทำอะไรในขณะที่พูดทันที (On-the-spot / Spontaneous decision) โดยไม่ได้คิดหรือวางแผนไว้ล่วงหน้า",
      keywords: ["now", "right now", "just decided", "Oh!", "Wait!", "I'll do it"],
      example: "The phone is ringing. — Wait, I will answer it!",
      thaiMeaning: "โทรศัพท์ดังอยู่นี่ — เดี๋ยวนะ ฉันจะไปรับสายเอง! (ตัดสินใจเดี๋ยวนั้นทันที)",
      examTip: "ถ้าโจทย์มีสถานการณ์เกิดขึ้นสดๆ เช่น กริ่งประตูหรือโทรศัพท์ดัง ('The doorbell is ringing.') ให้ตอบ 'I will answer it.' (ห้ามใช้ going to เด็ดขาด!)",
    },
  },
  {
    id: "fc-will-offers-promises",
    title: "Will: ข้อเสนอ สัญญา และปลอบใจ (Offers & Promises)",
    category: "Will vs Going To",
    front: {
      prompt: "การเสนอตัวช่วยเหลือ (Offer) หรือการให้คำสัญญา (Promise) ใช้โครงสร้างใด?",
      subtext: "เช่น 'ฉันสัญญาว่าจะไม่บอกใคร' หรือ 'กระเป๋าหนักไหม เดี๋ยวฉันช่วยยก'",
      badge: "คำสัญญา & ช่วยเหลือ",
    },
    back: {
      formula: "S + will / won't + V.inf  (Shall I/we...? สำหรับเสนอตัว)",
      rule: "ใช้ Will ในการให้คำมั่นสัญญา (Promises), เสนอความช่วยเหลือ (Offers), ขู่หรือเตือน (Threats/Warnings), และคำขอร้อง (Requests)",
      keywords: ["promise", "swear", "help", "offer", "Don't worry", "won't tell"],
      example: "Don't worry! I promise I won't tell anyone your secret.",
      thaiMeaning: "ไม่ต้องกังวลนะ! ฉันสัญญาว่าจะไม่บอกความลับเธอให้ใครรู้เด็ดขาด",
      examTip: "เจอคำว่า promise หรือ swear ในโจทย์เมื่อไหร่ กา Will / Won't ทันที! เช่น 'I promise I will help you with your homework.'",
    },
  },
  {
    id: "fc-will-predictions",
    title: "Will: คาดการณ์จากความเห็นส่วนตัว (Predictions without Evidence)",
    category: "Will vs Going To",
    front: {
      prompt: "คาดเดาอนาคตโดย 'ไม่มีหลักฐานชัดเจน' อิงความรู้สึกหรือความคิดเห็นส่วนตัว",
      subtext: "สังเกตคำกริยาแสดงความคิด เช่น I think, I believe, perhaps, I hope...",
      badge: "เดาจากความคิดเห็น",
    },
    back: {
      formula: "S + will + V.inf",
      rule: "ใช้ Will คาดการณ์สิ่งที่จะเกิดขึ้นในอนาคตตามความคิดเห็น ความเชื่อ หรือลางสังหรณ์ของผู้พูด โดยไม่มีหลักฐานหรือสัญญาณยืนยันในปัจจุบัน",
      keywords: ["I think", "I believe", "I hope", "perhaps", "probably", "I expect", "maybe"],
      example: "I think Liverpool will win the match tonight. / Perhaps she will pass.",
      thaiMeaning: "ฉันคิดว่าลิเวอร์พูลจะชนะคืนนี้ (ความเห็นส่วนตัว ยังไม่ได้เริ่มเตะ)",
      examTip: "เห็น 'I think / I believe / perhaps / probably' เมื่อไหร่ ปักหมุดที่ will + V.inf ได้เลย (เว้นแต่ว่ามีภาพหลักฐานตาเห็นตำตาอยู่ตรงหน้า)",
    },
  },
  {
    id: "fc-goingto-prior-plan",
    title: "Be Going To: แผนการที่ตั้งใจไว้ล่วงหน้า (Prior Plan & Intention)",
    category: "Will vs Going To",
    front: {
      prompt: "วางแผนไว้แล้ว ตัดสินใจมาก่อนหน้านี้แล้ว (Prior Plan) ใช้รูปไหน?",
      subtext: "ต่างกับ Will ตรงที่มีการเตรียมตัว วางแผน หรือคิดล่วงหน้าไว้แล้ว",
      badge: "วางแผนล่วงหน้า",
    },
    back: {
      formula: "S + is/am/are + going to + V.inf",
      rule: "ใช้ Be Going To เมื่อประธานมีเจตนาหรือได้วางแผนเตรียมการไว้ล่วงหน้าแล้วก่อนที่จะพูด (Premeditated plan / intention)",
      keywords: ["already decided", "plan to", "intend to", "have bought", "prepared"],
      example: "We have already bought the tickets. We are going to travel to Japan.",
      thaiMeaning: "พวกเราซื้อตั๋วไว้เรียบร้อยแล้ว พวกเรากำลังจะไปเที่ยวญี่ปุ่น (วางแผนและจ่ายเงินไว้ก่อนแล้ว)",
      examTip: "ถ้าโจทย์มีบริบทว่า 'have bought a ticket' หรือ 'have already decided' แสดงว่าวางแผนไว้แล้ว ต้องเลือก be going to เท่านั้น!",
    },
  },
  {
    id: "fc-goingto-present-evidence",
    title: "Be Going To: คาดการณ์แบบมีหลักฐานตำตา (Present Evidence)",
    category: "Exam Trick",
    front: {
      prompt: "เห็นหลักฐานคาตาอยู่ตรงหน้า กำลังจะเกิดขึ้นแน่ๆ!",
      subtext: "เช่น 'Look at those dark clouds!' หรือ 'Be careful! You...'",
      badge: "หลักฐานตำตา",
    },
    back: {
      formula: "S + is/am/are + going to + V.inf",
      rule: "ใช้ Be Going To เมื่อมีสัญญาณหรือหลักฐานที่มองเห็น/ได้ยินชัดเจนในปัจจุบัน (Present evidence) ว่าเหตุการณ์นั้นกำลังจะเกิดขึ้นในไม่ช้า",
      keywords: ["Look at...!", "Watch out!", "Be careful!", "Listen!", "dark clouds", "stumbling"],
      example: "Look at those dark clouds! It is going to rain very soon.",
      thaiMeaning: "ดูเมฆดำทมึนพวกนั้นสิ! ฝนกำลังจะตกในไม่ช้านี้แล้ว (มีเมฆดำเป็นหลักฐานชัดเจน)",
      examTip: "ข้อสอบออกบ่อยมาก! 'I think it will rain' (ไม่มีหลักฐาน = Will) แต่ 'Look at those dark clouds! It is going to rain' (มีหลักฐาน = Going to) จำคู่นี้ไว้ให้แม่น!",
    },
  },
  {
    id: "fc-future-continuous-formula",
    title: "Future Continuous: สูตรโครงสร้าง & มโนภาพ (Concept & Formula)",
    category: "Future Continuous",
    front: {
      prompt: "โครงสร้าง Future Continuous Tense คืออะไร? และใช้บอกเหตุการณ์แบบไหน?",
      subtext: "มโนภาพ: ณ จุดเวลานั้นในอนาคต แอ็กชันกำลังดำเนินอยู่คาตา!",
      badge: "สูตรหลัก Future Cont",
    },
    back: {
      formula: "S + will be + V-ing",
      rule: "ใช้บอกเหตุการณ์ที่ 'กำลังดำเนินอยู่' (action in progress) ณ จุดเวลาใดเวลาหนึ่งที่ระบุชัดเจนในอนาคต",
      keywords: ["will be + V-ing", "won't be + V-ing", "action in progress", "ongoing in the future"],
      example: "Tomorrow at 10 a.m., we will be taking the English final exam.",
      thaiMeaning: "พรุ่งนี้ตอน 10 โมงเช้า พวกเราจะกำลังนั่งทำข้อสอบปลายภาคภาษาอังกฤษอยู่",
      examTip: "จำแม่นๆ: will + be + V-ing เสมอ! ห้ามผัน be เป็น is/am/are เด็ดขาด และระวังชอยส์หลอกที่ตัด be ทิ้ง เช่น 'will taking' (ผิดมหันต์)",
    },
  },
  {
    id: "fc-future-continuous-time-markers",
    title: "Future Continuous: คีย์เวิร์ดบอกเวลาเจาะจง (Specific Time Markers)",
    category: "Future Continuous",
    front: {
      prompt: "สัญญาณเวลา (Time Markers) แบบไหนที่เจอแล้วต้องกา Future Cont ทันที?",
      subtext: "ไม่ใช่แค่อนาคตธรรมดา (tomorrow) แต่ต้อง 'ระบุจุดเวลาเป๊ะๆ'",
      badge: "คีย์เวิร์ดบอกเวลาเฉพาะ",
    },
    back: {
      formula: "At [เวลาเจาะจง] + [อนาคต]  |  This time + [tomorrow / next...]",
      rule: "ต้องมีคำบอกเวลาเฉพาะเจาะจงบวกกับเวลาในอนาคต เพื่อเน้นว่า ณ เสี้ยวเวลานั้นการกระทำกำลังดำเนินอยู่กลางคัน",
      keywords: [
        "At 8 p.m. tonight",
        "This time tomorrow",
        "This time next year",
        "At this time tomorrow",
        "At noon tomorrow",
        "Between 9 and 11 a.m. tomorrow",
      ],
      example: "This time tomorrow, they will be relaxing on the beach in Phuket.",
      thaiMeaning: "เวลานี้ของวันพรุ่งนี้ พวกเขากำลังนอนพักผ่อนชิลๆ อยู่บนหาดที่ภูเก็ต",
      examTip: "ถ้าโจทย์มีแค่ 'tomorrow' = Future Simple (will + V.1)\nถ้าโจทย์มี 'at 10 a.m. tomorrow' หรือ 'this time tomorrow' = Future Continuous (will be + V-ing) ทันที!",
    },
  },
  {
    id: "fc-simple-vs-continuous",
    title: "Future Simple VS Future Continuous: เทียบกันจะๆ",
    category: "Will vs Going To",
    front: {
      prompt: "\"I will do homework tomorrow\" VS \"I will be doing homework at 8 p.m. tomorrow\" ต่างกันอย่างไร?",
      subtext: "ความรู้สึกของการทำทั่วไป VS กำลังทำค้างอยู่กลางคัน ห้ามกวน!",
      badge: "จุดตัดคะแนน",
    },
    back: {
      formula: "Simple: S + will + V.1  vs  Continuous: S + will be + V-ing",
      rule: "Future Simple บอกความจริงหรือการกระทำทั่วไปในอนาคต ส่วน Future Continuous เน้นว่า ณ เวลานั้นการกระทำกำลังดำเนินอยู่กลางคัน",
      keywords: ["Don't call me then", "I'll be busy", "in progress at that time"],
      example: "Don't call me at 2 p.m. because I will be attending an online class.",
      thaiMeaning: "อย่าโทรหาฉันตอนบ่ายสองนะ เพราะตอนนั้นฉันจะกำลังนั่งเรียนออนไลน์อยู่",
      examTip: "ถ้ามีบริบทว่า 'Don't call me then' (อย่าโทรมานะเวลานั้น) แปลว่า 'กำลังติดพันทำอย่างอื่นอยู่' ให้ตอบ will be + V-ing แน่นอน!",
    },
  },
  {
    id: "fc-stative-verbs-warning",
    title: "กับดักมรณะ: Stative Verbs ห้ามใช้รูป Continuous เด็ดขาด!",
    category: "Exam Trick",
    front: {
      prompt: "กริยาจำพวกความรู้สึก ความคิด และการครอบครอง ห้ามเติม -ing แม้จะมีเวลาเจาะจง!",
      subtext: "เช่น know, like, love, understand, believe, want, need, belong, have",
      badge: "หลุมพรางยอดฮิต",
    },
    back: {
      formula: "ห้ามใช้ will be + V-ing -> ให้ถอยกลับมาใช้ S + will + V.1 แทน!",
      rule: "Stative Verbs (กริยาแสดงสภาวะ/จิตใจ) ไม่มีการเคลื่อนไหวทางกายภาพ จึงห้ามทำเป็นรูป -ing แม้จะมีเวลาเป๊ะอย่าง 'at this time tomorrow' ก็ตาม",
      keywords: ["know", "understand", "believe", "want", "need", "like", "love", "belong", "have (=มี)"],
      example: "I believe people will need more renewable energy. (WRONG: will be needing)",
      thaiMeaning: "ฉันเชื่อว่าผู้คนจะต้องการพลังงานทดแทนมากขึ้น (ห้ามใช้ will be needing เด็ดขาด)",
      examTip: "โจทย์ชอบหลอก: ให้เวลา 'At 9 a.m. tomorrow, she ______ the result.' ชอยส์จะมี will know กับ will be knowing -> ต้องตอบ will know!",
    },
  },
  {
    id: "fc-future-continuous-interrupted",
    title: "เหตุการณ์แทรกในอนาคต (Interrupted Actions with WHEN)",
    category: "Future Continuous",
    front: {
      prompt: "สองเหตุการณ์ในอนาคต: กำลังทำอะไรอยู่ แล้วมีอีกเหตุการณ์หนึ่งเข้ามาแทรก!",
      subtext: "S + will be + V-ing  WHEN  S + [เทนส์อะไร?]",
      badge: "เหตุการณ์แทรก",
    },
    back: {
      formula: "S + will be + V-ing + WHEN + S + V.1 (Present Simple)",
      rule: "เหตุการณ์ที่ 'กำลังดำเนินอยู่' ใช้ Future Continuous (will be V-ing) และเหตุการณ์สั้นๆ ที่ 'เข้ามาแทรก' ให้ใช้ Present Simple (ห้ามใช้ will ซ้ำในประโยคหลัง When)",
      keywords: ["when", "while", "as soon as", "Present Simple หลังคำเชื่อมบอกเวลา"],
      example: "When you arrive at the airport, I will be waiting for you at gate 3.",
      thaiMeaning: "เมื่อคุณมาถึงสนามบิน ฉันจะกำลังยืนรอคุณอยู่ที่ประตู 3 (ยืนรอนานแล้ว คุณเดินมาถึงทีหลัง)",
      examTip: "กฎเหล็กภาษาอังกฤษ: ใน Time Clause (หลัง When / While / If) ห้ามใส่ will เด็ดขาด! 'when you will arrive' = ผิดมหันต์! ต้องเป็น 'when you arrive' (Present Simple)",
    },
  },
  {
    id: "fc-trap-going-to-vs-present-cont",
    title: "แยกให้ออก: Be Going To + V.1 VS Present Continuous",
    category: "Exam Trick",
    front: {
      prompt: "\"Look! The baby is crying\" VS \"Look! The baby is going to cry\" ต่างกันอย่างไร?",
      subtext: "ร้องไห้ออกมาแล้ว หรือ กำลังจะเริ่มร้องไห้?",
      badge: "กับดักความหมาย",
    },
    back: {
      formula: "is/am/are + V-ing (ทำอยู่ตอนนี้) vs is/am/are + going to + V.1 (กำลังจะเกิดขึ้นตามหลักฐาน)",
      rule: "1) The baby is crying = น้ำตาไหล ร้องจ๊ากออกมาแล้ว ณ ขณะพูด (Present Cont)\n2) The baby is going to cry = หน้าเบะ ปากสั่น กำลังจะร้องแงแล้ว แต่ยังไม่ส่งเสียง (Be going to - มีหลักฐาน)",
      keywords: ["Present Cont = กำลังทำสดๆ ตอนนี้", "Be going to = ส่อแววกำลังจะเกิดในเสี้ยววินาที"],
      example: "He is stumbling; he is going to fall! (เขากำลังเซสะดุด เขากำลังจะล้มแล้ว!)",
      thaiMeaning: "อย่าสับสนความหมาย: Present Continuous คือเกิดอยู่แล้ว ส่วน Be going to คือมีสัญญาณว่าจะเกิด",
      examTip: "ดูคำกริยาหลักในบริบท ถ้ามีคำเกริ่นบอกอาการนำ เช่น 'stumbling' แสดงว่ายังไม่ล้มแต่ 'is going to fall' แน่นอน",
    },
  },
  {
    id: "fc-negative-and-question-forms",
    title: "รูปปฏิเสธ & คำถาม: Will vs Going To vs Future Cont",
    category: "Formula",
    front: {
      prompt: "จำรูปย่อและตำแหน่ง Not ของทั้ง 3 รูปแบบให้ขึ้นใจ!",
      subtext: "will not -> won't | isn't/aren't going to | won't be + V-ing",
      badge: "สูตรปฏิเสธ/คำถาม",
    },
    back: {
      formula: "Will: won't + V.1 | Going to: is/am/are + not + going to + V.1 | Fut Cont: won't be + V-ing",
      rule: "• will not ย่อเป็น won't (ระวังสะกดผิดเป็น willn't หรือ wont)\n• Future Cont รูปปฏิเสธ: S + won't be + V-ing (be ยังคงอยู่)\n• Future Cont รูปคำถาม: Will + S + be + V-ing? (เช่น Will you be using the car?)",
      keywords: ["won't", "is not going to", "won't be + V-ing", "Will you be doing...?"],
      example: "I won't be attending the party because I will be studying for my finals.",
      thaiMeaning: "ฉันจะไม่ไปร่วมงานปาร์ตี้หรอกนะ เพราะตอนนั้นฉันจะกำลังอ่านหนังสือสอบไฟนอลอยู่",
      examTip: "ระวังชอยส์หลอก: 'won't being' (ผิด!) หรือ 'won't be study' (ผิด!) รูปที่ถูกต้องคือ 'won't be + V-ing' เสมอ",
    },
  },
  {
    id: "fc-adverb-probably-position",
    title: "ตำแหน่ง Adverb of Probability (probably / definitely)",
    category: "Exam Trick",
    front: {
      prompt: "probably วางตรงไหนในประโยคบอกเล่า และวางตรงไหนในประโยคปฏิเสธ?",
      subtext: "\"will probably\" หรือ \"probably will\"? แล้วถ้าเป็น won't ล่ะ?",
      badge: "ตำแหน่ง Adverb",
    },
    back: {
      formula: "บอกเล่า: will + probably + V.1  |  ปฏิเสธ: probably + won't + V.1",
      rule: "ในประโยคบอกเล่า Adverb จะอยู่หลัง will (will probably) แต่ในประโยคปฏิเสธ Adverb จะกระโดดมาอยู่ 'หน้า' won't เสมอ!",
      keywords: ["will probably", "probably won't", "will definitely", "definitely won't"],
      example: "She will probably pass the test. / She probably won't fail the test.",
      thaiMeaning: "เธอคงจะสอบผ่าน / เธอคงจะไม่สอบตกหรอก (probably มาอยู่ข้างหน้า won't)",
      examTip: "ข้อสอบออกบ่อยมาก: จำสูตร 'will probably' แต่ 'probably won't' (probably ชนะ won't มาอยู่ด้านหน้าเสมอ)",
    },
  },
  {
    id: "fc-future-continuous-polite-questions",
    title: "Future Continuous: ถามแผนการอย่างสุภาพ (Polite Inquiries)",
    category: "Future Continuous",
    front: {
      prompt: "อยากถามแผนการของคนอื่นอย่างสุภาพและนุ่มนวลที่สุด ใช้โครงสร้างไหน?",
      subtext: "เช่น อยากยืมรถ หรืออยากถามเพื่อนว่าจะผ่านร้านสะดวกซื้อไหม",
      badge: "ถามอย่างสุภาพ",
    },
    back: {
      formula: "Will + you + be + V-ing...?",
      rule: "ใช้ Future Continuous เมื่อต้องการถามถึงแผนการหรือสิ่งที่ผู้อื่นจะทำอยู่แล้วตามปกติอย่างสุภาพมาก (Polite inquiry) เพื่อดูว่าเราจะขอติดรถหรือขอยืมของได้ไหม โดยไม่ฟังดูเหมือนสั่งหรือกดดัน",
      keywords: ["Will you be using...?", "Will you be going...?", "polite inquiry", "routine plan"],
      example: "Will you be using your car this evening? (เย็นนี้คุณจะใช้รถอยู่หรือเปล่าครับ?)",
      thaiMeaning: "ถามเพื่อเช็กดูว่าอีกฝ่ายมีแผนใช้รถอยู่ไหม ถ้าไม่ใช้จะได้ขอยืม โดยฟังดูสุภาพและเกรงใจ",
      examTip: "ออกสอบบ่อยในแนวข้อสอบประยุกต์บทสนทนา: 'Will you be going to the supermarket?' สุภาพและเป็นธรรมชาติกว่า 'Are you going to...?'",
    },
  },
];
