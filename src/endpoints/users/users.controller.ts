import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private logger: Logger,
  ) {}

  @Post('/login')
  async login(@Body() credentials: LoginUserDto) {
    try {
      // checks if the email already exists
      const user = await this.authService.validateUser(credentials);

      if (!user) {
        // return error
      }
      // if it does exist it uses passport to log in
      const token = await this.authService.login(user);
      // then returns the token
      return token;
    } catch (error) {
      this.logger.error(`An error has occurred in POST users/login`, error);
    }
  }

  @Post('/create')
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      // checks if the email already exists, if exists calls login, if not it goes on
      if ((await this.authService.validateUser(createUserDto)) !== null) {
        // returns a message to tell the user that the email is already taken
        throw new HttpException(
          {
            error: 'The email is already associated with another user',
            statusCode: 404,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // converts the dto in the db user object
      const convertedUser =
        this.userService.convertNewUserToCreate(createUserDto);
      // creates the record on db
      const user = await this.userService.createUserOnDb(convertedUser);

      // converts the dto in the db user config object
      const convertedUserConfig = this.userService.convertNewUserConfig(
        createUserDto,
        user.id,
      );
      // creates the record on db
      await this.userService.createUserConfigOnDb(convertedUserConfig);

      // calls the login function and returns the token
      return HttpStatus.CREATED;
    } catch (error) {
      this.logger.error(`An error has occurred in POST users/create`, error);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return HttpStatus.OK;
  }
}
