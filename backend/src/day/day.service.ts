import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DayService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.day.findMany({
      orderBy: { id: 'asc' },
    });
  }
}
