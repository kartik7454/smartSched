import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: dto,
      include: { department: true },
    });
  }

  findAll() {
    return this.prisma.subject.findMany({
      include: { department: true },
    });
  }

  findOne(id: number) {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  update(id: number, dto: UpdateSubjectDto) {
    return this.prisma.subject.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
