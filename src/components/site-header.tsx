"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- รอ mount เพื่อเลี่ยง hydration mismatch ของไอคอนธีม
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-2 py-1 font-semibold text-wine transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring dark:text-primary"
          aria-label="หน้าแรก Final Exam Prep"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-wine to-purple-brand text-white shadow-soft">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-[15px]">Final Exam Prep</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm" aria-label="เมนูหลัก">
          <Link
            href="/"
            className={`rounded-xl px-3 py-2 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring ${
              pathname === "/" ? "bg-secondary font-medium text-wine dark:text-primary" : "text-foreground/80"
            }`}
          >
            หน้าแรก
          </Link>
          <Link
            href="/admin"
            className="rounded-xl px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            ผู้ดูแล
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label={mounted && resolvedTheme === "dark" ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
