import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { ExternalHttpError } from "@/shared/errors/external-http.error";

@Catch()
export class ExceptionsLoggerFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(ExceptionsLoggerFilter.name);

  catch(exception: ExternalHttpError | HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse();
    if (exception instanceof ExternalHttpError) {
      this.logger.warn(`External Http Error occurred (${exception.getStatus() || "No status code"}) - ${exception.toString()}`);
      response.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      response.send({
        message: exception.message,
        name: exception.name,
        url: request.url,
        stack: exception.stack,
        method: request.method,
      });
    } else if (exception instanceof HttpException) {
      this.logger.warn(`Http Error is being returned (${exception.getStatus()}) - ${JSON.stringify(exception.getResponse())}`);
    } else {
      this.logger.warn(`Exception occurred ${request.method} ${request.url} ${exception}`);
      // Safe split the stack to reduce noise
      let stack;
      try {
        const splitStack = exception.stack.split("\n");
        stack = splitStack.slice(0, 6);
        if (splitStack.length > stack.length) stack.push("... truncated");
      } catch (_) {
        stack = "could not produce";
      }
      response.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      response.send({
        message: exception?.message,
        name: exception?.name,
        stack,
        url: request.url,
        method: request.method,
      });
    }
    super.catch(exception, host);
  }
}
