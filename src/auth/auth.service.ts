import { Injectable, Logger } from '@nestjs/common';
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

  async validateUser(loginUser: LoginUserDto) {
    const user = await this.userService.findOneByEmail(loginUser.email);

    if (!user) return null;

    const passwordValid = await bcrypt.compare(
      loginUser.password,
      user.password,
    );

    if (passwordValid) return user;
  }

  async login(user: LoginUserDto): Promise<{ accessToken: string }> {
    const payload = { username: user.email, sub: user.password };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
