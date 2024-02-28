import { ExceptionInterface } from '../exception.interface';

export class DuplicatedException implements ExceptionInterface {
  constructor(
    object: string,
    callingFunction: string,
    parameters: Array<string>,
  ) {
    this.object = object;
    this.callingFunction = callingFunction;
    this.parameters = parameters;
  }

  message = 'Duplicated';
  statusCode = 404;
  object: string;
  callingFunction: string;
  parameters: Array<string>;
}
