import { Module } from '@nestjs/common';
import { RoomsService } from './class-room.service';
import { RoomsController } from './class-room.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, PrismaService],
})
export class RoomsModule {}
