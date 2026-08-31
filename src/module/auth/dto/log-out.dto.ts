export class LogOutDto {
  userId: number;
  accessToken?: string;
  refreshToken?: string;
}

export class LogOutDtoResponse {
  success: boolean;
}
