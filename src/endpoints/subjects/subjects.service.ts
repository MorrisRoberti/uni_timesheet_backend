import { Injectable, Logger } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectTable } from 'src/db/models/subject.model';
import { UserSubjectTable } from 'src/db/models/user-subject.model';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { DeletionFailedException } from 'src/error_handling/models/deletion-failed.exception.model';

@Injectable()
export class SubjectsService {
  constructor(private logger: Logger) {}

  SUBJECT = 'Subject';
  USER_SUBJECT = 'UserSubject';

  convertNewSubject(createdSubjectDto: CreateSubjectDto) {
    this.logger.log(`Converting NEW ${this.SUBJECT} for Creation`);
    const dbSubject = {
      id: null,
      name: createdSubjectDto.name,
    };
    this.logger.log('Done!');
    return dbSubject;
  }

  convertNewUserSubject(
    createdSubjectDto: CreateSubjectDto,
    user_id: number,
    subject_id: number,
  ) {
    this.logger.log(`Converting NEW ${this.USER_SUBJECT} for Creation`);
    const dbSubject = {
      id: null,
      user_id,
      subject_id,
      cfu: createdSubjectDto.cfu,
      name: createdSubjectDto.name,
      aa_left: createdSubjectDto.aa_left,
      aa_right: createdSubjectDto.aa_right,
      semester: createdSubjectDto.semester,
    };
    this.logger.log('Done!');
    return dbSubject;
  }

  convertArrayOfUserSubjectsToDto(userSubjects: Array<UserSubjectTable>) {
    this.logger.log(
      `Converting ${this.USER_SUBJECT} array from db to array of dto`,
    );
    const userSubjectsArrayDto = [];
    for (let i = 0; i < userSubjects.length; i++) {
      this.logger.log(`Converting object number ${i}...`);
      const userSubjectDB = userSubjects[i];
      const userSubjectDto = {
        id: userSubjectDB.id,
        name: userSubjectDB.name,
        cfu: userSubjectDB.cfu,
        semester: userSubjectDB.semester,
        aa_left: userSubjectDB.aa_left,
        aa_right: userSubjectDB.aa_right,
      };
      this.logger.log('Ok');
      userSubjectsArrayDto.push(userSubjectDto);
    }
    this.logger.log('Done!');
    return userSubjectsArrayDto;
  }

  convertUpdatedUserSubject(
    updateUserSubject: UpdateSubjectDto,
    user_id: number,
    id: number,
  ) {
    this.logger.log(`Converting UPDATE ${this.SUBJECT} for Udating`);
    const dbSubject = {
      id,
      user_id,
      cfu: updateUserSubject.cfu,
      name: updateUserSubject.name,
      aa_left: updateUserSubject.aa_left,
      aa_right: updateUserSubject.aa_right,
      semester: updateUserSubject.semester,
    };
    this.logger.log('Done!');
    return dbSubject;
  }

  // db functions

  async isSubjectPresent(name: string): Promise<boolean> {
    this.logger.log(`Checking if ${this.SUBJECT} is present`);
    const subject = await SubjectTable.findOne({ where: { name } });

    if (subject && subject !== null) {
      this.logger.log('Present!');
      return true;
    }

    this.logger.log('Not Present!');
    return false;
  }

  async findAllUserSubjectsOfUser(user_id: number) {
    this.logger.log(`GET All ${this.USER_SUBJECT} of User`);
    const userSubjects = await UserSubjectTable.findAndCountAll({
      where: { user_id },
      paranoid: true,
    });

    if (userSubjects && userSubjects !== null) {
      this.logger.log('Done!');
      return userSubjects.rows;
    }

    // the error could be logged in the custom exception filter
    throw new NotFoundException(
      this.USER_SUBJECT,
      'findAllUserSubjectsOfUser(user_id)',
      [`${user_id}`],
    );
  }

