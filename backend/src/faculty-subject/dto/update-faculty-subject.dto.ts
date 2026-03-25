import { PartialType } from '@nestjs/mapped-types';
import { CreateFacultySubjectDto } from './create-faculty-subject.dto';

export class UpdateFacultySubjectDto extends PartialType(
  CreateFacultySubjectDto,
) {}
