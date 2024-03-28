import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(public mailerService: MailerService) {}

  weeklyRecapEmail() {
    this.mailerService.sendMail({
      to: 'morrisroberti349@gmail.com',
      from: 'application.mail.sender12@gmail.com',
      subject: 'Weekly recap',
      text: 'this is the recap for the week',
    });
  }
}
