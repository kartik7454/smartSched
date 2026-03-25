import { Module } from '@nestjs/common';
import { FacultySubjectService } from './faculty-subject.service';
import { FacultySubjectController } from './faculty-subject.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FacultySubjectController],
  providers: [FacultySubjectService, PrismaService],
})
export class FacultySubjectModule {}
