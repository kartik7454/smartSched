import { IsBoolean, IsInt } from 'class-validator';

export class CreateCourseSubjectDto {
  @IsInt()
  courseId: number;

  @IsInt()
  subjectId: number;

  @IsInt()
  semester: number;

  @IsInt()
  lecturesPerWeek: number;

  @IsBoolean()
  isLab: boolean;
}
