export interface SpoolmanResponseDto<T> {
  response: T | null;
  error?: {
    status_code: number;
    message: string;
  };
}
