import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseFilters,
  Request,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { DBExceptionFilter } from 'src/error_handling/db.exception.filter';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Sequelize } from 'sequelize-typescript';
import { SubjectsService } from '../subjects/subjects.service';

@UseGuards(AuthGuard('jwt'))
@UseFilters(DBExceptionFilter)
@Controller('hour-logs')
export class HourLogsController {
  constructor(
    private readonly hourLogsService: HourLogsService,
    private sequelize: Sequelize,
    private subjectsService: SubjectsService,
  ) {}

  @Post()
  async create(
    @Request() request: any,
    @Body() createHourLogDto: CreateHourLogDto,
  ) {
    // check if the weekly_log record for user already exists
    const isWeeklyLogPresent = await this.hourLogsService.isWeeklyLogPresent(
      request.user.id,
      createHourLogDto.date,
    );

    let weeklyLog: WeeklyLogTable;

    // if the user_subject is not present the NotFoundException is thrown
    await this.subjectsService.findOneUserSubject(
      request.user.id,
      createHourLogDto.user_subject_id,
    );

    const transaction = await this.sequelize.transaction();

    if (isWeeklyLogPresent) {
      // find associated weekly_log record
      weeklyLog = await this.hourLogsService.findWeeklyLogFromDate(
        request.user.id,
        createHourLogDto.date,
      );

      // convert weekly_log record (with the createdHourLogDto hours and minutes)
      const convertedWeeklyLog = this.hourLogsService.addHoursToWeeklyLog(
        weeklyLog,
        createHourLogDto.hours,
        createHourLogDto.minutes,
      );

      // update weekly_log record on db
      await this.hourLogsService.updateWeeklyLog(
        convertedWeeklyLog,
        transaction,
      );
    } else {
      // convert new weekly_log record
      const weeklyLogConverted = this.hourLogsService.convertNewWeeklyLog(
        request.user.id,
        createHourLogDto,
      );

      // create new weekly_log record on db
      weeklyLog = await this.hourLogsService.createWeeklyLog(
        weeklyLogConverted,
        transaction,
      );
    }

    // convert hour_log (with the weekly_log_id)
    const convertedHourLog = this.hourLogsService.convertNewHourLog(
      request.user.id,
      weeklyLog.id,
      createHourLogDto,
    );
    // create hour_log on db
    await this.hourLogsService.createHourLog(convertedHourLog, transaction);
    await transaction.commit();

    // return
    return HttpStatus.CREATED;
  }

  // It takes the hours of the active user_subjects for each week of the month and groups it by week
  @Get('/weekly-hour-logs/in-month/:month')
  async getWeeklyHourLogsForTheMonth(
    @Request() request: any,
    @Param('month') month: number,
  ) {
    // GET all the logs from the selected month of the active subjects
    const monthLogs =
      await this.hourLogsService.findMonthlyLogsForActiveSubject(
        request.user.id,
        month,
      );

    // I need to group the logs from their weekly_log_id (I also need a way to order them) and then aggregate them by subject
    const aggregatedHoursByWeek =
      this.hourLogsService.aggregateHoursByWeekOfMonth(monthLogs);

    const groupAggregatedHoursBySubject =
      this.hourLogsService.aggregateWeeklyHoursBySubject(aggregatedHoursByWeek);

    return groupAggregatedHoursBySubject;
  }

  // GET week hours (from week) -> returns all the hour_logs for the week and the total
  @Get('/weekly-hour-logs/:week_start/:week_end')
  async getWeeklyHourLogs(
    @Request() request: any,
    @Param('week_start') week_start: string,
    @Param('week_end') week_end: string,
  ) {
    // GET weekly_log
    const weeklyLog = await this.hourLogsService.findWeeklyLogFromWeek(
      request.user.id,
      week_start,
      week_end,
    );

    // GET hour_logs for that week
    const hourLogs = await this.hourLogsService.findHourLogsFromWeeklyLogId(
      request.user.id,
      weeklyLog.id,
    );

    const convertedHourLogs =
      this.hourLogsService.convertHourLogsArrayToDto(hourLogs);

    const weeklyLogConverted = this.hourLogsService.convertWeeklyLogToDto(
      weeklyLog,
      convertedHourLogs,
    );

    return weeklyLogConverted;
  }

