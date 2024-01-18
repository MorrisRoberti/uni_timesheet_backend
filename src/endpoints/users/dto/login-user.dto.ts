import {
  IsDefined,
  IsNotEmpty,
  IsString,
  IsEmail,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class LoginUserDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  // @IsStrongPassword({ minLength: 8, minNumbers: 2, minSymbols: 1 })
  @MaxLength(255)
  password: string;
}
