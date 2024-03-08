import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { NotFoundException } from './models/not-found.exception.model';
import { DeletionFailedException } from './models/deletion-failed.exception.model';
import { InsertionFailedException } from './models/insertion-failed.exception.model';
import { UpdateFailedException } from './models/update-failed.exception.model';
import { Request, Response } from 'express';
import { UnauthorizedException } from './models/not-found.exception.model copy';
import { DuplicatedException } from './models/duplicated.exception.model';

@Catch(
  NotFoundException,
  DeletionFailedException,
  InsertionFailedException,
  UpdateFailedException,
  UnauthorizedException,
  DuplicatedException,
)
export class DBExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request: Request | any = context.getRequest();
    const response: Response = context.getResponse();

    const status = exception.statusCode;
    const message = exception.message;
    const object = exception.object;
    const func = exception.callingFunction;
    const parameters = exception.parameters;
    const user_id = request.user.id;

    this.logger.error(message, {
      object,
      func,
      parameters,
      user: user_id,
    });
    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
