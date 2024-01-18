import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTable } from 'src/db/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserConfigTable } from 'src/db/models/user-config.model';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(private logger: Logger) {}

  convertNewUserToCreate(createUserDto: CreateUserDto) {
    const saltRounds = 10;
    const hashedPassword = bcrypt.hash(createUserDto.password, saltRounds);
    const dbUser = {
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      email: createUserDto.email,
      password: hashedPassword,
    };
    return dbUser;
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOneByEmail(email: string): Promise<UserTable> {
    try {
      // executes a sql query to check if a user with the selected email exists
      this.logger.log(email);
      const user = await UserTable.findOne({ where: { email } });
      this.logger.log(user.dataValues);
      if (user && user !== null) {
        return user.dataValues;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async userAlreadyPresent(email: string): Promise<boolean> {
    // executes a sql query to check if a user with the selected email exists
    const users = await UserTable.findOne({ where: { email } });
    if (users.dataValues == 1) {
      return true;
    }
    return false;
  }

  findOneById(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
