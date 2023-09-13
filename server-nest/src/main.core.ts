import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { apiPrefix, logAppName, portToken } from "@/app.constants";
import { isProduction } from "@/utils/env.utils";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { createCustomLogger } from "@/utils/logging.util";
import { NestExpressApplication } from "@nestjs/platform-express";
import { useContainer } from "class-validator";
import { printPreBootMessage } from "@/main.utils";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SentryService } from "@ntegral/nestjs-sentry";
import { errorSummary } from "@/utils/error.utils";
import * as process from "process";

console.log(process.env.VERSION);
function configureSwagger() {
  return new DocumentBuilder()
    .setTitle("FDM Monster OpenAPI")
    .setDescription("FDM Monster OpenAPI API description")
    .setVersion(process.env.VERSION || "1.0")
    .build();
}

export function registerGlobals(app: NestExpressApplication) {
  // Common security policies like HSTS
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  // SPA cross-origin capabilities without policy
  app.enableCors();

  // API versioning capabilities
  app.setGlobalPrefix(apiPrefix, { exclude: [""] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // API DTO validation using class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: !isProduction(),
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );
}

export async function configureApp() {
  // Start NestJS factory
  const logger = createCustomLogger(logAppName);
  printPreBootMessage(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    abortOnError: true,
  }).catch((e) => {
    logger.error(`NestFactory create failed ${errorSummary(e)}`);
    throw e;
  });

  app.enableShutdownHooks();
  const sentry = await app.resolve(SentryService);
  process.on("unhandledRejection", (e: Error) => {
    const message = `Unhandled rejection error - ${errorSummary(e)}`;
    logger.error(message);

    // The server must not crash
    sentry.instance().captureException(e);
  });

  const emitter = await app.resolve(EventEmitter2);
  emitter.on("error", (e) => {
    const summary = e.message ? `${e.message} ${e.stack}` : `'${e}'`;
    logger.error(`Emitter2 error caught for event '${this.event}' - ${summary}`);
    sentry.instance().captureException(e);
  });

  const configService = await app.resolve(ConfigService);
  const serverPort = configService.get(portToken);

  registerGlobals(app);

  const config = configureSwagger();
  const document = SwaggerModule.createDocument(app, config, {
    // operationIdFactory: (controllerKey: string, methodKey: string) => `${methodKey}`,
  });
  SwaggerModule.setup(apiPrefix, app, document);

  // Ensures class-validator can resolve dependencies from global scope
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  return { app, port: serverPort, logger };
}
