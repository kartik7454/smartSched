import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  departmentId: number;

  @IsInt()
  durationYears: number;

  // @IsInt()
  // semester: number;
}
