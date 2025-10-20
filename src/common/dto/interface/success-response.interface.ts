export interface Response<T> {
  path: string;
  timestamp: Date;
  statusCode: number;
  data: T;
}
