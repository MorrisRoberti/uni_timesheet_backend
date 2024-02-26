import { ExceptionInterface } from '../exception.interface';

export class InsertionFailedException implements ExceptionInterface {
  constructor(
    object: string,
    callingFunction: string,
    parameters: Array<string>,
  ) {
    this.object = object;
    this.callingFunction = callingFunction;
    this.parameters = parameters;
  }

  message = 'Insertion Failed';
  statusCode = 500;
  object: string;
  callingFunction: string;
  parameters: Array<string>;
}
