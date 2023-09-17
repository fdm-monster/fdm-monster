export class JobValidationException extends Error {
  constructor(message, taskId) {
    super(message);
    this.name = `JobValidationError [${taskId || "anonymous"}]`;
  }
}
