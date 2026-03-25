import { Module } from '@nestjs/common';
import { AcademicSessionService } from './academic-session.service';
import { AcademicSessionController } from './academic-session.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [AcademicSessionController],
  providers: [AcademicSessionService, PrismaService],
})
export class AcademicSessionModule {}
