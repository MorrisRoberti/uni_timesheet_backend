import { Module, Logger } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { HourLogsService } from '../hour-logs/hour-logs.service';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService, Logger, HourLogsService],
})
export class SubjectsModule {}
