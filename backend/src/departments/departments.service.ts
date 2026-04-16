import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

export type DepartmentInfo = {
  id: number;
  name: string;
  facultyCount: number;
  studentCount: number;
  sections: number;
};

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  findAll() {
    return this.prisma.department.findMany({});
  }

  findOne(id: number) {
    return this.prisma.department.findUnique({ where: { id } });
  }

  update(id: number, dto: CreateDepartmentDto) {
    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: number) {
    return this.prisma.department.delete({ where: { id } });
  }

  /** Aggregated counts for dashboards (e.g. HOD). */
  async getDepartmentInfo(departmentId: number): Promise<DepartmentInfo | null> {
    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        name: true,
        _count: { select: { faculty: true } },
      },
    });
    if (!dept) return null;

    const [studentCount, sectionCount] = await Promise.all([
      this.prisma.student.count({
        where: { section: { course: { departmentId } } },
      }),
      this.prisma.section.count({
        where: { course: { departmentId } },
      }),
    ]);

    return {
      id: dept.id,
      name: dept.name,
      facultyCount: dept._count.faculty,
      studentCount,
      sections: sectionCount,
    };
  }

  /**
   * Resolves department from user: direct departmentId (HOD/admin), faculty record, or student's section course.
   */
  async resolveDepartmentIdForUser(userId: number): Promise<number | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        faculty: { select: { departmentId: true } },
        student: { select: { sectionId: true } },
      },
    });
    if (!user) return null;

    if (user.departmentId != null) return user.departmentId;
    if (user.faculty) return user.faculty.departmentId;

    if (user.student) {
      const section = await this.prisma.section.findUnique({
        where: { id: user.student.sectionId },
        select: { course: { select: { departmentId: true } } },
      });
      return section?.course.departmentId ?? null;
    }

    return null;
  }
}
