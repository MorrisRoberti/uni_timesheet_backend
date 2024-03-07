import { ValidationOptions, registerDecorator } from 'class-validator';
import { MinutesOverflowConstraint } from '../minutes-overflow.validator';

export function MinutesOverflow(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: MinutesOverflowConstraint,
    });
  };
}
