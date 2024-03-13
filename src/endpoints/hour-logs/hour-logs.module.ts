import { Logger, Module } from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { HourLogsController } from './hour-logs.controller';
import { SubjectsService } from '../subjects/subjects.service';

@Module({
  controllers: [HourLogsController],
  providers: [HourLogsService, SubjectsService, Logger],
})
export class HourLogsModule {}
