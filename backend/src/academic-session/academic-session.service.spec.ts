import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionService } from './academic-session.service';

describe('AcademicSessionService', () => {
  let service: AcademicSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcademicSessionService],
    }).compile();

    service = module.get<AcademicSessionService>(AcademicSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
