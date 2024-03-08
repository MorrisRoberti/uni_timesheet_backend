import { Injectable, Logger } from '@nestjs/common';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Op } from 'sequelize';
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

    let new_hours = updatedWeeklyLog.hours;
    let new_minutes = updatedWeeklyLog.minutes;

    // check if the sum of the minutes is >=60, if so add one hour and sum the rest of the minutes
    if (new_minutes + minutes < 60) {
      new_minutes += minutes;
    } else {
      // this is not strictly necessary because the minute column should always be <=59, I do this just to be sure that data is consistent
      const carry_hours = parseInt(((new_minutes + minutes) / 60).toFixed(0));
      new_minutes += minutes - 60 * carry_hours;
      new_hours += carry_hours;
    }

    new_hours += hours;

    if (new_hours > 168 || (new_hours == 168 && new_minutes != 0)) {
      // it goes over the max week hours
      throw new UpdateFailedException(
        this.WEEKLY_LOG,
        'addHoursToWeeklyLog(weeklyLog, hours, minutes)',
        [`${weeklyLog}`, `${hours}`, `${minutes}`],
        'It is not possible to log more than 168 per week',
      );
    }

    // standard case
    updatedWeeklyLog.hours = new_hours;
    updatedWeeklyLog.minutes = new_minutes;
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

  convertHourLogToDto(hourLog: any) {
    this.logger.log(`Converting ${this.HOUR_LOG} from db to dto`);
    const hourLogDto = {
      id: hourLog.id,
      user_subject_id: hourLog.user_subject_id,
      hours: hourLog.hours,
      minutes: hourLog.minutes,
      date: hourLog.date,
      weekly_log_id: hourLog.weekly_log_id,
      description: hourLog.description,
    };
    this.logger.log('Done!');
    return hourLogDto;
  }

  convertHourLogsArrayToDto(hourLogs: any) {
    this.logger.log(`Converting ${this.HOUR_LOG} array from db to dto`);
    const convertedHourLogsArray = [];
    for (let i = 0; i < hourLogs.length; i++) {
      this.logger.log(`Converting object n ${i}...`);
      const hourLogDb = hourLogs[i];
      const hourLogDto = this.convertHourLogToDto(hourLogDb);
      this.logger.log('Ok');
      convertedHourLogsArray.push(hourLogDto);
    }
    this.logger.log('Done!');
    return convertedHourLogsArray;
  }

  convertWeeklyLogToDto(weeklyLog: any, hourLogs: any): any {
    this.logger.log(`Converting ${this.WEEKLY_LOG} from db to dto`);
    const convertedWeeklyLog = {
      id: weeklyLog.id,
      week_start: weeklyLog.week_start,
      week_end: weeklyLog.week_end,
      hours: weeklyLog.hours,
      minutes: weeklyLog.minutes,
      hourLogs: hourLogs,
    };
    this.logger.log('Done!');
    return convertedWeeklyLog;
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

  async findWeeklyLogFromWeek(
    user_id: number,
    week_start: string,
    week_end: string,
  ): Promise<WeeklyLogTable> {
    this.logger.log(`GET ${this.WEEKLY_LOG} of user from week number`);
    const weeklyLog = await WeeklyLogTable.findOne({
      where: { user_id, week_start, week_end },
    });

    if (weeklyLog && weeklyLog !== null) {
      this.logger.log('Done!');
      return weeklyLog.dataValues;
    }

    throw new NotFoundException(
      this.WEEKLY_LOG,
      'findweeklyLogFromWeek(user_id, week_start, week_end)',
      [`${user_id}`, week_start, week_end],
    );
  }

  async findHourLogsFromDate(
    user_id: number,
    date: string,
  ): Promise<Array<HourLogTable>> {
    this.logger.log(`GET all ${this.HOUR_LOG} of user from day`);
    const hourLogs = await HourLogTable.findAll({ where: { user_id, date } });

    if (hourLogs && hourLogs !== null) {
      this.logger.log('Done!');
      return hourLogs;
    }
    throw new NotFoundException(
      this.HOUR_LOG,
      'findHourLogsFromDate(user_id, date)',
      [`${user_id}`, `${date}`],
    );
  }
  async findHourLogFromId(user_id: number, id: number): Promise<HourLogTable> {
    this.logger.log(`GET all ${this.HOUR_LOG} of user from id`);
    const hourLog = await HourLogTable.findOne({ where: { user_id, id } });

    if (hourLog && hourLog !== null) {
      this.logger.log('Done!');
      return hourLog;
    }
    throw new NotFoundException(
      this.HOUR_LOG,
      'findHourLogFromId(user_id, id)',
      [`${user_id}`, `${id}`],
    );
  }

  async findHourLogsFromWeeklyLogId(
    user_id: number,
    weekly_log_id: number,
  ): Promise<Array<HourLogTable>> {
    this.logger.log(`GET all ${this.HOUR_LOG} from weekly log id`);
    const hourLogs = await HourLogTable.findAll({
      where: { user_id, weekly_log_id },
    });

    if (hourLogs && hourLogs !== null) {
      this.logger.log('Done!');
      return hourLogs;
    }

    throw new NotFoundException(
      this.HOUR_LOG,
      'findHourLogsFromWeeklyLogId(user_id, weekly_log_id)',
      [`${user_id}`, `${weekly_log_id}`],
    );
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
    const createdHourLog = await HourLogTable.create(hourLog, { transaction });

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
