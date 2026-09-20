"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ปุ่มย้อนกลับ — กลับไปหน้าก่อนหน้าตามประวัติจริง
 * ถ้าเปิดลิงก์ตรง ๆ (ไม่มีหน้าก่อนหน้า) จะพาไป fallbackHref แทน
 */
export function BackButton({
  fallbackHref,
  label = "ย้อนกลับ",
  className,
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={goBack}
      className={
        "rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring " +
        (className ?? "")
      }
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
