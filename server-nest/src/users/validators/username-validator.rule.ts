import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";

export function UserUsernameIsNew(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: "UserUsernameIsNew",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UserUsernameIsNewRule,
    });
  };
}

@ValidatorConstraint({ name: "UserUsernameIsNewRule", async: true })
@Injectable()
export class UserUsernameIsNewRule implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async validate(value: string) {
    if (!value) return true;

    const user = await this.userRepository.findOne({
      where: {
        username: value.toLowerCase(),
      },
    });

    return !user;
  }

  defaultMessage(args: ValidationArguments) {
    return `username is already taken`;
  }
}
