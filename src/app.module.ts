import { UsersModule } from './endpoints/users/users.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserTable } from './db/models/user.model';
import { UserSubjectTable } from './db/models/user-subject.model';
import { UserConfigTable } from './db/models/user-config.model';
import { SubjectTable } from './db/models/subject.model';
import { HourLogTable } from './db/models/hour-log.model';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { WeeklyLogTable } from './db/models/weekly-log.model';
import { SubjectsModule } from './endpoints/subjects/subjects.module';
import { HourLogsModule } from './endpoints/hour-logs/hour-logs.module';
import { AuthModule } from './auth/auth.module';
import { MinutesOverflowConstraint } from './validation/minutes-overflow.validator';
import { EmailModule } from './email/email.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ScheduleModule } from '@nestjs/schedule';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { FileHandlerModule } from './file_handler/file.handler.module';
import { UserCarreerTable } from './db/models/user-carreer.model';
import { UserExamsTable } from './db/models/user-exams.model';
import { CarreerModule } from './endpoints/carreer/carreer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),
    ScheduleModule.forRoot(),
    WinstonModule,
    SequelizeModule.forRoot({
      dialect: 'mysql',
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
      host: process.env.DB_HOST,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadModels: true,
      synchronize: true,
      models: [
        UserTable,
        UserSubjectTable,
        UserConfigTable,
        SubjectTable,
        HourLogTable,
        WeeklyLogTable,
        UserCarreerTable,
        UserExamsTable,
      ],
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_AUTH_USER,
          pass: process.env.EMAIL_AUTH_PASSWORD,
        },
      },
      defaults: {
        from: '"uni_timesheet" <uni@timesheet.com>',
      },
      template: {
        dir: join(__dirname.substring(0, __dirname.length - 5), 'src/email'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    // FileHandlerModule,
    UsersModule,
    SubjectsModule,
    HourLogsModule,
    AuthModule,
    EmailModule,
    CarreerModule,
  ],
  controllers: [AppController],
  providers: [AppService, MinutesOverflowConstraint],
})
export class AppModule {}
