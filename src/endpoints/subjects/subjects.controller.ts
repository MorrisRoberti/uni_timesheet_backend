import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
  Request,
  HttpStatus,
  Put,
  UseFilters,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AuthGuard } from '@nestjs/passport';
import { Sequelize } from 'sequelize-typescript';
import { DBExceptionFilter } from 'src/error_handling/db.exception.filter';

@UseGuards(AuthGuard('jwt'))
@UseFilters(DBExceptionFilter)
@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private logger: Logger,
    private sequelize: Sequelize,
  ) {}

  @Get()
  async findAll(@Request() request: any) {
    const userSubjects = await this.subjectsService.findAllUserSubjectsOfUser(
      request.user.id,
    );

    // I convert the objects back to the Dto format to hide sensible data
    const userSubjectsConverted =
      this.subjectsService.convertArrayOfUserSubjectsToDto(userSubjects);

    return userSubjectsConverted;
  }

  @Post()
  async create(
    @Request() request: any,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    // look for subject
    const isPresent = await this.subjectsService.isSubjectPresent(
      createSubjectDto.name,
    );

    // if subject is not present create subject and relative user_subject
    if (isPresent == false) {
      const transaction = await this.sequelize.transaction();
      // converting subject
      const convertedSubject =
        this.subjectsService.convertNewSubject(createSubjectDto);
      // create subject
      const newSubject = await this.subjectsService.createSubject(
        convertedSubject,
        transaction,
      );

      // converting user_subject
      const convertedUserSubject = this.subjectsService.convertNewUserSubject(
        createSubjectDto,
        request.user.id,
        newSubject.id,
      );
      // create user_subject
      await this.subjectsService.createUserSubject(
        convertedUserSubject,
        transaction,
      );

      await transaction.commit();

      return HttpStatus.CREATED;
    }

    const subject = await this.subjectsService.findSubjectByName(
      createSubjectDto.name,
    );

    // look for user_subject
    const isUserSubjectPresent =
      await this.subjectsService.isUserSubjectDeletedPresent(
        request.user.id,
        subject.id,
      );

    const transaction = await this.sequelize.transaction();

    // check if user_subject record exists
    if (isUserSubjectPresent == false) {
      // convert new user_subject
      const newUserSubject = this.subjectsService.convertNewUserSubject(
        createSubjectDto,
        request.user.id,
        subject.id,
      );
      // create user_subject
      await this.subjectsService.createUserSubject(newUserSubject, transaction);

      await transaction.commit();

      return HttpStatus.CREATED;
    }

    const userSubject = await this.subjectsService.findOneUserSubjectDeleted(
      request.user.id,
      subject.id,
    );

    if (userSubject.deletedAt !== null) {
      // set deletedAt at null and update the record on db
      userSubject.deletedAt = null;
      await this.subjectsService.updateUserSubject(userSubject, transaction);

      await transaction.commit();

      return HttpStatus.CREATED;
    }
  }

  @Delete('/:id')
  async delete(@Request() request: any, @Param('id') id: number) {
    // look for the user_subject
    const userSubject = await this.subjectsService.findOneUserSubject(
      request.user.id,
      id,
    );

    const transaction = await this.sequelize.transaction();

    // delete the subject
    await this.subjectsService.deleteUserSubject(userSubject.id, transaction);

    await transaction.commit();

    return HttpStatus.OK;
  }

  @Put('/:id')
  async update(
    @Request() request: any,
    @Param('id') id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    // convert user_subject in db object
    const userSubjectConverted = this.subjectsService.convertUpdatedUserSubject(
      updateSubjectDto,
      request.user.id,
      id,
    );

    const transaction = await this.sequelize.transaction();

    await this.subjectsService.updateUserSubject(
      userSubjectConverted,
      transaction,
    );

    await transaction.commit();

    return HttpStatus.OK;
  }
}
