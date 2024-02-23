import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { UserTable } from 'src/db/models/user.model';
import { SubjectTable } from 'src/db/models/subject.model';
import { Sequelize } from 'sequelize-typescript';

@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private logger: Logger,
    private userService: UsersService,
    private sequelize: Sequelize,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Request() request: any,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    // look for user from the request
    const userPromise = new Promise<UserTable>((resolve) => {
      resolve(this.userService.findOneByEmail(request.user.username));
    });

    // look for subject
    const subjectPromise = new Promise<SubjectTable>((resolve) => {
      resolve(this.subjectsService.findSubjectByName(createSubjectDto.name));
    });

    // wait until both have completed
    const [user, subject] = await Promise.all([userPromise, subjectPromise]);

    // if subject is not present create subject and relative user_subject
    if (subject == null) {
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
        user.id,
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

    // look for user_subject
    const userSubject = await this.subjectsService.findOneUserSubjectDeleted(
      user.id,
      subject.id,
    );

    const transaction = await this.sequelize.transaction();

    // check if user_subject record exists
    if (userSubject == null) {
      // convert new user_subject
      const newUserSubject = this.subjectsService.convertNewUserSubject(
        createSubjectDto,
        user.id,
        subject.id,
      );
      // create user_subject
      await this.subjectsService.createUserSubject(newUserSubject, transaction);

      await transaction.commit();

      return HttpStatus.CREATED;
    } else if (userSubject.deletedAt !== null) {
      // set deletedAt at null and update the record on db
      userSubject.deletedAt = null;
      await this.subjectsService.updateUserSubject(userSubject, transaction);

      await transaction.commit();

      return HttpStatus.CREATED;
    }
  }
}
