import { Logger, Module } from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { HourLogsController } from './hour-logs.controller';

@Module({
  controllers: [HourLogsController],
  providers: [HourLogsService, Logger],
})
export class HourLogsModule {}
