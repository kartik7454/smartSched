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

  findOne(id: number) {
    return this.prisma.courseSubject.findUnique({
      where: { id },
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
}
