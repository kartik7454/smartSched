import { IsInt, IsString, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  semester: number;

  @IsInt()
  batchYear: number;

  @IsInt()
  courseId: number;

  @IsInt()
  sessionId: number;
}
