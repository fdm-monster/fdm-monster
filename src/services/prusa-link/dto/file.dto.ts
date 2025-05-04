export interface PL_FilesDto {
  name: string;
  path: string;
  display: string;
  type: string;
  origin: string;
  children: ChildDto[];
}

/**
 * This DTO is not a child of PL_FilesDto, but instead separately defined.
 */
export interface PL_FileDto {
  name: string;
  origin: string; // local
  size: number;
  refs: RefsDto;
}

export interface ChildDto {
  name: string;
  display: string;
  path: string;
  origin: string;
  refs: RefsDto;
}

export interface RefsDto {
  resource: string;
  thumbnailSmall: string;
  thumbnailBig: string;
  download: string;
}
