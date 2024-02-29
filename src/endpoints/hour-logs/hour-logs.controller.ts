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
} from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';
import { AuthGuard } from '@nestjs/passport';
import { DBExceptionFilter } from 'src/error_handling/db.exception.filter';

@UseGuards(AuthGuard('jwt'))
@UseFilters(DBExceptionFilter)
@Controller('hour-logs')
export class HourLogsController {
  constructor(private readonly hourLogsService: HourLogsService) {}

  @Post()
  create(@Body() createHourLogDto: CreateHourLogDto) {}

  @Get()
  findAll() {
    return this.hourLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hourLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHourLogDto: UpdateHourLogDto) {
    return this.hourLogsService.update(+id, updateHourLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hourLogsService.remove(+id);
  }
}
