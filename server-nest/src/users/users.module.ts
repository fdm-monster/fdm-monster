import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./controllers/users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UsersMvcController } from "./controllers/users-mvc.controller";
import { SettingsModule } from "@/settings/settings.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), SettingsModule],
  controllers: [UsersController, UsersMvcController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
