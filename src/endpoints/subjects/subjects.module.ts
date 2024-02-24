import { Module, Logger } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService, Logger],
})
export class SubjectsModule {}
