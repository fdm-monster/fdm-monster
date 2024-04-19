export class FailedDependencyException extends Error {
  serviceCode?: number;
  constructor(message: string, serviceCode?: number) {
    super(message);
    this.name = FailedDependencyException.name;
    this.serviceCode = serviceCode;
  }
}
