export interface JsonRpcResponseDto<T> {
  jsonrpc: "2.0" | string;
  id: number;
  result: T;
}
