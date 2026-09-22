import Link from "next/link";
import { Archive, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/back-button";
import { db } from "@/lib/db";
import { localizedToString } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "คลังข้อสอบที่ผ่านมา" };

/** คลังข้อสอบที่ผ่านมา — รอบสอบ/วิชาที่ ARCHIVED เปิดดูและทำซ้ำได้ ไม่ลบประวัติ */
export default async function ArchivePage() {
  const [archivedTerms, archivedSubjects] = await Promise.all([
    db.examTerm.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questionSets: true } } },
    }),
    db.subject.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { questionSets: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="-mb-2">
        <BackButton fallbackHref="/" label="ย้อนกลับหน้าแรก" />
      </div>

      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-wine to-purple-brand text-white shadow-soft" aria-hidden>
          <Archive className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-wine dark:text-primary">คลังข้อสอบที่ผ่านมา</h1>
          <p className="text-sm text-muted-foreground">
            ชุดสอบเก่าเก็บไว้ให้ทบทวนและทำซ้ำได้ — ประวัติและความคืบหน้ายังอยู่ครบ
          </p>
        </div>
      </header>

      {archivedTerms.length > 0 && (
        <section aria-label="รอบสอบที่ผ่านมา" className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5 text-purple-brand" aria-hidden /> รอบสอบ
          </h2>
          {archivedTerms.map((t) => (
            <Card key={t.id} className="rounded-3xl shadow-soft">
              <CardHeader className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{localizedToString(t.name)}</CardTitle>
                  <Badge variant="secondary" className="rounded-full">ชุดเก่า</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                ปีการศึกษา {t.academicYear}
                {t.semester ? ` · ภาคเรียนที่ ${t.semester}` : ""} · {t._count.questionSets} ชุดข้อสอบ
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section aria-label="วิชาชุดเก่า" className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">วิชาชุดเก่า ({archivedSubjects.length} วิชา)</h2>
        {archivedSubjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีวิชาที่เก็บเข้าคลัง</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {archivedSubjects.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${encodeURIComponent(s.code)}`}
                className="lift rounded-3xl focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Card className="h-full rounded-3xl shadow-soft hover:shadow-soft-lg">
                  <CardHeader className="pb-1">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-white opacity-80"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      >
                        <Archive className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-base">{localizedToString(s.name)}</CardTitle>
                        <p className="text-xs text-muted-foreground">{s.code}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto rounded-full">ชุดเก่า</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {s._count.questionSets} ชุดข้อสอบ — เปิดทำซ้ำได้
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