  @Get('/weekly-hour-logs/top-subjects/:week_start/:week_end')
  async getWeeklyHourLogsTopSubjects(
    @Request() request: any,
    @Param('week_start') week_start: string,
    @Param('week_end') week_end: string,
  ) {
    // GET weekly_log
    const hoursForTheWeekForSubject =
      await this.hourLogsService.findHoursForTheWeekForSubject(
        request.user.id,
        week_start,
        week_end,
      );

    // format the object to return
    const convertedLogs =
      this.hourLogsService.convertWeeklyAggregatedForSubjectToDto(
        hoursForTheWeekForSubject,
      );

    // return object
    return convertedLogs;
  }

  // GET daily log (from day) -> returns all hour_logs for the day
  @Get('/daily-hour-logs/:date')
  async getDailyHourLogs(@Request() request: any, @Param('date') date: string) {
    // GET the hourLogs of user for that date
    const hourLogs = await this.hourLogsService.findHourLogsFromDate(
      request.user.id,
      date,
    );

    // convert records to return
    const convertedHourLogs =
      this.hourLogsService.convertHourLogsArrayToDto(hourLogs);
    return convertedHourLogs;
  }

  // GET hour_log (from id) -> returns single hour_log from id
  @Get('/:id')
  async getHourLogFromId(@Request() request: any, @Param('id') id: number) {
    // GET hour log from id
    const hourLog = await this.hourLogsService.findHourLogFromId(
      request.user.id,
      id,
    );

    // convert hour log to dto
    const convertedHourLog = this.hourLogsService.convertHourLogToDto(hourLog);
    return convertedHourLog;
  }

  // GET weekly log for subject (from subject id, week) -> returns hour_logs of the week for a specified user_subject
  @Get('/weekly-hour-logs/for-subject/:user_subject_id/:week_start/:week_end')
  async getWeeklyHourLogForSubject(
    @Request() request: any,
    @Param('user_subject_id') user_subject_id: number,
    @Param('week_start') week_start: string,
    @Param('week_end') week_end: string,
  ) {
    // GET weekly log
    const weeklyLog = await this.hourLogsService.findWeeklyLogFromWeek(
      request.user.id,
      week_start,
      week_end,
    );

    // GET hourLog from the weekly log, user and user_subject_id
    const hourLogs = await this.hourLogsService.findHourLogsOfWeekForSubject(
      request.user.id,
      weeklyLog.id,
      user_subject_id,
    );

    // composing the dto
    const hourLogsDto =
      this.hourLogsService.convertHourLogsArrayToDto(hourLogs);

    // create the total sum of hours
    const { total_hours, total_minutes } =
      this.hourLogsService.sumTotalHoursOfHourLogsArray(hourLogsDto);

    const returnObj = { total_hours, total_minutes, hourLogsDto };

    return returnObj;
  }

  @Get('/weekly-hour-logs/last-week-comparison/:week_start/:week_end')
  async getLastWeekComparison(
    @Request() request: any,
    @Param('week_start') week_start: string,
    @Param('week_end') week_end: string,
  ) {
    // GET the current weekly log
    const weeklyLogCurrent = await this.hourLogsService.findWeeklyLogFromWeek(
      request.user.id,
      week_start,
      week_end,
    );

    const { previousWeekStart, previousWeekEnd } =
      this.hourLogsService.getPreviousWeekBounds(week_start, week_end);

    // GET the previous weekly log
    const weeklyLogPrevious = await this.hourLogsService.findWeeklyLogFromWeek(
      request.user.id,
      previousWeekStart,
      previousWeekEnd,
    );

    // compose the object to return
    const responsePayload = this.hourLogsService.composeCurrentLastWeekPayload(
      weeklyLogPrevious,
      weeklyLogCurrent,
    );

    return responsePayload;
  }

