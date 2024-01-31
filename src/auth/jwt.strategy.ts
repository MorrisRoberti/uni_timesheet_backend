import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { LoginUserDto } from 'src/endpoints/users/dto/login-user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(loginUser: LoginUserDto): Promise<any> {
    const user = await this.authService.validateUserOnLogin(loginUser);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
