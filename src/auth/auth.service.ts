import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { format } from 'date-fns';
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

  // it is used to validate the token in authGuard
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

  async validateRefreshToken(oldRefreshToken: string) {
    // I decode the old Token and compare the id, date, username and password and if it's valid return true else return false
    this.logger.log('Validating Refresh Token');

    const tokenValues = oldRefreshToken
      ? this.jwtService.decode(oldRefreshToken)
      : undefined;

    if (tokenValues) {
      // get the user from email to confront the parameters
      const user = await this.userService.findOneByEmail(tokenValues.username);

      const currentDate = format(new Date(), 'yyyy-MM-dd');
      this.logger.log('Comparing Refresh Tokens for validation ');
      if (
        user &&
        user.id == tokenValues.id &&
        user.password == tokenValues.sub &&
        tokenValues.newDate == currentDate
      ) {
        this.logger.log('Valid refresh token');
        return user;
      }
    }

    throw new UnauthorizedException(
      this.USER,
      'validateRefreshToken(oldRefreshToken)',
      [oldRefreshToken],
    );
  }

  createAccessToken(user: LoginUserDto, id: number): string {
    const accessTokenPayload = { id, username: user.email, sub: user.password };
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '2m',
    });
    return accessToken;
  }

  createRefreshToken(user: LoginUserDto, id: number): string {
    const newDate = format(new Date(), 'yyy-MM-dd');

    const refreshTokenPayload = {
      newDate,
      id,
      username: user.email,
      sub: user.password,
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '1d',
    });
    return refreshToken;
  }

  async login(
    user: LoginUserDto,
    id: number,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.createAccessToken(user, id);
    const refreshToken = this.createRefreshToken(user, id);
    return {
      accessToken,
      refreshToken,
    };
  }
}
