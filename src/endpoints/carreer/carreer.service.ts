import { Injectable, Logger } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UserCarreerTable } from 'src/db/models/user-carreer.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { UserExamsTable } from 'src/db/models/user-exams.model';

@Injectable()
export class CarreerService {
  constructor(private logger: Logger) {}

  USER_EXAM = 'UserExam';
  USER_CARREER = 'User Carreer';

  convertNewUserExam(
    createExamDto: CreateExamDto,
    user_subject_name: string,
    user_carreer_id: number,
  ) {
    this.logger.log(`Creating new ${this.USER_EXAM}`);

    let passed = false;
    if (createExamDto.grade >= createExamDto.minimum_passing_grade)
      passed = true;

    const convertedUserExam = {
      user_carreer_id,
      user_subject_id: createExamDto.user_subject_id,
      passed,
      grade: createExamDto.grade,
      date: createExamDto.date,
      user_subject_name: user_subject_name,
    };
    this.logger.log('Done!');

    return convertedUserExam;
  }

  async findUserCarreerFromUserId(user_id: number): Promise<UserCarreerTable> {
    this.logger.log(`GET ${this.USER_CARREER}`);
    const userCarreer = await UserCarreerTable.findOne({
      where: { user_id },
      paranoid: true,
    });

    if (userCarreer && userCarreer !== null) {
      this.logger.log('Done!');
      return userCarreer;
    }

    throw new NotFoundException(
      this.USER_CARREER,
      'findUserCarreerFromUserId(user_id)',
      [`${user_id}`],
    );
  }

  async createNewUserExamOnDb(userExam: any, transaction: any) {
    this.logger.log(`Creating ${this.USER_EXAM} record on db`);
    const userExamCreated = await UserExamsTable.create(userExam, {
      transaction,
    });
    if (userExamCreated && userExamCreated !== null) {
      this.logger.log('Done!');
      return userExamCreated;
    }

    throw new InsertionFailedException(
      this.USER_EXAM,
      'createNewUserExamOnDb(user_exam)',
      [userExam],
    );
  }
}
