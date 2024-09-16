import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class CreateExamDto {
  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  carreer_id: number;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  user_subject_id: number;

  @IsDefined()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(31)
  grade: number;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(31)
  minimum_passing_grade: number;

  @IsDefined()
  @IsNotEmpty()
  @IsBoolean()
  accepted: boolean;
}
