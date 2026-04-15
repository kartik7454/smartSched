import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseSubjectDto } from './dto/create-course-subject.dto';
import { UpdateCourseSubjectDto } from './dto/update-course-subject.dto';

@Injectable()
export class CourseSubjectService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCourseSubjectDto) {
    return this.prisma.courseSubject.create({
      data: dto,
      include: {
        course: true,
        subject: true,
      },
    });
  }

  findAll() {
    return this.prisma.courseSubject.findMany({
      include: {
        course: true,
        subject: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.courseSubject.findUnique({
      where: { 
        id: id, // Make sure id is a number; Prisma expects { id: number }
      },
      include: {
        course: true,
        subject: true,
      },
    });
  }

  update(id: number, dto: UpdateCourseSubjectDto) {
    return this.prisma.courseSubject.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.courseSubject.delete({
      where: { id },
    });
  }

  // Get all subjects by courseId, eager loading subject
  async findSubjectsByCourseId(courseId: number) {
    return this.prisma.courseSubject.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        subject: true,
      },
    });
  }

  // Get all subjects by courseId and semester, eager loading subject
  async findSubjectsByCourseAndSemester(courseId: number, semester: number) {
    return this.prisma.courseSubject.findMany({
      where: {
        courseId: courseId,
        semester: semester,
      },
      include: {
        subject: true,
      },
    });
  }
}
