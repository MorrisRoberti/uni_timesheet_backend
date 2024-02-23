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

@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private logger: Logger,
    private userService: UsersService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(
    @Request() request: any,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    // look for user from the request
    const userPromise = new Promise(() => {
      return this.userService.findOneByEmail(request.user.username);
    });

    // look for subject
    const subjectPromise = new Promise(() => {
      return this.subjectsService.findSubjectByName(createSubjectDto.name);
    });

    // wait until both have completed
    const [user, subject] = await Promise.all([userPromise, subjectPromise]);

    // if subject is not present create subject and relative user_subject
    if (subject == null) {
      // converting subject
      const convertedSubject =
        this.subjectsService.convertNewSubject(createSubjectDto);
      // create subject
      await this.subjectsService.createSubject(convertedSubject);

      // converting user_subject
      const convertedUserSubject = this.subjectsService.convertNewUserSubject(
        createSubjectDto,
        user.id,
        subject.id,
      );
      // create user_subject
      await this.subjectsService.createUserSubject(convertedUserSubject);

      return HttpStatus.CREATED;
    }

    // look for user_subject

    // check if user_subject record exists
    // if exists ok
    // if exists but deleted, restore it
    // if not create it
    // return
  }
}
