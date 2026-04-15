import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { SectionTimetableSlotDto } from './dto/section-timetable-slot.dto';

@Injectable()
export class TimetableService {
  constructor(private prisma: PrismaService) {}

  private readonly includeRelations = {
    session: true,
    section: true,
    group: true,
    subject: true,
    faculty: { include: { user: true } },
    room: true,
    day: true,
    timeSlot: true,
  };

  async create(dto: CreateTimetableDto) {
    return this.prisma.timetable.create({
      data: dto,
      include: this.includeRelations,
    });
  }

  findAll() {
    return this.prisma.timetable.findMany({
      include: this.includeRelations,
    });
  }

  async findOne(id: number) {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!timetable) throw new NotFoundException('Timetable not found');
    return timetable;
  }

  async findBySectionId(sectionId: number) {
    const entries = await this.prisma.timetable.findMany({
      where: { sectionId },
      include: this.includeRelations,
      orderBy: [{ dayId: 'asc' }, { timeSlotId: 'asc' }],
    });
    return entries;
  }

  async findByFacultyId(facultyId: number) {
    const entries = await this.prisma.timetable.findMany({
      where: { facultyId },
      include: {
        ...this.includeRelations,
        section: { include: { course: true } },
      },
      orderBy: [{ dayId: 'asc' }, { timeSlotId: 'asc' }],
    });
    return entries;
  }

  async findByDepartmentId(departmentId: number) {
    const sectionIds = await this.prisma.section.findMany({
      where: { course: { departmentId } },
      select: { id: true },
    });
    const ids = sectionIds.map((s) => s.id);

    const entries = await this.prisma.timetable.findMany({
      where: { sectionId: { in: ids } },
      include: {
        ...this.includeRelations,
        section: { include: { course: true } },
      },
      orderBy: [{ dayId: 'asc' }, { timeSlotId: 'asc' }],
    });
    return entries;
  }

  async update(id: number, dto: UpdateTimetableDto) {
    await this.findOne(id);
    return this.prisma.timetable.update({
      where: { id },
      data: dto,
      include: this.includeRelations,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.timetable.delete({
      where: { id },
      include: this.includeRelations,
    });
  }

  // Removes all timetables for a given sectionId
  async removeBySectionId(sectionId: number) {
    // Optionally you can first check if any exists and throw if not. Here we simply deleteMany.
    const result = await this.prisma.timetable.deleteMany({
      where: { sectionId },
    });
    return { count: result.count };
  }

  /**
   * Replace all timetable rows for a section: delete missing ids, update kept ids, create new (id missing or <= 0).
   */
  async replaceSectionTimetable(
    sectionId: number,
    items: SectionTimetableSlotDto[],
  ) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');

    const existing = await this.prisma.timetable.findMany({
      where: { sectionId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((e) => e.id));

    const keepIds = new Set(
      items
        .filter((i) => i.id !== undefined && i.id !== null && i.id > 0)
        .map((i) => i.id as number),
    );

    for (const kid of keepIds) {
      if (!existingIds.has(kid)) {
        throw new BadRequestException(
          `Timetable row ${kid} does not belong to this section.`,
        );
      }
    }

    const toDelete = [...existingIds].filter((id) => !keepIds.has(id));

    await this.prisma.$transaction(async (tx) => {
      if (toDelete.length) {
        await tx.timetable.deleteMany({
          where: { id: { in: toDelete }, sectionId },
        });
      }

      for (const item of items) {
        const {
          id,
          subjectId,
          facultyId,
          roomId,
          dayId,
          timeSlotId,
          groupId,
        } = item;
        const isNew = id === undefined || id === null || id <= 0;

        if (!isNew) {
          await tx.timetable.update({
            where: { id: id as number },
            data: {
              subjectId,
              facultyId,
              roomId,
              dayId,
              timeSlotId,
              ...(groupId !== undefined ? { groupId } : {}),
            },
          });
        } else {
          await tx.timetable.create({
            data: {
              sessionId: section.sessionId,
              sectionId,
              subjectId,
              facultyId,
              roomId,
              dayId,
              timeSlotId,
              groupId: groupId ?? null,
            },
          });
        }
      }
    });

    return this.prisma.timetable.findMany({
      where: { sectionId },
      include: this.includeRelations,
      orderBy: [{ dayId: 'asc' }, { timeSlotId: 'asc' }],
    });
  }
}
