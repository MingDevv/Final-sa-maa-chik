import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { subjectService } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "วิชาเรียนทั้งหมด" };

export default async function SubjectsIndexPage() {
  const subjects = await subjectService.listSubjects();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold text-wine dark:text-primary">วิชาเรียนทั้งหมด</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/subjects/${encodeURIComponent(s.code)}`}
            className="lift rounded-3xl focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Card className="h-full rounded-3xl shadow-soft hover:shadow-soft-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  >
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{s.code}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {s.topicCount} หัวข้อ · {s.documentCount} ชีท · {s.questionSetCount} ชุดข้อสอบ
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
