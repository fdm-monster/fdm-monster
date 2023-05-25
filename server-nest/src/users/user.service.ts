import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import { comparePasswordHash, hashPassword } from "@/utils/crypto.utils";
import { CrudService } from "@/shared/crud.service";
import { RegisterInputDto } from "./dto/register-input.dto";
import { UpdateUserDto } from "@/users/dto/update-user.dto";
import { isProduction } from "@/utils/env.utils";
import { v4 as uuid } from "uuid";
import { defaultAdminUserName } from "@/app.constants";

@Injectable()
export class UserService extends CrudService<User, CreateUserDto, UpdateUserDto, undefined>(User) {
  private logger = new Logger(UserService.name);

  readonly randomStringGenerator = () => uuid();

  async getAdminUserId() {
    return this.findOneByUsername(defaultAdminUserName).then((user) => user?.id);
  }

  async register(registerInputDto: RegisterInputDto) {
    const entity = await this.repository.create({
      ...registerInputDto,
    });

    return await this.saveNewUser(entity, registerInputDto.password);
  }

  override async insert(createUserDto: CreateUserDto) {
    const entity = this.repository.create(createUserDto);

    const randomPassword = this.randomStringGenerator();
    if (!isProduction() || createUserDto.username.toLowerCase() === "admin") {
      this.logger.log(`Created user with random password ${randomPassword}`);
    }

    return await this.saveNewUser(entity, randomPassword);
  }

  async getAdminUser() {
    return await this.findOneByUsername("admin");
  }

  async checkPassword(userId: number, password: string) {
    const user = await this.get(userId);
    const result = comparePasswordHash(password, user.passwordHash);

    if (!result) {
      throw new UnauthorizedException();
    }

    return true;
  }

  async findOneByUsername(username: string, throwIfNotFound = true) {
    const user = await this.repository.findOneBy({
      username: username?.toLowerCase(),
    });

    if (!user && throwIfNotFound) {
      this.throwNotFound(username, "username");
    }

    return user;
  }

  async applyPasswordReset(username: string, newPassword: string) {
    const entity = await this.findOneByUsername(username);
    entity.passwordHash = hashPassword(newPassword);
    return await this.repository.save(entity);
  }

  private async saveNewUser(entity: User, password: string) {
    entity.username = entity.username?.toLowerCase() || "";
    entity.passwordHash = hashPassword(password);
    entity = this.patchEntity(entity);
    return await this.repository.save(entity);
  }

  private patchEntity(entity: User) {
    entity.username = entity.username?.toLowerCase() || "";

    return entity;
  }
}