  async findUserSubjectByName(name: string, user_id: number) {
    this.logger.log(`GET ${this.USER_SUBJECT} from name`);
    const userSubject = await UserSubjectTable.findOne({
      where: { name, user_id },
    });

    if (userSubject && userSubject !== null) {
      this.logger.log('Done!');
      return userSubject.dataValues;
    }
    throw new NotFoundException(
      this.USER_SUBJECT,
      'findUserSubjectByName(name, user_id)',
      [name, `${user_id}`],
    );
  }
  async findSubjectByName(name: string) {
    this.logger.log(`GET ${this.SUBJECT} from name`);
    const subject = await SubjectTable.findOne({ where: { name } });

    if (subject && subject !== null) {
      this.logger.log('Done!');
      return subject.dataValues;
    }

    throw new NotFoundException(this.SUBJECT, 'findSubjectByName(name)', [
      name,
    ]);
  }
  async findOneUserSubjectDeleted(user_id: number, subject_id: number) {
    this.logger.log(`GET ${this.USER_SUBJECT} deleted`);
    const userSubject = await UserSubjectTable.findOne({
      where: { user_id, subject_id },
      paranoid: false,
    });

    if (userSubject && userSubject !== null) {
      this.logger.log('Done!');
      return userSubject.dataValues;
    }

    throw new NotFoundException(
      this.USER_SUBJECT,
      'findOneUserSubjectDeleted(user_id, subject_id)',
      [`${user_id}`, `${subject_id}`],
    );
  }

  async isUserSubjectDeletedPresent(
    user_id: number,
    subject_id: number,
  ): Promise<boolean> {
    this.logger.log(
      `GET ${this.USER_SUBJECT} to check if are any deleted records`,
    );
    const userSubject = await UserSubjectTable.findOne({
      where: { user_id, subject_id },
      paranoid: false,
    });

    if (userSubject && userSubject !== null) {
      this.logger.log('Present!');
      return true;
    }

    return false;
  }
  async findOneUserSubject(user_id: number, id: number) {
    this.logger.log(`GET ${this.USER_SUBJECT}`);
    const userSubject = await UserSubjectTable.findOne({
      where: { user_id, id },
    });

    if (userSubject && userSubject !== null) {
      this.logger.log('Done!');
      return userSubject.dataValues;
    }

    throw new NotFoundException(
      this.USER_SUBJECT,
      'findOneUserSubject(user_id, subject_id)',
      [`${user_id}`, `${id}`],
    );
  }

  async updateUserSubject(userSubject: any, transaction: any) {
    this.logger.log(`Update ${this.USER_SUBJECT} record on db`);
    const updatedUserSubject = await UserSubjectTable.update(userSubject, {
      where: { id: userSubject.id },
      paranoid: false,
      transaction,
    });
    if (updatedUserSubject && updatedUserSubject !== null) {
      this.logger.log('Done!');
      return updatedUserSubject;
    }
    throw new UpdateFailedException(
      this.USER_SUBJECT,
      'updateUserSubject(user_id)',
      [`${userSubject}`],
    );
  }

  async createSubject(subject: any, transaction: any): Promise<any> {
    this.logger.log(`Create ${this.SUBJECT} record on db`);
    const subjectCreated = await SubjectTable.create(subject, transaction);

    if (subjectCreated && subjectCreated !== null) {
      this.logger.log('Done!');
      return subjectCreated;
    }

    throw new InsertionFailedException(this.SUBJECT, 'createSubject(subject)', [
      `${subject}`,
    ]);
  }

  async createUserSubject(userSubject: any, transaction: any) {
    this.logger.log(`Create ${this.USER_SUBJECT} record on db`);
    const userSubjectCreated = await UserSubjectTable.create(
      userSubject,
      transaction,
    );
    if (userSubjectCreated && userSubjectCreated !== null) {
      this.logger.log('Done!');
      return userSubjectCreated;
    }

    throw new InsertionFailedException(
      this.USER_SUBJECT,
      'createUserSubject(subject)',
      [`${userSubject}`],
    );
  }

  async deleteUserSubject(id: number, transaction: any) {
    this.logger.log(`Delete ${this.USER_SUBJECT} record on db`);
    const deletedUserSubject = await UserSubjectTable.destroy({
      where: { id },
      transaction,
    });
    if (deletedUserSubject !== 1) {
      throw new DeletionFailedException(
        this.USER_SUBJECT,
        'deleteUserSubject(id)',
        [`${id}`],
      );
    }
    this.logger.log('Done!');
  }
}
