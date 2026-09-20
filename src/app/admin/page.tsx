import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminLogin } from "@/components/admin/admin-login";
import { ADMIN_COOKIE } from "@/server/api-helpers";
import { subjectService } from "@/server/services/subject-service";

export const dynamic = "force-dynamic";
export const metadata = { title: "ผู้ดูแลเนื้อหา" };

export default async function AdminPage() {
  const store = await cookies();
  const expected = createHash("sha256")
    .update(process.env.ADMIN_CODE ?? "Ming888")
    .digest("hex");
  const loggedIn = store.get(ADMIN_COOKIE)?.value === expected;

  if (!loggedIn) {
    return <AdminLogin />;
  }

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
