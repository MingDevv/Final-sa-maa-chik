import Link from "next/link";
import {
  BookOpen,
  Brain,
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
import { analyticsService } from "@/server/services/analytics-service";
import { getReadOnlySession } from "@/server/read-session";
import { localizedToString } from "@/lib/types";

export const dynamic = "force-dynamic";

const greetingForHour = (h: number) =>
  h < 11 ? "สวัสดีตอนเช้า" : h < 15 ? "สวัสดีตอนบ่าย" : h < 18 ? "สวัสดีตอนเย็น" : "สวัสดียามค่ำ";

export default async function DashboardPage() {
  const session = await getReadOnlySession();
  const [subjects, summary, weakTopics, recent] = await Promise.all([
    subjectService.listSubjects(),
    analyticsService.dashboard(session.ownerKey),
    analyticsService.weakTopics(session.ownerKey),
    analyticsService.recentAttempts(session.ownerKey),
  ]);

  const lastSet = recent[0];
  const hour = new Date().getHours();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-wine md:text-3xl dark:text-primary">
          {greetingForHour(hour)} พร้อมสอบปลายภาคกันหรือยัง?
        </h1>
        <p className="text-sm text-muted-foreground">
          อ่านชีท ทำโจทย์ ทบทวนจุดอ่อน — ติดตามความพร้อมของเราได้ทุกวัน
        </p>
      </section>

      {/* สรุปความคืบหน้ารวม */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label="สรุปความคืบหน้ารวม"
      >
        <StatCard icon={<ListChecks className="h-4 w-4" aria-hidden />} label="ข้อที่ทำแล้ว" value={`${summary.totalQuestionsDone} ข้อ`} />
        <StatCard icon={<Timer className="h-4 w-4" aria-hidden />} label="เวลาเรียนรวม" value={`${summary.totalStudyMinutes} นาที`} />
        <StatCard icon={<Flame className="h-4 w-4" aria-hidden />} label="Streak" value={`${summary.currentStreak} วัน`} />
        <StatCard icon={<TrendingUp className="h-4 w-4" aria-hidden />} label="คะแนนเฉลี่ย" value={`${summary.averagePercent}%`} />
      </section>

      {/* การ์ดวิชา (ดึงจากฐานข้อมูลเสมอ) */}
      <section aria-label="รายวิชา" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">วิชาเรียน ({subjects.length} วิชา)</h2>
          <Badge variant="secondary" className="rounded-full">
            <CalendarDays className="mr-1 h-3.5 w-3.5" aria-hidden /> สอบปลายภาค 1/2569
          </Badge>
        </div>
        {subjects.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีวิชาในระบบ — ผู้ดูแลสามารถเพิ่มวิชาได้ที่หน้า &ldquo;ผู้ดูแล&rdquo;
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/subjects/${encodeURIComponent(s.code)}`}
                className="lift focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`เข้าวิชา ${s.code} ${s.name}`}
              >
                <Card className="h-full rounded-3xl border-border/70 shadow-soft hover:shadow-soft-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      >
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <div>
                        <CardTitle className="text-base">{s.name}</CardTitle>
                        <CardDescription className="text-xs">{s.code}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">{s.topicCount} หัวข้อ</span>
                    <span className="rounded-full bg-muted px-2 py-1">{s.documentCount} ชีท</span>
                    <span className="rounded-full bg-muted px-2 py-1">{s.questionSetCount} ชุดข้อสอบ</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ทบทวนจุดอ่อนวันนี้ */}
        <Card className="rounded-3xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-purple-brand" aria-hidden /> ทบทวนจุดอ่อนวันนี้
            </CardTitle>
            <CardDescription className="text-xs">
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
        <Card className="rounded-3xl shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">เริ่มเรียนต่อ</CardTitle>
            <CardDescription className="text-xs">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-soft">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-secondary text-wine dark:text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}
