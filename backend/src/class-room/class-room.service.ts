import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: dto,
      include: { department: true },
    });
  }

  findAll() {
    return this.prisma.room.findMany({
      include: { department: true },
    });
  }

  findOne(id: number) {
    return this.prisma.room.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  update(id: number, dto: UpdateRoomDto) {
    return this.prisma.room.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
