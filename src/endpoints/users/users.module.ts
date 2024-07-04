import { Module, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserTable } from 'src/db/models/user.model';
import { AuthService } from 'src/auth/auth.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserConfigTable } from 'src/db/models/user-config.model';
import { EmailService } from 'src/email/email.service';
import { HourLogsService } from '../hour-logs/hour-logs.service';

@Module({
  imports: [SequelizeModule.forFeature([UserTable, UserConfigTable])],
  controllers: [UsersController],
  providers: [UsersService, AuthService, Logger, EmailService, HourLogsService],
})
export class UsersModule {}
