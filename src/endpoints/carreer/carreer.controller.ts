import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Sequelize } from 'sequelize-typescript';
import { DBExceptionFilter } from 'src/error_handling/db.exception.filter';
import { HourLogsService } from '../hour-logs/hour-logs.service';
import { SubjectsService } from '../subjects/subjects.service';
import { CarreerService } from './carreer.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@UseGuards(AuthGuard('jwt'))
@UseFilters(DBExceptionFilter)
@Controller('carreer')
export class CarreerController {
  constructor(
    private readonly hourLogsService: HourLogsService,
    private sequelize: Sequelize,
    private readonly subjectsService: SubjectsService,
    private readonly carreerService: CarreerService,
  ) {}

  // Get the carreer information
  @Get('carreer-information')
  async getCarreerInformation(@Request() request: any) {
    // get the user_carreer
    const userCarreer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // convert the user_carreer
    const convertedUserCareer =
      this.carreerService.convertUserCarreerFromDb(userCarreer);

    return convertedUserCareer;
  }

  @Post('create-exam')
  async createExam(
    @Request() request: any,
    @Body() createExamDto: CreateExamDto,
  ) {
    // get the user_carreer
    const userCarreer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get the userSubject
    const userSubject = await this.subjectsService.findOneUserSubject(
      request.user.id,
      createExamDto.user_subject_id,
    );

    // find existing exam passed, if it exists the new created cannot be inserted
    await this.carreerService.checkIfUserExamHasAlreadyBeenPassed(
      createExamDto,
      createExamDto.user_subject_id,
    );

    // convert the exam
    const convertedExam = this.carreerService.convertNewUserExam(
      createExamDto,
      userSubject.name,
      userCarreer.id,
    );

    // start the transaction
    const transaction = await this.sequelize.transaction();

    // insert the exam on db
    await this.carreerService.createNewUserExamOnDb(convertedExam, transaction);

    // create object for update user_carreer (if passed == true): total_cfu, average_grade and average_graduation_grade
    const updatedUserCarreer =
      this.carreerService.convertUpdateUserCarreerWhenCreatingUserExam(
        userCarreer,
        convertedExam,
        userSubject.cfu,
      );

    // update user carreer on db
    await this.carreerService.updateUserCarreerOnDb(
      updatedUserCarreer,
      transaction,
    );

    await transaction.commit();
    return HttpStatus.CREATED;
  }

  // update the exam result and accptance and handle the carreer accordingly
  // if after this exam is inserted a successful try the update of acceptance and passed will not be possible
  @Put('update-exam/:id')
  async updateExam(
    @Request() request: any,
    @Body() updateExamDto: UpdateExamDto,
    @Param('id') id: number,
  ) {
    // get the user_subject
    const userSubject = await this.subjectsService.findOneUserSubject(
      request.user.id,
      updateExamDto.user_subject_id,
    );

    // check if the exam exists
    const oldExam = await this.carreerService.findUserExamFromId(id);

    // get the user carreer
    const userCarreer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // in any case I convert the user_exam to have it ready for the update
    const convertUpdateUserExam =
      this.carreerService.convertUpdateUserExam(updateExamDto);

    // CASE 1: if the exam will be put to passed I need to check if there is another passed exam for the same subj
    if (
      updateExamDto.grade >= updateExamDto.minimum_passing_grade &&
      updateExamDto.accepted == true &&
      (oldExam.passed == false || oldExam.accepted == false)
    ) {
      // find possible other successful tries and return an error if found
      await this.carreerService.checkIfUserExamHasAlreadyBeenPassed(
        updateExamDto,
        userSubject.id,
      );

      const transaction = await this.sequelize.transaction();

      // update the user_exam
      await this.carreerService.updateUserExamOnDb(
        convertUpdateUserExam,
        oldExam.id,
        transaction,
      );

      // convert the user_carreer updating the fields that depend on passed exams
      const convertedUpdatedUserCarreer =
        this.carreerService.convertUpdateUserCarreer(
          userCarreer,
          convertUpdateUserExam,
          oldExam,
          userSubject.cfu,
        );

      // update user_carreer
      await this.carreerService.updateUserCarreerOnDb(
        convertedUpdatedUserCarreer,
        transaction,
      );

      await transaction.commit();

      return HttpStatus.OK;
    } else if (
      updateExamDto.grade >= updateExamDto.minimum_passing_grade &&
      updateExamDto.accepted == true &&
      oldExam.passed == true &&
      oldExam.accepted == true
    ) {
      const transaction = await this.sequelize.transaction();

      // update the user_exam
      await this.carreerService.updateUserExamOnDb(
        convertUpdateUserExam,
        oldExam.id,
        transaction,
      );

      // convert the user_carreer updating the fields that depend on passed exams
      const convertedUpdatedUserCarreer =
        this.carreerService.convertUpdateUserCarreer(
          userCarreer,
          convertUpdateUserExam,
          oldExam,
          userSubject.cfu,
        );

      // update user_carreer
      await this.carreerService.updateUserCarreerOnDb(
        convertedUpdatedUserCarreer,
        transaction,
      );

      await transaction.commit();

      return HttpStatus.OK;
    }

    // CASE 2: the exam is set to not passed

    // convert the user_carreer updating the fields that depend on passed exams
    const convertedUpdatedUserCarreer =
      this.carreerService.convertUpdateUserCarreerWhenRemovingPassedExam(
        userCarreer,
        oldExam,
        userSubject.cfu,
      );

    const transaction = await this.sequelize.transaction();

    // update the user_exam
    await this.carreerService.updateUserExamOnDb(
      convertUpdateUserExam,
      oldExam.id,
      transaction,
    );

    // update user career
    await this.carreerService.updateUserCarreerOnDb(
      convertedUpdatedUserCarreer,
      transaction,
    );

    await transaction.commit();

    return HttpStatus.OK;
  }

