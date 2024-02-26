import { ExceptionInterface } from '../exception.interface';

export class DeletionFailedException implements ExceptionInterface {
  constructor(
    object: string,
    callingFunction: string,
    parameters: Array<string>,
  ) {
    this.object = object;
    this.callingFunction = callingFunction;
    this.parameters = parameters;
  }

  message = 'Deletion Failed';
  statusCode = 500;
  object: string;
  callingFunction: string;
  parameters: Array<string>;
}
