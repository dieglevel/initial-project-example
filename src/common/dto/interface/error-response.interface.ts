export interface ErrorResponse {
  path: string;
  timeStamp: Date;
  statusCode: number;
  message: string;
}

export interface BadRequestError {
  path: string;
  timeStamp: Date;
  statusCode: number;
  error: {
    field: string;
    messages: string[];
  };
}
