import { Controller, Post, Body } from '@nestjs/common';
import { TimeTableGeneratorService } from './time-table-generator.service';
import { CreateTimeTableDto } from './dto/createTimeTable.dto';

@Controller('time-table-generator')
export class TimeTableGeneratorController {
  constructor(private readonly service: TimeTableGeneratorService) {}

  @Post()
  create(@Body() body: CreateTimeTableDto) {
    return this.service.create(body);
  }
}
