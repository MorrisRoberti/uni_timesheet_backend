import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTable } from 'src/db/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserConfigTable } from 'src/db/models/user-config.model';

@Injectable()
export class UsersService {
  constructor(private logger: Logger) {}

  convertNewUserToCreate(createUserDto: CreateUserDto) {
    this.logger.log('Converting NEW User for creation');
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(createUserDto.password, saltRounds);
    const dbUser = {
      id: null,
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      email: createUserDto.email,
      password: hashedPassword,
    };
    this.logger.log('Done!');
    return dbUser;
  }

  convertNewUserConfig(userConfigToConvert: CreateUserDto, user_id: number) {
    this.logger.log('Converting NEW UserConfig for creation');
    const dbUserConfig = {
      user_id: user_id,
      active: 1,
      faculty: userConfigToConvert.faculty,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  async findOneByEmail(email: string): Promise<UserTable> {
    try {
      this.logger.log('GET User from Email');
      // executes a sql query to check if a user with the selected email exists
      const user = await UserTable.findOne({ where: { email } });

      if (user && user !== null) {
        this.logger.log('Done!');
        return user.dataValues;
      }
      this.logger.log('User not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET User from Email', error);
    }
  }

  // db functions

  async createUserOnDb(user: any) {
    try {
      this.logger.log('Creating User record on db');
      const userCreated = await UserTable.create(user);
      return userCreated;
    } catch (error) {
      this.logger.error('Error during creation User', error);
    }
  }

  async createUserConfigOnDb(user: any) {
    try {
      this.logger.log('Creating UserConfig record on db');
      const userConfigCreated = await UserConfigTable.create(user);
      return userConfigCreated;
    } catch (error) {
      this.logger.error('Error during creation UserConfig', error);
    }
  }
}
