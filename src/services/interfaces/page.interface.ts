export const DEFAULT_PAGE: IPagination = {
  page: 0,
  pageSize: 50,
};

export interface IPagination {
  page: number;
  pageSize: number;
}
