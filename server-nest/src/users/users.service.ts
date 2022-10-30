import { Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "@/services/prisma.service";
import { ValidationException } from "@/core/providers/validation.exception";
import { CreateUserDto } from "@/users/dto/create-user.dto";
import { hashPassword } from "@/utils/crypto.util";
import { RegisterInputDto } from "@/users/dto/register-input.dto";
import { GroupEnum } from "@/users/models/group.enum";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    });
  }

  async register(registerInputDto: RegisterInputDto) {
    delete registerInputDto.password2;
    return await this.create({
      ...registerInputDto,
      group: GroupEnum.User
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.assertUsernameAvailable(createUserDto.username);

    const passwordHash = hashPassword(createUserDto.password);
    delete createUserDto.password;

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        passwordHash
      }
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where
    });
  }

  async remove(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where
    });
  }

  async getUserCount() {
    return await this.prisma.user.count();
  }

  private async assertUsernameAvailable(username: string) {
    const shouldBeNull = await this.findOne({
      username
    });
    if (!!shouldBeNull) {
      throw new ValidationException([
        {
          property: "username",
          constraints: {
            mustBeUnique: "username is already taken"
          }
        }
      ]);
    }
  }
}
