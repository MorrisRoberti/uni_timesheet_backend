import { Logger, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { UsersService } from 'src/endpoints/users/users.service';
import { HourLogsService } from 'src/endpoints/hour-logs/hour-logs.service';

@Module({
  imports: [],
  exports: [],
  providers: [EmailService, Logger, UsersService, HourLogsService],
})
export class EmailModule {}
