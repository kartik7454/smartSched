import { Test, TestingModule } from '@nestjs/testing';
import { FacultySubjectService } from './faculty-subject.service';

describe('FacultySubjectService', () => {
  let service: FacultySubjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacultySubjectService],
    }).compile();

    service = module.get<FacultySubjectService>(FacultySubjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
