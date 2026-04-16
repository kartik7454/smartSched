import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DepartmentsService } from './departments.service';
import type { Request } from 'express';

type JwtUser = { userId: number; email: string; role: number };

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * GET /department/info
   * JWT required. Returns aggregated stats for the caller's department.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('info')
  async getInfo(@Req() req: Request & { user: JwtUser }) {
    const user = req.user;
    if (!user?.userId) {
      throw new UnauthorizedException();
    }

    const departmentId = await this.departmentsService.resolveDepartmentIdForUser(
      user.userId,
    );
    if (departmentId == null) {
      throw new BadRequestException('User is not assigned to a department');
    }

    const info = await this.departmentsService.getDepartmentInfo(departmentId);
    if (!info) {
      throw new NotFoundException('Department not found');
    }

    return info;
  }
}
