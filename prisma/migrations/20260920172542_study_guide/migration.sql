-- CreateTable
CREATE TABLE "study_guides" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_guides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_guides_subjectId_key" ON "study_guides"("subjectId");

-- AddForeignKey
ALTER TABLE "study_guides" ADD CONSTRAINT "study_guides_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
