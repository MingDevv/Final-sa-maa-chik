"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopicItem {
  id: string;
  title: string;
}
interface SetItem {
  id: string;
  title: string;
  topicId: string | null;
  topicTitle: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  recommendedMinutes: number;
  questionCount: number;
}

const difficultyLabel: Record<SetItem["difficulty"], string> = {
  EASY: "ง่าย",
  MEDIUM: "ปานกลาง",
  HARD: "ยาก",
};

/** แถบกรองชุดข้อสอบตามหัวข้อ / ระดับความยาก (กรองฝั่ง client จากชุดที่เผยแพร่แล้ว) */
export function SubjectContent({
  topics,
  sets,
}: {
  topics: TopicItem[];
  sets: SetItem[];
}) {
  const [topicId, setTopicId] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");

  const filtered = useMemo(
    () =>
      sets.filter(
        (s) =>
          (topicId === "all" || s.topicId === topicId) &&
          (difficulty === "all" || s.difficulty === difficulty),
      ),
    [sets, topicId, difficulty],
  );

  return (
    <section className="flex flex-col gap-3" aria-label="ชุดข้อสอบของวิชานี้">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger className="w-56 rounded-2xl" aria-label="กรองตามหัวข้อ">
            <SelectValue placeholder="ทุกหัวข้อ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหัวข้อ</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-40 rounded-2xl" aria-label="กรองตามระดับความยาก">
            <SelectValue placeholder="ทุกระดับ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกระดับ</SelectItem>
            <SelectItem value="EASY">ง่าย</SelectItem>
            <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
            <SelectItem value="HARD">ยาก</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} จาก {sets.length} ชุด
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            ยังไม่มีชุดข้อสอบที่ตรงกับตัวกรอง
          </CardContent>
        </Card>
      ) : (
        filtered.map((set) => (
          <Card key={set.id} className="rounded-3xl shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{set.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="rounded-full">
                    {difficultyLabel[set.difficulty]}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {set.questionCount} ข้อ · {set.recommendedMinutes} นาที
                  </Badge>
                </div>
              </div>
              {set.topicTitle && (
                <p className="text-xs text-muted-foreground">หัวข้อ: {set.topicTitle}</p>
              )}
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" className="rounded-2xl">
                <Link href={`/quiz/${set.id}`}>
                  <PlayCircle className="mr-1 h-4 w-4" aria-hidden /> เริ่มทำข้อสอบ
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </section>
  );
}
