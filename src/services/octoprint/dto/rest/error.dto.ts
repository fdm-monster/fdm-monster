import { AxiosError } from "axios";

export type OctoprintErrorDto = AxiosError<OP_ErrorDto>;

export interface OP_ErrorDto {
  error: string;
}
