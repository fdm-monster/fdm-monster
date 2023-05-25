export interface ITask {
  name: string;
  willExecute: () => Promise<boolean> | boolean;
  execute: () => Promise<any | void> | void;
}
