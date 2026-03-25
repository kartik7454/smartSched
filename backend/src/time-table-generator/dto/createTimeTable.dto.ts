import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateTimeTableDto {
  @IsNotEmpty()
  @IsInt()
  deptId: number;
}
