import { IsString, Matches, IsOptional, IsBoolean } from 'class-validator';

export class CreateAcademicSessionDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Session must be like 2025-26',
  })
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
