import { Test, TestingModule } from '@nestjs/testing';
import { FacultySubjectController } from './faculty-subject.controller';

describe('FacultySubjectController', () => {
  let controller: FacultySubjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacultySubjectController],
    }).compile();

    controller = module.get<FacultySubjectController>(FacultySubjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
