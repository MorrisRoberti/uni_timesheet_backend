import { Injectable, Logger } from '@nestjs/common';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Op } from 'sequelize';
import { HourLogTable } from 'src/db/models/hour-log.model';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import {
  format,
  startOfWeek,
  endOfWeek,
  formatters,
  subWeeks,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { DeletionFailedException } from 'src/error_handling/models/deletion-failed.exception.model';
import { UserTable } from 'src/db/models/user.model';
import { UserSubjectTable } from 'src/db/models/user-subject.model';
import sequelize from 'sequelize';

@Injectable()
export class HourLogsService {
  constructor(private logger: Logger) {}

  WEEKLY_LOG = 'WeeklyLog';
  HOUR_LOG = 'HourLog';

  getPreviousWeekBounds(
    week_start: string,
    week_end: string,
  ): { previousWeekStart: string; previousWeekEnd: string } {
    const previousWeekStart = format(
      startOfWeek(subWeeks(week_start, 1), { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );
    const previousWeekEnd = format(
      endOfWeek(subWeeks(week_end, 1), { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );

    return { previousWeekStart, previousWeekEnd };
  }

  composeCurrentLastWeekPayload(
    weeklyLogPrevious: any,
    weeklyLogCurrent: any,
  ): { total_previous: string; total_current: string; greater: number } {
    let greater = 0; // if -1 then prev > current if 0 then prev == current if 1 current > prev

    let [newHours, newMinutes] = this.formatTimeValues(
      weeklyLogCurrent.hours,
      weeklyLogCurrent.minutes,
    );
    const total_current = `${newHours}:${newMinutes}`;

    const tmpCurrentHours = newHours;
    const tmpCurrentMinutes = newMinutes;

    [newHours, newMinutes] = this.formatTimeValues(
      weeklyLogPrevious.hours,
      weeklyLogPrevious.minutes,
    );
    const total_previous = `${newHours}:${newMinutes}`;

    if (tmpCurrentHours > newHours) {
      greater = 1;
    } else if (tmpCurrentHours == newHours) {
      if (tmpCurrentMinutes > newMinutes) greater = 1;
      else if (tmpCurrentMinutes < newMinutes) greater = -1;
    } else greater = -1;

    return { total_previous, total_current, greater };
  }

  // combines the logs record with the users to have all the info in one place
  combineUserRecordsWithLogsForEmail(
    users: Array<UserTable>,
    logs: Array<any>,
  ): Array<any> {
    this.logger.log(`Constructing the object to use in the email service`);
    const returnRecords = [];
    for (let i = 0; i < users.length; i++) {
      const logsToAppend = logs.find((value) => {
        if (value.user_id === users[i].id) return value;
      });
      returnRecords.push({ user: users[i], logs: logsToAppend });
    }
    this.logger.log('Done!');
    return returnRecords;
  }

  sumTotalHoursOfHourLogsArray(hourLogArray: any): {
    total_hours: number;
    total_minutes: number;
  } {
    this.logger.log(`Adding total hours to array of ${this.HOUR_LOG}`);
    let total_hours = 0;
    let total_minutes = 0;
    for (let i = 0; i < hourLogArray.length; i++) {
      const hourLog = hourLogArray[i];
      total_hours += hourLog.hours;
      total_minutes += hourLog.minutes;
    }

    if (total_minutes >= 60) {
      const carry_hours = parseInt((total_minutes / 60).toFixed(0));
      total_minutes -= 60 * carry_hours;
      total_hours += carry_hours;
    }

    return { total_hours, total_minutes };
  }

  subtractHoursToWeeklyLog(
    weeklyLog: WeeklyLogTable,
    hours: number,
    minutes: number,
  ): WeeklyLogTable {
    // Precondition: the hours to subtract cannot be more than the hours present
    // so the weeklyLog hours/minutes fields are >= of hours/minutes to subtract

    this.logger.log(`Subtracting hours to ${this.WEEKLY_LOG}`);
    // does a deep copy of the previous object
    const updatedWeeklyLog = JSON.parse(JSON.stringify(weeklyLog));

    let new_hours = updatedWeeklyLog.hours;
    let new_minutes = updatedWeeklyLog.minutes;

    if (minutes > new_minutes) {
      // ex: (old)10 - (new)40 = -30 and the hours goes down by at most 1
      new_hours -= 1;
      new_minutes -= Math.abs(minutes - new_minutes);
    } else {
      // subtract the minutes
      new_minutes -= minutes;
    }

    // subtract the hours
    new_hours -= hours;

    updatedWeeklyLog.hours = new_hours;
    updatedWeeklyLog.minutes = new_minutes;
    this.logger.log('Done!');
    return updatedWeeklyLog;
  }
  addHoursToWeeklyLog(
    weeklyLog: WeeklyLogTable,
    hours: number,
    minutes: number,
  ): WeeklyLogTable {
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

  convertUpdatedHourLog(
    oldHourLog: HourLogTable,
    updatedHourLogDto: UpdateHourLogDto,
  ) {
    this.logger.log(`Converting NEW ${this.HOUR_LOG}`);
    if (updatedHourLogDto.hours <= 0 && updatedHourLogDto.minutes <= 0)
      throw new UpdateFailedException(
        this.HOUR_LOG,
        'convertUpdatedHourlog(oldHourLog, updateHourLogDto)',
        [`${oldHourLog}`, `${updatedHourLogDto}`],
      );
    const convertedHourLog = JSON.parse(JSON.stringify(oldHourLog));
    convertedHourLog.hours = updatedHourLogDto.hours;
    convertedHourLog.minutes = updatedHourLogDto.minutes;
    convertedHourLog.description = updatedHourLogDto.description;
    this.logger.log('Done!');
    return convertedHourLog;
  }
  convertHourLogToDto(hourLog: any) {
    this.logger.log(`Converting ${this.HOUR_LOG} from db to dto`);
    const hourLogDto = {
      id: hourLog.id,
      user_subject_id: hourLog.user_subject_id,
      subject: hourLog['user_subject_table'].name,
      hours: hourLog.hours,
      minutes: hourLog.minutes,
      date: hourLog.date,
      weekly_log_id: hourLog.weekly_log_id,
      description: hourLog.description,
    };
    this.logger.log('Done!');
    return hourLogDto;
  }

  convertHourLogsArrayToDto(hourLogs: any): any {
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

  formatTimeValues(hours: number, minutes: number) {
    // carries the minutes in hours

    if (minutes >= 60) {
      const carry_hours = Math.floor(minutes / 60);
      minutes -= 60 * carry_hours;
      hours += carry_hours;
    }

    let newHours = hours.toString();
    let newMinutes = minutes.toString();

    if (hours < 10) {
      newHours = '0' + newHours;
    }

    if (minutes < 10) {
      newMinutes = '0' + newMinutes;
    }
    return [newHours, newMinutes];
  }

  convertWeeklyAggregatedForSubjectToDto(logs: Array<any>): any {
    this.logger.log(`Converting ${this.WEEKLY_LOG} for subject from db to dto`);
    let logsToReturn = [];
    let totalHours = 0;
    let totalMinutes = 0;
    for (let i = 0; i < logs.length; i++) {
      const currentLog = logs[i];

      currentLog.hours = parseInt(currentLog.hours);
      currentLog.minutes = parseInt(currentLog.minutes);

      [currentLog.hours, currentLog.minutes] = this.formatTimeValues(
        currentLog.hours,
        currentLog.minutes,
      );

      totalHours += parseInt(currentLog.hours);
      totalMinutes += parseInt(currentLog.minutes);

      const convertedLog = {
        user_subject_id: currentLog.user_subject_id,
        subject_name: currentLog['user_subject_table.name'],
        time: `${currentLog.hours}:${currentLog.minutes}`,
      };

      logsToReturn.push(convertedLog);
    }

    // sorts the logs for hours and minutes in descending order
    logsToReturn = logsToReturn.sort((a, b) => {
      if (a.hours > b.hours) {
        return -1;
      } else if (b.hours > a.hours) {
        return 1;
      } else {
        if (a.minutes >= b.minutes) {
          return -1;
        } else {
          return 1;
        }
      }
    });

    const [totalHoursToReturn, totalMinutesToReturn] = this.formatTimeValues(
      totalHours,
      totalMinutes,
    );

    this.logger.log('Done!');
    return {
      total_time: `${totalHoursToReturn}:${totalMinutesToReturn}`,
      logs: logsToReturn,
    };
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

  aggregateHoursByWeekOfMonth(monthLogs: Array<any>) {
    this.logger.log(`Aggregating ${this.HOUR_LOG} of the month for week`);
    const logsAggregatedForWeek = [];
    const idsOfWeeks = [];
    for (let i = 0; i < monthLogs.length; i++) {
      if (!idsOfWeeks.includes(monthLogs[i].weekly_log_id)) {
        idsOfWeeks.push(monthLogs[i].weekly_log_id);
      }
    }

    for (let i = 0; i < idsOfWeeks.length; i++) {
      const weekLogs = monthLogs.filter((log) => {
        if (log.weekly_log_id == idsOfWeeks[i]) {
          return log;
        }
      });
      logsAggregatedForWeek.push(weekLogs);
    }
    this.logger.log('Done!');
    return logsAggregatedForWeek;
  }

  aggregateWeeklyHoursBySubject(aggregatedWeeklyLog: Array<any>) {
    this.logger.log(`Aggragating ${this.WEEKLY_LOG} of the month for subject`);
    const logsAggregatedForSubject = [];
    const subjects = [];

    for (let i = 0; i < aggregatedWeeklyLog.length; i++) {
      for (let j = 0; j < aggregatedWeeklyLog[i].length; j++) {
        if (!subjects.includes(aggregatedWeeklyLog[i][j].user_subject_id)) {
          subjects.push(aggregatedWeeklyLog[i][j].user_subject_id);
        }
      }
    }

    for (let j = 0; j < aggregatedWeeklyLog.length; j++) {
      let weekLog = { name: `week ${j + 1}` };
      for (let i = 0; i < subjects.length; i++) {
        // in logs I put all the logs of the week with the same subject
        const logs = aggregatedWeeklyLog[j].filter((log) => {
          if (log.user_subject_id == subjects[i]) {
            return log;
          }
        });

        // i make the sum of the hour logs
        if (logs && logs.length > 0) {
          // sum the hours of all the logs of that subject for that week
          let { total_hours, total_minutes } =
            this.sumTotalHoursOfHourLogsArray(logs);

          // I give a ~30% margin to consider another hour
          if (total_minutes >= 45) total_hours++;

          const field = { [logs[0]['user_subject_table.name']]: total_hours };

          Object.assign(weekLog, field);
        }
      }

      logsAggregatedForSubject.push(weekLog);
    }

    this.logger.log('Done!');
    return logsAggregatedForSubject;
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
      paranoid: true,
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
    const hourLogs = await HourLogTable.findAll({
      where: { user_id, date },
      include: [{ model: UserSubjectTable, attributes: ['name'] }],
    });

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

  async findWeeklyLogFromDate(
    user_id: number,
    date: string,
  ): Promise<WeeklyLogTable> {
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
      'findWeeklyLogFromDate(user_id, date)',
      [`${user_id}`, date],
    );
  }
  async findWeeklyLogFromId(
    user_id: number,
    id: number,
  ): Promise<WeeklyLogTable> {
    this.logger.log(`GET ${this.WEEKLY_LOG} of user from id`);
    const weeklyLog = await WeeklyLogTable.findOne({
      where: {
        user_id,
        id,
      },
    });

    if (weeklyLog && weeklyLog !== null) {
      this.logger.log('Done!');
      return weeklyLog.dataValues;
    }

    throw new NotFoundException(
      this.WEEKLY_LOG,
      'findWeeklyLogFromId(user_id, id)',
      [`${user_id}`, `${id}`],
    );
  }

  async findHourLogsOfWeekForSubject(
    user_id: number,
    weekly_log_id: number,
    user_subject_id: number,
  ): Promise<Array<HourLogTable>> {
    this.logger.log(`GET ${this.HOUR_LOG} of user from weekly_log and subject`);
    const hourLogs = await HourLogTable.findAll({
      where: {
        user_id,
        weekly_log_id,
        user_subject_id,
      },
    });

    if (hourLogs && hourLogs !== null) {
      this.logger.log('Done!');
      return hourLogs;
    }

    throw new NotFoundException(
      this.WEEKLY_LOG,
      'findHourLogsOfWeekForSubject(user_id, weekly_log_id, user_subject_id)',
      [`${user_id}`, `${weekly_log_id}`, `${user_subject_id}`],
    );
  }

  async findHourLogsForUserSubject(user_subject_id: number) {
    this.logger.log(`GET all ${this.HOUR_LOG} of specified user_subject_id`);
    const hourLogs = await HourLogTable.findAndCountAll({
      where: { user_subject_id },
    });

    if (hourLogs && hourLogs !== null) {
      this.logger.log('Done!');
      return hourLogs;
    }

    throw new NotFoundException(
      this.HOUR_LOG,
      'findHourLogsForUserSubject(user_subject_id)',
      [`${user_subject_id}`],
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

  async updateHourLog(hourLog: any, transaction: any) {
    this.logger.log(`UPDATE ${this.HOUR_LOG}`);
    const updatedHourLog = await HourLogTable.update(hourLog, {
      where: { id: hourLog.id },
      transaction,
    });

    if (updatedHourLog && updatedHourLog !== null) {
      this.logger.log('Done!');
      return updatedHourLog;
    }

    throw new UpdateFailedException(this.HOUR_LOG, 'updateHourLog(hourLog)', [
      hourLog,
    ]);
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

  async deleteHourLogFromId(id: number, transaction: any) {
    this.logger.log(`DELETE ${this.HOUR_LOG}`);
    const deletedHourLog = await HourLogTable.destroy({
      where: { id },
      transaction,
    });

    if (deletedHourLog !== 1) {
      throw new DeletionFailedException(this.HOUR_LOG, 'deleteHourLog(id)', [
        `${id}`,
      ]);
    }
  }
  async deleteWeeklyLogFromId(id: number, transaction: any) {
    this.logger.log(`DELETE ${this.WEEKLY_LOG}`);
    const deletedWeeklyLog = await WeeklyLogTable.destroy({
      where: { id },
      transaction,
    });

    if (deletedWeeklyLog !== 1) {
      throw new DeletionFailedException(
        this.WEEKLY_LOG,
        'deleteWeeklyLog(id)',
        [`${id}`],
      );
    }
  }

  // FIXMEEEE
  async findLogsOfUsersForEmail(userIds: Array<number>): Promise<any> {
    this.logger.log(
      `GET ${this.WEEKLY_LOG} and ${this.HOUR_LOG} of users for email`,
    );

    const date = new Date();

    const week_start = format(
      startOfWeek(date, { weekStartsOn: 1 }),
      'yyyy-MM-dd',
    );
    const week_end = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const logs = await WeeklyLogTable.findAll({
      where: {
        [Op.and]: {
          week_start: '2024-02-26',
          week_end: '2024-03-03',
          user_id: userIds,
        },
      },
      include: [{ model: HourLogTable }],
    });

    if (logs && logs !== null) {
      this.logger.log('Done!');
      return logs;
    }

    throw new NotFoundException(
      `${this.WEEKLY_LOG}/${this.HOUR_LOG}`,
      'findLogsOfUsersForEmail(userIds)',
      [],
    );
  }

  async findHoursForTheWeekForSubject(
    user_id: number,
    week_start: string,
    week_end: string,
  ) {
    this.logger.log(
      `GET ${this.HOUR_LOG} aggregated for user_subject for user ${user_id} for the week that start at ${week_start} and ends at ${week_end}`,
    );

    const logs = await HourLogTable.findAll({
      attributes: [
        'user_subject_id',
        [sequelize.fn('sum', sequelize.col('hours')), 'hours'],
        [sequelize.fn('sum', sequelize.col('minutes')), 'minutes'],
      ],
      paranoid: true,
      where: {
        [Op.and]: {
          date: { [Op.between]: [week_start, week_end] },
          user_id,
        },
      },
      include: [
        { model: UserSubjectTable, attributes: ['name'], where: { active: 1 } },
      ],
      group: ['user_subject_id'],
      order: [
        ['hours', 'DESC'],
        ['minutes', 'DESC'],
      ],
      raw: true,
    });

    if (logs && logs !== null) {
      this.logger.log('Done!');
      return logs;
    }
    throw new NotFoundException(
      `${this.HOUR_LOG}`,
      'findHoursForTheWeekForSubject(user_id, week_start, week_end)',
      [`${user_id}`, week_start, week_end],
    );
  }

  async findMonthlyLogsForActiveSubject(user_id: number, month: number) {
    this.logger.log(
      `GET ${this.HOUR_LOG} aggregated for user_subject for user ${user_id} for the month ${month} for active user subjects`,
    );

    const currentYear = new Date().getFullYear();
    const firstOfMonth = startOfMonth(new Date(currentYear, month, 1));
    const lastOfMonth = endOfMonth(new Date(currentYear, month, 1));

    const logs = await HourLogTable.findAll({
      attributes: ['user_subject_id', 'weekly_log_id', 'hours', 'minutes'],
      where: {
        [Op.and]: {
          date: { [Op.between]: [firstOfMonth, lastOfMonth] },
          user_id,
        },
      },
      include: [
        { model: UserSubjectTable, attributes: ['name'], where: { active: 1 } },
      ],
      order: [['date', 'ASC']],
      raw: true,
    });

    if (logs && logs !== null) {
      this.logger.log('Done!');
      return logs;
    }
    throw new NotFoundException(
      `${this.HOUR_LOG}`,
      'findMonthlyLogsForActiveSubject(user_id, month)',
      [`${user_id}`, `${month}`],
    );
  }

  async findTotalHoursStudiedForUserSubject(
    user_id: number,
  ): Promise<Array<HourLogTable>> {
    this.logger.log(`GET all ${this.HOUR_LOG} studied per user_subject_id`);
    const hourLogs = await HourLogTable.findAll({
      attributes: [
        'user_subject_id',
        [sequelize.fn('sum', sequelize.col('hours')), 'total_hours'],
        [sequelize.fn('sum', sequelize.col('minutes')), 'total_minutes'],
      ],
      where: { user_id },
      group: 'user_subject_id',
      raw: true,
    });

    if (hourLogs && hourLogs !== null) {
      this.logger.log('Done!');
      return hourLogs;
    }

    throw new NotFoundException(
      this.HOUR_LOG,
      'findTotalHoursStudiedForUserSubject(user_id)',
      [`${user_id}`],
    );
  }
}
