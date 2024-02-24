import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTable } from 'src/db/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserConfigTable } from 'src/db/models/user-config.model';

@Injectable()
export class UsersService {
  constructor(private logger: Logger) {}

  convertNewUser(createUserDto: CreateUserDto) {
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

  convertUpdateUserConfig(userConfigToConvert: UpdateUserDto) {
    this.logger.log('Converting UPDATE UserConfig for update');
    const dbUserConfig = {
      faculty: userConfigToConvert.faculty,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  // db functions

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

  async findActiveUserConfig(user_id: number) {
    try {
      this.logger.log('GET UserConfig from user_id');

      const user_config = await UserConfigTable.findOne({
        where: { user_id, active: 1 },
      });

      if (user_config && user_config !== null) {
        this.logger.log('Done!');
        return user_config.dataValues;
      }
      this.logger.log('User Config not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET Active User Config');
    }
  }

  async updateUserConfigOnDb(
    userConfig: any,
    user_config_id: number,
    transaction: any,
  ) {
    try {
      this.logger.log('Updating User Config record on db');
      const userConfigUpdated = await UserConfigTable.update(userConfig, {
        where: { id: user_config_id },
        transaction,
      });
      return userConfigUpdated;
    } catch (error) {
      this.logger.error('Error during updating UserConfig');
    }
  }

  async createUserOnDb(user: any, transaction: any) {
    try {
      this.logger.log('Creating User record on db');
      const userCreated = await UserTable.create(user, { transaction });
      return userCreated;
    } catch (error) {
      this.logger.error('Error during creation User', error);
    }
  }

  async createUserConfigOnDb(user: any, transaction: any) {
    try {
      this.logger.log('Creating UserConfig record on db');
      const userConfigCreated = await UserConfigTable.create(user, {
        transaction,
      });
      return userConfigCreated;
    } catch (error) {
      this.logger.error('Error during creation UserConfig', error);
    }
  }
}
