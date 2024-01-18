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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(@Body() credentials: LoginUserDto) {
    // checks if the email already exists
    const user = await this.authService.validateUser(credentials);

    if (!user) {
      // return error
    }
    // if it does exist it uses passport to log in
    const token = await this.authService.login(user);
    // then returns the token
    return token;
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // checks if the email already exists, if exists calls login, if not it goes on
    if (this.authService.validateUser(createUserDto)) {
      // returns a message to tell the user that the email is already taken
    }

    // converts the dto in the db user object
    // creates the record on db

    // converts the dto in the db user config object
    // creates the record on db

    // calls the login function and returns the token
    return createUserDto;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return HttpStatus.OK;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
}
