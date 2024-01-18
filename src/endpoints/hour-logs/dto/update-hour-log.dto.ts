import { PartialType } from '@nestjs/mapped-types';
import { CreateHourLogDto } from './create-hour-log.dto';

export class UpdateHourLogDto extends PartialType(CreateHourLogDto) {}
