import Link from "next/link";
import {
  BookOpen,
  Brain,
  BrainCircuit,
  ChevronRight,
  CalendarDays,
  Flame,
  ListChecks,
  Play,
  Timer,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { subjectService } from "@/server/services/subject-service";
import { db } from "@/lib/db";
import { Hero, examCountdownText } from "@/components/dashboard/hero";
import { analyticsService } from "@/server/services/analytics-service";
import { getReadOnlySession } from "@/server/read-session";
import { reviewService } from "@/server/services/review-service";
import { localizedToString } from "@/lib/types";

export const dynamic = "force-dynamic";

/** จับกรณี DB ยังไม่พร้อม (เช่นเพิ่ง deploy บน Vercel ยังไม่ตั้ง DATABASE_URL) — แสดงคำแนะนำแทนหน้าพัง */
async function loadDashboard() {
  try {
    const session = await getReadOnlySession();
    const [subjects, summary, weakTopics, recent, review] = await Promise.all([
      subjectService.listSubjects(),
      analyticsService.dashboard(session.ownerKey),
      analyticsService.weakTopics(session.ownerKey),
      analyticsService.recentAttempts(session.ownerKey),
      reviewService.dueSummary(session.ownerKey).catch(() => ({ due: 0, dangerous: 0, total: 0 })),
    ]);
    let termInfo: { name: string; countdown: string | null } = {
      name: "สอบปลายภาค 1/2569",
      countdown: null,
    };
    try {
      const term = await db.examTerm.findFirst({ where: { status: "ACTIVE" } });
      if (term) {
        termInfo = {
          name: localizedToString(term.name),
          countdown: examCountdownText(term.examDate),
        };
      }
    } catch {
      /* ไม่มีรอบสอบก็แสดงปกได้ */
    }
    return { subjects, summary, weakTopics, recent, review, termInfo, dbReady: true as const };
  } catch {
    return {
      subjects: [],
      summary: { totalQuestionsDone: 0, totalStudyMinutes: 0, currentStreak: 0, quizzesTaken: 0, averagePercent: 0, activeDays: 0 },
      weakTopics: [],
      recent: [],
      review: { due: 0, dangerous: 0, total: 0 },
      termInfo: { name: "", countdown: null },
      dbReady: false as const,
    };
  }
}

export default async function DashboardPage() {
  const { subjects, summary, weakTopics, recent, review, termInfo, dbReady } = await loadDashboard();

  if (!dbReady) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Card className="rounded-3xl shadow-soft-lg">
          <CardHeader className="items-center pb-2 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl brand-tile shadow-soft text-2xl">
              🔧
            </span>
            <CardTitle className="pt-2 text-lg">ยังเชื่อมต่อฐานข้อมูลไม่ได้</CardTitle>
            <p className="text-sm text-muted-foreground">
              เว็บต้องเชื่อม PostgreSQL ก่อนจึงจะแสดงวิชาและข้อสอบได้ — ทำตามขั้นตอนนี้ครั้งเดียว
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <ol className="ml-5 list-decimal space-y-2">
              <li>
                สร้างฐานข้อมูลฟรีที่ <strong>neon.tech</strong> (Postgres) แล้วคัดลอก
                &ldquo;Connection string&rdquo;
              </li>
              <li>
                ใน Vercel: <strong>Settings → Environment Variables</strong> เพิ่ม{" "}
                <code className="rounded bg-muted px-1">DATABASE_URL</code> = connection string
                ที่ได้ (และ <code className="rounded bg-muted px-1">ADMIN_CODE</code> = รหัสผู้ดูแล)
              </li>
              <li>กด Redeploy หนึ่งครั้ง</li>
              <li>
                จากเครื่องตัวเอง รัน:{" "}
                <code className="rounded bg-muted px-1">npx prisma migrate deploy</code> แล้วตามด้วย{" "}
                <code className="rounded bg-muted px-1">npm run db:seed</code>,{" "}
                <code className="rounded bg-muted px-1">npm run seed:guides</code>,{" "}
                <code className="rounded bg-muted px-1">npm run seed:exams</code>{" "}
                (ชี้ DATABASE_URL ไปที่ DB คลาวด์)
              </li>
              <li>
                เช็กสถานะที่ <code className="rounded bg-muted px-1">/api/health</code> — ถ้าขึ้น{" "}
                <code className="rounded bg-muted px-1">{`{ "database": "ok" }`}</code> คือใช้ได้แล้ว
              </li>
            </ol>
            <p className="text-xs text-muted-foreground">
              รายละเอียดเต็มอยู่ใน README.md หัวข้อ &ldquo;Deploy ขึ้น Vercel&rdquo;
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lastSet = recent[0];

  return (
    <div className="flex flex-col gap-10">
      <Hero
        countdown={termInfo.countdown}
        termName={termInfo.name}
        subjectCount={subjects.length}
      />

      {/* ทบทวนวันนี้ (spaced repetition) — CTA เด่นที่สุดรองจาก hero */}
      <Link
        href="/review"
        className="cta-fire group relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 text-white shadow-[0_18px_40px_-14px_rgb(225_29_72/0.55)] transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:flex-row sm:items-center sm:justify-between md:p-8"
      >
        <span className="orb -left-10 -top-16 h-48 w-48 bg-[radial-gradient(circle,rgb(253_224_71/0.4),transparent_70%)]" aria-hidden />
        <div className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <BrainCircuit className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-white/85">ทบทวนวันนี้ · เว้นระยะ 1 → 3 → 7 → 14 → 30 วัน</p>
            <p className="text-2xl font-bold md:text-3xl">
              {review.due > 0 ? `${review.due} ข้อรอทบทวน` : "วันนี้ไม่มีข้อค้าง 🎉"}
            </p>
            {review.dangerous > 0 && (
              <p className="text-sm font-semibold text-yellow-200">⚠ มี {review.dangerous} ข้อที่เคยมั่นใจแต่ผิด</p>
            )}
          </div>
        </div>
        <span className="relative inline-flex h-11 items-center justify-center gap-1.5 self-start rounded-xl bg-white px-5 font-semibold text-[#be123c] sm:self-auto">
          {review.due > 0 ? "เริ่มทบทวน" : "ดูคิวทบทวน"}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>

      {/* สรุปความคืบหน้ารวม */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="สรุปความคืบหน้ารวม"
      >
        <StatCard tone="from-rose-500 to-red-600" icon={<ListChecks className="h-5 w-5" aria-hidden />} label="ข้อที่ทำแล้ว" value={`${summary.totalQuestionsDone} ข้อ`} />
        <StatCard tone="from-orange-400 to-orange-600" icon={<Timer className="h-5 w-5" aria-hidden />} label="เวลาเรียนรวม" value={`${summary.totalStudyMinutes} นาที`} />
        <StatCard tone="from-amber-400 to-yellow-500" icon={<Flame className="h-5 w-5" aria-hidden />} label="Streak" value={`${summary.currentStreak} วัน`} />
        <StatCard tone="from-pink-500 to-fuchsia-600" icon={<TrendingUp className="h-5 w-5" aria-hidden />} label="คะแนนเฉลี่ย" value={`${summary.averagePercent}%`} />
      </section>

      {/* การ์ดวิชา (ดึงจากฐานข้อมูลเสมอ) */}
      <section aria-label="รายวิชา" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight"><span className="text-gradient-red">วิชาเรียน</span> <span className="font-normal text-muted-foreground">({subjects.length} วิชา)</span></h2>
          <Badge variant="secondary" className="rounded-full">
            <CalendarDays className="mr-1 h-3.5 w-3.5" aria-hidden /> {termInfo.name || "สอบปลายภาค"}
          </Badge>
        </div>
        {subjects.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีวิชาในระบบ — ผู้ดูแลสามารถเพิ่มวิชาได้ที่หน้า &ldquo;ผู้ดูแล&rdquo;
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${encodeURIComponent(s.code)}`}
                className="lift focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`เข้าวิชา ${s.code} ${s.name}`}
              >
                <Card
                  className="subject-stripe glass h-full rounded-2xl shadow-none transition-shadow hover:shadow-[0_14px_34px_-14px_var(--sc)]"
                  style={{ "--sc": s.color } as React.CSSProperties}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="subject-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ "--sc": s.color } as React.CSSProperties}
                        aria-hidden
                      >
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-base leading-snug">{s.name}</CardTitle>
                        <CardDescription className="text-sm">{s.code}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{s.questionSetCount} ชุดข้อสอบ</span>
                    <span>{s.documentCount} ชีท</span>
                    <span>{s.topicCount} หัวข้อ</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ทบทวนจุดอ่อนวันนี้ */}
        <Card className="glass rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" aria-hidden /> ทบทวนจุดอ่อนวันนี้
            </CardTitle>
            <CardDescription className="text-sm">
              หัวข้อที่ควรกลับไปทบทวนจากผลการทำข้อสอบล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ยังไม่มีข้อมูลจุดอ่อน — ลองทำชุดข้อสอบสักชุด ระบบจะสรุปหัวข้อที่ควรทบทวนให้เอง
              </p>
            ) : (
              weakTopics.map((w) => (
                <div key={w.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      <span className="font-medium">{localizedToString(w.topicTitle)}</span>
                      <span className="text-xs text-muted-foreground"> · {w.subjectCode}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {w.accuracy}% · ผิด {w.wrongCount}/{w.totalCount} ครั้ง
                    </span>
                  </div>
                  <Progress
                    value={w.accuracy}
                    aria-label={`ความแม่นยำหัวข้อ ${localizedToString(w.topicTitle)} ${w.accuracy}%`}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ปุ่มลัด + ผลล่าสุด */}
        <Card className="glass rounded-2xl shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="h-5 w-5 text-primary" aria-hidden /> เริ่มเรียนต่อ
            </CardTitle>
            <CardDescription className="text-sm">
              กลับไปทำข้อสอบที่ค้างไว้ หรือเปิดชีทอ่านต่อได้เลย
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lastSet ? (
              <div className="rounded-2xl bg-muted/60 p-3 text-sm">
                <p className="font-medium">{localizedToString(lastSet.setTitle)}</p>
                <p className="text-xs text-muted-foreground">
                  {lastSet.subjectCode} · {lastSet.score ? `ได้ ${lastSet.score.percent}%` : "กำลังทำ"}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild className="rounded-2xl">
                <Link href="/subjects">
                  <Play className="mr-1 h-4 w-4" aria-hidden /> เริ่มทำข้อสอบต่อ
                </Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-2xl">
                <Link href="/subjects">
                  <BookOpen className="mr-1 h-4 w-4" aria-hidden /> อ่านชีท
                </Link>
              </Button>
            </div>
            {summary.quizzesTaken > 0 && (
              <p className="text-xs text-muted-foreground">
                ทำไปแล้ว {summary.quizzesTaken} ชุด · เข้าใช้งาน {summary.activeDays} วัน
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl border p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${tone}`}>
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
