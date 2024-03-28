import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HourLogsService } from 'src/endpoints/hour-logs/hour-logs.service';
import { UsersService } from 'src/endpoints/users/users.service';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private logger: Logger,
    private userService: UsersService,
    private hourLogsService: HourLogsService,
  ) {}

  @Cron('0 30 16 * * 1')
  async weeklyRecapEmail(): Promise<any> {
    this.logger.log(`Sending Weekly recap email...`);

    // find the users to send emails to
    const users = await this.userService.findUsersForEmailForwarding();

    // make a joined query to find all weekly log and hour logs and bla bla bla

    this.mailerService.sendMail({
      to: 'morrisroberti349@gmail.com',
      from: 'application.mail.sender12@gmail.com',
      subject: 'Weekly recap',
      text: 'this is the recap for the week',
    });
  }
}
