export interface ExceptionInterface {
  object: string;
  callingFunction: string;
  parameters: Array<string>;
  message: string;
  statusCode: number;
}
