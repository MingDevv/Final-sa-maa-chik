import { subjectService } from "@/server/services/subject-service";
import { assertAdmin, handleApiError, ok } from "@/server/api-helpers";
import { createSubjectSchema, createTopicSchema } from "@/lib/validation";

/** GET ทุกวิชา (รวมฉบับร่าง/เก็บถาวร) สำหรับหน้าผู้ดูแล */
export async function GET(req: Request) {
  try {
    assertAdmin(req);
    const subjects = await subjectService.listAllSubjects();
    return ok(subjects);
  } catch (error) {
    return handleApiError(error);
  }
}

/** POST สร้างวิชาใหม่ หรือหัวข้อใหม่ (ถ้ามี subjectId) */
export async function POST(req: Request) {
  try {
    assertAdmin(req);
    const body = await req.json();
    if ("subjectId" in body) {
      const topic = createTopicSchema.parse(body);
      const result = await subjectService.createTopic(topic);
      return ok(result);
    }
    const subject = createSubjectSchema.parse(body);
    const result = await subjectService.createSubject(subject);
    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
