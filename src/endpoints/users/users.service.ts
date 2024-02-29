import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTable } from 'src/db/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserConfigTable } from 'src/db/models/user-config.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';

@Injectable()
export class UsersService {
  constructor(private logger: Logger) {}

  USER = 'User';
  USER_CONFIG = 'UserConfig';

  convertNewUser(createUserDto: CreateUserDto) {
    this.logger.log(`Converting NEW ${this.USER} for creation`);
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
    this.logger.log(`Converting NEW ${this.USER_CONFIG} for creation`);
    const dbUserConfig = {
      user_id: user_id,
      active: 1,
      faculty: userConfigToConvert.faculty,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  convertUpdateUserConfig(userConfigToConvert: UpdateUserDto) {
    this.logger.log(`Converting UPDATE ${this.USER_CONFIG} for update`);
    const dbUserConfig = {
      faculty: userConfigToConvert.faculty,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  // db functions

  async findOneByEmail(email: string): Promise<UserTable> {
    this.logger.log(`GET ${this.USER} from Email`);
    // executes a sql query to check if a user with the selected email exists
    const user = await UserTable.findOne({ where: { email } });

    if (user && user !== null) {
      this.logger.log('Done!');
      return user.dataValues;
    }

    throw new NotFoundException(this.USER, 'findOneByEmail(email)', [email]);
  }

  async isUserAlreadyPresent(email: string): Promise<boolean> {
    this.logger.log(`GET ${this.USER} to chek if is present`);
    // executes a sql query to check if a user with the selected email exists
    const user = await UserTable.findOne({ where: { email } });

    if (user && user !== null) {
      this.logger.log('Done!');
      return true;
    }

    return false;
  }

  async findActiveUserConfig(user_id: number) {
    this.logger.log(`GET ${this.USER_CONFIG} from user_id`);

    const userConfig = await UserConfigTable.findOne({
      where: { user_id, active: 1 },
    });

    if (userConfig && userConfig !== null) {
      this.logger.log('Done!');
      return userConfig.dataValues;
    }

    throw new NotFoundException(
      this.USER_CONFIG,
      'findActiveUserConfig(user_id)',
      [`${user_id}`],
    );
  }

  async updateUserConfigOnDb(
    userConfig: any,
    user_config_id: number,
    transaction: any,
  ) {
    this.logger.log(`Updating ${this.USER_CONFIG} record on db`);
    const userConfigUpdated = await UserConfigTable.update(userConfig, {
      where: { id: user_config_id },
      transaction,
    });

    if (userConfigUpdated && userConfigUpdated !== null) {
      this.logger.log('Done!');
      return userConfigUpdated;
    }

    throw new UpdateFailedException(
      this.USER_CONFIG,
      'updateUserConfigOnDb(userConfig, user_config_id)',
      [userConfig, user_config_id],
    );
  }

  async createUserOnDb(user: any, transaction: any) {
    this.logger.log(`Creating ${this.USER} record on db`);
    const userCreated = await UserTable.create(user, { transaction });

    if (userCreated && userCreated !== null) {
      this.logger.log('Done!');
      return userCreated;
    }

    throw new InsertionFailedException(this.USER, 'createUserOnDb(user)', [
      user,
    ]);
  }

  async createUserConfigOnDb(user: any, transaction: any) {
    this.logger.log(`Creating ${this.USER_CONFIG} record on db`);
    const userConfigCreated = await UserConfigTable.create(user, {
      transaction,
    });
    if (userConfigCreated && userConfigCreated !== null) {
      this.logger.log('Done!');
      return userConfigCreated;
    }

    throw new InsertionFailedException(
      this.USER_CONFIG,
      'createUserConfigOnDb(user)',
      [user],
    );
  }
}
