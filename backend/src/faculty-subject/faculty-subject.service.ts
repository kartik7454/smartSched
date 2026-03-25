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
}
