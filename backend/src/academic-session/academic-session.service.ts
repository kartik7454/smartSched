import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';

@Injectable()
export class AcademicSessionService {
  constructor(private prisma: PrismaService) {}

  // Create session
  async create(dto: CreateAcademicSessionDto) {
    // Only ONE active session allowed
    if (dto.isActive ?? true) {
      await this.prisma.academicSession.updateMany({
        data: { isActive: false },
      });
    }

    return this.prisma.academicSession.create({
      data: dto,
    });
  }

  // Get all sessions
  findAll() {
    return this.prisma.academicSession.findMany({
      orderBy: { id: 'desc' },
    });
  }

  // Get active session
  async getActiveSession() {
    const session = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!session) throw new NotFoundException('No active academic session');
    return session;
  }

  // Get one
  async findOne(id: number) {
    const session = await this.prisma.academicSession.findUnique({
      where: { id },
    });

    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  // Update session
  async update(id: number, dto: UpdateAcademicSessionDto) {
    await this.findOne(id);

    // If making this active → deactivate others
    if (dto.isActive === true) {
      await this.prisma.academicSession.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    return this.prisma.academicSession.update({
      where: { id },
      data: dto,
    });
  }

  // Delete session
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.academicSession.delete({
      where: { id },
    });
  }
}
