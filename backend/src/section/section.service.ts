import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';

@Injectable()
export class SectionService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateSectionDto) {
    const existing = await this.prisma.section.findFirst({
      where: {
        courseId: dto.courseId,
        semester: dto.semester,
        name: dto.name,
        sessionId: dto.sessionId,
      },
    });

    if (existing) throw new BadRequestException('Section already exists');

    return this.prisma.section.create({ data: dto });
  }

  // GET ALL
  findAll() {
    return this.prisma.section.findMany({
      include: { course: true, session: true },
    });
  }

  // FIND BY DEPARTMENT ID
  async findByDepartmentId(departmentId: number) {
    return this.prisma.section.findMany({
      include: { course: true, session: true },
      where: {
        course: {
          departmentId: departmentId
        }
      }
    });
  }

  // GET ONE
  async findOne(id: number) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { course: true, session: true, students: true },
    });

    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  // UPDATE
  async update(id: number, dto: UpdateSectionDto) {
    await this.findOne(id);

    return this.prisma.section.update({
      where: { id },
      data: dto,
    });
  }

  // DELETE
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.section.delete({
      where: { id },
    });
  }
}
