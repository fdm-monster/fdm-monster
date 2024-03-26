export interface JsonRpcRequestDto<I = Record<string, any>> {
  jsonrpc: "2.0" | string;
  method: string;
  id: number;
  // MQTT may provide mqtt_timestamp param
  // "To avoid potential collisions from time drift it is recommended to specify the timestamp in microseconds since the Unix Epoch"
  // QoS 0 or 2
  params?: I;
}
