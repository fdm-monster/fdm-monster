import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { SettingsModule } from "@/settings/settings.module";
import { UserRole } from "@/users/entities/user-role.entity";
import { MappingProfile } from "@/users/mapping.profile";
import { UserRoleService } from "@/users/user-role.service";
import { UserRoleCache } from "@/users/user-role.cache";
import { UserUsernameIsNewRule } from "@/users/validators/username-validator.rule";
import { defaultAdminUserName, resetAdminPasswordToken } from "@/app.constants";
import { ConfigService } from "@nestjs/config";
import { Role } from "@/users/user.constants";
import { ProfileController } from "@/users/profile.controller";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "@/users/role.guard";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole]), SettingsModule],
  controllers: [UserController, ProfileController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    UserService,
    UserRoleService,
    UserRoleCache,
    MappingProfile,
    UserUsernameIsNewRule,
  ],
  exports: [UserService, UserRoleCache, UserRoleService],
})
export class UserModule implements OnModuleInit {
  private logger = new Logger(UserModule.name);
  private readonly adminUserName = defaultAdminUserName;

  constructor(private userService: UserService, private userRoleService: UserRoleService, private configService: ConfigService) {}

  async onModuleInit() {
    await this.ensureAdminUserExists();
  }

  async ensureAdminUserExists() {
    const resetPassword = this.configService.get(resetAdminPasswordToken);
    const adminUser = await this.userService.findOneByUsername(this.adminUserName, false);

    try {
      if (adminUser && !resetPassword) {
        this.logger.log("Admin user found - skipping automatic creation step");
      }

      if (adminUser) {
        const adminRoleUsers = await this.userRoleService.findByRole(Role.Admin);
        if (!adminRoleUsers?.length) {
          this.logger.warn(`Fixing admin user account with Admin role`);
          await this.userRoleService.insert({
            userId: adminUser.id,
            role: Role.Admin,
          });
        }
        return;
      } else {
        this.logger.log("Creating first admin user");
        const user = await this.userService.insert({
          username: this.adminUserName,
        });
        await this.userRoleService.insert({
          userId: user.id,
          role: Role.Admin,
        });
      }

      // The reset password must be applied separately from creating
      if (!resetPassword) {
        return;
      }

      this.logger.log(`Resetting admin user password to configuration '${resetAdminPasswordToken}'`);
      await this.userService.applyPasswordReset(this.adminUserName, resetPassword);
    } catch (e: any) {
      this.logger.warn("An error occurred when inserting the first admin user");
    }
  }
}
