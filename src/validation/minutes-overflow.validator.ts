import { Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CreateHourLogDto } from 'src/endpoints/hour-logs/dto/create-hour-log.dto';

@ValidatorConstraint({ name: 'MinutesOverflow', async: true })
@Injectable()
export class MinutesOverflowConstraint implements ValidatorConstraintInterface {
  constructor() {}

  async validate(minutes: any, args: ValidationArguments): Promise<boolean> {
    // prendo le ore
    const { hours } = <CreateHourLogDto>args.object;

    if (hours == 24) return false;
    return true;
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
    return 'Minutes cannot be more than 0 if the hours value is 24';
  }
}
