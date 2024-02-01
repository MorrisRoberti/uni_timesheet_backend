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
import { Sequelize } from 'sequelize-typescript';

@Controller('users')
export class UsersController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private logger: Logger,
    private sequelize: Sequelize,
  ) {}

  @Post('/login')
  async login(@Body() credentials: LoginUserDto) {
    // checks if the email already exists
    const user = await this.authService.validateUserOnLogin(credentials);

    // if it does exist it uses passport to log in
    const token = await this.authService.login(user);
    // then returns the token
    return token;
  }

  @Post('/create')
  async create(@Body() createUserDto: CreateUserDto) {
    // checks if the email already exists, if exists calls login, if not it goes on
    await this.authService.validateUserOnCreate(createUserDto);

    // converts the dto in the db user object
    const convertedUser =
      this.userService.convertNewUserToCreate(createUserDto);

    const transaction = await this.sequelize.transaction();

    // creates the record on db
    const user = await this.userService.createUserOnDb(
      convertedUser,
      transaction,
    );

    // converts the dto in the db user config object
    const convertedUserConfig = this.userService.convertNewUserConfig(
      createUserDto,
      user.id,
    );
    // creates the record on db
    await this.userService.createUserConfigOnDb(
      convertedUserConfig,
      transaction,
    );

    await transaction.commit();

    // calls the login function and returns the token
    return HttpStatus.CREATED;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/test')
  findAll() {
    return HttpStatus.OK;
  }
}
