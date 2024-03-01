import { Injectable, Logger } from '@nestjs/common';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { WeeklyLogTable } from 'src/db/models/weekly-log.model';
import { Op } from 'sequelize';
import { HourLogTable } from 'src/db/models/hour-log.model';

@Injectable()
export class HourLogsService {
  constructor(private logger: Logger) {}

  WEEKLY_LOG = 'WeeklyLog';
  HOUR_LOG = 'HourLog';

  addHoursToWeeklyLog(
    weeklyLog: WeeklyLogTable,
    hours: number,
    minutes: number,
  ) {}

  convertNewWeeklyLog(user_id: number, createdHourLogDto: CreateHourLogDto) {}

  convertNewHourLog(
    user_id: number,
    weekly_log_id: number,
    createdHourLogDto: CreateHourLogDto,
  ) {}

  // db functions
  async isWeeklyLogPresent(user_id: number, date: string): Promise<boolean> {
    this.logger.log(`Check if ${this.WEEKLY_LOG} is present`);
    const isPresent = await WeeklyLogTable.findOne({
      where: {
        [Op.and]: {
          user_id,
          week_start: { [Op.gte]: date },
          week_end: { [Op.lte]: date },
        },
      },
    });

    if (isPresent && isPresent !== null) {
      return true;
    }

    return false;
  }

  async findWeeklyLog(user_id: number, date: string): Promise<WeeklyLogTable> {
    return new WeeklyLogTable(); // placeholder
  }

  async updateWeeklyLog(weeklyLog: any, transaction: any) {}

  async createWeeklyLog(weeklyLog: any, transaction): Promise<WeeklyLogTable> {
    return new WeeklyLogTable(); // placeholder
  }

  async createHourLog(hourLog: any, transaction: any): Promise<HourLogTable> {
    return new HourLogTable(); // placeholder
  }
}
