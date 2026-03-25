import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

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
}
