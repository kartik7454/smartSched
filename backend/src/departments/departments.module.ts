import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentController } from './department.controller';

@Module({
  providers: [DepartmentsService],
  controllers: [DepartmentsController, DepartmentController],
})
export class DepartmentsModule {}
