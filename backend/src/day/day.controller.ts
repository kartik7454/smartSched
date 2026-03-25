import { Controller, Get } from '@nestjs/common';
import { DayService } from './day.service';

@Controller('days')
export class DayController {
  constructor(private readonly service: DayService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
