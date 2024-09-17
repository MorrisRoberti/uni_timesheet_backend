import { Injectable, Logger } from '@nestjs/common';
import { CreateExamDto } from './dto/create-exam.dto';
import { NotFoundException } from 'src/error_handling/models/not-found.exception.model';
import { UserCarreerTable } from 'src/db/models/user-carreer.model';
import { InsertionFailedException } from 'src/error_handling/models/insertion-failed.exception.model';
import { UserExamsTable } from 'src/db/models/user-exams.model';
import { UpdateFailedException } from 'src/error_handling/models/update-failed.exception.model';
import { Op, Transaction } from 'sequelize';
import { DuplicatedException } from 'src/error_handling/models/duplicated.exception.model';
import { format } from 'date-fns';
import { UserSubjectTable } from 'src/db/models/user-subject.model';
import { UpdateExamDto } from './dto/update-exam.dto';

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
      accepted: passed == true ? createExamDto.accepted : true, // I can chose to accept/refuse a grade only if i pass the exam
      grade: createExamDto.grade,
      date: createExamDto.date,
      user_subject_name: user_subject_name,
    };
    this.logger.log('Done!');

    return convertedUserExam;
  }

  convertUpdateUserExam(
    updateExamDto: UpdateExamDto,
    user_subject_name: string,
  ) {
    this.logger.log(`Converting update ${this.USER_EXAM}`);

    let passed = false;
    if (updateExamDto.grade >= updateExamDto.minimum_passing_grade)
      passed = true;

    const convertedUserExam = {
      user_carreer_id: updateExamDto.carreer_id,
      user_subject_id: updateExamDto.user_subject_id,
      passed,
      accepted: passed == true ? updateExamDto.accepted : true, // I can chose to accept/refuse a grade only if i pass the exam
      grade: updateExamDto.grade,
      date: updateExamDto.date,
      user_subject_name: user_subject_name,
    };
    this.logger.log('Done!');

    return convertedUserExam;
  }

  convertUserCarreerFromDb(userCarreer: UserCarreerTable) {
    this.logger.log(`Converting ${this.USER_CARREER} from db to return object`);

    const fixed_grad_grade =
      userCarreer.average_graduation_grade > 0
        ? parseFloat(userCarreer.average_graduation_grade.toFixed(2))
        : 0;

    const fixed_grade =
      userCarreer.average_grade > 0
        ? parseFloat(userCarreer.average_grade.toFixed(2))
        : 0;

    const convertedUserCarreer = {
      average_grade: fixed_grade,
      average_graduation_grade: fixed_grad_grade,
      total_cfu: userCarreer.total_cfu,
      number_of_exams_passed: userCarreer.number_of_exams_passed,
    };

    this.logger.log(`Done!`);
    return convertedUserCarreer;
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
    cfu: number,
  ): UserCarreerTable {
    this.logger.log(`Updating ${this.USER_CARREER}`);
    const updatedUserCareer = Object.assign({}, oldUserCareer.dataValues);

    if (convertedExam.passed == true && convertedExam.accepted == true) {
      updatedUserCareer.number_of_exams_passed += 1;
      updatedUserCareer.sum_of_exams_grade += convertedExam.grade;
      updatedUserCareer.total_cfu += cfu;
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

  convertUpdateUserCarreerWhenUpdatingToNonPassedExam(
    oldUserCareer: UserCarreerTable,
    convertedExam: any,
    oldExam: UserExamsTable,
    cfu: number,
  ): UserCarreerTable {
    this.logger.log(
      `Updating ${this.USER_CARREER} with an exam that has gone from passed to non passed/refused`,
    );
    const updatedUserCareer = Object.assign({}, oldUserCareer.dataValues);

    if (oldExam.passed == true && oldExam.accepted == true) {
      updatedUserCareer.number_of_exams_passed -= 1;
      updatedUserCareer.sum_of_exams_grade -= oldExam.grade;
      updatedUserCareer.total_cfu -= cfu;
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

  aggregateArrayOfUserExamsBySubject(arrayOfUserExams: Array<any>): Array<any> {
    this.logger.log(`Aggregating array of ${this.USER_EXAM} for subject`);

    const aggregatedArrayOfUserExams = [];
    const arrayOfUserSubjects = new Map<
      number,
      { user_subject_name: string; cfu: number; semester: number; aa: string }
    >();
    // I get all the user_subjects_id to make the aggregation
    arrayOfUserExams.forEach((userExam) => {
      if (arrayOfUserSubjects.has(userExam.user_subject_id) == false) {
        arrayOfUserSubjects.set(userExam.user_subject_id, {
          user_subject_name: userExam.user_subject_name,
          cfu: userExam.cfu,
          semester: userExam.semester,
          aa: userExam.aa,
        });
      }
    });

    // I aggregate the records following the previously get user_subject_id
    arrayOfUserSubjects.forEach((userSubjectObject, key) => {
      const userExamsAggregated = arrayOfUserExams.filter(
        (userExam) => userExam.user_subject_id === key,
      );

      const examObjectComposed = {
        user_subject_id: key,
        user_subject_name: userSubjectObject.user_subject_name,
        cfu: userSubjectObject.cfu,
        semester: userSubjectObject.semester,
        aa: userSubjectObject.aa,
        user_exams: userExamsAggregated,
      };

      aggregatedArrayOfUserExams.push(examObjectComposed);
    });

    this.logger.log('Done!');
    return aggregatedArrayOfUserExams;
  }

  convertArrayOfUserExamsFromDb(
    arrayOfUserExams: Array<UserExamsTable>,
  ): Array<any> {
    this.logger.log(
      `Converting array of ${this.USER_EXAM} from db to return object`,
    );

    const convertedArrayOfUserExams = [];

    arrayOfUserExams.forEach((userExam) => {
      const convertedUserExam = {
        id: userExam.id,
        user_subject_id: userExam.user_subject_id,
        user_subject_name: userExam.user_subject_name,
        grade: userExam.grade,
        cfu: userExam.user_subject_table.cfu,
        semster: userExam.user_subject_table.semester,
        aa: `${userExam.user_subject_table.aa_left}/${userExam.user_subject_table.aa_right}`,
        passed: userExam.passed,
        accepted: userExam.accepted,
        date: format(userExam.date, 'yyyy-MM-dd'),
      };

      convertedArrayOfUserExams.push(convertedUserExam);
    });

    this.logger.log('Done!');
    return convertedArrayOfUserExams;
  }

  // DB

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
  async checkIfUserExamHasAlreadyBeenPassed(
    newUserExam: CreateExamDto | UpdateExamDto,
    user_subject_id: number,
  ) {
    let passedUserExam;
    try {
      passedUserExam =
        await this.findPassedUserExamBySubjectId(user_subject_id);
    } catch (e) {
      this.logger.log(
        `The ${this.USER_EXAM} associated with the user_subject_id 
        ${user_subject_id} has not been passed yet so 
        a new passed try can be inserted`,
      );
    }

    // I make this control because if the incoming exam is a failed tentative inserted after or a refused, it should be inserted normally
    if (
      passedUserExam &&
      newUserExam.grade >= newUserExam.minimum_passing_grade &&
      newUserExam.accepted == true
    ) {
      throw new DuplicatedException(
        this.USER_EXAM,
        'checkIfUserExamHasAlreadyBeenPassed(user_subject_id)',
        [`${user_subject_id}`],
      );
    }
  }

  async findPassedUserExamBySubjectId(
    user_subject_id: number,
  ): Promise<UserExamsTable> {
    this.logger.log(`GET passed ${this.USER_EXAM} from user_subject_id`);
    const passedUserExamBySubjectId = await UserExamsTable.findOne({
      where: { [Op.and]: { user_subject_id, passed: 1, accepted: 1 } },
      paranoid: true,
    });

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

  async findNonPassedUserExamsByCarreerId(
    user_carreer_id: number,
  ): Promise<Array<UserExamsTable>> {
    this.logger.log(`GET NON passed ${this.USER_EXAM} from user_carreer_id`);
    const nonPassedUserExamsByCarrerId = await UserExamsTable.findAll({
      where: { [Op.and]: { user_carreer_id, passed: 0 } },
      include: [
        {
          model: UserSubjectTable,
          attributes: ['cfu', 'semester', 'aa_left', 'aa_right'],
        },
      ],
      paranoid: true,
    });

    if (nonPassedUserExamsByCarrerId && nonPassedUserExamsByCarrerId !== null) {
      this.logger.log('Done!');
      return nonPassedUserExamsByCarrerId;
    }

    throw new NotFoundException(
      this.USER_EXAM,
      'findNonPassedUserExamsByCarreerId(user_carreer_id)',
      [`${user_carreer_id}`],
    );
  }

  async findAllUserExamsByCarreerId(
    user_carreer_id: number,
  ): Promise<Array<UserExamsTable>> {
    this.logger.log(`GET ALL ${this.USER_EXAM} from user_carreer_id`);
    const allUserExamsByCarrerId = await UserExamsTable.findAll({
      where: { [Op.and]: { user_carreer_id } },
      include: [
        {
          model: UserSubjectTable,
          attributes: ['cfu', 'semester', 'aa_left', 'aa_right'],
        },
      ],
      paranoid: true,
    });

    if (allUserExamsByCarrerId && allUserExamsByCarrerId !== null) {
      this.logger.log('Done!');
      return allUserExamsByCarrerId;
    }

    throw new NotFoundException(
      this.USER_EXAM,
      'findAllUserExamsByCarreerId(user_carreer_id)',
      [`${user_carreer_id}`],
    );
  }

  async findPassedUserExamsByCarreerId(
    user_carreer_id: number,
  ): Promise<Array<UserExamsTable>> {
    this.logger.log(`GET passed ${this.USER_EXAM} from user_carreer_id`);
    const passedUserExamByCarrerId = await UserExamsTable.findAll({
      where: { [Op.and]: { user_carreer_id, passed: 1, accepted: 1 } },
      include: [
        {
          model: UserSubjectTable,
          attributes: ['cfu', 'semester', 'aa_left', 'aa_right'],
        },
      ],
      paranoid: true,
    });

    if (passedUserExamByCarrerId && passedUserExamByCarrerId !== null) {
      this.logger.log('Done!');
      return passedUserExamByCarrerId;
    }

    throw new NotFoundException(
      this.USER_EXAM,
      'findPassedUserExamsByCarreerId(user_carreer_id)',
      [`${user_carreer_id}`],
    );
  }

  async findRefusedUserExamsByCarreerId(
    user_carreer_id: number,
  ): Promise<Array<UserExamsTable>> {
    this.logger.log(`GET refused ${this.USER_EXAM} from user_carreer_id`);
    const refusedUserExamByCarrerId = await UserExamsTable.findAll({
      where: { [Op.and]: { user_carreer_id, passed: 1, accepted: 0 } },
      include: [
        {
          model: UserSubjectTable,
          attributes: ['cfu', 'semester', 'aa_left', 'aa_right'],
        },
      ],
      paranoid: true,
    });

    if (refusedUserExamByCarrerId && refusedUserExamByCarrerId !== null) {
      this.logger.log('Done!');
      return refusedUserExamByCarrerId;
    }

    throw new NotFoundException(
      this.USER_EXAM,
      'findRefusedUserExamsByCarreerId(user_carreer_id)',
      [`${user_carreer_id}`],
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
      'updateUserCarreerOnDb(updateUserCarreer)',
      [updateUserCarreer],
    );
  }

  async updateUserExamOnDb(
    updateUserExam: any,
    user_exam_id: number,
    transaction: Transaction,
  ) {
    this.logger.log(`Updating ${this.USER_EXAM} record on db`);
    const userExamUpdated = await UserExamsTable.update(updateUserExam, {
      where: { id: user_exam_id },
      transaction,
    });
    if (userExamUpdated && userExamUpdated !== null) {
      this.logger.log('Done!');
      return userExamUpdated;
    }

    throw new UpdateFailedException(
      this.USER_EXAM,
      'updateUserExamOnDb(updateUserExam)',
      [updateUserExam],
    );
  }

  async findUserExamFromId(id: number): Promise<UserExamsTable> {
    this.logger.log(`GET ${this.USER_EXAM} from id`);
    const userExam = await UserExamsTable.findOne({
      where: { id },
      paranoid: true,
    });

    if (userExam && userExam !== null) {
      this.logger.log('Done!');
      return userExam;
    }

    throw new NotFoundException(this.USER_EXAM, 'findUserExamFromId(id)', [
      `${id}`,
    ]);
  }
}
