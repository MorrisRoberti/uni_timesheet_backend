import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseFilters,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { DBExceptionFilter } from 'src/error_handling/db.exception.filter';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Sequelize } from 'sequelize-typescript';

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

      const transaction = await this.sequelize.transaction();
      // update weekly_log record on db
      await this.hourLogsService.updateWeeklyLog(
        convertedWeeklyLog,
        transaction,
      );

      // convert hour_log (with the weekly_log_id)
      const convertedHourLog = this.hourLogsService.convertNewHourLog(
        request.user.id,
        weeklyLog.id,
        createHourLogDto,
      );
      // create hour_log on db
      await this.hourLogsService.createHourLog(convertedHourLog, transaction);
      await transaction.commit();
    } else {
      // convert new weekly_log record
      const weeklyLogConverted = this.hourLogsService.convertNewWeeklyLog(
        request.user.id,
        createHourLogDto,
      );

      const transaction = await this.sequelize.transaction();

      // create new weekly_log record on db
      weeklyLog = await this.hourLogsService.createWeeklyLog(
        weeklyLogConverted,
        transaction,
      );

      // convert hour_log (with the weekly_log_id)
      const convertedHourLog = this.hourLogsService.convertNewHourLog(
        request.user.id,
        weeklyLog.id,
        createHourLogDto,
      );
      // create hour_log on db
      await this.hourLogsService.createHourLog(convertedHourLog, transaction);
      await transaction.commit();
    }

    // return
    return HttpStatus.CREATED;
  }

  // GET week hours

  // GET hour_log from id

  // GET weekly log for subject from subject id

  // PUT hour_log from id

  // DELETE hour_log from id
}
