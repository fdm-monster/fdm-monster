import { configureApp } from "@/main.core";
import { printPostBootMessage } from "@/main.utils";
import * as sentry from "@sentry/node";
import { errorSummary } from "@/utils/error.utils";

export async function bootstrap() {
  try {
    console.log(`Loading server in \'${process.env.NODE_ENV}\' environment`);
    const { app, port, logger } = await configureApp();
    logger.log(`Starting server at port ${port}`);
    await app.listen(port, () => {
      printPostBootMessage(logger);
    });
  } catch (e) {
    console.error(`Failed to initialize due to error ${errorSummary(e)}`);
    sentry.captureException(e);
    await sentry.flush(0);
    process.exit(1);
  }
}

bootstrap();
