import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CourseSubjectService } from './course-subject.service';
import { CreateCourseSubjectDto } from './dto/create-course-subject.dto';
import { UpdateCourseSubjectDto } from './dto/update-course-subject.dto';
import { ParseIntPipe } from '@nestjs/common';
@Controller('course-subject')
export class CourseSubjectController {
  constructor(private readonly service: CourseSubjectService) {}

  @Post()
  create(@Body() dto: CreateCourseSubjectDto) {
    return this.service.create(dto);
  }
  
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('by-course-and-semester')
  async findSubjectsByCourseAndSemester(
    @Query('courseId', new ParseIntPipe()) courseId: number,
    @Query('semester', new ParseIntPipe()) semester: number,
  ) {
    console.log('✅', { courseId, semester });
  
    return this.service.findSubjectsByCourseAndSemester(courseId, semester);
  }



  @Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.service.findOne(id);
}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCourseSubjectDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  // Get all subjects by courseId and semester, eager loading subject
 
}
