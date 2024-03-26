export interface JsonRpcErrorDto {
  jsonrpc: string;
  error: Error;
  id: number;
}

export interface Error {
  code: number;
  message: string;
}
