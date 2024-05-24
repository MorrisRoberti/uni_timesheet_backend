import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HourLogsService } from 'src/endpoints/hour-logs/hour-logs.service';
import { UsersService } from 'src/endpoints/users/users.service';

@Injectable()
export class EmailService {
  private EMAIL_SENDER: string;

  constructor(
    private mailerService: MailerService,
    private logger: Logger,
    private userService: UsersService,
    private hourLogsService: HourLogsService,
  ) {
    this.EMAIL_SENDER = process.env.EMAIL_AUTH_USER;
  }

  @Cron('0 30 16 * * 1')
  async weeklyRecapEmail(): Promise<any> {
    this.logger.log(`Sending Weekly recap email...`);

    // find the users to send emails to
    const users = await this.userService.findUsersForEmailForwarding();

    // extracting usersIds from users
    const usersIds = this.userService.extractUsersIdsFromUsersConfig(users);

    // make a joined query to find all weekly log and hour logs and bla bla bla
    const logs = await this.hourLogsService.findLogsOfUsersForEmail(usersIds);

    // I need a function to combine the user records with the log with id, in this way I have all the info I need in the email
    const email_data = this.hourLogsService.combineUserRecordsWithLogsForEmail(
      users,
      logs,
    );

    // sending emails to all the users
    for (let i = 0; i < email_data.length; i++) {
      const { user, logs } = email_data[i];
      if (user && user !== null && logs && logs !== null) {
        this.logger.log(`Sending weekly email to user ${user.id}`);
        this.mailerService.sendMail({
          to: user.email,
          from: this.EMAIL_SENDER,
          subject: 'Weekly recap',
          template: 'email_template',
          context: {
            week_start: logs.week_start,
            week_end: logs.week_end,
            hours: logs.hours,
            minutes: logs.minutes,
          },
          // text: `this is the recap for the week ${logs.week_start} / ${logs.week_end}. Total hours: ${logs.hours}:${logs.minutes}`,
        });
        this.logger.log(`Sent!`);
      }
    }
  }
}
