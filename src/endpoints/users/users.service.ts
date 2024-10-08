import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTable } from 'src/db/models/user.model';
import * as bcrypt from 'bcrypt';
import { UserConfigTable } from 'src/db/models/user-config.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import path, { join } from 'path';
import fs from 'fs';
import { readFileSync } from 'fs';
import { UserCarreerTable } from 'src/db/models/user-carreer.model';

@Injectable()
export class UsersService {
  constructor(private logger: Logger) {}

  USER = 'User';
  USER_CONFIG = 'UserConfig';
  USER_CARREER = 'User Carreer';

  createNewUserCarreer(user_id: number) {
    this.logger.log(`Creating new ${this.USER_CARREER}`);
    const userCarreer = {
      user_id,
      total_cfu: 0,
      average_grade: 0,
      average_graduation_grade: 0,
    };
    this.logger.log('Done!');
    return userCarreer;
  }

  extractUsersIdsFromUsersConfig(users: Array<UserTable>): Array<number> {
    this.logger.log(`Extracting ${this.USER} ids`);
    const idsArray = [];
    for (let i = 0; i < users.length; i++) {
      idsArray.push(users[i].id);
    }
    this.logger.log('Done!');
    return idsArray;
  }

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
      notifications: userConfigToConvert.notifications,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  convertUpdateUserConfig(userConfigToConvert: UpdateUserDto) {
    this.logger.log(`Converting UPDATE ${this.USER_CONFIG} for update`);
    // I need to save the image in the server storage and save the name of the file in the picture field of dbUserConfig
    let fileName = null;
    if (userConfigToConvert.picture) {
      // Remove the data URL prefix if it exists
      const base64Data = userConfigToConvert.picture.replace(
        /^data:image\/\w+;base64,/,
        '',
      );

      const invalidChars = /[<>:"/\\|?*]/g; // Add any other invalid characters as needed

      const saltRounds = 10;

      fileName = bcrypt
        .hashSync(new Date().toISOString(), saltRounds)
        .replaceAll(invalidChars, '_')
        .concat('.png');

      // Specify the path where you want to save the image
      const filePath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        fileName,
      );

      // Write the Base64 data to a file
      try {
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      } catch (err) {
        console.error(`Error in the writing of file: ${err}`);
      }
    }

    const dbUserConfig = {
      faculty: userConfigToConvert.faculty,
      notifications: userConfigToConvert.notifications,
      picture: fileName,
    };
    this.logger.log('Done!');
    return dbUserConfig;
  }

  convertUpdateUser(userToConvert: UpdateUserDto) {
    this.logger.log(`Converting UPDATE ${this.USER} for update`);
    const dbUser = {
      first_name: userToConvert.first_name,
      last_name: userToConvert.last_name,
    };
    this.logger.log('Done!');
    return dbUser;
  }

  converUserConfigInfo(user: UserTable, user_config: UserConfigTable) {
    this.logger.log(
      `Converting GET ${this.USER} and ${this.USER_CONFIG} to get the userConfigInfo`,
    );

    const base64Picture = this.convertPictureToBase64(user_config.picture);

    const userConfigInfo = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      faculty: user_config.faculty,
      notifications: user_config.notifications,
      picture: base64Picture, // could be a string or null
    };

    this.logger.log('Done!');
    return userConfigInfo;
  }

  convertPictureToBase64(imagePath: string): string | null {
    this.logger.log(`Converting picture at ${imagePath} to base64 string`);
    let base64Image = null;

    const filePath = join(
      `${__dirname}`,
      '..',
      '..',
      '..',
      'public',
      imagePath,
    );

    try {
      const imageFile = readFileSync(filePath);

      // Convert the image file to Base64
      base64Image = imageFile.toString('base64');
    } catch (e) {
      this.logger.error(`Error finding the image at address ${imagePath}`);
    } finally {
      return base64Image;
    }
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

  async findOneById(id: number): Promise<UserTable> {
    this.logger.log(`GET ${this.USER} from id`);
    // executes a sql query to check if a user with the selected email exists
    const user = await UserTable.findOne({ where: { id } });

    if (user && user !== null) {
      this.logger.log('Done!');
      return user.dataValues;
    }

    throw new NotFoundException(this.USER, 'findOneById(id)', [`${id}`]);
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

  async findActiveUserConfig(user_id: number): Promise<UserConfigTable> {
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

  async updateUserOnDb(user: any, id: number, transaction: any) {
    this.logger.log(`Updating ${this.USER} record on db`);
    const userUpdated = await UserTable.update(user, {
      where: { id },
      transaction,
    });

    if (userUpdated && userUpdated !== null) {
      this.logger.log('Done!');
      return userUpdated;
    }

    throw new UpdateFailedException(
      this.USER_CONFIG,
      'updateUserOnDb(user, id)',
      [user, id],
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

  async createUserCarreerOnDb(user_carreer: any, transaction: any) {
    this.logger.log(`Creating ${this.USER_CONFIG} record on db`);
    const userCarreerCreated = await UserCarreerTable.create(user_carreer, {
      transaction,
    });
    if (userCarreerCreated && userCarreerCreated !== null) {
      this.logger.log('Done!');
      return userCarreerCreated;
    }

    throw new InsertionFailedException(
      this.USER_CARREER,
      'createUserCarreerOnDb(user_carreer)',
      [user_carreer],
    );
  }

  async findUsersForEmailForwarding() {
    this.logger.log(`GET ${this.USER_CONFIG} for email sending`);
    const usersConfig = await UserTable.findAll({
      paranoid: true,
      include: [
        {
          model: UserConfigTable,
          where: { notifications: true },
        },
      ],
    });

    if (usersConfig && usersConfig !== null) {
      this.logger.log('Done!');
      return usersConfig;
    }

    throw new NotFoundException(
      this.USER_CONFIG,
      'findUsersForEmailForwarding()',
      [],
    );
  }
}
