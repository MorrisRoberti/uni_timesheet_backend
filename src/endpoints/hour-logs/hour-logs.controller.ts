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
import { Response } from 'express';

@UseGuards(AuthGuard('jwt'))
@UseFilters(DBExceptionFilter)
@Controller('hour-logs')
export class HourLogsController {
  constructor(
    private readonly hourLogsService: HourLogsService,
    private sequelize: Sequelize,
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

    const transaction = await this.sequelize.transaction();

    if (isWeeklyLogPresent) {
      // find associated weekly_log record
      weeklyLog = await this.hourLogsService.findWeeklyLog(
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

  // GET week hours (from week) -> returns all the hour_logs for the week and the total
  @Get('/weekly-hour-logs/')
  async getWeeklyHourLogs(
    @Request() request: any,
    @Body() body: { week_start: string; week_end: string },
  ) {
    const { week_start, week_end } = body;

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
  async getHourLogFromId(@Request() request: any, @Param('id') id: number) {}

  // GET weekly log for subject (from subject id, week) -> returns hour_logs of the week aggregated for user_subject
  @Get('/weekly-hour-log-for-subject/')
  async getWeeklyHourLogForSubject(
    @Request() request: any,
    @Body() body: { week: string; subjet_id: number },
  ) {}

  // GET daily log for subject (from subject id, day) -> returns hour_logs of the day aggregated for user_subject
  @Get('/daily-hour-log-for-subject/')
  async getDailyHourLogForSubject(
    @Request() request: any,
    @Body() body: { day: string; subjet_id: number },
  ) {}

  // PUT hour_log from id -> pay attention to update the number of hours of weekly_log (could add or subtract)
  @Put('/:id')
  async updateHourLog(
    @Request() request: any,
    @Param('id') id: number,
    @Body() updateHourLogDto: UpdateHourLogDto,
  ) {}

  // DELETE hour_log from id -> pay attention to remove the number of hours of weekly_log (will only subtract)
  @Delete('/:id')
  async deleteHourLog(@Request() request: any, @Param('id') id: number) {}
}
