import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsBoolean()
  isLab: boolean;

  @IsInt()
  departmentId: number;
}
