import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionController } from './academic-session.controller';

describe('AcademicSessionController', () => {
  let controller: AcademicSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicSessionController],
    }).compile();

    controller = module.get<AcademicSessionController>(
      AcademicSessionController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
