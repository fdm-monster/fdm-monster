export class JobValidationException extends Error {
    constructor(message, taskId = null) {
        super(message);
        this.name = `JobValidationError [${taskId || "anonymous"}]`;
    }
}