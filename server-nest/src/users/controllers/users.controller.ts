import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { UsersService } from "../users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

@Controller("api/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll({});
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne({ id });
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update({ where: { id }, data: updateUserDto });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove({ id });
  }
}
