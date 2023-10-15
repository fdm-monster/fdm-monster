export class JobValidationException extends Error {
  constructor(message: string, taskId: string) {
    super(message);
    this.name = `JobValidationError [${taskId || "anonymous"}]`;
  }
}
