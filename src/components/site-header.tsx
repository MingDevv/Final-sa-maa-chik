"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "หน้าแรก" },
  { href: "/flashcards", label: "การ์ดจำ" },
  { href: "/review", label: "ทบทวน" },
  { href: "/archive", label: "คลังข้อสอบ" },
  { href: "/admin", label: "ผู้ดูแล" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- รอ mount เพื่อเลี่ยง hydration mismatch ของไอคอนธีม
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-background/70 backdrop-blur-xl dark:border-white/5">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-4 md:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 font-semibold sm:px-2 text-foreground transition-colors hover:bg-secondary"
          aria-label="หน้าแรก Final-sa-maa-chik"
        >
          <span className="brand-tile flex h-8 w-8 items-center justify-center rounded-lg">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden whitespace-nowrap text-sm sm:inline md:text-[15px]">
            Final-sa-maa-chik
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <nav
            className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-[13px] [scrollbar-width:none] sm:gap-1 sm:text-sm"
            aria-label="เมนูหลัก"
          >
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-2 transition-colors sm:px-3 hover:bg-secondary ${
                    active
                      ? "bg-secondary font-semibold text-primary"
                      : "text-foreground/75 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-lg"
            aria-label={
              mounted && resolvedTheme === "dark"
                ? "สลับเป็นโหมดสว่าง"
                : "สลับเป็นโหมดมืด"
            }
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden />
            ) : (
              <Moon className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
