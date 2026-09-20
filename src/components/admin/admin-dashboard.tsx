"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  FileUp,
  FolderPlus,
  Layers,
  ListTree,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  color: string;
  status: string;
  topicCount: number;
  documentCount: number;
  questionSetCount: number;
}

interface SetRow {
  id: string;
  title: string;
  subjectCode: string;
  topicTitle: string | null;
  difficulty: string;
  questionCount: number;
  status: string;
  version: number;
}

interface DocRow {
  id: string;
  title: string;
  subjectCode: string;
  topicTitle: string | null;
  status: string;
  pageCount: number | null;
}

interface TermRow {
  id: string;
  name: string;
  academicYear: string;
  status: string;
  questionSetCount: number;
}

const statusLabel: Record<string, string> = {
  DRAFT: "ฉบับร่าง",
  PUBLISHED: "เผยแพร่แล้ว",
  ARCHIVED: "เก็บถาวร",
  PENDING: "รอดำเนินการ",
  READY: "พร้อมใช้",
  FAILED: "ล้มเหลว",
  ACTIVE: "ใช้งาน",
  UPCOMING: "กำลังจะมา",
};

const adminHeaders = () => {
  const token = localStorage.getItem("fep_admin_token") ?? "";
  return {
    "Content-Type": "application/json",
    ...(token ? { "x-admin-token": token } : {}),
  };
};

