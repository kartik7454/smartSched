import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: dto,
      include: {
        user: true,
        department: true,
      },
    });
  }

  findAll() {
    return this.prisma.faculty.findMany({
      include: {
        user: true,
        department: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.faculty.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
      },
    });
  }

  update(id: number, dto: UpdateFacultyDto) {
    return this.prisma.faculty.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.faculty.delete({
      where: { id },
    });
  }
}
