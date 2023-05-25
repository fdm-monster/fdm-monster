import { Body, Controller, Post } from "@nestjs/common";
import { LoginDto } from "@/auth/dto/login.dto";
import { AuthService } from "@/auth/auth.service";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@/shared/decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
