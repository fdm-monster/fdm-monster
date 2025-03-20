export interface PL_FileDto {
  name: string;
  path: string;
  display: string;
  type: string;
  origin: string;
  children: ChildrenDto[];
}

export interface ChildrenDto {
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
