import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  imports: [],
  exports: [],
  providers: [EmailService],
})
export class EmailModule {}
