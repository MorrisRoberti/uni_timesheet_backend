import { Injectable, Logger } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UserCarreerTable } from 'src/db/models/user-carreer.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { UserExamsTable } from 'src/db/models/user-exams.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { Op } from 'sequelize';
import { DuplicatedException } from 'src/error_handling/models/duplicated.exception.model';

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

  updateAverageGrades(sum_of_grades: number, number_of_exams_passed: number) {
    let average_grade = 0;
    let average_graduation_grade = 0;

    if (number_of_exams_passed > 0) {
      average_grade = sum_of_grades / number_of_exams_passed;
      average_graduation_grade = average_grade * (110 / 31); // voto totale / voto massimo per esame
    }

    return { average_grade, average_graduation_grade };
  }

  convertUpdateUserCarreer(
    oldUserCareer: UserCarreerTable,
    convertedExam: any,
  ): UserCarreerTable {
    this.logger.log(`Updating ${this.USER_CARREER}`);
    const updatedUserCareer = Object.assign({}, oldUserCareer.dataValues);

    if (convertedExam.passed == true) {
      updatedUserCareer.number_of_exams_passed += 1;
      updatedUserCareer.sum_of_exams_grade += convertedExam.grade;
      const { average_grade, average_graduation_grade } =
        this.updateAverageGrades(
          updatedUserCareer.sum_of_exams_grade,
          updatedUserCareer.number_of_exams_passed,
        );
      updatedUserCareer.average_grade = average_grade;
      updatedUserCareer.average_graduation_grade = average_graduation_grade;
    }

    this.logger.log('Done!');

    return updatedUserCareer;
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

  // once the exam has been passed is not possible to add other tries
  async checkIfUserExamHasAlreadyBeenPassed(user_subject_id: number) {
    try {
      await this.findPassedUserExamBySubjectId(user_subject_id);
    } catch (e) {
      this.logger.log(
        `The ${this.USER_EXAM} associated with the user_subject_id 
        ${user_subject_id} has not been passed yet so 
        a new passed try can be inserted`,
      );
    }

    throw new DuplicatedException(
      this.USER_EXAM,
      'checkIfUserExamHasAlreadyBeenPassed(user_subject_id)',
      [`${user_subject_id}`],
    );
  }

  async findPassedUserExamBySubjectId(user_subject_id: number) {
    this.logger.log(`GET passed ${this.USER_EXAM} from user_subject_id`);
    const passedUserExamBySubjectId = await UserExamsTable.findOne({
      where: { [Op.and]: { user_subject_id, passed: 1 } },
      paranoid: true,
    });

    this.logger.log('Done!');
    if (passedUserExamBySubjectId && passedUserExamBySubjectId !== null) {
      this.logger.log('Done!');
      return passedUserExamBySubjectId;
    }

    throw new NotFoundException(
      this.USER_EXAM,
      'checkIfUserExamHasAlreadyBeenPassed(user_subject_id)',
      [`${user_subject_id}`],
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
      'createNewUserExamOnDb(userExam)',
      [userExam],
    );
  }

  async updateUserCarreerOnDb(updateUserCarreer: any, transaction: any) {
    this.logger.log(`Updating ${this.USER_CARREER} record on db`);
    const userCarreerUpdated = await UserCarreerTable.update(
      updateUserCarreer,
      {
        where: { id: updateUserCarreer.id },
        transaction,
      },
    );
    if (userCarreerUpdated && userCarreerUpdated !== null) {
      this.logger.log('Done!');
      return userCarreerUpdated;
    }

    throw new UpdateFailedException(
      this.USER_CARREER,
      'updateUserCarreerOnDb(use)',
      [updateUserCarreer],
    );
  }
}
