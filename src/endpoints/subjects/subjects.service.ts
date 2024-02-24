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

async findAllUserSubjectsOfUser(user_id: number) {
  try {
    this.logger.log('GET All UserSubjects of User');
    const userSubjects = await UserSubjectTable.findAndCountAll({where: {user_id}, paranoid: true});
  
    if (userSubjects && userSubjects !== null) {
      this.logger.log('Done!');
      return userSubjects.rows;
    }

    this.logger.log('UserSubjects not found');
    return null;
  } catch (error) {
    this.logger.error('Error during GET of all User Subjects of user');
  }
}

  async findUserSubjectByName(name: string, user_id: number) {
    try {
      this.logger.log('GET UserSubject from name');
      const userSubject = await UserSubjectTable.findOne({
        where: { name, user_id },
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }

      this.logger.log('UserSubject not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET UserSubject from name');
    }
  }
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
  async findOneUserSubjectDeleted(user_id: number, subject_id: number) {
    try {
      this.logger.log('GET User Subject');
      const userSubject = await UserSubjectTable.findOne({
        where: { user_id, subject_id },
        paranoid: false,
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }

      this.logger.log('User Subject not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET User Subject');
    }
  }
  async findOneUserSubject(user_id: number, subject_id: number) {
    try {
      this.logger.log('GET User Subject');
      const userSubject = await UserSubjectTable.findOne({
        where: { user_id, subject_id },
      });

      if (userSubject && userSubject !== null) {
        this.logger.log('Done!');
        return userSubject.dataValues;
      }

      this.logger.log('User Subject not found');
      return null;
    } catch (error) {
      this.logger.error('Error during GET User Subject');
    }
  }

  async updateUserSubject(user_subject: any, transaction: any) {
    try {
      this.logger.log('Update User Subject record on db');
      const userSubject = await UserSubjectTable.update(user_subject, {
        where: { id: user_subject.id },
        paranoid: false,
        transaction,
      });
      return userSubject;
    } catch (error) {
      this.logger.error('Error during UPDATE User Subject');
    }
  }

  async createSubject(subject: any, transaction: any): Promise<any> {
    try {
      this.logger.log('Create Subject record on db');
      const subjectCreated = await SubjectTable.create(subject, transaction);
      return subjectCreated;
    } catch (error) {
      this.logger.error('Error during creating of Subject');
    }
  }

  async createUserSubject(user_subject: any, transaction: any) {
    try {
      this.logger.log('Create UserSubject record on db');
      const userSubjectCreated = await UserSubjectTable.create(
        user_subject,
        transaction,
      );
      return userSubjectCreated;
    } catch (error) {
      this.logger.error('Error during creating of UserSubject');
    }
  }

  async deleteUserSubject(id: number, transaction: any) {
    try {
      this.logger.log('Eliminate UserSubject record on db');
      await UserSubjectTable.destroy({ where: { id }, transaction });
    } catch (error) {
      this.logger.error('Error during elimination of UserSubject');
    }
  }
}
