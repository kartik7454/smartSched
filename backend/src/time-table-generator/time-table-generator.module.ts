import { Module } from '@nestjs/common';
import { TimeTableGeneratorService } from './time-table-generator.service';
import { TimeTableGeneratorController } from './time-table-generator.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [TimeTableGeneratorService, PrismaService],
  controllers: [TimeTableGeneratorController],
})
export class TimeTableGeneratorModule {}
