import { Module } from '@nestjs/common';
import { CourseSubjectService } from './course-subject.service';
import { CourseSubjectController } from './course-subject.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CourseSubjectController],
  providers: [CourseSubjectService, PrismaService],
})
export class CourseSubjectModule {}
