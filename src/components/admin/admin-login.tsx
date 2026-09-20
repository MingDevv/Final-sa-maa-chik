"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** หน้าใส่รหัสผู้ดูแล (ADMIN_CODE) — ล็อกอินสำเร็จแล้วเห็นศูนย์จัดการเนื้อหา */
export function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("ล็อกอินผู้ดูแลสำเร็จ");
        router.refresh();
      } else {
        toast.error(json.error ?? "รหัสไม่ถูกต้อง");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md pt-10">
      <Card className="rounded-3xl shadow-soft-lg">
        <CardHeader className="items-center pb-2 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-wine to-purple-brand text-white shadow-soft">
            <Lock className="h-7 w-7" aria-hidden />
          </span>
          <CardTitle className="pt-2 text-lg">เข้าสู่ระบบผู้ดูแล</CardTitle>
          <p className="text-sm text-muted-foreground">
            ส่วนนี้สำหรับผู้ดูแลเนื้อหาเท่านั้น — กรุณาใส่รหัสผู้ดูแล
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <div>
              <Label htmlFor="admin-code">รหัสผู้ดูแล</Label>
              <Input
                id="admin-code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ใส่รหัสผู้ดูแล"
                className="rounded-2xl"
                autoFocus
                aria-describedby="admin-code-hint"
              />
              <p id="admin-code-hint" className="mt-1 text-xs text-muted-foreground">
                รหัสตั้งไว้ในไฟล์ .env ชื่อตัวแปร ADMIN_CODE
              </p>
            </div>
            <Button type="submit" className="rounded-2xl" disabled={busy || !code.trim()}>
              {busy ? "กำลังตรวจรหัส..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
