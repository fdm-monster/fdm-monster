import { configureApp } from "@/main.core";
import { printPostBootMessage } from "@/main.utils";

export async function bootstrap() {
  const { app, port, logger } = await configureApp();

  logger.log(`Starting server at port ${port}`);
  await app.listen(port, () => {
    printPostBootMessage(logger);
  });
}

console.log(`Loading server in \'${process.env.NODE_ENV}\' environment`);
bootstrap();
