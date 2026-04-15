import { IsInt, IsOptional, Min } from 'class-validator';

/** Single row in PUT /timetables/section/:sectionId body (array items). */
export class SectionTimetableSlotDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sectionId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  groupId?: number;

  @IsInt()
  @Min(1)
  subjectId: number;

  @IsInt()
  @Min(1)
  facultyId: number;

  @IsInt()
  @Min(1)
  roomId: number;

  @IsInt()
  @Min(1)
  dayId: number;

  @IsInt()
  @Min(1)
  timeSlotId: number;
}