  // when a passed+accepted try is eliminated, logically destroy the record and update the user_carreer: grade, total_grade, averages and exams passed
  // when another type of exam is eliminated just delete the record
  @Delete('delete-exam/:id')
  async deleteExam(@Request() request: any, @Param('id') id: number) {
    // get user_carreer
    const userCareer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get the user_exam
    const userExamToDelete = await this.carreerService.findUserExamFromId(id);

    // get the user_subject
    const userSubject = await this.subjectsService.findOneUserSubject(
      request.user.id,
      userExamToDelete.user_subject_id,
    );

    const transaction = await this.sequelize.transaction();

    // delete user_exam
    await this.carreerService.deleteUserExamFromId(id, transaction);

    // check if the exam is passed and accepted, in this case destroy it and update the user_carreer
    if (userExamToDelete.passed == true && userExamToDelete.accepted == true) {
      // build new user_carreer
      const userCareerToUpdate =
        this.carreerService.convertUpdateUserCarreerWhenRemovingPassedExam(
          userCareer,
          userExamToDelete,
          userSubject.cfu,
        );

      // update user carreer
      await this.carreerService.updateUserCarreerOnDb(
        userCareerToUpdate,
        transaction,
      );
    }

    await transaction.commit();

    return HttpStatus.OK;
  }

  // Get all not passed exams
  @Get('get-all-non-passed-exams')
  async getAllNonPassedExams(@Request() request: any) {
    // get urser carreer
    const userCareer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get user_exams that are non passed and not deleted
    const nonPassedUserExamsFromDb =
      await this.carreerService.findNonPassedUserExamsByCarreerId(
        userCareer.id,
      );

    // convert all user_exam
    const convertedUserExams =
      this.carreerService.convertArrayOfUserExamsFromDb(
        nonPassedUserExamsFromDb,
      );

    // aggregate them by subject
    const nonPassedUserExams =
      this.carreerService.aggregateArrayOfUserExamsBySubject(
        convertedUserExams,
      );

    return nonPassedUserExams;
  }

  // Get all passed exams
  @Get('get-all-passed-exams')
  async getAllPassedUserExams(@Request() request: any) {
    // get urser carreer
    const userCareer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get user_exams that are passed and not deleted
    const passedUserExamsFromDb =
      await this.carreerService.findPassedUserExamsByCarreerId(userCareer.id);

    // convert all user_exam
    const convertedUserExams =
      this.carreerService.convertArrayOfUserExamsFromDb(passedUserExamsFromDb);

    // aggregate them by subject
    const passedUserExams =
      this.carreerService.aggregateArrayOfUserExamsBySubject(
        convertedUserExams,
      );

    return passedUserExams;
  }

  // Get all refused exams
  @Get('get-refused-exams')
  async getAllRefusedUserExams(@Request() request: any) {
    // get urser carreer
    const userCareer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get user_exams that are refused and not deleted
    const refusedUserExamsFromDb =
      await this.carreerService.findRefusedUserExamsByCarreerId(userCareer.id);

    // convert all user_exam
    const convertedUserExams =
      this.carreerService.convertArrayOfUserExamsFromDb(refusedUserExamsFromDb);

    // aggregate them by subject
    const refusedUserExams =
      this.carreerService.aggregateArrayOfUserExamsBySubject(
        convertedUserExams,
      );

    return refusedUserExams;
  }

  // Get all exams aggregated by user_subject_id (passed, not passed, refused)
  @Get('get-all-exams')
  async getAllUserExams(@Request() request: any) {
    // get urser carreer
    const userCareer = await this.carreerService.findUserCarreerFromUserId(
      request.user.id,
    );

    // get user_exams that all non deleted user exams
    const userExamsFromDb =
      await this.carreerService.findAllUserExamsByCarreerId(userCareer.id);

    // convert all user_exam
    const convertedUserExams =
      this.carreerService.convertArrayOfUserExamsFromDb(userExamsFromDb);

    // aggregate them by subject
    const userExams =
      this.carreerService.aggregateArrayOfUserExamsBySubject(
        convertedUserExams,
      );

    return userExams;
  }
}
