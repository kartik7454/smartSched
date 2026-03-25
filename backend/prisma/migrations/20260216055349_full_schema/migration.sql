-- DropForeignKey
ALTER TABLE "Timetable" DROP CONSTRAINT "Timetable_sectionId_fkey";

-- DropIndex
DROP INDEX "Timetable_facultyId_dayId_timeSlotId_sessionId_key";

-- DropIndex
DROP INDEX "Timetable_roomId_dayId_timeSlotId_sessionId_key";

-- DropIndex
DROP INDEX "Timetable_sectionId_dayId_timeSlotId_sessionId_key";

-- AlterTable
ALTER TABLE "Timetable" ADD COLUMN     "groupId" INTEGER,
ALTER COLUMN "sectionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StudentGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" INTEGER NOT NULL,

    CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Timetable_dayId_timeSlotId_idx" ON "Timetable"("dayId", "timeSlotId");

-- AddForeignKey
ALTER TABLE "StudentGroup" ADD CONSTRAINT "StudentGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
