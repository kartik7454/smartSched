import { IsInt } from 'class-validator';

export class CreateFacultyDto {
  @IsInt()
  userId: number;

  @IsInt()
  departmentId: number;

  @IsInt()
  maxLecturesPerWeek: number;
}
