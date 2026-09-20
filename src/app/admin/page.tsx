import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { subjectService } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ผู้ดูแลเนื้อหา" };

export default async function AdminPage() {
  const subjects = await subjectService.listAllSubjects();
  return (
    <AdminDashboard
      subjects={subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        color: s.color,
        status: s.status,
        topicCount: s.topicCount,
        documentCount: s.documentCount,
        questionSetCount: s.questionSetCount,
      }))}
    />
  );
}
