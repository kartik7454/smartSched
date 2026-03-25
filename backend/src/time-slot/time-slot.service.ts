import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTimeSlotDto } from './dto/create-time-slot.dto';
import { UpdateTimeSlotDto } from './dto/update-time-slot.dto';

@Injectable()
export class TimeSlotService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE TIME SLOT
  async create(dto: CreateTimeSlotDto) {
    const { startTime, endTime, slotNumber } = dto;

    // Validate time order
    if (startTime >= endTime) {
      throw new BadRequestException('End time must be greater than start time');
    }

    // Ensure unique slot number
    const existingSlotNumber = await this.prisma.timeSlot.findFirst({
      where: { slotNumber },
    });

    if (existingSlotNumber) {
      throw new BadRequestException('Slot number already exists');
    }

    // Check overlapping slots
    const overlappingSlot = await this.prisma.timeSlot.findFirst({
      where: {
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingSlot) {
      throw new BadRequestException('Time slot overlaps with an existing slot');
    }

    return this.prisma.timeSlot.create({
      data: { startTime, endTime, slotNumber },
    });
  }

  // GET ALL TIME SLOTS
  async findAll() {
    return this.prisma.timeSlot.findMany({
      orderBy: { slotNumber: 'asc' },
    });
  }

  // GET SINGLE TIME SLOT
  async findOne(id: number) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    return slot;
  }

  // UPDATE TIME SLOT
  async update(id: number, dto: UpdateTimeSlotDto) {
    await this.findOne(id);

    const updatedStart = dto.startTime;
    const updatedEnd = dto.endTime;

    if (updatedStart && updatedEnd && updatedStart >= updatedEnd) {
      throw new BadRequestException('End time must be greater than start time');
    }

    return this.prisma.timeSlot.update({
      where: { id },
      data: {
        ...(dto.startTime && { startTime: dto.startTime }),
        ...(dto.endTime && { endTime: dto.endTime }),
        ...(dto.slotNumber && { slotNumber: dto.slotNumber }),
      },
    });
  }

  // DELETE TIME SLOT
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.timeSlot.delete({
      where: { id },
    });
  }
}
