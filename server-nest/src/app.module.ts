import { HttpException, Inject, Logger, Module, OnApplicationBootstrap, OnModuleInit } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PrinterModule } from "@/printers/printer.module";
import { UserModule } from "./users/user.module";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ExceptionsLoggerFilter } from "./shared/errors/exceptions-logger.filter";
import { HealthModule } from "./health/health.module";
import { SettingsModule } from "@/settings/settings.module";
import { OctoprintModule } from "@/octoprint/octoprint.module";
import { CoreModule } from "@/core/core.module";
import { TypeOrmConfigService } from "@/shared/typeorm-config.service";
import {
  defaultClientDist,
  defaultGithubClientOwner,
  defaultGithubClientRepo,
  defaultHttpTimeout,
  defaultJwtSecret,
  defaultServerPort,
  discordWebHookToken,
  enableClientDistAutoUpdate,
  externalHttpTimeoutKey,
  githubClientOwnerToken,
  githubClientReleaseTagToken,
  githubClientRepoToken,
  githubPatToken,
  jwtSecretToken,
  logLevelToken,
  nodeEnvToken,
  overrideClientDistToken,
  portToken,
  resetAdminPasswordToken,
  sentryDebugToken,
  sentryDsnToken,
  sentryEnabledToken,
} from "@/app.constants";
import * as Joi from "joi";
import { AdminModule } from "@/admin/admin.module";
import {
  socketIOAdminUIDefaultUsername,
  socketIOAdminUIEnabledToken,
  socketIOAdminUIPasswordBCryptToken,
  socketIOAdminUIPasswordToken,
  socketIOAdminUIUsernameToken,
} from "@/admin/admin.constants";
import { HttpModule, HttpService } from "@nestjs/axios";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { SwaggerModule } from "@nestjs/swagger";
import { AuthModule } from "@/auth/auth.module";
import { ITask } from "@/shared/interfaces/task.interface";
import { Octokit } from "octokit";
import { AppController } from "@/app.controller";
import { SafeEventEmitterModule } from "@/utils/safe-event-emitter/safe-event-emitter.module";
import { SentryInterceptor, SentryModule } from "@ntegral/nestjs-sentry";
import { errorSummary } from "@/utils/error.utils";
import { SafeScheduleModule } from "@/utils/safe-scheduler/safe-schedule.module";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useFactory: () =>
        new SentryInterceptor({
          filters: [
            {
              type: HttpException,
              filter: (exception: HttpException) => exception.getStatus() >= 400, // Only report 500 errors
            },
          ],
        }),
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionsLoggerFilter,
    },
    {
      provide: Octokit.name,
      useFactory: (configService: ConfigService) => {
        const pat = configService.get(githubPatToken);
        return new Octokit({
          auth: pat,
          request: {
            fetch: require("node-fetch"),
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: "Tasks",
      useFactory: (...tasks) => tasks,
      inject: [],
    },
  ],
  imports: [
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        dsn: cfg.get(sentryDsnToken),
        debug: !!cfg.get(sentryDebugToken),
        enabled: !!cfg.get(sentryEnabledToken),
        environment: process.env.NODE_ENV,
        release: process.env.npm_package_version,
        close: {
          enabled: true,
          // Time in milliseconds to forcefully quit the application
          timeout: 500,
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.test-e2e", ".env.development"],
      validationSchema: Joi.object({
        [nodeEnvToken]: Joi.string().valid("development", "production", "test", "test-e2e", "staging").default("development"),
        [portToken]: Joi.number().default(defaultServerPort),
        [logLevelToken]: Joi.string().valid("debug", "info", "warn", "error").optional().allow(""),
        [socketIOAdminUIEnabledToken]: Joi.boolean().default(true),
        [socketIOAdminUIUsernameToken]: Joi.string().default(socketIOAdminUIDefaultUsername),
        [socketIOAdminUIPasswordBCryptToken]: Joi.string(),
        [socketIOAdminUIPasswordToken]: Joi.string(),
        [resetAdminPasswordToken]: Joi.string().optional().allow("").min(4).max(30).default(null),
        [discordWebHookToken]: Joi.string().allow("").optional(),
        [jwtSecretToken]: Joi.string().default(defaultJwtSecret),
        [externalHttpTimeoutKey]: Joi.number().default(defaultHttpTimeout),
        [githubClientOwnerToken]: Joi.string().default(defaultGithubClientOwner),
        [githubClientRepoToken]: Joi.string().default(defaultGithubClientRepo),
        [githubClientReleaseTagToken]: Joi.string().optional().allow(""),
        [overrideClientDistToken]: Joi.string().optional().allow(""),
        [enableClientDistAutoUpdate]: Joi.boolean().default(true),
        [sentryDsnToken]: Joi.string().optional().allow(""),
        [sentryEnabledToken]: Joi.boolean().default(true),
        [sentryDebugToken]: Joi.boolean().default(false),
      }),
    }),
    CoreModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useClass: TypeOrmConfigService,
      dataSourceFactory: TypeOrmConfigService.dataSourceFactory,
    }),
    SafeScheduleModule.forRoot(),
    SafeEventEmitterModule.forRoot({
      wildcard: true,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const distFolder = configService.get(overrideClientDistToken, defaultClientDist);
        return [
          {
            exclude: ["/api*", "/media*"],
            rootPath: join(__dirname, "../..", "node_modules/@socket.io/admin-ui/ui/dist"),
            serveRoot: "/socketio",
          },
          {
            exclude: ["/api*", "/media*"],
            rootPath: join(__dirname, "../..", distFolder),
          },
        ];
      },
    }),
    AuthModule,
    SwaggerModule,
    PrinterModule,
    OctoprintModule,
    SettingsModule,
    // Support modules
    AdminModule,
    HealthModule,
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule implements OnApplicationBootstrap, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private httpService: HttpService, @Inject("Tasks") private tasks: Array<ITask>) {}

  async onModuleInit() {
    this.logger.log("----- App initiated -----");
  }

  async onApplicationBootstrap() {
    this.logger.log("----- Application bootstrap started -----");
    for (let task of this.tasks) {
      let willExecute = false;
      try {
        willExecute = await task.willExecute();
      } catch (e) {
        this.logger.warn(`Task [${task.name}] willExecute() check error, cannot execute task ${errorSummary(e)}`);
      }
      if (willExecute) {
        try {
          await task.execute();
        } catch (e) {
          this.logger.warn(`Task [${task.name}] executed with error: ${errorSummary(e)}`);
        }
      }
    }
    this.logger.log(">>>>> Application bootstrap tasks finished <<<<<");
  }
}
