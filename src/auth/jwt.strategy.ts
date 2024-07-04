import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  // checks if the token is valid in the routes that have the AuthGuard
  async validate(credentialsAccessToken: any) {
    const rawCredentials = {
      email: credentialsAccessToken.username,
      password: credentialsAccessToken.sub,
    };
    const user = await this.authService.validateAccessToken(rawCredentials);
    if (!user) {
      throw new UnauthorizedException();
    }
    return credentialsAccessToken;
  }
}
