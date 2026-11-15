"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintGuideButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="no-print rounded-xl border-border bg-card/60 text-xs text-foreground/80 hover:bg-secondary hover:text-foreground"
      aria-label="พิมพ์หรือบันทึกเป็น PDF"
    >
      <Printer className="mr-1.5 h-3.5 w-3.5 opacity-70" />
      พิมพ์ / PDF
    </Button>
  );
}
