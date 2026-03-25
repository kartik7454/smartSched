import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DayController } from './day.controller';
import { DayService } from './day.service';

@Module({
  imports: [PrismaModule],
  controllers: [DayController],
  providers: [DayService],
})
export class DayModule {}
