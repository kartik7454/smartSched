import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: dto,
      include: { department: true },
    });
  }

  findAll() {
    return this.prisma.course.findMany({
      include: { department: true },
    });
  }

  findOne(id: number) {
    return this.prisma.course.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  update(id: number, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