/** ศูนย์จัดการเนื้อหา: วิชา/หัวข้อ/PDF/ชุดข้อสอบ/รอบสอบ + import/export */
export function AdminDashboard({ subjects: initialSubjects }: { subjects: SubjectItem[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [hardest, setHardest] = useState<
    { questionId: string; prompt: string; subjectCode: string; wrongCount: number; totalCount: number; wrongRate: number }[]
  >([]);

  const refresh = useCallback(async () => {
    const [r1, r2, r3, r4] = await Promise.all([
      fetch("/api/admin/subjects", { headers: adminHeaders() }),
      fetch("/api/admin/question-sets", { headers: adminHeaders() }),
      fetch("/api/admin/documents", { headers: adminHeaders() }),
      fetch("/api/admin/exam-terms", { headers: adminHeaders() }),
    ]);
    const [j1, j2, j3, j4] = await Promise.all([r1.json(), r2.json(), r3.json(), r4.json()]);
    if (j1.ok) setSubjects(j1.data);
    if (j2.ok) setSets(j2.data);
    if (j3.ok) {
      setDocs(j3.data.documents);
      setHardest(j3.data.hardest ?? []);
    }
    if (j4.ok) setTerms(j4.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- โหลดข้อมูลหลัง mount ผ่าน async fetch
    void refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-wine dark:text-primary">ศูนย์จัดการเนื้อหา</h1>
          <p className="text-sm text-muted-foreground">
            เพิ่มวิชา หัวข้อ ชีท PDF ชุดข้อสอบ และรอบสอบ — ทุกอย่างดึงจากฐานข้อมูล ไม่ต้องแก้โค้ด
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={async () => {
              const token = prompt("ตั้งค่า Admin Token (ปล่อยว่างถ้าไม่ได้ตั้ง ADMIN_TOKEN ใน .env)");
              if (token !== null) {
                localStorage.setItem("fep_admin_token", token);
                toast.success("บันทึก token ไว้ในเบราว์เซอร์นี้แล้ว");
                refresh();
              }
            }}
          >
            ตั้งค่า Admin Token
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl"
            onClick={() => window.open("/api/admin/import-export", "_blank")}
          >
            <Download className="mr-1 h-4 w-4" aria-hidden /> Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList className="flex w-full flex-wrap gap-1 rounded-2xl">
          <TabsTrigger value="subjects" className="rounded-xl"><BookOpen className="mr-1 h-4 w-4" aria-hidden />วิชา</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl"><FileUp className="mr-1 h-4 w-4" aria-hidden />ชีท PDF</TabsTrigger>
          <TabsTrigger value="sets" className="rounded-xl"><Layers className="mr-1 h-4 w-4" aria-hidden />ชุดข้อสอบ</TabsTrigger>
          <TabsTrigger value="terms" className="rounded-xl"><ListTree className="mr-1 h-4 w-4" aria-hidden />รอบสอบ</TabsTrigger>
          <TabsTrigger value="stats" className="rounded-xl">ข้อผิดบ่อย</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="pt-4">
          <SubjectsTab subjects={subjects} refresh={refresh} />
        </TabsContent>
        <TabsContent value="documents" className="pt-4">
          <DocumentsTab subjects={subjects} docs={docs} refresh={refresh} />
        </TabsContent>
        <TabsContent value="sets" className="pt-4">
          <SetsTab sets={sets} refresh={refresh} />
        </TabsContent>
        <TabsContent value="terms" className="pt-4">
          <TermsTab terms={terms} refresh={refresh} />
        </TabsContent>
        <TabsContent value="stats" className="pt-4">
          <Card className="rounded-3xl shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ข้อที่ตอบผิดบ่อย (ทุกผู้ใช้)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {hardest.length === 0 && (
                <p className="text-muted-foreground">ยังไม่มีสถิติ — จะอัปเดตเมื่อมีการทำข้อสอบ</p>
              )}
              {hardest.map((h) => (
                <div key={h.questionId} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-2">
                  <span className="line-clamp-1">{h.prompt}</span>
                  <Badge variant="destructive" className="shrink-0 rounded-full">
                    ผิด {h.wrongRate}% ({h.wrongCount}/{h.totalCount})
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- แท็บวิชา + หัวข้อ ----------

function SubjectsTab({ subjects, refresh }: { subjects: SubjectItem[]; refresh: () => Promise<void> }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const create = async () => {
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ code, name: { th: name } }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success(`เพิ่มวิชา ${code} แล้ว`);
      setCode("");
      setName("");
      setOpen(false);
      refresh();
    } else {
      toast.error(json.error ?? "เพิ่มวิชาไม่สำเร็จ");
    }
  };

  const addTopic = async (subjectId: string, title: string) => {
    if (!title.trim()) return;
    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ subjectId, title: { th: title.trim() } }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("เพิ่มหัวข้อแล้ว");
      refresh();
    } else {
      toast.error(json.error ?? "เพิ่มหัวข้อไม่สำเร็จ");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="self-start rounded-2xl"><Plus className="mr-1 h-4 w-4" aria-hidden /> เพิ่มวิชาใหม่</Button>
        </DialogTrigger>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>เพิ่มวิชาใหม่</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="subj-code">รหัสวิชา</Label>
              <Input id="subj-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="เช่น ค31101" className="rounded-2xl" />
            </div>
            <div>
              <Label htmlFor="subj-name">ชื่อวิชา</Label>
              <Input id="subj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คณิตศาสตร์พื้นฐาน 1" className="rounded-2xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!code.trim() || !name.trim()} className="rounded-2xl">บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {subjects.map((s) => (
        <Card key={s.id} className="rounded-3xl shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                {s.code} {s.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{statusLabel[s.status] ?? s.status}</Badge>
                <Badge variant="outline" className="rounded-full">{s.topicCount} หัวข้อ · {s.documentCount} ชีท · {s.questionSetCount} ชุด</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TopicQuickAdd subjectId={s.id} onAdd={addTopic} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TopicQuickAdd({
  subjectId,
  onAdd,
}: {
  subjectId: string;
  onAdd: (subjectId: string, title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(subjectId, title).then(() => setTitle(""));
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="เพิ่มหัวข้อใหม่ เช่น ตรรกศาสตร์"
        className="rounded-2xl"
        aria-label="ชื่อหัวข้อใหม่"
      />
      <Button type="submit" size="sm" className="rounded-2xl" disabled={!title.trim()}>
        <Plus className="h-4 w-4" aria-hidden /> เพิ่มหัวข้อ
      </Button>
    </form>
  );
}

// ---------- แท็บชีท PDF ----------

function DocumentsTab({
  subjects,
  docs,
  refresh,
}: {
  subjects: SubjectItem[];
  docs: DocRow[];
  refresh: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file || !subjectId) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", JSON.stringify({ th: title || file.name.replace(/\.pdf$/i, "") }));
      form.append("subjectId", subjectId);
      const token = localStorage.getItem("fep_admin_token") ?? "";
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: token ? { "x-admin-token": token } : undefined,
        body: form,
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("อัปโหลดชีทแล้ว");
        setFile(null);
        setTitle("");
        refresh();
      } else {
        toast.error(json.error ?? "อัปโหลดไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">อัปโหลดชีท PDF</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="doc-file">ไฟล์ PDF (ไม่เกิน 50MB)</Label>
            <Input
              id="doc-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-2xl"
            />
          </div>
          <div>
            <Label htmlFor="doc-title">ชื่อชีท</Label>
            <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ชีทตรรกศาสตร์" className="rounded-2xl" />
          </div>
          <div>
            <Label>วิชา</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="w-52 rounded-2xl"><SelectValue placeholder="เลือกวิชา" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.code} {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={upload} disabled={!file || !subjectId || busy} className="rounded-2xl">
            <Upload className="mr-1 h-4 w-4" aria-hidden /> {busy ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </Button>
        </CardContent>
      </Card>

      {docs.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-border bg-card p-3 shadow-soft">
          <div>
            <p className="font-medium">{d.title}</p>
            <p className="text-xs text-muted-foreground">
              {d.subjectCode}{d.topicTitle ? ` · ${d.topicTitle}` : ""}{d.pageCount ? ` · ${d.pageCount} หน้า` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">{statusLabel[d.status] ?? d.status}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="ลบเอกสาร"
              onClick={async () => {
                if (!confirm(`ลบชีท "${d.title}" ถาวร?`)) return;
                await fetch(`/api/admin/documents/${d.id}`, {
                  method: "DELETE",
                  headers: adminHeaders(),
                });
                toast.success("ลบแล้ว");
                refresh();
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- แท็บชุดข้อสอบ ----------

function SetsTab({
  sets,
  refresh,
}: {
  sets: SetRow[];
  refresh: () => Promise<void>;
}) {
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");

  const publish = async (id: string) => {
    const res = await fetch(`/api/admin/question-sets/${id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("เผยแพร่ชุดข้อสอบแล้ว (เพิ่มเวอร์ชันอัตโนมัติ)");
      refresh();
    } else {
      toast.error(json.error ?? "เผยแพร่ไม่สำเร็จ");
    }
  };

  const archive = async (id: string) => {
    const res = await fetch(`/api/admin/question-sets/${id}`, {
      method: "PATCH",
      headers: adminHeaders(),
      body: JSON.stringify({ status: "ARCHIVED" }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("เก็บชุดนี้เข้าถาวรแล้ว");
      refresh();
    }
  };

  const importJson = async () => {
    setImporting(true);
    try {
      const parsed = JSON.parse(importText);
      const res = await fetch("/api/admin/import-export", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`นำเข้าแล้ว: ${json.data.subjects} วิชา, ${json.data.topics} หัวข้อ, ${json.data.sets} ชุดข้อสอบ`);
        setImportText("");
        refresh();
      } else {
        toast.error(json.error ?? "นำเข้าไม่สำเร็จ");
      }
    } catch {
      toast.error("JSON ไม่ถูกต้อง");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderPlus className="h-5 w-5" aria-hidden /> นำเข้าชุดข้อสอบจาก JSON
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            วาง JSON ตามรูปแบบ export (subjects / questionSets) — ชุดที่นำเข้าจะเป็นฉบับร่างให้ตรวจก่อนเผยแพร่เสมอ
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"subjects": [...], "questionSets": [...]}'
            rows={4}
            className="rounded-2xl font-mono text-xs"
          />
          <Button onClick={importJson} disabled={importing || !importText.trim()} className="self-start rounded-2xl">
            <Upload className="mr-1 h-4 w-4" aria-hidden /> นำเข้า
          </Button>
        </CardContent>
      </Card>

      {sets.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-border bg-card p-3 shadow-soft">
          <div>
            <p className="font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">
              {s.subjectCode}{s.topicTitle ? ` · ${s.topicTitle}` : ""} · {s.questionCount} ข้อ · v{s.version}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={s.status === "PUBLISHED" ? "default" : s.status === "DRAFT" ? "secondary" : "outline"}
              className="rounded-full"
            >
              {statusLabel[s.status] ?? s.status}
            </Badge>
            {s.status !== "PUBLISHED" && (
              <Button size="sm" className="rounded-2xl" onClick={() => publish(s.id)}>
                <Send className="mr-1 h-3.5 w-3.5" aria-hidden /> เผยแพร่
              </Button>
            )}
            {s.status === "PUBLISHED" && (
              <Button size="sm" variant="outline" className="rounded-2xl" onClick={() => archive(s.id)}>
                เก็บถาวร
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- แท็บรอบสอบ ----------

function TermsTab({ terms, refresh }: { terms: TermRow[]; refresh: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("2569");

  const create = async () => {
    const res = await fetch("/api/admin/exam-terms", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ name: { th: name }, academicYear: year, status: "ACTIVE" }),
    });
    const json = await res.json();
    if (json.ok) {
      toast.success("เพิ่มรอบสอบแล้ว");
      setName("");
      refresh();
    } else {
      toast.error(json.error ?? "เพิ่มรอบสอบไม่สำเร็จ");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="rounded-3xl shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">เพิ่มรอบสอบใหม่</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="term-name">ชื่อรอบสอบ</Label>
            <Input id="term-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สอบปลายภาค 2/2569" className="rounded-2xl" />
          </div>
          <div>
            <Label htmlFor="term-year">ปีการศึกษา</Label>
            <Input id="term-year" value={year} onChange={(e) => setYear(e.target.value)} className="w-28 rounded-2xl" />
          </div>
          <Button onClick={create} disabled={!name.trim()} className="rounded-2xl">
            <Plus className="mr-1 h-4 w-4" aria-hidden /> เพิ่มรอบสอบ
          </Button>
        </CardContent>
      </Card>

      {terms.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-2 rounded-3xl border border-border bg-card p-3 shadow-soft">
          <div>
            <p className="font-medium">{t.name}</p>
            <p className="text-xs text-muted-foreground">ปีการศึกษา {t.academicYear} · {t.questionSetCount} ชุดข้อสอบ</p>
          </div>
          <Badge variant="secondary" className="rounded-full">{statusLabel[t.status] ?? t.status}</Badge>
        </div>
      ))}
    </div>
  );
}
