import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FacultySubjectService } from './faculty-subject.service';
import { CreateFacultySubjectDto } from './dto/create-faculty-subject.dto';
import { UpdateFacultySubjectDto } from './dto/update-faculty-subject.dto';

@Controller('faculty-subject')
export class FacultySubjectController {
  constructor(private readonly service: FacultySubjectService) {}

  @Post()
  create(@Body() dto: CreateFacultySubjectDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFacultySubjectDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
