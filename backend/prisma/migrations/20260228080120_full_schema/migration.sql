/*
  Warnings:

  - A unique constraint covering the columns `[courseId,subjectId,semester]` on the table `CourseSubject` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `semester` to the `CourseSubject` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CourseSubject_courseId_subjectId_key";

-- AlterTable
ALTER TABLE "CourseSubject" ADD COLUMN     "semester" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CourseSubject_courseId_subjectId_semester_key" ON "CourseSubject"("courseId", "subjectId", "semester");
