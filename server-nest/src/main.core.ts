import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { version } from "@/../package.json";
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

function configureSwagger() {
  return new DocumentBuilder()
    .setTitle("FDM Monster OpenAPI")
    .setDescription("FDM Monster NestJS OpenAPI description")
    .setVersion(version)
    .build();
}

export function registerGlobals(app: INestApplication) {
  // Common security policies like HSTS
  app.use(helmet());

  // Artificially slow down API calls
  // app.use(async (req: Request) => {
  //   await sleep(200);
  //   return req.next();
  // });

  // SPA cross-origin capabilities without policy
  app.enableCors();

  // API versioning capabilities
  app.setGlobalPrefix(apiPrefix, { exclude: [""] });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1"
  });

  // API DTO validation using class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: !isProduction(),
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );
}

export async function configureApp() {
  // Start NestJS factory
  const logger = createCustomLogger(logAppName);
  printPreBootMessage(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    abortOnError: true
  });

  const configService = await app.resolve(ConfigService);
  const serverPort = configService.get(portToken);

  registerGlobals(app);

  const config = configureSwagger();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(apiPrefix, app, document, {});

  // Ensures class-validator can resolve dependencies from global scope
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  return { app, port: serverPort, logger };
}
