import { Injectable, Logger, Param } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectTable } from 'src/db/models/subject.model';
import { UserSubjectTable } from 'src/db/models/user-subject.model';

@Injectable()
export class SubjectsService {
  constructor(private logger: Logger) {}

  convertNewSubject(createdSubjectDto: CreateSubjectDto) {
    this.logger.log('Converting NEW Subject for Creation');
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
    this.logger.log('Converting NEW Subject for Creation');
    const dbSubject = {
      id: null,
      user_id,
      subject_id,
      cfu: createdSubjectDto.cfu,
    };
    this.logger.log('Done!');
    return dbSubject;
  }

  // db functions

  async findSubjectByName(name: string) {
    try {
      this.logger.log('GET Subject from name');
      const subject = await SubjectTable.findOne({ where: { name } });

      if (subject && subject !== null) {
        this.logger.log('Done!');
        return subject.dataValues;
      }

      this.logger.log('Subject not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET Subject from name');
    }
  }

  async createSubject(subject: any) {
    try {
      this.logger.log('Create Subject record on db');
      const subjectCreated = await SubjectTable.create(subject);
      return subjectCreated;
    } catch (error) {
      this.logger.error('Error during creating of Subject');
    }
  }

  async createUserSubject(user_subject: any) {
    try {
      this.logger.log('Create UserSubject record on db');
      const userSubjectCreated = await UserSubjectTable.create(user_subject);
      return userSubjectCreated;
    } catch (error) {
      this.logger.error('Error during creating of UserSubject');
    }
  }
}
