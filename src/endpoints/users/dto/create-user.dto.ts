import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { LoginUserDto } from './login-user.dto';

export class CreateUserDto extends LoginUserDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  first_name: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  last_name: string;

  // this is a config data
  @IsOptional()
  @IsString()
  @MaxLength(255)
  faculty: string;
}
