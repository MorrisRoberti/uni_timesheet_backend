import { ExceptionInterface } from '../exception.interface';

export class UnauthorizedException implements ExceptionInterface {
  constructor(
    object: string,
    callingFunction: string,
    parameters: Array<string>,
  ) {
    this.object = object;
    this.callingFunction = callingFunction;
    this.parameters = parameters;
  }

  message = 'Unauthorized';
  statusCode = 401;
  object: string;
  callingFunction: string;
  parameters: Array<string>;
}
