import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  roomType: string; // CLASSROOM | LAB

  @IsInt()
  capacity: number;

  @IsInt()
  departmentId: number;
}
