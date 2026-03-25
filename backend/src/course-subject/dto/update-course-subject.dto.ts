import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseSubjectDto } from './create-course-subject.dto';

export class UpdateCourseSubjectDto extends PartialType(
  CreateCourseSubjectDto,
) {}
