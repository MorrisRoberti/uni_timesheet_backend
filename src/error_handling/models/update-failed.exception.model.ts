import { ExceptionInterface } from '../exception.interface';

export class UpdateFailedException implements ExceptionInterface {
  constructor(
    object: string,
    callingFunction: string,
    parameters: Array<string>,
    message?: string,
  ) {
    this.object = object;
    this.callingFunction = callingFunction;
    this.parameters = parameters;
    this.message = message;
  }

  message = 'Update Failed';
  statusCode = 500;
  object: string;
  callingFunction: string;
  parameters: Array<string>;
}
