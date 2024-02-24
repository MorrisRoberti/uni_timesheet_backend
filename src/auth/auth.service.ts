import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/endpoints/users/dto/create-user.dto';
import { LoginUserDto } from 'src/endpoints/users/dto/login-user.dto';
import { UsersService } from 'src/endpoints/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private logger: Logger,
  ) {}

  async validateUserOnLogin(loginUser: LoginUserDto) {
    try {
      const user = await this.userService.findOneByEmail(loginUser.email);

      if (!user) {
        // error in case the user does not exist
        const err = new HttpException(
          { error: 'User not found', statusCode: 404 },
          HttpStatus.NOT_FOUND,
        );
        throw err;
      }

      this.logger.log('Comparing passwords for login');
      const passwordValid = await bcrypt.compare(
        loginUser.password,
        user.password,
      );

      if (passwordValid) {
        this.logger.log('Valid password');
        return user;
      }
      // error in case the password is not correct
      const err = new HttpException(
        { error: 'Unauthorized', statusCode: 401 },
        HttpStatus.UNAUTHORIZED,
      );
      throw err;
    } catch (error) {
      this.logger.error('Error during the User validation', error.response);
      throw error;
    }
  }

  async validateUserOnCreate(createdUser: CreateUserDto) {
    try {
      const user = await this.userService.findOneByEmail(createdUser.email);

      if (user) {
        // error in case the email is already present -- create
        const err = new HttpException(
          {
            error: 'The email is already associated with another user',
            statusCode: 404,
          },
          HttpStatus.BAD_REQUEST,
        );
        throw err;
      }
    } catch (error) {
      this.logger.error(
        'Error during the User Creation Validation',
        error.response,
      );
      throw error;
    }
  }

  async validateAccessToken(payload: {email: string; password: string}) {
    try {
      const user = await this.userService.findOneByEmail(payload.email);

      if (!user) {
        // error in case the user does not exist
        const err = new HttpException(
          { error: 'User not found', statusCode: 404 },
          HttpStatus.NOT_FOUND,
        );
        throw err;
      }

      this.logger.log('Comparing passwords for login');
      if (user.password == payload.password) {
        this.logger.log('Valid password');
        return user;
      }
      // error in case the password is not correct
      const err = new HttpException(
        { error: 'Unauthorized', statusCode: 401 },
        HttpStatus.UNAUTHORIZED,
      );
      throw err;
    } catch (error) {
      this.logger.error('Error during the Token validation', error.response);
      throw error;
    }
  }


  async login(user: LoginUserDto, id: number): Promise<{ accessToken: string }> {
    const payload = { id, username: user.email, sub: user.password };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
