export interface RpcErrorDto {
  jsonrpc: string;
  error: Error;
  id: number;
}

export interface Error {
  code: number
  message: string
}
