import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  cfu: number;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  aa_left: number;

  @IsDefined()
  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2030)
  aa_right: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  semester: number;
}
