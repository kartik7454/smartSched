import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { CoursesModule } from './courses/courses.module';
import { SubjectsModule } from './subjects/subjects.module';
import { FacultyModule } from './faculty/faculty.module';
import { RoomsModule } from './class-room/claass-room.module';
import { FacultySubjectModule } from './faculty-subject/faculty-subject.module';
import { CourseSubjectModule } from './course-subject/course-subject.module';
import { SectionModule } from './section/section.module';
import { AcademicSessionModule } from './academic-session/academic-session.module';
import { TimeSlotModule } from './time-slot/time-slot.module';
import { TimeTableGeneratorModule } from './time-table-generator/time-table-generator.module';
import { TimetableModule } from './timetable/timetable.module';
import { DayModule } from './day/day.module';
import { StudentModule } from './student/student.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    CoursesModule,
    SubjectsModule,
    FacultyModule,
    RoomsModule,
    FacultySubjectModule,
    CourseSubjectModule,
    SectionModule,
    AcademicSessionModule,
    TimeSlotModule,
    TimeTableGeneratorModule,
    TimetableModule,
    DayModule,
    StudentModule,
    MeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
