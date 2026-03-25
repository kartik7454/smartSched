import { IsInt } from 'class-validator';

export class CreateFacultySubjectDto {
  @IsInt()
  facultyId: number;

  @IsInt()
  subjectId: number;

  @IsInt()
  courseId: number;
}
