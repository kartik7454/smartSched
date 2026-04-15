import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacultySubjectDto } from './dto/create-faculty-subject.dto';
import { UpdateFacultySubjectDto } from './dto/update-faculty-subject.dto';

@Injectable()
export class FacultySubjectService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFacultySubjectDto) {
    return this.prisma.facultySubject.create({
      data: dto,
      include: {
        faculty: { include: { user: true } },
        subject: true,
        course: true,
      },
    });
  }

  findAll() {
    return this.prisma.facultySubject.findMany({
      include: {
        faculty: { include: { user: true } },
        subject: true,
        course: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.facultySubject.findUnique({
      where: { id },
      include: {
        faculty: { include: { user: true } },
        subject: true,
        course: true,
      },
    });
  }

  update(id: number, dto: UpdateFacultySubjectDto) {
    return this.prisma.facultySubject.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.facultySubject.delete({
      where: { id },
    });
  }

  /**
   * Returns unique faculties teaching any of the given subjectIds.
   * Each faculty is included only once even if teaching multiple of the provided subjects.
   * @param subjectIds Array of subject IDs.
   */
  async getUniqueFacultiesBySubjectIds(subjectIds: number[]) {
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) return [];

    type FacultyWithUser = {
      id: number;
      userId: number;
      departmentId: number;
      maxLecturesPerWeek: number;
      user: {
        id: number;
        name: string;
        departmentId: number | null;
        email: string;
        password: string;
        roleId: number;
      };
    };

    const all = await this.prisma.facultySubject.findMany({
      where: {
        subjectId: { in: subjectIds },
      },
      include: {
        faculty: {
          include: { user: true },
        },
      },
    });

    const seen = new Set<number>();
    const uniqueFaculties: FacultyWithUser[] = [];
    for (const fs of all) {
      const faculty = fs.faculty as FacultyWithUser | null;
      if (!faculty) continue;
      if (!seen.has(faculty.id)) {
        uniqueFaculties.push(faculty);
        seen.add(faculty.id);
      }
    }

    return uniqueFaculties;
  }
}
