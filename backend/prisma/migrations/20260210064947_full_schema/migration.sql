/*
  Warnings:

  - You are about to drop the column `semester` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `batchYear` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Timetable` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,subjectId]` on the table `CourseSubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Day` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facultyId,subjectId,courseId]` on the table `FacultySubject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sectionId,dayId,timeSlotId,sessionId]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[facultyId,dayId,timeSlotId,sessionId]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[roomId,dayId,timeSlotId,sessionId]` on the table `Timetable` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `durationYears` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `name` on the `Day` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sectionId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `startTime` on the `TimeSlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `TimeSlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `sectionId` to the `Timetable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `Timetable` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DayEnum" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterEnum
ALTER TYPE "RoleName" ADD VALUE 'hod';

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semester",
DROP COLUMN "year",
ADD COLUMN     "durationYears" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "CourseSubject" ADD COLUMN     "isLab" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Day" DROP COLUMN "name",
ADD COLUMN     "name" "DayEnum" NOT NULL;

-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "maxLecturesPerWeek" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "batchYear",
DROP COLUMN "courseId",
DROP COLUMN "departmentId",
DROP COLUMN "section",
DROP COLUMN "semester",
ADD COLUMN     "sectionId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TimeSlot" DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIME NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIME NOT NULL;

-- AlterTable
ALTER TABLE "Timetable" DROP COLUMN "courseId",
ADD COLUMN     "sectionId" INTEGER NOT NULL,
ADD COLUMN     "sessionId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_name_key" ON "AcademicSession"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Section_courseId_semester_name_sessionId_key" ON "Section"("courseId", "semester", "name", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSubject_courseId_subjectId_key" ON "CourseSubject"("courseId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Day_name_key" ON "Day"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FacultySubject_facultyId_subjectId_courseId_key" ON "FacultySubject"("facultyId", "subjectId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_sectionId_dayId_timeSlotId_sessionId_key" ON "Timetable"("sectionId", "dayId", "timeSlotId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_facultyId_dayId_timeSlotId_sessionId_key" ON "Timetable"("facultyId", "dayId", "timeSlotId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_roomId_dayId_timeSlotId_sessionId_key" ON "Timetable"("roomId", "dayId", "timeSlotId", "sessionId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
