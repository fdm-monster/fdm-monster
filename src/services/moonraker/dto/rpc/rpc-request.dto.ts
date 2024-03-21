export interface JsonRpcRequestDto {
  jsonrpc: string;
  method: string;
  // MQTT may provide mqtt_timestamp param
  // "To avoid potential collisions from time drift it is recommended to specify the timestamp in microseconds since the Unix Epoch"
  // QoS 0 or 2
  params: Record<string, any>;
  id: number;
}
