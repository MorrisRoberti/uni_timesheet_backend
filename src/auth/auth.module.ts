import { Module, Logger } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from 'src/endpoints/users/users.service';
import { UserTable } from 'src/db/models/user.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    SequelizeModule.forFeature([UserTable]),
    JwtModule.register({
      global: true,
      secret: 'testSecret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    AuthService,
    JwtService,
    UsersService,
    UserTable,
    Logger,
    JwtStrategy,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
