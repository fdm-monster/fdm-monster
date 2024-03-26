export interface SpoolmanProxyRequestDto<I> {
  request_method: string;
  path: string;
  query: string;
  body?: I;
}
