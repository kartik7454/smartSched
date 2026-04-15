import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { SectionTimetableSlotDto } from './dto/section-timetable-slot.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('timetables')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Post()
  create(@Body() dto: CreateTimetableDto) {
    return this.timetableService.create(dto);
  }

  @Get()
  findAll() {
    return this.timetableService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('section/:sectionId')
  findBySectionId(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.timetableService.findBySectionId(sectionId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('section/:sectionId')
  replaceSectionTimetable(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body(new ParseArrayPipe({ items: SectionTimetableSlotDto }))
    body: SectionTimetableSlotDto[],
  ) {
    return this.timetableService.replaceSectionTimetable(sectionId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('faculty/:facultyId')
  findByFacultyId(@Param('facultyId', ParseIntPipe) facultyId: number) {
    return this.timetableService.findByFacultyId(facultyId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('department/:departmentId')
  findByDepartmentId(
    @Param('departmentId', ParseIntPipe) departmentId: number,
  ) {
    return this.timetableService.findByDepartmentId(departmentId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.timetableService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimetableDto,
  ) {
    return this.timetableService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.timetableService.remove(id);
  }


  

  // Delete multiple timetables by sectionId
  @UseGuards(AuthGuard('jwt'))
  @Delete('section/:sectionId')
  removeManyBySectionId(@Param('sectionId', ParseIntPipe) sectionId: number) {
    return this.timetableService.removeBySectionId(sectionId);
  }
}
