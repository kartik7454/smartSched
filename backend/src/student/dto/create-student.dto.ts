import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsInt()
  userId: number;

  @IsInt()
  sectionId: number;

  @IsString()
  @IsNotEmpty()
  rollNumber: string;
}
