/**
 * สคริปต์รัน PostgreSQL แบบฝังสำหรับพัฒนาบนเครื่องที่ไม่มี Postgres
 * ใช้เฉพาะ dev: npm run dev:db
 * (production ใช้ docker-compose หรือ Postgres จริงตาม DATABASE_URL)
 */
import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

async function main() {
  try {
    await pg.initialise();
    console.log("[dev-db] initialised");
  } catch {
    console.log("[dev-db] initialise skipped (มีข้อมูลอยู่แล้ว?)");
  }
  try {
    await pg.start();
    console.log("[dev-db] started on :5432");
  } catch {
    console.log("[dev-db] start skipped (อาจรันอยู่แล้ว)");
  }
  try {
    await pg.createDatabase("final_exam_prep");
    console.log("[dev-db] created database final_exam_prep");
  } catch {
    console.log("[dev-db] database final_exam_prep มีอยู่แล้ว");
  }
  console.log("[dev-db] พร้อมใช้ — DATABASE_URL=postgresql://postgres:postgres@localhost:5432/final_exam_prep");
  // ค้างไว้ให้ postgres ทำงานต่อ
  await new Promise(() => undefined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
