import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { generateTimetableImproved } from './timetable.improved';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

@Injectable()
export class TimeTableGeneratorService {
  constructor(private prisma: PrismaService) {}

  async create(body: { deptId: number }) {
    // Fetch days and slots from DB (order matters for algorithm)
    const dbDays = await this.prisma.day.findMany({
      orderBy: { id: 'asc' },
    });
    const dbSlots = await this.prisma.timeSlot.findMany({
      orderBy: { slotNumber: 'asc' },
    });

    if (dbDays.length === 0) throw new Error('No days configured in database');
    if (dbSlots.length === 0)
      throw new Error('No time slots configured in database');

    // Algorithm expects 1-based consecutive indices; we map back to DB IDs when saving
    const days = dbDays.map((_, i) => i + 1);
    const slots = dbSlots.map((_, i) => i + 1);

    // 1️⃣ Get department with courses + sections
    const department = await this.prisma.department.findUnique({
      where: { id: body.deptId },
      include: {
        courses: { include: { sections: true } },
      },
    });

    if (!department) throw new Error('Department not found');

    // 2️⃣ Build sections list
    const sections = department.courses.flatMap((c) => c.sections);

    // 3️⃣ Build SECTION → SUBJECT MAP ✅ (VERY IMPORTANT)
    const sectionSubjectsMap: Record<number, any[]> = {};
    // 3️⃣.b Build FACULTY → SUBJECT MAP
    const facultySubjectsMap: Record<number, any[]> = {};
    const allSubjects: any[] = [];

    // Build section-subject mapping based on semester
    for (const course of department.courses) {
      for (const section of course.sections) {
        // Get subjects for this course AND this specific semester
        const semesterSubjects = await this.prisma.courseSubject.findMany({
          where: {
            courseId: course.id,
            semester: section.semester,
          },
        });

        // Map subjects for this section
        sectionSubjectsMap[section.id] = semesterSubjects.map((s) => ({
          id: s.subjectId,
          lecturesPerWeek: s.lecturesPerWeek,
          isLab: s.isLab,
        }));

        // Collect all subjects for faculty mapping later
        allSubjects.push(...semesterSubjects);
      }
    }
    // 4️⃣ Build teacherSubjects array: { teacherId, subjectId }
    const facultySubjectsRaw = await this.prisma.facultySubject.findMany({
      where: {
        subjectId: {
          in: allSubjects.map((s) => s.subjectId),
        },
      },
      select: {
        subjectId: true,
        facultyId: true,
        faculty: {
          select: {
            maxLecturesPerWeek: true,
          },
        },
      },
    });
    const facultySubjects = facultySubjectsRaw.map((item) => ({
      subjectId: item.subjectId,
      facultyId: item.facultyId,
      maxLecturesPerWeek: item.faculty?.maxLecturesPerWeek ?? 20,
    }));

    // 4️⃣.b Build FACULTY → SUBJECT MAP (similar to SECTION → SUBJECT MAP)
    for (const fs of facultySubjects) {
      const subjectMeta = allSubjects.find((s) => s.subjectId === fs.subjectId);

      if (!facultySubjectsMap[fs.facultyId]) {
        facultySubjectsMap[fs.facultyId] = [];
      }

      facultySubjectsMap[fs.facultyId].push({
        id: fs.subjectId,
        s_lecturesPerWeek: subjectMeta?.lecturesPerWeek ?? 0,
        isLab: subjectMeta?.isLab ?? false,
        f_maxLecturesPerWeek: fs.maxLecturesPerWeek,
      });
    }

    // 5️⃣ Get department rooms
    const dbRooms = await this.prisma.room.findMany({
      where: { departmentId: department.id },
    });

    const rooms = dbRooms.map((r) => ({
      id: r.id,
      isLab: r.roomType === 'lab', // 🔥 mapping fix
      capacity: r.capacity,
    }));

    // console.log({
    //       sections,
    //       sectionSubjectsMap,
    //       facultySubjectsMap,
    //       rooms,
    //       days,
    //       slots
    //     })

    // 6️⃣ Run algorithm with improved greedy scheduler
    const result = generateTimetableImproved({
      sections,
      sectionSubjectsMap,
      facultySubjectsMap,
      rooms,
      days,
      slots,
    });

    // 7️⃣ Save timetable to DB
    const sectionToSession = Object.fromEntries(
      sections.map((s) => [s.id, s.sessionId]),
    );
    const timetableData = result.timetable.map((t) => ({
      sessionId: sectionToSession[t.sectionId],
      sectionId: t.sectionId,
      subjectId: t.subjectId,
      facultyId: t.teacherId,
      roomId: t.roomId,
      dayId: dbDays[t.day - 1].id,
      timeSlotId: dbSlots[t.slot - 1].id,
    }));

    if (timetableData.length > 0) {
      // Remove existing timetable for these sections so we don't duplicate
      await this.prisma.timetable.deleteMany({
        where: {
          OR: sections.map((s) => ({
            sectionId: s.id,
            sessionId: s.sessionId,
          })),
        },
      });
      await this.prisma.timetable.createMany({ data: timetableData });
    }

    return {
      message: 'Timetable generated successfully',
      data: {
        timetable: result.timetable,
        savedCount: timetableData.length,
      },
    };
  }
}
