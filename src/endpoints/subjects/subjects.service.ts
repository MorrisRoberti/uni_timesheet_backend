import { Injectable, Logger} from '@nestjs/common';
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
      name: createdSubjectDto.name,
      aa_left: createdSubjectDto.aa_left,
      aa_right: createdSubjectDto.aa_right,
      semester: createdSubjectDto.semester,
    };
    this.logger.log('Done!');
    return dbSubject;
  }

  convertArrayOfUserSubjectsToDto(userSubjects: Array<UserSubjectTable>) {
    this.logger.log('Converting UserSubject array from db to array of dto');
    const userSubjectsArrayDto = [];
    for(let i = 0; i<userSubjects.length; i++) {
      this.logger.log(`Converting object number ${i}...`);
      const userSubjectDB = userSubjects[i];
      const userSubjectDto = {
        id: userSubjectDB.id,
        name: userSubjectDB.name,
        cfu: userSubjectDB.cfu,
        semester: userSubjectDB.semester,
        aa_left: userSubjectDB.aa_left,
        aa_right: userSubjectDB.aa_right
      }
      this.logger.log('Ok');
      userSubjectsArrayDto.push(userSubjectDto);
    }
    this.logger.log('Done!');
    return userSubjectsArrayDto;
  }

  convertUpdatedUserSubject(
    updateUserSubject: UpdateSubjectDto,
    user_id: number,
    id: number
  ) {
    this.logger.log('Converting UPDATE Subject for Udating');
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

async isSubjectPresent(name: string) : Promise<boolean> {
  this.logger.log('Checking if subject is present');
  const subject = await SubjectTable.findOne({ where: { name } });

  if (subject && subject !== null) {
    this.logger.log('Present!');
    return true;
  }

  this.logger.log('Not Present!');
  return false;
}


async findAllUserSubjectsOfUser(user_id: number) {
    this.logger.log('GET All UserSubjects of User');
    const userSubjects = await UserSubjectTable.findAndCountAll({where: {user_id}, paranoid: true});
  
    if (userSubjects && userSubjects !== null) {
      this.logger.log('Done!');
      return userSubjects.rows;
    }

    // the error could be logged in the custom exception filter
    throw new NotFoundException('UserSubject', 'findAllUserSubjectsOfUser(user_id)', [`${user_id}`]);

}

  async findUserSubjectByName(name: string, user_id: number) {

      this.logger.log('GET UserSubject from name');
      const userSubject = await UserSubjectTable.findOne({
        where: { name, user_id },
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }
      throw new NotFoundException('UserSubject', 'findUserSubjectByName(name, user_id)', [name, `${user_id}`]);
  }
  async findSubjectByName(name: string) {
  
      this.logger.log('GET Subject from name');
      const subject = await SubjectTable.findOne({ where: { name } });

      if (subject && subject !== null) {
        this.logger.log('Done!');
        return subject.dataValues;
      }

      throw new NotFoundException('Subject', 'findSubjectByName(name)', [name]);

  }
  async findOneUserSubjectDeleted(user_id: number, subject_id: number) {

      this.logger.log('GET User Subject');
      const userSubject = await UserSubjectTable.findOne({
        where: { user_id, subject_id },
        paranoid: false,
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }

      throw new NotFoundException('UserSubject', 'findOneUserSubjectDeleted(user_id, subject_id)', [`${user_id}`, `${subject_id}`]);
      
  }

  async isUserSubjectDeletedPresent(user_id: number, subject_id: number) : Promise<boolean>{

    this.logger.log('GET User Subject');
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

      this.logger.log('GET User Subject');
      const userSubject = await UserSubjectTable.findOne({
        where: { user_id, id },
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }

      throw new NotFoundException('UserSubject', 'findOneUserSubject(user_id, subject_id)', [`${user_id}`, `${id}`]);

  }

  async updateUserSubject(user_subject: any, transaction: any) {

      this.logger.log('Update User Subject record on db');
      const userSubject = await UserSubjectTable.update(user_subject, {
        where: { id: user_subject.id },
        paranoid: false,
        transaction,
      });
      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject;
      }
      throw new UpdateFailedException('UserSubject', 'updateUserSubject(user_id)', [`${user_subject}`]);

  }

  async createSubject(subject: any, transaction: any): Promise<any> {
      this.logger.log('Create Subject record on db');
      const subjectCreated = await SubjectTable.create(subject, transaction);

      if (subjectCreated && subjectCreated !== null) {
        this.logger.log('Done!');
        return subjectCreated;
      }
      
      throw new InsertionFailedException('Subject', 'createSubject(subject)', [`${subject}`]);
  }

  async createUserSubject(user_subject: any, transaction: any) {
      this.logger.log('Create UserSubject record on db');
      const userSubjectCreated = await UserSubjectTable.create(
        user_subject,
        transaction,
      );
      if (userSubjectCreated && userSubjectCreated !== null) {
        this.logger.log('Done!');
        return userSubjectCreated;
      }

      throw new InsertionFailedException('UserSubject', 'createUserSubject(subject)', [`${user_subject}`]);
    
  }

  async deleteUserSubject(id: number, transaction: any) {
    try {
      this.logger.log('Eliminate UserSubject record on db');
      const t = await UserSubjectTable.destroy({ where: { id }, transaction });
      if(t !== 1){
        throw new DeletionFailedException('UserSubject', 'deleteUserSubject(id)', [`${id}`]);
      }
    } catch (error) {
      this.logger.error('Error during elimination of UserSubject');
    }
  }
}
