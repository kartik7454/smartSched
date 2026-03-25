import { Test, TestingModule } from '@nestjs/testing';
import { CourseSubjectController } from './course-subject.controller';

describe('CourseSubjectController', () => {
  let controller: CourseSubjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseSubjectController],
    }).compile();

    controller = module.get<CourseSubjectController>(CourseSubjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
