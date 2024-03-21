export interface RpcResponseDto<T> {
  jsonrpc: string;
  id: number;
  result: T;
}
