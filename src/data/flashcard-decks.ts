// รายการเด็คแฟลชการ์ดของแต่ละวิชา — วิชาที่ไม่มีในนี้จะไม่แสดงปุ่ม/หน้าแฟลชการ์ด
import type { Flashcard } from "@/data/english-future-flashcards";
import { ENGLISH_FUTURE_FLASHCARDS } from "@/data/english-future-flashcards";
import {
  MATH_RELATIONS_FLASHCARDS,
  MATH_RELATIONS_FLASHCARD_CATEGORIES,
} from "@/data/math-relations-flashcards";
import type { FlashcardCategoryOption } from "@/components/flashcards/flashcard-deck";

export type FlashcardDeckConfig = {
  cards: Flashcard[];
  categories?: FlashcardCategoryOption[];
  variant: "english" | "math";
  topicLabel: string;
  tagline: string;
};

const DECKS: Record<string, FlashcardDeckConfig> = {
  "อ31101": {
    cards: ENGLISH_FUTURE_FLASHCARDS,
    variant: "english",
    topicLabel: "Future Tense",
    tagline: "การ์ดสรุปสูตร & ทริคลับเตรียมสอบ 20 ข้อคาบหน้า ทบทวนจำขึ้นใจ!",
  },
  "ค31201": {
    cards: MATH_RELATIONS_FLASHCARDS,
    categories: MATH_RELATIONS_FLASHCARD_CATEGORIES,
    variant: "math",
    topicLabel: "ความสัมพันธ์ 1.1–1.6",
    tagline: "การ์ดสรุปนิยาม สูตร โดเมน/เรนจ์ ตัวผกผัน และกับดักข้อสอบ พลิกจำก่อนเข้าห้องสอบ!",
  },
};

export function getFlashcardDeck(subjectCode: string): FlashcardDeckConfig | null {
  return DECKS[subjectCode] ?? null;
}
