import { Injectable, Logger } from '@nestjs/common';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Op, where } from 'sequelize';
import { HourLogTable } from 'src/db/models/hour-log.model';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { format, startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class HourLogsService {
  constructor(private logger: Logger) {}

  WEEKLY_LOG = 'WeeklyLog';
  HOUR_LOG = 'HourLog';

  addHoursToWeeklyLog(
    weeklyLog: WeeklyLogTable,
    hours: number,
    minutes: number,
  ) {
    this.logger.log(`Adding hours to ${this.WEEKLY_LOG}`);
    // does a deep copy of the previous object
    const updatedWeeklyLog = JSON.parse(JSON.stringify(weeklyLog));
    // check if the sum of the minutes is >=60, if so add one hour and sum the rest of the minutes
    if (updatedWeeklyLog.minutes + minutes < 60) {
      updatedWeeklyLog.minutes += minutes;
    } else {
      // this is not strictly necessary because the minute column should always be <=59, I do this just to be sure that data is consistent
      const carry_hours = parseInt(
        ((updatedWeeklyLog.minutes + minutes) / 60).toFixed(0),
      );
      updatedWeeklyLog.minutes += minutes - 60 * carry_hours;
      updatedWeeklyLog.hours += carry_hours;
    }
    updatedWeeklyLog.hours += hours;
    this.logger.log('Done!');
    return updatedWeeklyLog;
  }

  convertNewWeeklyLog(user_id: number, createdHourLogDto: CreateHourLogDto) {
    this.logger.log(`Converting NEW ${this.WEEKLY_LOG}`);

    const week_start = format(
      startOfWeek(createdHourLogDto.date, { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );
    const week_end = format(
      endOfWeek(createdHourLogDto.date, { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );

    const convertedWeeklyLog = {
      id: null,
      user_id,
      week_start,
      week_end,
      hours: createdHourLogDto.hours,
      minutes: createdHourLogDto.minutes,
    };
    this.logger.log('Done!');
    return convertedWeeklyLog;
  }

  convertNewHourLog(
    user_id: number,
    weekly_log_id: number,
    createdHourLogDto: CreateHourLogDto,
  ) {
    this.logger.log(`Converting NEW ${this.HOUR_LOG}`);
    const convertedHourLog = {
      id: null,
      user_id,
      weekly_log_id,
      user_subject_id: createdHourLogDto.user_subject_id,
      hours: createdHourLogDto.hours,
      minutes: createdHourLogDto.minutes,
      date: createdHourLogDto.date,
      description: createdHourLogDto.description,
    };
    this.logger.log('Done!');
    return convertedHourLog;
  }

  // db functions
  async isWeeklyLogPresent(user_id: number, date: string): Promise<boolean> {
    this.logger.log(`Check if ${this.WEEKLY_LOG} is present`);
    const isPresent = await WeeklyLogTable.findOne({
      where: {
        [Op.and]: {
          user_id,
          week_start: { [Op.lte]: date },
          week_end: { [Op.gte]: date },
        },
      },
    });

    if (isPresent && isPresent !== null) {
      this.logger.log('Done!');
      return true;
    }

    this.logger.log('Not Found!');
    return false;
  }

  async findWeeklyLog(user_id: number, date: string): Promise<WeeklyLogTable> {
    this.logger.log(`GET ${this.WEEKLY_LOG} of user from date`);
    const weeklyLog = await WeeklyLogTable.findOne({
      where: {
        [Op.and]: {
          user_id,
          week_start: { [Op.lte]: date },
          week_end: { [Op.gte]: date },
        },
      },
    });

    if (weeklyLog && weeklyLog !== null) {
      this.logger.log('Done!');
      return weeklyLog.dataValues;
    }

    throw new NotFoundException(
      this.WEEKLY_LOG,
      'findWeeklyLog(user_id, date)',
      [`${user_id}`, date],
    );
  }

  async updateWeeklyLog(weeklyLog: any, transaction: any) {
    this.logger.log(`UPDATE ${this.WEEKLY_LOG}`);
    const updatedWeeklyLog = await WeeklyLogTable.update(weeklyLog, {
      where: { id: weeklyLog.id },
      transaction,
    });

    if (updatedWeeklyLog && updatedWeeklyLog !== null) {
      this.logger.log('Done!');
      return updatedWeeklyLog;
    }

    throw new UpdateFailedException(
      this.WEEKLY_LOG,
      'updateWeeklyLog(weeklyLog)',
      [weeklyLog],
    );
  }

  async createWeeklyLog(
    weeklyLog: any,
    transaction: any,
  ): Promise<WeeklyLogTable> {
    this.logger.log(`CREATE ${this.WEEKLY_LOG}`);
    const createdWeeklyLog = await WeeklyLogTable.create(
      weeklyLog,
      transaction,
    );

    if (createdWeeklyLog && createdWeeklyLog !== null) {
      this.logger.log('Done!');
      return createdWeeklyLog;
    }

    throw new InsertionFailedException(
      this.WEEKLY_LOG,
      'createWeeklyLog(weeklyLog)',
      [weeklyLog],
    );
  }

  async createHourLog(hourLog: any, transaction: any): Promise<HourLogTable> {
    this.logger.log(`CREATE ${this.HOUR_LOG}`);
    const createdHourLog = await HourLogTable.create(hourLog, transaction);

    if (createdHourLog && createdHourLog !== null) {
      this.logger.log('Done!');
      return createdHourLog;
    }

    throw new InsertionFailedException(
      this.HOUR_LOG,
      'createHourLog(hourLog)',
      [hourLog],
    );
  }
}
