import { FlashcardDeck } from "@/components/flashcards";
import { BackButton } from "@/components/back-button";

export const metadata = {
  title: "Flashcards: Future Tense | Final Prep",
  description:
    "แฟลชการ์ดสรุปสูตร & ทริคลับ Future Simple vs Future Continuous สำหรับเตรียมสอบ 20 ข้อคาบหน้า",
};

export default function FlashcardsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="-mb-2">
        <BackButton fallbackHref="/" label="ย้อนกลับหน้าแรก" />
      </div>
      <FlashcardDeck />
    </div>
  );
}