  // PUT hour_log from id -> pay attention to update the number of hours of weekly_log (could add or subtract) it is not possible to change the date
  @Put('/:id')
  async updateHourLog(
    @Request() request: any,
    @Param('id') id: number,
    @Body() updateHourLogDto: UpdateHourLogDto,
  ) {
    // find the hourLog
    const hourLogFromDb = await this.hourLogsService.findHourLogFromId(
      request.user.id,
      id,
    );

    // find the weeklyLog
    const weeklyHourLogFromDb = await this.hourLogsService.findWeeklyLogFromId(
      request.user.id,
      hourLogFromDb.weekly_log_id,
    );

    let weeklyLogConversionPromise: Promise<WeeklyLogTable> = new Promise(
      (resolve) => {
        resolve(weeklyHourLogFromDb);
      },
    );
    // if the new hours are more then add to the weekly, if less remove
    if (
      parseFloat(updateHourLogDto.minutes.toFixed(2)) + updateHourLogDto.hours >
      parseFloat(hourLogFromDb.minutes.toFixed(2)) + hourLogFromDb.hours
    ) {
      // add
      weeklyLogConversionPromise = new Promise((resolve) => {
        const value = this.hourLogsService.addHoursToWeeklyLog(
          weeklyHourLogFromDb,
          updateHourLogDto.hours - hourLogFromDb.hours,
          updateHourLogDto.minutes - hourLogFromDb.minutes,
        );
        resolve(value);
      });
    } else if (
      updateHourLogDto.hours !== hourLogFromDb.hours &&
      updateHourLogDto.minutes !== hourLogFromDb.minutes
    ) {
      // subtract
      weeklyLogConversionPromise = new Promise((resolve) => {
        const value = this.hourLogsService.subtractHoursToWeeklyLog(
          weeklyHourLogFromDb,
          hourLogFromDb.hours - updateHourLogDto.hours,
          hourLogFromDb.minutes - updateHourLogDto.minutes,
        );
        resolve(value);
      });
    }

    const hourLogConversionPromise = new Promise((resolve) => {
      const value = this.hourLogsService.convertUpdatedHourLog(
        hourLogFromDb,
        updateHourLogDto,
      );
      resolve(value);
    });

    // I convert the two objects in parallel
    const [convertedWeeklyLog, convertedHourLog] = await Promise.all([
      weeklyLogConversionPromise,
      hourLogConversionPromise,
    ]);

    const transaction = await this.sequelize.transaction();

    // I upate indipendently the weekly and the hour log
    const weeklyUpdatePromise = new Promise((resolve) => {
      resolve(
        this.hourLogsService.updateWeeklyLog(convertedWeeklyLog, transaction),
      );
    });

    const hourUpdatePromise = new Promise((resolve) => {
      resolve(
        this.hourLogsService.updateHourLog(convertedHourLog, transaction),
      );
    });

    await Promise.all([weeklyUpdatePromise, hourUpdatePromise]);

    await transaction.commit();
    return HttpStatus.OK;
  }

  // DELETE hour_log from id -> pay attention to remove the number of hours of weekly_log (will only subtract)
  @Delete('/:id')
  async deleteHourLog(@Request() request: any, @Param('id') id: number) {
    // get the corresponding hour_log
    const hourLog = await this.hourLogsService.findHourLogFromId(
      request.user.id,
      id,
    );

    // get the corresponging weekly_log
    const weeklyLog = await this.hourLogsService.findWeeklyLogFromId(
      request.user.id,
      hourLog.weekly_log_id,
    );

    const transaction = await this.sequelize.transaction();

    const convertedWeeklyLog = this.hourLogsService.subtractHoursToWeeklyLog(
      weeklyLog,
      hourLog.hours,
      hourLog.minutes,
    );
    // delete the hour log
    await this.hourLogsService.deleteHourLogFromId(hourLog.id, transaction);

    // i update the weekly log also in case the hours/minutes are 0 in this way i can delete it but keep the values 0
    await this.hourLogsService.updateWeeklyLog(convertedWeeklyLog, transaction);

    if (convertedWeeklyLog.hours == 0 && convertedWeeklyLog.minutes == 0) {
      await this.hourLogsService.deleteWeeklyLogFromId(
        weeklyLog.id,
        transaction,
      );
    }
    await transaction.commit();

    return HttpStatus.OK;
  }
}
