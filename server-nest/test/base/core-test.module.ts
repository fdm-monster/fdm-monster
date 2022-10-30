import { CacheModule, Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AutomapperModule } from "@automapper/nestjs";
import { classes } from "@automapper/classes";
import { defaultJwtExpiry, jwtExpirySecsToken } from "@/auth/auth.config";
import * as Joi from "joi";

@Global()
@Module({
  providers: [
    // CurrentUser providers go here
  ],
  imports: [
    // OpenTel

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        [jwtExpirySecsToken]: Joi.number().default(defaultJwtExpiry)
      })
    }),
    AutomapperModule.forRoot({
      strategyInitializer: classes()
    }),
    // Redis
    CacheModule.register({
      isGlobal: true,
      ttl: 10 * 1000 // default 10 seconds
    })
  ],
  exports: [
    // CurrentUserProvider, LocalUserProvider
  ]
})
export class CoreTestModule {}
