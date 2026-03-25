import { Test, TestingModule } from '@nestjs/testing';
import { TimeTableGeneratorController } from './time-table-generator.controller';

describe('TimeTableGeneratorController', () => {
  let controller: TimeTableGeneratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeTableGeneratorController],
    }).compile();

    controller = module.get<TimeTableGeneratorController>(
      TimeTableGeneratorController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
