export interface NotifyButtonEventParams {
  name: string;
  type: "gpio";
  event: {
    // Seconds since last event
    elapsed_time: number;
    // Not unix time, time according asyncio monotonic clock
    received_time: number;
    // Not unix time, time according asyncio monotonic clock
    render_time: number;
    pressed: false;
  };
  aux: null | any;
}
