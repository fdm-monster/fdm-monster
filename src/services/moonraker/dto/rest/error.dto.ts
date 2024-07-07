import { AxiosError } from "axios";

export type MoonrakerErrorDto = AxiosError<ErrorDto>;

export interface ErrorDto {
  error: Error;
}

export interface Error {
  code: number;
  message: string;
  traceback: string;
}
