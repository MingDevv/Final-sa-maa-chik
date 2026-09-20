// รูปแบบข้อมูลชุดข้อสอบฝึก (ตัวช่วยเขียนโจทย์ให้สั้น)
// options เป็นข้อความลิสต์ → ระบบจะติดตัวอักษร A, B, C, D ให้เอง / answer = ลำดับ (0-based)

export interface ExamQ {
  type?: "MCQ" | "SHORT_ANSWER" | "WRITTEN";
  prompt: string;
  options?: string[];
  /** MCQ: ลำดับคำตอบถูก (0-based, ใส่หลายค่าได้) | SHORT_ANSWER: accepts | WRITTEN: finalAnswer+steps */
  answer: number | number[] | string | { accepts: string[]; normalize?: Record<string, boolean> } | { finalAnswer: string; steps: string[] };
  explanation: string;
  points?: number;
  rubric?: { description: string; points: number }[];
}

export interface ExamSetDef {
  subjectCode: string;
  topicName?: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  minutes: number;
  questions: ExamQ[];
}
