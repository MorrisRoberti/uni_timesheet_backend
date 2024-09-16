import { HourLogsService } from '../hour-logs/hour-logs.service';
import { SubjectsService } from '../subjects/subjects.service';
import { CarreerController } from './carreer.controller';
import { Module, Logger } from '@nestjs/common';
import { CarreerService } from './carreer.service';

@Module({
  controllers: [CarreerController],
  providers: [HourLogsService, SubjectsService, CarreerService, Logger],
})
export class CarreerModule {}
