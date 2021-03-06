import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import {FindOptionsWhere, ObjectID, Repository} from "typeorm";
import { User } from "../entities/user.entity";
import { RegisterInputDto } from "../dto/register-input.dto";
import { GroupEnum } from "../types/group.enum";
import { ValidationException } from "../../providers/validation.exception";
import { hashPassword } from "../../utils/crypto.util";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  async register(registerInputDto: RegisterInputDto): Promise<void> {
    delete registerInputDto.password2;
    return await this.create({
      ...registerInputDto,
      group: GroupEnum.User
    });
  }

  async create(createUserDto: CreateUserDto): Promise<void> {
    await this.assertUsernameAvailable(createUserDto.username);

    const passwordHash = hashPassword(createUserDto.password);
    delete createUserDto.password;

    const user = new User({
      ...createUserDto,
      passwordHash
    });
    await user.validate();
    await this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    const passwordHash = hashPassword(updateUserDto.password);
    delete updateUserDto.password;
    const user = new User({
      ...updateUserDto,
      passwordHash
    });
    await user.validate();

    // Good luck if username already exists
    await this.usersRepository.update(id, user);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async assertUsernameAvailable(username: string) {
    const shouldBeNull = await this.findOne({
      username: username
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

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({});
  }

  async findOne(conditions: FindOptionsWhere<User>): Promise<User> {
    return await this.usersRepository.findOne({ where: conditions });
  }

  async findById(id: ObjectID): Promise<User> {
    return await this.usersRepository.findOne({
      where: {
        id
      }
    });
  }

  async getUserCount() {
    return await this.usersRepository.findAndCount();
  }
}
