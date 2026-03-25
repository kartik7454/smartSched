import { Test, TestingModule } from '@nestjs/testing';
import { TimeTableGeneratorService } from './time-table-generator.service';

describe('TimeTableGeneratorService', () => {
  let service: TimeTableGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeTableGeneratorService],
    }).compile();

    service = module.get<TimeTableGeneratorService>(TimeTableGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
