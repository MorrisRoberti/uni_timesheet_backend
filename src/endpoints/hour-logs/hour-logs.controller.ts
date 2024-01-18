import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HourLogsService } from './hour-logs.service';
import { CreateHourLogDto } from './dto/create-hour-log.dto';
import { UpdateHourLogDto } from './dto/update-hour-log.dto';

@Controller('hour-logs')
export class HourLogsController {
  constructor(private readonly hourLogsService: HourLogsService) {}

  @Post()
  create(@Body() createHourLogDto: CreateHourLogDto) {
    return this.hourLogsService.create(createHourLogDto);
  }

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
