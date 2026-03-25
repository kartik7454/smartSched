import { IsInt, IsString, Matches } from 'class-validator';

export class CreateTimeSlotDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string; // "09:00"

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string; // "10:00"

  @IsInt()
  slotNumber: number;
}
