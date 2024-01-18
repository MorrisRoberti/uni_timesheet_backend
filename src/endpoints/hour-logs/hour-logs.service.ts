import { Injectable } from '@nestjs/common';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';

@Injectable()
export class HourLogsService {
  create(createHourLogDto: CreateHourLogDto) {
    return 'This action adds a new hourLog';
  }

  findAll() {
    return `This action returns all hourLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} hourLog`;
  }

  update(id: number, updateHourLogDto: UpdateHourLogDto) {
    return `This action updates a #${id} hourLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} hourLog`;
  }
}
