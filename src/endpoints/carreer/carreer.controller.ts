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
    const updatedUserCarreer = this.carreerService.convertUpdateUserCarreer(
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
  // @Put('update-exam/:id')
  // async updateExam(
  //   @Request() request: any,
  //   @Body() updateExamDto: UpdateExamDto,
  //   @Param('id') id: number,
  // ) {

  // get the user_subject

  // find possible other successful tries and return an error if found

  // convert dto

  // if its passed and accepted convert user_carreer

  // const transaction = await this.sequelize.transaction();

  // update user career

  // await transaction.commit();

  //   return HttpStatus.OK;
  // }

  // when a passed+accepted try is eliminated, logically destroy the record and update the user_carreer: grade, total_grade, averages and exams passed
  // @Delete('delete-exam/:id')
  // async deleteExam(@Request() request: any, @Param('id') id: number) {
  //   return HttpStatus.OK;
  // }

  // Get all not passed exams

  // Get all passed exams

  // Get all exams aggregated by user_subject_id (passed, not passed, refused)
}
