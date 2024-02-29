import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/endpoints/users/dto/create-user.dto';
import { LoginUserDto } from 'src/endpoints/users/dto/login-user.dto';
import { UsersService } from 'src/endpoints/users/users.service';
import { DuplicatedException } from 'src/error_handling/models/duplicated.exception.model';
import { UnauthorizedException } from 'src/error_handling/models/not-found.exception.model copy';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private logger: Logger,
  ) {}

  USER = 'User';

  async validateUserOnLogin(loginUser: LoginUserDto) {
    this.logger.log('Validating User for Login');
    const user = await this.userService.findOneByEmail(loginUser.email);

    this.logger.log('Comparing passwords for login');
    const passwordValid = await bcrypt.compare(
      loginUser.password,
      user.password,
    );

    if (passwordValid) {
      this.logger.log('Valid password');
      return user;
    }
    throw new UnauthorizedException(
      this.USER,
      'validateUserOnLogin(loginUser)',
      [`${loginUser}`],
    );
  }

  async validateUserOnCreate(createdUser: CreateUserDto) {
    const user = await this.userService.isUserAlreadyPresent(createdUser.email);

    if (user) {
      throw new DuplicatedException(
        this.USER,
        'validateUserOnCreate(createdUser)',
        [`${createdUser}`],
      );
    }
  }

  async validateAccessToken(payload: { email: string; password: string }) {
    this.logger.log('Validating Access Token');
    const user = await this.userService.findOneByEmail(payload.email);

    this.logger.log('Comparing passwords for login');
    if (user.password == payload.password) {
      this.logger.log('Valid password');
      return user;
    }

    throw new UnauthorizedException(this.USER, 'validateAccessToken(payload)', [
      `${payload}`,
    ]);
  }

  async login(
    user: LoginUserDto,
    id: number,
  ): Promise<{ accessToken: string }> {
    const payload = { id, username: user.email, sub: user.password };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
