import { Logger, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "@/users/user.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthConfig } from "./auth.config";
import { SettingsModule } from "@/settings/settings.module";
import { JwtModule } from "@nestjs/jwt";
import { jwtSecretToken } from "@/app.constants";
import { AuthController } from "@/auth/auth.controller";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "@/auth/auth.guard";

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    AuthService,
  ],
  imports: [
    PassportModule,
    ConfigModule.forFeature(AuthConfig),
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>(jwtSecretToken),
        signOptions: {},
      }),
      inject: [ConfigService],
    }),
    SettingsModule,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {
  private logger = new Logger(AuthModule.name);

  constructor() {}
}
