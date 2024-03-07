import {
  IsDate,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MinutesOverflow } from 'src/validation/decorators/minutes-overflow.decorator';

export class CreateHourLogDto {
  // ore
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(24)
  hours: number;

  // minuti
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(59)
  @MinutesOverflow()
  minutes: number;

  // data
  @IsDefined()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  // materia (user_subject_id)
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  user_subject_id: number;

  // descrizione
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description: string;
}
