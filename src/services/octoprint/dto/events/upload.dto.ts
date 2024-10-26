export interface UploadDto {
  name?: string;
  path?: string;
  target?: string;
  select?: boolean;
  print?: boolean;
  [k: string]: any;
}
